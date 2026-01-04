import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'ヨット（ヤッツィー）- 無料ダイスゲーム',
    description: 'ヨット（ヤッツィー）を無料でプレイ！5つのサイコロで役を作る戦略ダイスゲーム。AIとの練習や友達との対戦が楽しめます。',
    keywords: ['ヨット', 'ヤッツィー', 'Yahtzee', 'ダイスゲーム', 'サイコロゲーム', '無料ゲーム'],
    openGraph: {
        title: 'ヨット - 無料ダイスゲーム | Asobi Lounge',
        description: 'ヨットを無料でプレイ！5つのサイコロで役を作る戦略ゲーム。',
    },
};

export default function YachtLayout({ children }: { children: React.ReactNode }) {
    return children;
}
