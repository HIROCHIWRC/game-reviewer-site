export function CoinIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className + ' text-yellow-400'} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
      <text x="12" y="15.5" textAnchor="middle" fontSize="12" fontWeight="bold" fill="currentColor">$</text>
    </svg>
  );
}
