/**
 * Sentence Boundary Detector and Punctuation Formatter
 * Handles Indic Danda (।) for Devanagari/Hindi/Marathi and standard terminal punctuation.
 */
export class SentenceBoundaryDetector {
  private static readonly INDIC_DANDA = '।';
  private static readonly STANDARD_TERMINATORS = ['.', '?', '!', '।'];

  /**
   * Formats a raw transcription or sentence by ensuring appropriate terminal punctuation,
   * appending an Indic Danda (।) or full stop (.) if absent.
   *
   * @param rawText - Raw input sentence or partial utterance
   * @param defaultDanda - Whether to default to Devanagari Danda (।) instead of period (.)
   * @returns Trimmed text with terminating punctuation
   */
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

  /**
   * Determines whether the given text ends with a recognized terminal sentence boundary.
   *
   * @param text - Candidate sentence string
   * @returns True if terminating with '.', '?', '!', or '।'
   */
  static isCompleteSentence(text: string): boolean {
    const trimmed = text.trim();
    if (!trimmed) return false;
    const lastChar = trimmed.slice(-1);
    return SentenceBoundaryDetector.STANDARD_TERMINATORS.includes(lastChar);
  }
}
