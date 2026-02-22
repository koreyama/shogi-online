import { useOnlineStatus } from '@/hooks/useOnlineStatus';
'use client';

import dynamic from 'next/dynamic';
import styles from './page.module.css';

const TrumpLobby = dynamic(() => import('@/components/trump/TrumpLobby'), {
    ssr: false,
    loading: () => <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        <p>読み込み中...</p>
    </div>
});

export default function TrumpPage() {
    return <TrumpLobby />;
}
