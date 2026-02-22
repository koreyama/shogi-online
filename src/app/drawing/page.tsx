import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { Metadata } from 'next';
import dynamic from 'next/dynamic';

const DrawingLobby = dynamic(() => import('./DrawingLobby'));

export const metadata: Metadata = {
    title: 'お絵かきクイズ - Asobi Lounge',
    description: 'みんなで楽しく絵を描いて、当てっこするオンラインお絵かきクイズゲームです。',
};

export default function DrawingGamePage() {
    return (
        <div>
            <DrawingLobby />
        </div>
    );
}
