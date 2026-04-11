"use client";

import React from 'react';
import { ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function CashflowChart({ data }: { data: any[] }) {
  return (
    <div style={{ width: '100%', height: '350px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
        >
          <defs>
            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--accent-success)" stopOpacity={0.6}/>
              <stop offset="95%" stopColor="var(--accent-success)" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--accent-danger)" stopOpacity={0.6}/>
              <stop offset="95%" stopColor="var(--accent-danger)" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" opacity={0.5} />
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} dx={-10} tickFormatter={(val) => `R$ ${val}`} />
          <Tooltip 
             contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', border: '1px solid var(--border-subtle)', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
             itemStyle={{ fontWeight: 600 }}
             labelStyle={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}
             formatter={(value: number, name: string) => {
               if (name === 'income') return [`+ R$ ${value.toFixed(2)}`, 'Entradas'];
               if (name === 'expense') return [`- R$ ${value.toFixed(2)}`, 'Saídas'];
               return [`R$ ${value.toFixed(2)}`, 'Saldo Projetado'];
             }}
             labelFormatter={(label) => `Dia ${label}`}
          />
          <Bar dataKey="income" name="income" fill="url(#colorIncome)" barSize={10} radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" name="expense" fill="url(#colorExpense)" barSize={10} radius={[4, 4, 0, 0]} />
          <Area type="monotone" dataKey="balance" name="balance" stroke="var(--accent-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
