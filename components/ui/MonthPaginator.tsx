"use client";

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function MonthPaginator() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentYear = parseInt(searchParams.get('year') || new Date().getFullYear().toString(), 10);
  const currentMonth = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString(), 10);

  const goToPrevMonth = () => {
    let year = currentYear;
    let month = currentMonth - 1;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
    router.push(`?month=${month}&year=${year}`);
  };

  const goToNextMonth = () => {
    let year = currentYear;
    let month = currentMonth + 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
    router.push(`?month=${month}&year=${year}`);
  };

  const date = new Date(currentYear, currentMonth - 1, 1);
  const monthName = date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--bg-surface)', padding: '8px 16px', borderRadius: 'var(--border-radius-full)', border: '1px solid var(--border-subtle)', margin: '0 auto', width: 'fit-content' }}>
      <button onClick={goToPrevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>◀</button>
      <span style={{ fontWeight: 600, minWidth: '150px', textAlign: 'center', textTransform: 'capitalize' }}>
        {monthName}
      </span>
      <button onClick={goToNextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>▶</button>
    </div>
  );
}
