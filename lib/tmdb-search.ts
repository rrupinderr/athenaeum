import type { TmdbSearchResult } from "@/types/library";

const STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "of",
  "and",
  "or",
  "in",
  "on",
  "at",
  "to",
  "for",
]);

/** Common search typos → correction (whole-word, case-insensitive). */
const TYPO_FIXES: [RegExp, string][] = [
  [/\bhaily\b/gi, "hail"],
  [/\bhailey\b/gi, "hail"],
  [/\bprojec\b/gi, "project"],
  [/\bmovei\b/gi, "movie"],
  [/\bmoveis\b/gi, "movies"],
];

export function buildSearchVariants(query: string): string[] {
  const base = query.trim().replace(/\s+/g, " ");
  if (!base) return [];

  const variants: string[] = [];
  const seen = new Set<string>();
  const add = (q: string) => {
    const t = q.trim().replace(/\s+/g, " ");
    if (t.length >= 2 && !seen.has(t.toLowerCase())) {
      seen.add(t.toLowerCase());
      variants.push(t);
    }
  };

  add(base);

  let corrected = base;
  for (const [pattern, replacement] of TYPO_FIXES) {
    corrected = corrected.replace(pattern, replacement);
  }
  add(corrected);

  // Drop leading filler words: "the project hail mary" → "project hail mary"
  const withoutLead = corrected.replace(/^(the|a|an|project)\s+/i, "").trim();
  add(withoutLead);

  // Last two significant words: "project hail mary" → "hail mary"
  const words = corrected.split(/\s+/).filter((w) => w.length > 2 && !STOPWORDS.has(w.toLowerCase()));
  if (words.length >= 2) {
    add(words.slice(-2).join(" "));
  }
  if (words.length >= 3) {
    add(words.slice(-3).join(" "));
  }

  return variants;
}

/** Newest first; titles without a year sort last, then alphabetically. */
export function sortTmdbResultsByYear(results: TmdbSearchResult[]): TmdbSearchResult[] {
  return [...results].sort((a, b) => {
    const ya = a.year ?? 0;
    const yb = b.year ?? 0;
    if (yb !== ya) return yb - ya;
    return a.title.localeCompare(b.title);
  });
}
