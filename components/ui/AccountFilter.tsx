"use client";

import React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Wallet, CreditCard, LayoutDashboard } from 'lucide-react';

interface Props {
  accounts: any[];
}

export function AccountFilter({ accounts }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const currentAccountId = searchParams.get('accountId') || '';

  const handleSelect = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id) {
      params.set('accountId', id);
    } else {
      params.delete('accountId');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
      <button 
        onClick={() => handleSelect('')}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer',
          background: currentAccountId === '' ? 'var(--accent-primary)' : 'var(--bg-surface)',
          color: currentAccountId === '' ? '#fff' : 'var(--text-secondary)',
          boxShadow: 'var(--shadow-sm)',
          fontWeight: currentAccountId === '' ? 600 : 400,
          whiteSpace: 'nowrap', transition: 'all 0.2s'
        }}
      >
        <LayoutDashboard size={16} />
        Visão Global (Todas)
      </button>

      {accounts.map(acc => (
        <button 
          key={acc.id}
          onClick={() => handleSelect(acc.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer',
            background: currentAccountId === acc.id ? 'var(--accent-primary)' : 'var(--bg-surface)',
            color: currentAccountId === acc.id ? '#fff' : 'var(--text-secondary)',
            boxShadow: 'var(--shadow-sm)',
            fontWeight: currentAccountId === acc.id ? 600 : 400,
            whiteSpace: 'nowrap', transition: 'all 0.2s'
          }}
        >
          <Wallet size={16} />
          {acc.name}
        </button>
      ))}
    </div>
  );
}
