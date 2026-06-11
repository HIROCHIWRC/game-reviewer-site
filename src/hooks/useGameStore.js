import { useState, useEffect, useCallback, useRef } from 'react';
import { calculateOverallScore } from '../utils/scoreUtils';
import { gamesApi } from '../api';
import { getRank } from '../constants/ranks';

const DEFAULT_FORM_STATE = {
  title: '',
  genre: 'Action',
  gameplay: 5,
  atmosphere: 5,
  story: 5,
  music: 5,
  technical: 5,
  impression: 5,
  hasAtmosphere: true,
  hasStory: true,
  hasMusic: true,
  comment: '',
  coverUrl: '',
  posterUrl: '',
};

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 800;

export function useGameStore() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [scope, setScope] = useState('my');
  const [form, setForm] = useState(DEFAULT_FORM_STATE);
  const [editingGameId, setEditingGameId] = useState(null);
  const [notification, setNotification] = useState(null);
  const loadId = useRef(0);
  const retryTimer = useRef(null);
  const scopeRef = useRef(scope);

  const clearNotification = useCallback(() => setNotification(null), []);
  const notif = (type, message) => setNotification({ type, message });

  const checkLevelUp = (prevCount, newCount) => {
    const prevRank = getRank(prevCount);
    const newRank = getRank(newCount);
    if (newRank.name !== prevRank.name) {
      notif('success', `🎉 Новый ранг: ${newRank.emoji} ${newRank.name}!`);
    }
  };

  const loadGames = useCallback(() => {
    clearTimeout(retryTimer.current);
    setLoadError(null);
    setLoading(true);

    const currentLoadId = ++loadId.current;
    const currentScope = scopeRef.current;

    const attempt = async (retryCount = 1) => {
      try {
        const data = await gamesApi.getAll(currentScope);
        if (currentLoadId !== loadId.current) return;
        setGames(data);
        setLoadError(null);
        setLoading(false);
      } catch (err) {
        if (currentLoadId !== loadId.current) return;
        if (retryCount < MAX_RETRIES) {
          retryTimer.current = setTimeout(() => attempt(retryCount + 1), RETRY_DELAY_MS * retryCount);
          return;
        }
        setLoadError(err.message || 'Не удалось загрузить игры');
        setLoading(false);
      }
    };

    attempt();
  }, []);

  const handleScopeChange = useCallback((newScope) => {
    setScope(newScope);
    scopeRef.current = newScope;
    loadGames();
  }, [loadGames]);

  // Загружаем игры с сервера при старте
  useEffect(() => {
    const id = setTimeout(loadGames, 0);
    const currentId = loadId.current;
    return () => {
      clearTimeout(id);
      clearTimeout(retryTimer.current);
      loadId.current = currentId + 1;
    };
  }, [loadGames]);

  const setFormField = (field) => (value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const resetForm = () => {
    setForm(DEFAULT_FORM_STATE);
    setEditingGameId(null);
  };

  const currentOverallScore = calculateOverallScore(form);

  const startEditing = (game) => {
    setEditingGameId(game.id);
    setForm({
      title: game.title,
      genre: game.genre,
      gameplay: game.scores.gameplay,
      atmosphere: game.scores.atmosphere ?? 5,
      story: game.scores.story ?? 5,
      music: game.scores.music ?? 5,
      technical: game.scores.technical,
      impression: game.scores.impression,
      hasAtmosphere: game.scores.atmosphere !== null,
      hasStory: game.scores.story !== null,
      hasMusic: game.scores.music !== null,
      comment: game.comment || '',
      coverUrl: game.coverUrl || '',
      posterUrl: game.posterUrl || '',
    });
  };

  const saveGame = async () => {
    if (!form.title.trim()) {
      notif('error', 'Сначала введи название игры!');
      return false;
    }
    if (form.title.trim().length > 100) {
      notif('error', 'Название игры не может быть длиннее 100 символов');
      return false;
    }
    if (form.comment.length > 500) {
      notif('error', 'Комментарий не может быть длиннее 500 символов');
      return false;
    }

    const scores = {
      gameplay: form.gameplay,
      atmosphere: form.hasAtmosphere ? form.atmosphere : null,
      story: form.hasStory ? form.story : null,
      music: form.hasMusic ? form.music : null,
      technical: form.technical,
      impression: form.impression,
      overall: currentOverallScore,
    };

    try {
      if (editingGameId) {
        const comment = form.comment.trim();
        const cover = (form.coverUrl || '').trim();
        const poster = (form.posterUrl || '').trim();
        await gamesApi.update(editingGameId, {
          title: form.title.trim(), genre: form.genre, scores, comment, coverUrl: cover, posterUrl: poster,
          savedAt: new Date().toLocaleString(),
        });
        setGames((prev) =>
          prev.map((g) =>
            g.id === editingGameId
              ? { ...g, title: form.title.trim(), genre: form.genre, scores, comment, coverUrl: cover, posterUrl: poster, savedAt: new Date().toLocaleString() }
              : g
          )
        );
        notif('success', `Игра "${form.title}" обновлена! Рейтинг: ${currentOverallScore}`);
      } else {
        const comment = form.comment.trim();
        const newGame = {
          id: crypto.randomUUID(),
          title: form.title.trim(),
          genre: form.genre,
          scores, comment,
          coverUrl: (form.coverUrl || '').trim(),
          posterUrl: (form.posterUrl || '').trim(),
          savedAt: new Date().toLocaleString(),
        };
        const result = await gamesApi.add(newGame);
        setGames((prev) => [...prev, newGame]);
        checkLevelUp(games.length, games.length + 1);
        const rewardMsg = result.reward === 2 ? ' (+2 🪙 за новую игру!)' : ' (+1 🪙)';
        notif('success', `Игра "${form.title}" добавлена! Рейтинг: ${currentOverallScore}${rewardMsg}`);
        resetForm();
        return { success: true, coins: result.coins };
      }
      resetForm();
      return { success: true };
    } catch (err) {
      notif('error', `Ошибка: ${err.message}`);
      return { success: false };
    }
  };

  const deleteGame = async (id) => {
    try {
      await gamesApi.remove(id);
      setGames((prev) => prev.filter((g) => g.id !== id));
    } catch (err) {
      notif('error', `Ошибка удаления: ${err.message}`);
    }
  };

  const exportToJson = () => {
    if (games.length === 0) return;
    const blob = new Blob([JSON.stringify(games, null, 2)], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = 'game_tier_list.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  };

  return {
    games,
    loading,
    loadError,
    retryLoad: loadGames,
    scope,
    setScope: handleScopeChange,
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
  };
}