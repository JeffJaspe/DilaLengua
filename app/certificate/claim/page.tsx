"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/client/api";
import { useProgress } from "@/lib/client/store";
import { Sol } from "@/components/Sol";
import { Confetti } from "@/components/Confetti";

export default function ClaimCertificate() {
  const router = useRouter();
  const { me, progress, refresh, loaded } = useProgress();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    refresh();
  }, [refresh]);
  useEffect(() => {
    if (me?.name && !name) setName(me.name);
  }, [me?.name, name]);
  useEffect(() => {
    if (progress.certificateId) router.replace(`/certificate/${progress.certificateId}`);
  }, [progress.certificateId, router]);

  const claim = async () => {
    setBusy(true);
    setError("");
    try {
      const r = await api<{ id: string }>("/api/certificate", { body: { name } });
      router.push(`/certificate/${r.id}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <Confetti />
      <main className="relative flex flex-1 flex-col items-center gap-4 px-5 pt-14 text-center">
        <Sol size={130} mood="cheer" label="Sol cheering" />
        <h1 className="m-0 font-display text-[34px] leading-none font-extrabold">You passed A1!</h1>
        {loaded && !progress.final.passed ? (
          <p className="m-0">Pass the A1 final exam to earn your certificate.</p>
        ) : (
          <>
            <p className="m-0 max-w-[300px]">Type your name exactly as it should appear on your certificate.</p>
            <label htmlFor="cert-name" className="sr-only">
              Name on the certificate
            </label>
            <input
              id="cert-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              autoComplete="name"
              placeholder="Your full name"
              className="h-14 w-full rounded-2xl border-3 border-ink bg-white px-4 text-center font-display text-xl font-extrabold outline-none focus:bg-[#FFF0B3]"
            />
            {error && <p className="m-0 font-semibold">{error}</p>}
          </>
        )}
      </main>
      <footer className="relative px-5 pt-4 pb-[max(24px,env(safe-area-inset-bottom))]">
        <button type="button" className="btn btn-ink" disabled={busy || name.trim().length < 2 || !progress.final.passed} onClick={claim}>
          {busy ? "Creating your certificate…" : "Create my certificate"}
        </button>
      </footer>
    </div>
  );
}
