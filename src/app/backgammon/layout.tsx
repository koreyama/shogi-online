import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'バックギャモン - 無料オンライン対戦',
    description: 'バックギャモンを無料でオンライン対戦！5000年の歴史を持つ世界最古のボードゲーム。AIとの練習や友達との対戦が楽しめます。',
    keywords: ['バックギャモン', 'Backgammon', 'オンラインバックギャモン', '無料ボードゲーム', 'すごろく'],
    openGraph: {
        title: 'バックギャモン - 無料オンライン対戦 | Asobi Lounge',
        description: 'バックギャモンを無料でオンライン対戦！5000年の歴史を持つ名作。',
    },
};

export default function BackgammonLayout({ children }: { children: React.ReactNode }) {
    return children;
}
