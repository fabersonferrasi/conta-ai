import React from 'react';
import { prisma } from '../../lib/prisma';
import AppLayout from '../../components/layout/AppLayout';
import { CategoryClientPage } from './CategoryClientPage';

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' }
  });

  return (
    <AppLayout title="Categorias">
      <CategoryClientPage initialCategories={categories} />
    </AppLayout>
  );
}
