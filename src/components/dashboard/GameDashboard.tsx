'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    IconShogi, IconReversi, IconGomoku, IconMancala, IconChess,
    IconCards, IconPalette, IconCoin,
    IconBomb, IconTrophy
} from '@/components/Icons';
import { FloatingShapes } from '@/components/landing/FloatingShapes';
import Image from 'next/image';

// --- Local SVG Icons Definitions ---
const IconStockLocal = ({ size = 32, color = "currentColor" }: { size?: number, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="M18 9l-5 5-3-3-4 4" />
    </svg>
);
const IconConnect4Local = ({ size = 32, color = "currentColor" }: { size?: number, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="3" fill={color} stroke="none" opacity="0.5" />
        <circle cx="7" cy="7" r="1.5" fill={color} stroke="none" />
        <circle cx="17" cy="7" r="1.5" fill={color} stroke="none" />
        <circle cx="7" cy="17" r="1.5" fill={color} stroke="none" />
        <circle cx="17" cy="17" r="1.5" fill={color} stroke="none" />
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
        <path d="M12 2l-5 5h10l-5-5z" fill={color} fillOpacity="0.2" />
        <rect x="7" y="7" width="10" height="10" rx="2" />
        <path d="M12 10v4" />
        <path d="M10 12h4" />
        <path d="M12 17v2" />
    </svg>
);
const IconHoneycombLocal = ({ size = 32, color = "currentColor" }: { size?: number, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <path d="M12 8v8" />
        <path d="M12 2v20" opacity="0.1" />
    </svg>
);
const IconBackgammonLocal = ({ size = 32, color = "currentColor" }: { size?: number, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="18" rx="2" />
        <path d="M12 3v18" />
        <path d="M6 3v6l2-6" />
        <path d="M16 3l2 6v-6" />
        <path d="M6 21v-6l2 6" />
        <path d="M16 21l2-6v6" />
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
        <path d="M10 8h4" />
        <path d="M10 12h4" />
        <path d="M10 16h4" />
        <path d="M12 6v12" />
    </svg>
);
const IconHitBlowLocal = ({ size = 32, color = "currentColor" }: { size?: number, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11a9 9 0 1 0-9 9" />
        <path d="M12 2v4" />
        <circle cx="12" cy="12" r="3" />
        <path d="M12 15v.01" />
    </svg>
);
const IconDotsLocal = ({ size = 32, color = "currentColor" }: { size?: number, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8" cy="8" r="1" fill={color} />
        <circle cx="16" cy="8" r="1" fill={color} />
        <circle cx="8" cy="16" r="1" fill={color} />
        <circle cx="16" cy="16" r="1" fill={color} />
    </svg>
);
const IconDiceLocal = ({ size = 32, color = "currentColor" }: { size?: number, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="8" cy="8" r="2" fill={color} />
        <circle cx="16" cy="16" r="2" fill={color} />
        <circle cx="12" cy="12" r="2" fill={color} />
    </svg>
);
const IconPianoLocal = ({ size = 32, color = "currentColor" }: { size?: number, color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 19V6l11-2v12" />
        <circle cx="6" cy="19" r="3" />
        <circle cx="17" cy="16" r="3" />
    </svg>
);

type GameDashboardProps = {
    user: any;
    playerName: string;
    signOut: () => void;
};

export const GameDashboard: React.FC<GameDashboardProps> = ({ user, playerName, signOut }) => {
    const containerVariants: any = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
    };

    const itemVariants: any = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
    };

    return (
        <main style={{ minHeight: '100vh', background: '#f8fafc', color: '#1a202c', position: 'relative', paddingBottom: '4rem' }}>

            {/* Background */}
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
                <FloatingShapes />
            </div>

            {/* Header */}
            <motion.header
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '1rem 1.5rem',
                    background: 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(12px)',
                    position: 'sticky', top: 0, zIndex: 50,
                    borderBottom: '1px solid rgba(226, 232, 240, 0.6)'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '32px', height: '32px', position: 'relative', borderRadius: '50%', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <Image src="/icon.png" alt="Logo" fill style={{ objectFit: 'cover' }} />
                    </div>
                    <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em', color: '#1a202c' }}>
                        Asobi Lounge
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.8)', padding: '0.35rem 0.75rem', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                        {user.photoURL && (
                            <img src={user.photoURL} alt="" style={{ width: 24, height: 24, borderRadius: '50%' }} />
                        )}
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'none', paddingRight: '0.2rem' }} className="desktop-only-name">
                            {playerName}
                        </span>
                        <style jsx>{`
                 @media (min-width: 640px) {
                   .desktop-only-name { display: block !important; }
                 }
               `}</style>
                    </div>

                    <Link href={`/profile?id=${user.uid}`} title="プロフィール">
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} style={{ background: '#4299e1', color: 'white', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 5px rgba(66, 153, 225, 0.3)' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        </motion.button>
                    </Link>
                    <motion.button onClick={signOut} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} title="ログアウト" style={{ background: '#cbd5e0', color: '#4a5568', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    </motion.button>
                </div>
            </motion.header>

            <div style={{ padding: '2rem 1rem', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.div variants={itemVariants} style={{ marginBottom: '3rem' }}>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem', color: '#2d3748' }}>
                            ようこそ、<span style={{ color: '#3182ce' }}>{playerName}</span> さん
                        </h1>
                        <p style={{ color: '#718096', fontSize: '0.95rem' }}>今日はどのゲームで遊びますか？</p>

                        <Link href="/releases" style={{ textDecoration: 'none' }}>
                            <motion.div
                                whileHover={{ y: -2 }}
                                style={{
                                    marginTop: '1.5rem',
                                    background: 'white',
                                    padding: '1rem',
                                    borderRadius: '16px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                                    border: '1px solid #edf2f7',
                                    display: 'flex', alignItems: 'center', gap: '1rem',
                                    cursor: 'pointer'
                                }}
                            >
                                <span style={{
                                    background: 'linear-gradient(135deg, #4299E1 0%, #3182CE 100%)',
                                    color: 'white',
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '100px',
                                    fontSize: '0.7rem', fontWeight: 700
                                }}>
                                    NEW
                                </span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#2d3748', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        UIリニューアル & ゲームリスト大幅追加 (v2.0.0)
                                    </div>
                                </div>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e0" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                            </motion.div>
                        </Link>
                    </motion.div>

                    {/* Game Categories */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>

                        {/* Section 1: Simulation & Strategy */}
                        <GameSection
                            title="シミュレーション & 戦略"
                            color="#38a169"
                            icon={<IconTrophy size={20} color="#38a169" />}
                        >
                            <GameCard href="/stock" title="Stock Simulator" desc="本格株取引シミュ" icon={<IconStockLocal size={32} color="#38a169" />} color="#38a169" />
                            <GameCard href="/clicker" title="Civilization Builder" desc="資源管理＆文明発展" icon={<IconCoin size={32} color="#d69e2e" />} color="#d69e2e" />
                            <GameCard href="/card-game/lobby" title="Divine Duel" desc="戦略カードバトル" icon={<IconCards size={32} color="#805ad5" />} color="#805ad5" />
                        </GameSection>

                        {/* Section 2: Puzzle & Brain */}
                        <GameSection
                            title="パズル & 頭脳"
                            color="#d53f8c"
                            icon={<IconPalette size={20} color="#d53f8c" />}
                        >
                            <GameCard href="/polyomino" title="Block Territory" desc="陣取りパズル" icon={<IconPalette size={32} color="#d53f8c" />} color="#d53f8c" />
                            <GameCard href="/minesweeper" title="Minesweeper" desc="爆弾処理" icon={<IconBomb size={32} color="#e53e3e" />} color="#e53e3e" />
                            <GameCard href="/hit-and-blow" title="Hit & Blow" desc="推理ゲーム" icon={<IconHitBlowLocal size={32} color="#4299e1" />} color="#4299e1" />
                            <GameCard href="/dots-and-boxes" title="Dots & Boxes" desc="陣取り" icon={<IconDotsLocal size={32} color="#ed64a6" />} color="#ed64a6" />
                            <GameCard href="/yacht" title="Yacht" desc="ダイスポーカー" icon={<IconDiceLocal size={32} color="#ed8936" />} color="#ed8936" />
                        </GameSection>

                        {/* Section 3: Classic Board Games */}
                        <GameSection
                            title="定番ボードゲーム"
                            color="#3182ce"
                            icon={<IconChess size={20} color="#3182ce" />}
                        >
                            <GameCard href="/shogi" title="将棋" desc="" icon={<IconShogi size={32} color="#2c5282" />} color="#2c5282" />
                            <GameCard href="/chess" title="チェス" desc="" icon={<IconChess size={32} color="#2b6cb0" />} color="#2b6cb0" />
                            <GameCard href="/mahjong" title="麻雀" desc="" icon={<IconMahjongLocal size={32} color="#e53e3e" />} color="#e53e3e" />
                            <GameCard href="/reversi" title="リバーシ" desc="" icon={<IconReversi size={32} color="#1a202c" />} color="#1a202c" />
                            <GameCard href="/gomoku" title="五目並べ" desc="" icon={<IconGomoku size={32} color="#c53030" />} color="#c53030" />
                            <GameCard href="/connect4" title="Connect 4" desc="" icon={<IconConnect4Local size={32} color="#e53e3e" />} color="#e53e3e" />
                            <GameCard href="/simple-shogi" title="ファンタジー将棋" desc="簡易将棋" icon={<IconSimpleShogiLocal size={32} color="#4a5568" />} color="#4a5568" />
                            <GameCard href="/honeycomb" title="蜂の陣" desc="HoneyComb" icon={<IconHoneycombLocal size={32} color="#d69e2e" />} color="#d69e2e" />
                            <GameCard href="/checkers" title="チェッカー" desc="" icon={<IconCheckersLocal size={32} color="#e53e3e" />} color="#e53e3e" />
                            <GameCard href="/mancala" title="マンカラ" desc="" icon={<IconMancala size={32} color="#d69e2e" />} color="#d69e2e" />
                            <GameCard href="/backgammon" title="バックギャモン" desc="" icon={<IconBackgammonLocal size={32} color="#dd6b20" />} color="#dd6b20" />
                            <GameCard href="/go" title="囲碁" desc="" icon={<IconGoLocal size={32} color="#1a202c" />} color="#1a202c" />
                        </GameSection>

                        {/* Section 4: Variety */}
                        <GameSection
                            title="バラエティ"
                            color="#ed8936"
                            icon={<IconPalette size={20} color="#ed8936" />} // Replaced emoji
                        >
                            <GameCard href="/drawing" title="お絵かきクイズ" desc="みんなで描こう" icon={<IconPalette size={32} color="#d53f8c" />} color="#d53f8c" />
                            <GameCard href="/piano" title="Virtual Piano" desc="楽器演奏" icon={<IconPianoLocal size={32} color="#4a5568" />} color="#4a5568" />
                            <GameCard href="/trump" title="トランプ" desc="大富豪など" icon={<IconCards size={32} color="#c53030" />} color="#c53030" />
                        </GameSection>

                    </div>
                </motion.div>
            </div>
        </main>
    );
};

// Helper Components
const GameSection = ({ title, color, icon, children }: { title: string, color: string, icon: React.ReactNode, children: React.ReactNode }) => (
    <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {icon}
            </div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#2d3748' }}>{title}</h2>
        </div>
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: '1rem',
        }}>
            {children}
        </div>
    </section>
);

const GameCard = ({ href, title, desc, icon, color }: { href: string, title: string, desc: string, icon: React.ReactNode, color: string }) => (
    <Link href={href} style={{ textDecoration: 'none' }}>
        <motion.div
            whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.06)' }}
            whileTap={{ scale: 0.96 }}
            style={{
                background: 'white',
                borderRadius: '20px',
                padding: '1.25rem 1rem',
                textAlign: 'center',
                border: '1px solid #edf2f7',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                height: '100%',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}
        >
            <div style={{
                marginBottom: '0.75rem',
                width: '56px', height: '56px',
                borderRadius: '16px',
                background: `${color}10`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `inset 0 0 0 1px ${color}20`
            }}>
                {icon}
            </div>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#2d3748', marginBottom: desc ? '0.2rem' : '0' }}>{title}</h3>
            {desc && <p style={{ fontSize: '0.7rem', color: '#718096', fontWeight: 500 }}>{desc}</p>}
        </motion.div>
    </Link>
);
