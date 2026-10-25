// Content model for lessons, conversations and exam question banks.
// Content is written as TypeScript so the compiler checks every page.

export type Word = { es: string; en: string };

export type ExplainItem = { es: string; en: string; note?: string };

export type Page =
  | { type: "explain"; title: string; items: ExplainItem[]; tip?: string; tipLabel?: string }
  | { type: "choice"; prompt: string; say?: string; options: string[]; answer: number }
  | { type: "match"; pairs: [string, string][] }
  | { type: "build"; en: string; answer: string[]; extra: string[] }
  | { type: "type"; prompt: string; before?: string; after?: string; accept: string[] }
  | { type: "listen"; say: string; prompt: string; options: string[]; answer: number }
  | { type: "conjugate"; verb: string; en: string; forms: ConjForms; blanks: (keyof ConjForms)[] }
  | { type: "dialogue"; title: string; lines: DialogueLine[] }
  | { type: "speak"; es: string; en: string };

export type ConjForms = {
  yo: string;
  tu: string;
  el: string;
  nosotros: string;
  vosotros: string;
  ellos: string;
};

export type DialogueLine = { who: string; me?: boolean; es: string; en: string; note?: string };

export type Lesson = {
  id: string;
  title: string;
  en: string;
  pages: Page[];
  /** Words added to the learner's review deck when the lesson is completed. */
  words: Word[];
};

/** Exam questions. Answers stay on the server; the client gets a stripped copy. */
export type Question =
  | { id: string; skill: Skill; type: "choice"; prompt: string; options: string[]; answer: number }
  | { id: string; skill: Skill; type: "listen"; say: string; prompt: string; options: string[]; answer: number }
  | { id: string; skill: Skill; type: "type"; prompt: string; before?: string; after?: string; accept: string[] }
  | { id: string; skill: Skill; type: "build"; en: string; answer: string[]; extra: string[] }
  | { id: string; skill: Skill; type: "speak"; say: string; prompt: string; patterns: string[]; sample: string };

export type Skill = "listening" | "reading" | "vocabulary" | "speaking";

export type Conversation = { title: string; en: string; lines: DialogueLine[] };

export type Topic = {
  id: string;
  n: number;
  title: string;
  en: string;
  lessons: Lesson[];
  conversation: Conversation;
  bank: Question[];
};

export type Level = {
  code: string;
  name: string;
  en: string;
  unit: string;
  desc: string;
  topics: Topic[];
  final: { questions: number; minutes: number; perTopic: number };
};
