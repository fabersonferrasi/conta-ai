"use client";

import React, { useState, useTransition } from 'react';
import { saveBudget, deleteBudget } from '../../lib/budget-actions';

interface BudgetItem {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  budgetAmount: number;
  spent: number;
  paidOnly: number;
  percentUsed: number;
}

interface CategoryOption {
  id: string;
  name: string;
  color: string;
}

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });

export function BudgetProgress({
  budgets,
  categories,
  year,
  month,
}: {
  budgets: BudgetItem[];
  categories: CategoryOption[];
  year: number;
  month: number;
}) {
  const [showForm, setShowForm] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [isPending, startTransition] = useTransition();

  const getBarColor = (pct: number) => {
    if (pct >= 100) return '#ef4444';
    if (pct >= 80) return '#f59e0b';
    return '#10b981';
  };

  const getStatusLabel = (pct: number) => {
    if (pct >= 100) return '🚨 Estourado!';
    if (pct >= 80) return '⚠️ Atenção';
    return '✅ No controle';
  };

  // Categories that don't yet have a budget
  const availableCategories = categories.filter(
    c => !budgets.some(b => b.categoryId === c.id)
  );

  const handleSave = () => {
    if (!selectedCategoryId || !amount) return;
    startTransition(async () => {
      await saveBudget(selectedCategoryId, month, year, parseFloat(amount));
      setShowForm(false);
      setSelectedCategoryId('');
      setAmount('');
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteBudget(id);
    });
  };

  return (
    <div style={{
      background: 'var(--bg-surface)',
      borderRadius: 'var(--border-radius-lg)',
      padding: '28px',
      border: '1px solid var(--border-subtle)',
      boxShadow: 'var(--shadow-md)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{
          fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)',
          fontFamily: 'var(--font-heading)',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          🎯 Orçamento por Categoria
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            background: showForm ? 'var(--accent-danger)' : 'var(--accent-primary)',
            color: '#fff',
            border: 'none',
            padding: '8px 16px',
            borderRadius: 'var(--border-radius-md)',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
        >
          {showForm ? 'Cancelar' : '+ Novo'}
        </button>
      </div>

      {/* Inline Form */}
      {showForm && (
        <div style={{
          display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap',
          padding: '16px', background: 'var(--bg-surface-hover)',
          borderRadius: 'var(--border-radius-md)',
        }}>
          <select
            value={selectedCategoryId}
            onChange={e => setSelectedCategoryId(e.target.value)}
            style={{
              flex: 1, minWidth: '160px', padding: '10px 14px',
              borderRadius: 'var(--border-radius-sm)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
            }}
          >
            <option value="">Selecione categoria</option>
            {availableCategories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Valor limite"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            step="0.01"
            min="0"
            style={{
              flex: 1, minWidth: '120px', padding: '10px 14px',
              borderRadius: 'var(--border-radius-sm)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
            }}
          />
          <button
            onClick={handleSave}
            disabled={isPending || !selectedCategoryId || !amount}
            style={{
              background: 'var(--accent-success)', color: '#fff',
              border: 'none', padding: '10px 20px',
              borderRadius: 'var(--border-radius-sm)',
              fontWeight: 600, fontSize: '0.9rem',
              cursor: 'pointer', opacity: isPending ? 0.6 : 1,
            }}
          >
            {isPending ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      )}

      {/* Budget List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {budgets.map(b => {
          const pct = Math.min(b.percentUsed, 120); // Cap for visual
          const barColor = getBarColor(b.percentUsed);

          return (
            <div key={b.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    width: '10px', height: '10px', borderRadius: '50%',
                    background: b.categoryColor, display: 'inline-block',
                  }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {b.categoryName}
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 500, color: barColor }}>
                    {getStatusLabel(b.percentUsed)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {fmtBRL(b.spent)} / {fmtBRL(b.budgetAmount)}
                  </span>
                  <button
                    onClick={() => handleDelete(b.id)}
                    disabled={isPending}
                    style={{
                      background: 'none', border: 'none', color: 'var(--text-tertiary)',
                      cursor: 'pointer', fontSize: '1rem', padding: '4px',
                      borderRadius: '4px', transition: 'color var(--transition-fast)',
                    }}
                    title="Remover orçamento"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div style={{
                width: '100%', height: '8px', background: 'var(--bg-surface-hover)',
                borderRadius: '4px', overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(pct, 100)}%`,
                  background: barColor,
                  borderRadius: '4px',
                  transition: 'width 0.6s ease-out',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  {b.percentUsed.toFixed(0)}% usado
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  Resta: {fmtBRL(Math.max(0, b.budgetAmount - b.spent))}
                </span>
              </div>
            </div>
          );
        })}

        {budgets.length === 0 && (
          <p style={{
            color: 'var(--text-tertiary)',
            fontSize: '0.9rem',
            textAlign: 'center',
            padding: '24px 0',
          }}>
            Nenhum orçamento definido. Clique em <strong>+ Novo</strong> para começar.
          </p>
        )}
      </div>
    </div>
  );
}
