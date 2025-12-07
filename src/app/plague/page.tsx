'use client';

import React, { useState, useEffect } from 'react';
import { usePlagueEngine } from '@/lib/plague/engine';
import { Globe3D } from './Globe3D';
import { TechTree } from './TechTree';
import { THEME } from './styles';
import { PageOverlay } from './PageOverlay';
import { GameEndScreen } from './GameEndScreen';
import { TitleScreen } from './TitleScreen';
import { ScanlineOverlay } from './ScanlineOverlay';
import { soundManager } from '@/lib/plague/SoundManager';
import { NewsTicker } from './NewsTicker';
import { InfectionGraph } from './InfectionGraph';

export default function PlaguePage() {
    const { gameState, evolveTrait, popBubble, resetGame, startGame, selectStartRegion } = usePlagueEngine();
    const [view, setView] = useState<'map' | 'evolution' | 'graph'>('map');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handlePop = (id: string) => {
        soundManager.playPop();
        popBubble(id);
    };

    const handleStart = () => {
        soundManager.playClick();
        startGame();
    };

    const handleSelect = (id: string) => {
        soundManager.playClick();
        selectStartRegion(id);
    };


    const totalInfected = Object.values(gameState.regions).reduce((acc, r) => acc + r.infected, 0);
    const totalDead = Object.values(gameState.regions).reduce((acc, r) => acc + r.dead, 0);

    // Format Date
    const dateStr = new Date(gameState.currentDate).toLocaleDateString('ja-JP');

    if (!mounted) return <div style={{ minHeight: '100vh', background: THEME.colors.background, color: THEME.colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: THEME.fonts.mono }}>システム初期化中...</div>;

    return (
        <div style={{
            height: '100vh',
            width: '100vw',
            background: 'radial-gradient(circle at 50% 50%, #161b22 0%, #0d1117 100%)',
            color: THEME.colors.textMain,
            fontFamily: THEME.fonts.sans,
            position: 'relative',
            overflow: 'hidden',
            display: 'flex', // Changed from grid to flex column for better height control
            flexDirection: 'column',
            gap: '0', // Remove gap to prevent overflow
        }}>
            <PageOverlay />

            {/* Title Screen */}
            {gameState.gameStatus === 'title' && (
                <TitleScreen onStart={handleStart} />
            )}

            {/* Game Over Screen */}
            {(gameState.gameStatus === 'won' || gameState.gameStatus === 'lost') && (
                <GameEndScreen
                    status={gameState.gameStatus}
                    onReset={resetGame}
                />
            )}

            {/* Header */}
            <header style={{
                ...THEME.effects.glass,
                display: 'flex',
                justifyContent: 'space-between',
                padding: '1rem 1.5rem',
                borderRadius: '4px',
                borderLeft: `4px solid ${THEME.colors.danger}`,
                zIndex: 10
            }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', color: THEME.colors.danger, textShadow: '0 0 10px rgba(255,42,109,0.5)', fontFamily: THEME.fonts.mono, letterSpacing: '2px' }}>
                        PANDEMIC<span style={{ color: THEME.colors.textMuted }}>_JP</span>
                    </h1>
                    <div style={{ fontSize: '0.9rem', color: THEME.colors.primary, fontFamily: THEME.fonts.mono, marginTop: '5px' }}>
                        日付: {dateStr}
                    </div>
                    <div style={{
                        marginTop: '8px',
                        fontSize: '0.8rem',
                        color: THEME.colors.info,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontFamily: THEME.fonts.mono
                    }}>
                        治療薬開発
                        <div style={{ width: '150px', height: '8px', background: 'rgba(0,0,0,0.5)', borderRadius: '2px', border: `1px solid ${THEME.colors.border}`, overflow: 'hidden' }}>
                            <div style={{ width: `${gameState.cureProgress}%`, height: '100%', background: THEME.colors.info, boxShadow: '0 0 10px #05d9e8' }} />
                        </div>
                        {gameState.cureProgress.toFixed(1)}%
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ color: THEME.colors.warning, fontWeight: 'bold', fontSize: '1.5rem', fontFamily: THEME.fonts.mono, textShadow: '0 0 10px rgba(245, 217, 10, 0.5)' }}>
                        DNA: {Math.floor(gameState.dnaPoints)}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: THEME.colors.textMuted, fontFamily: THEME.fonts.mono, marginTop: '8px', display: 'flex', flexDirection: 'column', alignItems: 'end' }}>
                        <div><span style={{ color: THEME.colors.danger }}>感染者: {totalInfected.toLocaleString()}</span></div>
                        <div><span style={{ color: '#777' }}>死者数: {totalDead.toLocaleString()}</span></div>
                    </div>
                </div>
            </header>

            {/* News Ticker */}
            <NewsTicker news={gameState.news} />

            {/* Main Content Area */}
            <main style={{
                flex: 1, // Grow to fill remaining space
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                overflow: 'hidden',
                padding: '1rem', // Move padding here
                minHeight: 0 // Crucial for nested flex scrolling/sizing
            }}>
                {/* View Switcher */}
                <div style={{ display: 'flex', gap: '1rem', height: '40px' }}>
                    <button
                        onClick={() => { soundManager.playClick(); setView('map'); }}
                        style={{
                            flex: 1,
                            background: view === 'map' ? 'rgba(0, 255, 157, 0.1)' : 'transparent',
                            border: `1px solid ${view === 'map' ? THEME.colors.primary : THEME.colors.border}`,
                            color: view === 'map' ? THEME.colors.primary : THEME.colors.textMuted,
                            borderRadius: '2px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            fontFamily: THEME.fonts.mono,
                            letterSpacing: '1px',
                            transition: 'all 0.3s'
                        }}
                    >
                        [A] 世界地図 (MAP)
                    </button>
                    <button
                        onClick={() => { soundManager.playClick(); setView('evolution'); }}
                        style={{
                            flex: 1,
                            background: view === 'evolution' ? 'rgba(5, 217, 232, 0.1)' : 'transparent',
                            border: `1px solid ${view === 'evolution' ? THEME.colors.info : THEME.colors.border}`,
                            color: view === 'evolution' ? THEME.colors.info : THEME.colors.textMuted,
                            borderRadius: '2px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            fontFamily: THEME.fonts.mono,
                            letterSpacing: '1px',
                            transition: 'all 0.3s'
                        }}
                    >
                        [B] 進化ラボ (LAB)
                    </button>
                    <button
                        onClick={() => { soundManager.playClick(); setView('graph'); }}
                        style={{
                            flex: 1,
                            background: view === 'graph' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                            border: `1px solid ${view === 'graph' ? '#fff' : THEME.colors.border}`,
                            color: view === 'graph' ? '#fff' : THEME.colors.textMuted,
                            borderRadius: '2px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            fontFamily: THEME.fonts.mono,
                            letterSpacing: '1px',
                            transition: 'all 0.3s'
                        }}
                    >
                        [C] 分析グラフ
                    </button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, position: 'relative', border: `1px solid ${THEME.colors.border}`, borderRadius: '4px', overflow: 'hidden' }}>
                    {view === 'map' ? (
                        <Globe3D
                            gameState={gameState}
                            onPop={handlePop}
                            onSelectRegion={handleSelect}
                        />
                    ) : view === 'evolution' ? (
                        <TechTree gameState={gameState} evolveTrait={evolveTrait} />
                    ) : (
                        <InfectionGraph gameState={gameState} />
                    )}
                </div>
            </main>

            {/* Stats Footer (Grid Item 4) */}
            <footer style={{
                padding: '0.8rem',
                background: 'rgba(0,0,0,0.3)',
                borderTop: `1px solid ${THEME.colors.border}`,
                fontSize: '0.8rem',
                color: THEME.colors.textMuted,
                fontFamily: THEME.fonts.mono,
                display: 'flex',
                justifyContent: 'space-around',
                zIndex: 10
            }}>
                <div>感染力: <span style={{ color: THEME.colors.textMain }}>{gameState.globalInfectivity.toFixed(1)}</span></div>
                <div>致死率: <span style={{ color: THEME.colors.textMain }}>{gameState.globalLethality.toFixed(1)}</span></div>
                <div>深刻度: <span style={{ color: THEME.colors.textMain }}>{gameState.globalSeverity.toFixed(1)}</span></div>
            </footer>
        </div>
    );
}
