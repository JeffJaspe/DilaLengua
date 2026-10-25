import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db, learners } from "../db";

const COOKIE = "lid";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type LearnerRow = typeof learners.$inferSelect;

/** The learner for this browser. Creates one (and sets the cookie) when `create` is true. */
export async function getLearner(create: true): Promise<LearnerRow>;
export async function getLearner(create: false): Promise<LearnerRow | null>;
export async function getLearner(create: boolean): Promise<LearnerRow | null> {
  const store = await cookies();
  const id = store.get(COOKIE)?.value;
  if (id && UUID.test(id)) {
    const [row] = await db.select().from(learners).where(eq(learners.id, id)).limit(1);
    if (row) return row;
  }
  if (!create) return null;
  const [row] = await db.insert(learners).values({}).returning();
  store.set(COOKIE, row.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 730,
  });
  return row;
}

/** A local calendar date sent by the browser, e.g. 2026-10-25. Falls back to Manila time. */
export function todayFrom(input: unknown): string {
  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  return new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10);
}
