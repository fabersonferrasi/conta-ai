"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { getBrandById, brandBadgeStyle } from '../../lib/bank-brands';
import styles from '../../app/transactions/page.module.css';
import { ExternalLink } from 'lucide-react';

interface Props {
  card: any;
  total: number;
  count: number;
  status: string;
  dueDate: string;
  currentMonth: number;
  currentYear: number;
}

export function CardInvoiceRow({ card, total, count, status, dueDate, currentMonth, currentYear }: Props) {
  const router = useRouter();
  const brand = getBrandById(card.icon);

  const handleNavigate = () => {
    router.push(`/cards/${card.id}?month=${currentMonth}&year=${currentYear}`);
  };

  return (
    <tr 
      style={{ cursor: 'pointer', transition: 'background 0.15s' }}
      onClick={handleNavigate}
      onMouseOver={e => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
      onMouseOut={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Data de VENCIMENTO da fatura */}
      <td>{new Date(dueDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>

      {/* Descrição: Nome do cartão */}
      <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {card.name}
          <span style={{ 
            fontSize: '0.7rem', color: '#fff', background: brand.color, 
            padding: '2px 8px', borderRadius: '12px', fontWeight: 600 
          }}>
            {count} {count === 1 ? 'lançamento' : 'lançamentos'}
          </span>
        </div>
      </td>

      {/* Categoria: Agrupada cartão */}
      <td>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ 
            ...brandBadgeStyle(brand, 24), 
            fontSize: '0.4rem' 
          }}>
            {brand.abbr}
          </span>
          <span style={{ color: brand.color, fontWeight: 500 }}>Agrupada cartão</span>
        </span>
      </td>

      {/* Conta: Badge do cartão */}
      <td>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ ...brandBadgeStyle(brand, 22), fontSize: '0.45rem' }}>{brand.abbr}</span>
          {card.name}
        </span>
      </td>

      {/* Valor total da fatura */}
      <td className={`${styles.amount} ${styles.expense}`}>
        - R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      </td>

      {/* Status */}
      <td>
        <span style={{ 
          fontSize: '0.8rem', 
          padding: '4px 8px', 
          borderRadius: '12px', 
          background: status === 'PAID' ? '#10b98122' : '#f59e0b22', 
          color: status === 'PAID' ? '#10b981' : '#f59e0b',
          fontWeight: 600
        }}>
          {status === 'PAID' ? 'Fatura paga' : 'Fatura aberta'}
        </span>
      </td>

      {/* Ações: Link para detalhe */}
      <td>
        <button 
          onClick={(e) => { e.stopPropagation(); handleNavigate(); }}
          style={{ 
            background: `${brand.color}15`, border: `1px solid ${brand.color}33`, 
            cursor: 'pointer', fontSize: '0.8rem', color: brand.color, 
            padding: '4px 12px', borderRadius: '6px', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '4px',
          }} 
          title="Ver detalhes da fatura"
        >
          <ExternalLink size={14} /> Fatura
        </button>
      </td>
    </tr>
  );
}
