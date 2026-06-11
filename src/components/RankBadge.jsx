import { ProgressBar } from './ProgressBar';
import { getRank } from '../constants/ranks';

export function RankBadge({ gameCount }) {
  const rank = getRank(gameCount);

  return (
    <div className="text-center mb-6">
      <span className="text-3xl">{rank.emoji}</span>
      <p className={`text-sm font-bold mt-1 ${rank.labelClass}`}>{rank.name}</p>
      {rank.max < Infinity && gameCount < rank.max && (
        <div className="mt-3 max-w-xs mx-auto">
          <ProgressBar
            value={gameCount - rank.min}
            max={rank.max - rank.min}
            barClass={rank.barClass}
            label={`${gameCount} / ${rank.max}`}
          />
        </div>
      )}
      {rank.max === Infinity && (
        <p className="text-xs text-slate-500 mt-1">{gameCount} обзоров</p>
      )}
    </div>
  );
}
