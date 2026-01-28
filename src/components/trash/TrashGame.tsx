'use client';

import React, { useEffect, useRef } from 'react';
// Remove static imports to prevent SSR/Build errors with Phaser
// import Phaser from 'phaser'; 
// Scenes will be imported dynamically

interface TrashGameProps {
    width?: number;
    height?: number;
}

export default function TrashGame({ width = 1920, height = 1080 }: TrashGameProps) {
    const gameRef = useRef<any>(null);
    const parentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (typeof window === "undefined" || !parentRef.current) return;
        if (gameRef.current) return;

        const initGame = async () => {
            // Dynamic imports
            const Phaser = (await import('phaser')).default as any;
            const { TitleScene } = await import('./game/scenes/TitleScene');
            const { MainScene } = await import('./game/scenes/MainScene');
            const { SettingsScene } = await import('./game/scenes/SettingsScene');
            const { SkillTreeScene } = await import('./game/scenes/SkillTreeScene');
            const { AchievementScene } = await import('./game/scenes/AchievementScene');
            const { CraftingScene } = await import('./game/scenes/CraftingScene');
            const { StageSelectScene } = await import('./game/scenes/StageSelectScene');
            const { RoguelikeScene } = await import('./game/scenes/RoguelikeScene');
            const { RefineryScene } = await import('./game/scenes/RefineryScene');
            const { FinanceScene } = await import('./game/scenes/FinanceScene');
            const { FacilitiesScene } = await import('./game/scenes/FacilitiesScene');

            // Custom Boot Scene
            class BootSetup extends Phaser.Scene {
                constructor() {
                    super({ key: 'BootSetup' });
                }
                preload() {
                    this.load.setBaseURL('/trash_assets');
                }
                create() {
                    this.scene.start('TitleScene');
                }
            }

            const config = {
                type: Phaser.WEBGL,
                width: width,
                height: height,
                backgroundColor: '#9b9b9bff',
                parent: parentRef.current,
                physics: {
                    default: 'matter',
                    matter: {
                        debug: false,
                        gravity: { x: 0, y: 1 },
                        enableSleeping: true,
                        positionIterations: 4,
                        velocityIterations: 2,
                        constraintIterations: 1,
                    }
                },
                scene: [
                    BootSetup,
                    TitleScene,
                    MainScene,
                    SkillTreeScene,
                    AchievementScene,
                    CraftingScene,
                    SettingsScene,
                    StageSelectScene,
                    RoguelikeScene,
                    RefineryScene,
                    FinanceScene,
                    FacilitiesScene
                ],
                scale: {
                    mode: Phaser.Scale.FIT,
                    autoCenter: Phaser.Scale.CENTER_BOTH,
                    width: width,
                    height: height
                },
                render: {
                    antialias: true,
                    pixelArt: false,
                    roundPixels: false,
                    powerPreference: 'high-performance',
                    batchSize: 4096,
                    maxLights: 10
                },
                fps: {
                    target: 60,
                    forceSetTimeOut: false
                },
                disableContextMenu: true
            };

            const game = new Phaser.Game(config);
            gameRef.current = game;
        };

        initGame();

        return () => {
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, [width, height]);

    return (
        <div
            ref={parentRef}
            style={{
                width: '100%',
                height: '100dvh',
                overflow: 'hidden',
                position: 'fixed',
                top: 0,
                left: 0,
                background: '#000'
            }}
        />
    );
}
