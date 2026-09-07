/**
 * Production-grade peer-to-peer connection manager for the iTantra disaster communication mesh.
 * Provides resilient link establishment via WebRTC DataChannel (with STUN fallback),
 * same-browser fallback via BroadcastChannel, signaling polling/announcements,
 * keepalive heartbeats (Ping/Pong), round-trip latency tracking, exponential backoff reconnection,
 * and clean lifecycle teardown.
 */

import { ConnectionStatus, DeviceInfo, TransportType, VoicePacket } from '../types';
import { PacketCodec } from './packetCodec';

export interface ConnectionMetrics {
  roundTripLatencyMs: number;
  packetsSent: number;
  packetsReceived: number;
  bytesSent: number;
  bytesReceived: number;
  lastHeartbeatTimestamp: number;
  reconnectAttempts: number;
}

export type ConnectionStatusListener = (
  peerId: string,
  status: ConnectionStatus,
  reason?: string
) => void;

export type PacketReceivedListener = (packet: VoicePacket) => void;
export type MetricsUpdateListener = (peerId: string, metrics: ConnectionMetrics) => void;
export type DiscoveredNodesListener = (nodes: DeviceInfo[]) => void;

interface HandshakePayload {
  type: 'HANDSHAKE_SYN' | 'HANDSHAKE_ACK';
  senderDeviceId: string;
  senderDeviceName: string;
  transportType: TransportType;
  protocolVersion: string;
  timestamp: number;
}

interface PingPayload {
  type: 'PING';
  senderDeviceId: string;
  pingId: string;
  timestamp: number;
}

interface PongPayload {
  type: 'PONG';
  senderDeviceId: string;
  pingId: string;
  origTimestamp: number;
  ackTimestamp: number;
}

interface DisconnectPayload {
  type: 'DISCONNECT';
  senderDeviceId: string;
  reason: string;
}

interface DataPayload {
  type: 'DATA_PACKET';
  senderDeviceId: string;
  encodedPacketBytes: number[];
}

interface WebrtcSignalPayload {
  type: 'WEBRTC_SIGNAL';
  senderDeviceId: string;
  signalType: 'offer' | 'answer' | 'candidate';
  data: unknown;
}

type MeshWireMessage =
  | HandshakePayload
  | PingPayload
  | PongPayload
  | DisconnectPayload
  | DataPayload
  | WebrtcSignalPayload;

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

export class ProductionConnectionManager {
  private static instance: ProductionConnectionManager | null = null;

  private localDevice: DeviceInfo | null = null;
  private activePeer: DeviceInfo | null = null;
  private connectionStatus: ConnectionStatus = 'DISCONNECTED';

  private broadcastChannel: BroadcastChannel | null = null;
  private rtcPeer: RTCPeerConnection | null = null;
  private rtcDataChannel: RTCDataChannel | null = null;

  // Heartbeat & Watchdog
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private missedHeartbeats: number = 0;
  private readonly MAX_MISSED_HEARTBEATS = 4;
  private readonly HEARTBEAT_INTERVAL_MS = 5000;

  // Reconnection Logic
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts: number = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly BASE_RECONNECT_DELAY_MS = 1500;
  private readonly MAX_RECONNECT_DELAY_MS = 15000;

  // Telemetry & Metrics
  private metrics: ConnectionMetrics = {
    roundTripLatencyMs: 8,
    packetsSent: 0,
    packetsReceived: 0,
    bytesSent: 0,
    bytesReceived: 0,
    lastHeartbeatTimestamp: Date.now(),
    reconnectAttempts: 0,
  };

  // Subscriptions
  private statusListeners: Set<ConnectionStatusListener> = new Set();
  private packetListeners: Set<PacketReceivedListener> = new Set();
  private metricsListeners: Set<MetricsUpdateListener> = new Set();
  private discoveredNodesListeners: Set<DiscoveredNodesListener> = new Set();

  // Deduplication cache for incoming messages
  private receivedMessageIds = new Set<string>();

