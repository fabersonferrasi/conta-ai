"use client";

import React from 'react';

interface BreakdownItem {
  score: number;
  max: number;
  label: string;
  detail: string;
}

interface HealthScoreData {
  score: number;
  level: string;
  tips: string[];
  breakdown: Record<string, BreakdownItem>;
}

export function FinancialHealthScore({ data }: { data: HealthScoreData }) {
  const { score, level, tips, breakdown } = data;

  const getScoreColor = (s: number) => {
    if (s >= 85) return '#10b981';
    if (s >= 70) return '#34d399';
    if (s >= 50) return '#f59e0b';
    if (s >= 30) return '#f97316';
    return '#ef4444';
  };

  const color = getScoreColor(score);
  const circumference = 2 * Math.PI * 58;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div style={{
      background: 'var(--bg-surface)',
      borderRadius: 'var(--border-radius-lg)',
      padding: '28px',
      border: '1px solid var(--border-subtle)',
      boxShadow: 'var(--shadow-md)',
    }}>
      <h3 style={{ 
        fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', 
        marginBottom: '24px', fontFamily: 'var(--font-heading)',
        display: 'flex', alignItems: 'center', gap: '8px'
      }}>
        🏥 Saúde Financeira
      </h3>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', alignItems: 'center' }}>
        {/* Gauge SVG */}
        <div style={{ position: 'relative', width: '140px', height: '140px', flexShrink: 0 }}>
          <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="70" cy="70" r="58" fill="none" stroke="var(--bg-surface-hover)" strokeWidth="10" />
            <circle
              cx="70" cy="70" r="58" fill="none"
              stroke={color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 1s ease-out, stroke 0.5s ease' }}
            />
          </svg>
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color, lineHeight: 1 }}>
              {score}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 500, marginTop: '2px' }}>
              {level}
            </div>
          </div>
        </div>

        {/* Breakdown Bars */}
        <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {Object.values(breakdown).map((item) => (
            <div key={item.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  {item.label}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                  {item.score}/{item.max} • {item.detail}
                </span>
              </div>
              <div style={{
                width: '100%', height: '6px', background: 'var(--bg-surface-hover)',
                borderRadius: '3px', overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${(item.score / item.max) * 100}%`,
                  background: getScoreColor((item.score / item.max) * 100),
                  borderRadius: '3px',
                  transition: 'width 0.8s ease-out',
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div style={{
        marginTop: '24px', padding: '16px', borderRadius: '12px',
        background: `${color}10`, border: `1px solid ${color}30`,
      }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color, marginBottom: '8px' }}>
          💡 Dicas do Especialista
        </div>
        <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {tips.map((tip, i) => (
            <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{tip}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
