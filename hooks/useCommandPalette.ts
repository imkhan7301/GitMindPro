import { useState, useCallback, useEffect, useRef } from 'react';

interface CmdPaletteItem {
  id: string;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
}

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
        setQuery('');
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const close = useCallback(() => setIsOpen(false), []);

  const filterItems = useCallback((items: CmdPaletteItem[]) => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(i =>
      i.label.toLowerCase().includes(q) ||
      i.desc.toLowerCase().includes(q)
    );
  }, [query]);

  return {
    isOpen,
    setIsOpen,
    query,
    setQuery,
    inputRef,
    close,
    filterItems,
  };
}

export type { CmdPaletteItem };
