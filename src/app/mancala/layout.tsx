import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'マンカラ - 無料オンライン対戦',
    description: 'マンカラを無料でオンライン対戦！アフリカ発祥の種まきゲーム。AIとの練習や友達との対戦が楽しめます。',
    keywords: ['マンカラ', 'Mancala', 'オンラインマンカラ', '無料ボードゲーム', '種まきゲーム'],
    openGraph: {
        title: 'マンカラ - 無料オンライン対戦 | Asobi Lounge',
        description: 'マンカラを無料でオンライン対戦！アフリカ発祥の種まきゲーム。',
    },
};

export default function MancalaLayout({ children }: { children: React.ReactNode }) {
    return children;
}
