"use client";

import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal/Modal';
import { Button } from '../ui/Button/Button';
import { createAccount, updateAccount } from '../../lib/account-actions';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account?: any;
}

export function AccountModal({ isOpen, onClose, account }: AccountModalProps) {
  const [name, setName] = useState('');
  const [bank, setBank] = useState('');
  const [balance, setBalance] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (account) {
      setName(account.name);
      setBank(account.bank);
      setBalance(account.balance.toString());
    } else {
      setName('');
      setBank('');
      setBalance('0');
    }
  }, [account, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const payload = {
        name,
        bank,
        balance: parseFloat(balance),
      };

      if (account) {
        await updateAccount(account.id, payload);
      } else {
        await createAccount(payload);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar conta.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={account ? 'Editar Conta' : 'Nova Conta Corrente'}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {error && (
          <div style={{ padding: '12px', background: 'var(--accent-danger)', color: '#fff', borderRadius: '8px', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Apelido da Conta (Ex: Conta Corrente Itaú)</label>
          <input 
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            required
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', fontSize: '1rem' }} 
          />
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Instituição / Banco</label>
            <input 
              type="text" 
              value={bank} 
              onChange={e => setBank(e.target.value)} 
              required
              placeholder="Ex: Itaú, Nubank..."
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', fontSize: '1rem' }} 
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Saldo Atual Real (R$)</label>
            <input 
              type="number" 
              step="0.01"
              value={balance} 
              onChange={e => setBalance(e.target.value)} 
              required
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', fontSize: '1rem' }} 
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>Cancelar</Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? 'Salvando...' : 'Salvar Conta'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
