/**
 * Shared utilities (minimal - most moved to parser.ts).
 */

export { INTERLUDE_TEXT } from "./parser";
export { parseTime as parseTimeTag } from "./parser";
export { createWord, createLine } from "./parser";
export { isPunctuation as isPunctuationOnly } from "./parser";
export { normalizeText } from "./parser";

// Legacy regex for backward compatibility
export const LRC_LINE_REGEX = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;

// Re-export for backward compatibility
export { addDurations as processLyricsDurations } from "./parser";
export { mergePunctuation as mergePunctuationWords } from "./parser";
export { hasContent as hasMeaningfulContent } from "./parser";

/**
 * Normalize time key for map lookups.
 */
export const normalizeTimeKey = (time: number): number => {
  return Math.round(time * 100) / 100;
};
