import { API_BASE } from './config';

let onUnauthorized = null;

export function registerOnUnauthorized(cb) {
  onUnauthorized = cb;
}

// Получить токен из localStorage
const getToken = () => localStorage.getItem('token');

// Базовый fetch с авторизацией
async function request(path, options = {}) {
  const token = getToken();
  let res;
  try {
    res = await fetch(`${API_BASE}/api${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error('Наши сервера утонули в какашках :(');
  }

  const data = await res.json();
  if (!res.ok) {
    if (res.status === 401 && onUnauthorized) onUnauthorized();
    throw new Error(data.error || 'Ошибка сервера');
  }
  return data;
}

// Multipart/form-data запрос (для загрузки файлов)
async function requestFormData(path, formData) {
  const token = getToken();
  let res;
  try {
    res = await fetch(`${API_BASE}/api${path}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
  } catch {
    throw new Error('Наши сервера утонули в какашках :(');
  }
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 401 && onUnauthorized) onUnauthorized();
    throw new Error(data.error || 'Ошибка сервера');
  }
  return data;
}

// --- Auth ---
export const authApi = {
  register: (username, password) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) }),

  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),

  getProfile: () => request('/auth/profile'),
  getUserProfile: (username) => request(`/auth/profile/${encodeURIComponent(username)}`),
};

// --- Users ---
export const usersApi = {
  getLeaderboard: () => request('/users/leaderboard'),
};

// --- Cases ---
export const casesApi = {
  getData: () => request('/cases/data'),
  open: (caseId) => request('/cases/open', { method: 'POST', body: JSON.stringify({ caseId }) }),
  getInventory: () => request('/cases/inventory'),
  sell: (itemId) => request('/cases/sell', { method: 'POST', body: JSON.stringify({ itemId }) }),
};

// --- Chat ---
export const chatApi = {
  get: () => request('/chat'),
  send: (text) => request('/chat', { method: 'POST', body: JSON.stringify({ text }) }),
};

// --- Memes ---
export const memesApi = {
  suggest: (text) => request('/memes/suggest', { method: 'POST', body: JSON.stringify({ text }) }),
  suggestImage: (file) => {
    const fd = new FormData();
    fd.append('image', file);
    return requestFormData('/memes/suggest-image', fd);
  },
};

// --- Admin ---
export const adminApi = {
  getUsers: () => request('/admin/users'),
  deleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),
  setCoins: (id, coins) => request(`/admin/users/${id}/coins`, { method: 'PUT', body: JSON.stringify({ coins }) }),
  getMemeTexts: () => request('/admin/memes/texts'),
  addMemeText: (text) => request('/admin/memes/texts', { method: 'POST', body: JSON.stringify({ text }) }),
  deleteMemeText: (index) => request(`/admin/memes/texts/${index}`, { method: 'DELETE' }),
  getMemeImages: () => request('/admin/memes/images'),
  uploadMemeImage: (file) => {
    const fd = new FormData();
    fd.append('image', file);
    return requestFormData('/admin/memes/images', fd);
  },
  deleteMemeImage: (filename) => request(`/admin/memes/images/${encodeURIComponent(filename)}`, { method: 'DELETE' }),
  getSuggestions: (status = 'pending') => request(`/admin/memes/suggestions?status=${status}`),
  approveSuggestion: (id) => request(`/admin/memes/suggestions/${id}/approve`, { method: 'POST' }),
  rejectSuggestion: (id) => request(`/admin/memes/suggestions/${id}/reject`, { method: 'POST' }),
};

// --- Games ---
export const gamesApi = {
  getAll: (scope = 'my') => request(`/games?scope=${scope}`),
  getTitles: () => request('/games/titles'),
  getByTitle: (title) => request(`/games/by-title/${encodeURIComponent(title)}`),
  fetchCover: (title) => request(`/games/fetch-cover?title=${encodeURIComponent(title)}`),

  add: (game) =>
    request('/games', { method: 'POST', body: JSON.stringify(game) }),

  update: (id, game) =>
    request(`/games/${id}`, { method: 'PUT', body: JSON.stringify(game) }),

  remove: (id) =>
    request(`/games/${id}`, { method: 'DELETE' }),
};