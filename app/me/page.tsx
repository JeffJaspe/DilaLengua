import type { Metadata } from "next";
import { A1 } from "@/content/index";
import { MeView } from "@/components/screens/MeView";

export const metadata: Metadata = { title: "Me" };

export default function MePage() {
  return <MeView topicsTotal={A1.topics.length} />;
}
