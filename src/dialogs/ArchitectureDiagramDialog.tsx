import React from 'react';
import { useCommunicator } from '../context/CommunicatorContext';
import { Network, Mic, Cpu, Binary, Radio, ArrowDown, Speaker, X, ShieldCheck } from 'lucide-react';

export const ArchitectureDiagramDialog: React.FC = () => {
  const { showArchitectureDiagram, setShowArchitectureDiagram } = useCommunicator();

  if (!showArchitectureDiagram) return null;

  const pipelineStages = [
    {
      step: '01',
      title: 'Acoustic Capture & VAD',
      tech: '16kHz 16-bit PCM Buffer',
      desc: 'Energy RMS and Zero Crossing Rate gate voice frames without sending silence.',
      icon: <Mic className="w-4 h-4 text-[#C7512E]" />,
    },
    {
      step: '02',
      title: 'On-Device Indic STT',
      tech: 'IndicConformer-Q4 Int8',
      desc: 'Acoustic streaming models convert voice to Indic text directly on device RAM.',
      icon: <Cpu className="w-4 h-4 text-[#C7512E]" />,
    },
    {
      step: '03',
      title: 'Offline Indic Translation',
      tech: 'Semantic Phrase Clusters',
      desc: 'Direct cross-language mapping between 10 Indian regional languages in <5ms.',
      icon: <Network className="w-4 h-4 text-[#C7512E]" />,
    },
    {
      step: '04',
      title: 'Binary Packet Codec',
      tech: 'CRC32 Checksummed Frame',
      desc: 'Packets encoded into ~76 bytes (cutting raw audio payload by 99.8%).',
      icon: <Binary className="w-4 h-4 text-[#C7512E]" />,
    },
    {
      step: '05',
      title: 'Ad-Hoc Mesh Transport',
      tech: 'Wi-Fi Direct / Bluetooth RFCOMM',
      desc: 'Point-to-point peer radio dispatch without cell towers, internet, or routers.',
      icon: <Radio className="w-4 h-4 text-[#B45309]" />,
    },
    {
      step: '06',
      title: 'Local Audio Synthesis (TTS)',
      tech: 'IndicPiper Compact Engine',
      desc: 'Remote phone translates and synthesizes voice aloud in target regional dialect.',
      icon: <Speaker className="w-4 h-4 text-[#C7512E]" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#FFFFFF] border border-[#E8E0D5] rounded-3xl w-full max-w-xl p-3.5 sm:p-5 shadow-2xl space-y-3.5 sm:space-y-4 max-h-[90dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-[#E8E0D5]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#C7512E] text-white flex items-center justify-center shrink-0">
              <Network className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#26211E]">
                System Architecture Pipeline
              </h2>
              <p className="text-[10px] sm:text-xs text-[#6B625B]">Zero-Cloud Air-Gapped Voice Flowchart</p>
            </div>
          </div>
          <button
            onClick={() => setShowArchitectureDiagram(false)}
            aria-label="Close architecture diagram modal"
            className="p-1 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full text-[#9E948A] hover:text-[#26211E]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pipeline List */}
        <div className="overflow-y-auto space-y-2 flex-1 pr-1">
          {pipelineStages.map((stage, idx) => (
            <React.Fragment key={stage.step}>
              <div className="p-3 sm:p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E0D5] flex items-start gap-2.5 sm:gap-3">
                <div className="w-7 h-7 rounded-xl bg-white border border-[#E8E0D5] flex items-center justify-center font-mono font-bold text-xs text-[#C7512E] shrink-0">
                  {stage.step}
                </div>
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="font-bold text-xs text-[#26211E]">{stage.title}</span>
                    <span className="text-[9px] sm:text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white border border-[#E8E0D5] text-[#6B625B]">
                      {stage.tech}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-[#6B625B] leading-relaxed">{stage.desc}</p>
                </div>
              </div>

              {idx < pipelineStages.length - 1 && (
                <div className="flex justify-center -my-1">
                  <ArrowDown className="w-3.5 h-3.5 text-[#9E948A]" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-[#F4ECE4] flex flex-col min-[420px]:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-[#B45309] font-bold text-center min-[420px]:text-left">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Air-Gapped: 0 External Sockets</span>
          </div>
          <button
            onClick={() => setShowArchitectureDiagram(false)}
            className="w-full min-[420px]:w-auto px-4 py-2 min-h-[38px] rounded-xl bg-[#C7512E] text-white text-xs font-bold hover:bg-[#A83F20] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
