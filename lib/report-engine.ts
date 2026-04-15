import { prisma } from './prisma';
import { getOrCreateDefaultUser } from './default-data';

/**
 * Relatório Mensal — Dados detalhados de um mês específico
 */
export async function getMonthlyReport(year: number, month: number) {
  const user = await getOrCreateDefaultUser();
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: user.id,
      date: { gte: startDate, lte: endDate },
    },
    include: { category: true, account: true, creditCard: true },
    orderBy: { date: 'asc' },
  });

  let totalIncome = 0;
  let totalExpense = 0;
  let paidExpenses = 0;
  let pendingExpenses = 0;
  let paidIncomes = 0;
  let pendingIncomes = 0;

  const categoryTotals: Record<string, { name: string; color: string; income: number; expense: number }> = {};

  for (const tx of transactions) {
    if (tx.type === 'INCOME') {
      totalIncome += tx.amount;
      if (tx.status === 'COMPLETED') paidIncomes += tx.amount;
      else pendingIncomes += tx.amount;
    } else if (tx.type === 'EXPENSE') {
      totalExpense += tx.amount;
      if (tx.status === 'COMPLETED') paidExpenses += tx.amount;
      else pendingExpenses += tx.amount;
    }

    if (tx.categoryId) {
      if (!categoryTotals[tx.categoryId]) {
        categoryTotals[tx.categoryId] = {
          name: tx.category?.name || 'Sem Categoria',
          color: tx.category?.color || '#94a3b8',
          income: 0,
          expense: 0,
        };
      }
      if (tx.type === 'INCOME') categoryTotals[tx.categoryId].income += tx.amount;
      if (tx.type === 'EXPENSE') categoryTotals[tx.categoryId].expense += tx.amount;
    }
  }

  const netBalance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  // Payment punctuality: % of expenses that are COMPLETED
  const totalTxCount = transactions.filter(t => t.type === 'EXPENSE').length;
  const paidTxCount = transactions.filter(t => t.type === 'EXPENSE' && t.status === 'COMPLETED').length;
  const punctuality = totalTxCount > 0 ? (paidTxCount / totalTxCount) * 100 : 100;

  const categories = Object.entries(categoryTotals)
    .map(([id, data]) => ({ id, ...data, total: data.expense }))
    .sort((a, b) => b.total - a.total);

  return {
    totalIncome,
    totalExpense,
    netBalance,
    savingsRate,
    punctuality,
    paidExpenses,
    pendingExpenses,
    paidIncomes,
    pendingIncomes,
    categories,
    transactionCount: transactions.length,
  };
}

/**
 * Relatório Anual — Evolução mês a mês de um ano inteiro
 */
export async function getYearlyReport(year: number) {
  const user = await getOrCreateDefaultUser();
  const monthlyData = [];

  for (let month = 1; month <= 12; month++) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        date: { gte: startDate, lte: endDate },
      },
      select: { type: true, amount: true },
    });

    let income = 0;
    let expense = 0;
    for (const tx of transactions) {
      if (tx.type === 'INCOME') income += tx.amount;
      else if (tx.type === 'EXPENSE') expense += tx.amount;
    }

    monthlyData.push({
      month,
      monthLabel: new Date(year, month - 1).toLocaleDateString('pt-BR', { month: 'short' }),
      income,
      expense,
      balance: income - expense,
    });
  }

  const totalIncome = monthlyData.reduce((acc, m) => acc + m.income, 0);
  const totalExpense = monthlyData.reduce((acc, m) => acc + m.expense, 0);
  const avgIncome = totalIncome / 12;
  const avgExpense = totalExpense / 12;
  const bestMonth = monthlyData.reduce((best, m) => m.balance > best.balance ? m : best, monthlyData[0]);
  const worstMonth = monthlyData.reduce((worst, m) => m.balance < worst.balance ? m : worst, monthlyData[0]);

  return {
    monthlyData,
    totalIncome,
    totalExpense,
    totalBalance: totalIncome - totalExpense,
    avgIncome,
    avgExpense,
    bestMonth,
    worstMonth,
  };
}

/**
 * Score de Saúde Financeira (0 a 100)
 * 
 * Critérios de um especialista financeiro:
 * 1. Taxa de poupança (35pts) — Regra 50-30-20: poupar >= 20% é ideal
 * 2. Pontualidade de pagamentos (25pts) — % de contas pagas em dia  
 * 3. Diversificação de receitas (15pts) — Mais de uma fonte de renda
 * 4. Controle de cartão (15pts) — Uso de cartão < 70% do limite
 * 5. Tendência de saldo (10pts) — Saldo melhorando mês a mês
 */
