import type { Metadata } from "next";
import { getOutline } from "@/content/outline";
import { TalkList } from "@/components/screens/TalkList";

export const metadata: Metadata = { title: "Conversations" };

export default function TalkPage() {
  return <TalkList outline={getOutline()} />;
}
