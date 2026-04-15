"use server";

import { revalidatePath } from 'next/cache';
import { prisma } from './prisma';
import { getOrCreateDefaultUser } from './default-data';

export async function getAccounts() {
  return await prisma.account.findMany({
    orderBy: { name: 'asc' }
  });
}

export async function createAccount(data: { name: string; bank: string; balance: number }) {
  const user = await getOrCreateDefaultUser();

  await prisma.account.create({
    data: {
      ...data,
      userId: user.id
    }
  });
  revalidatePath('/accounts');
  revalidatePath('/transactions');
  revalidatePath('/dashboard');
}

export async function updateAccount(id: string, data: { name: string; bank: string; balance: number }) {
  await prisma.account.update({
    where: { id },
    data
  });
  revalidatePath('/accounts');
  revalidatePath('/transactions');
  revalidatePath('/dashboard');
}

export async function deleteAccount(id: string) {
  const transactionsCount = await prisma.transaction.count({
    where: { accountId: id }
  });

  if (transactionsCount > 0) {
    throw new Error('Não é possível excluir uma conta que possui transações associadas.');
  }

  await prisma.account.delete({
    where: { id }
  });
  revalidatePath('/accounts');
  revalidatePath('/dashboard');
}
