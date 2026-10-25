import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTopic } from "@/content/index";
import { DialoguePlayer } from "@/components/lesson/Pages";
import { BottomNav } from "@/components/BottomNav";
import { IconBack } from "@/components/icons";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const t = getTopic((await params).id);
  return { title: t ? t.topic.conversation.title : "Conversation" };
}

export default async function ConversationPage({ params }: Params) {
  const found = getTopic((await params).id);
  if (!found) notFound();
  const { topic, level } = found;
  return (
    <>
      <header className="flex items-center gap-2 px-4 pt-[18px]">
        <Link href="/talk" className="flex h-11 w-11 items-center justify-center rounded-xl" aria-label="Back to conversations">
          <IconBack />
        </Link>
        <h1 className="m-0 font-display text-[26px] font-extrabold">Conversaciones</h1>
      </header>
      <main className="flex flex-1 flex-col gap-4 px-5 pt-3 pb-6">
        <div className="rounded-[18px] border-3 border-ink bg-ink px-4 py-3 text-paper">
          <div className="text-xs font-bold tracking-wider text-sun uppercase">
            {level.code} · Topic {topic.n} · Scene
          </div>
          <div className="font-display text-[22px] font-extrabold">{topic.conversation.title}</div>
          <div className="text-[13.5px] text-[#E4E0F2]">{topic.conversation.en}</div>
        </div>
        <DialoguePlayer lines={topic.conversation.lines} />
      </main>
      <BottomNav />
    </>
  );
}
