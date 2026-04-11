"use client";

import React, { useState } from 'react';
import { Card } from '../../components/ui/Card/Card';
import { Button } from '../../components/ui/Button/Button';
import { CategoryModal } from '../../components/categories/CategoryModal';
import { deleteCategory } from '../../lib/category-actions';

export function CategoryClientPage({ initialCategories }: { initialCategories: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleCreate = () => {
    setSelectedCategory(null);
    setIsModalOpen(true);
  };

  const handleEdit = (cat: any) => {
    setSelectedCategory(cat);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir a categoria "${name}"?`)) return;
    
    setLoadingId(id);
    try {
      await deleteCategory(id);
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir categoria.');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Gerencie os rótulos dos seus lançamentos.</p>
        <Button variant="primary" onClick={handleCreate}>+ Adicionar Categoria</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
        {initialCategories.map(cat => (
          <div key={cat.id} style={{ 
            background: 'var(--bg-surface)', 
            padding: '20px', 
            borderRadius: 'var(--border-radius-md)', 
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            borderTop: `4px solid ${cat.color || 'var(--accent-primary)'}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `${cat.color}20`, color: cat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                {cat.icon || '🏷️'}
              </div>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1.1rem' }}>{cat.name}</span>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
              <button 
                onClick={() => handleEdit(cat)} 
                style={{ flex: 1, background: 'var(--bg-surface-hover)', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                Editar
              </button>
              <button 
                onClick={() => handleDelete(cat.id, cat.name)} 
                disabled={loadingId === cat.id}
                style={{ flex: 1, background: '#ef444415', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', color: 'var(--accent-danger)' }}
              >
                {loadingId === cat.id ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <CategoryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        category={selectedCategory} 
      />
    </div>
  );
}
