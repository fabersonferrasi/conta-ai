"use client";

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '../ui/Button/Button';
import { Modal } from '../ui/Modal/Modal';
import { payExactTransaction } from '../../lib/transaction-actions';

interface Props {
  transaction: any;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickPayModal({ transaction, isOpen, onClose }: Props) {
  const [amount, setAmount] = useState(transaction?.amount.toString() || '');
  const [date, setDate] = useState(transaction?.date ? new Date(transaction.date).toISOString().split('T')[0] : '');
  const [isLoading, setIsLoading] = useState(false);

  // Update whenever transaction changes
  React.useEffect(() => {
    if (transaction) {
      setAmount(transaction.amount.toString());
      setDate(new Date(transaction.date).toISOString().split('T')[0]);
    }
  }, [transaction]);

  const handlePay = async () => {
    if (!transaction) return;
    setIsLoading(true);
    await payExactTransaction(transaction.id, parseFloat(amount), new Date(date + 'T12:00:00Z'));
    setIsLoading(false);
    onClose();
  };

  if (!isOpen || !transaction) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Dar Baixa (Pagamento Efetuado)">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ background: 'var(--bg-surface-hover)', padding: '12px', borderRadius: '8px' }}>
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>{transaction.description}</p>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
            Valor original: R$ {transaction.amount.toFixed(2)}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Valor pago (R$)</label>
            <input 
              type="number" 
              step="0.01" 
              value={amount} 
              onChange={e => setAmount(e.target.value)} 
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', fontSize: '1rem' }} 
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Data real do pagamento</label>
            <input 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)} 
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', fontSize: '1rem' }} 
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>Cancelar</Button>
          <Button variant="primary" onClick={handlePay} disabled={isLoading} style={{ backgroundColor: 'var(--accent-success)' }}>
            Confirmar Pagamento
          </Button>
        </div>
      </div>
    </Modal>
  );
}
