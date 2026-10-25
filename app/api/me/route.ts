import { eq } from "drizzle-orm";
import { db, learners } from "@/lib/db";
import { getLearner } from "@/lib/server/learner";
import { body, handle, json } from "@/lib/server/http";

export async function PATCH(req: Request) {
  return handle(async () => {
    const { name } = await body<{ name: string }>(req);
    const clean = String(name ?? "").replace(/\s+/g, " ").trim().slice(0, 60);
    const learner = await getLearner(true);
    await db.update(learners).set({ name: clean || null }).where(eq(learners.id, learner.id));
    return json({ name: clean || null });
  });
}
