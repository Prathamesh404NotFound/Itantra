import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  set,
  update,
  remove,
  onValue,
  onChildAdded,
  onDisconnect,
  serverTimestamp,
  Database,
  Unsubscribe,
} from 'firebase/database';
import { DeviceInfo, VoicePacket, TransportType, LanguageCode } from '../types';

export const firebaseConfig = {
  apiKey: "AIzaSyDooWEYNwH6j5lOBzBU6kheaQPjjvARx5A",
  authDomain: "fir-5cfd8.firebaseapp.com",
  databaseURL: "https://fir-5cfd8-default-rtdb.firebaseio.com",
  projectId: "fir-5cfd8",
  storageBucket: "fir-5cfd8.firebasestorage.app",
  messagingSenderId: "849483564406",
  appId: "1:849483564406:web:3f07d43157558949976657",
  measurementId: "G-G652NETC9K"
};

class FirebaseRealtimeMeshService {
  private static instance: FirebaseRealtimeMeshService | null = null;
  private app: FirebaseApp | null = null;
  private db: Database | null = null;
  private isConnectedToRtdb: boolean = false;
  private activeDeviceRef: ReturnType<typeof ref> | null = null;

  public static getInstance(): FirebaseRealtimeMeshService {
    if (!FirebaseRealtimeMeshService.instance) {
      FirebaseRealtimeMeshService.instance = new FirebaseRealtimeMeshService();
    }
    return FirebaseRealtimeMeshService.instance;
  }

  constructor() {
    this.init();
  }

  private init(): void {
    if (typeof window === 'undefined') return;
    try {
      if (getApps().length === 0) {
        this.app = initializeApp(firebaseConfig);
      } else {
        this.app = getApp();
      }
      this.db = getDatabase(this.app);

      // Listen to special .info/connected path
      const connectedRef = ref(this.db, '.info/connected');
      onValue(connectedRef, (snap) => {
        this.isConnectedToRtdb = Boolean(snap.val());
        console.log(`[FirebaseService] RTDB Connection status: ${this.isConnectedToRtdb ? 'ONLINE' : 'OFFLINE'}`);
      });
    } catch (err) {
      console.warn('[FirebaseService] Firebase initialization failed:', err);
    }
  }

  public isAvailable(): boolean {
    return Boolean(this.db);
  }

  public getConnectedStatus(): boolean {
    return this.isConnectedToRtdb;
  }

  /**
   * Uploads and registers the local device identity and maintains an onDisconnect presence.
   */
  public async publishDevice(device: DeviceInfo): Promise<void> {
    if (!this.db || !device.deviceId) return;

    try {
      const deviceRef = ref(this.db, `devices/${device.deviceId}`);
      this.activeDeviceRef = deviceRef;

      const payload = {
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        transportType: device.transportType,
        supportedLanguages: device.supportedLanguages,
        isConnected: true,
        connectionStatus: 'CONNECTED',
        signalDbm: device.signalDbm || -45,
        ipAddress: device.ipAddress || '127.0.0.1',
        port: device.port || 8888,
        lastSeen: Date.now(),
        latencyMs: device.latencyMs || 8,
      };

      await set(deviceRef, payload);

      // Set onDisconnect handler to mark node offline when closed
      await onDisconnect(deviceRef).update({
        isConnected: false,
        connectionStatus: 'DISCONNECTED',
        lastSeen: serverTimestamp(),
      });
    } catch (err) {
      console.warn('[FirebaseService] Failed publishing device to Firebase RTDB:', err);
    }
  }

  /**
   * Listens for all device nodes registered on Firebase Realtime Database.
   */
  public subscribeToDevices(
    excludeDeviceId: string,
    onDevices: (devices: DeviceInfo[]) => void
  ): Unsubscribe | null {
    if (!this.db) return null;

    try {
      const devicesCollectionRef = ref(this.db, 'devices');
      return onValue(devicesCollectionRef, (snapshot) => {
        const val = snapshot.val();
        if (!val) {
          onDevices([]);
          return;
        }

        const nodes: DeviceInfo[] = Object.values(val)
          .filter((d: unknown): d is Record<string, unknown> => typeof d === 'object' && d !== null && 'deviceId' in d)
          .filter((d) => d.deviceId !== excludeDeviceId)
          .map((d) => ({
            deviceId: String(d.deviceId),
            deviceName: String(d.deviceName || 'Mesh Device'),
            transportType: (d.transportType as TransportType) || 'WIFI_DIRECT',
            supportedLanguages: (Array.isArray(d.supportedLanguages) ? (d.supportedLanguages as LanguageCode[]) : ['mr', 'hi', 'en']),
            isConnected: Boolean(d.isConnected),
            connectionStatus: (d.connectionStatus as DeviceInfo['connectionStatus']) || (d.isConnected ? 'CONNECTED' : 'DISCONNECTED'),
            signalDbm: typeof d.signalDbm === 'number' ? d.signalDbm : -50,
            ipAddress: typeof d.ipAddress === 'string' ? d.ipAddress : '127.0.0.1',
            port: typeof d.port === 'number' ? d.port : 8888,
            lastSeen: typeof d.lastSeen === 'number' ? d.lastSeen : Date.now(),
            latencyMs: typeof d.latencyMs === 'number' ? d.latencyMs : 8,
          }));

        onDevices(nodes);
      }, (error) => {
        console.warn('[FirebaseService] Device subscribe error:', error);
      });
    } catch (err) {
      console.warn('[FirebaseService] subscribeToDevices error:', err);
      return null;
    }
  }

