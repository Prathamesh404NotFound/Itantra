export type LanguageCode = 'hi' | 'gu' | 'mr' | 'kn' | 'ml' | 'ta' | 'te' | 'or' | 'bn' | 'en';

export interface LanguageInfo {
  code: LanguageCode;
  displayName: string;
  nativeName: string;
  scriptName: string;
  locale: string;
  sttModelName: string;
  ttsModelName: string;
  sttModelSizeMb: number;
  ttsModelSizeMb: number;
  totalModelSizeMb: number;
}

export const LANGUAGES: Record<LanguageCode, LanguageInfo> = {
  hi: {
    code: 'hi',
    displayName: 'Hindi',
    nativeName: 'हिन्दी',
    scriptName: 'Devanagari',
    locale: 'hi-IN',
    sttModelName: 'IndicConformer-Hi-Q4',
    ttsModelName: 'IndicPiper-Hi-Compact',
    sttModelSizeMb: 38.5,
    ttsModelSizeMb: 24.2,
    totalModelSizeMb: 62.7,
  },
  gu: {
    code: 'gu',
    displayName: 'Gujarati',
    nativeName: 'ગુજરાતી',
    scriptName: 'Gujarati',
    locale: 'gu-IN',
    sttModelName: 'IndicConformer-Gu-Q4',
    ttsModelName: 'IndicPiper-Gu-Compact',
    sttModelSizeMb: 36.2,
    ttsModelSizeMb: 23.8,
    totalModelSizeMb: 60.0,
  },
  mr: {
    code: 'mr',
    displayName: 'Marathi',
    nativeName: 'मराठी',
    scriptName: 'Devanagari',
    locale: 'mr-IN',
    sttModelName: 'IndicConformer-Mr-Q4',
    ttsModelName: 'IndicPiper-Mr-Compact',
    sttModelSizeMb: 37.8,
    ttsModelSizeMb: 24.0,
    totalModelSizeMb: 61.8,
  },
  kn: {
    code: 'kn',
    displayName: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    scriptName: 'Kannada',
    locale: 'kn-IN',
    sttModelName: 'IndicConformer-Kn-Q4',
    ttsModelName: 'IndicPiper-Kn-Compact',
    sttModelSizeMb: 39.1,
    ttsModelSizeMb: 24.5,
    totalModelSizeMb: 63.6,
  },
  ml: {
    code: 'ml',
    displayName: 'Malayalam',
    nativeName: 'മലയാളം',
    scriptName: 'Malayalam',
    locale: 'ml-IN',
    sttModelName: 'IndicConformer-Ml-Q4',
    ttsModelName: 'IndicPiper-Ml-Compact',
    sttModelSizeMb: 41.0,
    ttsModelSizeMb: 25.2,
    totalModelSizeMb: 66.2,
  },
  ta: {
    code: 'ta',
    displayName: 'Tamil',
    nativeName: 'தமிழ்',
    scriptName: 'Tamil',
    locale: 'ta-IN',
    sttModelName: 'IndicConformer-Ta-Q4',
    ttsModelName: 'IndicPiper-Ta-Compact',
    sttModelSizeMb: 40.4,
    ttsModelSizeMb: 24.8,
    totalModelSizeMb: 65.2,
  },
  te: {
    code: 'te',
    displayName: 'Telugu',
    nativeName: 'తెలుగు',
    scriptName: 'Telugu',
    locale: 'te-IN',
    sttModelName: 'IndicConformer-Te-Q4',
    ttsModelName: 'IndicPiper-Te-Compact',
    sttModelSizeMb: 39.8,
    ttsModelSizeMb: 24.6,
    totalModelSizeMb: 64.4,
  },
  or: {
    code: 'or',
    displayName: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
    scriptName: 'Odia',
    locale: 'or-IN',
    sttModelName: 'IndicConformer-Or-Q4',
    ttsModelName: 'IndicPiper-Or-Compact',
    sttModelSizeMb: 35.6,
    ttsModelSizeMb: 22.9,
    totalModelSizeMb: 58.5,
  },
  bn: {
    code: 'bn',
    displayName: 'Bengali',
    nativeName: 'বাংলা',
    scriptName: 'Bengali',
    locale: 'bn-IN',
    sttModelName: 'IndicConformer-Bn-Q4',
    ttsModelName: 'IndicPiper-Bn-Compact',
    sttModelSizeMb: 38.0,
    ttsModelSizeMb: 24.1,
    totalModelSizeMb: 62.1,
  },
  en: {
    code: 'en',
    displayName: 'English',
    nativeName: 'English',
    scriptName: 'Latin',
    locale: 'en-IN',
    sttModelName: 'IndicConformer-En-Q4',
    ttsModelName: 'IndicPiper-En-Compact',
    sttModelSizeMb: 34.0,
    ttsModelSizeMb: 21.5,
    totalModelSizeMb: 55.5,
  },
};

