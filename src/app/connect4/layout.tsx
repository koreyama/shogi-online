import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'コネクト4 - 無料オンライン対戦',
    description: 'コネクト4を無料でオンライン対戦！4つ並べたら勝ち。AIとの練習や友達との対戦が楽しめます。ブラウザで今すぐプレイ。',
    keywords: ['コネクト4', 'Connect4', '4目並べ', 'オンラインコネクト4', '無料ゲーム'],
    openGraph: {
        title: 'コネクト4 - 無料オンライン対戦 | Asobi Lounge',
        description: 'コネクト4を無料でオンライン対戦！',
    },
};

export default function Connect4Layout({ children }: { children: React.ReactNode }) {
    return children;
}
