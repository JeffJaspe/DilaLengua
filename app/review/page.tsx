import type { Metadata } from "next";
import { ReviewDeck } from "@/components/screens/ReviewDeck";

export const metadata: Metadata = { title: "Review" };

export default function ReviewPage() {
  return <ReviewDeck />;
}
