export function ContextMenu({ visible, x, y, onEdit, onDelete }) {
  if (!visible) return null;

  return (
    <div
      className="fixed bg-slate-800/95 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50 w-48 text-left backdrop-blur-md"
      style={{ top: y, left: x }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={onEdit}
        className="w-full text-left px-4 py-2.5 text-sm font-semibold text-violet-400 hover:bg-violet-500/10 hover:text-violet-300 transition-colors cursor-pointer flex items-center gap-2"
      >
        <span>✏️</span> Редактировать
      </button>
      <div className="mx-3 border-t border-slate-700/60" />
      <button
        type="button"
        onClick={onDelete}
        className="w-full text-left px-4 py-2.5 text-sm font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors cursor-pointer flex items-center gap-2"
      >
        <span>🗑️</span> Удалить обзор
      </button>
    </div>
  );
}