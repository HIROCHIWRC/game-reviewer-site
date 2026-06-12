import React, { useState, useCallback, useEffect, Suspense } from 'react';
import { useAuth } from './hooks/useAuth';
import { useGameStore } from './hooks/useGameStore';
import { AuthScreen } from './screens/AuthScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { MemeAdBanner } from './components/MemeAdBanner';
import { IconButton } from './components/IconButton';
import { CoinIcon } from './components/CoinIcon';
import { Notification } from './components/Notification';
import { gamesApi, chatApi, authApi } from './api';
import { getRank } from './constants/ranks';

const AddGameScreen = React.lazy(() => import('./screens/AddGameScreen').then(m => ({ default: m.AddGameScreen })));
const ViewGamesScreen = React.lazy(() => import('./screens/ViewGamesScreen').then(m => ({ default: m.ViewGamesScreen })));
const GameCardScreen = React.lazy(() => import('./screens/GameCardScreen').then(m => ({ default: m.GameCardScreen })));
const ProfileScreen = React.lazy(() => import('./screens/ProfileScreen').then(m => ({ default: m.ProfileScreen })));
const UserProfileScreen = React.lazy(() => import('./screens/UserProfileScreen').then(m => ({ default: m.UserProfileScreen })));
const LeaderboardScreen = React.lazy(() => import('./screens/LeaderboardScreen').then(m => ({ default: m.LeaderboardScreen })));
const CasinoScreen = React.lazy(() => import('./screens/CasinoScreen').then(m => ({ default: m.CasinoScreen })));
const CaseOpeningScreen = React.lazy(() => import('./screens/CaseOpeningScreen').then(m => ({ default: m.CaseOpeningScreen })));
const InventoryScreen = React.lazy(() => import('./screens/InventoryScreen').then(m => ({ default: m.InventoryScreen })));
const ChatScreen = React.lazy(() => import('./screens/ChatScreen').then(m => ({ default: m.ChatScreen })));
const AdminScreen = React.lazy(() => import('./screens/AdminScreen').then(m => ({ default: m.AdminScreen })));

function ScreenFallback() {
  return (
    <div className="flex items-center justify-center py-24 text-slate-500">
      ⏳ Загрузка...
    </div>
  );
}

