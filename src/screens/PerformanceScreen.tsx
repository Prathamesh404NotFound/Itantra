import React from 'react';
import { useCommunicator } from '../context/CommunicatorContext';
import {
  Zap,
  Gauge,
  Cpu,
  HardDrive,
  ShieldCheck,
  TrendingDown,
  Clock,
  Activity,
  CheckCircle2,
} from 'lucide-react';

export const PerformanceScreen: React.FC = () => {
  const { performanceMetrics, isLowResourceMode, setLowResourceMode } = useCommunicator();

  const ramBudgetMb = 128;
  const ramPercent = Math.min(100, Math.round((performanceMetrics.ramUsageMb / ramBudgetMb) * 100));

  return (
    <div id="screen_performance" className="space-y-3.5 sm:space-y-4">
      {/* Zero Internet Audit Card */}
      <div className="rounded-2xl p-3 sm:p-4 bg-[#FEF3C7] border border-[#B45309]/30 shadow-xs">
        <div className="flex items-start justify-between gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#B45309] flex items-center justify-center text-white shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-[#26211E] truncate">Zero-Data Leakage</h3>
                <span className="px-1.5 py-0.5 rounded-full bg-white text-[#B45309] text-[9px] sm:text-[10px] font-extrabold uppercase shrink-0">
                  Audited
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#6B625B] mt-0.5 line-clamp-2 sm:line-clamp-none">
                All voice recognition, translation, and mesh transmission run locally on hardware.
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-lg sm:text-xl font-black text-[#B45309] font-mono">0.0 KB</span>
            <span className="text-[9px] sm:text-[10px] text-[#6B625B] block uppercase font-bold">Cloud</span>
          </div>
        </div>
      </div>

      {/* End-to-End Latency Breakdown */}
      <div className="rounded-2xl p-3 sm:p-4 bg-[#FFFFFF] border border-[#E8E0D5] shadow-xs">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Clock className="w-4 h-4 text-[#C7512E]" />
            <h3 className="text-xs sm:text-sm font-bold text-[#26211E]">End-to-End Voice Latency</h3>
          </div>
          <span className="text-xs sm:text-sm font-black font-mono text-[#C7512E]">
            {performanceMetrics.endToEndLatencyMs} ms
          </span>
        </div>

        {/* Latency Pipeline Bar */}
        <div className="space-y-2 text-xs">
          <div className="h-2.5 sm:h-3 w-full rounded-full bg-[#FAF7F2] overflow-hidden flex border border-[#E8E0D5]">
            <div
              style={{
                width: `${(performanceMetrics.sttLatencyMs / performanceMetrics.endToEndLatencyMs) * 100}%`,
              }}
              className="bg-[#C7512E] h-full"
              title={`STT: ${performanceMetrics.sttLatencyMs}ms`}
            />
            <div
              style={{
                width: `${(performanceMetrics.transportLatencyMs / performanceMetrics.endToEndLatencyMs) * 100}%`,
              }}
              className="bg-[#B45309] h-full"
              title={`Transport: ${performanceMetrics.transportLatencyMs}ms`}
            />
            <div
              style={{
                width: `${(performanceMetrics.ttsLatencyMs / performanceMetrics.endToEndLatencyMs) * 100}%`,
              }}
              className="bg-[#A83F20] h-full"
              title={`TTS: ${performanceMetrics.ttsLatencyMs}ms`}
            />
          </div>

          <div className="grid grid-cols-3 gap-1 sm:gap-2 pt-2 border-t border-[#F4ECE4] text-[10px] sm:text-[11px]">
            <div>
              <span className="text-[#9E948A] block truncate">1. STT</span>
              <span className="font-bold text-[#26211E] font-mono">
                {performanceMetrics.sttLatencyMs} ms
              </span>
            </div>
            <div>
              <span className="text-[#9E948A] block truncate">2. Transport</span>
              <span className="font-bold text-[#26211E] font-mono">
                {performanceMetrics.transportLatencyMs} ms
              </span>
            </div>
            <div>
              <span className="text-[#9E948A] block truncate">3. TTS</span>
              <span className="font-bold text-[#26211E] font-mono">
                {performanceMetrics.ttsLatencyMs} ms
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* System Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
        {/* Real-Time Factor (RTF) */}
        <div className="rounded-2xl p-3 sm:p-4 bg-[#FFFFFF] border border-[#E8E0D5] shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#9E948A]">
              <Gauge className="w-3.5 h-3.5 text-[#C7512E]" />
              <span>Real-Time Factor (RTF)</span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#B45309] text-[10px] font-bold">
              Sub-Realtime
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#26211E] font-mono mt-1">
            {performanceMetrics.rtf}x
          </div>
          <p className="text-[11px] sm:text-xs text-[#6B625B] mt-1">
            Audio processed 3.5x faster than natural speech rate without cloud round-trip.
          </p>
        </div>

        {/* RAM Usage & Low-Resource Mode */}
        <div className="rounded-2xl p-3 sm:p-4 bg-[#FFFFFF] border border-[#E8E0D5] shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#9E948A]">
              <HardDrive className="w-3.5 h-3.5 text-[#C7512E]" />
              <span>RAM Allocation</span>
            </div>
            <span className="text-[11px] font-mono font-bold text-[#26211E]">
              {performanceMetrics.ramUsageMb} / {ramBudgetMb} MB
            </span>
          </div>

          <div className="w-full bg-[#FAF7F2] rounded-full h-2 my-2 overflow-hidden border border-[#E8E0D5]">
            <div
              className="bg-[#B45309] h-full rounded-full transition-all duration-500"
              style={{ width: `${ramPercent}%` }}
            />
          </div>

          <label className="flex items-center justify-between mt-2 pt-2 border-t border-[#F4ECE4] cursor-pointer min-h-[36px]">
            <span className="text-xs font-semibold text-[#6B625B]">Low-Resource Mode (&lt;60MB)</span>
            <input
              type="checkbox"
              checked={isLowResourceMode}
              onChange={(e) => setLowResourceMode(e.target.checked)}
              className="accent-[#C7512E] w-4 h-4 cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* Bandwidth Compression & Packet Savings */}
      <div className="rounded-2xl p-3 sm:p-4 bg-[#FFFFFF] border border-[#E8E0D5] shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#9E948A]">
            <TrendingDown className="w-4 h-4 text-[#B45309]" />
            <span>Bandwidth Optimization</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#B45309] text-[10px] sm:text-xs font-bold">
            {performanceMetrics.reductionPercent}% Compression
          </span>
        </div>

        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2 sm:gap-3 my-2 text-xs">
          <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E0D5]">
            <span className="text-[#9E948A] text-[9px] sm:text-[10px] uppercase font-bold block">Raw Audio Stream</span>
            <span className="font-bold text-[#26211E] font-mono text-xs sm:text-sm block mt-0.5 truncate">
              ~{(performanceMetrics.rawAudioBytesEstimated / 1024).toFixed(1)} KB (16kHz PCM)
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#FCEEE8] border border-[#C7512E]/30">
            <span className="text-[#A83F20] text-[9px] sm:text-[10px] uppercase font-bold block">iTantra Packet</span>
            <span className="font-bold text-[#C7512E] font-mono text-xs sm:text-sm block mt-0.5 truncate">
              {performanceMetrics.packetSizeBytes} Bytes (CRC32)
            </span>
          </div>
        </div>

        <p className="text-[11px] sm:text-xs text-[#6B625B]">
          By converting voice to on-device semantic text before mesh dispatch, iTantra cuts channel
          saturation by over 99.8%, enabling resilient operation in noisy radio environments.
        </p>
      </div>
    </div>
  );
};
