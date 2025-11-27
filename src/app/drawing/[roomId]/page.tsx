'use client';

export const runtime = 'edge';

import dynamic from 'next/dynamic';

const DrawingGameContent = dynamic(() => import('@/components/drawing/DrawingGameContent'), {
    ssr: false,
    loading: () => (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            background: '#f3f4f6',
            color: '#6b7280',
            fontSize: '1.2rem'
        }}>
            読み込み中...
        </div>
    )
});

export default function DrawingGamePage() {
    return <DrawingGameContent />;
}
