import type { ConjForms, Page } from "../content/types";
import { checkBuild, checkTyped } from "./answers";

/** The value a learner has entered on a page, by page type. */
export type PageValue =
  | { kind: "index"; index: number }
  | { kind: "tiles"; words: string[]; idx: number[] }
  | { kind: "text"; text: string }
  | { kind: "conj"; forms: Partial<Record<keyof ConjForms, string>> }
  | { kind: "done" };

export type Feedback = { ok: boolean; title: string; hint?: string };

const PRAISE = ["¡Muy bien!", "¡Excelente!", "¡Perfecto!", "¡Eso es!", "¡Genial!", "¡Bien hecho!"];
export const praise = (i: number) => PRAISE[i % PRAISE.length];

/** Pages that are checked and count toward the lesson score. */
export const isGraded = (p: Page) => p.type === "choice" || p.type === "listen" || p.type === "build" || p.type === "type" || p.type === "conjugate";

export function canCheck(p: Page, v: PageValue | null): boolean {
  if (!v) return false;
  if (v.kind === "index") return v.index >= 0;
  if (v.kind === "tiles") return v.words.length > 0;
  if (v.kind === "text") return v.text.trim().length > 0;
  if (v.kind === "conj" && p.type === "conjugate") return p.blanks.every((b) => (v.forms[b] ?? "").trim().length > 0);
  return v.kind === "done";
}

export function gradePage(p: Page, v: PageValue | null, i: number): Feedback {
  switch (p.type) {
    case "choice":
    case "listen": {
      const ok = v?.kind === "index" && v.index === p.answer;
      return ok ? { ok, title: praise(i) } : { ok, title: "Casi… almost!", hint: `Correct answer: ${p.options[p.answer]}` };
    }
    case "build": {
      const ok = v?.kind === "tiles" && checkBuild(v.words, p.answer);
      return ok ? { ok, title: praise(i), hint: p.answer.join(" ") } : { ok, title: "Casi… almost!", hint: `Correct answer: ${p.answer.join(" ")}` };
    }
    case "type": {
      const r = v?.kind === "text" ? checkTyped(v.text, p.accept) : { ok: false };
      if (r.ok && "accentHint" in r && r.accentHint) return { ok: true, title: "¡Bien! Watch the accent", hint: `Spelled: ${r.accentHint}` };
      return r.ok ? { ok: true, title: praise(i) } : { ok: false, title: "Casi… almost!", hint: `Correct answer: ${p.accept[0]}` };
    }
    case "conjugate": {
      const forms = v?.kind === "conj" ? v.forms : {};
      const results = p.blanks.map((b) => checkTyped(forms[b] ?? "", [p.forms[b]]));
      const ok = results.every((r) => r.ok);
      const accentOnly = ok && results.some((r) => "accentHint" in r && r.accentHint);
      if (ok) return { ok, title: accentOnly ? "¡Bien! Watch the accents" : praise(i), hint: accentOnly ? p.blanks.map((b) => p.forms[b]).join(", ") : undefined };
      return { ok, title: "Casi… almost!", hint: `Correct: ${p.blanks.map((b) => p.forms[b]).join(", ")}` };
    }
    default:
      return { ok: true, title: praise(i) };
  }
}
