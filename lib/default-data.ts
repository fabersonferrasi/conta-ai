import { prisma } from './prisma';

export async function getOrCreateDefaultUser() {
  const existingUser = await prisma.user.findFirst();
  if (existingUser) return existingUser;

  return prisma.user.create({
    data: {
      email: 'padrao@conta.ai',
      name: 'Padrão',
      password: '123',
    },
  });
}

export async function ensureDefaultData() {
  const user = await getOrCreateDefaultUser();

  const accountsCount = await prisma.account.count({
    where: { userId: user.id },
  });

  if (accountsCount === 0) {
    await prisma.account.create({
      data: {
        userId: user.id,
        name: 'Conta Corrente Padrão',
        balance: 5000,
      },
    });
  }

  const cardsCount = await prisma.creditCard.count({
    where: { userId: user.id },
  });

  if (cardsCount === 0) {
    await prisma.creditCard.create({
      data: {
        userId: user.id,
        name: 'Cartão Master',
        limit: 10000,
        closingDay: 5,
        dueDay: 12,
      },
    });
  }

  const categoriesCount = await prisma.category.count({
    where: { userId: user.id },
  });

  if (categoriesCount === 0) {
    await prisma.category.createMany({
      data: [
        { userId: user.id, name: 'Moradia', color: '#3b82f6' },
        { userId: user.id, name: 'Alimentação', color: '#f59e0b' },
        { userId: user.id, name: 'Transporte', color: '#10b981' },
        { userId: user.id, name: 'Lazer', color: '#8b5cf6' },
        { userId: user.id, name: 'Saúde', color: '#ef4444' },
      ],
    });
  }

  return user;
}
