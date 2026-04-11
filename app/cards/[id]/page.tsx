import React from 'react';
import AppLayout from '../../../components/layout/AppLayout';
import { getCardInvoice } from '../../../lib/invoice-actions';
import { CardDetailClient } from './CardDetailClient';

export default async function CardDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { month?: string; year?: string };
}) {
  const currentYear = searchParams.year ? parseInt(searchParams.year, 10) : new Date().getFullYear();
  const currentMonth = searchParams.month ? parseInt(searchParams.month, 10) : new Date().getMonth() + 1;

  const invoice = await getCardInvoice(params.id, currentYear, currentMonth);

  return (
    <AppLayout title={`Cartão: ${invoice.card.name}`}>
      <CardDetailClient 
        invoice={invoice} 
        currentYear={currentYear} 
        currentMonth={currentMonth} 
      />
    </AppLayout>
  );
}
