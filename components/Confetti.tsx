const PIECES = [
  ["6%", "#FF6B57", "0s"],
  ["18%", "#5BC0EB", "1.1s"],
  ["31%", "#3DDC97", ".4s"],
  ["44%", "#FFFBF0", "1.8s"],
  ["57%", "#FF9F1C", ".8s"],
  ["69%", "#FF6B57", "2.2s"],
  ["81%", "#5BC0EB", ".2s"],
  ["92%", "#3DDC97", "1.5s"],
];

export function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {PIECES.map(([left, bg, delay]) => (
        <span key={left} className="absolute -top-6 h-4 w-2.5 animate-fall rounded-[3px] border-2 border-ink motion-reduce:hidden" style={{ left, background: bg, animationDelay: delay }} />
      ))}
    </div>
  );
}
