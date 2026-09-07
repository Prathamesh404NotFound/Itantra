import React, { useState } from 'react';
import { useCommunicator } from '../context/CommunicatorContext';
import { Smartphone, Wifi, Bluetooth, X, CheckCircle, Globe, Copy, Check } from 'lucide-react';

export const TwoPhonesSetupDialog: React.FC = () => {
  const { showTwoPhonesGuide, setShowTwoPhonesGuide } = useCommunicator();
  const [activeTab, setActiveTab] = useState<'WIFI' | 'BLUETOOTH' | 'MULTI_TAB'>('WIFI');
  const [copied, setCopied] = useState(false);

  if (!showTwoPhonesGuide) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#FFFFFF] border border-[#E8E0D5] rounded-3xl w-full max-w-xl p-3.5 sm:p-5 shadow-2xl space-y-3.5 sm:space-y-4 max-h-[90dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-[#E8E0D5]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#C7512E] text-white flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#26211E]">
                Two Phones Connection Field Guide
              </h2>
              <p className="text-[10px] sm:text-xs text-[#6B625B]">Direct P2P Link Without Internet or Cell Towers</p>
            </div>
          </div>
          <button
            onClick={() => setShowTwoPhonesGuide(false)}
            aria-label="Close connection guide modal"
            className="p-1 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full text-[#9E948A] hover:text-[#26211E]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-[#FAF7F2] rounded-xl border border-[#E8E0D5] text-[10px] sm:text-xs">
          <button
            onClick={() => setActiveTab('WIFI')}
            className={`py-1.5 sm:py-2 px-1 rounded-lg font-bold transition-all flex items-center justify-center gap-1 min-h-[36px] ${
              activeTab === 'WIFI'
                ? 'bg-[#C7512E] text-white shadow-xs'
                : 'text-[#6B625B] hover:text-[#26211E]'
            }`}
          >
            <Wifi className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Wi-Fi Direct</span>
          </button>

          <button
            onClick={() => setActiveTab('BLUETOOTH')}
            className={`py-1.5 sm:py-2 px-1 rounded-lg font-bold transition-all flex items-center justify-center gap-1 min-h-[36px] ${
              activeTab === 'BLUETOOTH'
                ? 'bg-[#C7512E] text-white shadow-xs'
                : 'text-[#6B625B] hover:text-[#26211E]'
            }`}
          >
            <Bluetooth className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Bluetooth</span>
          </button>

          <button
            onClick={() => setActiveTab('MULTI_TAB')}
            className={`py-1.5 sm:py-2 px-1 rounded-lg font-bold transition-all flex items-center justify-center gap-1 min-h-[36px] ${
              activeTab === 'MULTI_TAB'
                ? 'bg-[#C7512E] text-white shadow-xs'
                : 'text-[#6B625B] hover:text-[#26211E]'
            }`}
          >
            <Globe className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">2 Tabs</span>
          </button>
        </div>

        {/* Instructions Content */}
        <div className="overflow-y-auto space-y-3 flex-1 pr-1 text-xs">
          {activeTab === 'WIFI' && (
            <div className="space-y-2.5">
              <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8E0D5] space-y-1">
                <span className="font-bold text-[#26211E] text-xs">
                  Step 1: Turn ON Hotspot on Phone 1
                </span>
                <p className="text-[#6B625B] leading-relaxed">
                  Turn ON Personal Hotspot on Phone 1. Mobile cellular data can be turned completely
                  OFF — the phones only need an ad-hoc local IP link (192.168.49.x).
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8E0D5] space-y-1">
                <span className="font-bold text-[#26211E] text-xs">
                  Step 2: Connect Phone 2 to Hotspot
                </span>
                <p className="text-[#6B625B] leading-relaxed">
                  On Phone 2, connect to Phone 1&apos;s Wi-Fi network. Both devices now share a zero-latency
                  direct wireless radio link.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8E0D5] space-y-1">
                <span className="font-bold text-[#26211E] text-xs">
                  Step 3: Open iTantra on Both Phones
                </span>
                <p className="text-[#6B625B] leading-relaxed">
                  Open iTantra on both devices. The app automatically listens on port 8888. Hold the
                  PTT button on Phone 1 in Marathi — Phone 2 instantly speaks the translation in Hindi!
                </p>
              </div>
            </div>
          )}

          {activeTab === 'BLUETOOTH' && (
            <div className="space-y-2.5">
              <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8E0D5] space-y-1">
                <span className="font-bold text-[#26211E] text-xs">Step 1: Pair Bluetooth</span>
                <p className="text-[#6B625B] leading-relaxed">
                  Pair Phone 1 and Phone 2 in standard Android/iOS Bluetooth device settings.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8E0D5] space-y-1">
                <span className="font-bold text-[#26211E] text-xs">
                  Step 2: Select Bluetooth in iTantra
                </span>
                <p className="text-[#6B625B] leading-relaxed">
                  Go to Devices screen &rarr; Switch transport to &ldquo;Bluetooth Mesh&rdquo;. The RFCOMM SPP socket
                  channel connects automatically.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8E0D5] space-y-1">
                <span className="font-bold text-[#26211E] text-xs">
                  Step 3: Communicate Ultra-Low Power
                </span>
                <p className="text-[#6B625B] leading-relaxed">
                  Because iTantra transmits only 76-byte compressed binary packets, Bluetooth handles
                  voice transmissions effortlessly with battery savings of over 85%.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'MULTI_TAB' && (
            <div className="space-y-2.5">
              <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8E0D5] space-y-1">
                <span className="font-bold text-[#26211E] text-xs">
                  Instant Simulation: Open Two Browser Tabs
                </span>
                <p className="text-[#6B625B] leading-relaxed">
                  Open this application in two side-by-side browser tabs or windows. Both instances
                  simulate distinct radio units communicating through an air-gapped cross-tab mesh
                  channel!
                </p>
              </div>

              <button
                onClick={handleCopyLink}
                className="w-full p-3 rounded-xl bg-[#FCEEE8] border border-[#C7512E]/30 flex items-center justify-center gap-2 font-bold text-[#C7512E] hover:bg-[#FAF7F2] transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'App URL Copied to Clipboard!' : 'Copy Link to Open in 2nd Tab'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="pt-2 border-t border-[#F4ECE4] text-right">
          <button
            onClick={() => setShowTwoPhonesGuide(false)}
            className="px-4 py-2 rounded-xl bg-[#C7512E] text-white text-xs font-bold hover:bg-[#A83F20] transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
