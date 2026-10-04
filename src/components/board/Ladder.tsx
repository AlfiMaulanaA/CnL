import type { Point } from '@/lib/game/board';

type LadderProps = {
  from: Point;
  to: Point;
  color: string;
  accent: string;
};

/**
 * A ladder drawn as two rails + rungs between two normalized board points.
 * Coordinates are already scaled to the 0..100 SVG viewBox.
 */
export function Ladder({ from, to, color, accent }: LadderProps) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  // Perpendicular unit vector scaled to the rail half-width.
  const hx = -uy * 2.2;
  const hy = ux * 2.2;

  const rails = [
    { x1: from.x + hx, y1: from.y + hy, x2: to.x + hx, y2: to.y + hy },
    { x1: from.x - hx, y1: from.y - hy, x2: to.x - hx, y2: to.y - hy }
  ];

  const rungCount = Math.max(3, Math.round(len / 9));
  const rungs = Array.from({ length: rungCount }, (_, i) => {
    const t = (i + 1) / (rungCount + 1);
    const cx = from.x + dx * t;
    const cy = from.y + dy * t;
    return { x1: cx + hx, y1: cy + hy, x2: cx - hx, y2: cy - hy };
  });

  return (
    <g pointerEvents="none" strokeLinecap="round">
      {/* soft drop shadow */}
      <g transform="translate(1.6, 2.4)" opacity="0.18">
        {rails.map((r, i) => (
          <line key={`sr${i}`} {...r} stroke="#0F172A" strokeWidth={2.8} />
        ))}
      </g>
      {rails.map((r, i) => (
        <line key={`r${i}`} {...r} stroke={color} strokeWidth={2.6} />
      ))}
      {rungs.map((r, i) => (
        <line key={`g${i}`} {...r} stroke={accent} strokeWidth={1.7} />
      ))}
      <circle cx={from.x} cy={from.y} r={2.4} fill={color} />
      <circle cx={to.x} cy={to.y} r={2.4} fill={color} />
    </g>
  );
}
