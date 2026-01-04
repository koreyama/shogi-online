import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'マインスイーパー - 無料ブラウザゲーム',
    description: 'マインスイーパーを無料でプレイ！クラシックなパズルゲームをブラウザで楽しめます。初級・中級・上級の3つの難易度。',
    keywords: ['マインスイーパー', 'Minesweeper', '無料パズル', 'ブラウザゲーム', '論理パズル'],
    openGraph: {
        title: 'マインスイーパー - 無料ブラウザゲーム | Asobi Lounge',
        description: 'マインスイーパーを無料でプレイ！クラシックなパズルゲーム。',
    },
};

export default function MinesweeperLayout({ children }: { children: React.ReactNode }) {
    return children;
}
