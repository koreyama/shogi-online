'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IconShogi, IconReversi, IconGomoku, IconMancala, IconChess,
    IconCards, IconPalette, IconCoin,
    IconBomb, IconDiscord, IconXLogo
} from '@/components/Icons';
import { FloatingShapes } from './FloatingShapes';
import { LandingLibrary } from './LandingLibrary';
import { RegisteredUserCount } from '@/components/RegisteredUserCount';
import Image from 'next/image';
import styles from './LandingPage.module.css';

// Local Definitions
const IconStockLocal = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 3v18h18" />
        <path d="M18 9l-5 5-3-3-4 4" />
    </svg>
);

const IconCloudLocal = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </svg>
);

const IconDevicesLocal = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
);

const IconGamesLocal = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <line x1="6" y1="12" x2="6" y2="12" strokeWidth="2" strokeLinecap="round" />
        <line x1="10" y1="12" x2="10" y2="12" strokeWidth="2" strokeLinecap="round" />
        <circle cx="17" cy="10" r="1" fill="currentColor" />
        <circle cx="17" cy="14" r="1" fill="currentColor" />
    </svg>
);

const IconPianoLocal = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
    </svg>
);

const IconBlocksLocal = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="2" width="20" height="20" rx="2" strokeWidth="2" />
        <path d="M12 2v20" />
        <path d="M2 12h20" />
    </svg>
);

const IconHexLocal = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    </svg>
);

const IconMahjongLocal = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <path d="M10 8h4" />
        <path d="M10 12h4" />
        <path d="M10 16h4" />
        <path d="M12 6v12" />
    </svg>
);


// Game Descriptions Data (Full 33 Games)
const gameDescriptions = [
    { name: 'Stock Simulator', category: 'Simulation & Strategy', description: '本格株取引シミュ', color: '#38a169' },
    { name: 'Civilization Builder', category: 'Simulation & Strategy', description: '資源管理＆文明発展', color: '#d69e2e' },
    { name: 'Divine Duel', category: 'Simulation & Strategy', description: '戦略カードバトル', color: '#805ad5' },
    { name: 'Quiz Battle', category: 'Simulation & Strategy', description: '早押しクイズ', color: '#e53e3e' },
    { name: 'Trash Factory', category: 'Simulation & Strategy', description: 'ゴミ圧縮シミュ', color: '#718096' },
    { name: 'Block Territory', category: 'Puzzle & Brain', description: '陣取りパズル', color: '#d53f8c' },
    { name: 'Minesweeper', category: 'Puzzle & Brain', description: '爆弾処理', color: '#e53e3e' },
    { name: '数独', category: 'Puzzle & Brain', description: '論理パズル', color: '#3b82f6' },
    { name: 'Hit & Blow', category: 'Puzzle & Brain', description: '推理ゲーム', color: '#4299e1' },
    { name: 'Dots & Boxes', category: 'Puzzle & Brain', description: '陣取り', color: '#ed64a6' },
    { name: 'Yacht', category: 'Puzzle & Brain', description: 'ダイスポーカー', color: '#ed8936' },
    { name: '将棋', category: 'Classic Board', description: '定番ボードゲーム', color: '#2c5282' },
    { name: 'チェス', category: 'Classic Board', description: '世界標準の戦略', color: '#2b6cb0' },
    { name: '麻雀', category: 'Classic Board', description: '本格テーブルゲーム', color: '#e53e3e' },
    { name: 'リバーシ', category: 'Classic Board', description: 'シンプル陣取り', color: '#1a202c' },
    { name: '五目並べ', category: 'Classic Board', description: '5つ揃えて勝利', color: '#c53030' },
    { name: 'Connect 4', category: 'Classic Board', description: '重力付4目並べ', color: '#2f855a' },
    { name: 'ファンタジー将棋', category: 'Classic Board', description: '簡易ルール将棋', color: '#4a5568' },
    { name: '蜂の陣', category: 'Classic Board', description: 'Honeycomb', color: '#d69e2e' },
    { name: 'チェッカー', category: 'Classic Board', description: '王道飛び越え', color: '#e53e3e' },
    { name: 'マンカラ', category: 'Classic Board', description: '種まき頭脳戦', color: '#744210' },
    { name: 'バックギャモン', category: 'Classic Board', description: '最古のすごろく', color: '#dd6b20' },
    { name: '囲碁', category: 'Classic Board', description: '白黒争奪戦', color: '#1a202c' },
    { name: 'マルバツ', category: 'Classic Board', description: 'Tic-Tac-Toe', color: '#e53e3e' },
    { name: 'お絵かきクイズ', category: 'Variety & Party', description: 'みんなで描こう', color: '#d53f8c' },
    { name: '絵しりとり', category: 'Variety & Party', description: '絵で繋ぐしりとり', color: '#f59e0b' },
    { name: 'Orbit Star', category: 'Variety & Party', description: '惑星パズル', color: '#4c51bf' },
    { name: 'ビリヤード', category: 'Variety & Party', description: '8-Ball Pool', color: '#276749' },
    { name: 'Virtual Piano', category: 'Variety & Party', description: 'ブラウザ楽器演奏', color: '#000000' },
    { name: '人狼ゲーム', category: 'Variety & Party', description: '役職チャット', color: '#742a2a' },
    { name: '大富豪', category: 'Variety & Party', description: 'トランプゲーム', color: '#c53030' },
    { name: 'Rainbow', category: 'Variety & Party', description: '色と数字のカード', color: '#8b5cf6' },
    { name: 'Typing Battle', category: 'Variety & Party', description: 'タイピング', color: '#06b6d4' },
];

