import React from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { prisma } from '../../lib/prisma';
import { seedAccountsIfEmpty } from '../../lib/transaction-actions';
import { TransactionsClientPage } from './TransactionsClientPage';

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: { month?: string; year?: string };
}) {
  await seedAccountsIfEmpty();

  const currentYear = searchParams.year ? parseInt(searchParams.year, 10) : new Date().getFullYear();
  const currentMonth = searchParams.month ? parseInt(searchParams.month, 10) : new Date().getMonth() + 1;

  const startDate = new Date(currentYear, currentMonth - 1, 1);
  const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);

  const allTransactions = await prisma.transaction.findMany({
    where: { date: { gte: startDate, lte: endDate } },
    orderBy: { date: 'asc' },
    include: { account: true, creditCard: true, category: true }
  });

  const accounts = await prisma.account.findMany();
  const cards = await prisma.creditCard.findMany();
  const categories = await prisma.category.findMany();

  // Calcular totais do mês
  const incomeTotal = allTransactions
    .filter(t => t.type === 'INCOME')
    .reduce((acc, t) => acc + t.amount, 0);

  const expenseTotal = allTransactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((acc, t) => acc + t.amount, 0);

  // Saldo atual (soma de todas as contas)
  const currentBalance = accounts.reduce((acc, a) => acc + a.balance, 0);
  const monthlyBalance = incomeTotal - expenseTotal;

  // Serializar para o client
  const serializedTx = allTransactions.map(tx => ({
    ...tx,
    date: tx.date.toISOString(),
    createdAt: tx.createdAt.toISOString(),
    updatedAt: tx.updatedAt.toISOString(),
  }));

  return (
    <AppLayout title="Transações">
      <TransactionsClientPage
        transactions={serializedTx}
        accounts={accounts}
        cards={cards}
        categories={categories}
        currentYear={currentYear}
        currentMonth={currentMonth}
        summary={{
          currentBalance,
          incomeTotal,
          expenseTotal,
          monthlyBalance,
        }}
      />
    </AppLayout>
  );
}
