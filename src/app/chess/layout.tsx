import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'チェス - 無料オンライン対戦',
    description: 'チェスを無料でオンライン対戦！AIとの練習や友達との対戦が楽しめます。初心者向けルール解説付き。ブラウザだけで今すぐプレイ。',
    keywords: ['チェス', 'オンラインチェス', '無料チェス', 'AIチェス', 'チェス対戦', 'ブラウザチェス', 'chess'],
    openGraph: {
        title: 'チェス - 無料オンライン対戦 | Asobi Lounge',
        description: 'チェスを無料でオンライン対戦！AIとの練習や友達との対戦を楽しもう。',
    },
};

export default function ChessLayout({ children }: { children: React.ReactNode }) {
    return children;
}
