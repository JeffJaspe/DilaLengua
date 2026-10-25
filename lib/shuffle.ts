import { audioKey } from "./audio-key";

/** Deterministic shuffle from a text seed, so server and browser render the same order. */
export function seededShuffle<T>(items: T[], seed: string): T[] {
  let h = parseInt(audioKey(seed), 16) || 1;
  const rand = () => {
    h ^= h << 13;
    h >>>= 0;
    h ^= h >>> 17;
    h ^= h << 5;
    h >>>= 0;
    return h / 4294967296;
  };
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
