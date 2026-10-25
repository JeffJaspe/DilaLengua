import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getLesson } from "@/content/index";
import { LessonPlayer } from "@/components/lesson/LessonPlayer";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const found = getLesson((await params).id);
  return { title: found ? found.lesson.title : "Lesson" };
}

export default async function LessonPage({ params }: Params) {
  const found = getLesson((await params).id);
  if (!found) notFound();
  const { lesson, topic, index } = found;
  // After the last lesson of a topic, go back to the topic page (where the test waits).
  const nextLesson = topic.lessons[index + 1];
  const nextHref = nextLesson ? `/lesson/${nextLesson.id}` : `/topic/${topic.id}`;
  return <LessonPlayer lesson={lesson} topicTitle={`Topic ${topic.n}`} nextHref={nextHref} />;
}
