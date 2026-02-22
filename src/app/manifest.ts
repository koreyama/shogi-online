import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Asobi Lounge',
        short_name: 'AsobiLounge',
        description: 'オンラインで友達とボードゲームやパーティーゲームが遊べる無料ゲームポータル',
        start_url: '/',
        display: 'standalone',
        background_color: '#1e293b',
        theme_color: '#3b82f6',
        icons: [
            {
                src: '/icon.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'maskable',
            },
            {
                src: '/icon.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any',
            },
        ],
    };
}
