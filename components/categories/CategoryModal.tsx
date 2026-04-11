"use client";

import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal/Modal';
import { Button } from '../ui/Button/Button';
import { createCategory, updateCategory } from '../../lib/category-actions';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: any;
}

export function CategoryModal({ isOpen, onClose, category }: CategoryModalProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#2563eb');
  const [icon, setIcon] = useState('🍔');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const catIcons = ['🍔', '🏠', '🎬', '🏥', '🚗', '🎓', '✈️', '🐶', '👔', '⚡', '💧', '📱', '🕹️', '🛒'];

  useEffect(() => {
    if (category) {
      setName(category.name);
      setColor(category.color || '#2563eb');
      setIcon(category.icon || '🍔');
    } else {
      setName('');
      setColor('#2563eb');
      setIcon('🍔');
    }
  }, [category, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (category) {
        await updateCategory(category.id, { name, color, icon });
      } else {
        await createCategory({ name, color, icon });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar categoria');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={category ? 'Editar Categoria' : 'Nova Categoria'}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {error && (
          <div style={{ padding: '12px', background: 'var(--accent-danger)', color: '#fff', borderRadius: '8px', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Nome da Categoria</label>
          <input 
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            required
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }} 
          />
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Cor Visual</label>
            <input 
              type="color" 
              value={color} 
              onChange={e => setColor(e.target.value)} 
              style={{ padding: '0', width: '100%', height: '40px', border: 'none', cursor: 'pointer', background: 'transparent' }} 
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Ícone Representativo</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {catIcons.map(ic => (
                <button 
                  key={ic} 
                  type="button"
                  onClick={() => setIcon(ic)}
                  style={{
                    fontSize: '1.2rem',
                    padding: '6px',
                    background: icon === ic ? 'var(--bg-surface-hover)' : 'transparent',
                    border: icon === ic ? `2px solid ${color}` : '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    lineHeight: 1
                  }}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>Cancelar</Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? 'Salvando...' : 'Salvar Categoria'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
