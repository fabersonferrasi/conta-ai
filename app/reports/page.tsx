import React from 'react';
import styles from './page.module.css';
import AppLayout from '../../components/layout/AppLayout';
import { getMonthlyReport, getYearlyReport, getFinancialHealthScore } from '../../lib/report-engine';
import { getBudgetsForMonth } from '../../lib/budget-actions';
import { prisma } from '../../lib/prisma';
import { MonthlyEvolutionChart, CategoryBarChart, TrendComparisonChart } from '../../components/reports/ReportCharts';
import { FinancialHealthScore } from '../../components/reports/FinancialHealthScore';
import { BudgetProgress } from '../../components/reports/BudgetProgress';

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { year?: string; month?: string };
}) {
  const now = new Date();
  const year = searchParams.year ? parseInt(searchParams.year, 10) : now.getFullYear();
  const month = searchParams.month ? parseInt(searchParams.month, 10) : now.getMonth() + 1;

  // Fetch all data in parallel
  const [monthlyReport, yearlyReport, healthScore, budgets, categories] = await Promise.all([
    getMonthlyReport(year, month),
    getYearlyReport(year),
    getFinancialHealthScore(year, month),
    getBudgetsForMonth(year, month),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
  ]);

  const prevYear = year - 1;
  const nextYear = year + 1;

  return (
    <AppLayout title="Relatórios">
      {/* Year Selector */}
      <div className={styles.reportsHeader}>
        <div className={styles.yearSelector}>
          <a href={`/reports?year=${prevYear}&month=${month}`} className={styles.yearBtn}>‹</a>
          <span className={styles.yearLabel}>{year}</span>
          <a href={`/reports?year=${nextYear}&month=${month}`} className={styles.yearBtn}>›</a>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Receita Total (Ano)</div>
          <div className={styles.summaryValue} style={{ color: 'var(--accent-success)' }}>
            {fmtBRL(yearlyReport.totalIncome)}
          </div>
          <div className={styles.summaryDetail}>Média: {fmtBRL(yearlyReport.avgIncome)}/mês</div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Despesa Total (Ano)</div>
          <div className={styles.summaryValue} style={{ color: 'var(--accent-danger)' }}>
            {fmtBRL(yearlyReport.totalExpense)}
          </div>
          <div className={styles.summaryDetail}>Média: {fmtBRL(yearlyReport.avgExpense)}/mês</div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Saldo Líquido (Ano)</div>
          <div className={styles.summaryValue} style={{
            color: yearlyReport.totalBalance >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)',
          }}>
            {fmtBRL(yearlyReport.totalBalance)}
          </div>
          <div className={styles.summaryDetail}>
            {yearlyReport.totalBalance >= 0 ? '📈 Positivo' : '📉 Negativo'}
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Taxa de Economia (Mês)</div>
          <div className={styles.summaryValue} style={{
            color: monthlyReport.savingsRate >= 20 ? 'var(--accent-success)' : 
                   monthlyReport.savingsRate >= 0 ? 'var(--accent-warning)' : 'var(--accent-danger)',
          }}>
            {monthlyReport.savingsRate.toFixed(1)}%
          </div>
          <div className={styles.summaryDetail}>
            Meta: ≥ 20% (Regra 50-30-20)
          </div>
        </div>
      </div>

      {/* Best / Worst Month Highlights */}
      {yearlyReport.bestMonth && yearlyReport.worstMonth && (
        <div className={styles.highlightRow}>
          <div className={styles.highlightCard}>
            <div className={styles.highlightIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              🏆
            </div>
            <div>
              <div className={styles.highlightLabel}>Melhor Mês</div>
              <div className={styles.highlightValue} style={{ color: 'var(--accent-success)' }}>
                {yearlyReport.bestMonth.monthLabel} — {fmtBRL(yearlyReport.bestMonth.balance)}
              </div>
            </div>
          </div>
          <div className={styles.highlightCard}>
            <div className={styles.highlightIcon} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              ⚠️
            </div>
            <div>
              <div className={styles.highlightLabel}>Pior Mês</div>
              <div className={styles.highlightValue} style={{ color: 'var(--accent-danger)' }}>
                {yearlyReport.worstMonth.monthLabel} — {fmtBRL(yearlyReport.worstMonth.balance)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Detail Card */}
      <div className={styles.monthSummaryCard}>
        <h3 className={styles.monthSummaryTitle}>
          📅 Resumo de {new Date(year, month - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </h3>
        <div className={styles.monthSummaryGrid}>
          <div className={styles.monthSummaryItem}>
            <div className={styles.monthSummaryItemLabel}>Receitas</div>
            <div className={styles.monthSummaryItemValue} style={{ color: 'var(--accent-success)' }}>
              {fmtBRL(monthlyReport.totalIncome)}
            </div>
          </div>
          <div className={styles.monthSummaryItem}>
            <div className={styles.monthSummaryItemLabel}>Despesas</div>
            <div className={styles.monthSummaryItemValue} style={{ color: 'var(--accent-danger)' }}>
              {fmtBRL(monthlyReport.totalExpense)}
            </div>
          </div>
          <div className={styles.monthSummaryItem}>
            <div className={styles.monthSummaryItemLabel}>Saldo Líquido</div>
            <div className={styles.monthSummaryItemValue} style={{
              color: monthlyReport.netBalance >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)',
            }}>
              {fmtBRL(monthlyReport.netBalance)}
            </div>
          </div>
          <div className={styles.monthSummaryItem}>
            <div className={styles.monthSummaryItemLabel}>Pendências</div>
            <div className={styles.monthSummaryItemValue} style={{ color: 'var(--accent-warning)' }}>
              {fmtBRL(monthlyReport.pendingExpenses)}
            </div>
          </div>
          <div className={styles.monthSummaryItem}>
            <div className={styles.monthSummaryItemLabel}>Pontualidade</div>
            <div className={styles.monthSummaryItemValue} style={{
              color: monthlyReport.punctuality >= 80 ? 'var(--accent-success)' : 'var(--accent-warning)',
            }}>
              {monthlyReport.punctuality.toFixed(0)}%
            </div>
          </div>
          <div className={styles.monthSummaryItem}>
            <div className={styles.monthSummaryItemLabel}>Transações</div>
            <div className={styles.monthSummaryItemValue} style={{ color: 'var(--text-primary)' }}>
              {monthlyReport.transactionCount}
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className={styles.chartsGrid}>
        <div className={styles.fullWidth}>
          <MonthlyEvolutionChart data={yearlyReport.monthlyData} />
        </div>

        <CategoryBarChart data={monthlyReport.categories} />

        <TrendComparisonChart data={yearlyReport.monthlyData} />
      </div>

      {/* Budget + Financial Health */}
      <div className={styles.chartsGrid}>
        <BudgetProgress
          budgets={budgets}
          categories={categories.map((c: { id: string; name: string; color: string }) => ({ id: c.id, name: c.name, color: c.color }))}
          year={year}
          month={month}
        />

        <FinancialHealthScore data={healthScore} />
      </div>
    </AppLayout>
  );
}
