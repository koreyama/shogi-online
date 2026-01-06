'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { IconShogi, IconReversi, IconGomoku, IconMancala, IconChess, IconCards, IconPalette, IconCheckers, IconConnect4, IconSwords, IconBomb, IconCoin } from '@/components/Icons';
import { IconKing } from '@/components/SimpleShogiIcons';
import { useRoomJanitor } from '@/hooks/useRoomJanitor';
import { useAuth } from '@/hooks/useAuth';
import { LandingPage } from '@/components/landing/LandingPage';
import { GameDashboard } from '@/components/dashboard/GameDashboard';
import { usePlayer } from '@/hooks/usePlayer'; // Add import

// Custom SVG Icons
const IconCloud = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
  </svg>
);

const IconDevices = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const IconGames = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <line x1="6" y1="12" x2="6" y2="12" strokeWidth="2" strokeLinecap="round" />
    <line x1="10" y1="12" x2="10" y2="12" strokeWidth="2" strokeLinecap="round" />
    <circle cx="17" cy="10" r="1" fill="currentColor" />
    <circle cx="17" cy="14" r="1" fill="currentColor" />
  </svg>
);

const IconStock = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 3v18h18" />
    <path d="M18 9l-5 5-3-3-4 4" />
  </svg>
);


const IconBlocks = ({ size = 24, color }: { size?: number, color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="1.5">
    <rect x="4" y="4" width="7" height="7" rx="1" />
    <rect x="13" y="4" width="7" height="7" rx="1" />
    <rect x="4" y="13" width="7" height="7" rx="1" />
    <rect x="13" y="13" width="7" height="7" rx="1" fill={color || "currentColor"} stroke="none" />
  </svg>
);

const IconBackgammon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" />
    <path d="M3 13h18M12 3v18" strokeWidth="1" />
    <path d="M7 3v5l2.5 4L12 8" fill="currentColor" stroke="none" opacity="0.5" />
    <path d="M17 21v-5l-2.5-4L12 16" fill="currentColor" stroke="none" opacity="0.5" />
    <circle cx="15" cy="16" r="1.5" fill="currentColor" />
    <circle cx="9" cy="8" r="1.5" fill="currentColor" />
  </svg>
);

export default function Home() {


  const { user, signInWithGoogle, signOut, loading: authLoading } = useAuth();
  const { playerName } = usePlayer();


  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Game descriptions for hamburger menu
  const gameDescriptions = [
    { name: '将棋', category: 'ボードゲーム', description: '日本の伝統的な戦略ボードゲーム。取った駒を再利用できる「持ち駒」ルールが特徴。AIや友達とオンラインで対局できます。', color: '#2c5282' },
    { name: 'チェス', category: 'ボードゲーム', description: '世界で最も人気のあるボードゲーム。6種類の駒を使い、相手のキングをチェックメイトするのが目標です。', color: '#2b6cb0' },
    { name: 'リバーシ（オセロ）', category: 'ボードゲーム', description: '黒と白の駒を使った陣取りゲーム。相手の駒を挟んでひっくり返し、最終的に自分の色が多い方が勝ちます。', color: '#1a202c' },
    { name: '五目並べ', category: 'ボードゲーム', description: '縦・横・斜めのいずれかに5つ連続で石を並べたら勝ち。シンプルながら奥深い戦略ゲームです。', color: '#553c9a' },
    { name: 'マンカラ', category: 'ボードゲーム', description: 'アフリカ発祥の種まきゲーム。石を順番に穴に分配し、多くの石を獲得した方が勝ちです。', color: '#744210' },
    { name: 'チェッカー', category: 'ボードゲーム', description: '駒を斜めに動かして相手の駒を飛び越えて取るゲーム。キングになると動きが増えます。', color: '#c53030' },
    { name: 'コネクト4', category: 'ボードゲーム', description: '4つの駒を縦・横・斜めに並べたら勝ち。重力があるため、駒は下に落ちます。', color: '#2f855a' },
    { name: 'Divine Duel（カードゲーム）', category: 'カードゲーム', description: '三種の守護神から一人を選び、デッキを組んで戦う本格カードバトル。戦略とデッキ構築が勝敗を分けます。', color: '#d69e2e' },
    { name: 'お絵かきクイズ', category: 'パーティゲーム', description: '出題者が絵を描き、他のプレイヤーが何を描いているか当てるゲーム。友達と一緒に盛り上がれます。', color: '#d53f8c' },
    { name: '株シミュレーター', category: 'シミュレーション', description: 'リアルタイムの株価変動をシミュレートした投資ゲーム。リスクなしで投資の基本を学べます。', color: '#38a169' },
    { name: 'Civilization Builder', category: 'シミュレーション', description: 'クリッカー＆経営シミュレーションゲーム。資源を集め、建物を建て、文明を発展させましょう。', color: '#d69e2e' },
    { name: 'マインスイーパー', category: 'パズル', description: '地雷を避けながらすべてのマスを開けるパズルゲーム。数字をヒントに論理的に推理します。', color: '#4a5568' },
    { name: 'ヨット（サイコロ）', category: 'ダイスゲーム', description: '5つのサイコロを使って役を作るゲーム。ポーカーに似たルールで、最高得点を目指します。', color: '#ed8936' },
    { name: 'Hit & Blow', category: 'パズル', description: '相手が設定した4桁の数字を推理するゲーム。位置も数字も合っていればヒット、数字だけならブローです。', color: '#4299e1' },
    { name: 'Dots & Boxes', category: 'パズル', description: '点と点を線で結び、四角を完成させたら自分の陣地。戦略的な陣取りゲームです。', color: '#ed64a6' },
    { name: 'バックギャモン', category: 'ボードゲーム', description: '5000年の歴史を持つ世界最古のボードゲーム。サイコロの運と戦略が融合した遊びです。', color: '#dd6b20' },
    { name: '囲碁', category: 'ボードゲーム', description: '黒と白の石を使って陣地を取り合う、東洋の伝統的な戦略ゲーム。シンプルながら無限の奥深さがあります。', color: '#1a202c' },
  ];

  // useRoomJanitor();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (authLoading || !mounted) {
    return (
      <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#fafafa' }}>
        <div style={{ textAlign: 'center', color: '#718096' }}>Loading...</div>
      </main>
    );
  }

  // Landing page for non-logged in users
  if (!user) {
    return <LandingPage onLogin={signInWithGoogle} />;
  }

  // Logged in - show main content
  return <GameDashboard user={user} playerName={playerName} signOut={signOut} />;
}
