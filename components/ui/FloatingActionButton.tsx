"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Plus, ArrowDownRight, ArrowUpRight, CreditCard, RefreshCw } from 'lucide-react';
import { UnifiedTransactionModal } from '../transactions/UnifiedTransactionModal';

export type TransactionFlowType = 'EXPENSE' | 'INCOME' | 'CARD_EXPENSE' | 'TRANSFER' | null;

export function FloatingActionButton({ accounts, categories, cards }: { accounts: any[], categories: any[], cards: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [modalType, setModalType] = useState<TransactionFlowType>(null);
  
  const menuRef = useRef<HTMLDivElement>(null);

  // Fecha o menu se clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleOpenModal = (type: TransactionFlowType) => {
    setModalType(type);
    setIsOpen(false);
  };

  return (
    <>
      <div 
        ref={menuRef}
        style={{
          position: 'fixed',
          bottom: '32px',
          right: '32px',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '16px'
        }}
      >
        {isOpen && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            background: 'var(--bg-surface)',
            padding: '12px',
            borderRadius: '16px',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border-subtle)',
            minWidth: '200px',
            animation: 'fadeInUp 0.15s ease-out'
          }}>
            <button 
              onClick={() => handleOpenModal('EXPENSE')}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-primary)', textAlign: 'left', width: '100%' }}
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <ArrowDownRight size={20} color="#ef4444" />
              <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>Despesa</span>
            </button>

            <button 
              onClick={() => handleOpenModal('INCOME')}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-primary)', textAlign: 'left', width: '100%' }}
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <ArrowUpRight size={20} color="#10b981" />
              <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>Receita</span>
            </button>

            <button 
              onClick={() => handleOpenModal('CARD_EXPENSE')}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-primary)', textAlign: 'left', width: '100%' }}
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <CreditCard size={20} color="#8b5cf6" />
              <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>Despesa cartão</span>
            </button>

            <button 
              onClick={() => handleOpenModal('TRANSFER')}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-primary)', textAlign: 'left', width: '100%' }}
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <RefreshCw size={20} color="#3b82f6" />
              <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>Transferência</span>
            </button>
          </div>
        )}

        <button 
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--accent-primary)',
            color: '#fff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 10px 25px rgba(37, 99, 235, 0.4)',
            transition: 'transform 0.2s',
            transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)'
          }}
        >
          <Plus size={32} />
        </button>
      </div>

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
    </>
  );
}
