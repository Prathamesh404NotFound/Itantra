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
 *
 * Binary Layout (28-byte canonical header + variable payloads + 4-byte CRC32):
 * - [0..3]   Magic Header (0x54414E54 'TANT', 4B)
 * - [4..7]   Sequence Number (Uint32, 4B)
 * - [8..11]  Timestamp High 32-bit (Uint32, 4B)
 * - [12..15] Timestamp Low 32-bit (Uint32, 4B)
 * - [16]     Priority (Uint8, 1B: 1=CRITICAL, 0=NORMAL)
 * - [17..18] Source Language Code (2B ASCII)
 * - [19..20] Target Language Code (2B ASCII)
 * - [21]     Reserved / Padding (1B)
 * - [22..23] Text Payload Length in Bytes (Uint16, 2B)
 * - [24..25] Translated Text Length in Bytes (Uint16, 2B)
 * - [26..27] Flags (Uint16, 2B)
 * - [28..]   UTF-8 Text Payload Bytes
 * - [..]     UTF-8 Translated Text Bytes
 * - [End-4]  CRC32 Checksum (Uint32, 4B)
 */
export class PacketCodec {
  public static readonly MAGIC_HEADER = 0x54414e54; // 'TANT'
  public static readonly HEADER_SIZE = 28;

  /**
   * Encodes a VoicePacket into a compact binary representation with checksum.
   *
   * @param packet - The voice packet object to encode
   * @returns Binary encoded buffer ready for mesh radio or socket transmission
   */
  static encode(packet: VoicePacket): Uint8Array {
    const encoder = new TextEncoder();
    const payloadBytes = encoder.encode(packet.textPayload || '');
    const translatedBytes = packet.translatedText ? encoder.encode(packet.translatedText) : new Uint8Array(0);

    const totalSize = PacketCodec.HEADER_SIZE + payloadBytes.length + translatedBytes.length + 4; // +4 for CRC32
    const buffer = new Uint8Array(totalSize);
    const view = new DataView(buffer.buffer);

    // 1. Header fields
    view.setUint32(0, PacketCodec.MAGIC_HEADER, false);
    view.setUint32(4, packet.sequenceNumber, false);

    // Timestamp as high 4B and low 4B
    const highTime = Math.floor(packet.timestamp / 0x100000000);
    const lowTime = packet.timestamp >>> 0;
    view.setUint32(8, highTime, false);
    view.setUint32(12, lowTime, false);

    // Priority & Languages
    view.setUint8(16, packet.priority === 'CRITICAL' ? 1 : 0);
    const srcLang = packet.sourceLanguage || 'hi';
    const dstLang = packet.targetLanguage || 'hi';
    buffer[17] = srcLang.charCodeAt(0) || 104; // 'h'
    buffer[18] = srcLang.charCodeAt(1) || 105; // 'i'
    buffer[19] = dstLang.charCodeAt(0) || 104; // 'h'
    buffer[20] = dstLang.charCodeAt(1) || 105; // 'i'
    buffer[21] = 0; // Reserved padding

    // Length prefixes
    view.setUint16(22, payloadBytes.length, false);
    view.setUint16(24, translatedBytes.length, false);
    view.setUint16(26, 0, false); // Reserved flags

    // 2. Variable payloads
    let offset = PacketCodec.HEADER_SIZE;
    buffer.set(payloadBytes, offset);
    offset += payloadBytes.length;
    buffer.set(translatedBytes, offset);
    offset += translatedBytes.length;

    // 3. Compute and append CRC32
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
    if (bytes.length < PacketCodec.HEADER_SIZE + 4) {
      console.warn('[PacketCodec] Buffer length below minimum required size:', bytes.length);
      return null;
    }

    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    const magic = view.getUint32(0, false);
    if (magic !== PacketCodec.MAGIC_HEADER) {
      console.warn('[PacketCodec] Invalid magic header:', magic.toString(16));
      return null;
    }

    const seq = view.getUint32(4, false);
    const highTime = view.getUint32(8, false);
    const lowTime = view.getUint32(12, false);
    const timestamp = highTime * 0x100000000 + lowTime;

    const isCritical = view.getUint8(16) === 1;
    const srcLang = (String.fromCharCode(bytes[17], bytes[18]) as LanguageCode) || 'hi';
    const dstLang = (String.fromCharCode(bytes[19], bytes[20]) as LanguageCode) || 'hi';

    const payloadLen = view.getUint16(22, false);
    const transLen = view.getUint16(24, false);

    const expectedTotal = PacketCodec.HEADER_SIZE + payloadLen + transLen + 4;
    if (bytes.length < expectedTotal) {
      console.warn('[PacketCodec] Truncated buffer:', { actual: bytes.length, expectedTotal });
      return null;
    }

    const decoder = new TextDecoder();
    let offset = PacketCodec.HEADER_SIZE;
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
      console.warn('[PacketCodec] CRC32 checksum mismatch:', { recordedCrc, actualCrc });
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
      translatedText: translatedText || undefined,
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
      console.error('[PacketCodec] Schema validation failure:', parseResult.error.format());
      return null;
    }

    return parseResult.data as VoicePacket;
  }
}
