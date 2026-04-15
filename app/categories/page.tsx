import React from 'react';
import { prisma } from '../../lib/prisma';
import AppLayout from '../../components/layout/AppLayout';
import { CategoryClientPage } from './CategoryClientPage';
import { ensureDefaultData } from '../../lib/default-data';

export default async function CategoriesPage() {
  await ensureDefaultData();

  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' }
  });

  return (
    <AppLayout title="Categorias">
      <CategoryClientPage initialCategories={categories} />
    </AppLayout>
  );
}
