import React from 'react';
import Link from 'next/link';
import styles from '../../app/dashboard/layout.module.css';
import { prisma } from '../../lib/prisma';
import { GlobalFAB } from '../ui/GlobalFAB';
import { ThemeToggle } from '../ui/ThemeToggle';
import { BottomNav } from './BottomNav';

const navItems = [
  { href: '/dashboard', label: 'Visao Geral' },
  { href: '/accounts', label: 'Contas Correntes' },
  { href: '/cards', label: 'Cartoes de Credito' },
  { href: '/transactions', label: 'Transacoes' },
  { href: '/categories', label: 'Categorias' },
  { href: '/reports', label: 'Relatorios' },
];

export default async function AppLayout({ children, title }: { children: React.ReactNode; title: string }) {
  const accounts = await prisma.account.findMany({ orderBy: { name: 'asc' } });
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  const cards = await prisma.creditCard.findMany({ orderBy: { name: 'asc' } });

  return (
    <div className={styles.appContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2 className="text-gradient" style={{ fontSize: '1.5rem', fontWeight: 700 }}>Conta Ai</h2>
        </div>

        <nav className={styles.nav}>
          <ul className={styles.navList}>
            {navItems.map((item) => (
              <li key={item.href} className={styles.navItem}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
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
          <div className={styles.topbarRight}>
            <ThemeToggle />
          </div>
        </header>

        <main className={styles.content}>
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
