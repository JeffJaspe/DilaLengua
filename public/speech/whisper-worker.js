// Speech recognition on the learner's device: Whisper via Transformers.js, no API, no tokens.
// Loaded as a module worker from /speech/whisper-worker.js so the bundler never touches it.
import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.0";

let asr = null;
let loading = null;

function load(model, modelBase) {
  if (asr) return Promise.resolve(asr);
  if (loading) return loading;
  env.allowLocalModels = false;
  if (modelBase) env.remoteHost = modelBase.endsWith("/") ? modelBase : modelBase + "/";
  loading = pipeline("automatic-speech-recognition", model, {
    progress_callback: (p) => {
      if (p.status === "progress" && p.total) self.postMessage({ type: "progress", file: p.file, loaded: p.loaded, total: p.total });
    },
  }).then((p) => {
    asr = p;
    self.postMessage({ type: "ready" });
    return p;
  });
  loading.catch((err) => {
    loading = null;
    self.postMessage({ type: "error", message: String(err && err.message ? err.message : err) });
  });
  return loading;
}

self.onmessage = async (e) => {
  const msg = e.data;
  try {
    if (msg.type === "load") {
      await load(msg.model, msg.modelBase);
    } else if (msg.type === "transcribe") {
      const p = await load(msg.model, msg.modelBase);
      const out = await p(msg.audio, { language: "spanish", task: "transcribe", chunk_length_s: 30 });
      self.postMessage({ type: "result", id: msg.id, text: (out && out.text ? out.text : "").trim() });
    }
  } catch (err) {
    self.postMessage({ type: "error", id: msg.id, message: String(err && err.message ? err.message : err) });
  }
};
