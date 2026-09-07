import { LanguageCode, AccuracyResult } from '../types';

export class WerCalculator {
  static readonly BENCHMARK_SENTENCES: Record<LanguageCode, string[]> = {
    hi: [
      'मैं सुरक्षित स्थान पर पहुँच गया हूँ।',
      'हमें तत्काल पीने के पानी की आवश्यकता है।',
      'राहत शिविर स्कूल भवन में स्थापित किया गया है।',
      'खतरा टल गया है, सभी लोग शांत रहें।',
    ],
    mr: [
      'मी सुरक्षित ठिकाणी पोहोचलो आहे.',
      'आम्हाला पिण्याच्या पाण्याची तातडीने गरज आहे.',
      'मदत छावणी शाळा इमारतीमध्ये सुरू केली आहे.',
      'धोका टळला आहे, सर्वांनी शांत राहावे.',
    ],
    gu: [
      'હું સુરક્ષિત સ્થળે પહોંચી ગયો છું.',
      'અમને પીવાના પાણીની તાત્કાલિક જરૂર છે.',
      'રાહત શિબિર શાળા મકાનમાં શરૂ કરવામાં આવી છે.',
      'જોખમ ટળી ગયું છે, શાંતિ જાળવો.',
    ],
    ta: [
      'நான் பாதுகாப்பான இடத்தை அடைந்துவிட்டேன்.',
      'குடிநீர் அவசரமாக தேவைப்படுகிறது.',
      'நிவாரண முகாம் பள்ளி வளாகத்தில் அமைக்கப்பட்டுள்ளது.',
      'ஆபத்து நீங்கியது, அனைவரும் அமைதியாக இருங்கள்.',
    ],
    te: [
      'నేను సురక్షిత ప్రాంతానికి చేరుకున్నాను.',
      'తాగునీరు తక్షణమే అవసరం.',
      'సహాయ శిబిరం పాఠశాల భవనంలో ఏర్పాటు చేయబడింది.',
      'ప్రమాదం ముగిసింది, అందరూ ప్రశాంతంగా ఉండండి.',
    ],
    kn: [
      'ನಾನು ಸುರಕ್ಷಿತ ಸ್ಥಳಕ್ಕೆ ತಲುಪಿದ್ದೇನೆ.',
      'ಕುಡಿಯುವ ನೀರು ತಕ್ಷಣವೇ ಬೇಕಾಗಿದೆ.',
      'ಪರಿಹಾರ ಶಿಬಿರವನ್ನು ಶಾಲಾ ಕಟ್ಟಡದಲ್ಲಿ ತೆರೆಯಲಾಗಿದೆ.',
      'ಅಪಾಯ ತಪ್ಪಿದೆ, ಎಲ್ಲರೂ ಶಾಂತರಾಗಿರಿ.',
    ],
    ml: [
      'ഞാൻ സുരക്ഷിതമായ സ്ഥലത്തെത്തി.',
      'കുടിവെള്ളം ഉടൻ ലഭ്യമാക്കണം.',
      'ദുരിതാശ്വാസ ക്യാമ്പ് സ്കൂളിൽ പ്രവർത്തിക്കുന്നു.',
      'അപകടം ഒഴിഞ്ഞു, എല്ലാവരും ശാന്തരാകുക.',
    ],
    bn: [
      'আমি নিরাপদ স্থানে পৌঁছে গেছি।',
      'আমাদের পানীয় জলের জরুরি প্রয়োজন।',
      'ত্রাণ শিবির বিদ্যালয়ে খোলা হয়েছে।',
      'বিপদ কেটে গেছে, সকলে শান্ত থাকুন।',
    ],
    or: [
      'ମୁଁ ସୁରକ୍ଷିତ ସ୍ଥାନରେ ପହଞ୍ଚିଛି।',
      'ପିଇବା ପାଣି ଜରୁରୀ ଆବଶ୍ୟକ।',
      'ରିଲିଫ କ୍ୟାମ୍ପ ବିଦ୍ୟାଳୟରେ ଖୋଲାଯାଇଛି।',
      'ବିପଦ ଟଳିଯାଇଛି, ସମସ୍ତେ ଶାନ୍ତ ରୁହନ୍ତୁ।',
    ],
    en: [
      'I have arrived safely at the location.',
      'We urgently need drinking water supply.',
      'The relief shelter has been established at the school.',
      'The danger has passed, everyone please remain calm.',
    ],
  };

  /**
   * Calculates Word Error Rate using DP matrix on tokenized words
   */
  static calculateWer(language: LanguageCode, reference: string, hypothesis: string): AccuracyResult {
    const cleanRef = reference.replace(/[।.,!?]/g, '').trim();
    const cleanHyp = hypothesis.replace(/[।.,!?]/g, '').trim();

    const refWords = cleanRef.split(/\s+/).filter(Boolean);
    const hypWords = cleanHyp.split(/\s+/).filter(Boolean);

    const n = refWords.length;
    const m = hypWords.length;

    if (n === 0) {
      return {
        id: `wer_${Date.now()}`,
        language,
        referenceText: reference,
        recognizedText: hypothesis,
        wer: m > 0 ? 1.0 : 0.0,
        substitutions: 0,
        deletions: 0,
        insertions: m,
        totalWords: 0,
        timestamp: Date.now(),
      };
    }

    const d: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));

    for (let i = 0; i <= n; i++) d[i][0] = i;
    for (let j = 0; j <= m; j++) d[0][j] = j;

    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        if (refWords[i - 1].toLowerCase() === hypWords[j - 1].toLowerCase()) {
          d[i][j] = d[i - 1][j - 1];
        } else {
          const sub = d[i - 1][j - 1] + 1;
          const del = d[i - 1][j] + 1;
          const ins = d[i][j - 1] + 1;
          d[i][j] = Math.min(sub, del, ins);
        }
      }
    }

    // Backtrack to count substitutions, deletions, insertions
    let i = n;
    let j = m;
    let subs = 0;
    let dels = 0;
    let inss = 0;

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && refWords[i - 1].toLowerCase() === hypWords[j - 1].toLowerCase()) {
        i--;
        j--;
      } else if (i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + 1) {
        subs++;
        i--;
        j--;
      } else if (i > 0 && d[i][j] === d[i - 1][j] + 1) {
        dels++;
        i--;
      } else if (j > 0 && d[i][j] === d[i][j - 1] + 1) {
        inss++;
        j--;
      } else {
        i--;
        j--;
      }
    }

    const totalWords = n;
    const errors = subs + dels + inss;
    const wer = Math.min(1.0, errors / totalWords);

    return {
      id: `wer_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      language,
      referenceText: reference,
      recognizedText: hypothesis,
      wer: parseFloat(wer.toFixed(3)),
      substitutions: subs,
      deletions: dels,
      insertions: inss,
      totalWords,
      timestamp: Date.now(),
    };
  }
}
