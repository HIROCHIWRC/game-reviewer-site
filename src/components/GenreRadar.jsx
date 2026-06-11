import { getGenreEmoji } from '../utils/genreUtils';

export function GenreRadar({ genres, maxCount }) {
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const r = 78;
  const n = genres.length;
  if (n === 0) return null;

  const angle = (i) => (i * 2 * Math.PI) / n - Math.PI / 2;
  const pt = (i, ratio) => {
    const a = angle(i);
    const radius = r * ratio;
    return { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) };
  };

  const grid = [0.25, 0.5, 0.75, 1].map((l) => genres.map((_, i) => pt(i, l)));
  const dataPts = genres.map((g, i) => pt(i, g.count / maxCount));

  return (
    <div className="flex justify-center mt-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {grid.map((pts, gi) => (
          <polygon key={gi} points={pts.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth={1} />
        ))}
        {genres.map((_, i) => {
          const p = pt(i, 1);
          return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(148,163,184,0.08)" strokeWidth={1} />;
        })}
        <polygon
          points={dataPts.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="rgba(139,92,246,0.18)"
          stroke="#a78bfa"
          strokeWidth={2}
        />
        {dataPts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={4} fill="#a78bfa" stroke="#1e293b" strokeWidth={2} />
            <text x={p.x} y={p.y - 10} textAnchor="middle" fill="#94a3b8" fontSize={11} fontWeight={700}>
              {genres[i].count}
            </text>
          </g>
        ))}
        {genres.map((g, i) => {
          const p = pt(i, 1.18);
          return (
            <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fill="#cbd5e1" fontSize={11} fontWeight={600}>
              {getGenreEmoji(g.genre)} {g.genre}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
