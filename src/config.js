const API_BASE = import.meta.env.VITE_API_URL || '';

function assetUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_BASE}${path}`;
}

export { API_BASE, assetUrl };
