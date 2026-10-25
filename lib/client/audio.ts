"use client";
// Plays Spanish audio: a pre-generated MP3 when one exists, otherwise the browser's Spanish voice.
import { audioKey } from "../audio-key";

const BASE = (process.env.NEXT_PUBLIC_AUDIO_BASE || "").replace(/\/$/, "");
let manifest: Set<string> | null = null;
let manifestLoad: Promise<void> | null = null;
let current: HTMLAudioElement | null = null;

function loadManifest() {
  if (!BASE) return Promise.resolve();
  manifestLoad ??= fetch(`${BASE}/manifest.json`)
    .then((r) => (r.ok ? r.json() : { keys: [] }))
    .then((m: { keys?: string[] }) => {
      manifest = new Set(m.keys ?? []);
    })
    .catch(() => {
      manifest = new Set();
    });
  return manifestLoad;
}

function pickVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis?.getVoices() ?? [];
  return (
    voices.find((v) => v.lang === "es-ES") ??
    voices.find((v) => v.lang.startsWith("es"))
  );
}

export type SpeakOptions = { slow?: boolean; pitch?: number; onEnd?: () => void };

export async function speak(text: string, opts: SpeakOptions = {}) {
  stopSpeaking();
  const clean = text.replace(/\s*\/\s*/g, ", ");
  await loadManifest();
  const key = audioKey(text);
  if (BASE && manifest?.has(key)) {
    const a = new Audio(`${BASE}/${key}.mp3`);
    a.playbackRate = opts.slow ? 0.7 : 1;
    a.onended = () => opts.onEnd?.();
    a.onerror = () => opts.onEnd?.();
    current = a;
    try {
      await a.play();
      return;
    } catch {
      /* fall through to the browser voice */
    }
  }
  const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
  if (!synth) {
    opts.onEnd?.();
    return;
  }
  const u = new SpeechSynthesisUtterance(clean);
  u.lang = "es-ES"; // Spain standard
  const voice = pickVoice();
  if (voice) u.voice = voice;
  u.rate = opts.slow ? 0.6 : 0.92;
  u.pitch = opts.pitch ?? 1;
  u.onend = () => opts.onEnd?.();
  u.onerror = () => opts.onEnd?.();
  synth.speak(u);
}

export function stopSpeaking() {
  current?.pause();
  current = null;
  try {
    window.speechSynthesis?.cancel();
  } catch {
    /* ignore */
  }
}

// Some browsers load voices late; touching the list early helps the first play.
if (typeof window !== "undefined" && window.speechSynthesis) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}
