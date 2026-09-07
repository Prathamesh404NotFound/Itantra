/**
 * Sentence Boundary Detector and Punctuation Formatter
 * Handles Indic Danda (।) for Devanagari/Hindi/Marathi and standard terminal punctuation.
 */
export class SentenceBoundaryDetector {
  private static readonly INDIC_DANDA = '।';
  private static readonly STANDARD_TERMINATORS = ['.', '?', '!', '।'];

  static formatSentence(rawText: string, defaultDanda: boolean = false): string {
    const trimmed = rawText.trim();
    if (!trimmed) return '';

    const lastChar = trimmed.slice(-1);
    if (SentenceBoundaryDetector.STANDARD_TERMINATORS.includes(lastChar)) {
      return trimmed;
    }

    return defaultDanda
      ? `${trimmed} ${SentenceBoundaryDetector.INDIC_DANDA}`
      : `${trimmed}.`;
  }

  static isCompleteSentence(text: string): boolean {
    const trimmed = text.trim();
    if (!trimmed) return false;
    const lastChar = trimmed.slice(-1);
    return SentenceBoundaryDetector.STANDARD_TERMINATORS.includes(lastChar);
  }
}
