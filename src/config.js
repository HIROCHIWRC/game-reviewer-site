const DEPLOYED_URL = 'https://game-reviewer-back-production.up.railway.app';

function getBase() {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
    return DEPLOYED_URL;
  }
  return '';
}

const API_BASE = getBase();

function assetUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_BASE}${path}`;
}

export { API_BASE, assetUrl };
