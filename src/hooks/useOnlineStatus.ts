import { useState, useEffect } from 'react';

// クライアント側でネットワークのオンライン/オフライン状態を監視するフック
export function useOnlineStatus() {
    const [isOnline, setIsOnline] = useState<boolean>(true); // 初期値は暫定true（SSR回避のためuseEffect内で実際の値をセット）

    useEffect(() => {
        // マウント時の実際のステータス取得
        setIsOnline(navigator.onLine);

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return isOnline;
}
