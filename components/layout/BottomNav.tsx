"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ArrowLeftRight, CreditCard, BarChart3, Menu, X, Wallet, Tag } from 'lucide-react';

const mainTabs = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transacoes', icon: ArrowLeftRight },
  { href: '/cards', label: 'Cartoes', icon: CreditCard },
  { href: '/reports', label: 'Relatorios', icon: BarChart3 },
];

const moreTabs = [
  { href: '/accounts', label: 'Contas', icon: Wallet },
  { href: '/categories', label: 'Categorias', icon: Tag },
];

export function BottomNav() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {showMore && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.34)',
            backdropFilter: 'blur(6px)',
            zIndex: 998,
          }}
          onClick={() => setShowMore(false)}
        />
      )}

      {showMore && (
        <div
          style={{
            position: 'fixed',
            bottom: 'calc(84px + env(safe-area-inset-bottom, 0px))',
            left: '12px',
            right: '12px',
            zIndex: 999,
            background: 'var(--bg-surface)',
            borderRadius: '24px',
            padding: '20px',
            boxShadow: '0 18px 40px rgba(15, 23, 42, 0.18)',
            border: '1px solid var(--border-subtle)',
            animation: 'slideUp 0.2s ease-out',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Mais opcoes</h3>
            <button
              onClick={() => setShowMore(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '4px' }}
            >
              <X size={20} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {moreTabs.map((tab) => {
              const Icon = tab.icon;
              const active = isActive(tab.href);

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  onClick={() => setShowMore(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '14px 16px',
                    borderRadius: '14px',
                    color: active ? 'var(--accent-primary)' : 'var(--text-primary)',
                    background: active ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                    fontWeight: 500,
                    fontSize: '0.95rem',
                    textDecoration: 'none',
                    transition: 'background 0.15s',
                  }}
                >
                  <Icon size={20} />
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <nav
        data-mobile-bottom-nav="true"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 'calc(76px + env(safe-area-inset-bottom, 0px))',
          background: 'rgba(255, 255, 255, 0.92)',
          borderTop: '1px solid rgba(148, 163, 184, 0.18)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-around',
          zIndex: 997,
          padding: '8px 10px env(safe-area-inset-bottom, 0px)',
          boxShadow: '0 -10px 28px rgba(15, 23, 42, 0.08)',
          backdropFilter: 'blur(16px)',
        }}
      >
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 8px',
                borderRadius: '14px',
                color: active ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                transform: active ? 'translateY(-1px)' : 'translateY(0)',
                minWidth: '58px',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: active ? 'rgba(37, 99, 235, 0.12)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              </div>

              <span
                style={{
                  fontSize: '0.64rem',
                  fontWeight: active ? 700 : 500,
                  letterSpacing: '0.02em',
                }}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}

        <button
          onClick={() => setShowMore((current) => !current)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 8px',
            borderRadius: '14px',
            color: showMore ? 'var(--accent-primary)' : 'var(--text-tertiary)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            minWidth: '58px',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: showMore ? 'rgba(37, 99, 235, 0.12)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Menu size={22} strokeWidth={showMore ? 2.5 : 1.8} />
          </div>
          <span
            style={{
              fontSize: '0.64rem',
              fontWeight: showMore ? 700 : 500,
              letterSpacing: '0.02em',
            }}
          >
            Mais
          </span>
        </button>
      </nav>

      <style jsx global>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (min-width: 769px) {
          [data-mobile-bottom-nav='true'] {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
