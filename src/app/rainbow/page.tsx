import { useOnlineStatus } from '@/hooks/useOnlineStatus';
'use client';

import dynamic from 'next/dynamic';
import styles from './page.module.css';

const RainbowLobby = dynamic(() => import('@/components/rainbow/RainbowLobby'), {
    ssr: false,
    loading: () => <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        <p>読み込み中...</p>
    </div>
});

export default function RainbowPage() {
    return <RainbowLobby />;
}
