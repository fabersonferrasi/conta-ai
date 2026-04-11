"use server";

import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';

/**
 * Engine de Lançamento Unificado.
 * 
 * REGRAS DE NEGÓCIO PARA CARTÃO DE CRÉDITO:
 * 1. Lançamentos de cartão NÃO possuem status individual (Pago/Pendente).
 *    São sempre 'PENDING' até que a fatura inteira seja paga.
 * 2. A data do lançamento é cruzada com o dia de fechamento do cartão para
 *    determinar em qual fatura (mês) a despesa será contabilizada:
 *    - Se dataLançamento < diaFechamento → fatura do MÊS CORRENTE
 *    - Se dataLançamento >= diaFechamento → fatura do PRÓXIMO MÊS
 */
export async function saveUnifiedTransaction(payload: any) {
  let user = await prisma.user.findFirst();
  if (!user) throw new Error("Usuário não encontrado.");

  const {
    flowType, amount, date, description, categoryId, accountId, creditCardId, destinationAccountId, 
    tags, observation, isFixed, isRepeated, repeatFrequency, repeatCount, isInstallment, installmentCount, status
  } = payload;

  const typeMap: any = {
    'EXPENSE': 'EXPENSE',
    'INCOME': 'INCOME',
    'CARD_EXPENSE': 'EXPENSE',
    'TRANSFER': 'TRANSFER'
  };

  const groupId = crypto.randomUUID();
  const transactions = [];

  if (flowType === 'CARD_EXPENSE' && !creditCardId) {
    throw new Error('Nenhum Cartão de Crédito foi selecionado. Por favor, cadastre ou selecione um cartão válido.');
  }

  if (flowType !== 'CARD_EXPENSE' && flowType !== 'TRANSFER' && !accountId) {
    throw new Error('Nenhuma Conta selecionada. Por favor, cadastre uma conta.');
  }

  // Garantir que amount é numérico válido
  const safeAmount = isNaN(amount) ? 0 : Number(amount);
  if (safeAmount <= 0) throw new Error("O valor precisa ser maior que zero.");

  // Buscar cartão para regra de fechamento (se for despesa de cartão)
  let card: any = null;
  if (flowType === 'CARD_EXPENSE' && creditCardId) {
    card = await prisma.creditCard.findUnique({ where: { id: creditCardId } });
    if (!card) throw new Error("Cartão não encontrado no banco de dados.");
  }

  // Determinar número de iterações e se os valores dividem
  let totalGenerations = 1;
  let finalAmount = safeAmount;
  let generatorFrequency = 'MONTHS';
  
  if (isFixed) {
    totalGenerations = 24;
  } else if (isRepeated) {
    totalGenerations = Number(repeatCount) || 2;
    generatorFrequency = repeatFrequency || 'MONTHS';
  } else if (isInstallment) {
    const safeInstallments = Number(installmentCount) || 2;
    totalGenerations = safeInstallments;
    finalAmount = safeAmount / safeInstallments;
  }

  const baseDate = new Date(date);

  for (let i = 1; i <= totalGenerations; i++) {
    let targetDate = new Date(baseDate);
    
    // Mover cronologia para parcelas/repetições
    if (i > 1) {
      if (generatorFrequency === 'MONTHS') targetDate.setMonth(targetDate.getMonth() + (i - 1));
      else if (generatorFrequency === 'DAYS') targetDate.setDate(targetDate.getDate() + (i - 1));
      else if (generatorFrequency === 'WEEKS') targetDate.setDate(targetDate.getDate() + ((i - 1) * 7));
      else if (generatorFrequency === 'YEARS') targetDate.setFullYear(targetDate.getFullYear() + (i - 1));
    }

    // ======= REGRA DE FECHAMENTO DE CARTÃO =======
    // Para despesas de cartão, ajustar a data para cair na fatura correta
    // baseado no dia de fechamento do cartão.
    let invoiceDate = targetDate;
    let txStatus = status;

    if (flowType === 'CARD_EXPENSE' && card) {
      txStatus = 'PENDING'; // Cartão NUNCA tem status individual

      const purchaseDay = targetDate.getDate();
      const purchaseMonth = targetDate.getMonth();
      const purchaseYear = targetDate.getFullYear();
      const closingDay = card.closingDay;

      // Se a compra foi feita ANTES do dia de fechamento:
      //   → A despesa entra na fatura do MÊS CORRENTE da compra.
      //   → Colocamos a data como dia 1 do mês da compra (para ficar dentro do range da fatura).
      //
      // Se a compra foi feita NO DIA ou APÓS o fechamento:
      //   → A despesa entra na fatura do PRÓXIMO MÊS.
      //   → Colocamos a data como dia 1 do próximo mês.

      if (purchaseDay >= closingDay) {
        // Vai para a fatura do PRÓXIMO mês
        invoiceDate = new Date(purchaseYear, purchaseMonth + 1, 1, 12, 0, 0);
      } else {
        // Fica na fatura do MÊS CORRENTE
        invoiceDate = new Date(purchaseYear, purchaseMonth, 1, 12, 0, 0);
      }
    }

    transactions.push({
      userId: user.id,
      type: typeMap[flowType],
      amount: finalAmount, 
      description: (isRepeated || isInstallment) && totalGenerations > 1 ? `${description} (${i}/${totalGenerations})` : description,
      date: invoiceDate,
      status: txStatus,
      
      categoryId: categoryId || null,
      accountId: flowType === 'CARD_EXPENSE' ? null : (accountId || null),
      creditCardId: creditCardId || null,
      destinationAccountId: destinationAccountId || null,
      
      tags: tags || null,
      observation: observation || null,
      isFixed,
      repeatFrequency: isFixed || isRepeated ? generatorFrequency : null,
      
      installmentGroupId: totalGenerations > 1 ? groupId : null,
      installmentNum: totalGenerations > 1 ? i : null,
      totalInstallments: totalGenerations > 1 ? totalGenerations : null,
    });
  }

  if (transactions.length === 0) {
    throw new Error("Nenhuma transação foi gerada. Verifique os dados fornecidos.");
  }

  try {
    await prisma.transaction.createMany({ data: transactions });
  } catch (error: any) {
    console.error("PRISMA CREATE ERROR:", error);
    throw new Error(`Erro interno do Banco de Dados. Detalhes: ${error.message}`);
  }

  revalidatePath('/transactions');
  revalidatePath('/dashboard');
  revalidatePath('/cards');
}
