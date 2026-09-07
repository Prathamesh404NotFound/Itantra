import { LanguageCode, LANGUAGES } from '../types';

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  isDirectTranslation: boolean;
  latencyMs: number;
}

export interface LanguageDetectionResult {
  detectedLanguage: LanguageCode;
  confidence: number;
  detectionLatencyMs: number;
}

export class OfflineTranslationEngine {
  private static readonly PHRASE_CLUSTERS: Record<string, Partial<Record<LanguageCode, string>>> = {
    NEED_HELP: {
      mr: 'मला मदत हवी आहे.',
      hi: 'मुझे मदद चाहिए।',
      gu: 'મને મદદની જરૂર છે.',
      ta: 'எனக்கு உதவி தேவை.',
      te: 'నాకు సహాయం కావాలి.',
      kn: 'ನನಗೆ ಸಹಾಯ ಬೇಕು.',
      ml: 'എനിക്ക് സഹായം ആവശ്യമാണ്.',
      bn: 'আমার সাহায্য প্রয়োজন।',
      or: 'ମୋତେ ସାହାଯ୍ୟ ଦରକାର।',
      en: 'I need help.',
    },
    FIRE_ALERT: {
      mr: 'आग लागली आहे, त्वरित मदत पाठवा!',
      hi: 'आग लगी है, तुरंत सहायता भेजें!',
      gu: 'આગ લાગી છે, તાત્કાલિક સહાય મોકલો!',
      ta: 'தீ விபத்து ஏற்பட்டது, உடனடி உதவி தேவை!',
      te: 'మంటలు చెలరేగాయి, తక్షణ సహాయం పంపండి!',
      kn: 'ಬೆಂಕಿ ಅವಘಡ ಸಂಭವಿಸಿದೆ, ತಕ್ಷಣ ಸಹಾಯ ಕಳುಹಿಸಿ!',
      ml: 'തീപിടുത്തം ഉണ്ടായി, ഉടൻ സഹായം അയക്കുക!',
      bn: 'আগুন লেগেছে, অবিলম্বে সাহায্য পাঠান!',
      or: 'ନିଆଁ ଲାଗିଛି, ତୁରନ୍ତ ସାହାଯ୍ୟ ପଠାନ୍ତୁ!',
      en: 'Fire detected, send immediate assistance!',
    },
    MEDICAL_ALERT: {
      mr: 'वैद्यकीय आणीबाणी, डॉक्टर किंवा रुग्णवाहिका आवश्यक आहे.',
      hi: 'चिकित्सा आपातकाल, डॉक्टर या एम्बुलेंस की तत्काल आवश्यकता है।',
      gu: 'તબીબી કટોકટી, તાત્કાલિક એમ્બ્યુલન્સની જરૂર છે.',
      ta: 'மருத்துவ அவசரநிலை, ஆம்புலன்ஸ் தேவைப்படுகிறது.',
      te: 'వైద్య అత్యవసర పరిస్థితి, వెంటనే అంబులెన్స్ కావాలి.',
      kn: 'ವೈದ್ಯಕೀಯ ತುರ್ತು ಪರಿಸ್ಥಿತಿ, ಅಂಬ್ಯುಲೆನ್ಸ್ ತಕ್ಷಣ ಬೇಕಾಗಿದೆ.',
      ml: 'വൈദ്യസഹായം അടിയന്തിരമായി ആവശ്യമുണ്ട്, ആംബുലൻസ് വേണം.',
      bn: 'জরুরি চিকিৎসা প্রয়োজন, অবিলম্বে অ্যাম্বুলেন্স পাঠান।',
      or: 'ଡାକ୍ତରୀ ଜରୁରୀକାଳୀନ ପରିସ୍ଥିତି, ଆମ୍ବୁଲାନ୍ସ ଆବଶ୍ୟକ।',
      en: 'Medical emergency, immediate doctor or ambulance needed.',
    },
    LOCATION_SAFE: {
      mr: 'मी सुरक्षित ठिकाणी पोहोचलो आहे.',
      hi: 'मैं सुरक्षित स्थान पर पहुँच गया हूँ।',
      gu: 'હું સુરક્ષિત સ્થળે પહોંચી ગયો છું.',
      ta: 'நான் பாதுகாப்பான இடத்தை அடைந்துவிட்டேன்.',
      te: 'నేను సురక్షిత ప్రాంతానికి చేరుకున్నాను.',
      kn: 'ನಾನು ಸುರಕ್ಷಿತ ಸ್ಥಳಕ್ಕೆ ತಲುಪಿದ್ದೇನೆ.',
      ml: 'ഞാൻ സുരക്ഷിതമായ സ്ഥലത്തെത്തി.',
      bn: 'আমি নিরাপদ স্থানে পৌঁছে গেছি।',
      or: 'ମୁଁ ସୁରକ୍ଷିତ ସ୍ଥାନରେ ପହଞ୍ଚିଛି।',
      en: 'I have arrived safely at the location.',
    },
    AWAITING_ORDERS: {
      mr: 'पुढील सूचनांची वाट पाहत आहे.',
      hi: 'आगे के निर्देशों की प्रतीक्षा कर रहा हूँ।',
      gu: 'આગળની સૂચનાઓની રાહ જોઈ રહ્યો છું.',
      ta: 'அடுத்த அறிவுறுத்தல்களுக்காக காத்திருக்கிறேன்.',
      te: 'తదుపరి సూచనల కోసం వేచి చూస్తున్నాను.',
      kn: 'ಮುಂದಿನ ಸೂಚನೆಗಳಿಗಾಗಿ ಕಾಯುತ್ತಿದ್ದೇನೆ.',
      ml: 'കൂടുതൽ വിവരങ്ങൾക്കായി കാത്തിരിക്കുന്നു.',
      bn: 'পরবর্তী নির্দেশনার জন্য অপেক্ষা করছি।',
      or: 'ପରବର୍ତ୍ତୀ ନିର୍ଦ୍ଦେଶକୁ ଅପେକ୍ଷା କରୁଛି।',
      en: 'Standing by for further instructions.',
    },
    WATER_SUPPLY: {
      mr: 'आम्हाला पिण्याच्या पाण्याची तातडीने गरज आहे.',
      hi: 'हमें पीने के पानी की तत्काल आवश्यकता है।',
      gu: 'અમને પીવાના પાણીની તાત્કાલિક જરૂર છે.',
      ta: 'குடிநீர் அவசரமாக தேவைப்படுகிறது.',
      te: 'తాగునీరు తక్షణమే అవసరం.',
      kn: 'ಕುಡಿಯುವ ನೀರು ತಕ್ಷಣವೇ ಬೇಕಾಗಿದೆ.',
      ml: 'കുടിവെള്ളം ഉടൻ ലഭ്യമാക്കണം.',
      bn: 'আমাদের পানীয় জলের জরুরি প্রয়োজন।',
      or: 'ପିଇବା ପାଣି ଜରୁରୀ ଆବଶ୍ୟକ।',
      en: 'We urgently need drinking water supply.',
    },
    EVACUATE_AREA: {
      mr: 'धोका आहे, परिसर ताबडतोब रिकामी करा!',
      hi: 'खतरा है, तुरंत इलाका खाली करें!',
      gu: 'જોખમ છે, તરત જ વિસ્તાર ખાલી કરો!',
      ta: 'ஆபத்து, உடனடியாக வெளியேறவும்!',
      te: 'ప్రమాదం, వెంటనే ఖాళీ చేయండి!',
      kn: 'ಅಪಾಯ, ತಕ್ಷಣ ಈ ಪ್ರದೇಶವನ್ನು ಖಾಲಿ ಮಾಡಿ!',
      ml: 'അപകടം, പ്രദേശം ഉടനടി ഒഴിപ്പിക്കുക!',
      bn: 'বিপদ, অবিলম্বে এলাকা খালি করুন!',
      or: 'ବିପଦ, ତୁରନ୍ତ ସ୍ଥାନ ଖାଲି କରନ୍ତୁ!',
      en: 'Danger detected, evacuate the area immediately!',
    },
    SUPPLIES_ARRIVED: {
      mr: 'मदत साहित्य आणि औषधे उपलब्ध झाली आहेत.',
      hi: 'राहत सामग्री और दवाइयाँ उपलब्ध हो गई हैं।',
      gu: 'રાહત સામગ્રી અને દવાઓ આવી ગઈ છે.',
      ta: 'நிவாரணப் பொருட்களும் மருந்துகளும் வந்துவிட்டன.',
      te: 'సహాయ సామగ్రి మరియు మందులు చేరుకున్నాయి.',
      kn: 'ಪರಿಹಾರ ಸಾಮಗ್ರಿಗಳು ಮತ್ತು ಔಷಧಿಗಳು ತಲುಪಿವೆ.',
      ml: 'ദുരിതാശ്വാസ സാധനങ്ങളും മരുന്നുകളും എത്തി.',
      bn: 'ত্রাণ সামগ্রী ও ওষুধ পৌঁছে গেছে।',
      or: 'ରିଲିଫ ସାମଗ୍ରୀ ଏବଂ ଔଷଧ ପହଞ୍ଚିଛି।',
      en: 'Relief supplies and medicines have arrived.',
    },
    CHECK_IN: {
      mr: 'तुमची सद्यस्थिती आणि स्थान कळवा.',
      hi: 'अपनी स्थिति और स्थान की पुष्टि करें।',
      gu: 'તમારી સ્થિતિ અને સ્થાનની પુષ્ટિ કરો.',
      ta: 'உங்கள் நிலையை உறுதிப்படுத்தவும்.',
      te: 'మీ స్థితి మరియు స్థానాన్ని నిర్ధారించండి.',
      kn: 'ನಿಮ್ಮ ಸ್ಥಿತಿ ಮತ್ತು ಸ್ಥಳವನ್ನು ಖಚಿತಪಡಿಸಿ.',
      ml: 'നിങ്ങളുടെ നിലയും ലൊക്കേഷനും അറിയിക്കുക.',
      bn: 'আপনার বর্তমান অবস্থা নিশ্চিত করুন।',
      or: 'ଆପଣଙ୍କ ସ୍ଥିତି ଏବଂ ସ୍ଥାନ ନିଶ୍ଚିତ କରନ୍ତୁ।',
      en: 'Confirm your status and current location.',
    },
  };

