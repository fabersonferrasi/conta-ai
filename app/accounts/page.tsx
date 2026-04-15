import React from 'react';
import { prisma } from '../../lib/prisma';
import AppLayout from '../../components/layout/AppLayout';
import { AccountClientPage } from './AccountClientPage';
import { ensureDefaultData } from '../../lib/default-data';

export default async function AccountsPage() {
  await ensureDefaultData();

  const accounts = await prisma.account.findMany({
    orderBy: { name: 'asc' }
  });

  return (
    <AppLayout title="Contas Correntes">
      <AccountClientPage initialAccounts={accounts} />
    </AppLayout>
  );
}
