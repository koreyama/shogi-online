import { Metadata } from 'next';

export const metadata: Metadata = {
    title: '麻雀 - 無料オンライン対戦',
    description: '麻雀を無料でオンライン対戦！3人打ち・4人打ち対応。AIとの練習や友達との対戦が楽しめます。初心者向けルール解説付き。',
    keywords: ['麻雀', 'オンライン麻雀', '無料麻雀', 'AI麻雀', '麻雀対戦', 'ブラウザ麻雀', 'mahjong'],
    openGraph: {
        title: '麻雀 - 無料オンライン対戦 | Asobi Lounge',
        description: '麻雀を無料でオンライン対戦！3人打ち・4人打ち対応。',
    },
};

export default function MahjongLayout({ children }: { children: React.ReactNode }) {
    return children;
}
