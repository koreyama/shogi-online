import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'チェッカー - 無料オンライン対戦',
    description: 'チェッカー（Checkers/Draughts）を無料でオンライン対戦！AIとの練習や友達との対戦が楽しめます。シンプルながら戦略的なボードゲーム。',
    keywords: ['チェッカー', 'Checkers', 'Draughts', 'オンラインチェッカー', '無料ボードゲーム'],
    openGraph: {
        title: 'チェッカー - 無料オンライン対戦 | Asobi Lounge',
        description: 'チェッカーを無料でオンライン対戦！',
    },
};

export default function CheckersLayout({ children }: { children: React.ReactNode }) {
    return children;
}
