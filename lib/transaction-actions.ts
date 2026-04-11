'use server';

import { prisma } from './prisma';
import { revalidatePath } from 'next/cache';

export async function createInstallments(formData: FormData) {
  const description = formData.get('description') as string;
  const amountStr = formData.get('amount') as string;
  const type = formData.get('type') as string;
  const installmentsStr = formData.get('installments') as string;
  const source = formData.get('source') as string; // ex: "ACCOUNT|acc_id" ou "CARD|card_id"

  if (!description || !amountStr || !type || !source) return;

  const [sourceType, sourceId] = source.split('|');

  const totalAmount = parseFloat(amountStr);
  const totalInstallments = parseInt(installmentsStr || '1', 10);
  const categoryId = formData.get('category' ) as string;
  
  const installmentAmount = totalAmount / totalInstallments;
  const groupId = crypto.randomUUID();

  // Associar ao Usuário atual Padrão
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({ data: { email: `t+${Date.now()}@t.com`, name: 'Usuário', password: '123' }});
  }

  const transactions = [];
  const baseDate = new Date(); // Mês atual

  for (let i = 1; i <= totalInstallments; i++) {
    const targetDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + (i - 1), baseDate.getDate());
    
    transactions.push({
      userId: user.id,
      type: type,
      amount: installmentAmount,
      description: totalInstallments > 1 ? `${description} (${i}/${totalInstallments})` : description,
      date: targetDate,
      status: 'PENDING',
      installmentGroupId: totalInstallments > 1 ? groupId : null,
      installmentNum: totalInstallments > 1 ? i : null,
      totalInstallments: totalInstallments > 1 ? totalInstallments : null,
      accountId: sourceType === 'ACCOUNT' ? sourceId : null,
      creditCardId: sourceType === 'CARD' ? sourceId : null,
      categoryId: categoryId || null,
    });
  }

  await prisma.transaction.createMany({ data: transactions });
  
  revalidatePath('/transactions');
  revalidatePath('/dashboard');
}

export async function seedAccountsIfEmpty() {
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({ data: { email: `padrao@conta.ai`, name: 'Padrão', password: '123' }});
  }

  const accounts = await prisma.account.count();
  if (accounts === 0) {
    await prisma.account.create({
      data: { userId: user.id, name: 'Conta Corrente Padrão', balance: 5000.00 }
    });
  }

  const cards = await prisma.creditCard.count();
  if (cards === 0) {
    await prisma.creditCard.create({
      data: { userId: user.id, name: 'Cartão Master', limit: 10000.00, closingDay: 5, dueDay: 12 }
    });
  }

  const baseCategories = [
    { name: 'Moradia', color: '#3b82f6' },
    { name: 'Alimentação', color: '#f59e0b' },
    { name: 'Transporte', color: '#10b981' },
    { name: 'Lazer', color: '#8b5cf6' },
    { name: 'Saúde', color: '#ef4444' }
  ];

  const categories = await prisma.category.count();
  if (categories === 0) {
    await prisma.category.createMany({
       data: baseCategories.map(c => ({ ...c, userId: user.id }))
    });
  }
}

export async function payExactTransaction(id: string, exactAmount: number, exactDate?: Date) {
  const transaction = await prisma.transaction.findUnique({ where: { id } });
  if (!transaction) return;

  await prisma.transaction.update({
    where: { id },
    data: { 
      status: 'COMPLETED',
      amount: exactAmount,
      ...(exactDate ? { date: exactDate } : {})
    }
  });

  revalidatePath('/dashboard');
  revalidatePath('/transactions');
}

export async function toggleTransactionStatus(id: string) {
  const transaction = await prisma.transaction.findUnique({ where: { id } });
  if (!transaction) return;

  await prisma.transaction.update({
    where: { id },
    data: { status: transaction.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED' }
  });

  revalidatePath('/dashboard');
  revalidatePath('/transactions');
}


export async function deleteTransaction(id: string, scope: 'SINGLE' | 'FUTURE' = 'SINGLE') {
  const tx = await prisma.transaction.findUnique({ where: { id } });
  if (!tx) return;
  
  if (scope === 'SINGLE' || !tx.installmentGroupId) {
    await prisma.transaction.delete({ where: { id } });
  } else if (scope === 'FUTURE') {
    await prisma.transaction.deleteMany({
      where: {
        installmentGroupId: tx.installmentGroupId,
        installmentNum: { gte: tx.installmentNum! }
      }
    });
  }
  
  revalidatePath('/dashboard');
  revalidatePath('/transactions');
}

export async function updateTransaction(id: string, data: any, scope: 'SINGLE' | 'FUTURE' = 'SINGLE') {
  const tx = await prisma.transaction.findUnique({ where: { id } });
  if (!tx) return;

  if (scope === 'SINGLE' || !tx.installmentGroupId) {
    await prisma.transaction.update({ where: { id }, data });
  } else if (scope === 'FUTURE') {
    await prisma.transaction.update({ where: { id }, data });
    
    const restData = { ...data };
    delete restData.date;
    delete restData.status; 
    
    if (Object.keys(restData).length > 0) {
      await prisma.transaction.updateMany({
        where: {
          installmentGroupId: tx.installmentGroupId,
          installmentNum: { gt: tx.installmentNum! }
        },
        data: restData
      });
    }
  }

  revalidatePath('/dashboard');
  revalidatePath('/transactions');
}
