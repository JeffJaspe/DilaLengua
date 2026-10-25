import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTopic } from "@/content/index";
import { ExamPlayer } from "@/components/exam/ExamPlayer";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const t = getTopic((await params).id);
  return { title: t ? `Topic ${t.topic.n} test` : "Topic test" };
}

export default async function TopicTestPage({ params }: Params) {
  const found = getTopic((await params).id);
  if (!found) notFound();
  const { topic, level } = found;
  const last = topic.n === level.topics.length;
  return (
    <ExamPlayer
      intro={{
        kind: "topic",
        id: topic.id,
        title: topic.title,
        subtitle: last ? `Pass to unlock the ${level.code} final exam` : `Pass to unlock topic ${topic.n + 1}`,
        questions: 10,
        minutes: 10,
        badge: `T${topic.n}`,
        nextLabel: last ? "Final exam" : `Topic ${topic.n + 1}`,
        topicHref: `/topic/${topic.id}`,
      }}
    />
  );
}
