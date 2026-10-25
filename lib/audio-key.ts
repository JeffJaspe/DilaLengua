// Stable file name for a Spanish phrase's audio, shared by the browser and the audio script.
// FNV-1a hash of the trimmed text, so "¡Hola!" always maps to the same MP3.
export function audioKey(text: string): string {
  const s = text.trim();
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}
