import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'バーチャルピアノ - 無料ブラウザピアノ',
    description: 'バーチャルピアノを無料でプレイ！本格的な音色でピアノ演奏を楽しめます。MIDIキーボード対応、複数の楽器音色を搭載。',
    keywords: ['ピアノ', 'バーチャルピアノ', '無料ピアノ', 'オンラインピアノ', 'ブラウザピアノ', 'MIDI'],
    openGraph: {
        title: 'バーチャルピアノ - 無料ブラウザピアノ | Asobi Lounge',
        description: 'バーチャルピアノを無料でプレイ！本格的な音色で演奏を楽しもう。',
    },
};

export default function PianoLayout({ children }: { children: React.ReactNode }) {
    return children;
}
