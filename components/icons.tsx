// Inline stroke icons. Decorative by default; give the parent button an aria-label.
type P = { size?: number; className?: string };
const base = (size: number) => ({ width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true });

export const IconSpeaker = ({ size = 22, className }: P) => (
  <svg {...base(size)} strokeWidth={2.5} className={className}>
    <path d="M4 9v6h4l5 4V5L8 9z" />
    <path d="M16.5 8.5a5 5 0 0 1 0 7" />
    <path d="M19 6a8.5 8.5 0 0 1 0 12" />
  </svg>
);
export const IconTurtle = ({ size = 24, className }: P) => (
  <svg width={size + 4} height={size} viewBox="0 0 28 24" fill="none" stroke="currentColor" strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
    <path d="M3 16a9 7 0 0 1 18 0z" />
    <path d="M8 11l3 5M12 9.5v6.5M16 11l-3 5" />
    <path d="M21 15h2.5a2.5 2.5 0 0 0 0-5H22" />
    <path d="M7 16v3M17 16v3" />
  </svg>
);
export const IconX = ({ size = 26, className }: P) => (
  <svg {...base(size)} strokeWidth={3} className={className}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
export const IconCheck = ({ size = 24, className }: P) => (
  <svg {...base(size)} strokeWidth={3.5} className={className}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);
export const IconBack = ({ size = 26, className }: P) => (
  <svg {...base(size)} strokeWidth={3} className={className}>
    <path d="M15 5l-7 7 7 7" />
  </svg>
);
export const IconPlay = ({ size = 24, className }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
    <path d="M8 5v14l11-7z" />
  </svg>
);
export const IconPause = ({ size = 22, className }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
    <rect x="6" y="5" width="4" height="14" rx="1" />
    <rect x="14" y="5" width="4" height="14" rx="1" />
  </svg>
);
export const IconLock = ({ size = 24, className }: P) => (
  <svg {...base(size)} strokeWidth={2.5} className={className}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);
export const IconMic = ({ size = 44, className }: P) => (
  <svg {...base(size)} strokeWidth={2.5} className={className}>
    <rect x="9" y="3" width="6" height="11" rx="3" fill="#FFFBF0" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </svg>
);
export const IconShield = ({ size = 30, className, check }: P & { check?: boolean }) => (
  <svg {...base(size)} strokeWidth={2.4} className={className}>
    <path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z" fill={check ? "none" : "#FFFBF0"} />
    {check ? <path d="M8.5 12l2.5 2.5 4.5-5" /> : <path d="M10 9.6a2.1 2.1 0 1 1 2.6 2c-.6.2-.6.7-.6 1.4M12 16.2v.1" />}
  </svg>
);
export const IconTrophy = ({ size = 36, className }: P) => (
  <svg {...base(size)} strokeWidth={2.2} className={className}>
    <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
    <path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v4M8 21h8M9 18h6" />
  </svg>
);
export const IconRibbon = ({ size = 30, className }: P) => (
  <svg {...base(size)} strokeWidth={2.2} className={className}>
    <circle cx="12" cy="9" r="5" />
    <path d="M9 13.5L7.5 21l4.5-2.5 4.5 2.5-1.5-7.5" />
  </svg>
);
export const IconFlame = ({ size = 18 }: P) => (
  <svg width={size} height={size + 2} viewBox="0 0 24 24" fill="#FF6B57" stroke="#1E1B3A" strokeWidth={2} strokeLinejoin="round" aria-hidden>
    <path d="M12 2c1 4 6 6.5 6 12a6 6 0 0 1-12 0c0-3 1.5-4.5 2.5-7 1.5 1 2.5 2.5 2.5 4.5C13 9 12.5 5 12 2z" />
  </svg>
);
export const IconBolt = ({ size = 18 }: P) => (
  <svg width={size} height={size + 2} viewBox="0 0 24 24" fill="#5BC0EB" stroke="#1E1B3A" strokeWidth={2} strokeLinejoin="round" aria-hidden>
    <path d="M13 2L4 14h7l-1 8 9-12h-7z" />
  </svg>
);
export const IconHeart = ({ size = 26 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#FF6B57" stroke="#1E1B3A" strokeWidth={2} strokeLinejoin="round" aria-hidden>
    <path d="M12 21s-7.5-4.6-9.5-9.2C1 8.3 3.2 5 6.6 5c2 0 3.4 1.1 4.4 2.5C12 6.1 13.4 5 15.4 5 18.8 5 21 8.3 19.5 11.8 17.5 16.4 12 21 12 21z" />
  </svg>
);
export const IconBook = ({ size = 24 }: P) => (
  <svg {...base(size)} strokeWidth={2.5}>
    <path d="M3 5h7a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H3z" />
    <path d="M21 5h-7a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h7z" />
  </svg>
);
export const IconChat = ({ size = 24 }: P) => (
  <svg {...base(size)} strokeWidth={2.5}>
    <path d="M4 5h16v11H9l-5 4z" />
  </svg>
);
export const IconCards = ({ size = 24 }: P) => (
  <svg {...base(size)} strokeWidth={2.5}>
    <rect x="3" y="7" width="13" height="14" rx="2" />
    <path d="M8 3h11a2 2 0 0 1 2 2v12" />
  </svg>
);
export const IconUser = ({ size = 24 }: P) => (
  <svg {...base(size)} strokeWidth={2.5}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
);
export const IconDownload = ({ size = 20 }: P) => (
  <svg {...base(size)} strokeWidth={3}>
    <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
  </svg>
);
export const IconShare = ({ size = 20 }: P) => (
  <svg {...base(size)} strokeWidth={3}>
    <path d="M12 15V4M7 8l5-5 5 5M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6" />
  </svg>
);
export const IconClock = ({ size = 16 }: P) => (
  <svg {...base(size)} strokeWidth={3}>
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9v4l2.5 2M9 2h6" />
  </svg>
);
