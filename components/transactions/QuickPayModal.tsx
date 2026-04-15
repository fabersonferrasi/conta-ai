"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/Button/Button';
import { Modal } from '../ui/Modal/Modal';
import { payExactTransaction } from '../../lib/transaction-actions';

interface Props {
  transaction: any;
  isOpen: boolean;
  onClose: () => void;
  onSettled?: () => void;
}

const toDateInputValue = (value: string | Date | null | undefined) => {
  if (!value) return '';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().split('T')[0];
};

const parseCurrencyInput = (value: string) => {
  const sanitized = value.trim().replace(/\s/g, '');
  if (!sanitized) return NaN;
  if (sanitized.includes(',') && sanitized.includes('.')) {
    return Number(sanitized.replace(/\./g, '').replace(',', '.'));
  }
  return Number(sanitized.replace(',', '.'));
};

export function QuickPayModal({ transaction, isOpen, onClose, onSettled }: Props) {
  const router = useRouter();
  const [amount, setAmount] = useState(transaction?.amount.toString() || '');
  const [date, setDate] = useState(toDateInputValue(transaction?.date));
  const [isLoading, setIsLoading] = useState(false);
  const isIncome = transaction?.type === 'INCOME';
  const settledLabel = isIncome ? 'recebimento' : 'pagamento';
  const valueLabel = isIncome ? 'Valor recebido (R$)' : 'Valor pago (R$)';
  const dateLabel = isIncome ? 'Data do recebimento' : 'Data do pagamento';
  const submitLabel = transaction?.status === 'COMPLETED' ? 'Salvar baixa' : 'Confirmar baixa';

  // Update whenever transaction changes
  React.useEffect(() => {
    if (transaction) {
      setAmount(transaction.amount.toString());
      setDate(toDateInputValue(transaction.date));
    }
  }, [transaction]);

  const handlePay = async () => {
    if (!transaction) return;
    const parsedAmount = parseCurrencyInput(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      alert('Informe um valor válido para a baixa.');
      return;
    }
    if (!date) {
      alert('Informe a data efetiva da baixa.');
      return;
    }

    setIsLoading(true);
    try {
      await payExactTransaction(transaction.id, parsedAmount, new Date(`${date}T12:00:00Z`));
      router.refresh();
      onSettled?.();
      onClose();
    } catch (err) {
      alert('Erro ao salvar a baixa: ' + err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !transaction) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={transaction.status === 'COMPLETED' ? 'Editar baixa da transação' : 'Dar baixa na transação'}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ background: 'var(--bg-surface-hover)', padding: '12px', borderRadius: '8px' }}>
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>{transaction.description}</p>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
            Valor previsto: R$ {transaction.amount.toFixed(2)}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
            Ajuste aqui o {settledLabel} com valor e data efetivos.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>{valueLabel}</label>
            <input 
              type="text"
              value={amount} 
              onChange={e => setAmount(e.target.value)} 
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', fontSize: '1rem' }} 
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>{dateLabel}</label>
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
          <Button
            variant="primary"
            onClick={handlePay}
            disabled={isLoading}
            style={{ backgroundColor: isIncome ? '#10b981' : 'var(--accent-success)' }}
          >
            {isLoading ? 'Salvando...' : submitLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
