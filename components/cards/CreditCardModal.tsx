"use client";

import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal/Modal';
import { Button } from '../ui/Button/Button';
import { createCreditCard, updateCreditCard } from '../../lib/card-actions';
import { BANK_BRANDS, getBrandById, brandBadgeStyle } from '../../lib/bank-brands';

interface CreditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  card?: any;
}

export function CreditCardModal({ isOpen, onClose, card }: CreditCardModalProps) {
  const [name, setName] = useState('');
  const [limit, setLimit] = useState('');
  const [closingDay, setClosingDay] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [icon, setIcon] = useState('💳');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const bankBrands = BANK_BRANDS;

  useEffect(() => {
    if (card) {
      setName(card.name);
      setLimit(card.limit.toString());
      setClosingDay(card.closingDay.toString());
      setDueDay(card.dueDay.toString());
      setIcon(card.icon || 'nubank');
    } else {
      setName('');
      setLimit('');
      setClosingDay('');
      setDueDay('');
      setIcon('nubank');
    }
  }, [card, isOpen]);

  const selectedBrand = bankBrands.find(b => b.id === icon) || bankBrands[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const payload = {
        name,
        limit: parseFloat(limit),
        closingDay: parseInt(closingDay),
        dueDay: parseInt(dueDay),
        icon,
      };

      if (card) {
        await updateCreditCard(card.id, payload);
      } else {
        await createCreditCard(payload);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar cartão.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={card ? 'Editar Cartão' : 'Novo Cartão de Crédito'}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {error && (
          <div style={{ padding: '12px', background: 'var(--accent-danger)', color: '#fff', borderRadius: '8px', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        {/* Preview do cartão selecionado */}
        <div style={{
          background: `linear-gradient(135deg, ${selectedBrand.color}, ${selectedBrand.color}cc)`,
          color: selectedBrand.textColor || '#fff',
          borderRadius: '16px',
          padding: '24px',
          minHeight: '100px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '1px' }}>{selectedBrand.label}</div>
          <div style={{ fontSize: '0.9rem', opacity: 0.85, marginTop: '8px' }}>{name || 'Nome do Cartão'}</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '4px' }}>Limite: R$ {limit || '0,00'}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Nome do Cartão (Ex: Nubank, Itaú Black)</label>
          <input 
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            required
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', fontSize: '1rem' }} 
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Limite Total (R$)</label>
          <input 
            type="number" 
            step="0.01"
            value={limit} 
            onChange={e => setLimit(e.target.value)} 
            required
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', fontSize: '1rem' }} 
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Bandeira / Banco Emissor</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: '8px' }}>
            {bankBrands.map(brand => (
              <button 
                key={brand.id} 
                type="button"
                onClick={() => setIcon(brand.id)}
                title={brand.label}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 4px',
                  background: icon === brand.id ? `${brand.color}18` : 'transparent',
                  border: icon === brand.id ? `2px solid ${brand.color}` : '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: brand.color,
                  color: brand.textColor || '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: brand.abbr.length > 3 ? '0.55rem' : '0.65rem',
                  fontWeight: 800,
                  letterSpacing: '0.5px',
                  boxShadow: icon === brand.id ? `0 0 12px ${brand.color}66` : 'none',
                  transition: 'box-shadow 0.2s',
                }}>
                  {brand.abbr}
                </div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.1 }}>{brand.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Dia de Fechamento</label>
            <input 
              type="number" 
              value={closingDay} 
              onChange={e => setClosingDay(e.target.value)} 
              required
              min="1" max="31"
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', fontSize: '1rem' }} 
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Dia de Vencimento</label>
            <input 
              type="number" 
              value={dueDay} 
              onChange={e => setDueDay(e.target.value)} 
              required
              min="1" max="31"
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', fontSize: '1rem' }} 
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>Cancelar</Button>
          <Button type="submit" variant="primary" disabled={isLoading} style={{ backgroundColor: '#8b5cf6' }}>
            {isLoading ? 'Salvando...' : 'Salvar Cartão'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
