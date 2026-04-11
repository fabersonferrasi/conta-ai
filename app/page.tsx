"use client";

import React from 'react';
import styles from './page.module.css';
import { Card } from '../components/ui/Card/Card';
import { Button } from '../components/ui/Button/Button';

export default function Home() {
  return (
    <main className={styles.main}>
      <Card className={styles.loginCard}>
        <div className={styles.header}>
          <h1 className={`${styles.logo} text-gradient`}>Conta Aí</h1>
          <p className={styles.subtitle}>Gestão financeira de alto nível</p>
        </div>

        <form className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="email">E-mail</label>
            <input 
              type="email" 
              id="email" 
              className={styles.input} 
              placeholder="seu@email.com"
              required 
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="password">Senha</label>
            <input 
              type="password" 
              id="password" 
              className={styles.input} 
              placeholder="••••••••"
              required 
            />
          </div>

          <div className={styles.actions}>
            <Button fullWidth type="button" onClick={() => alert('Autenticação será implementada em breve!')}>
              Entrar
            </Button>
          </div>
        </form>

        <div className={styles.footer}>
          Não tem uma conta? <a href="#" className="text-gradient" style={{ fontWeight: 600 }}>Cadastre-se</a>
        </div>
      </Card>
    </main>
  );
}
