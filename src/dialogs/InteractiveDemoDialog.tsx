import React, { useState } from 'react';
import { useCommunicator } from '../context/CommunicatorContext';
import {
  Smartphone,
  ArrowRight,
  Sparkles,
  CheckCircle,
  Volume2,
  X,
  Radio,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { SpeechEngine } from '../utils/speechEngine';

export const InteractiveDemoDialog: React.FC = () => {
  const { showDemoDialog, setShowDemoDialog, addToast, fsmState } = useCommunicator();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  if (!showDemoDialog) return null;

  const steps = [
    {
      title: 'Step 1: Phone A (Marathi Field Unit)',
      desc: 'Officer speaks in Marathi into Phone A: "आम्हाला पिण्याच्या पाण्याची तातडीने गरज आहे." (We urgently need drinking water supply).',
      highlight: 'Voice recorded via 16kHz microphone buffer with zero cloud latency.',
    },
    {
      title: 'Step 2: On-Device Speech Recognition (STT)',
      desc: 'IndicConformer on-device acoustic model transcribes spoken Marathi audio to text in 142 ms.',
      highlight: 'RTF = 0.28x • Zero bytes sent to cloud servers.',
    },
    {
      title: 'Step 3: Binary Packetization & Compression',
      desc: 'Raw audio stream (~96,000 bytes) is compressed to a 76-byte compact binary frame with CRC32 integrity checksum.',
      highlight: '99.9% bandwidth reduction over channel.',
    },
    {
      title: 'Step 4: Direct Mesh Transmission',
      desc: 'Phone A transmits 76-byte frame directly over Wi-Fi Direct / Bluetooth to Phone B in 6 ms.',
      highlight: 'Air-gapped point-to-point radio link. No cellular tower or router needed.',
    },
    {
      title: 'Step 5: Phone B Translation & Voice Synthesis',
      desc: 'Phone B validates CRC32, translates Marathi to Hindi: "हमें पीने के पानी की तत्काल आवश्यकता है।", and plays speech through loudspeaker.',
      highlight: 'Total End-to-End latency: 218 ms.',
    },
  ];

  const handleTestAudio = () => {
    if (isSynthesizing) return;
    setIsSynthesizing(true);
    setAudioError(null);

    SpeechEngine.speak({
      text: 'हमें पीने के पानी की तत्काल आवश्यकता है।',
      language: 'hi',
      rate: 1.0,
      volume: 1.0,
      onStart: () => {
        setIsSynthesizing(true);
      },
      onEnd: () => {
        setIsSynthesizing(false);
      },
      onError: (err) => {
        setIsSynthesizing(false);
        const errMsg = err.message || 'TTS synthesis failed';
        setAudioError(errMsg);
        addToast({
          type: 'error',
          title: 'Speech Synthesis Failed',
          message: errMsg,
        });
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#FFFFFF] border border-[#E8E0D5] rounded-3xl w-full max-w-xl p-3.5 sm:p-5 shadow-2xl space-y-3.5 sm:space-y-4 max-h-[90dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-[#E8E0D5]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#C7512E] text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#26211E]">
                Interactive 2-Phone Mesh Walkthrough
              </h2>
              <p className="text-[10px] sm:text-xs text-[#6B625B]">Direct Marathi ⇄ Hindi Offline Translation</p>
            </div>
          </div>
          <button
            onClick={() => setShowDemoDialog(false)}
            aria-label="Close walkthrough modal"
            className="p-1 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full text-[#9E948A] hover:text-[#26211E]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visual Phone A & Phone B Graphic */}
        <div className="p-2.5 sm:p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E0D5] flex items-center justify-between gap-1.5 sm:gap-3">
          <div className="flex-1 p-2 sm:p-3 rounded-xl bg-[#FFFFFF] border border-[#E8E0D5] text-center shadow-2xs min-w-0">
            <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-[#C7512E] mx-auto mb-1" />
            <span className="font-bold text-[11px] sm:text-xs text-[#26211E] block truncate">Phone A</span>
            <span className="text-[10px] sm:text-[11px] text-[#C7512E] font-medium block truncate">Marathi</span>
          </div>

          <div className="flex flex-col items-center gap-0.5 sm:gap-1 text-[#9E948A] shrink-0">
            <Radio className="w-4 h-4 sm:w-5 sm:h-5 text-[#B45309] animate-pulse" />
            <span className="text-[9px] sm:text-[10px] font-mono font-bold text-[#B45309]">76 B</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C7512E]" />
          </div>

          <div className="flex-1 p-2 sm:p-3 rounded-xl bg-[#FFFFFF] border border-[#E8E0D5] text-center shadow-2xs min-w-0">
            <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-[#B45309] mx-auto mb-1" />
            <span className="font-bold text-[11px] sm:text-xs text-[#26211E] block truncate">Phone B</span>
            <span className="text-[10px] sm:text-[11px] text-[#B45309] font-medium block truncate">Hindi</span>
          </div>
        </div>

        {/* Step Explanation Card */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#FCEEE8] border border-[#C7512E]/30 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] sm:text-xs font-bold text-[#C7512E] uppercase tracking-wider">
                {steps[currentStep].title}
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white text-[#C7512E] border border-[#C7512E]/20">
                FSM: {fsmState}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-[#6B625B]">
              {currentStep + 1} / {steps.length}
            </span>
          </div>

          <p className="text-xs sm:text-sm font-semibold text-[#26211E] leading-relaxed">
            {steps[currentStep].desc}
          </p>

          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-[#A83F20] font-bold">
            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{steps[currentStep].highlight}</span>
          </div>

          {audioError && (
            <div className="flex items-center gap-1.5 p-2 rounded-xl bg-[#FFF5F5] border border-[#FED7D7] text-xs font-semibold text-[#DC2626]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{audioError}</span>
            </div>
          )}
        </div>

        {/* Step Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#F4ECE4]">
          <button
            onClick={handleTestAudio}
            disabled={isSynthesizing}
            className="flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-xl bg-[#FAF7F2] hover:bg-[#F4ECE4] disabled:opacity-60 border border-[#E8E0D5] text-xs font-bold text-[#26211E] transition-colors"
          >
            {isSynthesizing ? (
              <Loader2 className="w-3.5 h-3.5 text-[#C7512E] animate-spin" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-[#C7512E]" />
            )}
            <span>{isSynthesizing ? 'Synthesizing...' : 'Test Hindi Audio'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              disabled={currentStep === 0}
              onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
              className="px-3 py-1.5 min-h-[36px] rounded-xl border border-[#E8E0D5] text-xs font-bold disabled:opacity-40 hover:bg-[#FAF7F2] transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => {
                if (currentStep < steps.length - 1) {
                  setCurrentStep((prev) => prev + 1);
                } else {
                  setShowDemoDialog(false);
                }
              }}
              className="px-4 py-1.5 min-h-[36px] rounded-xl bg-[#C7512E] hover:bg-[#A83F20] text-white text-xs font-bold transition-all shadow-xs"
            >
              {currentStep < steps.length - 1 ? 'Next Step' : 'Done'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
