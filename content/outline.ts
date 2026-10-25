// The slim course outline (titles only) that is safe to send to the browser.
// Question banks never leave the server.
import type { Outline } from "../lib/progression";
import { A1, UPCOMING } from "./index";

export function getOutline(): Outline {
  return {
    code: A1.code,
    name: A1.name,
    en: A1.en,
    unit: A1.unit,
    desc: A1.desc,
    final: { questions: A1.final.questions, minutes: A1.final.minutes },
    topics: A1.topics.map((t) => ({
      id: t.id,
      n: t.n,
      title: t.title,
      en: t.en,
      conversation: t.conversation.title,
      lessons: t.lessons.map((l) => ({ id: l.id, title: l.title, en: l.en })),
    })),
  };
}

export const upcomingLevels = UPCOMING;
