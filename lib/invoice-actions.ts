"use server";

import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';

// Buscar dados completos de fatura de um cartão para um mês específico
export async function getCardInvoice(cardId: string, year: number, month: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const card = await prisma.creditCard.findUnique({ where: { id: cardId } });
  if (!card) throw new Error("Cartão não encontrado.");

  const transactions = await prisma.transaction.findMany({
    where: {
      creditCardId: cardId,
      date: { gte: startDate, lte: endDate },
    },
    include: { category: true },
    orderBy: { date: 'asc' },
  });

  const totalInvoice = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalCredits = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((acc, t) => acc + t.amount, 0);

  const netInvoice = totalInvoice - totalCredits;

  const allPaid = transactions.length > 0 && transactions
    .filter(t => t.type === 'EXPENSE')
    .every(t => t.status === 'COMPLETED');

  const totalPending = transactions
    .filter(t => t.type === 'EXPENSE' && t.status === 'PENDING')
    .reduce((acc, t) => acc + t.amount, 0);

  // Determinar status da fatura
  const today = new Date();
  const closingDate = new Date(year, month - 1, card.closingDay);
  const dueDate = new Date(year, month - 1, card.dueDay);
  // Se o dueDay é antes do closingDay, o vencimento é no mês seguinte
  if (card.dueDay <= card.closingDay) {
    dueDate.setMonth(dueDate.getMonth() + 1);
  }

  let invoiceStatus: 'OPEN' | 'CLOSED' | 'PAID' | 'OVERDUE' = 'OPEN';
  if (allPaid && totalInvoice > 0) {
    invoiceStatus = 'PAID';
  } else if (today > dueDate && totalPending > 0) {
    invoiceStatus = 'OVERDUE';
  } else if (today > closingDate && totalPending > 0) {
    invoiceStatus = 'CLOSED';
  }

  return {
    card,
    transactions,
    totalInvoice: netInvoice,
    totalExpenses: totalInvoice,
    totalCredits,
    totalPending,
    invoiceStatus,
    closingDate: closingDate.toISOString(),
    dueDate: dueDate.toISOString(),
    usedLimit: totalInvoice,
    availableLimit: card.limit - totalInvoice,
    usagePercent: card.limit > 0 ? (totalInvoice / card.limit) * 100 : 0,
  };
}

// Buscar resumo de todos os cartões para a visão geral
export async function getAllCardsInvoiceSummary(year: number, month: number) {
  const user = await prisma.user.findFirst();
  if (!user) throw new Error("Usuário não encontrado.");

  const cards = await prisma.creditCard.findMany({ where: { userId: user.id } });
  
  const summaries = await Promise.all(
    cards.map(async (card) => {
      const invoice = await getCardInvoice(card.id, year, month);
      return { ...invoice, card };
    })
  );

  const totalLimit = cards.reduce((acc, c) => acc + c.limit, 0);
  const totalUsed = summaries.reduce((acc, s) => acc + s.totalExpenses, 0);
  const totalAvailable = totalLimit - totalUsed;

  const nextDue = summaries
    .filter(s => s.invoiceStatus !== 'PAID')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

  return {
    cards: summaries,
    totalLimit,
    totalUsed,
    totalAvailable,
    nextDueDate: nextDue?.dueDate || null,
    nextDueCardName: nextDue?.card.name || null,
  };
}

// ======= AÇÕES COM VALIDAÇÃO DE STATUS DA FATURA =======

// Pagar fatura inteira (só se CLOSED ou OPEN com transações)
export async function payInvoice(cardId: string, year: number, month: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const invoice = await getCardInvoice(cardId, year, month);
  if (invoice.invoiceStatus === 'PAID') {
    throw new Error("Esta fatura já está paga. Não é possível pagar novamente.");
  }

  await prisma.transaction.updateMany({
    where: {
      creditCardId: cardId,
      date: { gte: startDate, lte: endDate },
      status: 'PENDING',
    },
    data: { status: 'COMPLETED' },
  });

  revalidatePath('/cards');
  revalidatePath('/dashboard');
}

// Reabrir fatura (reverter status PAID/CLOSED para OPEN → marca todas como PENDING)
export async function reopenInvoice(cardId: string, year: number, month: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const invoice = await getCardInvoice(cardId, year, month);
  if (invoice.invoiceStatus === 'OPEN') {
    throw new Error("Esta fatura já está aberta.");
  }

  await prisma.transaction.updateMany({
    where: {
      creditCardId: cardId,
      date: { gte: startDate, lte: endDate },
      status: 'COMPLETED',
    },
    data: { status: 'PENDING' },
  });

  revalidatePath('/cards');
  revalidatePath('/dashboard');
}

// Ajustar valor da fatura (SOMENTE se fatura OPEN)
// A transação é criada DENTRO do mês da fatura, não na data de hoje
export async function adjustInvoice(cardId: string, amount: number, description: string, year: number, month: number) {
  const invoice = await getCardInvoice(cardId, year, month);
  
  if (invoice.invoiceStatus !== 'OPEN') {
    throw new Error(`Não é possível ajustar uma fatura ${invoice.invoiceStatus === 'PAID' ? 'paga' : 'fechada'}. Reabra a fatura primeiro.`);
  }

  const user = await prisma.user.findFirst();
  if (!user) throw new Error("Usuário não encontrado.");

  // Data da transação: dia 15 do mês da fatura (dentro do período)
  const adjustDate = new Date(year, month - 1, 15, 12, 0, 0);

  await prisma.transaction.create({
    data: {
      userId: user.id,
      type: amount > 0 ? 'EXPENSE' : 'INCOME',
      amount: Math.abs(amount),
      description: description || 'Ajuste de fatura',
      date: adjustDate,
      status: 'PENDING',
      creditCardId: cardId,
      observation: `Ajuste manual de fatura (${month}/${year})`,
    },
  });

  revalidatePath('/cards');
}

// Lançar estorno (SOMENTE se fatura OPEN)
export async function createReversal(cardId: string, amount: number, description: string, year: number, month: number) {
  const invoice = await getCardInvoice(cardId, year, month);
  
  if (invoice.invoiceStatus !== 'OPEN') {
    throw new Error(`Não é possível lançar estorno em fatura ${invoice.invoiceStatus === 'PAID' ? 'paga' : 'fechada'}. Reabra a fatura primeiro.`);
  }

  const user = await prisma.user.findFirst();
  if (!user) throw new Error("Usuário não encontrado.");

  const reversalDate = new Date(year, month - 1, 15, 12, 0, 0);

  await prisma.transaction.create({
    data: {
      userId: user.id,
      type: 'INCOME',
      amount: Math.abs(amount),
      description: description || 'Estorno',
      date: reversalDate,
      status: 'PENDING',
      creditCardId: cardId,
      observation: `Estorno lançado manualmente (${month}/${year})`,
    },
  });

  revalidatePath('/cards');
}
