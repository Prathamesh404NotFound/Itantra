import { LanguageCode } from '../types';

const STORAGE_DEVICE_ID = 'itantra_device_id';
const STORAGE_DEVICE_NAME = 'itantra_device_name';

/**
 * Gets or creates a unique device ID per browser session/tab.
 * This guarantees two tabs or two devices each get an independent ID.
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') {
    return `unit_${Math.random().toString(36).substring(2, 8)}`;
  }

  let deviceId = sessionStorage.getItem(STORAGE_DEVICE_ID);
  if (!deviceId) {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      deviceId = `unit_${crypto.randomUUID().substring(0, 8)}`;
    } else {
      deviceId = `unit_${Math.random().toString(36).substring(2, 8)}`;
    }
    sessionStorage.setItem(STORAGE_DEVICE_ID, deviceId);
  }
  return deviceId;
}

/**
 * Gets or creates a recognizable local device name.
 */
export function getOrCreateDeviceName(idSuffix?: string): string {
  if (typeof window === 'undefined') {
    return 'Field Unit';
  }

  let name = sessionStorage.getItem(STORAGE_DEVICE_NAME);
  if (!name) {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const suffix = idSuffix || Math.random().toString(36).substring(2, 6).toUpperCase();
    name = isMobile ? `Mobile Unit (${suffix})` : `Station Alpha (${suffix})`;
    sessionStorage.setItem(STORAGE_DEVICE_NAME, name);
  }
  return name;
}
