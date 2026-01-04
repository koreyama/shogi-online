import { Metadata } from 'next';

export const metadata: Metadata = {
    title: '文明育成ゲーム（クリッカー）- 無料ブラウザゲーム',
    description: '文明育成ゲームを無料でプレイ！資源を集め、建物を建て、文明を発展させよう。放置で進むクリッカー系経営シミュレーション。',
    keywords: ['文明育成', 'クリッカー', '放置ゲーム', '経営シミュレーション', '無料ゲーム', 'インクリメンタルゲーム'],
    openGraph: {
        title: '文明育成ゲーム - 無料ブラウザゲーム | Asobi Lounge',
        description: '文明育成ゲームを無料でプレイ！放置で進むクリッカー系シミュレーション。',
    },
};

export default function ClickerLayout({ children }: { children: React.ReactNode }) {
    return children;
}
