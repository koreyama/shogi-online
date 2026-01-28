'use client';
import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function OrbitGame() {
    const containerRef = useRef<HTMLDivElement>(null);
    const gameRef = useRef<any>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        let isMounted = true;
        let gameInstance: any = null;

        const initGame = async () => {
            if (!isMounted) return;

            // Dynamic import Phaser
            const Phaser = (await import('phaser')).default as any;
            const { OrbitMainScene } = await import('./game/OrbitMainScene');

            if (!isMounted) return;

            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }

            const config = {
                type: Phaser.AUTO,
                scale: {
                    mode: Phaser.Scale.FIT,
                    autoCenter: Phaser.Scale.CENTER_BOTH,
                    width: 800,
                    height: 800
                },
                backgroundColor: '#0f0c29',
                parent: containerRef.current,
                physics: {
                    default: 'matter',
                    matter: {
                        gravity: { x: 0, y: 0 },
                        enableSleeping: true,
                        debug: false
                    }
                },
                scene: [OrbitMainScene]
            };

            gameInstance = new Phaser.Game(config);
            gameRef.current = gameInstance;
        };

        initGame();

        return () => {
            isMounted = false;
            if (gameInstance) {
                gameInstance.destroy(true);
            }
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, []);

    // Effect to update user in registry if they log in
    const { user } = useAuth();
    useEffect(() => {
        if (gameRef.current && user) {
            gameRef.current.registry.set('userData', {
                uid: user.uid,
                displayName: user.displayName || 'Anonymous'
            });
        }
    }, [user]);

    return (
        <div
            ref={containerRef}
            className="w-full h-full relative"
            style={{ touchAction: 'none' }}
        />
    );
}
