import { YellowButton } from '../components/YellowButton';
import { SecondaryButton } from '../components/SecondaryButton';

export function DashboardScreen({ gamesCount, loadError, onRetry, onAddGame, onViewGames, onViewLeaderboard, onExport, onOpenCasino, onOpenChat, chatUnread }) {
  if (loadError && gamesCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-6">
        <p className="text-rose-400 font-medium text-lg">⚠️ Ошибка подключения к серверу</p>
        <p className="text-slate-500 text-sm max-w-md text-center">{loadError}</p>
        <button
          type="button"
          onClick={onRetry}
          className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-all cursor-pointer active:scale-95"
        >
          🔄 Повторить попытку
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-6 md:py-12 space-y-4 md:space-y-6 w-full max-w-lg mx-auto">
      <div className="w-full">
        <YellowButton
          text="🎮 Добавить новую игру"
          onClick={onAddGame}
          className="w-full"
        />
      </div>

      <div className="w-full">
        <SecondaryButton
          text="📊 Посмотреть рейтинг"
          onClick={onViewGames}
          variant="violet"
          className="w-full"
        />
      </div>

      <div className="w-full">
        <SecondaryButton
          text="🏆 Лучшие пользователи"
          onClick={onViewLeaderboard}
          variant="violet"
          className="w-full"
        />
      </div>

      <div className="w-full">
        <button
          type="button"
          onClick={onOpenCasino}
          className="w-full h-[44px] bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-500 hover:to-violet-500 text-white font-bold rounded-xl transition-all cursor-pointer active:scale-95 text-sm animate-glow-pulse"
        >
          🎲 Бурмалда
        </button>
      </div>

      <div className="relative w-full">
        <SecondaryButton
          text="💬 Чат"
          onClick={onOpenChat}
          variant="outline"
          className="w-full"
        />
        {chatUnread && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center shadow-lg shadow-rose-500/50">
            <span className="text-[9px] font-bold text-white">!</span>
          </div>
        )}
      </div>

      <div className="w-full">
        <SecondaryButton
          text="📦 Экспорт базы в JSON"
          onClick={onExport}
          disabled={gamesCount === 0}
          variant={gamesCount > 0 ? 'outline' : 'danger'}
          className="w-full"
        />
      </div>

      <div className="w-full">
        <SecondaryButton
          text="💩 Разрабы дауны"
          onClick={() => window.open('https://t.me/HIROCHI_WRC', '_blank')}
          variant="outline"
          className="w-full"
        />
      </div>
    </div>
  );
}