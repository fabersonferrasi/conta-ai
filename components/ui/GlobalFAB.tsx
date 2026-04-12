"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Plus, ArrowDownRight, ArrowUpRight, CreditCard, RefreshCw } from 'lucide-react';
import { UnifiedTransactionModal } from '../transactions/UnifiedTransactionModal';

export type TransactionFlowType = 'EXPENSE' | 'INCOME' | 'CARD_EXPENSE' | 'TRANSFER' | null;

export function GlobalFAB({ accounts, categories, cards }: { accounts: any[], categories: any[], cards: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [modalType, setModalType] = useState<TransactionFlowType>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleOpenModal = (type: TransactionFlowType) => {
    setModalType(type);
    setIsOpen(false);
  };

  const menuItems = [
    { type: 'EXPENSE' as const, label: 'Despesa', icon: <ArrowDownRight size={18} color="#ef4444" />, color: '#ef4444' },
    { type: 'INCOME' as const, label: 'Receita', icon: <ArrowUpRight size={18} color="#10b981" />, color: '#10b981' },
    { type: 'CARD_EXPENSE' as const, label: 'Despesa cartão', icon: <CreditCard size={18} color="#8b5cf6" />, color: '#8b5cf6' },
    { type: 'TRANSFER' as const, label: 'Transferência', icon: <RefreshCw size={18} color="#3b82f6" />, color: '#3b82f6' },
  ];

  return (
    <>
      <div ref={menuRef} style={{ position: 'relative' }}>
        {/* Botão + */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'var(--accent-primary)',
            color: '#fff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
            transition: 'all 0.2s',
            transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
            flexShrink: 0,
          }}
          title="Nova transação"
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>

        {/* Menu dropdown */}
        {isOpen && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: '0',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            background: 'var(--bg-surface)',
            padding: '8px',
            borderRadius: '16px',
            boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
            border: '1px solid var(--border-subtle)',
            minWidth: '210px',
            animation: 'fadeInDown 0.15s ease-out',
          }}>
            {menuItems.map(item => (
              <button
                key={item.type}
                onClick={() => handleOpenModal(item.type)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px',
                  borderRadius: '10px', border: 'none', background: 'transparent',
                  cursor: 'pointer', color: 'var(--text-primary)', textAlign: 'left', width: '100%',
                  transition: 'background 0.15s',
                }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {item.icon}
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal de transação */}
      {modalType && (
        <UnifiedTransactionModal 
          isOpen={true} 
          flowType={modalType} 
          onClose={() => setModalType(null)} 
          accounts={accounts}
          categories={categories}
          cards={cards}
        />
      )}

      {/* CSS da animação */}
      <style jsx global>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
