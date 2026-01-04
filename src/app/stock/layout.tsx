import { Metadata } from 'next';

export const metadata: Metadata = {
    title: '株シミュレーター - 無料投資ゲーム',
    description: '株シミュレーターで投資の世界を体験！リアルな株価変動をシミュレート。リスクなしで投資の基本を学べる無料ゲーム。',
    keywords: ['株シミュレーター', '投資ゲーム', '無料株ゲーム', '株取引練習', 'バーチャル投資'],
    openGraph: {
        title: '株シミュレーター - 無料投資ゲーム | Asobi Lounge',
        description: '株シミュレーターでリスクなしの投資体験！',
    },
};

export default function StockLayout({ children }: { children: React.ReactNode }) {
    return children;
}
