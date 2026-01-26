'use client';
import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { useAuth } from '@/hooks/useAuth';

export default function OrbitGame() {
    const containerRef = useRef<HTMLDivElement>(null);
    const gameRef = useRef<Phaser.Game | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        let isMounted = true;
        let gameInstance: Phaser.Game | null = null;

        const initGame = async () => {
            if (!isMounted) return;

            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }

            const { OrbitMainScene } = await import('./game/OrbitMainScene');

            if (!isMounted) return;

            const config: Phaser.Types.Core.GameConfig = {
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
                        gravity: { x: 0, y: 0 }, // No global gravity, custom radial gravity applied in-game
                        enableSleeping: true, // Allow bodies to sleep to stop jitter
                        debug: false
                    }
                },
                scene: [OrbitMainScene]
            };

            gameInstance = new Phaser.Game(config);
            gameRef.current = gameInstance;

            // Pass User to Registry
            if (gameInstance) {
                // We'll update this in a separate effect if checking for user changes, 
                // but since game init is one-off, we might need to handle auth loading.
                // For now, let's just set it. We'll add a separate effect to update registry if user logs in mid-game?
                // Actually, OrbitGame is re-mounted or we can just access current ref? 
                // Simplest: expose a method or just set registry.
            }
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
