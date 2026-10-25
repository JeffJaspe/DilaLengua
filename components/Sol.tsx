// Sol, the sun mascot. `mood="cheer"` closes the eyes and opens the smile.
export function Sol({ size = 96, mood = "smile", label }: { size?: number; mood?: "smile" | "cheer"; label?: string }) {
  const ray = (t?: string) => (
    <>
      <rect x="46" y="2" width="8" height="18" rx="4" transform={t} />
      <rect x="46" y="80" width="8" height="18" rx="4" transform={t} />
      <rect x="2" y="46" width="18" height="8" rx="4" transform={t} />
      <rect x="80" y="46" width="18" height="8" rx="4" transform={t} />
    </>
  );
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <g className="origin-center animate-spin-slow [transform-box:fill-box]" fill="#FF9F1C" stroke="#1E1B3A" strokeWidth="2.5">
        {ray()}
        {ray("rotate(45 50 50)")}
      </g>
      <circle cx="50" cy="50" r="27" fill="#FF9F1C" stroke="#1E1B3A" strokeWidth="3" />
      {mood === "smile" ? (
        <>
          <circle cx="41" cy="46" r="3.5" fill="#1E1B3A" />
          <circle cx="59" cy="46" r="3.5" fill="#1E1B3A" />
          <path d="M40 56 Q50 66 60 56" fill="none" stroke="#1E1B3A" strokeWidth="3" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M37 46 Q41 41 45 46" fill="none" stroke="#1E1B3A" strokeWidth="3" strokeLinecap="round" />
          <path d="M55 46 Q59 41 63 46" fill="none" stroke="#1E1B3A" strokeWidth="3" strokeLinecap="round" />
          <path d="M39 54 Q50 70 61 54 Z" fill="#1E1B3A" stroke="#1E1B3A" strokeWidth="2.5" strokeLinejoin="round" />
        </>
      )}
      <circle cx="35" cy="55" r="4.5" fill="#FF6B57" />
      <circle cx="65" cy="55" r="4.5" fill="#FF6B57" />
    </svg>
  );
}
