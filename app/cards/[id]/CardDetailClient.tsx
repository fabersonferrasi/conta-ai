"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrandById, brandBadgeStyle } from '../../../lib/bank-brands';
import { payInvoice, adjustInvoice, createReversal, reopenInvoice } from '../../../lib/invoice-actions';
import { Modal } from '../../../components/ui/Modal/Modal';
import { Button } from '../../../components/ui/Button/Button';
import { ConfirmDialog, AlertDialog } from '../../../components/ui/ConfirmDialog/ConfirmDialog';
import { 
  ArrowLeft, ChevronLeft, ChevronRight, MoreVertical, 
  CheckCircle2, Clock, AlertTriangle, Shield, LockOpen
} from 'lucide-react';

export function CardDetailClient({ invoice, currentYear, currentMonth }: { invoice: any; currentYear: number; currentMonth: number }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [adjustModal, setAdjustModal] = useState(false);
  const [reversalModal, setReversalModal] = useState(false);
  const [adjustRealValue, setAdjustRealValue] = useState('');
  const [reversalAmount, setReversalAmount] = useState('');
  const [reversalDesc, setReversalDesc] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; action: () => Promise<void>, variant?: 'confirm' | 'danger' } | null>(null);
  const [alertInfo, setAlertInfo] = useState<{ title: string; message: string; variant: 'success' | 'danger' | 'info' } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const brand = getBrandById(invoice.card.icon);
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const isOpen = invoice.invoiceStatus === 'OPEN';
  const isPaidOrClosed = invoice.invoiceStatus === 'PAID' || invoice.invoiceStatus === 'CLOSED';

  const navigateMonth = (delta: number) => {
    let m = currentMonth + delta;
    let y = currentYear;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    router.push(`/cards/${invoice.card.id}?month=${m}&year=${y}`);
  };

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'PAID': return { label: 'Fatura paga', color: '#10b981', icon: <CheckCircle2 size={18} /> };
      case 'CLOSED': return { label: 'Fatura fechada', color: '#f59e0b', icon: <Clock size={18} /> };
      case 'OVERDUE': return { label: 'Fatura vencida', color: '#ef4444', icon: <AlertTriangle size={18} /> };
      default: return { label: 'Fatura aberta', color: '#3b82f6', icon: <Shield size={18} /> };
    }
  };
  const statusCfg = getStatusConfig(invoice.invoiceStatus);

  // === AÇÕES ===

  const requestPay = () => {
    setConfirmAction({
      title: 'Pagar fatura',
      message: `Confirma o pagamento integral da fatura de R$ ${invoice.totalInvoice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} do cartão ${invoice.card.name}?`,
      action: async () => {
        setIsProcessing(true);
        try {
          await payInvoice(invoice.card.id, currentYear, currentMonth);
          setAlertInfo({ title: 'Fatura paga!', message: 'Todas as transações foram quitadas.', variant: 'success' });
          router.refresh();
        } catch (err: any) { setAlertInfo({ title: 'Erro', message: err.message, variant: 'danger' }); }
        finally { setIsProcessing(false); }
      }
    });
  };

  const requestReopen = () => {
    setConfirmAction({
      title: 'Reabrir fatura',
      message: `Deseja reabrir a fatura de ${monthNames[currentMonth - 1]} ${currentYear}? Todas as transações voltarão ao status "Pendente" para permitir ajustes e correções.`,
      variant: 'danger',
      action: async () => {
        setIsProcessing(true);
        try {
          await reopenInvoice(invoice.card.id, currentYear, currentMonth);
          setAlertInfo({ title: 'Fatura reaberta!', message: 'Agora é possível realizar ajustes, estornos e correções.', variant: 'success' });
          router.refresh();
        } catch (err: any) { setAlertInfo({ title: 'Erro', message: err.message, variant: 'danger' }); }
        finally { setIsProcessing(false); }
      }
    });
  };

  const tryOpenAdjust = () => {
    if (!isOpen) {
      setAlertInfo({ title: 'Fatura não está aberta', message: 'Somente faturas com status "Aberta" podem ser ajustadas. Reabra a fatura primeiro.', variant: 'danger' });
      return;
    }
    setAdjustModal(true);
  };

  const tryOpenReversal = () => {
    if (!isOpen) {
      setAlertInfo({ title: 'Fatura não está aberta', message: 'Somente faturas com status "Aberta" permitem estornos. Reabra a fatura primeiro.', variant: 'danger' });
      return;
    }
    setReversalModal(true);
  };

  const handleAdjustSubmit = async () => {
    const realValue = parseFloat(adjustRealValue.replace(',', '.'));
    if (isNaN(realValue) || realValue < 0) {
      setAlertInfo({ title: 'Valor inválido', message: 'Informe o valor real correto da fatura.', variant: 'danger' });
      return;
    }
    const difference = realValue - invoice.totalInvoice;
    if (Math.abs(difference) < 0.01) {
      setAdjustModal(false);
      setAlertInfo({ title: 'Sem diferença', message: 'O valor informado já é igual ao valor atual da fatura.', variant: 'info' });
      return;
    }
    setIsProcessing(true);
    try {
      const desc = difference > 0 
        ? `Ajuste de fatura (+R$ ${difference.toFixed(2)})` 
        : `Ajuste de fatura (-R$ ${Math.abs(difference).toFixed(2)})`;
      await adjustInvoice(invoice.card.id, difference, desc, currentYear, currentMonth);
      setAdjustModal(false); setAdjustRealValue('');
      setAlertInfo({ title: 'Fatura ajustada!', message: `Diferença de R$ ${Math.abs(difference).toFixed(2)} ${difference > 0 ? 'adicionada' : 'removida'}.`, variant: 'success' });
      router.refresh();
    } catch (err: any) { setAlertInfo({ title: 'Erro', message: err.message, variant: 'danger' }); }
    finally { setIsProcessing(false); }
  };

  const handleReversalSubmit = async () => {
    const amount = parseFloat(reversalAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      setAlertInfo({ title: 'Valor inválido', message: 'Informe um valor positivo para o estorno.', variant: 'danger' });
      return;
    }
    setIsProcessing(true);
    try {
      await createReversal(invoice.card.id, amount, reversalDesc || 'Estorno', currentYear, currentMonth);
      setReversalModal(false); setReversalAmount(''); setReversalDesc('');
      setAlertInfo({ title: 'Estorno lançado!', message: `R$ ${amount.toFixed(2)} estornados com sucesso.`, variant: 'success' });
      router.refresh();
    } catch (err: any) { setAlertInfo({ title: 'Erro', message: err.message, variant: 'danger' }); }
    finally { setIsProcessing(false); }
  };

  return (
    <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
      
      {/* COLUNA PRINCIPAL */}
      <div style={{ flex: '1 1 600px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <button onClick={() => router.push('/cards')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={22} />
          </button>
          <div style={{ background: brand.color, color: brand.textColor || '#fff', padding: '8px 20px', borderRadius: '24px', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ ...brandBadgeStyle(brand, 24), background: 'rgba(255,255,255,0.25)', fontSize: '0.4rem' }}>{brand.abbr}</span>
            Cartão: {invoice.card.name}
          </div>
          <div style={{ marginLeft: 'auto', position: 'relative' }}>
            <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '8px' }}>
              <MoreVertical size={20} />
            </button>
            {menuOpen && (
              <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 99, minWidth: '220px', background: 'var(--bg-surface)', borderRadius: '12px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-subtle)', padding: '8px', display: 'flex', flexDirection: 'column' }}>
                {[
                  ...(invoice.invoiceStatus !== 'PAID' ? [{ label: 'Pagar fatura', action: () => { requestPay(); setMenuOpen(false); } }] : []),
                  ...(isPaidOrClosed ? [{ label: '🔓 Reabrir fatura', action: () => { requestReopen(); setMenuOpen(false); } }] : []),
                  { label: 'Lançar estorno', action: () => { tryOpenReversal(); setMenuOpen(false); } },
                  { label: 'Ajustar fatura', action: () => { tryOpenAdjust(); setMenuOpen(false); } },
                  { label: 'Exportar para CSV', action: () => { exportCSV(); setMenuOpen(false); } },
                ].map(item => (
                  <button key={item.label} onClick={item.action} style={{ background: 'none', border: 'none', padding: '10px 12px', textAlign: 'left', cursor: 'pointer', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--text-primary)' }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--bg-surface-hover)'} onMouseOut={e => e.currentTarget.style.background = 'none'}>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Navegação de mês */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <button onClick={() => navigateMonth(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><ChevronLeft size={22} /></button>
          <span style={{ padding: '8px 20px', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontWeight: 600, fontSize: '0.95rem' }}>
            {monthNames[currentMonth - 1]} {currentYear}
          </span>
          <button onClick={() => navigateMonth(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><ChevronRight size={22} /></button>
        </div>

        {/* Aviso de fatura não aberta */}
        {!isOpen && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', borderRadius: '12px',
            background: invoice.invoiceStatus === 'PAID' ? '#10b98115' : '#f59e0b15',
            border: `1px solid ${invoice.invoiceStatus === 'PAID' ? '#10b98133' : '#f59e0b33'}`,
            color: invoice.invoiceStatus === 'PAID' ? '#10b981' : '#f59e0b',
            fontSize: '0.9rem', fontWeight: 500,
          }}>
            {statusCfg.icon}
            <span>{statusCfg.label}. Para realizar ajustes ou estornos, reabra a fatura primeiro.</span>
            <button onClick={requestReopen} style={{
              marginLeft: 'auto', background: 'none', border: '1px solid currentColor', padding: '6px 14px',
              borderRadius: '8px', cursor: 'pointer', color: 'inherit', fontWeight: 600, fontSize: '0.8rem',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <LockOpen size={14} /> Reabrir
            </button>
          </div>
        )}

        {/* Tabela */}
        <div style={{ background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {['Situação', 'Data', 'Descrição', 'Categoria', 'Valor'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: h === 'Valor' ? 'right' : 'left', fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoice.transactions.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-tertiary)' }}>Nenhuma transação neste período.</td></tr>
              ) : (
                invoice.transactions.map((tx: any) => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s' }}
                    onMouseOver={e => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '14px 16px' }}>
                      {tx.status === 'COMPLETED' ? <CheckCircle2 size={20} color="#10b981" /> : <Clock size={20} color="#f59e0b" />}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {new Date(tx.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{tx.description}</span>
                      {tx.totalInstallments && tx.totalInstallments > 1 && (
                        <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: brand.color, fontWeight: 600, background: `${brand.color}15`, padding: '2px 8px', borderRadius: '12px' }}>
                          {tx.installmentNum}/{tx.totalInstallments}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {tx.category ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: tx.category.color || '#6b7280', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>
                            {tx.category.icon || '📋'}
                          </span>
                          {tx.category.name}
                        </span>
                      ) : '-'}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 600, color: tx.type === 'INCOME' ? '#10b981' : '#ef4444' }}>
                      {tx.type === 'INCOME' ? '+' : '-'} R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SIDEBAR */}
      <div style={{ flex: '0 0 280px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ background: 'var(--bg-surface)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Valor da fatura</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
              R$ {invoice.totalInvoice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Status</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', color: statusCfg.color, fontWeight: 600, fontSize: '1.1rem' }}>
              {statusCfg.icon} {statusCfg.label}
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Dia de fechamento</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
              {new Date(invoice.closingDate).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Data vencimento</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
              {new Date(invoice.dueDate).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
            </div>
          </div>

          {/* Botão contextual */}
          {invoice.invoiceStatus === 'PAID' ? (
            <button onClick={requestReopen} style={{
              width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-subtle)', cursor: 'pointer',
              background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px',
            }}>
              <LockOpen size={16} /> REABRIR FATURA
            </button>
          ) : (
            <button onClick={requestPay} style={{
              width: '100%', padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              background: brand.color, color: brand.textColor || '#fff', fontWeight: 700, fontSize: '0.95rem', marginTop: '8px',
            }}>
              PAGAR FATURA
            </button>
          )}
        </div>
      </div>

      {/* DIÁLOGOS */}
      {confirmAction && (
        <ConfirmDialog isOpen={true} onClose={() => setConfirmAction(null)}
          onConfirm={async () => { await confirmAction.action(); setConfirmAction(null); }}
          title={confirmAction.title} message={confirmAction.message}
          variant={confirmAction.variant || 'confirm'} isLoading={isProcessing}
        />
      )}

      {alertInfo && (
        <AlertDialog isOpen={true} onClose={() => setAlertInfo(null)} title={alertInfo.title} message={alertInfo.message} variant={alertInfo.variant} />
      )}

      {/* Ajustar fatura */}
      {adjustModal && (
        <Modal isOpen={true} onClose={() => { setAdjustModal(false); setAdjustRealValue(''); }} title="Ajustar Fatura">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: '360px' }}>
            <div style={{ background: 'var(--bg-surface-hover)', padding: '16px', borderRadius: '12px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Valor atual da fatura ({monthNames[currentMonth-1]}/{currentYear})</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                R$ {invoice.totalInvoice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Informe o valor correto/real da fatura (R$)</label>
              <input type="text" value={adjustRealValue} onChange={e => setAdjustRealValue(e.target.value)} placeholder="Ex: 2500.00"
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '1.2rem', fontWeight: 600 }} />
            </div>
            {adjustRealValue && (() => {
              const realVal = parseFloat(adjustRealValue.replace(',', '.'));
              if (isNaN(realVal)) return null;
              const diff = realVal - invoice.totalInvoice;
              if (Math.abs(diff) < 0.01) return (
                <div style={{ padding: '12px', borderRadius: '8px', background: '#3b82f618', color: '#3b82f6', fontSize: '0.9rem', textAlign: 'center' }}>Sem diferença.</div>
              );
              return (
                <div style={{ padding: '12px', borderRadius: '8px', background: diff > 0 ? '#ef444418' : '#10b98118', fontSize: '0.9rem', textAlign: 'center' }}>
                  <span style={{ color: diff > 0 ? '#ef4444' : '#10b981', fontWeight: 600 }}>Diferença: {diff > 0 ? '+' : ''}R$ {diff.toFixed(2)}</span>
                  <span style={{ display: 'block', color: 'var(--text-tertiary)', fontSize: '0.8rem', marginTop: '4px' }}>
                    {diff > 0 ? 'Será adicionada despesa de ajuste' : 'Será lançado crédito de ajuste'} na fatura de {monthNames[currentMonth-1]}
                  </span>
                </div>
              );
            })()}
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button variant="secondary" onClick={() => { setAdjustModal(false); setAdjustRealValue(''); }} style={{ flex: 1 }}>Cancelar</Button>
              <Button variant="primary" onClick={handleAdjustSubmit} disabled={isProcessing} style={{ flex: 1 }}>
                {isProcessing ? 'Processando...' : 'Aplicar Ajuste'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Estorno */}
      {reversalModal && (
        <Modal isOpen={true} onClose={() => { setReversalModal(false); setReversalAmount(''); setReversalDesc(''); }} title="Lançar Estorno">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '340px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Valor do estorno (R$)</label>
              <input type="text" value={reversalAmount} onChange={e => setReversalAmount(e.target.value)} placeholder="150.00"
                style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', fontSize: '1rem' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Descrição</label>
              <input type="text" value={reversalDesc} onChange={e => setReversalDesc(e.target.value)} placeholder="Motivo do estorno"
                style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', fontSize: '1rem' }} />
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>O estorno será lançado na fatura de {monthNames[currentMonth-1]} {currentYear}.</span>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button variant="secondary" onClick={() => { setReversalModal(false); setReversalAmount(''); setReversalDesc(''); }} style={{ flex: 1 }}>Cancelar</Button>
              <Button variant="primary" onClick={handleReversalSubmit} disabled={isProcessing} style={{ flex: 1 }}>
                {isProcessing ? 'Processando...' : 'Lançar Estorno'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );

  function exportCSV() {
    const rows = [['Data', 'Descrição', 'Categoria', 'Valor', 'Tipo', 'Status']];
    for (const tx of invoice.transactions) {
      rows.push([new Date(tx.date).toLocaleDateString('pt-BR'), tx.description, tx.category?.name || '', tx.amount.toFixed(2), tx.type, tx.status === 'COMPLETED' ? 'Pago' : 'Pendente']);
    }
    const csv = rows.map(r => r.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `fatura_${invoice.card.name}_${currentMonth}_${currentYear}.csv`; a.click();
  }
}
