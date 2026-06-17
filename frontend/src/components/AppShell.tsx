import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import styles from './AppShell.module.css';
import { api } from '@/lib/api';

type Health = 'checking' | 'online' | 'no-model' | 'offline';

function HealthDot() {
  const [health, setHealth] = useState<Health>('checking');

  useEffect(() => {
    let alive = true;
    const check = () =>
      api
        .health()
        .then((h) => alive && setHealth(h.model_loaded ? 'online' : 'no-model'))
        .catch(() => alive && setHealth('offline'));
    check();
    const id = window.setInterval(check, 15000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const text: Record<Health, string> = {
    checking: 'Connecting…',
    online: 'Backend online',
    'no-model': 'Model not loaded',
    offline: 'Backend offline',
  };

  return (
    <span className={`${styles.health} ${styles[health]}`}>
      <span className={styles.healthDot} />
      {text[health]}
    </span>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const link = ({ isActive }: { isActive: boolean }) =>
    `${styles.navlink} ${isActive ? styles.active : ''}`;

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.bar}>
          <NavLink to="/" className={styles.brand}>
            <span className={styles.logo} />
            <span className={styles.brandText}>
              TURBOFAN<span className={styles.brandThin}>·PdM</span>
            </span>
          </NavLink>
          <nav className={styles.nav}>
            <NavLink to="/" className={link} end>
              Fleet
            </NavLink>
            <NavLink to="/simulate" className={link}>
              Live Simulation
            </NavLink>
          </nav>
          <HealthDot />
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
