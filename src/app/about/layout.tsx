import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Asobi Loungeについて',
    description: 'Asobi Loungeは無料のオンラインボードゲームプラットフォームです。開発者情報、ビジョン、今後の展望についてご紹介します。',
    keywords: ['Asobi Lounge', 'アソビラウンジ', 'ボードゲーム', '無料ゲーム', '開発者'],
    openGraph: {
        title: 'Asobi Loungeについて',
        description: '無料オンラインボードゲームプラットフォーム。開発者情報とビジョン。',
    },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
    return children;
}
