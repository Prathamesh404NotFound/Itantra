import React from 'react';
import { VoicePacket, LANGUAGES } from '../types';
import { Play, AlertTriangle, CheckCheck, Wifi } from 'lucide-react';

interface MessageCardProps {
  packet: VoicePacket;
  onReplay: () => void;
}

export const MessageCard: React.FC<MessageCardProps> = ({ packet, onReplay }) => {
  const isEmergency = packet.priority === 'CRITICAL';
  const srcLang = LANGUAGES[packet.sourceLanguage];
  const dstLang = LANGUAGES[packet.targetLanguage];

  return (
    <div
      id={`msg_card_${packet.messageId}`}
      className={`rounded-2xl p-4 transition-all border shadow-2xs ${
        isEmergency
          ? 'bg-[#FEE2E2]/60 border-[#B91C1C]/40'
          : 'bg-[#FFFFFF] border-[#E8E0D5] hover:border-[#C7512E]/40'
      }`}
    >
      {/* Card Header: Languages & Bandwidth / Priority */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {isEmergency && (
            <div className="flex items-center gap-1 text-[#B91C1C] text-[10px] font-bold uppercase tracking-wider bg-[#FEE2E2] px-1.5 py-0.5 rounded border border-[#B91C1C]/30">
              <AlertTriangle className="w-3 h-3" />
              <span>CRITICAL SOS</span>
            </div>
          )}
          <span className="text-xs font-bold text-[#C7512E]">
            {srcLang ? srcLang.displayName : packet.sourceLanguage} →{' '}
            {dstLang ? dstLang.displayName : packet.targetLanguage}
          </span>
        </div>

        {/* Compression & Size Badges */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-mono font-semibold text-[#6B625B]">
            {packet.packetSizeBytes} B
          </span>
          <span className="px-1.5 py-0.5 rounded-md bg-[#FEF3C7] text-[#B45309] text-[10px] font-bold">
            {Math.round(packet.bandwidthReductionPercent)}% saved
          </span>
        </div>
      </div>

      {/* Spoken original text */}
      <div className="text-[#26211E] font-semibold text-[15px] leading-snug">
        {packet.textPayload}
      </div>

      {/* Translated text if different */}
      {packet.translatedText && packet.translatedText !== packet.textPayload && (
        <div className="mt-1 text-[#C7512E] font-medium text-sm flex items-start gap-1">
          <span className="text-[#9E948A]">↳</span>
          <span>{packet.translatedText}</span>
        </div>
      )}

      {/* Footer info: Delivery channel & Latency + Replay Audio Button */}
      <div className="mt-3 pt-2.5 border-t border-[#F4ECE4] flex items-center justify-between text-[11px] text-[#9E948A]">
        <div className="flex items-center gap-1.5">
          <Wifi className="w-3 h-3 text-[#B45309]" />
          <span>Local Mesh • {packet.latencyMs}ms</span>
          <CheckCheck className="w-3.5 h-3.5 text-[#B45309]" />
        </div>

        <button
          onClick={onReplay}
          title="Replay Audio Synthesis"
          className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#FCEEE8] hover:bg-[#F4ECE4] text-[#C7512E] font-bold text-xs transition-colors active:scale-95"
        >
          <Play className="w-3 h-3 fill-[#C7512E]" />
          <span>Voice</span>
        </button>
      </div>
    </div>
  );
};
