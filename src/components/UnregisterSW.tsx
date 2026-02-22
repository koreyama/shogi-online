'use client';

import { useEffect } from 'react';

export default function UnregisterSW() {
    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then((registrations) => {
                for (let registration of registrations) {
                    registration.unregister();
                    console.log('Force unregistered Service Worker:', registration);
                }
            }).catch(err => {
                console.error('Failed to unregister Service Worker:', err);
            });
        }
    }, []);

    return null;
}
