import type { Lesson, Level, Question, Topic } from "./types";
import { t01 } from "./es/a1/t01";
import { t02 } from "./es/a1/t02";
import { t03 } from "./es/a1/t03";
import { t04 } from "./es/a1/t04";
import { t05 } from "./es/a1/t05";
import { t06 } from "./es/a1/t06";
import { t07 } from "./es/a1/t07";
import { t08 } from "./es/a1/t08";

export const A1: Level = {
  code: "A1",
  name: "Principiante",
  en: "Beginner",
  unit: "Ya lo sabes",
  desc: "Tagalog and Bisaya already borrowed hundreds of Spanish words: mesa, silya, kutsara. Start with what you know.",
  topics: [t01, t02, t03, t04, t05, t06, t07, t08],
  final: { questions: 40, minutes: 30, perTopic: 5 },
};

/** Levels after A1 are planned; their topic titles show on the path as "coming soon". */
export const UPCOMING: { code: string; name: string; en: string; unit: string; desc: string; topics: string[] }[] = [
  { code: "A2", name: "Básico", en: "Elementary", unit: "Mi día", desc: "Talk about your routine, travel, health and what you did yesterday.", topics: ["La rutina", "Ayer: pretérito regular", "Ayer: pretérito irregular", "Antes: el imperfecto", "Viajes y transporte", "La salud", "La casa", "El tiempo", "Planes: ir a…", "Comparaciones"] },
  { code: "B1", name: "Intermedio", en: "Intermediate", unit: "De viaje", desc: "Tell stories, give advice and share opinions about work and life.", topics: ["Pretérito vs imperfecto", "Experiencias: he hecho", "Mandatos", "Trabajo y estudios", "Deseos: espero que…", "Medios y tecnología", "Consejos", "Futuro y condicional", "Oraciones de relativo", "Fiestas y cultura"] },
  { code: "B2", name: "Intermedio alto", en: "Upper intermediate", unit: "Opiniones", desc: "Debate, report what others said and imagine with the full subjunctive.", topics: ["El subjuntivo presente", "El subjuntivo pasado", "Si yo fuera…", "Condicional perfecto", "Estilo indirecto", "La voz pasiva y “se”", "Debatir", "Noticias y sociedad", "Medio ambiente", "Cartas formales", "Conectores", "Modismos I"] },
  { code: "C1", name: "Avanzado", en: "Advanced", unit: "En el trabajo", desc: "Meetings, negotiation, academic writing and nuance in register.", topics: ["Subjuntivo avanzado", "Registro y matices", "Escritura académica", "Reuniones", "Negociar", "Presentaciones", "Textos literarios", "Humor e ironía", "Variantes regionales", "Conectores complejos", "Modismos II", "Estilo y nominalización"] },
  { code: "C2", name: "Maestría", en: "Mastery", unit: "Como nativo", desc: "Literature, dialects, wordplay and spontaneous debate.", topics: ["Tiempos literarios", "Dialectos a fondo", "Juegos de palabras", "Traducción profesional", "Retórica", "Coloquialismos", "Textos históricos", "Precisión léxica", "Debate espontáneo", "Proyecto final"] },
];

export const LEVELS: Level[] = [A1];

const lessonIndex = new Map<string, { lesson: Lesson; topic: Topic; level: Level; index: number }>();
const topicIndex = new Map<string, { topic: Topic; level: Level }>();
const questionIndex = new Map<string, Question>();

for (const level of LEVELS) {
  for (const topic of level.topics) {
    topicIndex.set(topic.id, { topic, level });
    topic.lessons.forEach((lesson, index) => lessonIndex.set(lesson.id, { lesson, topic, level, index }));
    for (const question of topic.bank) questionIndex.set(question.id, question);
  }
}

export const getLesson = (id: string) => lessonIndex.get(id);
export const getTopic = (id: string) => topicIndex.get(id);
export const getQuestion = (id: string) => questionIndex.get(id);
export const getLevel = (code: string) => LEVELS.find((l) => l.code.toLowerCase() === code.toLowerCase());
export const allLessonIds = () => [...lessonIndex.keys()];
