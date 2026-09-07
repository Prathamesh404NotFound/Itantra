import React from 'react';
import { useCommunicator } from '../context/CommunicatorContext';
import {
  Volume2,
  Gauge,
  Sliders,
  Cpu,
  Layers,
  CheckCircle,
  AudioWaveform,
  Network,
  HelpCircle,
  ShieldCheck,
  Smartphone,
  ChevronRight,
  Activity,
  Mic,
} from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const {
    speechRate,
    setSpeechRate,
    speakerVolume,
    setSpeakerVolume,
    communicationMode,
    setCommunicationMode,
    isLowResourceMode,
    setLowResourceMode,
    setShowDiagnostics,
    setShowModelManager,
    setShowAccuracyTesting,
    setShowTtsTesting,
    setShowArchitectureDiagram,
    setShowTwoPhonesGuide,
    setShowDemoDialog,
  } = useCommunicator();

  return (
    <div id="screen_settings" className="space-y-3.5 sm:space-y-4">
      {/* Audio Engine Configuration */}
      <div className="rounded-2xl p-3 sm:p-4 bg-[#FFFFFF] border border-[#E8E0D5] shadow-xs space-y-3.5 sm:space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-[#9E948A]">
          Audio & Speech Engine Tuning
        </div>

        {/* Speech Rate Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#26211E] flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-[#C7512E]" />
              TTS Speech Rate
            </span>
            <span className="font-bold text-[#C7512E] font-mono">{speechRate.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.05"
            value={speechRate}
            onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
            className="w-full accent-[#C7512E] cursor-pointer min-h-[30px]"
          />
          <div className="flex justify-between text-[10px] text-[#9E948A]">
            <span>0.5x (Slow)</span>
            <span>1.0x (Normal)</span>
            <span>1.5x (Tactical Fast)</span>
          </div>
        </div>

        {/* Speaker Volume Slider */}
        <div className="space-y-1.5 pt-2 border-t border-[#F4ECE4]">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#26211E] flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-[#C7512E]" />
              Speaker Volume
            </span>
            <span className="font-bold text-[#C7512E] font-mono">
              {Math.round(speakerVolume * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={speakerVolume}
            onChange={(e) => setSpeakerVolume(parseFloat(e.target.value))}
            className="w-full accent-[#C7512E] cursor-pointer min-h-[30px]"
          />
        </div>

        {/* Continuous VAD Mode Toggle */}
        <label className="flex items-center justify-between pt-2 border-t border-[#F4ECE4] cursor-pointer min-h-[44px]">
          <div className="min-w-0 pr-2">
            <div className="text-xs font-bold text-[#26211E] flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-[#C7512E]" />
              Continuous VAD Mode
            </div>
            <div className="text-[10px] sm:text-[11px] text-[#6B625B]">
              Hands-free automatic voice activity detection
            </div>
          </div>
          <input
            type="checkbox"
            checked={communicationMode === 'CONTINUOUS'}
            onChange={(e) =>
              setCommunicationMode(e.target.checked ? 'CONTINUOUS' : 'PUSH_TO_TALK')
            }
            className="accent-[#C7512E] w-5 h-5 cursor-pointer shrink-0"
          />
        </label>

        {/* Low Resource Mode Toggle */}
        <label className="flex items-center justify-between pt-2 border-t border-[#F4ECE4] cursor-pointer min-h-[44px]">
          <div className="min-w-0 pr-2">
            <div className="text-xs font-bold text-[#26211E] flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-[#B45309]" />
              Low Resource RAM Mode
            </div>
            <div className="text-[10px] sm:text-[11px] text-[#6B625B]">
              Caps on-device model memory under 60 MB for budget hardware
            </div>
          </div>
          <input
            type="checkbox"
            checked={isLowResourceMode}
            onChange={(e) => setLowResourceMode(e.target.checked)}
            className="accent-[#C7512E] w-5 h-5 cursor-pointer shrink-0"
          />
        </label>
      </div>

      {/* Advanced Engineering & Diagnostics Action Tiles */}
      <div className="rounded-2xl p-3 sm:p-4 bg-[#FFFFFF] border border-[#E8E0D5] shadow-xs space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-[#9E948A] mb-2">
          Diagnostic Tools & Validation
        </div>

        <button
          onClick={() => setShowDiagnostics(true)}
          className="w-full p-2.5 sm:p-3 rounded-xl bg-[#FAF7F2] hover:bg-[#F4ECE4] border border-[#E8E0D5] flex items-center justify-between transition-colors text-left min-h-[44px]"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#C7512E]/15 text-[#C7512E] flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#26211E] truncate">Hardware & Diagnostics</div>
              <div className="text-[10px] sm:text-[11px] text-[#6B625B] truncate">Verify 10 audio, mesh & translation checks</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#9E948A] shrink-0 ml-2" />
        </button>

        <button
          onClick={() => setShowModelManager(true)}
          className="w-full p-2.5 sm:p-3 rounded-xl bg-[#FAF7F2] hover:bg-[#F4ECE4] border border-[#E8E0D5] flex items-center justify-between transition-colors text-left min-h-[44px]"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#C7512E]/15 text-[#C7512E] flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#26211E] truncate">Offline Model Manager</div>
              <div className="text-[10px] sm:text-[11px] text-[#6B625B] truncate">Inspect memory footprint for 10 Indic languages</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#9E948A] shrink-0 ml-2" />
        </button>

        <button
          onClick={() => setShowAccuracyTesting(true)}
          className="w-full p-2.5 sm:p-3 rounded-xl bg-[#FAF7F2] hover:bg-[#F4ECE4] border border-[#E8E0D5] flex items-center justify-between transition-colors text-left min-h-[44px]"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#C7512E]/15 text-[#C7512E] flex items-center justify-center shrink-0">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#26211E] truncate">STT Accuracy Benchmark (WER)</div>
              <div className="text-[10px] sm:text-[11px] text-[#6B625B] truncate">Compute Word Error Rate against ground truth</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#9E948A] shrink-0 ml-2" />
        </button>

        <button
          onClick={() => setShowTtsTesting(true)}
          className="w-full p-2.5 sm:p-3 rounded-xl bg-[#FAF7F2] hover:bg-[#F4ECE4] border border-[#E8E0D5] flex items-center justify-between transition-colors text-left min-h-[44px]"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#C7512E]/15 text-[#C7512E] flex items-center justify-center shrink-0">
              <AudioWaveform className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#26211E] truncate">TTS Audio Evaluation Studio</div>
              <div className="text-[10px] sm:text-[11px] text-[#6B625B] truncate">Audition pronunciation & naturalness</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#9E948A] shrink-0 ml-2" />
        </button>

        <button
          onClick={() => setShowArchitectureDiagram(true)}
          className="w-full p-2.5 sm:p-3 rounded-xl bg-[#FAF7F2] hover:bg-[#F4ECE4] border border-[#E8E0D5] flex items-center justify-between transition-colors text-left min-h-[44px]"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#C7512E]/15 text-[#C7512E] flex items-center justify-center shrink-0">
              <Network className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#26211E] truncate">System Architecture Diagram</div>
              <div className="text-[10px] sm:text-[11px] text-[#6B625B] truncate">View real-time end-to-end processing pipeline</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#9E948A] shrink-0 ml-2" />
        </button>

        <button
          onClick={() => setShowTwoPhonesGuide(true)}
          className="w-full p-2.5 sm:p-3 rounded-xl bg-[#FAF7F2] hover:bg-[#F4ECE4] border border-[#E8E0D5] flex items-center justify-between transition-colors text-left min-h-[44px]"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#C7512E]/15 text-[#C7512E] flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#26211E] truncate">Two Phones Connection Guide</div>
              <div className="text-[10px] sm:text-[11px] text-[#6B625B] truncate">Setup ad-hoc Wi-Fi / Bluetooth between field units</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#9E948A] shrink-0 ml-2" />
        </button>
      </div>

      {/* Privacy and Air-gap Guarantee */}
      <div className="rounded-2xl p-4 bg-[#FAF7F2] border border-[#E8E0D5] text-xs text-[#6B625B] flex items-start gap-2.5">
        <ShieldCheck className="w-5 h-5 text-[#B45309] shrink-0 mt-0.5" />
        <div>
          <div className="font-bold text-[#26211E]">Air-Gapped Privacy Architecture</div>
          <p className="mt-0.5 leading-relaxed">
            iTantra has no telemetry endpoints, analytics trackers, or external API requirements.
            Audio frames never leave device RAM except as encoded binary packets routed over direct
            peer-to-peer radio.
          </p>
        </div>
      </div>
    </div>
  );
};
