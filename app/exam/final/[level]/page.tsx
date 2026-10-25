import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getLevel } from "@/content/index";
import { ExamPlayer } from "@/components/exam/ExamPlayer";

type Params = { params: Promise<{ level: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  return { title: `Final exam ${(await params).level.toUpperCase()}` };
}

export default async function FinalExamPage({ params }: Params) {
  const level = getLevel((await params).level);
  if (!level) notFound();
  return (
    <ExamPlayer
      intro={{
        kind: "final",
        id: level.code,
        title: `Examen final ${level.code}`,
        subtitle: `Covers all ${level.topics.length} topics. Pass to earn your ${level.code} certificate.`,
        questions: level.final.questions,
        minutes: level.final.minutes,
        badge: level.code,
        nextLabel: "A2",
      }}
    />
  );
}
