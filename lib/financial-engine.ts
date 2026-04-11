import { prisma } from './prisma';

export async function getMonthCashflow(targetYear: number, targetMonth: number, accountId?: string) {
  const startDate = new Date(targetYear, targetMonth - 1, 1);
  const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

  // Todo o balanço de Contas Correntes
  const accountsQuery = accountId ? { id: accountId } : {};
  const accounts = await prisma.account.findMany({ where: accountsQuery });
  let baseRunningBalance = accounts.reduce((acc, account) => acc + account.balance, 0);

  // Todo o balanço de Cartões de Crédito (apenas se não houver filtro de conta)
  const creditCards = accountId ? [] : await prisma.creditCard.findMany();

  // Todo o histórico de transações que JÁ BATERAM na Conta Corrente
  const pastTxWhere = accountId ? { date: { lt: startDate }, accountId } : { date: { lt: startDate }, accountId: { not: null } };
  
  const pastTransactions = await prisma.transaction.aggregate({
    where: pastTxWhere,
    _sum: { amount: true },
  });

  const pastIncomes = await prisma.transaction.aggregate({
    where: { ...pastTxWhere, type: 'INCOME' },
    _sum: { amount: true },
  });
  const pastExpenses = await prisma.transaction.aggregate({
    where: { ...pastTxWhere, type: 'EXPENSE' },
    _sum: { amount: true },
  });

  // Saldo inicial real do Mês
  const startingBalance = baseRunningBalance + (pastIncomes._sum.amount || 0) - (pastExpenses._sum.amount || 0);

  // Transações programadas/ocorridas NO MÊS
  const currentMonthTxWhere = accountId 
    ? { date: { gte: startDate, lte: endDate }, accountId } 
    : { date: { gte: startDate, lte: endDate } };

  const currentMonthTx = await prisma.transaction.findMany({
    where: currentMonthTxWhere,
    include: { creditCard: true, category: true, account: true },
    orderBy: { date: 'asc' },
  });

  let currentIncomes = 0;
  let currentIncomesPaid = 0;
  let currentIncomesPending = 0;

  let currentExpenses = 0;
  let currentExpensesPaid = 0;
  let currentExpensesPending = 0;

  const daysInMonth = endDate.getDate();
  const dailyFlow = [];
  let runningBalance = startingBalance;

  // Calculo de Status macro pro dashboard
  for (const t of currentMonthTx) {
     if (t.type === 'INCOME') {
        currentIncomes += t.amount;
        if (t.status === 'COMPLETED') currentIncomesPaid += t.amount;
        else currentIncomesPending += t.amount;
     } else if (t.type === 'EXPENSE') {
        currentExpenses += t.amount;
        if (t.status === 'COMPLETED') currentExpensesPaid += t.amount;
        else currentExpensesPending += t.amount;
     }
  }

  for (let day = 1; day <= daysInMonth; day++) {
    // Para Contas Correntes a transação bate no dia em que foi feita.
    // Para Cartões, a transação bate APENAS se o `day` for o dia do Vencimento do Cartão (dueDay).
    
    let dayIncome = 0;
    let dayExpense = 0;
    
    for (const t of currentMonthTx) {
       // Se for CC, checa a data de vencimento. Assumimos vencimento no mesmo mês para simular fatura.
       const isCreditCard = t.creditCardId !== null;
       const triggersToday = isCreditCard ? (t.creditCard?.dueDay === day) : (t.date.getDate() === day);

       if (triggersToday) {
         if (t.type === 'INCOME') {
           dayIncome += t.amount;
         } else if (t.type === 'EXPENSE') {
           dayExpense += t.amount;
         }
       }
    }
    
    runningBalance += (dayIncome - dayExpense);

    dailyFlow.push({
      day,
      date: new Date(targetYear, targetMonth - 1, day).toISOString(),
      balance: runningBalance,
      income: dayIncome,
      expense: dayExpense
    });
  }

  // Agrupando por categoria para o Dashboard
  const categoryTotals: Record<string, { id: string; name: string; color: string; totalPaid: number; totalPending: number }> = {};

  for (const t of currentMonthTx) {
    if (t.categoryId && t.type === 'EXPENSE') { // Focando despesas para o ranking
      if (!categoryTotals[t.categoryId]) {
        categoryTotals[t.categoryId] = {
           id: t.categoryId,
           name: t.category?.name || 'Desconhecida',
           color: t.category?.color || '#ccc',
           totalPaid: 0,
           totalPending: 0
        };
      }
      if (t.status === 'COMPLETED') {
        categoryTotals[t.categoryId].totalPaid += t.amount;
      } else {
        categoryTotals[t.categoryId].totalPending += t.amount;
      }
    }
  }

  const categoriesRanking = Object.values(categoryTotals).sort((a, b) => 
    (b.totalPaid + b.totalPending) - (a.totalPaid + a.totalPending)
  );

  const creditCardsData = creditCards.map(cc => {
    const txs = currentMonthTx.filter(t => t.creditCardId === cc.id);
    const total = txs.reduce((acc, t) => acc + (t.type === 'EXPENSE' ? t.amount : -t.amount), 0);
    return { id: cc.id, name: cc.name, balance: total, icon: cc.icon };
  });

  const creditCardTotal = creditCardsData.reduce((acc, cc) => acc + cc.balance, 0);

  return {
    currentBalance: baseRunningBalance,
    startingBalance,
    endingBalance: runningBalance,
    incomes: {
      total: currentIncomes,
      paid: currentIncomesPaid,
      pending: currentIncomesPending
    },
    expenses: {
      total: currentExpenses,
      paid: currentExpensesPaid,
      pending: currentExpensesPending
    },
    dailyFlow,
    categoriesRanking,
    transactions: currentMonthTx,
    creditCards: {
      total: creditCardTotal,
      cards: creditCardsData
    },
    accounts: accounts
  };
}
