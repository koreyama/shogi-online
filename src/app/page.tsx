'use client';

import Link from 'next/link';
import styles from './page.module.css';

export default function Lobby() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Asobi Lounge</h1>
      <p className={styles.subtitle}>遊びたいゲームを選んでください</p>

      <div className={styles.gameGrid}>
        <Link href="/shogi" className={styles.gameCard}>
          <div className={styles.cardContent}>
            <div className={styles.iconWrapper}>
              <span className={styles.shogiIcon}>将</span>
            </div>
            <h2>将棋</h2>
            <p>日本の伝統的なボードゲーム</p>
          </div>
        </Link>

        <Link href="/othello" className={styles.gameCard}>
          <div className={styles.cardContent}>
            <div className={styles.iconWrapper}>
              <span className={styles.othelloIcon}>●</span>
            </div>
            <h2>オセロ</h2>
            <p>シンプルで奥深い戦略ゲーム</p>
          </div>
        </Link>
      </div>
    </main>
  );
}
