"use client";

import React, { useState } from 'react';
import { deleteTransaction, updateTransaction } from '../../lib/transaction-actions';
import { Button } from '../ui/Button/Button';
import { Modal } from '../ui/Modal/Modal';
import { QuickPayModal } from './QuickPayModal';
import { getBrandById, brandBadgeStyle } from '../../lib/bank-brands';
import styles from '../../app/transactions/page.module.css';

interface Props {
  tx: any;
  categories: any[];
  accounts: any[];
  cards: any[];
}

export function TransactionTableRow({ tx, categories, accounts, cards }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isQuickPayOpen, setIsQuickPayOpen] = useState(false);

  const [formData, setFormData] = useState({
    description: tx.description,
    amount: tx.amount.toString(),
    date: new Date(tx.date).toISOString().split('T')[0],
    categoryId: tx.categoryId || '',
    source: tx.accountId ? `ACCOUNT|${tx.accountId}` : tx.creditCardId ? `CARD|${tx.creditCardId}` : '',
    status: tx.status
  });

  const handleDelete = async (scope: 'SINGLE' | 'FUTURE') => {
    setIsDeleting(true);
    setIsDeleteModalOpen(false);
    await deleteTransaction(tx.id, scope);
  };

  const handleSave = async (scope: 'SINGLE' | 'FUTURE') => {
    const updatedData: any = {
      description: formData.description,
      amount: parseFloat(formData.amount),
      date: new Date(formData.date + 'T12:00:00Z'),
      categoryId: formData.categoryId || null,
      status: formData.status
    };

    if (formData.source) {
      const [type, id] = formData.source.split('|');
      if (type === 'ACCOUNT') {
        updatedData.accountId = id;
        updatedData.creditCardId = null;
      } else {
        updatedData.creditCardId = id;
        updatedData.accountId = null;
      }
    }

    await updateTransaction(tx.id, updatedData, scope);
    setIsEditing(false);
  };

  const hasInstallments = !!tx.installmentGroupId;
  const categoryObj = categories.find(c => c.id === tx.categoryId);

  return (
    <>
      <tr style={{ opacity: isDeleting ? 0.5 : 1, transition: 'opacity 0.2s' }}>
        <td>{new Date(tx.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
        <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
          {tx.description}
          {hasInstallments && tx.totalInstallments && tx.totalInstallments > 1 && <span style={{fontSize: '0.75rem', color: 'var(--accent-primary)', marginLeft: '8px'}}>{tx.installmentNum}/{tx.totalInstallments}</span>}
        </td>
        <td>
          {categoryObj ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: categoryObj.color }}>{categoryObj.icon || '🏷️'}</span>
              {categoryObj.name}
            </span>
          ) : '-'}
        </td>
        <td>
          {tx.account ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>🏦 {tx.account.name}</span>
          ) : tx.creditCard ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {(() => { const b = getBrandById(tx.creditCard.icon); return <span style={{ ...brandBadgeStyle(b, 22), fontSize: '0.45rem' }}>{b.abbr}</span>; })()}
              {tx.creditCard.name}
            </span>
          ) : '-'}
        </td>
        <td className={`${styles.amount} ${tx.type === 'INCOME' ? styles.income : tx.type === 'EXPENSE' ? styles.expense : ''}`}>
          {tx.type === 'INCOME' ? '+' : '-'} R$ {tx.amount.toFixed(2)}
        </td>
        <td>
          <span style={{ 
            fontSize: '0.8rem', 
            padding: '4px 8px', 
            borderRadius: '12px', 
            background: tx.status === 'COMPLETED' ? '#10b98122' : '#f59e0b22', 
            color: tx.status === 'COMPLETED' ? '#10b981' : '#f59e0b',
            fontWeight: 600
          }}>
            {tx.status === 'COMPLETED' ? 'Pago' : 'Pendente'}
          </span>
        </td>
        <td>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {tx.status === 'PENDING' && (
              <button onClick={() => setIsQuickPayOpen(true)} style={{ background: 'var(--accent-success)', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontWeight: 600 }} title="Dar Baixa">✓ Baixar</button>
            )}
            <button onClick={() => setIsEditing(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }} title="Editar">✏️</button>
            <button onClick={() => setIsDeleteModalOpen(true)} disabled={isDeleting} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-tertiary)' }} title="Excluir">🗑️</button>
          </div>
        </td>
      </tr>

      <QuickPayModal 
        isOpen={isQuickPayOpen} 
        onClose={() => setIsQuickPayOpen(false)} 
        transaction={tx} 
      />

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Excluir Lançamento">
        <p style={{ marginBottom: '24px', color: 'var(--text-primary)' }}>
          Tem certeza que deseja excluir o lançamento <strong>{tx.description}</strong>?
        </p>

        {hasInstallments && (
          <div style={{ padding: '12px', background: 'var(--bg-surface-hover)', borderRadius: '8px', marginBottom: '24px' }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>
              ℹ️ Este lançamento faz parte de um parcelamento ({tx.installmentNum}/{tx.totalInstallments}).
            </p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</Button>
          <Button 
            variant="primary" 
            onClick={() => handleDelete('SINGLE')}
            style={{ backgroundColor: '#ef4444' }}
          >
            Excluir {hasInstallments ? 'apenas esta' : ''}
          </Button>
          {hasInstallments && (
            <Button 
              variant="primary" 
              onClick={() => handleDelete('FUTURE')}
              style={{ backgroundColor: '#b91c1c' }}
            >
              Excluir esta e as próximas
            </Button>
          )}
        </div>
      </Modal>

      <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} title="Editar Lançamento">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Data</label>
            <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Descrição</label>
            <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Categoria</label>
            <select value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
              <option value="">Geral</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Fonte / Conta</label>
            <select value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
              <optgroup label="Contas">
                {accounts.map(a => <option key={a.id} value={`ACCOUNT|${a.id}`}>{a.name}</option>)}
              </optgroup>
              <optgroup label="Cartões">
                {cards.map(c => <option key={c.id} value={`CARD|${c.id}`}>{c.name}</option>)}
              </optgroup>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Valor (R$)</label>
            <input type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Status</label>
            <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
              <option value="PENDING">Pendente</option>
              <option value="COMPLETED">Pago</option>
            </select>
          </div>

          {hasInstallments && (
            <div style={{ padding: '12px', background: 'var(--bg-surface-hover)', borderRadius: '8px', marginTop: '8px' }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>
                ℹ️ Esta é a parcela {tx.installmentNum} de {tx.totalInstallments}. Modificações na DATA afetarão apenas esta parcela, mesmo escolhendo salvar em "lote". As demais informações serão replicadas.
              </p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px', flexWrap: 'wrap' }}>
            <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancelar</Button>
            <Button variant="primary" onClick={() => handleSave('SINGLE')}>Salvar {hasInstallments ? 'apenas esta' : ''}</Button>
            {hasInstallments && (
              <Button variant="primary" onClick={() => handleSave('FUTURE')}>Salvar esta e próximas</Button>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
