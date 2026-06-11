import { useMemo } from 'react';

const ORANGE_SCALE = {
  1: '#ef4444', 2: '#f75a3f', 3: '#fa7c32', 4: '#f99e1b', 5: '#eab308',
  6: '#c0e12c', 7: '#82e149', 8: '#22c55e', 9: '#10b981', 10: '#00f5a0',
};

function getFinalColor(score) {
  const startHue = 355;
  const endHue = 265;
  const hue = Math.round(startHue - ((Math.min(Math.max(score, 1), 10) - 1) / 9) * (startHue - endHue));
  return score >= 10 ? `hsl(${hue}, 100%, 72%)` : `hsl(${hue}, 95%, 58%)`;
}

export function ScoreBadge({ score, isFinal = false }) {
  const color = useMemo(() => {
    if (score === null || score === undefined) return null;
    if (isFinal) return getFinalColor(score);
    return ORANGE_SCALE[Math.round(Math.min(Math.max(score, 1), 10))] || '#eab308';
  }, [score, isFinal]);

  if (!color) {
    return <span className="text-slate-600">—</span>;
  }

  if (isFinal) {
    return (
      <span
        className="font-black"
        style={{
          color,
          textShadow: score >= 9.5 ? `0 0 8px ${color}80` : undefined,
        }}
      >
        {score}
      </span>
    );
  }

  return <span className="font-bold" style={{ color }}>{score}</span>;
}