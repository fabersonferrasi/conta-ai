"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/Button/Button';
import { CreditCardModal } from '../../components/cards/CreditCardModal';
import { deleteCreditCard } from '../../lib/card-actions';
import { payInvoice, adjustInvoice, createReversal } from '../../lib/invoice-actions';
import { getBrandById, brandBadgeStyle } from '../../lib/bank-brands';
import { Modal } from '../../components/ui/Modal/Modal';
import { ConfirmDialog, AlertDialog } from '../../components/ui/ConfirmDialog/ConfirmDialog';
import { 
  CreditCard, Plus, CalendarClock, Shield, DollarSign, 
  MoreVertical, CheckCircle2, Clock, AlertTriangle, XCircle 
} from 'lucide-react';

type InvoiceFilter = 'ALL' | 'OPEN' | 'CLOSED' | 'PAID';

export function CardClientPage({ initialCards, invoiceSummaries, currentYear, currentMonth }: { 
  initialCards: any[], 
  invoiceSummaries: any,
  currentYear: number,
  currentMonth: number 
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<InvoiceFilter>('ALL');
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [adjustModal, setAdjustModal] = useState<{ cardId: string; type: 'adjust' | 'reversal' } | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustDesc, setAdjustDesc] = useState('');
  const router = useRouter();

  // Diálogos estilizados
  const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; action: () => Promise<void> } | null>(null);
  const [alertInfo, setAlertInfo] = useState<{ title: string; message: string; variant: 'success' | 'danger' | 'info' } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCreate = () => { setSelectedCard(null); setIsModalOpen(true); };
  const handleEdit = (card: any) => { setSelectedCard(card); setIsModalOpen(true); };

  const handleDelete = (id: string, name: string) => {
    setConfirmAction({
      title: 'Excluir cartão',
      message: `Tem certeza que deseja excluir o cartão "${name}"? Esta ação não pode ser desfeita.`,
      action: async () => {
        setLoadingId(id);
        try { await deleteCreditCard(id); setAlertInfo({ title: 'Cartão excluído', message: `"${name}" foi removido com sucesso.`, variant: 'success' }); }
        catch (err: any) { setAlertInfo({ title: 'Erro', message: err.message, variant: 'danger' }); }
        finally { setLoadingId(null); }
      }
    });
  };

  const handlePayInvoice = (cardId: string, cardName?: string) => {
    setConfirmAction({
      title: 'Pagar fatura',
      message: `Confirma o pagamento integral da fatura do cartão ${cardName || ''}?`,
      action: async () => {
        setLoadingId(cardId);
        try { await payInvoice(cardId, currentYear, currentMonth); setAlertInfo({ title: 'Fatura paga!', message: 'Todas as transações pendentes foram quitadas.', variant: 'success' }); }
        catch (err: any) { setAlertInfo({ title: 'Erro', message: err.message, variant: 'danger' }); }
        finally { setLoadingId(null); }
      }
    });
  };

  const handleAdjustSubmit = async () => {
    if (!adjustModal) return;
    setIsProcessing(true);
    try {
      if (adjustModal.type === 'adjust') {
        await adjustInvoice(adjustModal.cardId, parseFloat(adjustAmount.replace(',', '.')), adjustDesc, currentYear, currentMonth);
      } else {
        await createReversal(adjustModal.cardId, parseFloat(adjustAmount.replace(',', '.')), adjustDesc, currentYear, currentMonth);
      }
      setAdjustModal(null); setAdjustAmount(''); setAdjustDesc('');
      setAlertInfo({ title: 'Sucesso', message: adjustModal.type === 'adjust' ? 'Fatura ajustada!' : 'Estorno lançado!', variant: 'success' });
    } catch (err: any) { setAlertInfo({ title: 'Erro', message: err.message, variant: 'danger' }); }
    finally { setIsProcessing(false); }
  };

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'PAID': return { label: 'Fatura paga', color: '#10b981', icon: <CheckCircle2 size={16} />, bg: '#10b98118' };
      case 'CLOSED': return { label: 'Fatura fechada', color: '#f59e0b', icon: <Clock size={16} />, bg: '#f59e0b18' };
      case 'OVERDUE': return { label: 'Fatura vencida', color: '#ef4444', icon: <AlertTriangle size={16} />, bg: '#ef444418' };
      default: return { label: 'Fatura aberta', color: '#3b82f6', icon: <Shield size={16} />, bg: '#3b82f618' };
    }
  };

  const filteredSummaries = invoiceSummaries?.cards?.filter((s: any) => {
    if (filter === 'ALL') return true;
    if (filter === 'OPEN') return s.invoiceStatus === 'OPEN';
    if (filter === 'CLOSED') return s.invoiceStatus === 'CLOSED' || s.invoiceStatus === 'OVERDUE';
    if (filter === 'PAID') return s.invoiceStatus === 'PAID';
    return true;
  }) || [];

  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  return (
    <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
      {/* COLUNA PRINCIPAL */}
      <div style={{ flex: '1 1 600px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* HEADER COM FILTROS */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-surface-hover)', padding: '4px', borderRadius: '24px' }}>
            {(['ALL', 'OPEN', 'CLOSED', 'PAID'] as InvoiceFilter[]).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                border: 'none', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500,
                background: filter === f ? 'var(--accent-primary)' : 'transparent',
                color: filter === f ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.2s',
              }}>
                {f === 'ALL' ? 'Todas' : f === 'OPEN' ? 'Abertas' : f === 'CLOSED' ? 'Fechadas' : 'Pagas'}
              </button>
            ))}
          </div>
          <Button variant="primary" onClick={handleCreate} style={{ backgroundColor: '#8b5cf6' }}>
            <Plus size={16} /> Novo Cartão
          </Button>
        </div>

        {/* GRID DE CARTÕES */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          
          {/* Card para adicionar */}
          <button onClick={handleCreate} style={{
            background: 'var(--bg-surface)', border: '2px dashed var(--border-subtle)', borderRadius: '16px',
            padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: '12px', cursor: 'pointer', color: 'var(--accent-primary)', transition: 'all 0.2s', minHeight: '240px'
          }}
          onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
          onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
          >
            <Plus size={40} strokeWidth={1.5} />
            <span style={{ fontWeight: 500 }}>Novo cartão de crédito</span>
          </button>

          {filteredSummaries.map((summary: any) => {
            const brand = getBrandById(summary.card.icon);
            const statusCfg = getStatusConfig(summary.invoiceStatus);
            const usagePercent = Math.min(summary.usagePercent, 100);

            return (
              <div key={summary.card.id} style={{
                background: 'var(--bg-surface)', borderRadius: '16px', padding: '24px',
                border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '16px',
                position: 'relative', transition: 'box-shadow 0.2s',
              }}
              onMouseOver={e => e.currentTarget.style.boxShadow = 'var(--shadow-lg)'}
              onMouseOut={e => e.currentTarget.style.boxShadow = 'none'}
              >
                {/* Header: Brand + Menu */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ ...brandBadgeStyle(brand, 32), fontSize: '0.5rem' }}>{brand.abbr}</span>
                    <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer' }}
                      onClick={() => router.push(`/cards/${summary.card.id}?month=${currentMonth}&year=${currentYear}`)}
                      onMouseOver={e => e.currentTarget.style.textDecoration = 'underline'}
                      onMouseOut={e => e.currentTarget.style.textDecoration = 'none'}
                    >
                      {summary.card.name}
                    </span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <button onClick={() => setActionMenuId(actionMenuId === summary.card.id ? null : summary.card.id)} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '4px' }}>
                      <MoreVertical size={18} />
                    </button>
                    {actionMenuId === summary.card.id && (
                      <div style={{
                        position: 'absolute', right: 0, top: '100%', zIndex: 99, minWidth: '200px',
                        background: 'var(--bg-surface)', borderRadius: '12px', boxShadow: 'var(--shadow-lg)',
                        border: '1px solid var(--border-subtle)', padding: '8px', display: 'flex', flexDirection: 'column',
                      }}>
                        {[
                          { label: 'Pagar adiantado', action: () => { handlePayInvoice(summary.card.id, summary.card.name); setActionMenuId(null); } },
                          { label: 'Lançar estorno', action: () => { setAdjustModal({ cardId: summary.card.id, type: 'reversal' }); setActionMenuId(null); }},
                          { label: 'Ajustar fatura', action: () => { setAdjustModal({ cardId: summary.card.id, type: 'adjust' }); setActionMenuId(null); }},
                          { label: 'Editar cartão', action: () => { handleEdit(summary.card); setActionMenuId(null); }},
                          { label: 'Excluir cartão', action: () => { handleDelete(summary.card.id, summary.card.name); setActionMenuId(null); }},
                        ].map(item => (
                          <button key={item.label} onClick={item.action} style={{
                            background: 'none', border: 'none', padding: '10px 12px', textAlign: 'left', cursor: 'pointer',
                            borderRadius: '6px', fontSize: '0.85rem', color: item.label.includes('Excluir') ? '#ef4444' : 'var(--text-primary)',
                          }}
                          onMouseOver={e => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                          onMouseOut={e => e.currentTarget.style.background = 'none'}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Status da fatura */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: statusCfg.color, fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                    {statusCfg.icon} {statusCfg.label}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {summary.invoiceStatus === 'PAID' ? 'Valor pago' : 'Valor total'}
                    </span>
                    <span style={{ fontSize: '1.3rem', fontWeight: 700, color: statusCfg.color }}>
                      R$ {summary.totalInvoice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {summary.invoiceStatus === 'PAID' ? (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                      Data do pagamento: {new Date().toLocaleDateString('pt-BR')}
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                      Vence em: {new Date(summary.dueDate).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>

                {/* Barra de uso do limite */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                    <span>R$ {summary.usedLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de R$ {summary.card.limit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <span>{usagePercent.toFixed(1)}%</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg-surface-hover)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: '4px', transition: 'width 0.5s ease',
                      width: `${usagePercent}%`,
                      background: usagePercent > 80 ? '#ef4444' : usagePercent > 50 ? '#f59e0b' : brand.color,
                    }} />
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '4px', display: 'block' }}>
                    Limite Disponível: R$ {summary.availableLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Ação principal */}
                <button onClick={() => {
                  if (summary.invoiceStatus === 'PAID') return;
                  handlePayInvoice(summary.card.id);
                }} style={{
                  background: 'none', border: 'none', cursor: summary.invoiceStatus === 'PAID' ? 'default' : 'pointer',
                  color: summary.invoiceStatus === 'PAID' ? '#10b981' : brand.color,
                  fontWeight: 700, fontSize: '0.85rem', textAlign: 'center', padding: '8px',
                  borderTop: '1px solid var(--border-subtle)', marginTop: '4px',
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                }}>
                  {summary.invoiceStatus === 'PAID' ? 'FATURA PAGA' : 'PAGAR FATURA'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* SIDEBAR RESUMO */}
      <div style={{ flex: '0 0 280px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {invoiceSummaries?.nextDueDate && (
          <div style={{ background: 'var(--bg-surface)', borderRadius: '16px', padding: '20px', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Sua próxima fatura vence em</span>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {new Date(invoiceSummaries.nextDueDate).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
              <CalendarClock size={28} color="var(--accent-primary)" />
            </div>
          </div>
        )}

        <div style={{ background: 'var(--bg-surface)', borderRadius: '16px', padding: '20px', border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Limite Disponível</span>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#10b981', marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            R$ {(invoiceSummaries?.totalAvailable || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            <Shield size={28} color="#10b981" />
          </div>
        </div>

        <div style={{ background: 'var(--bg-surface)', borderRadius: '16px', padding: '20px', border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Valor total faturas</span>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#ef4444', marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            R$ {(invoiceSummaries?.totalUsed || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            <DollarSign size={28} color="#ef4444" />
          </div>
        </div>
      </div>

      {/* MODAIS */}
      <CreditCardModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} card={selectedCard} />

      {adjustModal && (
        <Modal isOpen={true} onClose={() => { setAdjustModal(null); setAdjustAmount(''); setAdjustDesc(''); }}
          title={adjustModal.type === 'adjust' ? 'Ajustar Fatura' : 'Lançar Estorno'}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '300px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Valor (R$)</label>
              <input type="number" step="0.01" value={adjustAmount} onChange={e => setAdjustAmount(e.target.value)} required
                style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', fontSize: '1rem' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Descrição</label>
              <input type="text" value={adjustDesc} onChange={e => setAdjustDesc(e.target.value)}
                placeholder={adjustModal.type === 'adjust' ? 'Motivo do ajuste' : 'Motivo do estorno'}
                style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', fontSize: '1rem' }} />
            </div>
            <Button variant="primary" onClick={handleAdjustSubmit}>
              {adjustModal.type === 'adjust' ? 'Aplicar Ajuste' : 'Lançar Estorno'}
            </Button>
          </div>
        </Modal>
      )}

      {/* Diálogo de confirmação estilizado */}
      {confirmAction && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setConfirmAction(null)}
          onConfirm={async () => { await confirmAction.action(); setConfirmAction(null); }}
          title={confirmAction.title}
          message={confirmAction.message}
          variant={confirmAction.title.includes('Excluir') ? 'danger' : 'confirm'}
          isLoading={isProcessing}
        />
      )}

      {/* Alerta estilizado */}
      {alertInfo && (
        <AlertDialog
          isOpen={true}
          onClose={() => setAlertInfo(null)}
          title={alertInfo.title}
          message={alertInfo.message}
          variant={alertInfo.variant}
        />
      )}
    </div>
  );
}
