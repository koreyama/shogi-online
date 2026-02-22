"use client";

import dynamic from 'next/dynamic';
import React from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

import Link from 'next/link';

// Dynamically import the game component with ssr: false because Phaser needs window
const TrashGame = dynamic(() => import('@/components/trash/TrashGame'), {
    ssr: false,
    loading: () => <div className="text-white text-center p-10">Loading Cyber Trash Press...</div>
});

export default function TrashPage() {
    return (
        <div>
            {/* Back Button Overlay */}
            <div style={{ position: 'fixed', top: 20, left: 20, zIndex: 100 }}>
                <Link href="/" className="bg-gray-800 text-white px-4 py-2 rounded shadow hover:bg-gray-700 transition" style={{ textDecoration: 'none' }}>
                    ← Back to Menu
                </Link>
            </div>

            <TrashGame />
        </div>
    );
}
