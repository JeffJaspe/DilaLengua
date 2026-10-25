"use client";
import { useState } from "react";
import { IconDownload, IconShare } from "../icons";

export function ShareButtons({ id, verifyUrl }: { id: string; verifyUrl: string }) {
  const [toast, setToast] = useState("");
  const flash = (t: string) => {
    setToast(t);
    setTimeout(() => setToast(""), 1800);
  };
  const share = async () => {
    const data = { title: "My Spanish certificate", text: "I passed the Spanish A1 final exam!", url: verifyUrl };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(verifyUrl);
        flash("Verification link copied");
      }
    } catch {
      /* cancelled */
    }
  };
  return (
    <>
      <div className="flex gap-2.5">
        <a href={`/api/certificate/${id}/pdf`} target="_blank" rel="noopener" className="btn btn-coral">
          <IconDownload /> PDF
        </a>
        <button type="button" className="btn btn-paper" onClick={share}>
          <IconShare /> Share
        </button>
      </div>
      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2 animate-pop rounded-full border-3 border-ink bg-mint px-4 py-2.5 text-sm font-bold whitespace-nowrap shadow-chunky-sm">
          {toast}
        </div>
      )}
    </>
  );
}
