import { useOnlineStatus } from '@/hooks/useOnlineStatus';
'use client';

import dynamic from 'next/dynamic';
import styles from '@/app/trump/page.module.css';

const TypingLobby = dynamic(() => import('./TypingLobby'), {
    ssr: false,
    loading: () => <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading...</p>
    </div>
});

export default function TypingPage() {
    return <TypingLobby />;
}