  /**
   * Fast on-device Indic translation
   */
  static translate(
    text: string,
    sourceLanguage: LanguageCode,
    targetLanguage: LanguageCode
  ): TranslationResult {
    const start = performance.now();

    if (sourceLanguage === targetLanguage) {
      return {
        originalText: text,
        translatedText: text,
        sourceLanguage,
        targetLanguage,
        isDirectTranslation: true,
        latencyMs: 1,
      };
    }

    const cleanText = text.trim();
    const cleanNoPunct = cleanText.replace(/[।.,!]/g, '').trim().toLowerCase();

    // 1. Direct semantic cluster matching
    for (const cluster of Object.values(OfflineTranslationEngine.PHRASE_CLUSTERS)) {
      const srcPhrase = cluster[sourceLanguage]?.replace(/[।.,!]/g, '')?.trim().toLowerCase();
      if (srcPhrase) {
        if (cleanNoPunct.includes(srcPhrase) || srcPhrase.includes(cleanNoPunct)) {
          const targetText = cluster[targetLanguage] || cleanText;
          return {
            originalText: text,
            translatedText: targetText,
            sourceLanguage,
            targetLanguage,
            isDirectTranslation: true,
            latencyMs: Math.max(3, Math.round(performance.now() - start)),
          };
        }
      }
    }

    // 2. Lexical / morpheme fallback pattern matching
    const translated = OfflineTranslationEngine.fallbackTranslate(cleanText, sourceLanguage, targetLanguage);
    return {
      originalText: text,
      translatedText: translated,
      sourceLanguage,
      targetLanguage,
      isDirectTranslation: false,
      latencyMs: Math.max(4, Math.round(performance.now() - start)),
    };
  }

