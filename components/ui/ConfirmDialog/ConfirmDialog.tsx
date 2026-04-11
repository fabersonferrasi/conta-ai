"use client";

import React from 'react';
import { Modal } from '../Modal/Modal';
import { Button } from '../Button/Button';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';

type DialogVariant = 'confirm' | 'danger' | 'info' | 'success';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: DialogVariant;
  isLoading?: boolean;
}

export function ConfirmDialog({ 
  isOpen, onClose, onConfirm, title, message, 
  confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', 
  variant = 'confirm', isLoading = false 
}: ConfirmDialogProps) {
  
  const config = {
    confirm: { icon: <Info size={40} />, color: 'var(--accent-primary)', bg: 'rgba(37,99,235,0.1)' },
    danger:  { icon: <AlertTriangle size={40} />, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    info:    { icon: <Info size={40} />, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    success: { icon: <CheckCircle2 size={40} />, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  }[variant];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '8px 16px', minWidth: '340px', maxWidth: '420px', textAlign: 'center' }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%', background: config.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: config.color,
        }}>
          {config.icon}
        </div>

        <div>
          <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
          <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{message}</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '8px' }}>
          <Button 
            variant="secondary" 
            onClick={onClose} 
            disabled={isLoading}
            style={{ flex: 1, padding: '12px' }}
          >
            {cancelLabel}
          </Button>
          <Button 
            variant="primary" 
            onClick={onConfirm} 
            disabled={isLoading}
            style={{ flex: 1, padding: '12px', background: config.color }}
          >
            {isLoading ? 'Processando...' : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// Componente de alerta simples (substitui window.alert)
interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  variant?: DialogVariant;
}

export function AlertDialog({ isOpen, onClose, title, message, variant = 'info' }: AlertDialogProps) {
  const config = {
    confirm: { icon: <Info size={40} />, color: 'var(--accent-primary)', bg: 'rgba(37,99,235,0.1)' },
    danger:  { icon: <XCircle size={40} />, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    info:    { icon: <Info size={40} />, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    success: { icon: <CheckCircle2 size={40} />, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  }[variant];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '8px 16px', minWidth: '320px', maxWidth: '400px', textAlign: 'center' }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%', background: config.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: config.color,
        }}>
          {config.icon}
        </div>
        <div>
          <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
          <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{message}</p>
        </div>
        <Button variant="primary" onClick={onClose} style={{ width: '100%', padding: '12px', background: config.color }}>
          Entendido
        </Button>
      </div>
    </Modal>
  );
}
