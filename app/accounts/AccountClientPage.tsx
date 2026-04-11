"use client";

import React, { useState } from 'react';
import { Button } from '../../components/ui/Button/Button';
import { AccountModal } from '../../components/accounts/AccountModal';
import { deleteAccount } from '../../lib/account-actions';
import { Wallet } from 'lucide-react';

export function AccountClientPage({ initialAccounts }: { initialAccounts: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleCreate = () => {
    setSelectedAccount(null);
    setIsModalOpen(true);
  };

  const handleEdit = (account: any) => {
    setSelectedAccount(account);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir a conta bancária "${name}"?`)) return;
    
    setLoadingId(id);
    try {
      await deleteAccount(id);
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir conta.');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Gerencie suas contas correntes e carteiras ativas.</p>
        <Button variant="primary" onClick={handleCreate}>+ Adicionar Conta</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
        {initialAccounts.map(account => (
          <div key={account.id} style={{ 
            background: 'var(--bg-surface)', 
            padding: '24px', 
            borderRadius: '16px', 
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', background: 'var(--accent-primary)', color: '#fff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wallet size={24} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{account.name}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{account.bank}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'var(--bg-surface-hover)', padding: '16px', borderRadius: '12px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Saldo Atual</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>R$ {account.balance.toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
              <button 
                onClick={() => handleEdit(account)} 
                style={{ flex: 1, background: 'var(--bg-surface-hover)', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-secondary)', fontWeight: 500 }}
              >
                Editar
              </button>
              <button 
                onClick={() => handleDelete(account.id, account.name)} 
                disabled={loadingId === account.id}
                style={{ flex: 1, background: '#ef444415', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', color: 'var(--accent-danger)', fontWeight: 500 }}
              >
                {loadingId === account.id ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <AccountModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        account={selectedAccount} 
      />
    </div>
  );
}
