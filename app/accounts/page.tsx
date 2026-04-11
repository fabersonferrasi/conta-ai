import React from 'react';
import { prisma } from '../../lib/prisma';
import AppLayout from '../../components/layout/AppLayout';
import { AccountClientPage } from './AccountClientPage';

export default async function AccountsPage() {
  const accounts = await prisma.account.findMany({
    orderBy: { name: 'asc' }
  });

  return (
    <AppLayout title="Contas Correntes">
      <AccountClientPage initialAccounts={accounts} />
    </AppLayout>
  );
}
