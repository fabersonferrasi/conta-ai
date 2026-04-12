"use client";

import React, { useState } from 'react';
import { Button } from '../ui/Button/Button';
import { Modal } from '../ui/Modal/Modal';
import { payExactTransaction, toggleTransactionStatus, deleteTransaction } from '../../lib/transaction-actions';

export function InteractiveActionList({ transactions }: { transactions: any[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [exactAmount, setExactAmount] = useState<string>('');
  
  const [deleteModalOpenFor, setDeleteModalOpenFor] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleOpenEdit = (id: string, currentAmount: number) => {
    setEditingId(id);
    setExactAmount(currentAmount.toString());
  };

  const handleConfirmPay = async (id: string) => {
    await payExactTransaction(id, parseFloat(exactAmount));
    setEditingId(null);
  };

  const handleDelete = async (scope: 'SINGLE' | 'FUTURE') => {
    if (!deleteModalOpenFor) return;
    setIsDeleting(true);
    await deleteTransaction(deleteModalOpenFor.id, scope);
    setIsDeleting(false);
    setDeleteModalOpenFor(null);
  };

  if (transactions.length === 0) {
    return <p style={{color: 'var(--text-tertiary)'}}>Nenhuma transação no radar.</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
      {transactions.slice(0, 10).map((l) => (
        <div key={l.id} style={{ padding: '16px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--border-radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>
                {l.description}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                {new Date(l.date).toLocaleDateString('pt-BR')} • {l.creditCardId ? 'Cartão' : 'Conta'}
                {l.category && ` • ${l.category.name}`}
              </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: l.type === 'INCOME' ? '#10b981' : '#f43f5e' }}>
              {l.type === 'INCOME' ? '+' : '-'} R$ {l.amount.toFixed(2)}
            </span>
            
            {l.status === 'COMPLETED' ? (
              <form action={toggleTransactionStatus.bind(null, l.id)}>
                <Button variant="primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} type="submit">
                    ✔ Pago
                </Button>
              </form>
            ) : editingId === l.id ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-surface-hover)', padding: '4px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Baixa em R$:</span>
                <input 
                  type="number" 
                  step="0.01"
                  value={exactAmount}
                  onChange={e => setExactAmount(e.target.value)}
                  style={{ width: '80px', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--accent-primary)' }}
                />
                <Button onClick={() => handleConfirmPay(l.id)} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Confirmar</Button>
                <button onClick={() => setEditingId(null)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '0.8rem' }}>Cancelar</button>
              </div>
            ) : (
              <Button variant="secondary" onClick={() => handleOpenEdit(l.id, l.amount)} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                  Pendente
              </Button>
            )}
            <button 
              onClick={() => setDeleteModalOpenFor(l)} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: '1.2rem' }} 
              title="Excluir"
            >
              🗑️
            </button>
          </div>
        </div>
      ))}

      <Modal isOpen={!!deleteModalOpenFor} onClose={() => setDeleteModalOpenFor(null)} title="Excluir Transação">
        {deleteModalOpenFor && (
          <>
            <p style={{ marginBottom: '24px', color: 'var(--text-primary)' }}>
              Tem certeza que deseja excluir a transação <strong>{deleteModalOpenFor.description}</strong>?
            </p>

            {deleteModalOpenFor.installmentGroupId && (
              <div style={{ padding: '12px', background: 'var(--bg-surface-hover)', borderRadius: '8px', marginBottom: '24px' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>
                  ℹ️ Esta transação faz parte de um parcelamento ({deleteModalOpenFor.installmentNum}/{deleteModalOpenFor.totalInstallments}).
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <Button variant="secondary" onClick={() => setDeleteModalOpenFor(null)}>Cancelar</Button>
              <Button 
                variant="primary" 
                onClick={() => handleDelete('SINGLE')}
                style={{ backgroundColor: '#ef4444' }}
                disabled={isDeleting}
              >
                Excluir {deleteModalOpenFor.installmentGroupId ? 'apenas esta' : ''}
              </Button>
              {deleteModalOpenFor.installmentGroupId && (
                <Button 
                  variant="primary" 
                  onClick={() => handleDelete('FUTURE')}
                  style={{ backgroundColor: '#b91c1c' }}
                  disabled={isDeleting}
                >
                  Excluir esta e próximas
                </Button>
              )}
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
