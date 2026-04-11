"use client";

import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal/Modal';
import { Button } from '../ui/Button/Button';
import { saveUnifiedTransaction } from '../../lib/advanced-transaction-actions';
import { TransactionFlowType } from '../ui/GlobalFAB';
import { Calculator } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  flowType: TransactionFlowType;
  accounts: any[];
  categories: any[];
  cards: any[];
}

export function UnifiedTransactionModal({ isOpen, onClose, flowType, accounts, categories, cards }: Props) {
  const [amountStr, setAmountStr] = useState('');
  const [isCalculated, setIsCalculated] = useState(false);
  const [dateShortcut, setDateShortcut] = useState<'HOJE' | 'ONTEM' | 'OUTROS'>('HOJE');
  const [customDate, setCustomDate] = useState('');
  
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [creditCardId, setCreditCardId] = useState('');
  const [destinationAccountId, setDestinationAccountId] = useState('');
  
  const [tags, setTags] = useState('');
  const [observation, setObservation] = useState('');
  
  const [isFixed, setIsFixed] = useState(false);
  const [isRepeated, setIsRepeated] = useState(false);
  const [repeatFrequency, setRepeatFrequency] = useState('MONTHS');
  const [repeatCount, setRepeatCount] = useState('2');
  
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentCount, setInstallmentCount] = useState('2');

  const [status, setStatus] = useState(true); // Pago / Recebido

  const [isLoading, setIsLoading] = useState(false);

  // Evaluate Calculator Expr
  const handleAmountBlur = () => {
    try {
      if (!amountStr) return;
      // Expressão simples e segura para evitar eval perigosos
      const sanitized = amountStr.replace(/[^0-9+\-*/.]/g, '');
      const evaluated = new Function('return ' + sanitized)();
      const num = parseFloat(evaluated);
      if (!isNaN(num)) {
         setAmountStr(num.toFixed(2));
         setIsCalculated(true);
      }
    } catch(e) {
      // Ignorar erros silentes
    }
  };

  const getTitle = () => {
    switch(flowType) {
      case 'EXPENSE': return 'Nova Despesa';
      case 'INCOME': return 'Nova Receita';
      case 'CARD_EXPENSE': return 'Nova Despesa Cartão';
      case 'TRANSFER': return 'Nova Transferência';
      default: return '';
    }
  };

  const getColor = () => {
    switch(flowType) {
      case 'EXPENSE': return '#ef4444';
      case 'INCOME': return '#10b981';
      case 'CARD_EXPENSE': return '#8b5cf6';
      case 'TRANSFER': return '#3b82f6';
      default: return '#2563eb';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const targetDate = new Date();
    if (dateShortcut === 'ONTEM') {
      targetDate.setDate(targetDate.getDate() - 1);
    } else if (dateShortcut === 'OUTROS' && customDate) {
      const parts = customDate.split('-');
      targetDate.setFullYear(parseInt(parts[0]));
      targetDate.setMonth(parseInt(parts[1]) - 1);
      targetDate.setDate(parseInt(parts[2]));
    }

    try {
      await saveUnifiedTransaction({
        flowType,
        amount: parseFloat((amountStr || '0').replace(',', '.')),
        date: targetDate,
        description,
        categoryId: categoryId || null,
        accountId: flowType === 'CARD_EXPENSE' ? null : (accountId || accounts[0]?.id),
        creditCardId: flowType === 'CARD_EXPENSE' ? (creditCardId || cards[0]?.id) : null,
        destinationAccountId: flowType === 'TRANSFER' ? destinationAccountId : null,
        tags,
        observation,
        isFixed,
        isRepeated,
        repeatFrequency: isRepeated ? repeatFrequency : null,
        repeatCount: isRepeated ? parseInt(repeatCount) : null,
        isInstallment,
        installmentCount: isInstallment ? parseInt(installmentCount) : null,
        status: status ? 'COMPLETED' : 'PENDING'
      });
      onClose();
    } catch(err) {
      alert("Erro ao salvar: " + err);
    } finally {
       setIsLoading(false);
    }
  };

  if (!flowType) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getTitle()}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: '400px' }}>
        
        {/* CABEÇALHO: VALOR DA TRANSAÇÃO COM CALCULADORA */}
        <div style={{ display: 'flex', flexDirection: 'column', borderBottom: `2px solid ${getColor()}`, paddingBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Calculator size={24} color={isCalculated ? getColor() : 'var(--text-tertiary)'} />
            <span style={{ fontSize: '1.5rem', color: getColor(), fontWeight: 600 }}>R$</span>
            <input 
               type="text" 
               placeholder="0,00 (Tente calcular ex: 10+5)" 
               value={amountStr} 
               onChange={e => { setAmountStr(e.target.value); setIsCalculated(false); }}
               onBlur={handleAmountBlur}
               required
               style={{ background: 'transparent', border: 'none', fontSize: '2rem', outline: 'none', width: '100%', color: getColor(), fontWeight: 600 }}
            />
          </div>
          <span style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '4px' }}>* Deve ter um valor diferente de 0</span>
        </div>

        {/* CONTROLES BASE (PAGO / DATA) */}
        {flowType !== 'TRANSFER' && flowType !== 'CARD_EXPENSE' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
               <input type="checkbox" checked={status} onChange={e => setStatus(e.target.checked)} />
               <span style={{ fontSize: '0.9rem', color: status ? getColor() : 'var(--text-secondary)' }}>
                 {flowType === 'INCOME' ? (status ? 'Foi recebida' : 'Não recebida') : (status ? 'Foi paga' : 'Não foi paga')}
               </span>
            </label>
          </div>
        )}

        {flowType === 'CARD_EXPENSE' && (
          <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#8b5cf615', fontSize: '0.8rem', color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>ℹ️</span>
            <span>Despesas de cartão não possuem status individual. O pagamento é feito pela fatura. A data será cruzada com o fechamento do cartão para definir a fatura correta.</span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
           <span style={{ fontSize: '1.2rem' }}>📅</span>
           <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-surface-hover)', padding: '4px', borderRadius: '24px' }}>
             <button type="button" onClick={() => setDateShortcut('HOJE')} style={{ border: 'none', background: dateShortcut === 'HOJE' ? getColor() : 'transparent', color: dateShortcut === 'HOJE' ? '#fff' : 'var(--text-secondary)', padding: '6px 16px', borderRadius: '16px', cursor: 'pointer' }}>Hoje</button>
             <button type="button" onClick={() => setDateShortcut('ONTEM')} style={{ border: 'none', background: dateShortcut === 'ONTEM' ? getColor() : 'transparent', color: dateShortcut === 'ONTEM' ? '#fff' : 'var(--text-secondary)', padding: '6px 16px', borderRadius: '16px', cursor: 'pointer' }}>Ontem</button>
             <button type="button" onClick={() => setDateShortcut('OUTROS')} style={{ border: 'none', background: dateShortcut === 'OUTROS' ? getColor() : 'transparent', color: dateShortcut === 'OUTROS' ? '#fff' : 'var(--text-secondary)', padding: '6px 16px', borderRadius: '16px', cursor: 'pointer' }}>Outros...</button>
           </div>
           {dateShortcut === 'OUTROS' && (
             <input type="date" value={customDate} onChange={e => setCustomDate(e.target.value)} required style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-subtle)', outline: 'none' }} />
           )}
        </div>

        {/* DESCRIÇÃO E CATEGORIA (EXCETO TRANSFERÊNCIA) */}
        {flowType !== 'TRANSFER' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '1.2rem', color: 'var(--text-tertiary)' }}>📝</span>
              <input type="text" placeholder="Descrição" value={description} onChange={e => setDescription(e.target.value)} required style={{ width: '100%', border: 'none', padding: '12px 0', background: 'transparent', outline: 'none', fontSize: '1rem' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '1.2rem', color: 'var(--text-tertiary)' }}>🏷️</span>
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)} required style={{ width: '100%', border: 'none', padding: '12px 0', background: 'transparent', outline: 'none', fontSize: '1rem', cursor: 'pointer' }}>
                 <option value="" disabled>Selecionar Categoria</option>
                 {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
          </>
        )}

        {/* SELEÇÃO DE FONTES/CONTAS */}
        {(flowType === 'INCOME' || flowType === 'EXPENSE' || flowType === 'TRANSFER') && (
           <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
             <span style={{ fontSize: '1.2rem', color: 'var(--text-tertiary)' }}>🏦</span>
             <select value={accountId} onChange={e => setAccountId(e.target.value)} required style={{ width: '100%', border: 'none', padding: '12px 0', background: 'transparent', outline: 'none', fontSize: '1rem', cursor: 'pointer', appearance: 'none' }}>
                <option value="" disabled>{flowType === 'TRANSFER' ? 'Conta de Origem' : 'Conta'}</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
             </select>
           </div>
        )}

        {flowType === 'CARD_EXPENSE' && (
           <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
             <span style={{ fontSize: '1.2rem', color: 'var(--text-tertiary)' }}>💳</span>
             <select value={creditCardId} onChange={e => setCreditCardId(e.target.value)} required style={{ width: '100%', border: 'none', padding: '12px 0', background: 'transparent', outline: 'none', fontSize: '1rem', cursor: 'pointer' }}>
                <option value="" disabled>Selecionar Cartão de Crédito</option>
                {cards.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
             </select>
           </div>
        )}

        {flowType === 'TRANSFER' && (
           <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
             <span style={{ fontSize: '1.2rem', color: 'var(--text-tertiary)' }}>🔻</span>
             <select value={destinationAccountId} onChange={e => setDestinationAccountId(e.target.value)} required style={{ width: '100%', border: 'none', padding: '12px 0', background: 'transparent', outline: 'none', fontSize: '1rem', cursor: 'pointer' }}>
                <option value="" disabled>Conta de Destino</option>
                {accounts.map(a => <option key={a.id} value={a.id}>👉 {a.name}</option>)}
             </select>
           </div>
        )}


        {/* DETALHES AVANÇADOS (TAGS E REPETIÇÃO) */}
        {flowType !== 'TRANSFER' && (
          <div style={{ background: 'var(--bg-surface-hover)', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <input type="text" placeholder="Tags (ex: férias, lazer)" value={tags} onChange={e => setTags(e.target.value)} style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }} />
              <input type="text" placeholder="Observação..." value={observation} onChange={e => setObservation(e.target.value)} style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{flowType === 'INCOME' ? 'Receita fixa' : 'Despesa fixa'}</span>
              <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                <input type="checkbox" checked={isFixed} onChange={e => { setIsFixed(e.target.checked); if(e.target.checked) { setIsRepeated(false); setIsInstallment(false); } }} style={{ width: '18px', height: '18px' }} />
              </label>
            </div>

            {(flowType === 'INCOME' || flowType === 'EXPENSE') && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Repetir</span>
                  <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input type="checkbox" checked={isRepeated} onChange={e => { setIsRepeated(e.target.checked); if(e.target.checked) { setIsFixed(false); setIsInstallment(false); } }} style={{ width: '18px', height: '18px' }} />
                  </label>
                </div>
                {isRepeated && (
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', opacity: 0.9 }}>
                    <input type="number" value={repeatCount} onChange={e => setRepeatCount(e.target.value)} min="2" max="100" style={{ width: '60px', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }} />
                    <span>vezes</span>
                    <select value={repeatFrequency} onChange={e => setRepeatFrequency(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
                      <option value="DAYS">Dias</option>
                      <option value="WEEKS">Semanas</option>
                      <option value="MONTHS">Meses</option>
                      <option value="YEARS">Anos</option>
                    </select>
                  </div>
                )}
              </>
            )}

            {flowType === 'CARD_EXPENSE' && (
              <>
                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Parcelado</span>
                  <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input type="checkbox" checked={isInstallment} onChange={e => { setIsInstallment(e.target.checked); if(e.target.checked) { setIsFixed(false); setIsRepeated(false); } }} style={{ width: '18px', height: '18px' }} />
                  </label>
                </div>
                {isInstallment && (
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', opacity: 0.9 }}>
                    <input type="number" value={installmentCount} onChange={e => setInstallmentCount(e.target.value)} min="2" max="48" style={{ width: '60px', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }} />
                    <span>vezes</span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* SUBMIT */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
           <Button type="submit" variant="primary" style={{ background: getColor(), padding: '12px 24px' }} disabled={isLoading}>
             {isLoading ? 'Salvando...' : 'Salvar Transação'}
           </Button>
        </div>
      </form>
    </Modal>
  );
}
