"use client";

import React, { useState } from 'react';
import styles from '../../app/dashboard/page.module.css';
import { ChevronDown, ChevronUp, Wallet, TrendingUp, TrendingDown, CreditCard, Activity } from 'lucide-react';
import { getBrandById, brandBadgeStyle } from '../../lib/bank-brands';

type DashboardTopCardsProps = {
  currentBalance: number;
  incomes: { total: number; paid: number; pending: number };
  expenses: { total: number; paid: number; pending: number };
  creditCards: { total: number; cards: { id: string; name: string; balance: number; icon?: string | null }[] };
  accounts: any[];
  selectedAccountId?: string;
};

export default function DashboardTopCards({ currentBalance, incomes, expenses, creditCards, accounts, selectedAccountId }: DashboardTopCardsProps) {
  const [showExpenseDetails, setShowExpenseDetails] = useState(false);
  const [showCCDetails, setShowCCDetails] = useState(false);
  const [showAccDetails, setShowAccDetails] = useState(false);

  // Balanço Líquido do Mês
  const netBalance = incomes.total - expenses.total;
  const isPositive = netBalance >= 0;

  return (
    <div className={styles.summaryPanel} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
      
      {/* Saldo Atual */}
      <div className={styles.summaryCard} style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-primary-hover))', color: '#fff', border: 'none', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div className={styles.summaryHeader} style={{ color: 'rgba(255,255,255,0.9)', borderBottom: 'none', padding: 0, margin: 0 }}>
            <span style={{ fontSize: '1rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wallet size={20} /> Saldo {selectedAccountId ? 'da Conta' : 'Corrente Global'}
            </span>
          </div>
        </div>
        
        <div className={styles.summaryAmount} style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 700, margin: '16px 0' }}>
          R$ {currentBalance.toFixed(2)}
        </div>

        {!selectedAccountId && accounts.length > 0 && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '16px', marginTop: '8px' }}>
            <button 
              onClick={() => setShowAccDetails(!showAccDetails)}
              style={{ background: 'none', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.85rem', opacity: 0.9 }}
            >
              Ver contas {showAccDetails ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
            </button>
            
            {showAccDetails && (
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
                {accounts.map(acc => (
                  <div key={acc.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{acc.name}:</span>
                    <span style={{ fontWeight: 600 }}>R$ {acc.balance.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {/* Receitas Detalhadas */}
      <div className={styles.summaryCard} style={{ border: '1px solid var(--border-subtle)' }}>
        <div className={styles.summaryHeader}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><TrendingUp size={18} color="#10b981" /> Receitas</span>
        </div>
        <div className={styles.summaryAmount} style={{ color: '#10b981' }}>R$ {incomes.total.toFixed(2)}</div>
        
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', padding: '16px', background: 'var(--bg-surface-hover)', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Recebidas:</span>
            <span style={{ color: '#10b981', fontWeight: 600 }}>R$ {incomes.paid.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>A Receber:</span>
            <span style={{ color: 'var(--accent-warning)', fontWeight: 600 }}>R$ {incomes.pending.toFixed(2)}</span>
          </div>
        </div>
      </div>


      {/* Despesas Detalhadas */}
      <div className={styles.summaryCard} style={{ border: '1px solid var(--border-subtle)' }}>
        <div className={styles.summaryHeader}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><TrendingDown size={18} color="var(--accent-danger)" /> Despesas</span>
        </div>
        <div className={styles.summaryAmount}>R$ {expenses.total.toFixed(2)}</div>
        
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', padding: '16px', background: 'var(--bg-surface-hover)', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Pagas:</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>R$ {expenses.paid.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Em Aberto (Projeto):</span>
            <span style={{ color: 'var(--accent-warning)', fontWeight: 600 }}>R$ {expenses.pending.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Cartões de Crédito (Sempre renderizado se não tiver filtro) */}
      {!selectedAccountId && (
        <div className={styles.summaryCard} style={{ border: '1px solid var(--border-subtle)' }}>
          <div className={styles.summaryHeader}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CreditCard size={18} color="#8b5cf6" /> Cartões de Crédito</span>
          </div>
          <div className={styles.summaryAmount}>R$ {creditCards.total.toFixed(2)}</div>

          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', padding: '16px', background: 'var(--bg-surface-hover)', borderRadius: '12px' }}>
            {creditCards.cards.length === 0 ? (
              <span style={{ color: 'var(--text-tertiary)', textAlign: 'center' }}>Nenhum cartão registrado</span>
            ) : (
              creditCards.cards.map(cc => {
                const brand = getBrandById(cc.icon);
                return (
                  <div key={cc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ ...brandBadgeStyle(brand, 24), fontSize: '0.45rem' }}>{brand.abbr}</span>
                      {cc.name}
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>R$ {cc.balance.toFixed(2)}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
