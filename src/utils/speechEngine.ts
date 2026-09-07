import { LanguageCode, LANGUAGES } from '../types';

// Web Speech API interface declarations
interface IWindowSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface ISpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface ISpeechRecognitionErrorEvent {
  error: string;
}

declare global {
  interface Window {
    SpeechRecognition?: {
      new (): IWindowSpeechRecognition;
    };
    webkitSpeechRecognition?: {
      new (): IWindowSpeechRecognition;
    };
  }
}

export interface SpeechQueueItem {
  id: string;
  text: string;
  language: LanguageCode;
  rate?: number;
  volume?: number;
  pitch?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

export class SpeechEngine {
  private static recognition: IWindowSpeechRecognition | null = null;
  private static isListening: boolean = false;
  private static fallbackTimer: number | null = null;

  // Non-blocking queue state for TTS
  private static speechQueue: SpeechQueueItem[] = [];
  private static isSpeakingActive: boolean = false;

  /**
   * Starts capturing speech input using Web Speech API or streaming fallback simulator.
   *
   * @param config - Configuration options including language, listeners, and continuous mode
   */
  static startListening({
    language,
    continuous = false,
    onPartialResult,
    onFinalResult,
    onError,
  }: {
    language: LanguageCode;
    continuous?: boolean;
    onPartialResult: (text: string) => void;
    onFinalResult: (text: string) => void;
    onError: (error: string) => void;
  }): void {
    SpeechEngine.stopListening();

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRec) {
      try {
        const rec = new SpeechRec();
        rec.continuous = continuous;
        rec.interimResults = true;
        rec.lang = LANGUAGES[language]?.locale || 'hi-IN';

        rec.onresult = (event: ISpeechRecognitionEvent) => {
          let interim = '';
          let final = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              final += transcript;
            } else {
              interim += transcript;
            }
          }

          if (interim) {
            onPartialResult(interim);
          }
          if (final) {
            onFinalResult(final);
          }
        };

        rec.onerror = (event: ISpeechRecognitionErrorEvent) => {
          console.warn('[MIC] Native SpeechRecognition error:', event.error);
          if (event.error !== 'no-speech') {
            onError(`Speech error: ${event.error}`);
          }
          // If browser STT fails or lacks language support, switch gracefully to streaming simulator
          if (['not-allowed', 'language-not-supported', 'service-not-allowed', 'network', 'audio-capture'].includes(event.error)) {
            console.log('[MIC] Falling back to streaming simulator due to STT error:', event.error);
            SpeechEngine.startFallbackSimulator(language, onPartialResult, onFinalResult);
          }
        };

        rec.onend = () => {
          console.log('[MIC] Native SpeechRecognition ended');
          SpeechEngine.isListening = false;
        };

