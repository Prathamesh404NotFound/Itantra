import { z } from 'zod';
import { VoicePacket, LanguageCode, Priority, DeliveryState } from '../types';

/**
 * Zod validation schema for VoicePacket data structures
 */
export const VoicePacketSchema = z.object({
  messageId: z.string().min(1),
  senderDeviceId: z.string().min(1),
  receiverDeviceId: z.string().min(1),
  sequenceNumber: z.number().int().nonnegative(),
  sourceLanguage: z.enum(['hi', 'gu', 'mr', 'kn', 'ml', 'ta', 'te', 'or', 'bn', 'en']),
  targetLanguage: z.enum(['hi', 'gu', 'mr', 'kn', 'ml', 'ta', 'te', 'or', 'bn', 'en']),
  priority: z.enum(['NORMAL', 'HIGH', 'CRITICAL']),
  timestamp: z.number().positive(),
  textPayload: z.string().min(1),
  translatedText: z.string().optional(),
  checksum: z.number().int(),
  deliveryState: z.enum(['QUEUED', 'SENDING', 'SENT', 'RECEIVED', 'DELIVERED', 'FAILED', 'ENCODING', 'DECODING', 'PROCESSING', 'PLAYING']),
  audioSizeEstimateBytes: z.number().nonnegative(),
  packetSizeBytes: z.number().positive(),
  bandwidthReductionPercent: z.number().min(0).max(100),
  latencyMs: z.number().nonnegative(),
  audioBlobUrl: z.string().optional(),
  hasRealVoiceAudio: z.boolean().optional(),
});

// Standard CRC32 table implementation
const CRC_TABLE: Uint32Array = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

/**
 * Calculates a standard CRC32 checksum over the provided byte buffer.
 *
 * @param bytes - The input buffer to hash
 * @returns 32-bit unsigned integer checksum
 */
export function calculateCrc32(bytes: Uint8Array): number {
  let crc = 0 ^ -1;
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ bytes[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

/**
 * High-performance binary serializer and deserializer for VoicePacket structures
 * utilizing standard endianness and CRC32 verification.
 */
export class PacketCodec {
  private static readonly MAGIC_HEADER = 0x54414e54; // 'TANT'

  /**
   * Encodes a VoicePacket into a compact binary representation with checksum.
   *
   * @param packet - The voice packet object to encode
   * @returns Binary encoded buffer ready for mesh radio or socket transmission
   */
  static encode(packet: VoicePacket): Uint8Array {
    const encoder = new TextEncoder();
    const payloadBytes = encoder.encode(packet.textPayload);
    const translatedBytes = packet.translatedText ? encoder.encode(packet.translatedText) : new Uint8Array(0);

    // Header structure:
    // Magic (4B) | Seq (4B) | Pri (1B) | SrcLang (2B) | DstLang (2B) | Time (8B) | PayloadLen (2B) | TransLen (2B)
    const headerSize = 24;
    const totalSize = headerSize + payloadBytes.length + translatedBytes.length + 4; // +4 for CRC32
    const buffer = new Uint8Array(totalSize);
    const view = new DataView(buffer.buffer);

    view.setUint32(0, PacketCodec.MAGIC_HEADER, false);
    view.setUint32(4, packet.sequenceNumber, false);
    view.setUint8(8, packet.priority === 'CRITICAL' ? 1 : 0);

    // 2-byte language codes
    buffer[9] = packet.sourceLanguage.charCodeAt(0);
    buffer[10] = packet.sourceLanguage.charCodeAt(1);
    buffer[11] = packet.targetLanguage.charCodeAt(0);
    buffer[12] = packet.targetLanguage.charCodeAt(1);

    // Timestamp as high 4B and low 4B
    const highTime = Math.floor(packet.timestamp / 0x100000000);
    const lowTime = packet.timestamp >>> 0;
    view.setUint32(13, highTime, false);
    view.setUint32(17, lowTime, false);

    view.setUint16(21, payloadBytes.length, false);
    view.setUint16(23, translatedBytes.length, false);

    let offset = headerSize;
    buffer.set(payloadBytes, offset);
    offset += payloadBytes.length;
    buffer.set(translatedBytes, offset);
    offset += translatedBytes.length;

    // Compute CRC32 of everything up to offset
    const crc = calculateCrc32(buffer.subarray(0, offset));
    view.setUint32(offset, crc, false);

    return buffer;
  }

  /**
   * Decodes binary buffer into a validated VoicePacket using Zod schema verification.
   *
   * @param bytes - The raw byte array received over the wire
   * @returns Validated VoicePacket or null if corrupt, invalid magic, or failed CRC32
   */
  static decode(bytes: Uint8Array): VoicePacket | null {
    if (bytes.length < 28) return null;
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    const magic = view.getUint32(0, false);
    if (magic !== PacketCodec.MAGIC_HEADER) return null;

    const seq = view.getUint32(4, false);
    const isCritical = view.getUint8(8) === 1;
    const srcLang = (String.fromCharCode(bytes[9], bytes[10]) as LanguageCode) || 'hi';
    const dstLang = (String.fromCharCode(bytes[11], bytes[12]) as LanguageCode) || 'hi';

    const highTime = view.getUint32(13, false);
    const lowTime = view.getUint32(17, false);
    const timestamp = highTime * 0x100000000 + lowTime;

    const payloadLen = view.getUint16(21, false);
    const transLen = view.getUint16(23, false);

    const expectedTotal = 24 + payloadLen + transLen + 4;
    if (bytes.length < expectedTotal) return null;

    const decoder = new TextDecoder();
    let offset = 24;
    const payloadBytes = bytes.subarray(offset, offset + payloadLen);
    const textPayload = decoder.decode(payloadBytes);
    offset += payloadLen;

    let translatedText: string | undefined;
    if (transLen > 0) {
      const transBytes = bytes.subarray(offset, offset + transLen);
      translatedText = decoder.decode(transBytes);
      offset += transLen;
    }

    const recordedCrc = view.getUint32(offset, false);
    const actualCrc = calculateCrc32(bytes.subarray(0, offset));

    if (recordedCrc !== actualCrc) {
      console.warn('CRC32 checksum mismatch in VoicePacket');
      return null;
    }

    const packetSizeBytes = bytes.length;
    const audioSizeEstimateBytes = Math.max(3200, textPayload.length * 3200);
    const reductionPercent = Math.max(
      0,
      Math.min(99.9, ((audioSizeEstimateBytes - packetSizeBytes) / audioSizeEstimateBytes) * 100)
    );

    const rawCandidate: VoicePacket = {
      messageId: `msg_${Math.random().toString(36).substring(2, 9)}`,
      senderDeviceId: 'remote_peer',
      receiverDeviceId: 'local_device',
      sequenceNumber: seq,
      sourceLanguage: srcLang,
      targetLanguage: dstLang,
      priority: (isCritical ? 'CRITICAL' : 'NORMAL') as Priority,
      timestamp,
      textPayload,
      translatedText,
      checksum: actualCrc,
      deliveryState: 'DELIVERED' as DeliveryState,
      audioSizeEstimateBytes,
      packetSizeBytes,
      bandwidthReductionPercent: reductionPercent,
      latencyMs: 142,
    };

    // Strict Zod schema verification
    const parseResult = VoicePacketSchema.safeParse(rawCandidate);
    if (!parseResult.success) {
      console.error('PacketCodec schema validation failure:', parseResult.error.format());
      return null;
    }

    return parseResult.data as VoicePacket;
  }
}