  private static fallbackTranslate(text: string, from: LanguageCode, to: LanguageCode): string {
    if (to === 'en') {
      if (text.includes('मदत') || text.includes('मदद')) return 'Need assistance urgently.';
      if (text.includes('आग')) return 'Fire reported in area.';
      if (text.includes('सुरक्षित')) return 'Location is safe.';
      if (text.includes('पाणी') || text.includes('पानी')) return 'Water required.';
      if (text.includes('डॉक्टर') || text.includes('रुग्ण')) return 'Medical assistance needed.';
      return `[${LANGUAGES[from].displayName}]: ${text}`;
    }

    if (to === 'hi') {
      let res = text;
      res = res.replace(/मला/g, 'मुझे').replace(/आहे/g, 'है').replace(/हवी/g, 'चाहिए').replace(/आम्हाला/g, 'हमें');
      return res;
    }

    if (to === 'mr') {
      let res = text;
      res = res.replace(/मुझे/g, 'मला').replace(/है/g, 'आहे').replace(/चाहिए/g, 'हवी आहे').replace(/हमें/g, 'आम्हाला');
      return res;
    }

    if (to === 'gu') {
      if (text.includes('मदत') || text.includes('मदद')) return 'મને મદદની જરૂર છે.';
      if (text.includes('सुरक्षित')) return 'હું સુરક્ષિત સ્થળે છું.';
    }

    return text;
  }

  /**
   * Fast script-based and keyword Language Identifier
   */
  static detectLanguage(text: string): LanguageDetectionResult {
    const start = performance.now();
    const clean = text.trim();

    // Unicode script range analysis
    let detected: LanguageCode = 'en';
    let confidence = 0.85;

    for (const char of clean) {
      const code = char.charCodeAt(0);
      if (code >= 0x0900 && code <= 0x097f) {
        // Devanagari (Hindi or Marathi)
        detected = text.includes('ळ') || text.includes('आहे') || text.includes('मला') ? 'mr' : 'hi';
        confidence = 0.96;
        break;
      } else if (code >= 0x0a80 && code <= 0x0aff) {
        detected = 'gu';
        confidence = 0.98;
        break;
      } else if (code >= 0x0c80 && code <= 0x0cff) {
        detected = 'kn';
        confidence = 0.98;
        break;
      } else if (code >= 0x0d00 && code <= 0x0d7f) {
        detected = 'ml';
        confidence = 0.98;
        break;
      } else if (code >= 0x0b80 && code <= 0x0bff) {
        detected = 'ta';
        confidence = 0.98;
        break;
      } else if (code >= 0x0c00 && code <= 0x0c7f) {
        detected = 'te';
        confidence = 0.98;
        break;
      } else if (code >= 0x0b00 && code <= 0x0b7f) {
        detected = 'or';
        confidence = 0.98;
        break;
      } else if (code >= 0x0980 && code <= 0x09ff) {
        detected = 'bn';
        confidence = 0.98;
        break;
      }
    }

    return {
      detectedLanguage: detected,
      confidence,
      detectionLatencyMs: Math.max(1, Math.round(performance.now() - start)),
    };
  }
}
