import { Metadata } from 'next';

export const metadata: Metadata = {
    title: '五目並べ - 無料オンライン対戦',
    description: '五目並べを無料でオンライン対戦！AIとの練習や友達との対戦が楽しめます。シンプルながら奥深い戦略ゲームをブラウザで今すぐプレイ。',
    keywords: ['五目並べ', 'オンライン五目並べ', '無料五目並べ', 'AI五目並べ', '連珠', 'gomoku'],
    openGraph: {
        title: '五目並べ - 無料オンライン対戦 | Asobi Lounge',
        description: '五目並べを無料でオンライン対戦！AIとの練習や友達との対戦を楽しもう。',
    },
};

export default function GomokuLayout({ children }: { children: React.ReactNode }) {
    return children;
}
