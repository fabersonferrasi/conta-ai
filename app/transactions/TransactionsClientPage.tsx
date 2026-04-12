"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { getBrandById, brandBadgeStyle } from '../../lib/bank-brands';
import {
  ChevronLeft, ChevronRight, Search, SlidersHorizontal,
  ArrowUpDown, CheckCircle2, Clock, ExternalLink,
  Wallet, TrendingUp, TrendingDown, Scale,
  MoreVertical, Pencil, Trash2, X, AlertTriangle
} from 'lucide-react';
import { deleteTransaction, updateTransaction } from '../../lib/transaction-actions';

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

/* ────────────────────────── ACTION MENU ────────────────────────── */
function ActionMenu({
  tx,
  onEdit,
  onDelete,
}: {
  tx: any;
  onEdit: (tx: any) => void;
  onDelete: (tx: any) => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
    transformOrigin: 'top right' | 'bottom right';
  } | null>(null);

  useEffect(() => {
    if (!open) {
      setMenuPosition(null);
      return;
    }

    const updatePosition = () => {
      const button = buttonRef.current;
      const menu = menuRef.current;
      if (!button || !menu) return;

      const buttonRect = button.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();
      const margin = 12;
      const gap = 6;
      const openUpwards =
        buttonRect.bottom + gap + menuRect.height > window.innerHeight - margin &&
        buttonRect.top - gap - menuRect.height >= margin;

      const desiredTop = openUpwards
        ? buttonRect.top - menuRect.height - gap
        : buttonRect.bottom + gap;
      const desiredLeft = buttonRect.right - menuRect.width;

      setMenuPosition({
        top: Math.max(margin, Math.min(desiredTop, window.innerHeight - menuRect.height - margin)),
        left: Math.max(margin, Math.min(desiredLeft, window.innerWidth - menuRect.width - margin)),
        transformOrigin: openUpwards ? 'bottom right' : 'top right',
      });
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };

    const frameId = window.requestAnimationFrame(updatePosition);

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.cancelAnimationFrame(frameId);
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  const menu = open ? createPortal(
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: menuPosition?.top ?? 0,
        left: menuPosition?.left ?? 0,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        zIndex: 1000,
        minWidth: '160px',
        overflow: 'hidden',
        animation: 'fadeSlideIn 0.15s ease',
        transformOrigin: menuPosition?.transformOrigin ?? 'top right',
        opacity: menuPosition ? 1 : 0,
        pointerEvents: menuPosition ? 'auto' : 'none',
      }}
    >
      <button
        type="button"
        onClick={e => { e.stopPropagation(); setOpen(false); onEdit(tx); }}
        style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          width: '100%', padding: '12px 16px', border: 'none',
          background: 'none', cursor: 'pointer',
          color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: 500,
          transition: 'background 0.1s',
        }}
        onMouseOver={e => (e.currentTarget.style.background = 'var(--bg-surface-hover)')}
        onMouseOut={e => (e.currentTarget.style.background = 'none')}
      >
        <Pencil size={15} color="var(--accent-primary)" />
        Editar transação
      </button>
      <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '0 12px' }} />
      <button
        type="button"
        onClick={e => { e.stopPropagation(); setOpen(false); onDelete(tx); }}
        style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          width: '100%', padding: '12px 16px', border: 'none',
          background: 'none', cursor: 'pointer',
          color: '#ef4444', fontSize: '0.875rem', fontWeight: 500,
          transition: 'background 0.1s',
        }}
        onMouseOver={e => (e.currentTarget.style.background = '#ef444410')}
        onMouseOut={e => (e.currentTarget.style.background = 'none')}
      >
        <Trash2 size={15} color="#ef4444" />
        Excluir transação
      </button>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <div ref={triggerRef} style={{ position: 'relative', display: 'inline-block' }}>
        <button
          ref={buttonRef}
          type="button"
          onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
          title="Ações"
          style={{
            background: open ? 'var(--bg-surface-hover)' : 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-tertiary)',
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseOver={e => (e.currentTarget.style.background = 'var(--bg-surface-hover)')}
          onMouseOut={e => { if (!open) e.currentTarget.style.background = 'none'; }}
        >
          <MoreVertical size={16} />
        </button>
        {menu}
      </div>
    </>
  );
}

