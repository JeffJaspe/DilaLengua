import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTopic } from "@/content/index";
import { getOutline } from "@/content/outline";
import { TopicView } from "@/components/screens/TopicView";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const t = getTopic((await params).id);
  return { title: t ? t.topic.title : "Topic" };
}

export default async function TopicPage({ params }: Params) {
  const { id } = await params;
  if (!getTopic(id)) notFound();
  return <TopicView outline={getOutline()} topicId={id} />;
}
