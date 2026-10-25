import { boolean, index, integer, jsonb, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";

/** An anonymous learner, identified by a cookie. Accounts can be linked later. */
export const learners = pgTable("learner", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  xp: integer("xp").notNull().default(0),
  xpToday: integer("xp_today").notNull().default(0),
  streak: integer("streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastActiveDate: text("last_active_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const lessonProgress = pgTable(
  "lesson_progress",
  {
    learnerId: uuid("learner_id").notNull().references(() => learners.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id").notNull(),
    bestScore: integer("best_score").notNull().default(0),
    completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.learnerId, t.lessonId] })],
);

export const topicStatus = pgTable(
  "topic_status",
  {
    learnerId: uuid("learner_id").notNull().references(() => learners.id, { onDelete: "cascade" }),
    topicId: text("topic_id").notNull(),
    passed: boolean("passed").notNull().default(false),
    bestScore: integer("best_score").notNull().default(0),
    passedAt: timestamp("passed_at", { withTimezone: true }),
  },
  (t) => [primaryKey({ columns: [t.learnerId, t.topicId] })],
);

/** One sitting of a topic test, practice test or final exam. Questions are chosen on the server. */
export const examAttempts = pgTable(
  "exam_attempt",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    learnerId: uuid("learner_id").notNull().references(() => learners.id, { onDelete: "cascade" }),
    examKey: text("exam_key").notNull(),
    kind: text("kind").notNull(), // topic | practice | final
    questionIds: text("question_ids").array().notNull(),
    tileOrder: jsonb("tile_order").$type<Record<string, string[]>>(),
    answers: jsonb("answers"),
    score: integer("score"),
    passed: boolean("passed"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (t) => [index("exam_attempt_learner_key").on(t.learnerId, t.examKey)],
);

/** Leitner spaced repetition: box 1 is due daily, box 5 every 16 days. */
export const reviewCards = pgTable(
  "review_card",
  {
    learnerId: uuid("learner_id").notNull().references(() => learners.id, { onDelete: "cascade" }),
    wordId: text("word_id").notNull(),
    es: text("es").notNull(),
    en: text("en").notNull(),
    box: integer("box").notNull().default(1),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.learnerId, t.wordId] }), index("review_card_due").on(t.learnerId, t.dueAt)],
);

export const certificates = pgTable("certificate", {
  id: text("id").primaryKey(),
  learnerId: uuid("learner_id").notNull().references(() => learners.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  level: text("level").notNull(),
  score: integer("score").notNull(),
  topicsPassed: integer("topics_passed").notNull(),
  issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
});
