"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/client/api";
import { useProgress } from "@/lib/client/store";
import { BottomNav } from "../BottomNav";
import { Sol } from "../Sol";

export function MeView({ topicsTotal }: { topicsTotal: number }) {
  const { me, progress, refresh, setMe } = useProgress();
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    refresh();
  }, [refresh]);
  useEffect(() => {
    if (me?.name) setName(me.name);
  }, [me?.name]);

  const passed = Object.values(progress.topics).filter((t) => t.passed).length;
  const save = async () => {
    const r = await api<{ name: string | null }>("/api/me", { method: "PATCH", body: { name } });
    if (me) setMe({ ...me, name: r.name });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <>
      <header className="flex items-center justify-between px-5 pt-6">
        <div>
          <h1 className="m-0 font-display text-[34px] leading-none font-extrabold">{me?.name || "Your profile"}</h1>
          <p className="mt-1.5 text-[15px] font-medium">Spanish (Spain) · A1 Principiante</p>
        </div>
        <Sol size={84} />
      </header>
      <main className="flex flex-1 flex-col gap-4 px-5 pt-4 pb-6">
        <div className="grid grid-cols-2 gap-2.5">
          {[
            ["Total XP", me?.xp ?? 0, "bg-sky"],
            ["Streak", `${me?.streak ?? 0} days`, "bg-coral"],
            ["Best streak", `${me?.longestStreak ?? 0} days`, "bg-paper"],
            ["Topics passed", `${passed} / ${topicsTotal}`, "bg-mint"],
            ["Lessons done", progress.completed.length, "bg-paper"],
            ["Words to review", me?.reviewDue ?? 0, "bg-paper"],
          ].map(([label, value, bg]) => (
            <div key={label as string} className={`rounded-2xl border-3 border-ink p-3 shadow-chunky-sm ${bg}`}>
              <div className="text-[11px] font-bold tracking-wider uppercase">{label}</div>
              <div className="font-display text-2xl font-extrabold">{value}</div>
            </div>
          ))}
        </div>

        <div className="card flex flex-col gap-2 p-4">
          <label htmlFor="name" className="font-display text-lg font-extrabold">
            Your name
          </label>
          <p className="m-0 text-sm text-muted">Used for greetings and printed on your certificate.</p>
          <div className="flex gap-2">
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              autoComplete="name"
              className="h-12 min-w-0 flex-1 rounded-xl border-3 border-ink bg-white px-3 text-base font-semibold outline-none focus:bg-[#FFF0B3]"
            />
            <button type="button" onClick={save} className="press h-12 rounded-xl border-3 border-ink bg-mint px-4 font-bold shadow-chunky-sm">
              {saved ? "Saved" : "Save"}
            </button>
          </div>
        </div>

        {progress.certificateId && (
          <Link href={`/certificate/${progress.certificateId}`} className="btn btn-ink">
            View my A1 certificate
          </Link>
        )}

        <div className="rounded-2xl border-3 border-dashed border-ink bg-paper/60 p-4 text-sm leading-relaxed">
          <b>Your progress lives on this device's browser.</b> Accounts that sync across phones are coming. Tip: on your phone, use “Add to Home screen” to open it like an app.
        </div>
        <p className="m-0 text-center text-xs text-muted">
          <Link href="/credits" className="text-ink underline">
            Credits and sources
          </Link>
        </p>
      </main>
      <BottomNav />
    </>
  );
}
