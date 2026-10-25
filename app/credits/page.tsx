import Link from "next/link";
import type { Metadata } from "next";
import { IconBack } from "@/components/icons";

export const metadata: Metadata = { title: "Credits" };

export default function Credits() {
  return (
    <main className="flex flex-1 flex-col gap-4 px-5 pt-5 pb-10">
      <Link href="/me" className="flex h-11 w-11 items-center justify-center rounded-xl" aria-label="Back">
        <IconBack />
      </Link>
      <h1 className="m-0 font-display text-[32px] font-extrabold">Credits and sources</h1>
      <div className="card flex flex-col gap-3 p-4 text-[15px] leading-relaxed">
        <p className="m-0">The course teaches Spain standard Spanish (castellano peninsular), with notes where Latin America differs. Lessons, exercises and dialogues are written for this course and reviewed by people. No AI runs inside the app.</p>
        <p className="m-0">
          Levels follow the Common European Framework of Reference (CEFR). Topic and grammar choices follow the Instituto Cervantes <i>Plan Curricular</i>, used as a reference only.
        </p>
        <p className="m-0">Words are taught in order of frequency. Example sentences may be adapted from Tatoeba (CC BY 2.0 FR) and dialogues from the public-domain FSI Spanish courses.</p>
        <p className="m-0">Speaking practice uses OpenAI Whisper (MIT licence) through Transformers.js, running entirely on your device. Lesson audio is generated with Piper text-to-speech.</p>
        <p className="m-0 text-sm text-muted">Certificates are course certificates aligned with CEFR descriptors. They are not official DELE or SIELE diplomas.</p>
      </div>
    </main>
  );
}
