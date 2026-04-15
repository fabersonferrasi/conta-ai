"use server";

import { revalidatePath } from 'next/cache';
import { prisma } from './prisma';
import { getOrCreateDefaultUser } from './default-data';

export async function getCategories() {
  return await prisma.category.findMany({
    orderBy: { name: 'asc' }
  });
}

export async function createCategory(data: { name: string; color: string; icon: string }) {
  const user = await getOrCreateDefaultUser();

  await prisma.category.create({
    data: {
      ...data,
      userId: user.id
    }
  });
  revalidatePath('/categories');
  revalidatePath('/transactions');
  revalidatePath('/dashboard');
}

export async function updateCategory(id: string, data: { name: string; color: string; icon: string }) {
  await prisma.category.update({
    where: { id },
    data
  });
  revalidatePath('/categories');
  revalidatePath('/transactions');
  revalidatePath('/dashboard');
}

export async function deleteCategory(id: string) {
  // Prevent deletion if there are transactions associated
  const transactionsCount = await prisma.transaction.count({
    where: { categoryId: id }
  });

  if (transactionsCount > 0) {
    throw new Error('Não é possível excluir uma categoria que possui transações associadas.');
  }

  await prisma.category.delete({
    where: { id }
  });
  revalidatePath('/categories');
}
