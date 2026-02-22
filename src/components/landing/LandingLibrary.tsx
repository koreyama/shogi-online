'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IconShogi, IconReversi, IconGomoku, IconMancala, IconChess,
    IconCards, IconPalette, IconCoin, IconBomb, IconStar, IconRocket
} from '@/components/Icons';

// --- Local SVGs (imported from GameDashboard styles for standalone landing page) ---
const IconStockLocal = ({ size = 32, color = "currentColor" }: { size?: number, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" /><path d="M18 9l-5 5-3-3-4 4" />
    </svg>
);
const IconConnect4Local = ({ size = 32, color = "currentColor" }: { size?: number, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" fill={color} stroke="none" opacity="0.5" />
        <circle cx="7" cy="7" r="1.5" fill={color} stroke="none" /><circle cx="17" cy="7" r="1.5" fill={color} stroke="none" />
        <circle cx="7" cy="17" r="1.5" fill={color} stroke="none" /><circle cx="17" cy="17" r="1.5" fill={color} stroke="none" />
    </svg>
);
const IconCheckersLocal = ({ size = 32, color = "currentColor" }: { size?: number, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a10 10 0 0 0 0 20 10 10 0 0 0 0-20z" />
        <path d="M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
    </svg>
);
const IconSimpleShogiLocal = ({ size = 32, color = "currentColor" }: { size?: number, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l-5 5h10l-5-5z" fill={color} fillOpacity="0.2" /><rect x="7" y="7" width="10" height="10" rx="2" />
        <path d="M12 10v4" /><path d="M10 12h4" /><path d="M12 17v2" />
    </svg>
);
const IconHoneycombLocal = ({ size = 32, color = "currentColor" }: { size?: number, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <path d="M12 8v8" /><path d="M12 2v20" opacity="0.1" />
    </svg>
);
const IconBackgammonLocal = ({ size = 32, color = "currentColor" }: { size?: number, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="18" rx="2" />
        <path d="M12 3v18" /><path d="M6 3v6l2-6" /><path d="M16 3l2 6v-6" />
        <path d="M6 21v-6l2 6" /><path d="M16 21l2-6v6" />
    </svg>
);
const IconGoLocal = ({ size = 32, color = "currentColor" }: { size?: number, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" stroke={color} fill="#fff" />
        <circle cx="12" cy="12" r="4" fill={color} stroke="none" />
    </svg>
);
const IconMahjongLocal = ({ size = 32, color = "currentColor" }: { size?: number, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="4" width="14" height="16" rx="2" />
        <path d="M10 8h4" /><path d="M10 12h4" /><path d="M10 16h4" /><path d="M12 6v12" />
    </svg>
);
const IconHitBlowLocal = ({ size = 32, color = "currentColor" }: { size?: number, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11a9 9 0 1 0-9 9" /><path d="M12 2v4" /><circle cx="12" cy="12" r="3" /><path d="M12 15v.01" />
    </svg>
);
const IconDotsLocal = ({ size = 32, color = "currentColor" }: { size?: number, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8" cy="8" r="1" fill={color} /><circle cx="16" cy="8" r="1" fill={color} />
        <circle cx="8" cy="16" r="1" fill={color} /><circle cx="16" cy="16" r="1" fill={color} />
    </svg>
);
const IconGridLocal = ({ size = 32, color = "currentColor" }: { size?: number, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" />
        <line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" />
    </svg>
);
const IconDiceLocal = ({ size = 32, color = "currentColor" }: { size?: number, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="8" cy="8" r="2" fill={color} /><circle cx="16" cy="16" r="2" fill={color} /><circle cx="12" cy="12" r="2" fill={color} />
    </svg>
);
const IconPianoLocal = ({ size = 32, color = "currentColor" }: { size?: number, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 19V6l11-2v12" /><circle cx="6" cy="19" r="3" /><circle cx="17" cy="16" r="3" />
    </svg>
);
const IconBlocksLocal = ({ size = 32, color = "currentColor" }: { size?: number, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="7" height="7" rx="1" /><rect x="13" y="4" width="7" height="7" rx="1" />
        <rect x="4" y="13" width="7" height="7" rx="1" /><rect x="13" y="13" width="7" height="7" rx="1" fill={color} stroke="none" />
    </svg>
);
const IconBilliardsLocal = ({ size = 32, color = "currentColor" }: { size?: number, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /><line x1="12" y1="8" x2="12" y2="16" />
    </svg>
);
const IconFactoryLocal = ({ size = 32, color = "currentColor" }: { size?: number, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 20h20" /><path d="M6 20v-8h4v8" /><path d="M14 20v-6h4v6" />
        <path d="M6 12l2-4h2l2 4" /><path d="M14 14l2-4h2l2 4" />
        <path d="M10 4v2" /><path d="M12 2v2" /><path d="M14 4v2" />
    </svg>
);
const IconMaruBatsuLocal = ({ size = 32, color = "currentColor" }: { size?: number, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="7" cy="7" r="3" /><path d="M14 14l6 6" /><path d="M20 14l-6 6" />
        <rect x="2" y="2" width="20" height="20" rx="2" strokeOpacity="0.5" />
    </svg>
);
const IconWolfLocal = ({ size = 24, color = "currentColor" }: { size?: number, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l4 7h-8l4-7z" /><path d="M8.5 9l-1.5 6 5 3 5-3-1.5-6" />
        <circle cx="10" cy="13" r="1" fill={color} /><circle cx="14" cy="13" r="1" fill={color} />
    </svg>
);
const IconRainbowLocal = ({ size = 24, color = "currentColor" }: { size?: number, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.5 16.5c-1.5 1.26-2 3-2 3s1-1 3-3c.5-.5 1.5-1 1.5-1s-1 1.5-1 4c0 3.5 3 5.5 6 5.5 3 0 6-2 6-5.5 0-2.5-1-4-1-4s1 .5 1.5 1c2 2 3 3 3 3s-.5-1.74-2-3c-1.2-1.01-3-2-3-2s1.5.5 2.5 1c2 1 3 2 3 2s-.5-2-2-4c-1.5-2-4-5-4-5s1 2 2 4c.5 1 1 2 1 2s-2-2-4-2c-1.5 0-3 1.5-3 1.5s1-1 2.5-1c1 0 2 1 2 1s-2-2-5-2-5 3.5-5 5c0 0 1.2-.2 2.7 1z" opacity="0.5" />
        <path d="M12 2a10 10 0 0 0-10 10v4h20v-4a10 10 0 0 0-10-10z" strokeWidth="2" />
        <path d="M12 6a6 6 0 0 0-6 6v4" /><path d="M12 10a2 2 0 0 0-2 2v4" />
    </svg>
);
const IconKeyboardLocal = ({ size = 24, color = "currentColor" }: { size?: number, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <line x1="6" y1="8" x2="6" y2="8" /><line x1="10" y1="8" x2="10" y2="8" />
        <line x1="14" y1="8" x2="14" y2="8" /><line x1="18" y1="8" x2="18" y2="8" />
        <line x1="6" y1="12" x2="6" y2="12" /><line x1="10" y1="12" x2="10" y2="12" />
        <line x1="14" y1="12" x2="14" y2="12" /><line x1="18" y1="12" x2="18" y2="12" />
        <line x1="8" y1="16" x2="16" y2="16" />
    </svg>
);


const ALL_GAMES = [
    { id: 'stock', name: 'Stock Simulator', category: 'シミュレーション', desc: '本格株取引シミュ', icon: IconStockLocal, color: '#38a169' },
    { id: 'clicker', name: 'Civilization Builder', category: 'シミュレーション', desc: '資源管理＆文明発展', icon: IconCoin, color: '#d69e2e' },
    { id: 'divine-duel', name: 'Divine Duel', category: 'シミュレーション', desc: '戦略カードバトル', icon: IconCards, color: '#805ad5' },
    { id: 'quiz', name: 'Quiz Battle', category: 'シミュレーション', desc: '早押しクイズ', icon: IconRocket, color: '#e53e3e' },
    { id: 'trash', name: 'Trash Factory', category: 'シミュレーション', desc: 'ゴミ圧縮シミュ', icon: IconFactoryLocal, color: '#718096' },

    { id: 'polyomino', name: 'Block Territory', category: 'パズル', desc: '陣取りパズル', icon: IconBlocksLocal, color: '#d53f8c' },
    { id: 'minesweeper', name: 'Minesweeper', category: 'パズル', desc: '爆弾処理', icon: IconBomb, color: '#e53e3e' },
    { id: 'sudoku', name: '数独', category: 'パズル', desc: '論理パズル', icon: IconGridLocal, color: '#3b82f6' },
    { id: 'hit-and-blow', name: 'Hit & Blow', category: 'パズル', desc: '推理ゲーム', icon: IconHitBlowLocal, color: '#4299e1' },
    { id: 'dots-and-boxes', name: 'Dots & Boxes', category: 'パズル', desc: '陣取り', icon: IconDotsLocal, color: '#ed64a6' },
    { id: 'yacht', name: 'Yacht', category: 'パズル', desc: 'ダイスポーカー', icon: IconDiceLocal, color: '#ed8936' },

    { id: 'shogi', name: '将棋', category: 'ボードゲーム', desc: '定番ボードゲーム', icon: IconShogi, color: '#2c5282' },
    { id: 'chess', name: 'チェス', category: 'ボードゲーム', desc: '世界標準の戦略', icon: IconChess, color: '#2b6cb0' },
    { id: 'mahjong', name: '麻雀', category: 'ボードゲーム', desc: '本格テーブルゲーム', icon: IconMahjongLocal, color: '#e53e3e' },
    { id: 'reversi', name: 'リバーシ', category: 'ボードゲーム', desc: 'シンプル陣取り', icon: IconReversi, color: '#1a202c' },
    { id: 'gomoku', name: '五目並べ', category: 'ボードゲーム', desc: '5つ揃えて勝利', icon: IconGomoku, color: '#c53030' },
    { id: 'connect4', name: 'Connect 4', category: 'ボードゲーム', desc: '重力付4目並べ', icon: IconConnect4Local, color: '#2f855a' },
    { id: 'simple-shogi', name: 'ファンタジー将棋', category: 'ボードゲーム', desc: '簡易ルール将棋', icon: IconSimpleShogiLocal, color: '#4a5568' },
    { id: 'honeycomb', name: '蜂の陣', category: 'ボードゲーム', desc: 'Honeycomb', icon: IconHoneycombLocal, color: '#d69e2e' },
    { id: 'checkers', name: 'チェッカー', category: 'ボードゲーム', desc: '王道飛び越え', icon: IconCheckersLocal, color: '#e53e3e' },
    { id: 'mancala', name: 'マンカラ', category: 'ボードゲーム', desc: '種まき頭脳戦', icon: IconMancala, color: '#744210' },
    { id: 'backgammon', name: 'バックギャモン', category: 'ボードゲーム', desc: '最古のすごろく', icon: IconBackgammonLocal, color: '#dd6b20' },
    { id: 'go', name: '囲碁', category: 'ボードゲーム', desc: '白黒争奪戦', icon: IconGoLocal, color: '#1a202c' },
    { id: 'marubatsu', name: 'マルバツ', category: 'ボードゲーム', desc: 'Tic-Tac-Toe', icon: IconMaruBatsuLocal, color: '#e53e3e' },

    { id: 'drawing', name: 'お絵かきクイズ', category: 'パーティ', desc: 'みんなで描こう', icon: IconPalette, color: '#d53f8c' },
    { id: 'eshiritori', name: '絵しりとり', category: 'パーティ', desc: '絵で繋ぐしりとり', icon: IconPalette, color: '#f59e0b' },
    { id: 'orbit', name: 'Orbit Star', category: 'パーティ', desc: '惑星パズル', icon: IconStar, color: '#4c51bf' },
    { id: 'billiards', name: 'ビリヤード', category: 'パーティ', desc: '8-Ball Pool', icon: IconBilliardsLocal, color: '#276749' },
    { id: 'piano', name: 'Virtual Piano', category: 'パーティ', desc: 'ブラウザ楽器演奏', icon: IconPianoLocal, color: '#000000' },
    { id: 'werewolf', name: '人狼ゲーム', category: 'パーティ', desc: '役職チャット', icon: IconWolfLocal, color: '#742a2a' },
    { id: 'trump', name: '大富豪', category: 'パーティ', desc: 'トランプゲーム', icon: IconCards, color: '#c53030' },
    { id: 'rainbow', name: 'Rainbow', category: 'パーティ', desc: '色と数字のカード', icon: IconRainbowLocal, color: '#8b5cf6' },
    { id: 'typing', name: 'Typing Battle', category: 'パーティ', desc: 'タイピング', icon: IconKeyboardLocal, color: '#06b6d4' },
];

const CATEGORIES = ['すべて', 'ボードゲーム', 'パズル', 'シミュレーション', 'パーティ'];

export const LandingLibrary = ({ onLogin }: { onLogin: () => void }) => {
    const [activeTab, setActiveTab] = useState("すべて");

    const filteredGames = activeTab === "すべて"
        ? ALL_GAMES
        : ALL_GAMES.filter(g => g.category === activeTab);

    return (
        <section style={{ padding: "4rem 1.5rem 8rem", position: "relative", zIndex: 10, maxWidth: "1280px", margin: "0 auto" }} id="game-library">
            <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                <h2 style={{ fontSize: "2.5rem", fontWeight: 900, color: "#2d3748", marginBottom: "1rem" }}>
                    全33タイトル
                </h2>
                <p style={{ color: "#718096", fontSize: "1.1rem", maxWidth: "600px", margin: "0 auto" }}>
                    定番ボードからアクション、シミュレーションまで。君の好きな遊びがきっと見つかる。
                </p>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0.75rem", marginBottom: "3rem" }}>
                {CATEGORIES.map(cat => (
                    <div
                        key={cat}
                        onClick={() => setActiveTab(cat)}
                        style={{
                            position: "relative", padding: "0.6rem 1.5rem", cursor: "pointer",
                            borderRadius: "100px", fontSize: "0.95rem", fontWeight: 700,
                            color: activeTab === cat ? "white" : "#4a5568",
                            transition: "color 0.2s",
                            background: activeTab === cat ? "transparent" : "rgba(255,255,255,0.7)",
                            boxShadow: activeTab === cat ? "none" : "0 2px 4px rgba(0,0,0,0.02)"
                        }}
                    >
                        {activeTab === cat && (
                            <motion.div
                                layoutId="activeTab"
                                style={{ position: "absolute", inset: 0, background: "#3182ce", borderRadius: "100px", zIndex: -1 }}
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span style={{ position: "relative", zIndex: 1 }}>{cat}</span>
                    </div>
                ))}
            </div>

            {/* Game Grid */}
            <motion.div
                layout
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: "1.5rem",
                    gridAutoRows: "minmax(120px, auto)"
                }}
            >
                <AnimatePresence mode="popLayout">
                    {filteredGames.map((game, i) => {
                        const IconComp = game.icon;
                        return (
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3 }}
                                key={game.id}
                                onClick={onLogin}
                                whileHover={{ y: -6, scale: 1.02, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    background: "rgba(255,255,255,0.75)",
                                    backdropFilter: "blur(16px)",
                                    border: "1px solid rgba(255,255,255,0.9)",
                                    borderRadius: "24px",
                                    padding: "1.5rem",
                                    cursor: "pointer",
                                    position: "relative",
                                    overflow: "hidden",
                                    display: "flex",
                                    flexDirection: "column",
                                    boxShadow: "0 4px 6px rgba(0,0,0,0.02)"
                                }}
                            >
                                {/* Glow effect behind icon */}
                                <div style={{ position: "absolute", top: "1rem", right: "1rem", width: "100px", height: "100px", background: game.color, filter: "blur(50px)", opacity: 0.15, borderRadius: "50%", pointerEvents: "none" }} />

                                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1rem" }}>
                                    <div style={{
                                        width: "56px", height: "56px", borderRadius: "16px",
                                        background: "white", display: "flex", alignItems: "center", justifyContent: "center",
                                        boxShadow: `0 8px 16px ${game.color}20`
                                    }}>
                                        <IconComp size={32} color={game.color} />
                                    </div>
                                    <div style={{
                                        width: "32px", height: "32px", borderRadius: "50%", background: "#f7fafc",
                                        display: "flex", alignItems: "center", justifyContent: "center", color: "#a0aec0"
                                    }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
                                    </div>
                                </div>

                                <div style={{ marginTop: "auto" }}>
                                    <div style={{ fontSize: "0.7rem", fontWeight: 800, color: game.color, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "4px" }}>
                                        {game.category}
                                    </div>
                                    <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1a202c", marginBottom: "4px" }}>
                                        {game.name}
                                    </h3>
                                    <p style={{ fontSize: "0.9rem", color: "#718096", margin: 0 }}>
                                        {game.desc}
                                    </p>
                                </div>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            </motion.div>
        </section>
    );
};
