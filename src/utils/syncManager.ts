import { VoicePacket } from '../types';

export type ConnectivityCallback = (isOnline: boolean) => void;

/**
 * SyncManager coordinates offline message queuing and automatic re-synchronization
 * when network or mesh socket connectivity is restored.
 */
class SyncManagerService {
  private offlineQueue: VoicePacket[] = [];
  private listeners: Set<ConnectivityCallback> = new Set();
  private onlineState: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isSyncing: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnlineEvent);
      window.addEventListener('offline', this.handleOfflineEvent);
    }
  }

  private handleOnlineEvent = (): void => {
    this.onlineState = true;
    this.notifyListeners(true);
  };

  private handleOfflineEvent = (): void => {
    this.onlineState = false;
    this.notifyListeners(false);
  };

  private notifyListeners(isOnline: boolean): void {
    this.listeners.forEach((cb) => {
      try {
        cb(isOnline);
      } catch (err) {
        console.error('Connectivity listener error:', err);
      }
    });
  }

  /**
   * Registers a callback listener that triggers whenever the browser connectivity state changes.
   *
   * @param callback - Function invoked with the updated boolean online status
   * @returns Unsubscribe teardown function
   */
  registerConnectivityListener(callback: ConnectivityCallback): () => void {
    this.listeners.add(callback);
    // Initial call
    callback(this.onlineState);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Current online status according to the browser navigator.
   */
  isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : this.onlineState;
  }

  /**
   * Queues a VoicePacket for deferred transmission when connectivity is intermittent or unavailable.
   *
   * @param packet - Packet to be deferred
   */
  enqueue(packet: VoicePacket): void {
    const existingIdx = this.offlineQueue.findIndex((p) => p.messageId === packet.messageId);
    if (existingIdx >= 0) {
      this.offlineQueue[existingIdx] = packet;
    } else {
      this.offlineQueue.push(packet);
    }
  }

  /**
   * Returns current pending packets queued in offline buffer.
   */
  getPendingPackets(): VoicePacket[] {
    return [...this.offlineQueue];
  }

  /**
   * Returns count of queued messages waiting for synchronization.
   */
  getPendingCount(): number {
    return this.offlineQueue.length;
  }

  /**
   * Flushes the offline queue by sequentially passing queued packets to the syncHandler.
   *
   * @param syncHandler - Async callback that attempts to deliver the packet
   * @returns Number of successfully synced packets
   */
  async flushQueue(syncHandler: (packet: VoicePacket) => Promise<boolean>): Promise<number> {
    if (this.isSyncing || this.offlineQueue.length === 0) {
      return 0;
    }

    this.isSyncing = true;
    let syncedCount = 0;
    const remaining: VoicePacket[] = [];

    try {
      for (const packet of this.offlineQueue) {
        try {
          const success = await syncHandler(packet);
          if (success) {
            syncedCount++;
          } else {
            remaining.push(packet);
          }
        } catch {
          remaining.push(packet);
        }
      }
      this.offlineQueue = remaining;
    } finally {
      this.isSyncing = false;
    }

    return syncedCount;
  }

  /**
   * Clears the pending offline queue.
   */
  clearQueue(): void {
    this.offlineQueue = [];
  }
}

export const SyncManager = new SyncManagerService();
