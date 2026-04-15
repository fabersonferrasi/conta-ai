"use client";

import { useEffect } from 'react';

const DISPLAY_MODE_QUERY = '(display-mode: standalone)';

type LegacyMediaQueryList = MediaQueryList & {
  addListener?: (listener: () => void) => void;
  removeListener?: (listener: () => void) => void;
};

const updateDisplayMode = () => {
  if (typeof window === 'undefined') return;

  const isStandalone =
    window.matchMedia(DISPLAY_MODE_QUERY).matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);

  document.documentElement.dataset.displayMode = isStandalone ? 'standalone' : 'browser';
};

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    updateDisplayMode();

    const mediaQuery = window.matchMedia(DISPLAY_MODE_QUERY) as LegacyMediaQueryList;
    const handleDisplayModeChange = () => updateDisplayMode();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
        // Falha silenciosa para nao impactar o fluxo principal.
      });
    }

    window.addEventListener('appinstalled', handleDisplayModeChange);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleDisplayModeChange);
    } else {
      mediaQuery.addListener?.(handleDisplayModeChange);
    }

    return () => {
      window.removeEventListener('appinstalled', handleDisplayModeChange);

      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', handleDisplayModeChange);
      } else {
        mediaQuery.removeListener?.(handleDisplayModeChange);
      }
    };
  }, []);

  return null;
}
