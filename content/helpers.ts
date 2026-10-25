import type { ConjForms, DialogueLine, ExplainItem, Lesson, Page, Question, Skill, Word } from "./types";

// Small builders that keep the lesson files short and readable.

type Pair = [string, string];
type Item = [string, string] | [string, string, string];

export const explain = (title: string, items: Item[], tip?: string, tipLabel?: string): Page => ({
  type: "explain",
  title,
  items: items.map(([es, en, note]): ExplainItem => (note ? { es, en, note } : { es, en })),
  ...(tip ? { tip } : {}),
  ...(tipLabel ? { tipLabel } : {}),
});

/** Multiple choice. Put the correct option anywhere; `answer` is its index. */
export const choice = (prompt: string, options: string[], answer: number, say?: string): Page => ({
  type: "choice",
  prompt,
  options,
  answer,
  ...(say ? { say } : {}),
});

export const match = (pairs: Pair[]): Page => ({ type: "match", pairs });

/** Word builder: `answer` is the sentence, split on spaces; `extra` are distractor tiles. */
export const build = (en: string, answer: string, extra: string[]): Page => ({
  type: "build",
  en,
  answer: answer.split(" "),
  extra,
});

export const typeIt = (prompt: string, accept: string[], before?: string, after?: string): Page => ({
  type: "type",
  prompt,
  accept,
  ...(before ? { before } : {}),
  ...(after ? { after } : {}),
});

export const listen = (say: string, options: string[], answer: number, prompt = "What did you hear?"): Page => ({
  type: "listen",
  say,
  prompt,
  options,
  answer,
});

/** Forms in order: yo, tú, él/ella/usted, nosotros, vosotros, ellos/ustedes (Spain standard). */
export const conj = (verb: string, en: string, forms: [string, string, string, string, string, string], blanks: (keyof ConjForms)[]): Page => ({
  type: "conjugate",
  verb,
  en,
  forms: { yo: forms[0], tu: forms[1], el: forms[2], nosotros: forms[3], vosotros: forms[4], ellos: forms[5] },
  blanks,
});

export const dialogue = (title: string, lines: DialogueLine[]): Page => ({ type: "dialogue", title, lines });

export const speak = (es: string, en: string): Page => ({ type: "speak", es, en });

/** Line helpers for dialogues: `them` is the other speaker, `me` is the learner. */
export const them = (who: string, es: string, en: string, note?: string): DialogueLine => ({ who, es, en, ...(note ? { note } : {}) });
export const me = (es: string, en: string, note?: string): DialogueLine => ({ who: "You", me: true, es, en, ...(note ? { note } : {}) });

/** A lesson. Review words default to every explain item; pass `words` to override. */
export const lesson = (id: string, title: string, en: string, pages: Page[], words?: Word[]): Lesson => ({
  id,
  title,
  en,
  pages,
  words:
    words ??
    pages.flatMap((p) => (p.type === "explain" ? p.items.map((i) => ({ es: i.es, en: i.en })) : [])),
});

// ---- exam question builders ----

type Q<T> = T extends unknown ? Omit<T, "id"> : never;
type QuestionDraft = Q<Question>;

export const q = {
  choice: (skill: Skill, prompt: string, options: string[], answer: number): QuestionDraft => ({ skill, type: "choice", prompt, options, answer }),
  listen: (say: string, prompt: string, options: string[], answer: number): QuestionDraft => ({ skill: "listening", type: "listen", say, prompt, options, answer }),
  type: (prompt: string, accept: string[], before?: string, after?: string): QuestionDraft => ({
    skill: "vocabulary",
    type: "type",
    prompt,
    accept,
    ...(before ? { before } : {}),
    ...(after ? { after } : {}),
  }),
  build: (en: string, answer: string, extra: string[]): QuestionDraft => ({ skill: "reading", type: "build", en, answer: answer.split(" "), extra }),
  /** Spoken answer: `patterns` are regular expressions tested against the normalised transcript. */
  speak: (say: string, prompt: string, patterns: string[], sample: string): QuestionDraft => ({ skill: "speaking", type: "speak", say, prompt, patterns, sample }),
};

export const bank = (topicId: string, drafts: QuestionDraft[]): Question[] =>
  drafts.map((d, i) => ({ ...d, id: `${topicId}-q${String(i + 1).padStart(2, "0")}` }) as Question);