function AuthenticatedApp({ user, onLogout, onUpdateCoins }) {
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [cardGames, setCardGames] = useState([]);
  const [cardError, setCardError] = useState(null);
  const [cardLoading, setCardLoading] = useState(false);
  const [cardTitle, setCardTitle] = useState('');
  const [viewProfileUsername, setViewProfileUsername] = useState(null);
  const [profileReturnScreen, setProfileReturnScreen] = useState('game-card');
  const [openingCaseData, setOpeningCaseData] = useState(null);
  const [latestMessageId, setLatestMessageId] = useState(Number(localStorage.getItem('seenMessageId')) || 0);
  const [chatUnread, setChatUnread] = useState(false);
  const [userGameCount, setUserGameCount] = useState(0);

  useEffect(() => {
    authApi.getProfile().then((data) => setUserGameCount(data.gameCount || 0)).catch(() => {});
  }, []);

  const {
    games,
    loading,
    loadError,
    retryLoad,
    scope,
    setScope,
    form,
    setFormField,
    resetForm,
    editingGameId,
    startEditing,
    currentOverallScore,
    saveGame,
    deleteGame,
    exportToJson,
    notification,
    clearNotification,
  } = useGameStore();

  const handleSave = async () => {
    const result = await saveGame();
    if (result.success) {
      if (result.coins != null && onUpdateCoins) onUpdateCoins(result.coins);
      setCurrentScreen('view-games');
    }
  };

  const handleBack = () => {
    resetForm();
    setCurrentScreen(editingGameId ? 'view-games' : 'dashboard');
  };

  const handleEdit = (game) => {
    startEditing(game);
    setCurrentScreen('add-game');
  };

  const fetchCard = useCallback((title) => {
    setCardLoading(true);
    setCardError(null);
    setCardTitle(title);
    gamesApi.getByTitle(title)
      .then((data) => { setCardGames(data); setCardLoading(false); })
      .catch((err) => { setCardError(err.message); setCardGames([]); setCardLoading(false); });
  }, []);

  const handleOpenCard = useCallback((game) => {
    if (scope === 'all') {
      fetchCard(game.title);
    } else {
      setCardGames([game]);
      setCardError(null);
      setCardLoading(false);
    }
    setCurrentScreen('game-card');
  }, [scope, fetchCard]);

  const markChatRead = useCallback(() => {
    if (latestMessageId > 0) {
      localStorage.setItem('seenMessageId', String(latestMessageId));
      setChatUnread(false);
    }
  }, [latestMessageId]);

  // Poll for new messages
  useEffect(() => {
    const check = () => {
      chatApi.get().then((data) => {
        const msgs = data.messages || [];
        if (msgs.length > 0) {
          const latest = msgs[msgs.length - 1];
          setLatestMessageId((prev) => Math.max(prev, latest.id));
          const seen = Number(localStorage.getItem('seenMessageId')) || 0;
          if (latest.id > seen && latest.username !== user.username && currentScreen !== 'chat') {
            setChatUnread(true);
          }
        }
      }).catch(() => {});
    };
    check();
    const interval = setInterval(check, 7000);
    return () => clearInterval(interval);
  }, [currentScreen, user.username]);

  const handleViewProfile = useCallback((username, returnScreen = 'game-card') => {
    setViewProfileUsername(username);
    setProfileReturnScreen(returnScreen);
    setCurrentScreen('view-profile');
  }, []);

  const isWideScreen = currentScreen === 'view-games' || currentScreen === 'game-card' || currentScreen === 'view-profile' || currentScreen === 'leaderboard' || currentScreen === 'casino' || currentScreen === 'inventory' || currentScreen === 'case-opening' || currentScreen === 'chat' || currentScreen === 'admin';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-3 md:p-8 flex flex-col items-center select-none relative overflow-x-hidden">

      <MemeAdBanner />

      <header className="mb-8 md:mb-12 text-center w-full max-w-6xl flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          <CoinIcon className="w-5 h-5 md:w-6 md:h-6" />
          <span className="text-sm md:text-lg font-bold text-slate-200">{user.coins || 0}</span>
        </div>
        <h1 className="text-xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent truncate">
          Game Reviewer
        </h1>
        <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
          <span className={`text-xs md:text-base font-semibold truncate max-w-[80px] md:max-w-none transition-all ${getRank(userGameCount).labelClass}`}>{user.username}</span>
          <IconButton
            variant="violet"
            size="sm"
            onClick={() => setCurrentScreen('profile')}
            aria-label="Профиль"
            title="Профиль"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </IconButton>
        </div>
      </header>

      <main
        className={`w-full bg-slate-800/50 border border-slate-700/50 rounded-xl md:rounded-2xl p-4 md:p-8 backdrop-blur-sm transition-all duration-300 ${
          isWideScreen ? 'max-w-6xl' : 'max-w-3xl'
        }`}
      >
        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-500">
            ⏳ Загрузка игр...
          </div>
        ) : (
          <Suspense fallback={<ScreenFallback />}>
            {currentScreen === 'dashboard' && (
              <DashboardScreen
                gamesCount={games.length}
                loadError={loadError}
                onRetry={retryLoad}
                onAddGame={() => setCurrentScreen('add-game')}
                onViewGames={() => setCurrentScreen('view-games')}
                onViewLeaderboard={() => setCurrentScreen('leaderboard')}
                onExport={exportToJson}
                onOpenCasino={() => setCurrentScreen('casino')}
                onOpenChat={() => { markChatRead(); setCurrentScreen('chat'); }}
                chatUnread={chatUnread}
              />
            )}
            {currentScreen === 'add-game' && (
              <AddGameScreen
                form={form}
                setFormField={setFormField}
                currentOverallScore={currentOverallScore}
                isEditing={!!editingGameId}
                onSave={handleSave}
                onBack={handleBack}
              />
            )}
            {currentScreen === 'view-games' && (
              <ViewGamesScreen
                games={games}
                loadError={loadError}
                onRetry={retryLoad}
                scope={scope}
                onScopeChange={setScope}
                currentUser={user.username}
                onEditGame={handleEdit}
                onDeleteGame={deleteGame}
                onBack={() => setCurrentScreen('dashboard')}
                onOpenCard={handleOpenCard}
              />
            )}
            {currentScreen === 'view-profile' && viewProfileUsername && (
              <UserProfileScreen
                key={viewProfileUsername}
                profileUsername={viewProfileUsername}
                onBack={() => setCurrentScreen(profileReturnScreen)}
              />
            )}
            {currentScreen === 'leaderboard' && (
              <LeaderboardScreen
                onBack={() => setCurrentScreen('dashboard')}
                onViewProfile={(username) => handleViewProfile(username, 'leaderboard')}
              />
            )}
            {currentScreen === 'profile' && (
              <ProfileScreen
                username={user.username}
                coins={user.coins || 0}
                isAdmin={user.isAdmin}
                onBack={() => setCurrentScreen('dashboard')}
                onLogout={onLogout}
                onOpenInventory={() => setCurrentScreen('inventory')}
                onOpenAdmin={() => setCurrentScreen('admin')}
              />
            )}
            {currentScreen === 'inventory' && (
              <InventoryScreen
                onBack={() => setCurrentScreen('profile')}
                onCoinsChange={onUpdateCoins}
              />
            )}
            {currentScreen === 'casino' && (
              <CasinoScreen
                onBack={() => setCurrentScreen('dashboard')}
                onOpenCase={(caseData) => { setOpeningCaseData(caseData); setCurrentScreen('case-opening'); }}
              />
            )}
            {currentScreen === 'case-opening' && openingCaseData && (
              <CaseOpeningScreen
                caseData={openingCaseData}
                coins={user.coins || 0}
                onBack={() => { setOpeningCaseData(null); setCurrentScreen('casino'); }}
                onUpdateCoins={onUpdateCoins}
              />
            )}
            {currentScreen === 'chat' && (
              <ChatScreen
                username={user.username}
                onBack={() => { markChatRead(); setCurrentScreen('dashboard'); }}
                onViewProfile={(name) => handleViewProfile(name, 'chat')}
              />
            )}
            {currentScreen === 'admin' && (
              <AdminScreen
                onBack={() => setCurrentScreen('profile')}
              />
            )}
            {currentScreen === 'game-card' && (
              cardLoading ? (
                <div className="flex items-center justify-center py-24 text-slate-500">
                  ⏳ Загрузка обзоров...
                </div>
              ) : cardError ? (
                <div className="text-center py-16 bg-slate-900/20 border border-dashed border-rose-500/30 rounded-xl">
                  <p className="text-rose-400 font-medium mb-2">⚠️ Ошибка загрузки</p>
                  <p className="text-slate-500 text-sm mb-6">{cardError}</p>
                  <button
                    type="button"
                    onClick={() => fetchCard(cardTitle)}
                    className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-all cursor-pointer active:scale-95"
                  >
                    🔄 Повторить попытку
                  </button>
                </div>
              ) : (
                <GameCardScreen
                  games={cardGames}
                  onBack={() => { setCardError(null); setCardLoading(false); setCurrentScreen('view-games'); }}
                  onViewProfile={handleViewProfile}
                />
              )
            )}
          </Suspense>
        )}
      </main>

      <Notification notification={notification} onClose={clearNotification} />
      <span className="fixed bottom-2 right-3 text-[11px] text-slate-700/50 select-none pointer-events-none">
        v1.0.1
      </span>
    </div>
  );
}

function App() {
  const { user, authError, authLoading, login, register, logout, setCoins } = useAuth();

  if (!user) {
    return (
      <AuthScreen
        onLogin={login}
        onRegister={register}
        error={authError}
        loading={authLoading}
      />
    );
  }

  return <AuthenticatedApp key={user.username} user={user} onLogout={logout} onUpdateCoins={setCoins} />;
}

export default App;