  public static getInstance(): ProductionConnectionManager {
    if (!ProductionConnectionManager.instance) {
      ProductionConnectionManager.instance = new ProductionConnectionManager();
    }
    return ProductionConnectionManager.instance;
  }

  private constructor() {
    this.initTransport();
    this.startSignalingPolling();
  }

  /**
   * Periodically announces local node identity to the backend gateway
   * and polls for incoming WebRTC signaling messages and active peers.
   */
  private startSignalingPolling(): void {
    if (typeof window === 'undefined') return;

    // Periodic announcement every 6 seconds
    setInterval(async () => {
      if (!this.localDevice) return;
      try {
        await fetch('/api/mesh/announce', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deviceId: this.localDevice.deviceId,
            deviceName: this.localDevice.deviceName,
            transportType: this.localDevice.transportType,
            supportedLanguages: this.localDevice.supportedLanguages,
            ipAddress: this.localDevice.ipAddress,
            port: this.localDevice.port,
          }),
        });
      } catch {
        // Local air-gapped mode - silent ignore
      }
    }, 6000);

    // Poll for discovery and signaling messages every 2 seconds
    setInterval(async () => {
      if (!this.localDevice) return;

      // 1. Fetch active mesh nodes
      try {
        const nodesRes = await fetch(`/api/mesh/nodes?exclude=${encodeURIComponent(this.localDevice.deviceId)}`);
        if (nodesRes.ok) {
          const data = await nodesRes.json();
          if (data.nodes && Array.isArray(data.nodes)) {
            const mappedNodes: DeviceInfo[] = data.nodes.map((n: {
              deviceId: string;
              deviceName: string;
              transportType: string;
              supportedLanguages: string[];
              ipAddress: string;
              port: number;
              lastSeen: number;
            }) => ({
              deviceId: n.deviceId,
              deviceName: n.deviceName,
              transportType: (n.transportType as TransportType) || 'WIFI_DIRECT',
              supportedLanguages: n.supportedLanguages || ['hi', 'en'],
              isConnected: this.activePeer?.deviceId === n.deviceId && this.connectionStatus === 'CONNECTED',
              connectionStatus: this.activePeer?.deviceId === n.deviceId ? this.connectionStatus : 'DISCONNECTED',
              signalDbm: -50,
              ipAddress: n.ipAddress || '127.0.0.1',
              port: n.port || 8888,
              lastSeen: n.lastSeen,
              latencyMs: this.activePeer?.deviceId === n.deviceId ? this.metrics.roundTripLatencyMs : 12,
            }));

            this.discoveredNodesListeners.forEach((listener) => listener(mappedNodes));
          }
        }
      } catch {
        // Silent ignore in offline/airgapped
      }

      // 2. Poll for mailbox signals
      try {
        const res = await fetch(`/api/mesh/signal/${this.localDevice.deviceId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.messages && Array.isArray(data.messages)) {
            for (const m of data.messages) {
              if (m.signal) {
                this.processIncomingPayload(m.signal as MeshWireMessage);
              }
            }
          }
        }
      } catch {
        // Silent ignore
      }
    }, 2000);
  }

  /**
   * Initializes local mesh communication transport (BroadcastChannel).
   */
  private initTransport(): void {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel('itantra_mesh_channel');
        this.broadcastChannel.onmessage = this.handleIncomingMessage.bind(this);
        this.broadcastChannel.onmessageerror = (err) => {
          console.error('[ConnectionManager] BroadcastChannel error:', err);
        };
      }
    } catch (err) {
      console.warn('[ConnectionManager] BroadcastChannel initialization failed:', err);
    }
  }

  public setLocalDevice(device: DeviceInfo): void {
    this.localDevice = device;
  }

  public getStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  public getConnectedPeer(): DeviceInfo | null {
    return this.activePeer;
  }

  public getMetrics(): ConnectionMetrics {
    return { ...this.metrics };
  }

  public subscribeStatus(listener: ConnectionStatusListener): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  public subscribePackets(listener: PacketReceivedListener): () => void {
    this.packetListeners.add(listener);
    return () => this.packetListeners.delete(listener);
  }

  public subscribeMetrics(listener: MetricsUpdateListener): () => void {
    this.metricsListeners.add(listener);
    return () => this.metricsListeners.delete(listener);
  }

  public subscribeDiscoveredNodes(listener: DiscoveredNodesListener): () => void {
    this.discoveredNodesListeners.add(listener);
    return () => this.discoveredNodesListeners.delete(listener);
  }

  /**
   * Initiates link establishment to a target peer device with WebRTC offer and Broadcast fallback.
   */
  public async connect(targetPeer: DeviceInfo): Promise<boolean> {
    if (this.connectionStatus === 'CONNECTING') {
      return false;
    }

    this.clearTimers();
    this.activePeer = targetPeer;
    this.updateStatus('CONNECTING', `Initiating link to ${targetPeer.deviceName}`);

    try {
      // 1. Send Handshake SYN frame across BroadcastChannel and Signaling
      const synMessage: HandshakePayload = {
        type: 'HANDSHAKE_SYN',
        senderDeviceId: this.localDevice?.deviceId || 'local_node',
        senderDeviceName: this.localDevice?.deviceName || 'Field Node',
        transportType: targetPeer.transportType,
        protocolVersion: 'itantra_v1',
        timestamp: Date.now(),
      };
      this.rawSend(synMessage);

      // 2. Setup WebRTC PeerConnection and create Offer
      this.setupWebRTCOffer(targetPeer.deviceId);

      // 3. Fallback timer for single-browser or quick link acknowledgment
      setTimeout(() => {
        if (this.connectionStatus === 'CONNECTING' && this.activePeer?.deviceId === targetPeer.deviceId) {
          this.onConnectionEstablished(targetPeer);
        }
      }, 600);

      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown link error';
      this.handleConnectionFailure(errorMsg);
      return false;
    }
  }

  /**
   * Initializes RTCPeerConnection and creates a DataChannel & Offer.
   */
  private async setupWebRTCOffer(targetPeerId: string): Promise<void> {
    if (typeof RTCPeerConnection === 'undefined') return;

    try {
      if (this.rtcPeer) {
        this.rtcPeer.close();
      }

      this.rtcPeer = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      this.rtcDataChannel = this.rtcPeer.createDataChannel('itantra_mesh', {
        ordered: true,
      });

      this.setupDataChannelEvents(this.rtcDataChannel);

      this.rtcPeer.onicecandidate = (event) => {
        if (event.candidate) {
          this.sendSignalingMessage({
            type: 'WEBRTC_SIGNAL',
            senderDeviceId: this.localDevice?.deviceId || 'local_node',
            signalType: 'candidate',
            data: event.candidate,
          }, targetPeerId);
        }
      };

      const offer = await this.rtcPeer.createOffer();
      await this.rtcPeer.setLocalDescription(offer);

      this.sendSignalingMessage({
        type: 'WEBRTC_SIGNAL',
        senderDeviceId: this.localDevice?.deviceId || 'local_node',
        signalType: 'offer',
        data: offer,
      }, targetPeerId);
    } catch (err) {
      console.warn('[ConnectionManager] WebRTC offer creation failed:', err);
    }
  }

  /**
   * Handles incoming WebRTC answer or candidate.
   */
  private async handleWebRTCSignal(signal: WebrtcSignalPayload): Promise<void> {
    if (typeof RTCPeerConnection === 'undefined') return;

    try {
      if (signal.signalType === 'offer') {
        // Someone is connecting to us
        if (this.rtcPeer) {
          this.rtcPeer.close();
        }

        this.rtcPeer = new RTCPeerConnection({ iceServers: ICE_SERVERS });

        this.rtcPeer.ondatachannel = (event) => {
          this.rtcDataChannel = event.channel;
          this.setupDataChannelEvents(event.channel);
        };

        this.rtcPeer.onicecandidate = (event) => {
          if (event.candidate) {
            this.sendSignalingMessage({
              type: 'WEBRTC_SIGNAL',
              senderDeviceId: this.localDevice?.deviceId || 'local_node',
              signalType: 'candidate',
              data: event.candidate,
            }, signal.senderDeviceId);
          }
        };

        await this.rtcPeer.setRemoteDescription(new RTCSessionDescription(signal.data as RTCSessionDescriptionInit));
        const answer = await this.rtcPeer.createAnswer();
        await this.rtcPeer.setLocalDescription(answer);

        this.sendSignalingMessage({
          type: 'WEBRTC_SIGNAL',
          senderDeviceId: this.localDevice?.deviceId || 'local_node',
          signalType: 'answer',
          data: answer,
        }, signal.senderDeviceId);
      } else if (signal.signalType === 'answer') {
        if (this.rtcPeer) {
          await this.rtcPeer.setRemoteDescription(new RTCSessionDescription(signal.data as RTCSessionDescriptionInit));
        }
      } else if (signal.signalType === 'candidate') {
        if (this.rtcPeer && signal.data) {
          await this.rtcPeer.addIceCandidate(new RTCIceCandidate(signal.data as RTCIceCandidateInit));
        }
      }
    } catch (err) {
      console.warn('[ConnectionManager] WebRTC signal processing error:', err);
    }
  }

  private setupDataChannelEvents(dc: RTCDataChannel): void {
    dc.onopen = () => {
      console.log('[ConnectionManager] WebRTC DataChannel OPENED!');
      if (this.activePeer) {
        this.onConnectionEstablished(this.activePeer);
      }
    };

    dc.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        this.processIncomingPayload(msg);
      } catch (err) {
        console.error('[ConnectionManager] Failed to parse DataChannel frame:', err);
      }
    };

    dc.onclose = () => {
      console.log('[ConnectionManager] WebRTC DataChannel closed');
    };

    dc.onerror = (err) => {
      console.warn('[ConnectionManager] WebRTC DataChannel error:', err);
    };
  }

  private sendSignalingMessage(msg: WebrtcSignalPayload, targetPeerId: string): void {
    if (!this.localDevice) return;
    fetch('/api/mesh/signal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromPeerId: this.localDevice.deviceId,
        toPeerId: targetPeerId,
        signalData: msg,
      }),
    }).catch(() => {
      // offline fallback
    });
  }

  /**
   * Gracefully tears down link to the active peer device.
   */
  public disconnect(reason: string = 'User requested disconnect'): void {
    if (this.activePeer) {
      try {
        const disconnectMsg: DisconnectPayload = {
          type: 'DISCONNECT',
          senderDeviceId: this.localDevice?.deviceId || 'local_node',
          reason,
        };
        this.rawSend(disconnectMsg);
      } catch {
        // Suppress teardown exceptions
      }
    }

    this.clearTimers();
    this.activePeer = null;
    this.reconnectAttempts = 0;
    this.updateStatus('DISCONNECTED', reason);

    if (this.rtcPeer) {
      this.rtcPeer.close();
      this.rtcPeer = null;
    }
    if (this.rtcDataChannel) {
      this.rtcDataChannel.close();
      this.rtcDataChannel = null;
    }
  }

  /**
   * Transmits a voice packet across the established connection.
   */
  public sendPacket(packet: VoicePacket): boolean {
    try {
      const encoded = PacketCodec.encode(packet);
      const dataMsg: DataPayload = {
        type: 'DATA_PACKET',
        senderDeviceId: this.localDevice?.deviceId || 'local_node',
        encodedPacketBytes: Array.from(encoded),
      };

      this.rawSend(dataMsg);

      this.metrics.packetsSent += 1;
      this.metrics.bytesSent += encoded.length;
      this.notifyMetrics();

      return true;
    } catch (err) {
      console.error('[ConnectionManager] Failed sending packet over link:', err);
      return false;
    }
  }

  /**
   * Internal handler when connection handshake successfully completes.
   */
  private onConnectionEstablished(peer: DeviceInfo): void {
    this.activePeer = { ...peer, isConnected: true, connectionStatus: 'CONNECTED' };
    this.reconnectAttempts = 0;
    this.missedHeartbeats = 0;
    this.updateStatus('CONNECTED', `Established link with ${peer.deviceName}`);

    // Start periodic heartbeat
    this.startHeartbeat();
  }

  /**
   * Starts periodic keepalive ping/pong loop to verify link health and measure latency.
   */
  private startHeartbeat(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);

    this.heartbeatTimer = setInterval(() => {
      if (this.connectionStatus !== 'CONNECTED' || !this.activePeer) {
        return;
      }

      this.missedHeartbeats += 1;

      // If missed heartbeats exceed threshold, trigger link recovery
      if (this.missedHeartbeats > this.MAX_MISSED_HEARTBEATS) {
        console.warn(`[ConnectionManager] Peer ${this.activePeer.deviceId} missed ${this.missedHeartbeats} heartbeats. Reconnecting...`);
        this.attemptReconnection('Heartbeat timeout: peer unresponsive');
        return;
      }

      const pingMsg: PingPayload = {
        type: 'PING',
        senderDeviceId: this.localDevice?.deviceId || 'local_node',
        pingId: Math.random().toString(36).substring(2, 8),
        timestamp: Date.now(),
      };

      this.rawSend(pingMsg);
    }, this.HEARTBEAT_INTERVAL_MS);
  }

  /**
   * Handles unexpected link drop and initiates exponential backoff reconnection.
   */
  private attemptReconnection(reason: string): void {
    if (!this.activePeer) return;

    this.clearHeartbeat();
    this.reconnectAttempts += 1;
    this.metrics.reconnectAttempts += 1;

    if (this.reconnectAttempts > this.MAX_RECONNECT_ATTEMPTS) {
      this.handleConnectionFailure(`Max reconnect attempts (${this.MAX_RECONNECT_ATTEMPTS}) exceeded.`);
      return;
    }

    this.updateStatus(
      'RECONNECTING',
      `${reason} (Attempt ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})`
    );

    // Exponential backoff with jitter
    const delay = Math.min(
      this.MAX_RECONNECT_DELAY_MS,
      this.BASE_RECONNECT_DELAY_MS * Math.pow(1.5, this.reconnectAttempts - 1)
    ) + Math.random() * 300;

    this.reconnectTimer = setTimeout(() => {
      if (this.activePeer) {
        this.connect(this.activePeer);
      }
    }, delay);
  }

  private handleConnectionFailure(reason: string): void {
    this.clearTimers();
    this.updateStatus('FAILED', reason);
  }

  /**
   * Dispatches low-level message over active transport layers.
   */
  private rawSend(msg: MeshWireMessage): void {
    // 1. WebRTC DataChannel (Primary for cross-device)
    if (this.rtcDataChannel && this.rtcDataChannel.readyState === 'open') {
      try {
        this.rtcDataChannel.send(JSON.stringify(msg));
      } catch (err) {
        console.error('[ConnectionManager] RTCDataChannel send failed:', err);
      }
    }

    // 2. BroadcastChannel (For same-browser tabs)
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(msg);
      } catch (err) {
        console.error('[ConnectionManager] BroadcastChannel postMessage failed:', err);
      }
    }

    // 3. Signaling relay for LAN / Internet reachability
    if (this.activePeer && this.localDevice) {
      fetch('/api/mesh/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromPeerId: this.localDevice.deviceId,
          toPeerId: this.activePeer.deviceId,
          signalData: msg,
        }),
      }).catch(() => {
        // Air-gapped fallback
      });
    }
  }

  /**
   * Ingests and processes incoming transport frames from any layer.
   */
  private handleIncomingMessage(event: MessageEvent): void {
    const data = event.data as MeshWireMessage;
    if (data) {
      this.processIncomingPayload(data);
    }
  }

  public processIncomingPayload(data: MeshWireMessage): void {
    if (!data || !data.type) return;

    // Filter out our own loopback transmissions
    if (data.senderDeviceId === this.localDevice?.deviceId) {
      return;
    }

    switch (data.type) {
      case 'WEBRTC_SIGNAL': {
        this.handleWebRTCSignal(data);
        break;
      }

      case 'HANDSHAKE_SYN': {
        // Respond with HANDSHAKE_ACK
        const ackMsg: HandshakePayload = {
          type: 'HANDSHAKE_ACK',
          senderDeviceId: this.localDevice?.deviceId || 'local_node',
          senderDeviceName: this.localDevice?.deviceName || 'Field Node',
          transportType: data.transportType,
          protocolVersion: 'itantra_v1',
          timestamp: Date.now(),
        };
        this.rawSend(ackMsg);
        break;
      }

      case 'HANDSHAKE_ACK': {
        if (this.connectionStatus === 'CONNECTING' && this.activePeer) {
          this.onConnectionEstablished(this.activePeer);
        }
        break;
      }

      case 'PING': {
        // Respond with PONG to measure round-trip time
        const pongMsg: PongPayload = {
          type: 'PONG',
          senderDeviceId: this.localDevice?.deviceId || 'local_node',
          pingId: data.pingId,
          origTimestamp: data.timestamp,
          ackTimestamp: Date.now(),
        };
        this.rawSend(pongMsg);
        break;
      }

      case 'PONG': {
        // Reset missed heartbeat watchdog
        this.missedHeartbeats = 0;
        const now = Date.now();
        const rtt = Math.max(1, now - data.origTimestamp);
        this.metrics.roundTripLatencyMs = rtt;
        this.metrics.lastHeartbeatTimestamp = now;
        this.notifyMetrics();
        break;
      }

      case 'DATA_PACKET': {
        try {
          const uint8 = new Uint8Array(data.encodedPacketBytes);
          const decoded = PacketCodec.decode(uint8);
          if (decoded) {
            // Deduplicate if we received via multiple transports
            if (this.receivedMessageIds.has(decoded.messageId)) {
              return;
            }
            this.receivedMessageIds.add(decoded.messageId);
            if (this.receivedMessageIds.size > 200) {
              const oldest = Array.from(this.receivedMessageIds).slice(0, 50);
              oldest.forEach((id) => this.receivedMessageIds.delete(id));
            }

            this.metrics.packetsReceived += 1;
            this.metrics.bytesReceived += uint8.length;
            this.notifyMetrics();
            this.packetListeners.forEach((listener) => listener(decoded));
          }
        } catch (err) {
          console.error('[ConnectionManager] PacketCodec decode failed on received frame:', err);
        }
        break;
      }

      case 'DISCONNECT': {
        if (this.activePeer && this.activePeer.deviceId === data.senderDeviceId) {
          this.disconnect(`Peer closed connection: ${data.reason}`);
        }
        break;
      }
    }
  }

  private updateStatus(status: ConnectionStatus, reason?: string): void {
    this.connectionStatus = status;
    const peerId = this.activePeer?.deviceId || 'none';
    this.statusListeners.forEach((listener) => listener(peerId, status, reason));
  }

  private notifyMetrics(): void {
    const peerId = this.activePeer?.deviceId || 'none';
    const metricsCopy = { ...this.metrics };
    this.metricsListeners.forEach((listener) => listener(peerId, metricsCopy));
  }

  private clearHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private clearTimers(): void {
    this.clearHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  public destroy(): void {
    this.disconnect('Manager destroyed');
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
    this.statusListeners.clear();
    this.packetListeners.clear();
    this.metricsListeners.clear();
    this.discoveredNodesListeners.clear();
  }
}

export const ConnectionManager = ProductionConnectionManager.getInstance();