export const LANGUAGE_LIST: LanguageInfo[] = Object.values(LANGUAGES);

export type CommunicationMode = 'PUSH_TO_TALK' | 'CONTINUOUS';

export type Priority = 'NORMAL' | 'CRITICAL';

export type EmergencyCategoryKey = 'FIRE' | 'MEDICAL' | 'HELP' | 'DISTRESS' | 'EVACUATION' | 'CUSTOM';

export interface EmergencyCategoryDef {
  key: EmergencyCategoryKey;
  title: string;
  iconName: string;
  defaultText: string;
}

export const EMERGENCY_CATEGORIES: Record<EmergencyCategoryKey, EmergencyCategoryDef> = {
  FIRE: {
    key: 'FIRE',
    title: 'Fire Emergency',
    iconName: 'Flame',
    defaultText: 'Fire detected. Immediate evacuation and assistance required.',
  },
  MEDICAL: {
    key: 'MEDICAL',
    title: 'Medical Alert',
    iconName: 'HeartPulse',
    defaultText: 'Medical emergency. Immediate medical assistance required.',
  },
  HELP: {
    key: 'HELP',
    title: 'Immediate Help',
    iconName: 'LifeBuoy',
    defaultText: 'Urgent help needed at this location.',
  },
  DISTRESS: {
    key: 'DISTRESS',
    title: 'Distress Signal',
    iconName: 'AlertTriangle',
    defaultText: 'Distress condition reported. Assistance requested.',
  },
  EVACUATION: {
    key: 'EVACUATION',
    title: 'Evacuate Area',
    iconName: 'Megaphone',
    defaultText: 'Danger detected. Evacuate immediate vicinity immediately.',
  },
  CUSTOM: {
    key: 'CUSTOM',
    title: 'Emergency Broadcast',
    iconName: 'Radio',
    defaultText: 'Emergency alert broadcast.',
  },
};

export type DeliveryState =
  | 'CREATED'
  | 'ENCODING'
  | 'SENDING'
  | 'RECEIVED'
  | 'DECODING'
  | 'PROCESSING'
  | 'PLAYING'
  | 'DELIVERED'
  | 'FAILED';

export type FsmState = 'IDLE' | 'CAPTURING' | 'PROCESSING' | 'TRANSMITTING' | 'SYNTHESIZING' | 'ERROR';
export type VoiceState = FsmState;

export interface StateTransition {
  from: FsmState;
  to: FsmState;
  timestamp: number;
  reason?: string;
}

export type ToastType = 'error' | 'warning' | 'info' | 'success';

export interface ToastNotification {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  timestamp: number;
  durationMs?: number;
}

export type TransportType = 'WIFI_DIRECT' | 'BLUETOOTH' | 'LOCAL_SOCKET' | 'SIMULATION';

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  supportedLanguages: LanguageCode[];
  isConnected: boolean;
  transportType: TransportType;
  signalDbm: number;
  ipAddress: string;
  port: number;
  lastSeen: number;
}

export interface VoicePacket {
  messageId: string;
  senderDeviceId: string;
  receiverDeviceId: string;
  sequenceNumber: number;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  priority: Priority;
  timestamp: number;
  textPayload: string;
  translatedText?: string;
  checksum: number;
  deliveryState: DeliveryState;
  audioSizeEstimateBytes: number;
  packetSizeBytes: number;
  bandwidthReductionPercent: number;
  latencyMs: number;
  audioBlobUrl?: string;
  hasRealVoiceAudio?: boolean;
}

export interface PerformanceMetrics {
  sttLatencyMs: number;
  ttsLatencyMs: number;
  transportLatencyMs: number;
  endToEndLatencyMs: number;
  rtf: number;
  ramUsageMb: number;
  cpuPercent: number;
  packetSizeBytes: number;
  rawAudioBytesEstimated: number;
  reductionPercent: number;
  totalDataTransmittedBytes: number;
  internetDataUsedBytes: number; // 0 in iTantra
  isMeasuredOnDevice: boolean;
}

export interface ModelDescriptor {
  language: LanguageCode;
  sttModel: string;
  ttsModel: string;
  modelSizeMb: number;
  isLoaded: boolean;
  isAvailable: boolean;
  memoryUsageMb: number;
}

export interface AccuracyResult {
  id: string;
  language: LanguageCode;
  referenceText: string;
  recognizedText: string;
  wer: number;
  substitutions: number;
  deletions: number;
  insertions: number;
  totalWords: number;
  timestamp: number;
}

export type DiagnosticStatus = 'PASS' | 'FAIL' | 'NOT_AVAILABLE';

export interface DiagnosticItem {
  id: string;
  componentName: string;
  status: DiagnosticStatus;
  details: string;
  latencyMs?: number;
}

export type AppTab = 'COMMUNICATE' | 'DEVICES' | 'HISTORY' | 'PERFORMANCE' | 'SETTINGS';