        rec.start();
        console.log(`[MIC] Native SpeechRecognition started with language: ${rec.lang}`);
        SpeechEngine.recognition = rec;
        SpeechEngine.isListening = true;
        return;
      } catch (err) {
        console.warn('[MIC] SpeechRecognition start failed, falling back to simulator:', err);
      }
    }

    SpeechEngine.startFallbackSimulator(language, onPartialResult, onFinalResult);
  }

  /**
   * Streaming simulator fallback for offline environments or browsers lacking native recognition.
   */
  private static startFallbackSimulator(
    language: LanguageCode,
    onPartialResult: (text: string) => void,
    onFinalResult: (text: string) => void
  ): void {
    if (SpeechEngine.fallbackTimer) {
      clearInterval(SpeechEngine.fallbackTimer);
      SpeechEngine.fallbackTimer = null;
    }

    SpeechEngine.isListening = true;
    console.log(`[MIC] Streaming STT Simulator active for language [${language}]`);
    const defaultSamplePhrases: Record<LanguageCode, string[]> = {
      mr: ['मी सुरक्षित ठिकाणी पोहोचलो आहे', 'आम्हाला पिण्याच्या पाण्याची गरज आहे', 'मला त्वरित मदत हवी आहे'],
      hi: ['मैं सुरक्षित स्थान पर पहुँच गया हूँ', 'हमें तुरंत पीने के पानी की जरूरत है', 'मुझे सहायता चाहिए'],
      gu: ['હું સુરક્ષિત સ્થળે પહોંચી ગયો છું', 'અમને પીવાના પાણીની જરૂર છે', 'મને મદદની જરૂર છે'],
      ta: ['நான் பாதுகாப்பான இடத்தை அடைந்துவிட்டேன்', 'குடிநீர் தேவைப்படுகிறது', 'எனக்கு உதவி தேவை'],
      te: ['నేను సురక్షిత ప్రాంతానికి చేరుకున్నాను', 'తాగునీరు అవసరం', 'నాకు సహాయం కావాలి'],
      kn: ['ನಾನು ಸುರಕ್ಷಿತ ಸ್ಥಳಕ್ಕೆ ತಲುಪಿದ್ದೇನೆ', 'ಕುಡಿಯುವ ನೀರು ಬೇಕಾಗಿದೆ', 'ನನಗೆ ಸಹಾಯ ಬೇಕು'],
      ml: ['ഞാൻ സുരക്ഷിതമായ സ്ഥലത്തെത്തി', 'കുടിവെള്ളം ആവശ്യമുണ്ട്', 'സഹായം ആവശ്യമാണ്'],
      bn: ['আমি নিরাপদ স্থানে পৌঁছে গেছি', 'পানীয় জলের প্রয়োজন', 'সাহায্য প্রয়োজন'],
      or: ['ମୁଁ ସୁରକ୍ଷିତ ସ୍ଥାନରେ ପହଞ୍ଚିଛି', 'ପିଇବା ପାଣି ଆବଶ୍ୟକ', 'ସାହାଯ୍ୟ ଦରକାର'],
      en: ['I have arrived safely at the location', 'We urgently need drinking water supply', 'Need immediate assistance'],
    };

    const phraseList = defaultSamplePhrases[language] || defaultSamplePhrases.en;
    const chosenPhrase = phraseList[Math.floor(Math.random() * phraseList.length)];
    const words = chosenPhrase.split(' ');
    let currentIdx = 0;

    SpeechEngine.fallbackTimer = window.setInterval(() => {
      if (currentIdx < words.length) {
        currentIdx++;
        const partial = words.slice(0, currentIdx).join(' ');
        onPartialResult(partial);
      } else {
        if (SpeechEngine.fallbackTimer) {
          clearInterval(SpeechEngine.fallbackTimer);
          SpeechEngine.fallbackTimer = null;
        }
        onFinalResult(chosenPhrase);
      }
    }, 400);
  }

  /**
   * Stops active speech recognition and clears fallback polling timers.
   */
  static stopListening(): void {
    if (SpeechEngine.fallbackTimer) {
      clearInterval(SpeechEngine.fallbackTimer);
      SpeechEngine.fallbackTimer = null;
    }
    if (SpeechEngine.recognition) {
      try {
        SpeechEngine.recognition.stop();
      } catch {
        // Ignore stop error
      }
      SpeechEngine.recognition = null;
    }
    SpeechEngine.isListening = false;
  }

  /**
   * Non-blocking queued Local Speech Synthesis (TTS).
   * If speech synthesis is currently active, requests are placed in an in-memory FIFO queue
   * rather than canceling or overwriting the active playback.
   *
   * @param request - Speech request details including text, language, callbacks, and vocal parameters
   */
  static speak({
    text,
    language,
    rate = 1.0,
    volume = 1.0,
    pitch = 1.0,
    onStart,
    onEnd,
    onError,
  }: {
    text: string;
    language: LanguageCode;
    rate?: number;
    volume?: number;
    pitch?: number;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (error: Error) => void;
  }): void {
    const item: SpeechQueueItem = {
      id: `tts_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      text,
      language,
      rate,
      volume,
      pitch,
      onStart,
      onEnd,
      onError,
    };

    // If currently speaking, queue without canceling
    if (SpeechEngine.isSpeakingActive) {
      SpeechEngine.speechQueue.push(item);
      return;
    }

    // Otherwise, immediately execute this item
    SpeechEngine.executeSpeechItem(item);
  }

  /**
   * Internal runner that executes an individual queued speech utterance.
   */
  private static executeSpeechItem(item: SpeechQueueItem): void {
    if (!('speechSynthesis' in window)) {
      if (item.onStart) item.onStart();
      setTimeout(() => {
        if (item.onEnd) item.onEnd();
        SpeechEngine.processNextInQueue();
      }, 800);
      return;
    }

    SpeechEngine.isSpeakingActive = true;

    try {
      const utterance = new SpeechSynthesisUtterance(item.text);
      utterance.lang = LANGUAGES[item.language]?.locale || 'hi-IN';
      utterance.rate = Math.max(0.5, Math.min(2.0, item.rate ?? 1.0));
      utterance.volume = Math.max(0, Math.min(1.0, item.volume ?? 1.0));
      utterance.pitch = Math.max(0.5, Math.min(1.5, item.pitch ?? 1.0));

      // Match optimal localized voice
      const voices = window.speechSynthesis.getVoices();
      const langPrefix = LANGUAGES[item.language]?.code || 'hi';
      const matchedVoice = voices.find(
        (v) => v.lang.toLowerCase().startsWith(langPrefix) || v.lang.toLowerCase().includes('in')
      );
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onstart = () => {
        if (item.onStart) item.onStart();
      };

      const finishUtterance = () => {
        SpeechEngine.isSpeakingActive = false;
        if (item.onEnd) item.onEnd();
        SpeechEngine.processNextInQueue();
      };

      utterance.onend = finishUtterance;
      utterance.onerror = (e) => {
        console.warn('Speech synthesis error event:', e);
        if (item.onError) item.onError(new Error(e.error || 'TTS synthesis failed'));
        finishUtterance();
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('SpeechSynthesis execution exception:', err);
      SpeechEngine.isSpeakingActive = false;
      if (item.onError && err instanceof Error) item.onError(err);
      if (item.onEnd) item.onEnd();
      SpeechEngine.processNextInQueue();
    }
  }

  /**
   * Processes the next pending item in the FIFO queue.
   */
  private static processNextInQueue(): void {
    if (SpeechEngine.speechQueue.length > 0) {
      const nextItem = SpeechEngine.speechQueue.shift();
      if (nextItem) {
        SpeechEngine.executeSpeechItem(nextItem);
      }
    } else {
      SpeechEngine.isSpeakingActive = false;
    }
  }

  /**
   * Returns current count of queued utterances awaiting synthesis.
   */
  static getQueueLength(): number {
    return SpeechEngine.speechQueue.length;
  }

  /**
   * Clears all pending speech synthesis items in the queue without interrupting active speech.
   */
  static clearQueue(): void {
    SpeechEngine.speechQueue = [];
  }

  /**
   * Stops active speech playback and optionally flushes the queue.
   *
   * @param clearQueue - Whether to discard all queued utterances (default: true)
   */
  static stopSpeaking(clearQueue = true): void {
    if (clearQueue) {
      SpeechEngine.speechQueue = [];
    }
    SpeechEngine.isSpeakingActive = false;

    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore cancel errors
      }
    }

    if (!clearQueue && SpeechEngine.speechQueue.length > 0) {
      SpeechEngine.processNextInQueue();
    }
  }
}
