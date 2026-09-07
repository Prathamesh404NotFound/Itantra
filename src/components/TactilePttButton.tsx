import React, { useEffect } from 'react';
import { useCommunicator } from '../context/CommunicatorContext';
import { Mic, Radio, Loader2, Volume2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const TactilePttButton: React.FC = () => {
  const {
    voiceState,
    onPttDown,
    onPttUp,
    resetFsmToIdle,
    liveAmplitude,
    communicationMode,
    partialTranscript,
  } = useCommunicator();

  const isCapturing = voiceState === 'CAPTURING';
  const isProcessing = voiceState === 'PROCESSING' || voiceState === 'TRANSMITTING';
  const isSynthesizing = voiceState === 'SYNTHESIZING';
  const isError = voiceState === 'ERROR';

  // Keyboard spacebar shortcut for hands-free or accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        if (!e.repeat && voiceState === 'IDLE') {
          e.preventDefault();
          onPttDown();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && voiceState === 'CAPTURING') {
        e.preventDefault();
        onPttUp();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [voiceState, onPttDown, onPttUp]);

  return (
    <div className="flex flex-col items-center justify-center my-3 select-none">
      {/* Waveform Visualization Bars */}
      <div className="h-10 flex items-center justify-center gap-1.5 mb-2 w-full max-w-xs">
        {isCapturing ? (
          Array.from({ length: 16 }).map((_, i) => {
            // Dynamic bar height based on live amplitude + index variance
            const variance = Math.sin(i * 0.6) * 0.3 + 0.7;
            const barHeight = Math.max(6, Math.min(36, (liveAmplitude * 40 + 8) * variance));
            return (
              <motion.div
                key={i}
                className="w-1.5 rounded-full bg-[#C7512E]"
                animate={{ height: barHeight }}
                transition={{ duration: 0.08, ease: 'easeOut' }}
              />
            );
          })
        ) : isProcessing ? (
          <div className="flex items-center gap-2 text-xs font-semibold text-[#B45309]">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Transcribing & Translating...</span>
          </div>
        ) : isSynthesizing ? (
          <div className="flex items-center gap-2 text-xs font-semibold text-[#16A34A]">
            <Volume2 className="w-4 h-4 animate-pulse" />
            <span>Playing Translated Speech...</span>
          </div>
        ) : isError ? (
          <div className="flex items-center gap-2 text-xs font-semibold text-[#DC2626]">
            <AlertCircle className="w-4 h-4" />
            <span>Service Issue • Tap to Reset</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-medium text-[#9E948A]">
            <Radio className="w-3.5 h-3.5" />
            <span>
              {communicationMode === 'CONTINUOUS'
                ? 'Continuous VAD Mode Active'
                : 'Press & Hold or Press Space to Transmit'}
            </span>
          </div>
        )}
      </div>

      {/* Tactile Button with concentric pulse rings */}
      <div className="relative flex items-center justify-center">
        <AnimatePresence>
          {isCapturing && (
            <>
              <motion.div
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 1.5, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
                className="absolute inset-0 rounded-full bg-[#C7512E]/30 pointer-events-none"
              />
              <motion.div
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 1.8, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0.4, ease: 'easeOut' }}
                className="absolute inset-0 rounded-full bg-[#C7512E]/20 pointer-events-none"
              />
            </>
          )}
        </AnimatePresence>

        <button
          id="btn_tactile_ptt"
          onMouseDown={(e) => {
            e.preventDefault();
            if (isError) {
              resetFsmToIdle('User clicked error reset');
            } else {
              onPttDown();
            }
          }}
          onMouseUp={(e) => {
            e.preventDefault();
            if (!isError) onPttUp();
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            if (isError) {
              resetFsmToIdle('User clicked error reset');
            } else {
              onPttDown();
            }
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            if (!isError) onPttUp();
          }}
          className={`relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center text-white transition-all shadow-lg active:scale-95 touch-none ${
            isCapturing
              ? 'bg-[#A83F20] shadow-[#C7512E]/40 ring-4 ring-[#FCEEE8]'
              : isProcessing
              ? 'bg-[#B45309] ring-2 ring-[#FEF3C7]'
              : isSynthesizing
              ? 'bg-[#16A34A] ring-2 ring-[#DCFCE7]'
              : isError
              ? 'bg-[#DC2626] ring-4 ring-[#FEE2E2]'
              : 'bg-[#C7512E] hover:bg-[#A83F20] shadow-md'
          }`}
        >
          {isCapturing ? (
            <motion.div
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="flex flex-col items-center"
            >
              <Mic className="w-8 h-8 sm:w-9 sm:h-9 text-white" />
              <span className="text-[11px] font-bold tracking-wider uppercase mt-1">
                Listening
              </span>
            </motion.div>
          ) : isProcessing ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
              <span className="text-[10px] font-bold tracking-wider uppercase mt-1">
                Encoding
              </span>
            </div>
          ) : isSynthesizing ? (
            <div className="flex flex-col items-center">
              <Volume2 className="w-8 h-8 animate-pulse text-white" />
              <span className="text-[10px] font-bold tracking-wider uppercase mt-1">
                Speaking
              </span>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center">
              <AlertCircle className="w-8 h-8 text-white" />
              <span className="text-[10px] font-bold tracking-wider uppercase mt-1">
                Reset
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Mic className="w-8 h-8 sm:w-9 sm:h-9 text-white" />
              <span className="text-[11px] font-bold tracking-wider uppercase mt-1">
                Push To Talk
              </span>
            </div>
          )}
        </button>
      </div>

      {/* Partial speech real-time preview if talking */}
      {isCapturing && partialTranscript && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 px-3.5 py-1.5 rounded-full bg-[#FCEEE8] border border-[#C7512E]/30 text-xs font-semibold text-[#A83F20] max-w-sm text-center truncate"
        >
          &ldquo;{partialTranscript}&rdquo;
        </motion.div>
      )}
    </div>
  );
};
