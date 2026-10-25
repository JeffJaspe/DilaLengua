"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconBook, IconCards, IconChat, IconUser } from "./icons";
import { useProgress } from "@/lib/client/store";

const items = [
  { href: "/", label: "Learn", Icon: IconBook },
  { href: "/talk", label: "Talk", Icon: IconChat },
  { href: "/review", label: "Review", Icon: IconCards },
  { href: "/me", label: "Me", Icon: IconUser },
];

export function BottomNav() {
  const path = usePathname();
  const due = useProgress((s) => s.me?.reviewDue ?? 0);
  return (
    <nav aria-label="Main" className="sticky bottom-0 z-20 flex gap-1.5 border-t-3 border-ink bg-paper px-3 pt-2 pb-[max(14px,env(safe-area-inset-bottom))]">
      {items.map(({ href, label, Icon }) => {
        const on = href === "/" ? path === "/" : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={on ? "page" : undefined}
            className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-xs font-bold no-underline ${on ? "bg-sun text-ink" : "text-muted"}`}
          >
            {label === "Review" && due > 0 && (
              <span className="absolute top-0.5 right-[18%] flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-ink bg-coral px-1 text-[11px] font-extrabold text-ink">
                {due > 99 ? "99+" : due}
              </span>
            )}
            <Icon />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
