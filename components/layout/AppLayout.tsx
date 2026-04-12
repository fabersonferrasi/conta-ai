import React from 'react';
import styles from '../../app/dashboard/layout.module.css';
import { prisma } from '../../lib/prisma';
import { GlobalFAB } from '../ui/GlobalFAB';

export default async function AppLayout({ children, title }: { children: React.ReactNode, title: string }) {
  // Buscar dados necessários para o FAB global
  const accounts = await prisma.account.findMany({ orderBy: { name: 'asc' } });
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  const cards = await prisma.creditCard.findMany({ orderBy: { name: 'asc' } });

  return (
    <div className={styles.appContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2 className="text-gradient" style={{ fontSize: '1.5rem', fontWeight: 700 }}>Conta Aí</h2>
        </div>
        <nav className={styles.nav}>
          <ul className={styles.navList}>
            <li className={styles.navItem}><a href="/dashboard">Visão Geral</a></li>
            <li className={styles.navItem}><a href="/accounts">Contas Correntes</a></li>
            <li className={styles.navItem}><a href="/cards">Cartões de Crédito</a></li>
            <li className={styles.navItem}><a href="/transactions">Transações</a></li>
            <li className={styles.navItem}><a href="/categories">Categorias</a></li>
            <li className={styles.navItem}><a href="/reports">Relatórios</a></li>
          </ul>
        </nav>
        <div className={styles.sidebarFooter}>
          <div className={styles.userProfile}>
            <div className={styles.avatar}>FF</div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>Filipe F.</span>
              <span className={styles.userPlan}>Premium</span>
            </div>
          </div>
        </div>
      </aside>
      
      <div className={styles.mainWrapper}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <GlobalFAB accounts={accounts} categories={categories} cards={cards} />
            <h1 className={styles.pageTitle}>{title}</h1>
          </div>
        </header>

        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}
