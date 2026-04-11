"use server";

import { revalidatePath } from 'next/cache';
import { prisma } from './prisma';

export async function getCreditCards() {
  return await prisma.creditCard.findMany({
    orderBy: { name: 'asc' }
  });
}

export async function createCreditCard(data: { name: string; limit: number; closingDay: number; dueDay: number; icon?: string }) {
  const user = await prisma.user.findFirst();
  if (!user) throw new Error("Usuário não encontrado.");

  await prisma.creditCard.create({
    data: {
      ...data,
      userId: user.id
    }
  });
  revalidatePath('/cards');
  revalidatePath('/transactions');
  revalidatePath('/dashboard');
}

export async function updateCreditCard(id: string, data: { name: string; limit: number; closingDay: number; dueDay: number; icon?: string }) {
  await prisma.creditCard.update({
    where: { id },
    data
  });
  revalidatePath('/cards');
  revalidatePath('/transactions');
  revalidatePath('/dashboard');
}

export async function deleteCreditCard(id: string) {
  const transactionsCount = await prisma.transaction.count({
    where: { creditCardId: id }
  });

  if (transactionsCount > 0) {
    throw new Error('Não é possível excluir um cartão que possui lançamentos associados nas faturas.');
  }

  await prisma.creditCard.delete({
    where: { id }
  });
  revalidatePath('/cards');
}
