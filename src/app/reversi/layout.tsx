import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'リバーシ（オセロ）- 無料オンライン対戦',
    description: 'リバーシ（オセロ）を無料でオンライン対戦！AIとの練習や友達との対戦が楽しめます。戦略性抜群のボードゲームをブラウザで今すぐプレイ。',
    keywords: ['リバーシ', 'オセロ', 'オンラインリバーシ', '無料オセロ', 'AIオセロ', 'リバーシ対戦', 'reversi'],
    openGraph: {
        title: 'リバーシ（オセロ）- 無料オンライン対戦 | Asobi Lounge',
        description: 'リバーシを無料でオンライン対戦！AIとの練習や友達との対戦を楽しもう。',
    },
};

export default function ReversiLayout({ children }: { children: React.ReactNode }) {
    return children;
}
