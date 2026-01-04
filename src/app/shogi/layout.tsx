import { Metadata } from 'next';

export const metadata: Metadata = {
    title: '将棋 - 無料オンライン対戦',
    description: '将棋を無料でオンライン対戦！AIとの練習対局や友達との対戦が楽しめます。初心者から上級者まで、ブラウザだけで今すぐプレイ。',
    keywords: ['将棋', 'オンライン将棋', '無料将棋', 'AI将棋', '将棋対戦', 'ブラウザ将棋', '将棋ゲーム'],
    openGraph: {
        title: '将棋 - 無料オンライン対戦 | Asobi Lounge',
        description: '将棋を無料でオンライン対戦！AIとの練習や友達との対戦を楽しもう。',
    },
};

export default function ShogiLayout({ children }: { children: React.ReactNode }) {
    return children;
}
