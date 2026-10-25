"use client";
import { speak } from "@/lib/client/audio";
import { IconSpeaker, IconTurtle } from "./icons";

/** A play button plus a slow (turtle) button for a Spanish phrase. */
export function SpeakButtons({ text, big, slow = true }: { text: string; big?: boolean; slow?: boolean }) {
  const size = big ? "h-[60px] w-[60px] rounded-2xl" : "";
  return (
    <div className="flex gap-2">
      <button type="button" className={`speak-btn ${size}`} onClick={() => speak(text)} aria-label={`Hear: ${text}`}>
        <IconSpeaker size={big ? 28 : 22} />
      </button>
      {slow && (
        <button type="button" className={`speak-btn bg-paper ${size}`} onClick={() => speak(text, { slow: true })} aria-label={`Hear slowly: ${text}`}>
          <IconTurtle size={big ? 24 : 20} />
        </button>
      )}
    </div>
  );
}

export function SpeakIcon({ text, slow }: { text: string; slow?: boolean }) {
  return (
    <button type="button" className="speak-btn" onClick={() => speak(text, { slow })} aria-label={`Hear: ${text}`}>
      <IconSpeaker />
    </button>
  );
}
