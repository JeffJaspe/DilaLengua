"use client";
// Record the learner's voice and transcribe it on the device with Whisper.
import { useCallback, useEffect, useRef, useState } from "react";

const MODEL = "onnx-community/whisper-tiny";
const MODEL_BASE = process.env.NEXT_PUBLIC_MODEL_BASE || "";
const MAX_MS = 5000;

let worker: Worker | null = null;
let ready = false;
const listeners = new Set<(m: WorkerMessage) => void>();
type WorkerMessage =
  | { type: "progress"; file: string; loaded: number; total: number }
  | { type: "ready" }
  | { type: "result"; id: number; text: string }
  | { type: "error"; id?: number; message: string };

function getWorker() {
  if (!worker) {
    worker = new Worker("/speech/whisper-worker.js", { type: "module" });
    worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
      if (e.data.type === "ready") ready = true;
      listeners.forEach((l) => l(e.data));
    };
    // A worker whose script or CDN import fails never posts a message; report it so the UI can offer "skip".
    worker.onerror = (e) => {
      e.preventDefault();
      worker?.terminate();
      worker = null;
      ready = false;
      listeners.forEach((l) => l({ type: "error", message: "the speech checker couldn't load (check your connection)" }));
    };
  }
  return worker;
}

/** Start downloading the model early (e.g. when a speaking page appears). */
export function preloadWhisper() {
  if (typeof window === "undefined" || ready) return;
  getWorker().postMessage({ type: "load", model: MODEL, modelBase: MODEL_BASE });
}

let seq = 0;
function transcribe(audio: Float32Array, onProgress: (pct: number) => void): Promise<string> {
  const id = ++seq;
  const w = getWorker();
  const files = new Map<string, { loaded: number; total: number }>();
  return new Promise((resolve, reject) => {
    const l = (m: WorkerMessage) => {
      if (m.type === "progress") {
        files.set(m.file, { loaded: m.loaded, total: m.total });
        const all = [...files.values()];
        onProgress(Math.round((all.reduce((a, f) => a + f.loaded, 0) / all.reduce((a, f) => a + f.total, 0)) * 100));
      } else if (m.type === "result" && m.id === id) {
        listeners.delete(l);
        resolve(m.text);
      } else if (m.type === "error" && (m.id === id || m.id === undefined)) {
        listeners.delete(l);
        reject(new Error(m.message));
      }
    };
    listeners.add(l);
    w.postMessage({ type: "transcribe", id, audio, model: MODEL, modelBase: MODEL_BASE }, [audio.buffer]);
  });
}

async function toMono16k(blob: Blob): Promise<Float32Array> {
  const buf = await blob.arrayBuffer();
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  const decoded = await ctx.decodeAudioData(buf);
  await ctx.close();
  const off = new OfflineAudioContext(1, Math.ceil(decoded.duration * 16000), 16000);
  const src = off.createBufferSource();
  src.buffer = decoded;
  src.connect(off.destination);
  src.start();
  const rendered = await off.startRendering();
  return rendered.getChannelData(0).slice();
}

export type SpeechPhase = "idle" | "recording" | "loading" | "thinking" | "done" | "error";

/** Hook: record up to 5 seconds, then transcribe. `recordingUrl` lets the learner replay their voice. */
export function useSpeech() {
  const [phase, setPhase] = useState<SpeechPhase>("idle");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supported = typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined";

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      rec.current?.stream.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  const stop = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    if (rec.current?.state === "recording") rec.current.stop();
  }, []);

  const start = useCallback(async () => {
    setError("");
    setTranscript("");
    if (!supported) {
      setPhase("error");
      setError("This browser can't record audio.");
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setPhase("error");
      setError("Microphone access was blocked. Allow it in your browser settings to practise speaking.");
      return;
    }
    preloadWhisper();
    const chunks: Blob[] = [];
    const r = new MediaRecorder(stream);
    rec.current = r;
    r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    r.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunks, { type: r.mimeType || "audio/webm" });
      setRecordingUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(blob);
      });
      try {
        const audio = await toMono16k(blob);
        setPhase(ready ? "thinking" : "loading");
        const text = await transcribe(audio, (pct) => {
          setProgress(pct);
          if (pct >= 100) setPhase("thinking");
        });
        setTranscript(text);
        setPhase("done");
      } catch (e) {
        setPhase("error");
        setError(`Couldn't check your speech (${(e as Error).message}).`);
      }
    };
    r.start();
    setPhase("recording");
    timer.current = setTimeout(() => stop(), MAX_MS);
  }, [stop, supported]);

  const reset = useCallback(() => {
    setPhase("idle");
    setTranscript("");
    setError("");
  }, []);

  const playRecording = useCallback(() => {
    if (recordingUrl) new Audio(recordingUrl).play().catch(() => {});
  }, [recordingUrl]);

  return { phase, transcript, error, progress, supported, start, stop, reset, playRecording, hasRecording: !!recordingUrl };
}
