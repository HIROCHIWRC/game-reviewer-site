import { useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { BackButton } from '../components/BackButton';
import { FormSelect } from '../components/FormSelect';
import { SegmentedControl } from '../components/SegmentedControl';
import { ContextMenu } from '../components/ContextMenu';
import { DeleteModal } from '../components/DeleteModal';
import { ScoreBadge } from '../components/ScoreBadge';
import { Autocomplete } from '../components/Autocomplete';
import { InfoButton } from '../components/InfoButton';
import { Pagination } from '../components/Pagination';
import { assetUrl } from '../config';
import { FILTER_GENRE_OPTIONS, SORT_OPTIONS } from '../constants/gameConstants';

const PER_PAGE = 20;

export function ViewGamesScreen({ games, loadError, onRetry, scope, onScopeChange, currentUser, onEditGame, onDeleteGame, onBack, onOpenCard }) {
  const [filterGenre, setFilterGenre] = useState('Все жанры');
  const [sortBy, setSortBy] = useState('🏆 Сначала топовые');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [showInfo, setShowInfo] = useState(false);

  const titleOptions = [...new Set(games.map((g) => g.title))].map((title) => {
    const game = games.find((g) => g.title === title);
    return { title, genre: game.genre };
  });

  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, game: null });
  const [deleteModal, setDeleteModal] = useState({ visible: false, gameId: null, gameTitle: '' });
  const touchTimer = useRef(null);
  const longPressed = useRef(false);

  const handleCloseContextMenu = () => setContextMenu((prev) => ({ ...prev, visible: false }));

  const isOwnGame = (game) => !game.owner || game.owner === currentUser;

  const showContextMenu = (clientX, clientY, game) => {
    if (scope === 'all' || !isOwnGame(game)) return;
    const MENU_W = 192;
    const MENU_H = 90;
    const x = clientX + MENU_W > window.innerWidth ? clientX - MENU_W : clientX;
    const y = clientY + MENU_H > window.innerHeight ? clientY - MENU_H : clientY;
    setContextMenu({ visible: true, x, y, game });
  };

  const handleTouchStart = (e, game) => {
    if (scope === 'all' || !isOwnGame(game)) return;
    longPressed.current = false;
    touchTimer.current = setTimeout(() => {
      longPressed.current = true;
      const touch = e.touches[0];
      showContextMenu(touch.clientX, touch.clientY, game);
    }, 500);
  };

  const handleTouchMove = () => {
    if (touchTimer.current) {
      clearTimeout(touchTimer.current);
      touchTimer.current = null;
    }
  };

  const handleTouchEnd = () => {
    if (touchTimer.current) {
      clearTimeout(touchTimer.current);
      touchTimer.current = null;
    }
  };

  const handleRowClick = (game) => {
    if (longPressed.current) {
      longPressed.current = false;
      return;
    }
    onOpenCard(game);
  };

  const handleSearchChange = (e) => { setSearchQuery(e.target.value); setPage(1); };
  const handleSearchSelect = (item) => { setSearchQuery(item.title); setPage(1); };

  const handleFilterGenreChange = (e) => { setFilterGenre(e.target.value); setPage(1); };
  const handleSortByChange = (e) => { setSortBy(e.target.value); setPage(1); };
  const handleScopeChange = (newScope) => { setPage(1); onScopeChange(newScope); };

  const handleRowContextMenu = (e, game) => {
    if (scope === 'all' || !isOwnGame(game)) return;
    e.preventDefault();
    showContextMenu(e.clientX, e.clientY, game);
  };

  const handleRequestEdit = () => {
    onEditGame(contextMenu.game);
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  const handleRequestDelete = () => {
    setDeleteModal({ visible: true, gameId: contextMenu.game.id, gameTitle: contextMenu.game.title });
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  const handleConfirmDelete = () => {
    onDeleteGame(deleteModal.gameId);
    setDeleteModal({ visible: false, gameId: null, gameTitle: '' });
  };

  const filteredAndSortedGames = useMemo(() => {
    return games
      .filter((game) => !searchQuery || game.title.toLowerCase().includes(searchQuery.toLowerCase()))
      .filter((game) => filterGenre === 'Все жанры' || game.genre === filterGenre)
      .sort((a, b) => {
        if (sortBy === '🏆 Сначала топовые') return b.scores.overall - a.scores.overall;
        if (sortBy === '📉 Сначала похуже') return a.scores.overall - b.scores.overall;
        if (sortBy === '📊 Больше всего отзывов') return (b.reviewCount || 1) - (a.reviewCount || 1);
        if (sortBy === '🔤 По алфавиту (А-Я)') return a.title.localeCompare(b.title);
        return 0;
      });
  }, [games, searchQuery, filterGenre, sortBy]);

  const totalPages = Math.ceil(filteredAndSortedGames.length / PER_PAGE);
  const pagedGames = filteredAndSortedGames.slice((page - 1) * PER_PAGE, page * PER_PAGE);



  const showOwner = scope === 'all';
  const isReadonly = scope === 'all';

  return (
    <div className="py-2" onClick={handleCloseContextMenu}>
      <div className="flex items-center justify-between mb-4">
        <BackButton onClick={onBack} />
        <InfoButton active={showInfo} onToggle={() => setShowInfo((v) => !v)} />
      </div>

      <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400 mb-6">
        Рейтинг
      </h2>

      {/* Инфо-панель */}
      {showInfo && (
        <div className="mb-6 p-5 rounded-xl bg-slate-900/80 border border-violet-500/40 text-left text-sm text-slate-300 space-y-3 shadow-2xl">
          <p>
            <span className="font-bold text-violet-400">👤 Мой</span> — только твои обзоры. Можно добавлять, редактировать и удалять игры.
          </p>
          <p>
            <span className="font-bold text-violet-400">🌐 Общий</span> — сводная таблица по всем пользователям. Оценки усредняются.
          </p>
          <p className="text-xs text-slate-500">
            Если больше половины пользователей отключили параметр (атмосфера, сюжет или музыка) — он не учитывается в итоговом балле. Жанр определяется по большинству голосов.
          </p>
        </div>
      )}

      {/* Селектор Мой / Общий */}
      <div className="mb-4">
        <SegmentedControl
          options={[
            { value: 'my', label: '👤 Мой' },
            { value: 'all', label: '🌐 Общий' },
          ]}
          value={scope}
          onChange={handleScopeChange}
        />
      </div>

      {/* Поиск по названию */}
      <div className="mb-4">
        <Autocomplete
          value={searchQuery}
          onChange={handleSearchChange}
          onSelect={handleSearchSelect}
          options={titleOptions}
          placeholder="🔍 Поиск по названию..."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 text-left bg-slate-900/40 border border-slate-700/40 p-4 rounded-xl">
        <FormSelect
          label="Фильтр по жанру"
          value={filterGenre}
          onChange={handleFilterGenreChange}
          options={FILTER_GENRE_OPTIONS}
        />
        <FormSelect
          label="Сортировка списка"
          value={sortBy}
          onChange={handleSortByChange}
          options={SORT_OPTIONS}
        />
      </div>

      {loadError ? (
        <div className="text-center py-16 bg-slate-900/20 border border-dashed border-rose-500/30 rounded-xl">
          <p className="text-rose-400 font-medium mb-2">⚠️ Ошибка загрузки</p>
          <p className="text-slate-500 text-sm mb-6">{loadError}</p>
          <button
            type="button"
            onClick={onRetry}
            className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-all cursor-pointer active:scale-95"
          >
            🔄 Повторить попытку
          </button>
        </div>
      ) : filteredAndSortedGames.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/20 border border-dashed border-slate-700/50 rounded-xl">
          <p className="text-slate-500 font-medium">
            {games.length === 0
              ? (scope === 'all' ? '😴 Никто ещё не добавил ни одной игры.' : '😴 Рейтинг пуст. Добавь первую игру!')
              : 'Игры не найдены. Измени фильтр или добавь новые обзоры!'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-700/60 bg-slate-900/30">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-700/80 text-xs font-bold uppercase tracking-wider text-slate-400">
                <th className="py-4 px-3 text-center text-slate-500 w-14">Обложка</th>
                <th className="py-4 px-4">Название</th>
                {showOwner && <th className="py-4 px-3 text-center">Обзоров</th>}
                <th className="py-4 px-3">Жанр</th>
                <th className="py-4 px-3 text-center">Геймплей</th>
                <th className="py-4 px-3 text-center">Атмосфера</th>
                <th className="py-4 px-3 text-center">Сюжет</th>
                <th className="py-4 px-3 text-center">Звук</th>
                <th className="py-4 px-3 text-center">Техн.</th>
                <th className="py-4 px-3 text-center">Впечатление</th>
                <th className="py-4 px-5 text-center bg-violet-950/20 text-violet-300 border-l border-slate-700/30">
                  Итог
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              {pagedGames.map((game) => {
                const own = isReadonly ? false : isOwnGame(game);
                return (
                  <tr
                    key={isReadonly ? game.title : game.id}
                    onClick={() => handleRowClick(game)}
                    onContextMenu={(e) => handleRowContextMenu(e, game)}
                    onTouchStart={(e) => handleTouchStart(e, game)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    className={`transition-colors cursor-pointer ${own ? 'hover:bg-slate-800/40' : 'hover:bg-slate-800/20'}`}
                  >
                    <td className="py-3 px-3 text-center">
                      <div className="relative w-9 h-9 mx-auto">
                        {game.coverUrl && (
                          <img
                            key={game.coverUrl}
                            src={assetUrl(game.coverUrl)}
                            alt=""
                            className="absolute inset-0 w-full h-full rounded object-cover z-10"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        )}
                        <div className="w-9 h-9 bg-slate-800 border border-slate-700/40 rounded flex items-center justify-center text-xs text-slate-500 font-mono select-none">
                          —
                        </div>
                      </div>
                    </td>
                    <td
                      className="py-3.5 px-4 font-bold text-slate-200 max-w-[160px] truncate"
                      title={game.title}
                    >
                      {game.title}
                    </td>
                    {showOwner && (
                      <td className="py-3.5 px-3 text-center">
                        <span className="text-xs font-bold text-violet-400">{game.reviewCount}</span>
                      </td>
                    )}
                    <td className="py-3.5 px-3 text-slate-400">
                      <span className="px-2 py-0.5 bg-slate-800 rounded-md border border-slate-700/40 text-xs">
                        {game.genre}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center"><ScoreBadge score={game.scores.gameplay} /></td>
                    <td className="py-3.5 px-3 text-center"><ScoreBadge score={game.scores.atmosphere} /></td>
                    <td className="py-3.5 px-3 text-center"><ScoreBadge score={game.scores.story} /></td>
                    <td className="py-3.5 px-3 text-center"><ScoreBadge score={game.scores.music} /></td>
                    <td className="py-3.5 px-3 text-center"><ScoreBadge score={game.scores.technical} /></td>
                    <td className="py-3.5 px-3 text-center"><ScoreBadge score={game.scores.impression} /></td>
                    <td className="py-3.5 px-5 text-center font-black bg-violet-950/10 border-l border-slate-700/30">
                      <ScoreBadge score={game.scores.overall} isFinal />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {createPortal(
        <ContextMenu
          visible={contextMenu.visible}
          x={contextMenu.x}
          y={contextMenu.y}
          onEdit={handleRequestEdit}
          onDelete={handleRequestDelete}
        />,
        document.body
      )}
      {createPortal(
        <DeleteModal
          visible={deleteModal.visible}
          gameTitle={deleteModal.gameTitle}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteModal({ visible: false, gameId: null, gameTitle: '' })}
        />,
        document.body
      )}
    </div>
  );
}