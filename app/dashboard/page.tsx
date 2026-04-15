import React from 'react';
import styles from './page.module.css';
import { Card } from '../../components/ui/Card/Card';
import AppLayout from '../../components/layout/AppLayout';
import { MonthPaginator } from '../../components/ui/MonthPaginator';
import { getMonthCashflow } from '../../lib/financial-engine';
import { CashflowChart } from '../../components/ui/CashflowChart';
import { CategorySummary } from '../../components/dashboard/CategorySummary';
import { InteractiveActionList } from '../../components/dashboard/InteractiveActionList';
import DashboardTopCards from '../../components/dashboard/DashboardTopCards';
import { AccountFilter } from '../../components/ui/AccountFilter';
import { DailyProjectionTable } from '../../components/dashboard/DailyProjectionTable';
import { MonthlyNetBalanceCard } from '../../components/dashboard/MonthlyNetBalanceCard';
import { ensureDefaultData } from '../../lib/default-data';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { month?: string; year?: string; accountId?: string };
}) {
  await ensureDefaultData();

  const currentYear = searchParams.year ? parseInt(searchParams.year, 10) : new Date().getFullYear();
  const currentMonth = searchParams.month ? parseInt(searchParams.month, 10) : new Date().getMonth() + 1;
  const accountId = searchParams.accountId;

  const cashflow = await getMonthCashflow(currentYear, currentMonth, accountId);

  return (
    <AppLayout title="Dashboard">
      <div style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
         <MonthPaginator />
         <AccountFilter accounts={cashflow.accounts || []} />
      </div>

      <div style={{ marginBottom: '32px', display: 'flex', gap: '24px', flexDirection: 'column' }}>
        <DashboardTopCards 
          currentBalance={cashflow.currentBalance}
          incomes={cashflow.incomes}
          expenses={cashflow.expenses}
          creditCards={cashflow.creditCards}
          accounts={cashflow.accounts || []}
          selectedAccountId={accountId}
        />
        <MonthlyNetBalanceCard 
          incomes={cashflow.incomes.total} 
          expenses={cashflow.expenses.total} 
        />
      </div>

      <div className={styles.dashboardGrid}>
        <CategorySummary categories={cashflow.categoriesRanking} />

        <Card className={styles.chartCard} title="Projeção de Saldo Diário">
          <CashflowChart data={cashflow.dailyFlow} />
        </Card>

        <Card className={styles.chartCard} title="Fluxo Diário Detalhado">
          <DailyProjectionTable data={cashflow.dailyFlow} />
        </Card>

        {/* Seção de lista de transações com ação variável */}
        <Card className={styles.chartCard} title={`Próximos Vencimentos e Transações (${currentMonth}/${currentYear})`}>
           <InteractiveActionList transactions={cashflow.transactions} />
        </Card>
      </div>
    </AppLayout>
  );
}
