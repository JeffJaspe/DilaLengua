"use client";
import { IconBolt, IconFlame } from "./icons";
import { useProgress } from "@/lib/client/store";

export function StatPills() {
  const me = useProgress((s) => s.me);
  return (
    <div className="flex gap-2">
      <div className="pill" aria-label={`${me?.streak ?? 0} day streak`}>
        <IconFlame />
        <span>{me?.streak ?? 0}</span>
      </div>
      <div className="pill" aria-label={`${me?.xp ?? 0} XP`}>
        <IconBolt />
        <span>{me?.xp ?? 0}</span>
      </div>
    </div>
  );
}
