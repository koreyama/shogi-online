import { Metadata } from 'next';

export const runtime = 'edge';

export const metadata: Metadata = {
    title: 'プロフィール',
    description: 'ユーザープロフィールページ',
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
    return children;
}
