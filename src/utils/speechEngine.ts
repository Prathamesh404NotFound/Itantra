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

export class SpeechEngine {
  private static recognition: IWindowSpeechRecognition | null = null;
  private static isListening: boolean = false;
  private static fallbackTimer: number | null = null;

  /**
   * Start capturing speech using Web Speech API or streaming fallback
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
          if (event.error !== 'no-speech') {
            onError(`Speech error: ${event.error}`);
          }
        };

        rec.onend = () => {
          SpeechEngine.isListening = false;
        };

        rec.start();
        SpeechEngine.recognition = rec;
        SpeechEngine.isListening = true;
        return;
      } catch (err) {
        console.warn('SpeechRecognition start failed, using streaming simulator:', err);
      }
    }

    // Fallback streaming simulator for environments without native speech recognizer permission
    SpeechEngine.isListening = true;
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
   * Stop speech recognition
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
   * Local Speech Synthesis (TTS)
   */
  static speak({
    text,
    language,
    rate = 1.0,
    volume = 1.0,
    pitch = 1.0,
    onStart,
    onEnd,
  }: {
    text: string;
    language: LanguageCode;
    rate?: number;
    volume?: number;
    pitch?: number;
    onStart?: () => void;
    onEnd?: () => void;
  }): void {
    if (!('speechSynthesis' in window)) {
      if (onStart) onStart();
      setTimeout(() => {
        if (onEnd) onEnd();
      }, 800);
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop any pending speech

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = LANGUAGES[language]?.locale || 'hi-IN';
      utterance.rate = Math.max(0.5, Math.min(2.0, rate));
      utterance.volume = Math.max(0, Math.min(1.0, volume));
      utterance.pitch = Math.max(0.5, Math.min(1.5, pitch));

      // Attempt matching optimal Indian accent voice if available
      const voices = window.speechSynthesis.getVoices();
      const langPrefix = LANGUAGES[language]?.code || 'hi';
      const matchedVoice = voices.find(
        (v) => v.lang.toLowerCase().startsWith(langPrefix) || v.lang.toLowerCase().includes('in')
      );
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      if (onStart) utterance.onstart = () => onStart();
      if (onEnd) utterance.onend = () => onEnd();
      utterance.onerror = () => {
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      if (onEnd) onEnd();
    }
  }

  static stopSpeaking(): void {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
    }
  }
}
