"use client";

import React from 'react';
import { Activity, TrendingUp, TrendingDown } from 'lucide-react';

interface MonthlyNetBalanceCardProps {
  incomes: number;
  expenses: number;
}

export function MonthlyNetBalanceCard({ incomes, expenses }: MonthlyNetBalanceCardProps) {
  const netBalance = incomes - expenses;
  const isPositive = netBalance >= 0;
  
  // Calculate percentage to fill a progress bar
  const totalMovement = incomes + expenses;
  const incomePercent = totalMovement === 0 ? 50 : Math.round((incomes / totalMovement) * 100);
  const expensePercent = totalMovement === 0 ? 50 : Math.round((expenses / totalMovement) * 100);

  return (
    <div style={{
      background: 'var(--bg-surface)',
      borderRadius: 'var(--border-radius-lg)',
      padding: '24px',
      border: '1px solid var(--border-subtle)',
      boxShadow: 'var(--shadow-md)',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Activity size={20} color="var(--accent-primary)" />
            Balanço Mensal
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Fluxos recebidos e projetados
          </p>
        </div>
        
        <div style={{
          padding: '6px 12px',
          borderRadius: '20px',
          background: isPositive ? '#10b98115' : '#ef444415',
          color: isPositive ? 'var(--accent-success)' : 'var(--accent-danger)',
          fontWeight: 600,
          fontSize: '0.85rem'
        }}>
          {isPositive ? 'Fluxo Positivo' : 'Fluxo Negativo'}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
        <span style={{ fontSize: '3rem', fontWeight: 800, color: isPositive ? 'var(--accent-success)' : 'var(--accent-danger)', lineHeight: 1, letterSpacing: '-0.03em' }}>
          {isPositive ? '+' : '-'} R$ {Math.abs(netBalance).toFixed(2)}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', fontWeight: 500 }}>
            <TrendingUp size={16} color="var(--accent-success)" /> Receitas (R$ {incomes.toFixed(2)})
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', fontWeight: 500 }}>
            Despesas (R$ {expenses.toFixed(2)}) <TrendingDown size={16} color="var(--accent-danger)" />
          </span>
        </div>
        
        {/* Progress Bar Dual */}
        <div style={{ 
          width: '100%', 
          height: '12px', 
          background: 'var(--bg-surface-hover)', 
          borderRadius: '6px', 
          display: 'flex', 
          overflow: 'hidden' 
        }}>
          <div style={{ width: `${incomePercent}%`, background: 'var(--accent-success)', transition: 'width 0.5s ease-in-out' }} />
          <div style={{ width: `${expensePercent}%`, background: 'var(--accent-danger)', transition: 'width 0.5s ease-in-out' }} />
        </div>
      </div>
    </div>
  );
}
