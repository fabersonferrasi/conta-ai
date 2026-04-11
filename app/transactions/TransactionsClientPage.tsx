"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getBrandById, brandBadgeStyle } from '../../lib/bank-brands';
import { 
  ChevronLeft, ChevronRight, Search, SlidersHorizontal, 
  ArrowUpDown, CheckCircle2, Clock, ExternalLink,
  Wallet, TrendingUp, TrendingDown, Scale
} from 'lucide-react';
import styles from './page.module.css';

type FilterType = 'ALL' | 'INCOME' | 'EXPENSE' | 'CARD';
type SortField = 'date' | 'amount' | 'description';
type SortDir = 'asc' | 'desc';

interface Props {
  transactions: any[];
  accounts: any[];
  cards: any[];
  categories: any[];
  currentYear: number;
  currentMonth: number;
  summary: { currentBalance: number; incomeTotal: number; expenseTotal: number; monthlyBalance: number };
}

export function TransactionsClientPage({ transactions, accounts, cards, categories, currentYear, currentMonth, summary }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const navigateMonth = (delta: number) => {
    let m = currentMonth + delta;
    let y = currentYear;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    router.push(`/transactions?month=${m}&year=${y}`);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  // Separar normais e cartão, aplicar filtros
  const { normalRows, cardInvoiceRows } = useMemo(() => {
    const normal = transactions.filter(tx => !tx.creditCardId);
    const cardTx = transactions.filter(tx => tx.creditCardId);

    // Agrupar cartão
    const groups: Record<string, { card: any; total: number; count: number; status: string }> = {};
    for (const tx of cardTx) {
      if (!tx.creditCard) continue;
      if (!groups[tx.creditCardId]) {
        groups[tx.creditCardId] = { card: tx.creditCard, total: 0, count: 0, status: 'PAID' };
      }
      if (tx.type === 'EXPENSE') groups[tx.creditCardId].total += tx.amount;
      else groups[tx.creditCardId].total -= tx.amount;
      groups[tx.creditCardId].count++;
      if (tx.status === 'PENDING') groups[tx.creditCardId].status = 'PENDING';
    }

    const invoiceRows = Object.entries(groups).map(([cardId, g]) => {
      let dueDay = g.card.dueDay;
      let dueDate = new Date(currentYear, currentMonth - 1, dueDay, 12, 0, 0);
      if (g.card.dueDay <= g.card.closingDay) {
        dueDate = new Date(currentYear, currentMonth, dueDay, 12, 0, 0);
      }
      return { cardId, ...g, dueDate };
    });

    return { normalRows: normal, cardInvoiceRows: invoiceRows };
  }, [transactions, currentYear, currentMonth]);

  // Unificar e filtrar
  const unifiedRows = useMemo(() => {
    type Row = { kind: 'normal'; tx: any; sortDate: Date; sortAmount: number; sortDesc: string } |
               { kind: 'card'; data: any; sortDate: Date; sortAmount: number; sortDesc: string };

    let rows: Row[] = [];

    if (filter !== 'CARD') {
      for (const tx of normalRows) {
        if (filter === 'INCOME' && tx.type !== 'INCOME') continue;
        if (filter === 'EXPENSE' && tx.type !== 'EXPENSE') continue;
        if (searchTerm && !tx.description?.toLowerCase().includes(searchTerm.toLowerCase())) continue;
        rows.push({ kind: 'normal', tx, sortDate: new Date(tx.date), sortAmount: tx.amount, sortDesc: tx.description || '' });
      }
    }

    if (filter === 'ALL' || filter === 'CARD' || filter === 'EXPENSE') {
      for (const inv of cardInvoiceRows) {
        if (searchTerm && !inv.card.name.toLowerCase().includes(searchTerm.toLowerCase())) continue;
        rows.push({ kind: 'card', data: inv, sortDate: inv.dueDate, sortAmount: inv.total, sortDesc: inv.card.name });
      }
    }

    // Ordenar
    rows.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') cmp = a.sortDate.getTime() - b.sortDate.getTime();
      else if (sortField === 'amount') cmp = a.sortAmount - b.sortAmount;
      else cmp = a.sortDesc.localeCompare(b.sortDesc);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return rows;
  }, [normalRows, cardInvoiceRows, filter, searchTerm, sortField, sortDir]);

  // Saldo do final do dia
  const dailyBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    let running = summary.currentBalance - summary.incomeTotal + summary.expenseTotal; // saldo início do mês
    // Precisa percorrer por dia
    const sortedNormal = [...normalRows].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    for (const tx of sortedNormal) {
      const day = new Date(tx.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
      if (tx.type === 'INCOME') running += tx.amount;
      else if (tx.type === 'EXPENSE') running -= tx.amount;
      balances[day] = running;
    }
    // Incluir cartões (impacto no dia do vencimento)
    for (const inv of cardInvoiceRows) {
      const day = inv.dueDate.toLocaleDateString('pt-BR');
      running -= inv.total;
      balances[day] = running;
    }
    return balances;
  }, [normalRows, cardInvoiceRows, summary]);

  // Agrupar por dia para inserir separadores
  const rowsWithDaySeparators = useMemo(() => {
    const result: (typeof unifiedRows[0] | { kind: 'separator'; day: string; balance: number })[] = [];
    let lastDay = '';
    for (const row of unifiedRows) {
      const day = row.sortDate.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
      if (day !== lastDay && lastDay !== '') {
        // Inserir separador do dia anterior
        result.push({ kind: 'separator', day: lastDay, balance: dailyBalances[lastDay] || 0 });
      }
      result.push(row);
      lastDay = day;
    }
    // Último dia
    if (lastDay) {
      result.push({ kind: 'separator', day: lastDay, balance: dailyBalances[lastDay] || 0 });
    }
    return result;
  }, [unifiedRows, dailyBalances]);

  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  const summaryCards = [
    { label: 'Saldo atual', value: summary.currentBalance, color: '#3b82f6', icon: <Wallet size={22} /> },
    { label: 'Receitas', value: summary.incomeTotal, color: '#10b981', icon: <TrendingUp size={22} /> },
    { label: 'Despesas', value: summary.expenseTotal, color: '#ef4444', icon: <TrendingDown size={22} /> },
    { label: 'Balanço mensal', value: summary.monthlyBalance, color: '#8b5cf6', icon: <Scale size={22} /> },
  ];

  const filters: { key: FilterType; label: string }[] = [
    { key: 'ALL', label: 'Todas' },
    { key: 'INCOME', label: 'Receitas' },
    { key: 'EXPENSE', label: 'Despesas' },
    { key: 'CARD', label: 'Cartões' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* BARRA DE FILTROS + BUSCA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-surface-hover)', padding: '4px', borderRadius: '24px' }}>
          {filters.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              border: 'none', padding: '8px 18px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500,
              background: filter === f.key ? 'var(--accent-primary)' : 'transparent',
              color: filter === f.key ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.2s',
            }}>{f.label}</button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {showSearch && (
            <input type="text" placeholder="Buscar transação..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)} autoFocus
              style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.9rem', width: '220px', outline: 'none' }} />
          )}
          <button onClick={() => { setShowSearch(!showSearch); if (showSearch) setSearchTerm(''); }}
            style={{ width: '38px', height: '38px', borderRadius: '50%', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            <Search size={16} />
          </button>
          <button onClick={() => toggleSort(sortField === 'date' ? 'amount' : sortField === 'amount' ? 'description' : 'date')}
            style={{ width: '38px', height: '38px', borderRadius: '50%', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}
            title={`Ordenar por: ${sortField === 'date' ? 'Data' : sortField === 'amount' ? 'Valor' : 'Descrição'} (${sortDir})`}>
            <SlidersHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* CARDS RESUMO */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {summaryCards.map(card => (
          <div key={card.label} style={{
            background: 'var(--bg-surface)', borderRadius: '16px', padding: '20px', border: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', transition: 'box-shadow 0.2s',
          }}
          onMouseOver={e => e.currentTarget.style.boxShadow = 'var(--shadow-lg)'}
          onMouseOut={e => e.currentTarget.style.boxShadow = 'none'}
          >
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${card.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color, flexShrink: 0 }}>
              {card.icon}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>{card.label}</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>R$ {fmt(card.value)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* NAVEGAÇÃO DE MÊS */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <button onClick={() => navigateMonth(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><ChevronLeft size={22} /></button>
        <span style={{ padding: '8px 20px', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontWeight: 600, fontSize: '0.95rem' }}>
          {monthNames[currentMonth - 1]} {currentYear}
        </span>
        <button onClick={() => navigateMonth(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><ChevronRight size={22} /></button>
      </div>

      {/* TABELA */}
      <div style={{ background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <th style={{ ...thStyle, width: '40px' }}></th>
              <th style={thStyle}>Situação</th>
              <th style={{ ...thStyle, cursor: 'pointer' }} onClick={() => toggleSort('date')}>
                Data {sortField === 'date' && <ArrowUpDown size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />}
              </th>
              <th style={{ ...thStyle, cursor: 'pointer' }} onClick={() => toggleSort('description')}>
                Descrição {sortField === 'description' && <ArrowUpDown size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />}
              </th>
              <th style={thStyle}>Categoria</th>
              <th style={thStyle}>Conta</th>
              <th style={{ ...thStyle, textAlign: 'right', cursor: 'pointer' }} onClick={() => toggleSort('amount')}>
                Valor {sortField === 'amount' && <ArrowUpDown size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />}
              </th>
              <th style={{ ...thStyle, width: '60px' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {rowsWithDaySeparators.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-tertiary)' }}>🧾 Nenhum lançamento encontrado.</td></tr>
            ) : (
              rowsWithDaySeparators.map((row, idx) => {
                if (row.kind === 'separator') {
                  return (
                    <tr key={`sep-${row.day}-${idx}`} style={{ background: 'var(--bg-surface-hover)' }}>
                      <td colSpan={6} style={{ padding: '8px 16px', fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                        Saldo Previsto Final do Dia
                      </td>
                      <td style={{ padding: '8px 16px', textAlign: 'right', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        R$ {fmt(row.balance)}
                      </td>
                      <td></td>
                    </tr>
                  );
                }

                if (row.kind === 'card') {
                  const inv = row.data;
                  const brand = getBrandById(inv.card.icon);
                  return (
                    <tr key={`card-${inv.cardId}`} style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'background 0.15s' }}
                      onClick={() => router.push(`/cards/${inv.cardId}?month=${currentMonth}&year=${currentYear}`)}
                      onMouseOver={e => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={tdStyle}></td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {inv.status === 'PAID' ? <CheckCircle2 size={20} color="#10b981" /> : <Clock size={20} color="#f59e0b" />}
                          <span style={{ ...brandBadgeStyle(brand, 20), fontSize: '0.35rem' }}>{brand.abbr}</span>
                        </div>
                      </td>
                      <td style={tdStyle}>{inv.dueDate.toLocaleDateString('pt-BR')}</td>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 600 }}>{inv.card.name}</span>
                        <span style={{ marginLeft: '8px', fontSize: '0.7rem', background: `${brand.color}15`, color: brand.color, padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                          {inv.count} lanç.
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: brand.color, fontWeight: 500, fontSize: '0.85rem' }}>
                          <span style={{ ...brandBadgeStyle(brand, 22), fontSize: '0.4rem' }}>{brand.abbr}</span>
                          Agrupada cartão
                        </span>
                      </td>
                      <td style={tdStyle}>{inv.card.name}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#ef4444' }}>R$ {fmt(inv.total)}</td>
                      <td style={tdStyle}>
                        <button onClick={e => { e.stopPropagation(); router.push(`/cards/${inv.cardId}?month=${currentMonth}&year=${currentYear}`); }}
                          style={{ background: `${brand.color}15`, border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: brand.color, padding: '4px 10px', borderRadius: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ExternalLink size={12} /> Fatura
                        </button>
                      </td>
                    </tr>
                  );
                }

                // Normal row
                const tx = row.tx;
                const cat = tx.category || categories.find((c: any) => c.id === tx.categoryId);
                return (
                  <tr key={tx.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s' }}
                    onMouseOver={e => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={tdStyle}></td>
                    <td style={tdStyle}>
                      {tx.status === 'COMPLETED' ? <CheckCircle2 size={20} color="#10b981" /> : <Clock size={20} color="#ef4444" />}
                    </td>
                    <td style={{ ...tdStyle, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {new Date(tx.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{tx.description}</span>
                      {tx.totalInstallments && tx.totalInstallments > 1 && (
                        <span style={{ marginLeft: '6px', fontSize: '0.7rem', color: '#8b5cf6', fontWeight: 600, background: '#8b5cf615', padding: '2px 6px', borderRadius: '10px' }}>
                          {tx.installmentNum}/{tx.totalInstallments}
                        </span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      {cat ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                          <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: cat.color || '#6b7280', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: '#fff' }}>
                            {cat.icon || '📋'}
                          </span>
                          <span style={{ color: 'var(--text-secondary)' }}>{cat.name}</span>
                        </span>
                      ) : '-'}
                    </td>
                    <td style={{ ...tdStyle, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {tx.account ? (
                        <span>🏦 {tx.account.name}</span>
                      ) : '-'}
                    </td>
                    <td style={{ 
                      ...tdStyle, textAlign: 'right', fontWeight: 600, 
                      color: tx.type === 'INCOME' ? '#10b981' : '#ef4444' 
                    }}>
                      {tx.type === 'INCOME' ? '+' : '-'} R$ {fmt(tx.amount)}
                    </td>
                    <td style={tdStyle}>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: '1.2rem', padding: '4px' }}>⋮</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '14px 16px',
  textAlign: 'left',
  fontSize: '0.8rem',
  color: 'var(--text-tertiary)',
  fontWeight: 500,
  userSelect: 'none',
};

const tdStyle: React.CSSProperties = {
  padding: '14px 16px',
};
