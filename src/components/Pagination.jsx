export function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-6 text-sm text-slate-400">
      <button
        type="button"
        disabled={page === 1}
        onClick={() => onPageChange(Math.max(1, page - 1))}
        className="px-4 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50 hover:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
      >
        ← Предыдущая
      </button>
      <span>
        Страница {page} из {totalPages}
      </span>
      <button
        type="button"
        disabled={page === totalPages}
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        className="px-4 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50 hover:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
      >
        Следующая →
      </button>
    </div>
  );
}
