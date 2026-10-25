import Link from "next/link";
import { Sol } from "@/components/Sol";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-5 text-center">
      <Sol size={110} />
      <h1 className="m-0 font-display text-3xl font-extrabold">¿Dónde está? Page not found.</h1>
      <Link href="/" className="btn btn-ink w-auto">
        Back to the path
      </Link>
    </main>
  );
}
