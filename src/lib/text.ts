// Combining diacritical marks occupy code points 0x0300-0x036f. Built via
// fromCharCode (rather than a \u escape in a character class) to sidestep
// editor/tooling mangling of literal combining characters in source.
const COMBINING_DIACRITICAL_MARKS_PATTERN = new RegExp(
  `[${String.fromCharCode(0x0300)}-${String.fromCharCode(0x036f)}]`,
  "g"
)

/**
 * Lowercases, trims, and strips accents so "Beyonce" and "beyonce" (or
 * accented vs. unaccented city/name spellings) compare equal. Shared by
 * every search surface that ranks results client- or server-side.
 */
export function normalizeForMatching(text: string) {
  return text
    .normalize("NFD")
    .replace(COMBINING_DIACRITICAL_MARKS_PATTERN, "")
    .toLowerCase()
    .trim()
}
