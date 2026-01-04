import { Metadata } from 'next';

export const metadata: Metadata = {
    title: '大富豪 - 無料オンライン対戦',
    description: '大富豪を無料でオンライン対戦！友達との対戦が楽しめる定番トランプゲーム。ローカルルール対応。ブラウザで今すぐプレイ。',
    keywords: ['大富豪', 'トランプ', 'カードゲーム', 'オンライン大富豪', '無料トランプ'],
    openGraph: {
        title: '大富豪 - 無料オンライン対戦 | Asobi Lounge',
        description: '大富豪を無料でオンライン対戦！友達との対戦を楽しもう。',
    },
};

export default function TrumpLayout({ children }: { children: React.ReactNode }) {
    return children;
}