/* ────────────────────────── EDIT MODAL ────────────────────────── */
function EditTransactionModal({
  tx,
  accounts,
  categories,
  onClose,
  onSaved,
}: {
  tx: any;
  accounts: any[];
  categories: any[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [description, setDescription] = useState(tx.description || '');
  const [amount, setAmount] = useState(String(tx.amount));
  const [categoryId, setCategoryId] = useState(tx.categoryId || '');
  const [accountId, setAccountId] = useState(tx.accountId || '');
  const [status, setStatus] = useState(tx.status || 'PENDING');
  const [date, setDate] = useState(
    tx.date ? new Date(tx.date).toISOString().split('T')[0] : ''
  );
  const [isLoading, setIsLoading] = useState(false);
  const [scope, setScope] = useState<'SINGLE' | 'FUTURE'>('SINGLE');

  const isInstallment = tx.installmentGroupId && tx.totalInstallments > 1;
  const color = tx.type === 'INCOME' ? '#10b981' : '#ef4444';

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateTransaction(tx.id, {
        description,
        amount: parseFloat(amount),
        categoryId: categoryId || null,
        accountId: accountId || null,
        status,
        date: date ? new Date(date) : undefined,
      }, scope);
      onSaved();
      onClose();
    } catch (err) {
      alert('Erro ao salvar: ' + err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)',
    }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-surface)',
          borderRadius: '20px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
          width: '100%',
          maxWidth: '500px',
          margin: '16px',
          overflow: 'hidden',
          animation: 'modalSlideIn 0.2s ease',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: `3px solid ${color}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: `${color}08`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: `${color}20`, display: 'flex', alignItems: 'center',
              justifyContent: 'center', color,
            }}>
              <Pencil size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                Editar Transação
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                {tx.type === 'INCOME' ? '💚 Receita' : '❤️ Despesa'}
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-tertiary)', borderRadius: '8px', padding: '4px',
          }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Valor */}
          <div>
            <label style={labelStyle}>Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              style={{ ...inputStyle, fontSize: '1.4rem', fontWeight: 700, color }}
            />
          </div>

          {/* Descrição */}
          <div>
            <label style={labelStyle}>Descrição</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {/* Data */}
            <div>
              <label style={labelStyle}>Data</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* Status */}
            <div>
              <label style={labelStyle}>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} style={inputStyle}>
                <option value="COMPLETED">{tx.type === 'INCOME' ? 'Recebida' : 'Pago'}</option>
                <option value="PENDING">{tx.type === 'INCOME' ? 'Não recebida' : 'Pendente'}</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {/* Categoria */}
            <div>
              <label style={labelStyle}>Categoria</label>
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)} style={inputStyle}>
                <option value="">Sem categoria</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>

            {/* Conta */}
            <div>
              <label style={labelStyle}>Conta</label>
              <select value={accountId} onChange={e => setAccountId(e.target.value)} style={inputStyle}>
                <option value="">Sem conta</option>
                {accounts.map((a: any) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Escopo para parcelados */}
          {isInstallment && (
            <div style={{
              padding: '14px 16px', borderRadius: '10px',
              background: '#f59e0b10', border: '1px solid #f59e0b30',
              display: 'flex', flexDirection: 'column', gap: '10px',
            }}>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#f59e0b', fontWeight: 600 }}>
                ⚠️ Esta transação faz parte de {tx.totalInstallments} parcelas. O que deseja atualizar?
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                {(['SINGLE', 'FUTURE'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setScope(s)}
                    style={{
                      flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid',
                      borderColor: scope === s ? '#f59e0b' : 'var(--border-subtle)',
                      background: scope === s ? '#f59e0b15' : 'transparent',
                      color: scope === s ? '#f59e0b' : 'var(--text-secondary)',
                      cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem',
                    }}
                  >
                    {s === 'SINGLE' ? '📌 Só esta' : '📅 Esta e futuras'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Botões */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
            <button onClick={onClose} style={{
              flex: 1, padding: '12px', borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              background: 'none', cursor: 'pointer',
              color: 'var(--text-secondary)', fontWeight: 600,
            }}>
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              style={{
                flex: 2, padding: '12px', borderRadius: '10px', border: 'none',
                background: color, color: '#fff', cursor: 'pointer',
                fontWeight: 700, fontSize: '0.95rem',
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────── DELETE DIALOG ────────────────────────── */
function DeleteTransactionDialog({
  tx,
  onClose,
  onDeleted,
}: {
  tx: any;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [scope, setScope] = useState<'SINGLE' | 'FUTURE'>('SINGLE');
  const isInstallment = tx.installmentGroupId && tx.totalInstallments > 1;

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await deleteTransaction(tx.id, scope);
      onDeleted();
      onClose();
    } catch (err) {
      alert('Erro ao excluir: ' + err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)',
    }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-surface)',
          borderRadius: '20px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
          width: '100%',
          maxWidth: '420px',
          margin: '16px',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          textAlign: 'center',
          animation: 'modalSlideIn 0.2s ease',
        }}
      >
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%',
          background: 'rgba(239,68,68,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <AlertTriangle size={36} color="#ef4444" />
        </div>

        <div>
          <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Excluir Transação
          </h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.9rem' }}>
            Você está prestes a excluir <strong>"{tx.description}"</strong>.
            Esta ação não pode ser desfeita.
          </p>
        </div>

        {isInstallment && (
          <div style={{
            width: '100%', padding: '14px 16px', borderRadius: '10px',
            background: '#f59e0b10', border: '1px solid #f59e0b30',
          }}>
            <p style={{ margin: '0 0 10px', fontSize: '0.82rem', color: '#f59e0b', fontWeight: 600 }}>
              Parcela {tx.installmentNum} de {tx.totalInstallments}. O que deseja excluir?
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              {(['SINGLE', 'FUTURE'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setScope(s)}
                  style={{
                    flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid',
                    borderColor: scope === s ? '#ef4444' : 'var(--border-subtle)',
                    background: scope === s ? '#ef444415' : 'transparent',
                    color: scope === s ? '#ef4444' : 'var(--text-secondary)',
                    cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem',
                  }}
                >
                  {s === 'SINGLE' ? '📌 Só esta' : '📅 Esta e futuras'}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '12px', borderRadius: '10px',
            border: '1px solid var(--border-subtle)',
            background: 'none', cursor: 'pointer',
            color: 'var(--text-secondary)', fontWeight: 600,
          }}>
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={isLoading}
            style={{
              flex: 1, padding: '12px', borderRadius: '10px', border: 'none',
              background: '#ef4444', color: '#fff',
              cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────── MAIN PAGE ────────────────────────── */
export function TransactionsClientPage({ transactions, accounts, cards, categories, currentYear, currentMonth, summary }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const [editingTx, setEditingTx] = useState<any>(null);
  const [deletingTx, setDeletingTx] = useState<any>(null);

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

  const { normalRows, cardInvoiceRows } = useMemo(() => {
    const normal = transactions.filter(tx => !tx.creditCardId);
    const cardTx = transactions.filter(tx => tx.creditCardId);

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

    rows.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') cmp = a.sortDate.getTime() - b.sortDate.getTime();
      else if (sortField === 'amount') cmp = a.sortAmount - b.sortAmount;
      else cmp = a.sortDesc.localeCompare(b.sortDesc);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return rows;
  }, [normalRows, cardInvoiceRows, filter, searchTerm, sortField, sortDir]);

  const dailyBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    let running = summary.currentBalance - summary.incomeTotal + summary.expenseTotal;
    const sortedNormal = [...normalRows].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    for (const tx of sortedNormal) {
      const day = new Date(tx.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
      if (tx.type === 'INCOME') running += tx.amount;
      else if (tx.type === 'EXPENSE') running -= tx.amount;
      balances[day] = running;
    }
    for (const inv of cardInvoiceRows) {
      const day = inv.dueDate.toLocaleDateString('pt-BR');
      running -= inv.total;
      balances[day] = running;
    }
    return balances;
  }, [normalRows, cardInvoiceRows, summary]);

  const rowsWithDaySeparators = useMemo(() => {
    const result: (typeof unifiedRows[0] | { kind: 'separator'; day: string; balance: number })[] = [];
    let lastDay = '';
    for (const row of unifiedRows) {
      const day = row.sortDate.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
      if (day !== lastDay && lastDay !== '') {
        result.push({ kind: 'separator', day: lastDay, balance: dailyBalances[lastDay] || 0 });
      }
      result.push(row);
      lastDay = day;
    }
    if (lastDay) {
      result.push({ kind: 'separator', day: lastDay, balance: dailyBalances[lastDay] || 0 });
    }
    return result;
  }, [unifiedRows, dailyBalances]);

  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  const summaryCards = [
    { label: 'Saldo Atual', value: summary.currentBalance, color: '#3b82f6', icon: <Wallet size={20} />, positive: summary.currentBalance >= 0 },
    { label: 'Receitas', value: summary.incomeTotal, color: '#10b981', icon: <TrendingUp size={20} />, positive: true },
    { label: 'Despesas', value: summary.expenseTotal, color: '#ef4444', icon: <TrendingDown size={20} />, positive: false },
    { label: 'Balanço Mensal', value: summary.monthlyBalance, color: summary.monthlyBalance >= 0 ? '#10b981' : '#ef4444', icon: <Scale size={20} />, positive: summary.monthlyBalance >= 0 },
  ];

  const filters: { key: FilterType; label: string; emoji: string }[] = [
    { key: 'ALL', label: 'Todas', emoji: '📋' },
    { key: 'INCOME', label: 'Receitas', emoji: '💚' },
    { key: 'EXPENSE', label: 'Despesas', emoji: '❤️' },
    { key: 'CARD', label: 'Cartões', emoji: '💳' },
  ];

  const refreshPage = () => router.refresh();

  return (
    <>
      {/* Keyframes globais */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes modalSlideIn {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

        {/* ── CARDS RESUMO ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          {summaryCards.map(card => (
            <div key={card.label} style={{
              background: 'var(--bg-surface)',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              cursor: 'default',
              transition: 'transform 0.2s, box-shadow 0.2s',
              position: 'relative',
              overflow: 'hidden',
            }}
              onMouseOver={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                position: 'absolute', top: 0, right: 0, width: '80px', height: '80px',
                borderRadius: '0 0 0 80px',
                background: `${card.color}08`,
              }} />
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: `${card.color}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: card.color, flexShrink: 0,
              }}>
                {card.icon}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', zIndex: 1 }}>
                <span style={{ fontSize: '0.73rem', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {card.label}
                </span>
                <span style={{
                  fontSize: '1.2rem', fontWeight: 800,
                  color: card.color,
                  marginTop: '2px',
                }}>
                  {card.positive && card.label !== 'Despesas' ? '+' : card.label === 'Despesas' ? '-' : ''}
                  R$ {fmt(Math.abs(card.value))}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ── NAVEGAÇÃO MÊS + FILTROS + BUSCA ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '16px',
          background: 'var(--bg-surface)',
          borderRadius: '16px',
          padding: '12px 16px',
          border: '1px solid var(--border-subtle)',
        }}>
          {/* Navegação de mês */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => navigateMonth(-1)}
              style={{
                width: '34px', height: '34px', borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface-hover)', cursor: 'pointer',
                color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{
              padding: '6px 18px', borderRadius: '10px',
              background: 'var(--accent-primary)',
              color: '#fff', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.03em',
            }}>
              {monthNames[currentMonth - 1]} {currentYear}
            </span>
            <button
              onClick={() => navigateMonth(1)}
              style={{
                width: '34px', height: '34px', borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface-hover)', cursor: 'pointer',
                color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Filtros de tipo */}
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-surface-hover)', padding: '4px', borderRadius: '12px' }}>
            {filters.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{
                border: 'none', padding: '7px 14px', borderRadius: '9px', cursor: 'pointer',
                fontSize: '0.82rem', fontWeight: 600,
                background: filter === f.key ? 'var(--accent-primary)' : 'transparent',
                color: filter === f.key ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: '5px',
              }}>
                <span style={{ fontSize: '0.9rem' }}>{f.emoji}</span>
                {f.label}
              </button>
            ))}
          </div>

          {/* Busca e ordenação */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {showSearch && (
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{
                  position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-tertiary)',
                }} />
                <input
                  type="text"
                  placeholder="Buscar transação..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  autoFocus
                  style={{
                    paddingLeft: '32px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px',
                    borderRadius: '10px', border: '1px solid var(--border-subtle)',
                    fontSize: '0.875rem', width: '210px', outline: 'none',
                    background: 'var(--bg-surface)',
                  }}
                />
              </div>
            )}
            <button
              onClick={() => { setShowSearch(!showSearch); if (showSearch) setSearchTerm(''); }}
              title="Buscar"
              style={iconBtnStyle(showSearch)}
            >
              <Search size={15} />
            </button>
            <button
              onClick={() => toggleSort(sortField === 'date' ? 'amount' : sortField === 'amount' ? 'description' : 'date')}
              title={`Ordenar por: ${sortField === 'date' ? 'Data' : sortField === 'amount' ? 'Valor' : 'Descrição'} (${sortDir})`}
              style={iconBtnStyle(false)}
            >
              <SlidersHorizontal size={15} />
            </button>
          </div>
        </div>

        {/* ── TABELA DE TRANSAÇÕES ── */}
        <div style={{
          background: 'var(--bg-surface)',
          borderRadius: '20px',
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface-hover)', borderBottom: '2px solid var(--border-subtle)' }}>
                <th style={{ ...thStyle, width: '44px' }}></th>
                <th style={thStyle}>
                  <button onClick={() => toggleSort('date')} style={thBtnStyle}>
                    Data {sortField === 'date' && <ArrowUpDown size={11} style={{ display: 'inline', marginLeft: '3px' }} />}
                  </button>
                </th>
                <th style={thStyle}>
                  <button onClick={() => toggleSort('description')} style={thBtnStyle}>
                    Descrição {sortField === 'description' && <ArrowUpDown size={11} style={{ display: 'inline', marginLeft: '3px' }} />}
                  </button>
                </th>
                <th style={thStyle}>Categoria</th>
                <th style={thStyle}>Conta</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>
                  <button onClick={() => toggleSort('amount')} style={{ ...thBtnStyle, justifyContent: 'flex-end' }}>
                    Valor {sortField === 'amount' && <ArrowUpDown size={11} style={{ display: 'inline', marginLeft: '3px' }} />}
                  </button>
                </th>
                <th style={{ ...thStyle, width: '56px', textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {rowsWithDaySeparators.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '56px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '3rem' }}>🔍</span>
                      <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-secondary)' }}>
                        Nenhuma transação encontrada
                      </span>
                      <span style={{ fontSize: '0.85rem' }}>
                        Tente ajustar os filtros ou adicionar uma nova transação.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                rowsWithDaySeparators.map((row, idx) => {
                  // ── SEPARADOR DE DIA ──
                  if (row.kind === 'separator') {
                    return (
                      <tr key={`sep-${row.day}-${idx}`} style={{ background: 'var(--bg-surface-hover)' }}>
                        <td colSpan={5} style={{
                          padding: '8px 20px', fontSize: '0.75rem',
                          color: 'var(--text-tertiary)', fontWeight: 600,
                          letterSpacing: '0.04em', textTransform: 'uppercase',
                        }}>
                          📅 {row.day} — Saldo Estimado Final do Dia
                        </td>
                        <td style={{
                          padding: '8px 20px', textAlign: 'right',
                          fontSize: '0.82rem', fontWeight: 700,
                          color: row.balance >= 0 ? '#10b981' : '#ef4444',
                        }}>
                          {row.balance >= 0 ? '+' : ''}R$ {fmt(row.balance)}
                        </td>
                        <td style={{ padding: '8px 20px' }}></td>
                      </tr>
                    );
                  }

                  // ── LINHA DE CARTÃO ──
                  if (row.kind === 'card') {
                    const inv = row.data;
                    const brand = getBrandById(inv.card.icon);
                    return (
                      <tr
                        key={`card-${inv.cardId}`}
                        style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'background 0.15s' }}
                        onClick={() => router.push(`/cards/${inv.cardId}?month=${currentMonth}&year=${currentYear}`)}
                        onMouseOver={e => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={tdStyle}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            background: `${brand.color}15`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {inv.status === 'PAID'
                              ? <CheckCircle2 size={18} color="#10b981" />
                              : <Clock size={18} color="#f59e0b" />}
                          </div>
                        </td>
                        <td style={{ ...tdStyle, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                          {inv.dueDate.toLocaleDateString('pt-BR')}
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ ...brandBadgeStyle(brand, 24), fontSize: '0.38rem' }}>{brand.abbr}</span>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{inv.card.name}</span>
                            <span style={{
                              fontSize: '0.7rem', background: `${brand.color}18`,
                              color: brand.color, padding: '2px 8px', borderRadius: '10px', fontWeight: 700,
                            }}>
                              {inv.count} transaç.
                            </span>
                          </div>
                        </td>
                        <td style={{ ...tdStyle, fontSize: '0.85rem', color: brand.color, fontWeight: 500 }}>
                          💳 Fatura agrupada
                        </td>
                        <td style={{ ...tdStyle, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {inv.card.name}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 800, color: '#ef4444', fontSize: '1rem' }}>
                          −R$ {fmt(inv.total)}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <button
                            onClick={e => { e.stopPropagation(); router.push(`/cards/${inv.cardId}?month=${currentMonth}&year=${currentYear}`); }}
                            title="Ver fatura"
                            style={{
                              background: `${brand.color}15`, border: 'none', cursor: 'pointer',
                              fontSize: '0.72rem', color: brand.color,
                              padding: '5px 10px', borderRadius: '8px', fontWeight: 700,
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                            }}
                          >
                            <ExternalLink size={11} /> Fatura
                          </button>
                        </td>
                      </tr>
                    );
                  }

                  // ── LINHA NORMAL (RECEITA / DESPESA) ──
                  const tx = row.tx;
                  const cat = tx.category || categories.find((c: any) => c.id === tx.categoryId);
                  const isIncome = tx.type === 'INCOME';
                  const rowColor = isIncome ? '#10b981' : '#ef4444';
                  const isPaid = tx.status === 'COMPLETED';

                  return (
                    <tr
                      key={tx.id}
                      style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s' }}
                      onMouseOver={e => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Status indicator */}
                      <td style={{ ...tdStyle, paddingRight: '4px' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '8px',
                          background: `${rowColor}14`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {isPaid
                            ? <CheckCircle2 size={16} color={rowColor} />
                            : <Clock size={16} color={isPaid ? rowColor : '#f59e0b'} />}
                        </div>
                      </td>

                      {/* Data */}
                      <td style={{ ...tdStyle, fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {new Date(tx.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                      </td>

                      {/* Descrição */}
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{tx.description}</span>
                          {tx.totalInstallments && tx.totalInstallments > 1 && (
                            <span style={{
                              fontSize: '0.68rem', color: '#8b5cf6', fontWeight: 700,
                              background: '#8b5cf615', padding: '2px 7px', borderRadius: '10px',
                            }}>
                              {tx.installmentNum}/{tx.totalInstallments}x
                            </span>
                          )}
                          {tx.isFixed && (
                            <span style={{
                              fontSize: '0.68rem', color: '#3b82f6', fontWeight: 700,
                              background: '#3b82f615', padding: '2px 7px', borderRadius: '10px',
                            }}>
                              🔁 Fixo
                            </span>
                          )}
                          {!isPaid && (
                            <span style={{
                              fontSize: '0.68rem', color: '#f59e0b', fontWeight: 700,
                              background: '#f59e0b15', padding: '2px 7px', borderRadius: '10px',
                            }}>
                              ⏳ Pendente
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Categoria */}
                      <td style={tdStyle}>
                        {cat ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
                            <span style={{
                              width: '22px', height: '22px', borderRadius: '6px',
                              background: `${cat.color || '#6b7280'}20`,
                              color: cat.color || '#6b7280',
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.7rem',
                            }}>
                              {cat.icon || '🏷️'}
                            </span>
                            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{cat.name}</span>
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem' }}>—</span>
                        )}
                      </td>

                      {/* Conta */}
                      <td style={{ ...tdStyle, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {tx.account ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            🏦 {tx.account.name}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                        )}
                      </td>

                      {/* Valor */}
                      <td style={{
                        ...tdStyle, textAlign: 'right', fontWeight: 800,
                        color: rowColor, fontSize: '1rem', whiteSpace: 'nowrap',
                      }}>
                        {isIncome ? '+' : '−'} R$ {fmt(tx.amount)}
                      </td>

                      {/* Ações (3 pontos) */}
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <ActionMenu
                          tx={tx}
                          onEdit={setEditingTx}
                          onDelete={setDeletingTx}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Rodapé */}
          {rowsWithDaySeparators.length > 0 && (
            <div style={{
              padding: '12px 20px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'var(--bg-surface-hover)',
            }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                {unifiedRows.length} transaç{unifiedRows.length !== 1 ? 'ões' : 'ão'} no período
              </span>
              <span style={{
                fontSize: '0.82rem', fontWeight: 700,
                color: summary.monthlyBalance >= 0 ? '#10b981' : '#ef4444',
              }}>
                Balanço do mês: {summary.monthlyBalance >= 0 ? '+' : ''}R$ {fmt(summary.monthlyBalance)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── MODAIS ── */}
      {editingTx && (
        <EditTransactionModal
          tx={editingTx}
          accounts={accounts}
          categories={categories}
          onClose={() => setEditingTx(null)}
          onSaved={refreshPage}
        />
      )}
      {deletingTx && (
        <DeleteTransactionDialog
          tx={deletingTx}
          onClose={() => setDeletingTx(null)}
          onDeleted={refreshPage}
        />
      )}
    </>
  );
}

/* ────────────────────────── STYLES ────────────────────────── */
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--text-tertiary)',
  marginBottom: '6px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '10px',
  border: '1px solid var(--border-subtle)',
  background: 'var(--bg-surface-hover)',
  fontSize: '0.95rem',
  color: 'var(--text-primary)',
  outline: 'none',
  boxSizing: 'border-box',
};

const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  fontSize: '0.75rem',
  color: 'var(--text-tertiary)',
  fontWeight: 700,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  userSelect: 'none',
};

const thBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--text-tertiary)',
  fontWeight: 700,
  fontSize: '0.75rem',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  padding: 0,
  display: 'flex',
  alignItems: 'center',
};

const tdStyle: React.CSSProperties = {
  padding: '13px 16px',
  verticalAlign: 'middle',
};

const iconBtnStyle = (active: boolean): React.CSSProperties => ({
  width: '36px',
  height: '36px',
  borderRadius: '10px',
  border: '1px solid var(--border-subtle)',
  background: active ? 'var(--accent-primary)' : 'var(--bg-surface-hover)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: active ? '#fff' : 'var(--text-secondary)',
  transition: 'all 0.15s',
});
