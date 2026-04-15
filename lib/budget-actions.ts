'use server';

import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';
import { getOrCreateDefaultUser } from './default-data';

export async function getBudgetsForMonth(year: number, month: number) {
  const user = await getOrCreateDefaultUser();
  
  const budgets = await prisma.budget.findMany({
    where: { userId: user.id, year, month },
    include: { category: true },
  });

  // Get actual spending per category for the month
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: user.id,
      type: 'EXPENSE',
      date: { gte: startDate, lte: endDate },
      categoryId: { not: null },
    },
    select: { categoryId: true, amount: true, status: true },
  });

  const spending: Record<string, { spent: number; paidOnly: number }> = {};
  for (const tx of transactions) {
    if (!tx.categoryId) continue;
    if (!spending[tx.categoryId]) spending[tx.categoryId] = { spent: 0, paidOnly: 0 };
    spending[tx.categoryId].spent += tx.amount;
    if (tx.status === 'COMPLETED') spending[tx.categoryId].paidOnly += tx.amount;
  }

  return budgets.map(b => ({
    id: b.id,
    categoryId: b.categoryId,
    categoryName: b.category.name,
    categoryColor: b.category.color,
    budgetAmount: b.amount,
    spent: spending[b.categoryId]?.spent || 0,
    paidOnly: spending[b.categoryId]?.paidOnly || 0,
    percentUsed: b.amount > 0 ? ((spending[b.categoryId]?.spent || 0) / b.amount) * 100 : 0,
  }));
}

export async function saveBudget(categoryId: string, month: number, year: number, amount: number) {
  const user = await getOrCreateDefaultUser();

  await prisma.budget.upsert({
    where: {
      userId_categoryId_month_year: { userId: user.id, categoryId, month, year },
    },
    update: { amount },
    create: { userId: user.id, categoryId, month, year, amount },
  });

  revalidatePath('/reports');
  revalidatePath('/dashboard');
}

export async function deleteBudget(id: string) {
  await prisma.budget.delete({ where: { id } });
  revalidatePath('/reports');
  revalidatePath('/dashboard');
}
