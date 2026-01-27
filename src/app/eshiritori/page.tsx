'use client';

import dynamic from 'next/dynamic';
import styles from '@/app/trump/page.module.css';

const EshiritoriLobby = dynamic(() => import('./EshiritoriLobby'), {
    ssr: false,
    loading: () => <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        <p>読み込み中...</p>
    </div>
});

export default function EshiritoriPage() {
    return <EshiritoriLobby />;
}
