"use client";

import React from 'react';
import {
  Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, ComposedChart,
} from 'recharts';

/* ─────── Formatadores ─────── */
const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });

const tooltipStyle = {
  contentStyle: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '12px',
    fontSize: '0.85rem',
    boxShadow: 'var(--shadow-md)',
  },
  labelStyle: { fontWeight: 600, color: 'var(--text-primary)' },
};

/* ─────── 1. Evolução Mensal (Barras + Linha de Saldo) ─────── */
interface MonthData {
  month: number;
  monthLabel: string;
  income: number;
  expense: number;
  balance: number;
}

export function MonthlyEvolutionChart({ data }: { data: MonthData[] }) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      borderRadius: 'var(--border-radius-lg)',
      padding: '24px',
      border: '1px solid var(--border-subtle)',
      boxShadow: 'var(--shadow-md)',
    }}>
      <h3 style={{
        fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)',
        marginBottom: '20px', fontFamily: 'var(--font-heading)',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        📊 Evolução Mensal
      </h3>
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
          <XAxis
            dataKey="monthLabel"
            tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
            axisLine={{ stroke: 'var(--border-subtle)' }}
          />
          <YAxis
            tickFormatter={(v) => fmtBRL(v)}
            tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value: number, name: string) => [fmtBRL(value), name]}
            {...tooltipStyle}
          />
          <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '12px' }} />
          <Bar dataKey="income" name="Receitas" fill="#10b981" radius={[6, 6, 0, 0]} barSize={20} />
          <Bar dataKey="expense" name="Despesas" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={20} />
          <Line
            type="monotone" dataKey="balance" name="Saldo"
            stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: '#3b82f6' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─────── 2. Top Categorias (Barras Horizontais) ─────── */
interface CategoryData {
  id: string;
  name: string;
  color: string;
  total: number;
}

export function CategoryBarChart({ data }: { data: CategoryData[] }) {
  const top = data.slice(0, 8);
  const maxVal = Math.max(...top.map(c => c.total), 1);

  return (
    <div style={{
      background: 'var(--bg-surface)',
      borderRadius: 'var(--border-radius-lg)',
      padding: '24px',
      border: '1px solid var(--border-subtle)',
      boxShadow: 'var(--shadow-md)',
    }}>
      <h3 style={{
        fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)',
        marginBottom: '20px', fontFamily: 'var(--font-heading)',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        🏷️ Top Categorias do Período
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {top.map((cat, i) => {
          const pct = (cat.total / maxVal) * 100;
          return (
            <div key={cat.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    width: '10px', height: '10px', borderRadius: '50%',
                    background: cat.color, display: 'inline-block', flexShrink: 0,
                  }} />
                  {cat.name}
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {fmtBRL(cat.total)}
                </span>
              </div>
              <div style={{
                width: '100%', height: '8px', background: 'var(--bg-surface-hover)',
                borderRadius: '4px', overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', width: `${pct}%`, background: cat.color,
                  borderRadius: '4px', transition: 'width 0.6s ease-out',
                }} />
              </div>
            </div>
          );
        })}
        {top.length === 0 && (
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' }}>
            Nenhuma despesa registrada no período.
          </p>
        )}
      </div>
    </div>
  );
}

/* ─────── 3. Comparativo de Tendência ─────── */
export function TrendComparisonChart({ data }: { data: MonthData[] }) {
  // Cumulativo de saldo ao longo do ano
  let cumulative = 0;
  const cumulativeData = data.map(d => {
    cumulative += d.balance;
    return { ...d, cumBalance: cumulative };
  });

  return (
    <div style={{
      background: 'var(--bg-surface)',
      borderRadius: 'var(--border-radius-lg)',
      padding: '24px',
      border: '1px solid var(--border-subtle)',
      boxShadow: 'var(--shadow-md)',
    }}>
      <h3 style={{
        fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)',
        marginBottom: '20px', fontFamily: 'var(--font-heading)',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        📈 Tendência Acumulada
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={cumulativeData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
          <XAxis
            dataKey="monthLabel"
            tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
            axisLine={{ stroke: 'var(--border-subtle)' }}
          />
          <YAxis
            tickFormatter={(v) => fmtBRL(v)}
            tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
            axisLine={false} tickLine={false}
          />
          <Tooltip
            formatter={(value: number, name: string) => [fmtBRL(value), name]}
            {...tooltipStyle}
          />
          <Line
            type="monotone" dataKey="cumBalance" name="Saldo Acumulado"
            stroke="url(#trendGradient)" strokeWidth={3}
            dot={{ r: 4, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
            activeDot={{ r: 6 }}
          />
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
