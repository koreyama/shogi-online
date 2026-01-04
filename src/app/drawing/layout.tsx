import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'お絵かきクイズ - 無料オンラインゲーム',
    description: 'お絵かきクイズで友達と盛り上がろう！絵を描いて当てる無料オンラインゲーム。複数人でリアルタイムプレイ可能。',
    keywords: ['お絵かきクイズ', 'お絵かきゲーム', 'Drawing', '無料ゲーム', 'パーティーゲーム', 'オンラインゲーム'],
    openGraph: {
        title: 'お絵かきクイズ - 無料オンラインゲーム | Asobi Lounge',
        description: 'お絵かきクイズで友達と盛り上がろう！',
    },
};

export default function DrawingLayout({ children }: { children: React.ReactNode }) {
    return children;
}
