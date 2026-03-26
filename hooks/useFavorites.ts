import { useState, useCallback, useEffect } from 'react';

const FAVORITES_KEY = 'gitmind.favorites';

function loadFavorites(): string[] {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(loadFavorites);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === FAVORITES_KEY) {
        setFavorites(loadFavorites());
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const toggleFavorite = useCallback((repoUrl: string) => {
    setFavorites(prev => {
      const next = prev.includes(repoUrl)
        ? prev.filter(f => f !== repoUrl)
        : [...prev, repoUrl];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isFavorite = useCallback((repoUrl: string) => favorites.includes(repoUrl), [favorites]);

  return { favorites, toggleFavorite, isFavorite };
}