  /**
   * Uploads a message packet to Firebase Realtime Database (/messages/{messageId}).
   */
  public async publishMessage(packet: VoicePacket): Promise<boolean> {
    if (!this.db || !packet.messageId) return false;

    try {
      const msgRef = ref(this.db, `messages/${packet.messageId}`);
      const cleanPacket: Record<string, unknown> = {
        messageId: packet.messageId,
        senderDeviceId: packet.senderDeviceId,
        receiverDeviceId: packet.receiverDeviceId || 'broadcast_mesh',
        sequenceNumber: packet.sequenceNumber,
        sourceLanguage: packet.sourceLanguage,
        targetLanguage: packet.targetLanguage,
        priority: packet.priority,
        timestamp: packet.timestamp || Date.now(),
        textPayload: packet.textPayload,
        translatedText: packet.translatedText || packet.textPayload,
        checksum: packet.checksum || 0,
        deliveryState: 'DELIVERED',
        packetSizeBytes: packet.packetSizeBytes || packet.textPayload.length + 36,
        latencyMs: packet.latencyMs || 0,
        hasRealVoiceAudio: Boolean(packet.hasRealVoiceAudio),
      };

      await set(msgRef, cleanPacket);
      return true;
    } catch (err) {
      console.warn('[FirebaseService] Failed publishing message to Firebase RTDB:', err);
      return false;
    }
  }

  /**
   * Subscribes to real-time incoming messages from Firebase Realtime Database.
   */
  public subscribeToMessages(
    localDeviceId: string,
    onPacket: (packet: VoicePacket) => void
  ): Unsubscribe | null {
    if (!this.db) return null;

    try {
      const messagesCollectionRef = ref(this.db, 'messages');
      return onChildAdded(messagesCollectionRef, (snapshot) => {
        const val = snapshot.val();
        if (!val || !val.messageId) return;

        // Skip our own loopback if already handled locally
        if (val.senderDeviceId === localDeviceId) return;

        const packet: VoicePacket = {
          messageId: String(val.messageId),
          senderDeviceId: String(val.senderDeviceId),
          receiverDeviceId: String(val.receiverDeviceId || 'broadcast_mesh'),
          sequenceNumber: Number(val.sequenceNumber || 1),
          sourceLanguage: val.sourceLanguage || 'en',
          targetLanguage: val.targetLanguage || 'en',
          priority: val.priority || 'NORMAL',
          timestamp: Number(val.timestamp || Date.now()),
          textPayload: String(val.textPayload || ''),
          translatedText: String(val.translatedText || val.textPayload || ''),
          checksum: Number(val.checksum || 0),
          deliveryState: 'DELIVERED',
          audioSizeEstimateBytes: Number(val.audioSizeEstimateBytes || 3200),
          packetSizeBytes: Number(val.packetSizeBytes || 64),
          bandwidthReductionPercent: Number(val.bandwidthReductionPercent || 99.8),
          latencyMs: Number(val.latencyMs || 10),
          hasRealVoiceAudio: Boolean(val.hasRealVoiceAudio),
        };

        onPacket(packet);
      }, (error) => {
        console.warn('[FirebaseService] Messages subscribe error:', error);
      });
    } catch (err) {
      console.warn('[FirebaseService] subscribeToMessages error:', err);
      return null;
    }
  }

  /**
   * Manually pings/touches the local device heartbeat in Firebase RTDB.
   */
  public async pingDevice(deviceId: string): Promise<void> {
    if (!this.db || !deviceId) return;
    try {
      const dRef = ref(this.db, `devices/${deviceId}`);
      await update(dRef, {
        lastSeen: Date.now(),
        isConnected: true,
        connectionStatus: 'CONNECTED',
      });
    } catch (err) {
      console.warn('[FirebaseService] Failed pinging device in RTDB:', err);
    }
  }

  /**
   * Removes a specific device entry from Firebase RTDB.
   */
  public async removeDevice(deviceId: string): Promise<void> {
    if (!this.db || !deviceId) return;
    try {
      const dRef = ref(this.db, `devices/${deviceId}`);
      await remove(dRef);
    } catch (err) {
      console.warn('[FirebaseService] Failed deleting device in RTDB:', err);
    }
  }
}

export const FirebaseService = FirebaseRealtimeMeshService.getInstance();