export async function getFinancialHealthScore(year: number, month: number) {
  const user = await getOrCreateDefaultUser();
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  // 1. Taxa de Poupança
  const txs = await prisma.transaction.findMany({
    where: { userId: user.id, date: { gte: startDate, lte: endDate } },
    select: { type: true, amount: true, status: true, accountId: true },
  });

  let income = 0, expense = 0;
  for (const tx of txs) {
    if (tx.type === 'INCOME') income += tx.amount;
    if (tx.type === 'EXPENSE') expense += tx.amount;
  }

  const savingsRate = income > 0 ? (income - expense) / income : 0;
  const savingsScore = Math.min(35, Math.max(0, savingsRate * 100 * 1.75)); // 20% poupança = 35pts

  // 2. Pontualidade de Pagamentos
  const expenseTxs = txs.filter(t => t.type === 'EXPENSE');
  const paidCount = expenseTxs.filter(t => t.status === 'COMPLETED').length;
  const punctuality = expenseTxs.length > 0 ? paidCount / expenseTxs.length : 1;
  const punctualityScore = punctuality * 25;

  // 3. Diversificação de Receitas 
  const uniqueIncomeSources = new Set(txs.filter(t => t.type === 'INCOME').map(t => t.accountId)).size;
  const diversificationScore = Math.min(15, uniqueIncomeSources * 5);

  // 4. Controle de Cartão
  const creditCards = await prisma.creditCard.findMany({ where: { userId: user.id } });
  let cardScore = 15;
  if (creditCards.length > 0) {
    const cardTxs = await prisma.transaction.findMany({
      where: { userId: user.id, creditCardId: { not: null }, date: { gte: startDate, lte: endDate } },
      select: { amount: true },
    });
    const totalCardSpend = cardTxs.reduce((acc, t) => acc + t.amount, 0);
    const totalLimit = creditCards.reduce((acc, c) => acc + c.limit, 0);
    const cardUsage = totalLimit > 0 ? totalCardSpend / totalLimit : 0;
    cardScore = cardUsage <= 0.3 ? 15 : cardUsage <= 0.5 ? 12 : cardUsage <= 0.7 ? 8 : cardUsage <= 0.9 ? 4 : 0;
  }

  // 5. Tendência de Saldo
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevStart = new Date(prevYear, prevMonth - 1, 1);
  const prevEnd = new Date(prevYear, prevMonth, 0, 23, 59, 59);
  
  const prevTxs = await prisma.transaction.findMany({
    where: { userId: user.id, date: { gte: prevStart, lte: prevEnd } },
    select: { type: true, amount: true },
  });

  let prevIncome = 0, prevExpense = 0;
  for (const tx of prevTxs) {
    if (tx.type === 'INCOME') prevIncome += tx.amount;
    if (tx.type === 'EXPENSE') prevExpense += tx.amount;
  }

  const prevBalance = prevIncome - prevExpense;
  const currentBalance = income - expense;
  const trendScore = currentBalance >= prevBalance ? 10 : currentBalance >= 0 ? 6 : 2;

  const totalScore = Math.round(savingsScore + punctualityScore + diversificationScore + cardScore + trendScore);

  let level: string;
  let tips: string[];

  if (totalScore >= 85) {
    level = 'Excelente';
    tips = ['Continue assim! Sua saúde financeira está ótima.', 'Considere investimentos para maximizar seus rendimentos.'];
  } else if (totalScore >= 70) {
    level = 'Bom';
    tips = ['Tente aumentar sua taxa de poupança para 20%.', 'Revise gastos com cartão de crédito.'];
  } else if (totalScore >= 50) {
    level = 'Regular';
    tips = ['Priorize quitar pendências em aberto.', 'Estabeleça um orçamento por categoria.', 'Reduza gastos supérfluos.'];
  } else if (totalScore >= 30) {
    level = 'Atenção';
    tips = ['Seus gastos estão superando suas receitas.', 'Crie um plano de emergência.', 'Corte despesas não essenciais.'];
  } else {
    level = 'Crítico';
    tips = ['Renegocie suas dívidas imediatamente.', 'Busque uma fonte de renda extra.', 'Elimine todos gastos desnecessários.'];
  }

  return {
    score: Math.min(100, Math.max(0, totalScore)),
    level,
    tips,
    breakdown: {
      savings: { score: Math.round(savingsScore), max: 35, label: 'Taxa de Poupança', detail: `${(savingsRate * 100).toFixed(1)}%` },
      punctuality: { score: Math.round(punctualityScore), max: 25, label: 'Pontualidade', detail: `${(punctuality * 100).toFixed(0)}%` },
      diversification: { score: Math.round(diversificationScore), max: 15, label: 'Diversificação', detail: `${uniqueIncomeSources} fonte(s)` },
      cardControl: { score: Math.round(cardScore), max: 15, label: 'Controle Cartão', detail: creditCards.length > 0 ? 'Ativo' : 'Sem cartão' },
      trend: { score: Math.round(trendScore), max: 10, label: 'Tendência', detail: currentBalance >= prevBalance ? 'Melhorando' : 'Piorando' },
    },
  };
}
