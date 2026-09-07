import React, { useState } from 'react';
import { useCommunicator } from '../context/CommunicatorContext';
import { LANGUAGES, LANGUAGE_LIST, LanguageCode } from '../types';
import { TactilePttButton } from '../components/TactilePttButton';
import { MessageCard } from '../components/MessageCard';
import {
  ArrowLeftRight,
  ChevronDown,
  CheckCircle2,
  Send,
  Radio,
  Sliders,
  Sparkles,
  Info,
} from 'lucide-react';

export const CommunicationScreen: React.FC = () => {
  const {
    sourceLanguage,
    targetLanguage,
    setSourceLanguage,
    setTargetLanguage,
    swapLanguages,
    communicationMode,
    setCommunicationMode,
    statusBannerText,
    messages,
    playVoicePacket,
    transmitCustomText,
    connectedDevice,
    setShowTwoPhonesGuide,
    setShowDemoDialog,
  } = useCommunicator();

  const [customInput, setCustomInput] = useState('');
  const [showLanguagePicker, setShowLanguagePicker] = useState<null | 'source' | 'target'>(null);

  const srcLang = LANGUAGES[sourceLanguage];
  const dstLang = LANGUAGES[targetLanguage];

  const quickPhrases = [
    { label: 'Location Safe', text: 'मी सुरक्षित ठिकाणी पोहोचलो आहे.' },
    { label: 'Water Needed', text: 'आम्हाला पिण्याच्या पाण्याची तातडीने गरज आहे.' },
    { label: 'Need Help', text: 'मला मदत हवी आहे.' },
    { label: 'Evacuate Area', text: 'धोका आहे, परिसर ताबडतोब रिकामी करा!' },
    { label: 'Stand By', text: 'पुढील सूचनांची वाट पाहत आहे.' },
  ];

  const handleCustomSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    transmitCustomText(customInput.trim(), false);
    setCustomInput('');
  };

  return (
    <div id="screen_communication" className="space-y-3.5 sm:space-y-4">
      {/* Interactive Walkthrough / Two Phones Banner */}
      <div className="flex flex-col min-[480px]:flex-row min-[480px]:items-center justify-between gap-2 p-2.5 sm:p-3 rounded-2xl bg-[#F4ECE4] border border-[#E8E0D5] text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#C7512E] shrink-0" />
          <span className="font-semibold text-[#26211E] text-xs">
            Direct P2P Mesh Walkie-Talkie
          </span>
        </div>
        <div className="flex items-center gap-1.5 self-end min-[480px]:self-auto">
          <button
            onClick={() => setShowDemoDialog(true)}
            aria-label="Open Interactive Demo"
            className="px-2.5 py-1.5 min-h-[34px] rounded-lg bg-[#FFFFFF] border border-[#E8E0D5] font-bold text-[#C7512E] hover:bg-[#FCEEE8] transition-colors active:scale-95"
          >
            Interactive Demo
          </button>
          <button
            onClick={() => setShowTwoPhonesGuide(true)}
            aria-label="Open 2 Phones Field Setup Guide"
            className="px-2.5 py-1.5 min-h-[34px] rounded-lg bg-[#C7512E] text-white font-bold hover:bg-[#A83F20] transition-colors active:scale-95"
          >
            2 Phones Guide
          </button>
        </div>
      </div>

      {/* Language Selector Card */}
      <div className="rounded-2xl p-2.5 sm:p-4 bg-[#FFFFFF] border border-[#E8E0D5] shadow-xs">
        <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#9E948A] mb-1.5 sm:mb-2 px-1">
          <span>Your Spoken Voice</span>
          <span>Target Receiver Voice</span>
        </div>

        <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-1.5 sm:gap-2">
          {/* Source Language Button */}
          <button
            id="btn_source_language"
            onClick={() => setShowLanguagePicker('source')}
            aria-label={`Select speaking language, currently ${srcLang.displayName}`}
            className="p-2.5 sm:p-3 rounded-xl bg-[#FAF7F2] hover:bg-[#F4ECE4] border border-[#E8E0D5] text-left transition-all group min-w-0"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs text-[#9E948A] font-semibold">Speaking</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#9E948A] group-hover:text-[#C7512E] shrink-0" />
            </div>
            <div className="text-sm sm:text-base font-bold text-[#26211E] mt-0.5 truncate">
              {srcLang.displayName}
            </div>
            <div className="text-[11px] sm:text-xs font-medium text-[#C7512E] truncate">
              {srcLang.nativeName}
            </div>
          </button>

          {/* Swap Button */}
          <button
            id="btn_swap_languages"
            onClick={swapLanguages}
            title="Swap Languages"
            aria-label="Swap speaking and receiver languages"
            className="p-2 sm:p-2.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full bg-[#FCEEE8] hover:bg-[#C7512E] hover:text-white text-[#C7512E] transition-all border border-[#C7512E]/20 active:scale-90 shrink-0"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>

          {/* Target Language Button */}
          <button
            id="btn_target_language"
            onClick={() => setShowLanguagePicker('target')}
            aria-label={`Select receiver language, currently ${dstLang.displayName}`}
            className="p-2.5 sm:p-3 rounded-xl bg-[#FAF7F2] hover:bg-[#F4ECE4] border border-[#E8E0D5] text-left transition-all group min-w-0"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs text-[#9E948A] font-semibold">Receiver</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#9E948A] group-hover:text-[#C7512E] shrink-0" />
            </div>
            <div className="text-sm sm:text-base font-bold text-[#26211E] mt-0.5 truncate">
              {dstLang.displayName}
            </div>
            <div className="text-[11px] sm:text-xs font-medium text-[#B45309] truncate">
              {dstLang.nativeName}
            </div>
          </button>
        </div>
      </div>

      {/* Main Tactical PTT Section */}
      <div className="rounded-2xl p-3.5 sm:p-5 bg-[#FFFFFF] border border-[#E8E0D5] shadow-xs flex flex-col items-center">
        {/* Mode Toggle (PTT vs Continuous) */}
        <div className="flex items-center gap-1 p-1 bg-[#FAF7F2] rounded-xl border border-[#E8E0D5] mb-2 text-xs max-w-full overflow-x-auto">
          <button
            onClick={() => setCommunicationMode('PUSH_TO_TALK')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap text-[11px] sm:text-xs ${
              communicationMode === 'PUSH_TO_TALK'
                ? 'bg-[#C7512E] text-white shadow-xs'
                : 'text-[#6B625B] hover:text-[#26211E]'
            }`}
          >
            Push-To-Talk (PTT)
          </button>
          <button
            onClick={() => setCommunicationMode('CONTINUOUS')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap text-[11px] sm:text-xs ${
              communicationMode === 'CONTINUOUS'
                ? 'bg-[#C7512E] text-white shadow-xs'
                : 'text-[#6B625B] hover:text-[#26211E]'
            }`}
          >
            Hands-Free VAD
          </button>
        </div>

        {/* Live Tactile PTT Button with Waveform */}
        <TactilePttButton />

        {/* Live Status Banner */}
        <div className="mt-1 px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#E8E0D5] text-[10px] sm:text-[11px] font-semibold text-[#6B625B] text-center max-w-md w-full truncate">
          {statusBannerText}
        </div>
      </div>

      {/* Quick Test / Simulated Transmit Chips */}
      <div className="rounded-2xl p-3 sm:p-4 bg-[#FFFFFF] border border-[#E8E0D5] shadow-xs">
        <div className="flex items-center justify-between mb-2 sm:mb-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#9E948A]">
            <Radio className="w-3.5 h-3.5 text-[#C7512E]" />
            <span>Quick Tactical Phrases</span>
          </div>
          <span className="text-[10px] sm:text-[11px] text-[#9E948A]">Click to send test</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {quickPhrases.map((phrase, idx) => (
            <button
              key={idx}
              onClick={() => transmitCustomText(phrase.text, false)}
              className="px-2.5 py-1.5 min-h-[34px] rounded-xl bg-[#FAF7F2] hover:bg-[#FCEEE8] border border-[#E8E0D5] hover:border-[#C7512E]/40 text-xs font-semibold text-[#26211E] transition-colors active:scale-95"
            >
              {phrase.label}
            </button>
          ))}
        </div>

        {/* Custom Text Transmit Field */}
        <form onSubmit={handleCustomSend} className="mt-3 flex items-center gap-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder={`Type ${srcLang.displayName} text to encode & transmit...`}
            className="flex-1 min-w-0 px-3.5 py-2 min-h-[40px] rounded-xl bg-[#FAF7F2] border border-[#E8E0D5] text-xs sm:text-sm text-[#26211E] placeholder:text-[#9E948A] focus:outline-none focus:border-[#C7512E]"
          />
          <button
            type="submit"
            disabled={!customInput.trim()}
            aria-label="Transmit custom text"
            className="p-2.5 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-[#C7512E] hover:bg-[#A83F20] disabled:opacity-40 text-white transition-all shadow-xs active:scale-95 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Recent Transmissions Feed */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#9E948A]">
            Live Transmissions ({messages.length})
          </span>
          <span className="text-[11px] text-[#B45309] font-bold">
            Peer: {connectedDevice?.deviceName || 'Mesh Broadcast'}
          </span>
        </div>

        {messages.length === 0 ? (
          <div className="p-6 sm:p-8 text-center rounded-2xl bg-[#FFFFFF] border border-dashed border-[#E8E0D5]">
            <Radio className="w-8 h-8 text-[#9E948A] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#6B625B]">No transmissions yet</p>
            <p className="text-xs text-[#9E948A] mt-0.5">
              Hold the PTT button to speak in {srcLang.displayName} or pick a quick phrase
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.slice(0, 5).map((pkt) => (
              <MessageCard
                key={pkt.messageId}
                packet={pkt}
                onReplay={() => playVoicePacket(pkt)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Language Selection Modal */}
      {showLanguagePicker && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4">
          <div className="bg-[#FFFFFF] border border-[#E8E0D5] rounded-3xl w-full max-w-md p-4 sm:p-5 shadow-2xl max-h-[90dvh] sm:max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E0D5]">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#26211E]">
                  Select {showLanguagePicker === 'source' ? 'Speaking' : 'Receiver'} Language
                </h3>
                <p className="text-[11px] sm:text-xs text-[#6B625B]">10 On-Device Indian Language Models</p>
              </div>
              <button
                onClick={() => setShowLanguagePicker(null)}
                aria-label="Close Language Picker"
                className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full text-[#9E948A] hover:text-[#26211E]"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto py-2 space-y-1.5 flex-1 pr-1">
              {LANGUAGE_LIST.map((lang) => {
                const isSelected =
                  showLanguagePicker === 'source'
                    ? lang.code === sourceLanguage
                    : lang.code === targetLanguage;

                return (
                  <button
                    key={lang.code}
                    onClick={() => {
                      if (showLanguagePicker === 'source') {
                        setSourceLanguage(lang.code);
                      } else {
                        setTargetLanguage(lang.code);
                      }
                      setShowLanguagePicker(null);
                    }}
                    className={`w-full p-3 rounded-xl flex items-center justify-between text-left transition-all border min-h-[44px] ${
                      isSelected
                        ? 'bg-[#FCEEE8] border-[#C7512E] text-[#26211E]'
                        : 'bg-[#FAF7F2] border-[#E8E0D5] hover:bg-[#F4ECE4]'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-[#26211E]">
                        {lang.displayName} • {lang.nativeName}
                      </div>
                      <div className="text-[10px] sm:text-[11px] text-[#6B625B] mt-0.5">
                        {lang.scriptName} Script • Model: {lang.sttModelName} ({lang.totalModelSizeMb} MB)
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-[#C7512E] shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
