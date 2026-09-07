import React, { useState, useEffect } from 'react';
import { Download, CheckCircle2, Smartphone, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Detect standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else {
      setShowModal(true);
    }
  };

  if (isInstalled) {
    return (
      <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[11px] font-bold text-[#065F46]">
        <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
        <span>Installed Offline</span>
      </div>
    );
  }

  return (
    <>
      <button
        id="btn_download_android"
        onClick={handleInstallClick}
        aria-label="Download or Install on Android"
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 min-h-[36px] rounded-xl bg-[#FAF7F2] hover:bg-[#F4ECE4] border border-[#E8E0D5] text-xs font-bold text-[#C7512E] transition-all shadow-2xs hover:shadow-xs active:scale-95"
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span className="hidden min-[480px]:inline">Get Android App</span>
        <span className="min-[480px]:hidden">Install</span>
      </button>

      {/* Guide Modal when browser prompt is not active */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#FFFFFF] border border-[#E8E0D5] rounded-3xl w-full max-w-md p-4 sm:p-5 shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#E8E0D5]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#C7512E] text-white flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#26211E]">Install on Android</h3>
                  <p className="text-[10px] text-[#6B625B]">100% Offline Standalone PWA & APK</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                aria-label="Close modal"
                className="p-1 min-w-[36px] min-h-[36px] flex items-center justify-center text-[#9E948A] hover:text-[#26211E]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-[#26211E]">
              <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E0D5] space-y-1">
                <span className="font-bold text-[#C7512E] block">Option 1: Chrome / Android Direct Install</span>
                <p className="text-[#6B625B] leading-relaxed">
                  1. Tap the browser menu (<strong className="text-[#26211E]">⋮</strong> three dots) in Chrome.<br />
                  2. Select <strong className="text-[#26211E]">Install app</strong> or <strong className="text-[#26211E]">Add to Home screen</strong>.<br />
                  3. The app will install as a native standalone Android app that opens and functions without internet.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E0D5] space-y-1">
                <span className="font-bold text-[#B45309] block">Option 2: Standalone Android APK (WebView)</span>
                <p className="text-[#6B625B] leading-relaxed">
                  You can package these built assets into a standalone Android Studio APK using <code className="bg-white px-1 py-0.5 rounded border border-[#E8E0D5]">WebViewAssetLoader</code>. It requires zero cloud connectivity and runs on Android 6.0+ (API 23+).
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="w-full py-2 min-h-[38px] rounded-xl bg-[#C7512E] hover:bg-[#A83F20] text-white text-xs font-bold transition-all shadow-xs"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
