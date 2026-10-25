// Pre-generates every Spanish phrase as an MP3 with Piper (free, offline text-to-speech).
//
//   1. Install Piper:   pip install piper-tts
//   2. Download a Spain Spanish voice, e.g. es_ES-davefx-medium (see https://github.com/OHF-Voice/piper1-gpl and the
//      voices list on Hugging Face). Check the voice's licence before publishing.
//   3. Install ffmpeg.
//   4. Run:  PIPER_MODEL=./voices/es_ES-davefx-medium.onnx npm run audio:generate
//   5. Upload ./audio-out to a public Cloudflare R2 bucket and set NEXT_PUBLIC_AUDIO_BASE to its URL.
//
// Files are named by a hash of the text (lib/audio-key.ts), so re-running only creates new phrases.
// The app plays these files when they exist and falls back to the browser's voice when they don't.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { LEVELS } from "../content/index";
import { audioKey } from "../lib/audio-key";

const OUT = process.env.AUDIO_OUT ?? "audio-out";
const MODEL = process.env.PIPER_MODEL;
const PIPER = process.env.PIPER_BIN ?? "piper";
const DRY = process.argv.includes("--list");

const texts = new Set<string>();
const add = (t?: string) => t && t.trim() && texts.add(t);

for (const level of LEVELS) {
  for (const topic of level.topics) {
    for (const lesson of topic.lessons) {
      lesson.words.forEach((w) => add(w.es));
      for (const p of lesson.pages) {
        if (p.type === "explain") p.items.forEach((i) => add(i.es));
        if (p.type === "choice") add(p.say);
        if (p.type === "listen") add(p.say);
        if (p.type === "build") add(p.answer.join(" "));
        if (p.type === "speak") add(p.es);
        if (p.type === "dialogue") p.lines.forEach((l) => add(l.es));
        if (p.type === "conjugate") add(p.verb);
        if (p.type === "match") p.pairs.forEach(([es]) => add(es));
      }
    }
    topic.conversation.lines.forEach((l) => add(l.es));
    for (const q of topic.bank) if (q.type === "listen" || q.type === "speak") add(q.say);
  }
}

console.log(`${texts.size} unique Spanish phrases.`);
if (DRY) {
  for (const t of texts) console.log(`${audioKey(t)}  ${t}`);
  process.exit(0);
}
if (!MODEL) {
  console.error("Set PIPER_MODEL to a Spanish Piper voice (.onnx). Run with --list to see the phrases.");
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });
const manifestPath = join(OUT, "manifest.json");
const keys = new Set<string>(existsSync(manifestPath) ? (JSON.parse(readFileSync(manifestPath, "utf8")).keys as string[]) : []);
let made = 0;

for (const text of texts) {
  const key = audioKey(text);
  const mp3 = join(OUT, `${key}.mp3`);
  if (keys.has(key) && existsSync(mp3)) continue;
  const wav = join(OUT, `${key}.wav`);
  const spoken = text.replace(/\s*\/\s*/g, ", ");
  execFileSync(PIPER, ["--model", MODEL, "--output_file", wav], { input: spoken });
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", wav, "-ac", "1", "-b:a", "48k", mp3]);
  rmSync(wav);
  keys.add(key);
  made++;
  if (made % 25 === 0) console.log(`  ${made} files…`);
}

writeFileSync(manifestPath, JSON.stringify({ keys: [...keys].sort() }));
console.log(`Done: ${made} new files, ${keys.size} total in ${OUT}/. Upload the folder to R2.`);
