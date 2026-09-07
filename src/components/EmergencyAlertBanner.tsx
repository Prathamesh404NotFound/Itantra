import React from 'react';
import { VoicePacket } from '../types';
import { AlertTriangle, X, Volume2 } from 'lucide-react';
import { SpeechEngine } from '../utils/speechEngine';

interface EmergencyAlertBannerProps {
  alertPacket: VoicePacket | null;
  onDismiss: () => void;
}

export const EmergencyAlertBanner: React.FC<EmergencyAlertBannerProps> = ({
  alertPacket,
  onDismiss,
}) => {
  if (!alertPacket) return null;

  const handlePlayVoice = () => {
    SpeechEngine.speak({
      text: alertPacket.translatedText || alertPacket.textPayload,
      language: alertPacket.targetLanguage,
      rate: 1.0,
      volume: 1.0,
    });
  };

  return (
    <div
      id="emergency_alert_banner"
      className="sticky top-14 z-30 mx-4 my-2 p-3.5 rounded-2xl bg-[#FEE2E2] border-2 border-[#B91C1C] text-[#26211E] shadow-md animate-pulse duration-1000"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#B91C1C] flex items-center justify-center text-white shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#B91C1C]">
                Critical SOS Received
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#B91C1C] text-white font-bold">
                PRIORITY
              </span>
            </div>
            <p className="text-sm font-bold text-[#26211E] mt-0.5">
              {alertPacket.textPayload}
            </p>
            {alertPacket.translatedText && (
              <p className="text-xs font-semibold text-[#A83F20] mt-0.5">
                ↳ {alertPacket.translatedText}
              </p>
            )}
            <div className="flex items-center gap-3 text-[11px] text-[#6B625B] mt-1.5">
              <span>From: Unit {alertPacket.senderDeviceId}</span>
              <span>•</span>
              <span>Size: {alertPacket.packetSizeBytes} Bytes</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handlePlayVoice}
            title="Replay Voice Alert"
            className="p-1.5 rounded-lg bg-white border border-[#B91C1C]/30 text-[#B91C1C] hover:bg-[#FEE2E2] transition-colors"
          >
            <Volume2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDismiss}
            title="Dismiss Alert"
            className="p-1.5 rounded-lg text-[#6B625B] hover:text-[#26211E] hover:bg-white/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
