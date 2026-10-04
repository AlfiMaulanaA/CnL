import type { Point } from '@/lib/game/board';

type ChuteProps = {
  /** Top of the slide (the tile you landed on). */
  from: Point;
  /** Bottom of the slide. */
  to: Point;
  color: string;
  accent: string;
};

/**
 * A playful curved slide (an original swooping path — deliberately NOT a
 * snake illustration) between two normalized board points, drawn in the
 * 0..100 SVG viewBox.
 */
export function Chute({ from, to, color, accent }: ChuteProps) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const bend = Math.min(20, len * 0.3);
  const nx = (-dy / len) * bend;
  const ny = (dx / len) * bend;

  const c1 = { x: from.x + dx * 0.28 + nx, y: from.y + dy * 0.28 + ny };
  const c2 = { x: from.x + dx * 0.74 - nx, y: from.y + dy * 0.74 - ny };
  const d = `M ${from.x} ${from.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${to.x} ${to.y}`;

  // Arrow head at the exit, pointing along the end tangent (c2 -> to).
  const tax = to.x - c2.x;
  const tay = to.y - c2.y;
  const taLen = Math.hypot(tax, tay) || 1;
  const fx = tax / taLen;
  const fy = tay / taLen;
  const ax = -fy;
  const ay = fx;
  const back = 5.2;
  const wing = 3.2;
  const arrow = [
    `${to.x},${to.y}`,
    `${to.x - fx * back + ax * wing},${to.y - fy * back + ay * wing}`,
    `${to.x - fx * back - ax * wing},${to.y - fy * back - ay * wing}`
  ].join(' ');

  return (
    <g pointerEvents="none" strokeLinecap="round">
      <path d={d} transform="translate(1.6, 2.4)" fill="none" stroke="#0F172A" strokeWidth={5} opacity="0.15" />
      <path d={d} fill="none" stroke={color} strokeWidth={5} />
      <path d={d} fill="none" stroke={accent} strokeWidth={1.6} strokeDasharray="4 5" />
      <circle cx={from.x} cy={from.y} r={2.6} fill={color} />
      <polygon points={arrow} fill={color} />
    </g>
  );
}
