import React from 'react';
import { useCommunicator } from '../context/CommunicatorContext';
import { LANGUAGES, LanguageCode } from '../types';
import { Layers, HardDrive, CheckCircle2, X } from 'lucide-react';

export const ModelManagerDialog: React.FC = () => {
  const {
    showModelManager,
    setShowModelManager,
    models,
    toggleModelLoaded,
    performanceMetrics,
    isLowResourceMode,
    setLowResourceMode,
  } = useCommunicator();

  if (!showModelManager) return null;

  const totalLoadedRam = models.reduce((acc, m) => acc + m.memoryUsageMb, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#FFFFFF] border border-[#E8E0D5] rounded-3xl w-full max-w-xl p-3.5 sm:p-5 shadow-2xl space-y-3.5 sm:space-y-4 max-h-[90dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-[#E8E0D5]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#C7512E] text-white flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#26211E]">Offline Model Manager</h2>
              <p className="text-[10px] sm:text-xs text-[#6B625B]">10 Indic On-Device Language Packages</p>
            </div>
          </div>
          <button
            onClick={() => setShowModelManager(false)}
            aria-label="Close model manager modal"
            className="p-1 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full text-[#9E948A] hover:text-[#26211E]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* RAM Status Banner */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E0D5] flex flex-col min-[420px]:flex-row items-start min-[420px]:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-[#C7512E] shrink-0" />
            <div>
              <span className="font-bold text-[#26211E] block text-xs">Active RAM Footprint</span>
              <span className="text-[10px] sm:text-[11px] text-[#6B625B]">
                {totalLoadedRam} MB in memory (128 MB Cap)
              </span>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer self-end min-[420px]:self-auto min-h-[32px]">
            <span className="text-[10px] sm:text-[11px] font-semibold text-[#6B625B]">Low-RAM Mode</span>
            <input
              type="checkbox"
              checked={isLowResourceMode}
              onChange={(e) => setLowResourceMode(e.target.checked)}
              className="accent-[#C7512E] w-4 h-4 cursor-pointer"
            />
          </label>
        </div>

        {/* Models List */}
        <div className="overflow-y-auto space-y-2 flex-1 pr-1">
          {models.map((mod) => {
            const langInfo = LANGUAGES[mod.language];
            return (
              <div
                key={mod.language}
                className="p-2.5 sm:p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E0D5] flex items-center justify-between gap-2 sm:gap-3 text-xs"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-xs sm:text-sm text-[#26211E] truncate">
                      {langInfo.displayName}
                    </span>
                    <span className="text-[10px] text-[#6B625B]">({langInfo.nativeName})</span>
                    <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-white border border-[#E8E0D5] text-[#6B625B]">
                      {mod.language}
                    </span>
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-[#6B625B] truncate">
                    STT: {mod.sttModel} • TTS: {mod.ttsModel} ({mod.modelSizeMb} MB)
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <div className="text-right hidden min-[360px]:block">
                    <span className="font-mono font-bold text-[#26211E] block text-[10px] sm:text-[11px]">
                      {mod.isLoaded ? `${mod.memoryUsageMb} MB` : 'Off'}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleModelLoaded(mod.language)}
                    className={`px-2.5 sm:px-3 py-1.5 min-h-[34px] rounded-lg text-xs font-bold transition-all ${
                      mod.isLoaded
                        ? 'bg-[#C7512E] text-white'
                        : 'bg-[#FFFFFF] border border-[#E8E0D5] text-[#6B625B] hover:bg-[#F4ECE4]'
                    }`}
                  >
                    {mod.isLoaded ? 'Loaded' : 'Load'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Close Button */}
        <div className="pt-2 border-t border-[#F4ECE4] text-right">
          <button
            onClick={() => setShowModelManager(false)}
            className="px-4 py-2 rounded-xl bg-[#C7512E] text-white text-xs font-bold hover:bg-[#A83F20] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
