"use client";

import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';

// Import Scenes
import { TitleScene } from './game/scenes/TitleScene';
import { MainScene } from './game/scenes/MainScene';
import { SettingsScene } from './game/scenes/SettingsScene';
import { SkillTreeScene } from './game/scenes/SkillTreeScene';
import { AchievementScene } from './game/scenes/AchievementScene';
import { CraftingScene } from './game/scenes/CraftingScene';
import { StageSelectScene } from './game/scenes/StageSelectScene';
import { RoguelikeScene } from './game/scenes/RoguelikeScene';
import { RefineryScene } from './game/scenes/RefineryScene';
import { FinanceScene } from './game/scenes/FinanceScene';
import { FacilitiesScene } from './game/scenes/FacilitiesScene';

interface TrashGameProps {
    width?: number;
    height?: number;
}

export default function TrashGame({ width = 1920, height = 1080 }: TrashGameProps) {
    const gameRef = useRef<Phaser.Game | null>(null);
    const parentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (typeof window === "undefined" || !parentRef.current) return;
        if (gameRef.current) return;

        // Custom Boot Scene to configure base URL for assets
        class BootSetup extends Phaser.Scene {
            constructor() {
                super({ key: 'BootSetup' });
            }
            preload() {
                // Set the global base URL for all loaders
                this.load.setBaseURL('/trash_assets');
            }
            create() {
                this.scene.start('TitleScene');
            }
        }

        const config: Phaser.Types.Core.GameConfig = {
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
                BootSetup, // Run this first to setup paths
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

        return () => {
            game.destroy(true);
            gameRef.current = null;
        };
    }, []);

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
