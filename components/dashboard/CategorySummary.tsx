"use client";

import React, { useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Card } from '../ui/Card/Card';

type CategoryRank = { id: string; name: string; color: string; totalPaid: number; totalPending: number };

export function CategorySummary({ categories }: { categories: CategoryRank[] }) {
  const [filter, setFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');

  const processedData = categories.map(c => {
    let value = 0;
    if (filter === 'ALL') value = c.totalPaid + c.totalPending;
    else if (filter === 'PAID') value = c.totalPaid;
    else if (filter === 'PENDING') value = c.totalPending;
    
    return { ...c, value };
  }).filter(c => c.value > 0).sort((a, b) => b.value - a.value);

  const totalFiltered = processedData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <Card title="Gasto por Categoria">
       <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button style={{ padding: '4px 12px', borderRadius: '16px', border: '1px solid var(--border-subtle)', background: filter === 'ALL' ? 'var(--bg-surface-hover)' : 'transparent', cursor: 'pointer' }} onClick={() => setFilter('ALL')}>Todos</button>
          <button style={{ padding: '4px 12px', borderRadius: '16px', border: '1px solid var(--border-subtle)', background: filter === 'PAID' ? 'var(--bg-surface-hover)' : 'transparent', cursor: 'pointer' }} onClick={() => setFilter('PAID')}>Já Pagos</button>
          <button style={{ padding: '4px 12px', borderRadius: '16px', border: '1px solid var(--border-subtle)', background: filter === 'PENDING' ? 'var(--bg-surface-hover)' : 'transparent', cursor: 'pointer' }} onClick={() => setFilter('PENDING')}>A Pagar</button>
       </div>

       {processedData.length === 0 ? (
         <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>Nenhuma despesa para este filtro.</p>
       ) : (
         <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center' }}>
            <div style={{ width: '200px', height: '200px', flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={processedData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {processedData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                     formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Gasto']}
                     contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
               {processedData.map(c => (
                 <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                       <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: c.color }}></span>
                       <span style={{ fontWeight: 500, fontSize: '0.95rem' }}>{c.name}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                       <div style={{ fontWeight: 600 }}>R$ {c.value.toFixed(2)}</div>
                       <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{((c.value / totalFiltered) * 100).toFixed(1)}%</div>
                    </div>
                 </div>
               ))}
            </div>
         </div>
       )}
    </Card>
  );
}