type LandingPageProps = {
    onLogin: () => void;
};

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
    const [menuOpen, setMenuOpen] = useState(false);

    const containerVariants: any = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const itemVariants: any = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 100
            }
        }
    };

    return (
        <main style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)', color: '#1a202c', position: 'relative', overflowX: 'hidden' }}>

            <FloatingShapes />

            {/* Navigation */}
            <nav style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'clamp(0.75rem, 2vw, 1.25rem) clamp(1rem, 4vw, 2.5rem)',
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(16px)',
                borderBottom: '1px solid rgba(226, 232, 240, 0.6)',
                position: 'sticky',
                top: 0,
                zIndex: 100,
                gap: 'clamp(0.5rem, 2vw, 1rem)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {/* Hamburger Menu Button */}
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setMenuOpen(true)}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '5px'
                        }}
                        aria-label="メニューを開く"
                    >
                        <span style={{ width: '22px', height: '2px', background: '#1a202c', borderRadius: '1px' }} />
                        <span style={{ width: '22px', height: '2px', background: '#1a202c', borderRadius: '1px' }} />
                        <span style={{ width: '22px', height: '2px', background: '#1a202c', borderRadius: '1px' }} />
                    </motion.button>

                    <div style={{ fontSize: 'clamp(1.1rem, 3vw, 1.35rem)', fontWeight: 800, color: '#1a202c', letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2vw, 12px)' }}>
                        <div style={{ width: 'clamp(28px, 4vw, 36px)', height: 'clamp(28px, 4vw, 36px)', minWidth: '28px', flexShrink: 0, position: 'relative', borderRadius: '50%', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                            <Image src="/icon.png" alt="Logo" fill style={{ objectFit: 'cover' }} />
                        </div>
                        <span style={{ whiteSpace: 'nowrap' }}>Asobi Lounge</span>
                    </div>
                </div>
                <div className={styles.navRight}>
                    <div className={styles.desktopOnly}>
                        <Link href="/about" style={{ fontSize: 'clamp(0.8rem, 1.5vw, 0.875rem)', color: '#4a5568', textDecoration: 'none', fontWeight: 600 }}>
                            About
                        </Link>
                        <a href="https://discord.gg/gj7fvCBzHg" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', color: '#5865F2' }} title="Discord Community">
                            <IconDiscord size={24} color="#5865F2" />
                        </a>
                        <a href="https://x.com/GeZAN477888" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', color: 'black' }} title="Official X (Twitter)">
                            <IconXLogo size={20} color="black" />
                        </a>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onLogin}
                        style={{
                            padding: 'clamp(0.5rem, 1vw, 0.625rem) clamp(1rem, 2vw, 1.75rem)',
                            fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)',
                            background: '#1a202c',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        ログイン
                    </motion.button>
                </div>
            </nav>

            {/* Side Menu Drawer */}
            <AnimatePresence>
                {menuOpen && (
                    <>
                        {/* Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMenuOpen(false)}
                            style={{
                                position: 'fixed',
                                inset: 0,
                                background: 'rgba(0, 0, 0, 0.3)',
                                backdropFilter: 'blur(2px)',
                                zIndex: 200
                            }}
                        />
                        {/* Drawer */}
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            style={{
                                position: 'fixed',
                                left: 0,
                                top: 0,
                                bottom: 0,
                                width: '400px',
                                maxWidth: '85vw',
                                background: 'rgba(255, 255, 255, 0.98)',
                                backdropFilter: 'blur(20px)',
                                zIndex: 201,
                                overflowY: 'auto',
                                boxShadow: '10px 0 40px rgba(0, 0, 0, 0.1)'
                            }}
                        >
                            <div style={{ padding: '2rem', borderBottom: '1px solid #edf2f7', position: 'sticky', top: 0, background: 'rgba(255,255,255,0.95)', zIndex: 10 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1a202c' }}>Game List</h2>
                                    <button
                                        onClick={() => setMenuOpen(false)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            fontSize: '1.5rem',
                                            cursor: 'pointer',
                                            color: '#718096',
                                            width: '40px', height: '40px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            borderRadius: '50%',
                                            transition: 'background 0.2s'
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>
                                <p style={{ color: '#718096', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                    全 {gameDescriptions.length} タイトルのゲームを収録
                                </p>
                            </div>
                            <div style={{ padding: '1.5rem' }}>
                                {gameDescriptions.map((game, i) => (
                                    <motion.div key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        style={{
                                            padding: '1.25rem',
                                            marginBottom: '1rem',
                                            background: 'white',
                                            borderRadius: '16px',
                                            border: '1px solid #edf2f7',
                                            borderLeft: `6px solid ${game.color}`,
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                        }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                                            <span style={{
                                                fontSize: '0.7rem',
                                                padding: '0.2rem 0.6rem',
                                                background: `${game.color}15`,
                                                color: game.color,
                                                borderRadius: '100px',
                                                fontWeight: 700,
                                                letterSpacing: '0.05em'
                                            }}>
                                                {game.category}
                                            </span>
                                        </div>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a202c', marginBottom: '0.4rem' }}>
                                            {game.name}
                                        </h3>
                                        <p style={{ fontSize: '0.85rem', color: '#718096', lineHeight: 1.6 }}>
                                            {game.description}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>
                            <div className={styles.drawerFooterLinks}>
                                <Link href="/about" className={styles.drawerLink}>
                                    About
                                </Link>
                                <a href="https://discord.gg/gj7fvCBzHg" target="_blank" rel="noopener noreferrer" className={styles.drawerLink} title="Discord">
                                    <IconDiscord size={24} color="#5865F2" />
                                </a>
                                <a href="https://x.com/GeZAN477888" target="_blank" rel="noopener noreferrer" className={styles.drawerLink} title="X (Twitter)">
                                    <IconXLogo size={20} color="black" />
                                </a>
                            </div>

                            <div style={{ padding: '2rem', borderTop: '1px solid #edf2f7', background: '#f8fafc' }}>
                                <button
                                    onClick={onLogin}
                                    style={{
                                        width: '100%',
                                        padding: '1rem',
                                        background: '#1a202c',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '14px',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        fontSize: '1rem',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    ログインして遊ぶ
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Hero Section */}
            {/* Hero Section */}
            <section style={{
                padding: 'clamp(4rem, 10vw, 8rem) 1rem clamp(3rem, 6vw, 5rem)',
                maxWidth: '900px',
                margin: '0 auto',
                textAlign: 'center',
                position: 'relative',
                zIndex: 10
            }}>
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ margin: "-100px" }} // Allows fade out
                >
                    <motion.div variants={itemVariants} style={{ display: 'inline-block', padding: '0.5rem 1.5rem', background: '#ebf8ff', color: '#3182ce', borderRadius: '100px', fontWeight: 700, fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        🎉 新ゲーム続々追加中！
                    </motion.div>

                    <motion.h1
                        variants={itemVariants}
                        style={{
                            fontSize: 'clamp(3rem, 8vw, 5rem)',
                            fontWeight: 900,
                            color: '#0f172a',
                            lineHeight: 1.1,
                            marginBottom: '1.5rem',
                            letterSpacing: '-0.04em'
                        }}
                    >
                        遊びを、もっと<br />
                        <span style={{
                            background: 'linear-gradient(135deg, #ECC94B 0%, #4299E1 50%, #ED64A6 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            paddingRight: '0.1em'
                        }}>自由</span>にしよう。
                    </motion.h1>

                    <motion.p variants={itemVariants} style={{ fontSize: 'clamp(1rem, 3vw, 1.2rem)', color: '#4a5568', lineHeight: 1.7, marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem', padding: '0 0.5rem' }}>
                        インストール一切不要。ブラウザを開けばそこがゲームセンター。将棋も、カードも、パーティゲームも、全てここで。
                    </motion.p>

                    <motion.div variants={itemVariants} style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: '0 8px 24px rgba(49, 130, 206, 0.4)' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onLogin}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '1.1rem 3rem',
                                fontSize: '1.15rem',
                                background: '#3182ce',
                                color: 'white',
                                border: 'none',
                                borderRadius: '100px',
                                cursor: 'pointer',
                                fontWeight: 700,
                                boxShadow: '0 4px 16px rgba(49, 130, 206, 0.25)',
                            }}
                        >
                            今すぐ始める
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.8)' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setMenuOpen(true)}
                            style={{
                                padding: '1.1rem 2rem',
                                fontSize: '1.15rem',
                                background: 'rgba(255,255,255,0.5)',
                                color: '#2d3748',
                                border: '2px solid white',
                                borderRadius: '100px',
                                cursor: 'pointer',
                                fontWeight: 700,
                                backdropFilter: 'blur(4px)'
                            }}
                        >
                            ゲーム一覧を見る
                        </motion.button>
                    </motion.div>

                    <motion.div variants={itemVariants} style={{ marginTop: '2rem' }}>
                        <RegisteredUserCount
                            prefix="現在の登録者数: "
                            style={{
                                fontSize: '0.9rem',
                                color: '#718096',
                                fontWeight: 600,
                                display: 'inline-block',
                                padding: '0.5rem 1.5rem',
                                background: 'rgba(255,255,255,0.6)',
                                backdropFilter: 'blur(4px)',
                                borderRadius: '20px'
                            }}
                        />
                    </motion.div>
                </motion.div>
            </section>

            <LandingLibrary onLogin={onLogin} />

            {/* Features Detail Section */}
            <section style={{ background: '#ffffff', padding: '6rem 1.5rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ margin: "-100px" }}
                        style={{ textAlign: 'center', marginBottom: '5rem' }}
                    >
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#2d3748', marginBottom: '1.5rem' }}>
                            Asobi Lounge の特徴
                        </h2>
                        <p style={{ fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)', color: '#718096', maxWidth: '600px', margin: '0 auto', padding: '0 0.5rem' }}>
                            ただのゲームサイトではありません。快適に、そして長く遊べるための工夫があります。
                        </p>
                    </motion.div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem' }}>
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ margin: "-50px" }}
                            style={{ padding: '1rem' }}
                        >
                            <div style={{ width: '64px', height: '64px', background: '#ebf8ff', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3182ce', marginBottom: '1.5rem' }}>
                                <IconCloudLocal size={36} />
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem', color: '#2d3748' }}>クラウド同期</h3>
                            <p style={{ fontSize: '1rem', color: '#718096', lineHeight: 1.7 }}>
                                通勤中にスマホで進めたゲームの続きを、帰宅後にPCの大画面で。ログインするだけで、データは常に安全に同期されます。
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ margin: "-50px" }}
                            transition={{ delay: 0.1 }}
                            style={{ padding: '1rem' }}
                        >
                            <div style={{ width: '64px', height: '64px', background: '#f0fff4', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38a169', marginBottom: '1.5rem' }}>
                                <IconGamesLocal size={36} />
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem', color: '#2d3748' }}>進化するライブラリ</h3>
                            <p style={{ fontSize: '1rem', color: '#718096', lineHeight: 1.7 }}>
                                定番のボードゲームから、実験的なシミュレーションゲームまで。毎月のように新しい遊びが追加され、飽きることがありません。
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ margin: "-50px" }}
                            transition={{ delay: 0.1 }}
                            style={{ padding: '1rem' }}
                        >
                            <div style={{ width: '64px', height: '64px', background: '#fffaf0', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dd6b20', marginBottom: '1.5rem' }}>
                                <IconDevicesLocal size={36} />
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem', color: '#2d3748' }}>マルチデバイス</h3>
                            <p style={{ fontSize: '1rem', color: '#718096', lineHeight: 1.7 }}>
                                最新のブラウザ技術を駆使し、アプリのインストールなしでネイティブアプリのような快適な操作感を実現しています。
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* About Section CTA */}
            <section style={{ padding: '5rem 1.5rem', background: '#f7fafc', textAlign: 'center' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ margin: "-50px" }}
                >
                    <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#2d3748', marginBottom: '1rem' }}>
                        私たちについて
                    </h2>
                    <p style={{ color: '#718096', maxWidth: '600px', margin: '0 auto 2rem', fontSize: 'clamp(0.95rem, 2.5vw, 1.05rem)', padding: '0 0.5rem' }}>
                        Asobi Loungeは、「遊びを、もっと自由に」をテーマに開発された新しいゲームプラットフォームです。開発ストーリーをご覧ください。
                    </p>
                    <Link href="/about" style={{ textDecoration: 'none' }}>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                                padding: '1rem 2.5rem',
                                fontSize: '1rem',
                                background: 'white',
                                color: '#4a5568',
                                border: '2px solid #cbd5e0',
                                borderRadius: '100px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            もっと詳しく知る
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                        </motion.button>
                    </Link>
                </motion.div>
            </section>

            {/* Footer CTA */}
            <section style={{ padding: '6rem 1.5rem', background: '#1a202c', color: 'white', textAlign: 'center' }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ margin: "-50px" }}
                >
                    <h2 style={{ fontSize: 'clamp(1.8rem, 6vw, 2.5rem)', fontWeight: 900, marginBottom: '1.5rem', whiteSpace: 'nowrap' }}>
                        さあ、はじめよう。
                    </h2>
                    <p style={{ color: '#cbd5e0', marginBottom: '3rem', fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)', padding: '0 0.5rem' }}>
                        必要なのはGoogleアカウントだけ。今すぐ無料で、すべてのゲームにアクセスできます。
                    </p>
                    <button
                        onClick={onLogin}
                        style={{
                            padding: '1.2rem 3.5rem',
                            fontSize: '1.1rem',
                            background: 'white',
                            color: '#1a202c',
                            border: 'none',
                            borderRadius: '16px',
                            cursor: 'pointer',
                            fontWeight: 800,
                            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                            transition: 'transform 0.2s'
                        }}
                    >
                        Googleでログイン
                    </button>
                    <div style={{ marginTop: '4rem', opacity: 0.6, fontSize: '0.9rem' }}>
                        &copy; {new Date().getFullYear()} Asobi Lounge. All rights reserved.
                    </div>
                </motion.div>
            </section>

        </main>
    );
};
