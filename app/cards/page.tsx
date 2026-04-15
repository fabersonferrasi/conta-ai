import React from 'react';
import { prisma } from '../../lib/prisma';
import AppLayout from '../../components/layout/AppLayout';
import { CardClientPage } from './CardClientPage';
import { getAllCardsInvoiceSummary } from '../../lib/invoice-actions';
import { ensureDefaultData } from '../../lib/default-data';

export default async function CardsPage({
  searchParams,
}: {
  searchParams: { month?: string; year?: string };
}) {
  await ensureDefaultData();

  const currentYear = searchParams.year ? parseInt(searchParams.year, 10) : new Date().getFullYear();
  const currentMonth = searchParams.month ? parseInt(searchParams.month, 10) : new Date().getMonth() + 1;

  const cards = await prisma.creditCard.findMany({
    orderBy: { name: 'asc' }
  });

  const invoiceSummaries = await getAllCardsInvoiceSummary(currentYear, currentMonth);

  return (
    <AppLayout title="Cartões de Crédito">
      <CardClientPage 
        initialCards={cards} 
        invoiceSummaries={invoiceSummaries}
        currentYear={currentYear}
        currentMonth={currentMonth}
      />
    </AppLayout>
  );
}
