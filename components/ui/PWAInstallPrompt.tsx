"use client";

import { useEffect, useMemo, useState } from 'react';
import { Download, Share, Smartphone, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

type LegacyMediaQueryList = MediaQueryList & {
  addListener?: (listener: () => void) => void;
  removeListener?: (listener: () => void) => void;
};

const DISMISS_KEY = 'conta-ai-install-dismissed-at';
const DISMISS_WINDOW_MS = 1000 * 60 * 60 * 24 * 3;

const detectStandalone = () => {
  if (typeof window === 'undefined') return false;

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  );
};

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIosSafari, setIsIosSafari] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(display-mode: standalone)') as LegacyMediaQueryList;
    const updateStandaloneState = () => {
      setIsStandalone(detectStandalone());
    };

    const dismissedAt = Number(window.localStorage.getItem(DISMISS_KEY) || '0');
    const canPromptAgain = !dismissedAt || Date.now() - dismissedAt > DISMISS_WINDOW_MS;
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isiOS = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/crios|fxios|edgios|opr\//.test(userAgent);
    const isTouchPreferred = window.matchMedia('(max-width: 900px)').matches || window.navigator.maxTouchPoints > 0;

    setIsIosSafari(isiOS && isSafari && isTouchPreferred);
    updateStandaloneState();

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);

      if (canPromptAgain && !detectStandalone() && isTouchPreferred) {
        setIsVisible(true);
      }
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsVisible(false);
      setIsStandalone(true);
      window.localStorage.removeItem(DISMISS_KEY);
    };

    if (canPromptAgain && !detectStandalone() && isiOS && isSafari && isTouchPreferred) {
      setIsVisible(true);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateStandaloneState);
    } else {
      mediaQuery.addListener?.(updateStandaloneState);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);

      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', updateStandaloneState);
      } else {
        mediaQuery.removeListener?.(updateStandaloneState);
      }
    };
  }, []);

  const mode = useMemo(() => {
    if (isStandalone || !isVisible) return null;
    if (deferredPrompt) return 'prompt';
    if (isIosSafari) return 'ios';
    return null;
  }, [deferredPrompt, isIosSafari, isStandalone, isVisible]);

  const dismissPrompt = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    }

    setIsVisible(false);
  };

  const installApp = async () => {
    if (!deferredPrompt) return;

    setIsLoading(true);

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;

      if (choice.outcome === 'accepted') {
        setIsVisible(false);
      }

      setDeferredPrompt(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (!mode) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: '16px',
        right: '16px',
        bottom: 'calc(88px + env(safe-area-inset-bottom, 0px))',
        zIndex: 1200,
        borderRadius: '22px',
        background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.96), rgba(37, 99, 235, 0.92))',
        color: '#fff',
        padding: '18px 18px 16px',
        boxShadow: '0 20px 40px rgba(15, 23, 42, 0.28)',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        backdropFilter: 'blur(18px)',
      }}
    >
      <button
        type="button"
        onClick={dismissPrompt}
        aria-label="Fechar aviso de instalacao"
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          width: '32px',
          height: '32px',
          borderRadius: '999px',
          border: 'none',
          background: 'rgba(255, 255, 255, 0.12)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <X size={16} />
      </button>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', paddingRight: '24px' }}>
        <div
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '16px',
            background: 'rgba(255, 255, 255, 0.14)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {mode === 'prompt' ? <Download size={22} /> : <Share size={22} />}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.75 }}>
            Experiencia nativa
          </div>
          <h3 style={{ margin: '4px 0 8px', fontSize: '1rem', fontWeight: 700 }}>
            Instale o Conta Ai no seu celular
          </h3>
          <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.55, opacity: 0.9 }}>
            {mode === 'prompt'
              ? 'Abra como aplicativo, com icone na tela inicial, abertura em modo standalone e acesso mais rapido no dia a dia.'
              : 'No iPhone ou iPad, toque em Compartilhar e depois em Adicionar a Tela de Inicio para usar o app como nativo.'}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '16px' }}>
        {mode === 'prompt' ? (
          <button
            type="button"
            onClick={installApp}
            disabled={isLoading}
            style={{
              flex: 1,
              minHeight: '46px',
              borderRadius: '14px',
              border: 'none',
              background: '#fff',
              color: '#0f172a',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {isLoading ? 'Preparando...' : 'Instalar aplicativo'}
          </button>
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              minHeight: '46px',
              borderRadius: '14px',
              padding: '0 14px',
              background: 'rgba(255, 255, 255, 0.12)',
              fontSize: '0.86rem',
            }}
          >
            <Smartphone size={18} />
            Compartilhar {'->'} Adicionar a Tela de Inicio
          </div>
        )}

        <button
          type="button"
          onClick={dismissPrompt}
          style={{
            minWidth: '92px',
            minHeight: '46px',
            borderRadius: '14px',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            background: 'transparent',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Depois
        </button>
      </div>
    </div>
  );
}
