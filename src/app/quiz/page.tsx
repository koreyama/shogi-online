import { useOnlineStatus } from '@/hooks/useOnlineStatus';
'use client';

import dynamic from 'next/dynamic';
import styles from '@/app/trump/page.module.css';

const QuizLobby = dynamic(() => import('./QuizLobby'), {
    ssr: false,
    loading: () => <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading...</p>
    </div>
});

export default function QuizPage() {
    return <QuizLobby />;
}
