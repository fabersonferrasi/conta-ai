"use client";

import React, { useRef } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface DailyProjectionTableProps {
  data: any[];
}

export function DailyProjectionTable({ data }: DailyProjectionTableProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const today = new Date().getDate();

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', padding: '8px 0' }}>
      
      {/* Scroll controls */}
      <button 
         onClick={() => handleScroll('left')}
         style={{ position: 'absolute', left: '-12px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: 'var(--shadow-md)', color: 'var(--text-primary)' }}
      >
        <ArrowLeft size={18} />
      </button>
      <button 
         onClick={() => handleScroll('right')}
         style={{ position: 'absolute', right: '-12px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: 'var(--shadow-md)', color: 'var(--text-primary)' }}
      >
        <ArrowRight size={18} />
      </button>

      <div 
        ref={scrollRef}
        style={{
          display: 'flex',
          gap: '16px',
          overflowX: 'auto',
          padding: '16px',
          scrollbarWidth: 'none', /* Firefox */
          msOverflowStyle: 'none',  /* IE and Edge */
        }}
      >
        {/* Hide scrollbar for Chrome/Safari using style block below usually, but since this is inline, we rely on standard behavior or css classes if possible. I'll just keep it clean. */}

        {data.map((dayData) => {
          const isToday = dayData.day === today;
          const isNegativeBalance = dayData.balance < 0;
          const hasMovements = dayData.income > 0 || dayData.expense > 0;

          // Destaque visual dependendo se tem movimento ou não
          const cardOpacity = hasMovements || isToday ? 1 : 0.6;
          const borderStyle = isToday ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)';

          return (
            <div 
              key={dayData.day}
              style={{
                minWidth: '200px',
                background: isToday ? 'var(--bg-surface-hover)' : 'var(--bg-surface)',
                borderRadius: 'var(--border-radius-md)',
                padding: '16px',
                border: borderStyle,
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                opacity: cardOpacity,
                boxShadow: isToday ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                transition: 'transform 0.2s',
                transform: isToday ? 'scale(1.02)' : 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed var(--border-subtle)', paddingBottom: '8px' }}>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Dia {dayData.day}
                </span>
                {isToday && (
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, background: 'var(--accent-primary)', color: '#fff', padding: '2px 8px', borderRadius: '12px' }}>
                    HOJE
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Entradas:</span>
                  <span style={{ color: dayData.income > 0 ? 'var(--accent-success)' : 'var(--text-tertiary)', fontWeight: dayData.income > 0 ? 600 : 400 }}>
                    + R$ {dayData.income.toFixed(2)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Saídas:</span>
                  <span style={{ color: dayData.expense > 0 ? 'var(--accent-danger)' : 'var(--text-tertiary)', fontWeight: dayData.expense > 0 ? 600 : 400 }}>
                    - R$ {dayData.expense.toFixed(2)}
                  </span>
                </div>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', padding: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Saldo Projetado</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: isNegativeBalance ? 'var(--accent-danger)' : 'var(--accent-primary)' }}>
                  R$ {dayData.balance.toFixed(2)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
