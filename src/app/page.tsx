'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { IconShogi, IconReversi, IconGomoku, IconMancala, IconChess, IconCards, IconPalette, IconCheckers, IconConnect4, IconSwords, IconBomb, IconCoin } from '@/components/Icons';
import { IconKing } from '@/components/SimpleShogiIcons';
import { useRoomJanitor } from '@/hooks/useRoomJanitor';
import { useAuth } from '@/hooks/useAuth';
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
    return (
      <main style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)', color: '#1a202c' }}>
        {/* Navigation */}
        <nav style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem 2.5rem',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Hamburger Menu Button */}
            <button
              onClick={() => setMenuOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
              aria-label="メニューを開く"
            >
              <span style={{ width: '20px', height: '2px', background: '#1a202c', borderRadius: '1px' }} />
              <span style={{ width: '20px', height: '2px', background: '#1a202c', borderRadius: '1px' }} />
              <span style={{ width: '20px', height: '2px', background: '#1a202c', borderRadius: '1px' }} />
            </button>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1a202c', letterSpacing: '-0.03em' }}>Asobi Lounge</div>
          </div>
          <button
            onClick={signInWithGoogle}
            style={{
              padding: '0.625rem 1.5rem',
              fontSize: '0.875rem',
              background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
              transition: 'all 0.2s ease'
            }}
          >
            ログイン
          </button>
        </nav>

        {/* Slide-out Game Menu */}
        {menuOpen && (
          <>
            {/* Overlay */}
            <div
              onClick={() => setMenuOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                zIndex: 200
              }}
            />
            {/* Drawer */}
            <div style={{
              position: 'fixed',
              left: 0,
              top: 0,
              bottom: 0,
              width: '340px',
              maxWidth: '85vw',
              background: 'white',
              zIndex: 201,
              overflowY: 'auto',
              boxShadow: '4px 0 24px rgba(0, 0, 0, 0.15)'
            }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid #edf2f7' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1a202c' }}>ゲーム一覧</h2>
                  <button
                    onClick={() => setMenuOpen(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '1.5rem',
                      cursor: 'pointer',
                      color: '#718096',
                      lineHeight: 1
                    }}
                  >
                    ×
                  </button>
                </div>
                <p style={{ color: '#718096', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  16種類以上のゲームを無料で楽しめます
                </p>
              </div>
              <div style={{ padding: '1rem' }}>
                {gameDescriptions.map((game, i) => (
                  <div key={i} style={{
                    padding: '1rem',
                    marginBottom: '0.75rem',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    borderLeft: `4px solid ${game.color}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{
                        fontSize: '0.65rem',
                        padding: '0.15rem 0.5rem',
                        background: game.color,
                        color: 'white',
                        borderRadius: '100px',
                        fontWeight: 600
                      }}>
                        {game.category}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1a202c', marginBottom: '0.35rem' }}>
                      {game.name}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: '#4a5568', lineHeight: 1.5 }}>
                      {game.description}
                    </p>
                  </div>
                ))}
              </div>
              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #edf2f7', background: '#f8fafc' }}>
                <button
                  onClick={signInWithGoogle}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    background: '#1a202c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.95rem'
                  }}
                >
                  ログインして遊ぶ
                </button>
              </div>
            </div>
          </>
        )}

        {/* Hero Section */}
        <section style={{
          padding: '3.5rem 2rem 2rem',
          maxWidth: '700px',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h1 style={{
              fontSize: 'clamp(2rem, 6vw, 3rem)',
              fontWeight: 900,
              color: '#0f172a',
              lineHeight: 1.2,
              marginBottom: '0.75rem',
              letterSpacing: '-0.04em'
            }}>
              遊びを、
              <span style={{
                background: 'linear-gradient(135deg, #3182ce 0%, #805ad5 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>はじめよう。</span>
            </h1>
            <p style={{
              fontSize: '0.95rem',
              color: '#64748b',
              lineHeight: 1.5,
              marginBottom: '1.25rem'
            }}>
              ボードゲームからシミュレーションまで。ブラウザだけでOK。
            </p>

            <button
              onClick={signInWithGoogle}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.75rem',
                fontSize: '0.95rem',
                background: '#0f172a',
                color: 'white',
                border: 'none',
                borderRadius: '100px',
                cursor: 'pointer',
                fontWeight: 600,
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
                transition: 'all 0.2s ease'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              無料で始める
            </button>
            <p style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: '#94a3b8' }}>
              登録不要・インストール不要
            </p>
          </div>
        </section>

        {/* Game Preview Grid */}
        <section style={{ padding: '0 1.5rem 3rem' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.75rem',
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            {[
              { icon: <IconShogi size={28} color="#2c5282" />, name: '将棋', color: '#ebf4ff' },
              { icon: <IconChess size={28} color="#2b6cb0" />, name: 'チェス', color: '#ebf4ff' },
              { icon: <IconReversi size={28} color="#1a202c" />, name: 'リバーシ', color: '#f1f5f9' },
              { icon: <IconStock size={28} />, name: '株取引', color: '#f0fff4' },
              { icon: <IconPalette size={28} color="#d53f8c" />, name: 'お絵かき', color: '#fdf2f8' },
              { icon: <IconCoin size={28} color="#d69e2e" />, name: '文明育成', color: '#fffbeb' },
            ].map((item, i) => (
              <div key={i} style={{
                background: item.color,
                borderRadius: '16px',
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                transition: 'transform 0.15s ease',
                cursor: 'default'
              }}>
                {item.icon}
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>{item.name}</span>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.8rem', color: '#94a3b8' }}>
            他にも多数のゲームを収録
          </p>
        </section>

        {/* Features Section */}
        <section style={{
          background: '#f7fafc',
          padding: '4rem 1.5rem',
          borderTop: '1px solid #edf2f7'
        }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              color: '#1a202c',
              textAlign: 'center',
              marginBottom: '3rem'
            }}>
              Asobi Lounge の特徴
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '2rem'
            }}>
              <div style={{ textAlign: 'center', padding: '1.5rem', background: 'white', borderRadius: '16px', border: '1px solid #edf2f7', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  background: '#ebf4ff',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                  color: '#3182ce'
                }}>
                  <IconCloud size={28} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1a202c' }}>
                  クラウド保存
                </h3>
                <p style={{ color: '#718096', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  対局データや進行状況はクラウドに自動保存。<br />
                  PCで遊んでいた続きを、移動中にスマホで楽しめます。
                </p>
              </div>
              <div style={{ textAlign: 'center', padding: '1.5rem', background: 'white', borderRadius: '16px', border: '1px solid #edf2f7', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  background: '#f0fff4',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                  color: '#38a169'
                }}>
                  <IconGames size={28} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1a202c' }}>
                  多彩なラインナップ
                </h3>
                <p style={{ color: '#718096', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  将棋、チェスから経済シミュ、パズルまで。<br />
                  飽きることのない豊富なゲームを提供します。
                </p>
              </div>
              <div style={{ textAlign: 'center', padding: '1.5rem', background: 'white', borderRadius: '16px', border: '1px solid #edf2f7', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  background: '#fffaf0',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                  color: '#dd6b20'
                }}>
                  <IconDevices size={28} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1a202c' }}>
                  会員登録・設定不要
                </h3>
                <p style={{ color: '#718096', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  Googleアカウントだけで始められます。<br />
                  インストールは一切不要、ブラウザだけで完結。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section style={{
          background: '#1a202c',
          padding: '5rem 1.5rem',
          textAlign: 'center',
          color: 'white'
        }}>
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            marginBottom: '1rem'
          }}>
            さあ、対局を始めましょう。
          </h2>
          <p style={{ color: '#a0aec0', marginBottom: '2.5rem', fontSize: '1rem', maxWidth: '500px', margin: '0 auto 2.5rem' }}>
            すべてのゲームが無料で解放されています。<br />
            Googleログインでお絵かきクイズや協力プレイに参加。
          </p>
          <button
            onClick={signInWithGoogle}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem 2.5rem',
              fontSize: '1.05rem',
              background: 'white',
              color: '#1a202c',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 700,
              boxShadow: '0 4px 14px rgba(255, 255, 255, 0.1)',
              transition: 'all 0.2s ease'
            }}
          >
            Googleでログイン
          </button>
        </section>
      </main>
    );
  }

  // Logged in - show main content
  return (
    <main className={styles.main}>
      <header className={styles.hero} style={{ padding: '1.5rem 1rem' }}>
        <div style={{
          position: 'absolute',
          top: '0.75rem',
          right: '0.75rem',
          zIndex: 20
        }}>
          <div style={{
            display: 'flex',
            gap: '0.4rem',
            alignItems: 'center',
            background: 'rgba(255,255,255,0.95)',
            padding: '0.4rem 0.75rem',
            borderRadius: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            {user.photoURL && <img src={user.photoURL} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />}
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#2d3748', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{playerName}</span>
            <Link href={`/profile/${user.uid}`} style={{ textDecoration: 'none' }}>
              <button
                style={{
                  padding: '0.25rem 0.6rem',
                  fontSize: '0.7rem',
                  background: '#4A90E2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  marginRight: '5px'
                }}
              >
                プロフィール
              </button>
            </Link>
            <button
              onClick={signOut}
              style={{
                padding: '0.25rem 0.6rem',
                fontSize: '0.7rem',
                background: '#e53e3e',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer'
              }}
            >
              ログアウト
            </button>
          </div>
        </div>
        <h1 className={styles.title} style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)' }}>Asobi Lounge</h1>
        <p className={styles.subtitle} style={{ fontSize: 'clamp(0.85rem, 2.5vw, 1rem)' }}>
          オンラインゲームプラットフォーム
        </p>
      </header>

      <section style={{ maxWidth: '1200px', margin: '0 auto 1.5rem', padding: '0 1rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: '#2d3748', borderLeft: '3px solid #3182ce', paddingLeft: '0.75rem' }}>最新情報</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link href="/blog/clicker-game-release" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.7rem', color: '#718096' }}>2025.12.05</span>
              <span style={{ background: '#3182ce', color: '#fff', fontSize: '0.6rem', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>NEW</span>
              <span style={{ color: '#2d3748', fontWeight: '600', fontSize: '0.85rem' }}>Civilization Builder リリース</span>
            </div>
          </Link>
          <Link href="/polyomino" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.7rem', color: '#718096' }}>2025.12.07</span>
              <span style={{ background: '#3182ce', color: '#fff', fontSize: '0.6rem', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>NEW</span>
              <span style={{ color: '#2d3748', fontWeight: '600', fontSize: '0.85rem' }}>Block Territory リリース</span>
            </div>
          </Link>
        </div>
      </section>


      {/* Game Categories */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem 4rem', display: 'flex', flexDirection: 'column', gap: '3rem' }}>

        {/* Simulation & Strategy */}
        <section>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#2d3748', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '6px', height: '24px', background: '#38a169', borderRadius: '3px' }}></span>
            シミュレーション & 戦略
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '1rem'
          }}>
            <Link href="/stock" style={{ textDecoration: 'none' }}>
              <div style={{ background: 'white', border: '2px solid #38a169', borderRadius: '12px', padding: '1rem 0.5rem', textAlign: 'center', position: 'relative', height: '100%', transition: 'transform 0.2s' }}>

                <IconStock size={40} />
                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#1a202c', marginTop: '0.5rem' }}>Stock Simulator</div>
                <div style={{ fontSize: '0.65rem', color: '#718096', marginTop: '0.2rem' }}>本格株取引シミュ</div>
              </div>
            </Link>

            <Link href="/clicker" style={{ textDecoration: 'none' }}>
              <div style={{ background: 'white', border: '2px solid #38a169', borderRadius: '12px', padding: '1rem 0.5rem', textAlign: 'center', position: 'relative', height: '100%', transition: 'transform 0.2s' }}>

                <IconCoin size={40} color="#ecc94b" />
                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#1a202c', marginTop: '0.5rem' }}>Civilization Builder</div>
                <div style={{ fontSize: '0.65rem', color: '#718096', marginTop: '0.2rem' }}>資源管理＆文明発展</div>
              </div>
            </Link>

            <Link href="/card-game/lobby" style={{ textDecoration: 'none' }}>
              <div style={{ background: 'white', border: '2px solid #38a169', borderRadius: '12px', padding: '1rem 0.5rem', textAlign: 'center', position: 'relative', height: '100%', transition: 'transform 0.2s' }}>

                <IconSwords size={40} color="#805ad5" />
                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#1a202c', marginTop: '0.5rem' }}>Divine Duel</div>
                <div style={{ fontSize: '0.65rem', color: '#718096', marginTop: '0.2rem' }}>戦略カードバトル</div>
              </div>
            </Link>
          </div>
        </section>

        {/* Puzzle & Brain */}
        <section>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#2d3748', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '6px', height: '24px', background: '#d53f8c', borderRadius: '3px' }}></span>
            パズル & 頭脳
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: '0.75rem'
          }}>
            <Link href="/polyomino" style={{ textDecoration: 'none' }}>
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 0.5rem', textAlign: 'center', height: '100%' }}>
                <div style={{ marginBottom: '0.5rem' }}><IconBlocks size={36} color="#d53f8c" /></div>
                <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#1a202c' }}>Block Territory</div>
                <div style={{ fontSize: '0.6rem', color: '#718096', marginTop: '0.2rem' }}>陣取りパズル</div>
              </div>
            </Link>

            <Link href="/minesweeper" style={{ textDecoration: 'none' }}>
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 0.5rem', textAlign: 'center', height: '100%' }}>
                <div style={{ marginBottom: '0.5rem' }}><IconBomb size={36} color="#e53e3e" /></div>
                <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#1a202c' }}>マインスイーパー</div>
                <div style={{ fontSize: '0.6rem', color: '#718096', marginTop: '0.2rem' }}>爆弾処理ゲーム</div>
              </div>
            </Link>

            <Link href="/hit-and-blow" style={{ textDecoration: 'none' }}>
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 0.5rem', textAlign: 'center', height: '100%' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#4299e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#1a202c' }}>Hit & Blow</div>
                <div style={{ fontSize: '0.6rem', color: '#718096', marginTop: '0.2rem' }}>推理ゲーム</div>
              </div>
            </Link>

            <Link href="/dots-and-boxes" style={{ textDecoration: 'none' }}>
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 0.5rem', textAlign: 'center', height: '100%' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ed64a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                    <circle cx="15.5" cy="8.5" r="1.5" fill="currentColor" />
                    <circle cx="8.5" cy="15.5" r="1.5" fill="currentColor" />
                    <circle cx="15.5" cy="15.5" r="1.5" fill="currentColor" />
                    <line x1="8.5" y1="8.5" x2="15.5" y2="8.5" />
                    <line x1="8.5" y1="8.5" x2="8.5" y2="15.5" />
                  </svg>
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#1a202c' }}>Dots & Boxes</div>
                <div style={{ fontSize: '0.6rem', color: '#718096', marginTop: '0.2rem' }}>陣取りゲーム</div>
              </div>
            </Link>

            <Link href="/yacht" style={{ textDecoration: 'none' }}>
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 0.5rem', textAlign: 'center', height: '100%' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ed8936" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <circle cx="8" cy="8" r="2" fill="currentColor" />
                    <circle cx="16" cy="16" r="2" fill="currentColor" />
                    <circle cx="8" cy="16" r="2" fill="currentColor" />
                    <circle cx="16" cy="8" r="2" fill="currentColor" />
                    <circle cx="12" cy="12" r="2" fill="currentColor" />
                  </svg>
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#1a202c' }}>Yacht</div>
                <div style={{ fontSize: '0.6rem', color: '#718096', marginTop: '0.2rem' }}>サイコロポーカー</div>
              </div>
            </Link>
          </div>
        </section>

        {/* Classic Board Games */}
        <section>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#2d3748', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '6px', height: '24px', background: '#3182ce', borderRadius: '3px' }}></span>
            定番ボードゲーム
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: '0.75rem'
          }}>
            <Link href="/shogi" style={{ textDecoration: 'none' }}>
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 0.5rem', textAlign: 'center', height: '100%' }}>
                <div style={{ marginBottom: '0.3rem' }}><IconShogi size={32} color="#2c5282" /></div>
                <div style={{ fontWeight: 600, fontSize: '0.75rem', color: '#1a202c' }}>将棋</div>
              </div>
            </Link>
            <Link href="/chess" style={{ textDecoration: 'none' }}>
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 0.5rem', textAlign: 'center', height: '100%' }}>
                <div style={{ marginBottom: '0.3rem' }}><IconChess size={32} color="#2b6cb0" /></div>
                <div style={{ fontWeight: 600, fontSize: '0.75rem', color: '#1a202c' }}>チェス</div>
              </div>
            </Link>
            <Link href="/reversi" style={{ textDecoration: 'none' }}>
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 0.5rem', textAlign: 'center', height: '100%' }}>
                <div style={{ marginBottom: '0.3rem' }}><IconReversi size={32} color="#1a202c" /></div>
                <div style={{ fontWeight: 600, fontSize: '0.75rem', color: '#1a202c' }}>リバーシ</div>
              </div>
            </Link>
            <Link href="/gomoku" style={{ textDecoration: 'none' }}>
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 0.5rem', textAlign: 'center', height: '100%' }}>
                <div style={{ marginBottom: '0.3rem' }}><IconGomoku size={32} color="#c53030" /></div>
                <div style={{ fontWeight: 600, fontSize: '0.75rem', color: '#1a202c' }}>五目並べ</div>
              </div>
            </Link>
            <Link href="/connect4" style={{ textDecoration: 'none' }}>
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 0.5rem', textAlign: 'center', height: '100%' }}>
                <div style={{ marginBottom: '0.3rem' }}><IconConnect4 size={32} color="#e53e3e" /></div>
                <div style={{ fontWeight: 600, fontSize: '0.75rem', color: '#1a202c' }}>四目並べ</div>
              </div>
            </Link>
            <Link href="/simple-shogi" style={{ textDecoration: 'none' }}>
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 0.5rem', textAlign: 'center', height: '100%' }}>
                <div style={{ marginBottom: '0.3rem' }}><IconKing size={32} color="#4a5568" /></div>
                <div style={{ fontWeight: 600, fontSize: '0.75rem', color: '#1a202c' }}>ファンタジー将棋</div>
              </div>
            </Link>
            <Link href="/honeycomb" style={{ textDecoration: 'none' }}>
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 0.5rem', textAlign: 'center', height: '100%' }}>
                <div style={{ marginBottom: '0.3rem' }}><IconGomoku size={32} color="#d69e2e" /></div>
                <div style={{ fontWeight: 600, fontSize: '0.75rem', color: '#1a202c' }}>蜂の陣</div>
              </div>
            </Link>
            <Link href="/checkers" style={{ textDecoration: 'none' }}>
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 0.5rem', textAlign: 'center', height: '100%' }}>
                <div style={{ marginBottom: '0.3rem' }}><IconCheckers size={32} color="#e53e3e" /></div>
                <div style={{ fontWeight: 600, fontSize: '0.75rem', color: '#1a202c' }}>チェッカー</div>
              </div>
            </Link>
            <Link href="/mancala" style={{ textDecoration: 'none' }}>
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 0.5rem', textAlign: 'center', height: '100%' }}>
                <div style={{ marginBottom: '0.3rem' }}><IconMancala size={32} color="#d69e2e" /></div>
                <div style={{ fontWeight: 600, fontSize: '0.75rem', color: '#1a202c' }}>マンカラ</div>
              </div>
            </Link>
            <Link href="/backgammon" style={{ textDecoration: 'none' }}>
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 0.5rem', textAlign: 'center', height: '100%' }}>
                <div style={{ marginBottom: '0.3rem' }}><IconBackgammon size={32} /></div>
                <div style={{ fontWeight: 600, fontSize: '0.75rem', color: '#1a202c' }}>バックギャモン</div>
              </div>
            </Link>
            <Link href="/mahjong" style={{ textDecoration: 'none' }}>
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 0.5rem', textAlign: 'center', height: '100%' }}>
                <div style={{ marginBottom: '0.3rem', fontSize: '1.75rem' }}>🀄</div>
                <div style={{ fontWeight: 600, fontSize: '0.75rem', color: '#1a202c' }}>麻雀</div>
              </div>
            </Link>
          </div>
        </section>
        {/* Variety & Casual */}
        <section>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#2d3748', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '6px', height: '24px', background: '#ed8936', borderRadius: '3px' }}></span>
            バラエティ & カジュアル
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: '0.75rem'
          }}>
            <Link href="/piano" style={{ textDecoration: 'none' }}>
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 0.5rem', textAlign: 'center', height: '100%' }}>
                <div style={{ marginBottom: '0.3rem' }}><IconPalette size={32} color="#3182ce" /></div>
                <div style={{ fontWeight: 600, fontSize: '0.75rem', color: '#1a202c' }}>Virtual Piano</div>
                <div style={{ fontSize: '0.6rem', color: '#718096', marginTop: '0.2rem' }}>楽器演奏</div>
              </div>
            </Link>

            <Link href="/drawing" style={{ textDecoration: 'none' }}>
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 0.5rem', textAlign: 'center', height: '100%' }}>
                <div style={{ marginBottom: '0.3rem' }}><IconPalette size={32} color="#d53f8c" /></div>
                <div style={{ fontWeight: 600, fontSize: '0.75rem', color: '#1a202c' }}>お絵かきクイズ</div>
                <div style={{ fontSize: '0.6rem', color: '#718096', marginTop: '0.2rem' }}>マルチプレイ</div>
              </div>
            </Link>

            <Link href="/trump" style={{ textDecoration: 'none' }}>
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 0.5rem', textAlign: 'center', height: '100%' }}>
                <div style={{ marginBottom: '0.3rem' }}><IconCards size={32} color="#2b6cb0" /></div>
                <div style={{ fontWeight: 600, fontSize: '0.75rem', color: '#1a202c' }}>トランプ</div>
                <div style={{ fontSize: '0.6rem', color: '#718096', marginTop: '0.2rem' }}>大富豪 etc.</div>
              </div>
            </Link>
          </div>
        </section>

      </div>

    </main>
  );
}
