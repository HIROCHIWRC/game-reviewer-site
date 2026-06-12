import { useState, useEffect } from 'react';
import { authApi, registerOnUnauthorized } from '../api';

export function useAuth() {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const coins = Math.round((Number(localStorage.getItem('coins')) || 0) * 100) / 100;
    const isAdmin = localStorage.getItem('isAdmin') === '1';
    return token && username ? { token, username, coins, isAdmin } : null;
  });

  const roundCoins = (v) => Math.round((v || 0) * 100) / 100;

  const setCoins = (coins) => {
    const r = roundCoins(coins);
    localStorage.setItem('coins', String(r));
    setUser((prev) => prev ? { ...prev, coins: r } : prev);
  };

  const afterAuth = (data) => {
    const r = roundCoins(data.coins);
    const isAdmin = !!data.isAdmin;
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.username);
    localStorage.setItem('coins', String(r));
    localStorage.setItem('isAdmin', isAdmin ? '1' : '0');
    setUser({ token: data.token, username: data.username, coins: r, isAdmin });
  };

  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const login = async (username, password) => {
    setAuthError('');
    setAuthLoading(true);
    try {
      const data = await authApi.login(username, password);
      afterAuth(data);
      return true;
    } catch (err) {
      setAuthError(err.message);
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  const register = async (username, password) => {
    setAuthError('');
    setAuthLoading(true);
    try {
      const data = await authApi.register(username, password);
      afterAuth(data);
      return true;
    } catch (err) {
      setAuthError(err.message);
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('coins');
    localStorage.removeItem('isAdmin');
    setUser(null);
  };

  useEffect(() => {
    registerOnUnauthorized(logout);
  }, []);

  return { user, authError, authLoading, login, register, logout, setCoins };
}