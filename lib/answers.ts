// Answer checking without AI: normalise text, compare with accepted answers,
// and be forgiving about accents (with a hint) but strict about words.

/** Lowercase, drop Spanish/English punctuation, collapse spaces. Keeps accents. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[¡!¿?.,;:"“”'’()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Remove accents and the tilde, so "adiós" → "adios" and "niño" → "nino". */
export function stripAccents(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export type TextResult = { ok: boolean; accentHint?: string };

/** Typed answers: exact match passes; a match that only misses accents passes with a hint. */
export function checkTyped(input: string, accept: string[]): TextResult {
  const got = normalize(input);
  if (!got) return { ok: false };
  for (const a of accept) {
    if (normalize(a) === got) return { ok: true };
  }
  for (const a of accept) {
    if (stripAccents(normalize(a)) === stripAccents(got)) return { ok: true, accentHint: normalize(a) };
  }
  return { ok: false };
}

/** Word builder: tiles in order must equal the answer, ignoring case and punctuation. */
export function checkBuild(tiles: string[], answer: string[]): boolean {
  return normalize(tiles.join(" ")) === normalize(answer.join(" "));
}

/** Spoken answers: the transcript, normalised without accents, must match one of the patterns. */
export function checkSpoken(transcript: string, patterns: string[]): boolean {
  const text = stripAccents(normalize(transcript));
  if (!text) return false;
  return patterns.some((p) => new RegExp(p, "i").test(text));
}

export type WordMark = { word: string; ok: boolean };

/**
 * Pronunciation practice: which expected words came through in the transcript, in order.
 * Uses a longest-common-subsequence alignment so an extra or missing word doesn't shift the rest.
 */
export function compareSpeech(expected: string, transcript: string): { words: WordMark[]; score: number } {
  const exp = normalize(expected).split(" ").filter(Boolean);
  const got = stripAccents(normalize(transcript)).split(" ").filter(Boolean);
  const e = exp.map((w) => stripAccents(w));
  const dp: number[][] = Array.from({ length: e.length + 1 }, () => new Array(got.length + 1).fill(0));
  for (let i = e.length - 1; i >= 0; i--) {
    for (let j = got.length - 1; j >= 0; j--) {
      dp[i][j] = e[i] === got[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const okIdx = new Set<number>();
  let i = 0;
  let j = 0;
  while (i < e.length && j < got.length) {
    if (e[i] === got[j]) {
      okIdx.add(i);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  const words = exp.map((word, k) => ({ word, ok: okIdx.has(k) }));
  const score = exp.length ? Math.round((okIdx.size / exp.length) * 100) : 0;
  return { words, score };
}
