import { HomePath } from "@/components/HomePath";
import { getOutline, upcomingLevels } from "@/content/outline";

export default function Home() {
  return <HomePath outline={getOutline()} upcoming={upcomingLevels} />;
}
