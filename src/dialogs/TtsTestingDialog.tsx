import React, { useState } from 'react';
import { useCommunicator } from '../context/CommunicatorContext';
import { LANGUAGES, LanguageCode, LANGUAGE_LIST } from '../types';
import { AudioWaveform, Play, Star, Volume2, X } from 'lucide-react';
import { SpeechEngine } from '../utils/speechEngine';

export const TtsTestingDialog: React.FC = () => {
  const { showTtsTesting, setShowTtsTesting, evaluateTts, targetLanguage } = useCommunicator();
  const [selectedLang, setSelectedLang] = useState<LanguageCode>(targetLanguage);
  const [testText, setTestText] = useState('हमें पीने के पानी की तत्काल आवश्यकता है।');
  const [rating, setRating] = useState<number>(5);

  if (!showTtsTesting) return null;

  const handleAudition = () => {
    SpeechEngine.speak({
      text: testText,
      language: selectedLang,
      rate: 1.0,
      volume: 1.0,
    });
  };

  const handleSaveRating = () => {
    evaluateTts(selectedLang, testText, rating);
    setShowTtsTesting(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#FFFFFF] border border-[#E8E0D5] rounded-3xl w-full max-w-xl p-3.5 sm:p-5 shadow-2xl space-y-3.5 sm:space-y-4 max-h-[90dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-[#E8E0D5]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#C7512E] text-white flex items-center justify-center shrink-0">
              <AudioWaveform className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#26211E]">
                TTS Audio Evaluation Studio
              </h2>
              <p className="text-[10px] sm:text-xs text-[#6B625B]">Audition On-Device Speech Synthesis Quality</p>
            </div>
          </div>
          <button
            onClick={() => setShowTtsTesting(false)}
            aria-label="Close TTS studio modal"
            className="p-1 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full text-[#9E948A] hover:text-[#26211E]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Language Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#6B625B]">Synthesis Target Language</label>
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value as LanguageCode)}
            className="w-full px-3 py-2 min-h-[38px] rounded-xl bg-[#FAF7F2] border border-[#E8E0D5] text-xs font-bold text-[#26211E] focus:outline-none focus:border-[#C7512E]"
          >
            {LANGUAGE_LIST.map((l) => (
              <option key={l.code} value={l.code}>
                {l.displayName} ({l.nativeName}) • {l.ttsModelName}
              </option>
            ))}
          </select>
        </div>

        {/* Test Text Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#6B625B]">Speech Synthesis Text</label>
          <textarea
            rows={3}
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            className="w-full p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E0D5] text-xs font-medium text-[#26211E] focus:outline-none focus:border-[#C7512E]"
          />
        </div>

        {/* Quality Rating */}
        <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E0D5] flex flex-col min-[380px]:flex-row items-start min-[380px]:items-center justify-between gap-2">
          <span className="text-xs font-bold text-[#26211E]">Naturalness & Pronunciation:</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                aria-label={`Rate ${star} star`}
                className="p-1 min-w-[36px] min-h-[36px] flex items-center justify-center text-[#B45309] hover:scale-110 transition-transform"
              >
                <Star
                  className={`w-5 h-5 ${
                    star <= rating ? 'fill-[#B45309]' : 'text-[#E8E0D5]'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#F4ECE4]">
          <button
            onClick={handleAudition}
            className="flex items-center gap-1.5 px-4 py-2 min-h-[38px] rounded-xl bg-[#FAF7F2] hover:bg-[#F4ECE4] border border-[#E8E0D5] text-xs font-bold text-[#26211E] transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-[#C7512E] text-[#C7512E]" />
            <span>Audition Audio</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTtsTesting(false)}
              className="px-3.5 py-2 min-h-[38px] rounded-xl text-xs font-bold text-[#6B625B] hover:bg-[#FAF7F2] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveRating}
              className="px-4 py-2 min-h-[38px] rounded-xl bg-[#C7512E] text-white text-xs font-bold hover:bg-[#A83F20] transition-colors shadow-xs"
            >
              Save Evaluation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
