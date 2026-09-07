import React, { useState } from 'react';
import { useCommunicator } from '../context/CommunicatorContext';
import { LANGUAGES, LanguageCode, LANGUAGE_LIST } from '../types';
import { CheckCircle2, Play, RefreshCw, X, Award } from 'lucide-react';

export const AccuracyTestingDialog: React.FC = () => {
  const {
    showAccuracyTesting,
    setShowAccuracyTesting,
    accuracyResults,
    runAccuracyTest,
    sourceLanguage,
  } = useCommunicator();

  const [selectedLang, setSelectedLang] = useState<LanguageCode>(sourceLanguage);
  const [lastTestedResult, setLastTestedResult] = useState(accuracyResults[0] || null);

  if (!showAccuracyTesting) return null;

  const handleRunBenchmark = () => {
    const res = runAccuracyTest(selectedLang);
    setLastTestedResult(res);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#FFFFFF] border border-[#E8E0D5] rounded-3xl w-full max-w-xl p-3.5 sm:p-5 shadow-2xl space-y-3.5 sm:space-y-4 max-h-[90dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-[#E8E0D5]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#C7512E] text-white flex items-center justify-center shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#26211E]">
                STT Word Error Rate (WER) Benchmark
              </h2>
              <p className="text-[10px] sm:text-xs text-[#6B625B]">Levenshtein Word-Level Accuracy Measurement</p>
            </div>
          </div>
          <button
            onClick={() => setShowAccuracyTesting(false)}
            aria-label="Close WER benchmark modal"
            className="p-1 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full text-[#9E948A] hover:text-[#26211E]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Language Selection & Trigger */}
        <div className="flex flex-col min-[380px]:flex-row items-stretch min-[380px]:items-center gap-2">
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value as LanguageCode)}
            className="flex-1 px-3 py-2 min-h-[38px] rounded-xl bg-[#FAF7F2] border border-[#E8E0D5] text-xs font-bold text-[#26211E] focus:outline-none focus:border-[#C7512E]"
          >
            {LANGUAGE_LIST.map((l) => (
              <option key={l.code} value={l.code}>
                {l.displayName} ({l.nativeName})
              </option>
            ))}
          </select>

          <button
            onClick={handleRunBenchmark}
            className="flex items-center justify-center gap-1.5 px-4 py-2 min-h-[38px] rounded-xl bg-[#C7512E] hover:bg-[#A83F20] text-white text-xs font-bold transition-all shadow-xs"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Run Benchmark</span>
          </button>
        </div>

        {/* Latest Benchmark Output */}
        {lastTestedResult && (
          <div className="p-3 sm:p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E0D5] space-y-2.5 sm:space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <span className="text-xs font-bold text-[#C7512E] uppercase">
                {LANGUAGES[lastTestedResult.language].displayName} Test Output
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] sm:text-xs font-semibold text-[#6B625B]">WER:</span>
                <span className="px-2 py-0.5 rounded-md bg-[#FEF3C7] text-[#B45309] font-mono font-bold text-xs">
                  {(lastTestedResult.wer * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <div>
                <span className="text-[9px] sm:text-[10px] text-[#9E948A] uppercase font-bold block">Ground Truth Reference</span>
                <p className="font-semibold text-[#26211E] mt-0.5 text-xs">{lastTestedResult.referenceText}</p>
              </div>
              <div>
                <span className="text-[9px] sm:text-[10px] text-[#9E948A] uppercase font-bold block">Hypothesis Recognized</span>
                <p className="font-semibold text-[#C7512E] mt-0.5 text-xs">{lastTestedResult.recognizedText}</p>
              </div>
            </div>

            {/* Error components stats */}
            <div className="grid grid-cols-2 min-[420px]:grid-cols-4 gap-1.5 sm:gap-2 pt-2 border-t border-[#E8E0D5] text-center text-xs">
              <div className="p-1.5 rounded-lg bg-white border border-[#E8E0D5]">
                <span className="text-[9px] text-[#9E948A] uppercase block truncate">Substitutions</span>
                <span className="font-bold text-[#26211E]">{lastTestedResult.substitutions}</span>
              </div>
              <div className="p-1.5 rounded-lg bg-white border border-[#E8E0D5]">
                <span className="text-[9px] text-[#9E948A] uppercase block truncate">Deletions</span>
                <span className="font-bold text-[#26211E]">{lastTestedResult.deletions}</span>
              </div>
              <div className="p-1.5 rounded-lg bg-white border border-[#E8E0D5]">
                <span className="text-[9px] text-[#9E948A] uppercase block truncate">Insertions</span>
                <span className="font-bold text-[#26211E]">{lastTestedResult.insertions}</span>
              </div>
              <div className="p-1.5 rounded-lg bg-white border border-[#E8E0D5]">
                <span className="text-[9px] text-[#9E948A] uppercase block truncate">Total Words</span>
                <span className="font-bold text-[#26211E]">{lastTestedResult.totalWords}</span>
              </div>
            </div>
          </div>
        )}

        {/* Historical Test Logs */}
        <div className="space-y-2 flex-1 overflow-y-auto pr-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#9E948A]">
            Recent WER Runs ({accuracyResults.length})
          </span>
          {accuracyResults.map((r) => (
            <div
              key={r.id}
              className="p-2.5 rounded-xl bg-white border border-[#E8E0D5] flex items-center justify-between gap-2 text-xs"
            >
              <div className="truncate min-w-0 flex-1">
                <span className="font-bold text-[#26211E] mr-1.5">
                  {LANGUAGES[r.language]?.displayName}:
                </span>
                <span className="text-[#6B625B]">{r.referenceText}</span>
              </div>
              <span className="font-mono font-bold text-[#B45309] shrink-0 text-xs">
                {(r.wer * 100).toFixed(1)}% WER
              </span>
            </div>
          ))}
        </div>

        {/* Close Button */}
        <div className="pt-2 border-t border-[#F4ECE4] text-right">
          <button
            onClick={() => setShowAccuracyTesting(false)}
            className="px-4 py-2 min-h-[38px] rounded-xl bg-[#C7512E] text-white text-xs font-bold hover:bg-[#A83F20] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
