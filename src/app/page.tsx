'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { IconShogi, IconReversi, IconGomoku, IconMancala, IconChess, IconCards, IconPalette, IconCheckers, IconConnect4, IconSwords, IconBomb, IconCoin } from '@/components/Icons';
import { IconKing } from '@/components/SimpleShogiIcons';
import { useRoomJanitor } from '@/hooks/useRoomJanitor';
import { useAuth } from '@/hooks/useAuth';

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

const IconVirus = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="5" />
    <path d="M12 2v3m0 14v3M2 12h3m14 0h3M4.9 4.9l2.1 2.1m10 10l2.1 2.1M4.9 19.1l2.1-2.1m10-10l2.1-2.1" />
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

export default function Home() {
  const { user, signInWithGoogle, signOut, loading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useRoomJanitor();

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
      <main style={{ minHeight: '100vh', background: '#ffffff' }}>
        {/* Navigation */}
        <nav style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #edf2f7'
        }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1a202c' }}>Asobi Lounge</div>
          <button
            onClick={signInWithGoogle}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.85rem',
              background: '#1a202c',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            ログイン
          </button>
        </nav>

        {/* Hero Section */}
        <section style={{
          padding: '3rem 1.5rem',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{
              fontSize: 'clamp(1.75rem, 5vw, 3rem)',
              fontWeight: 700,
              color: '#1a202c',
              lineHeight: 1.3,
              marginBottom: '1rem'
            }}>
              ブラウザで遊べる<br />オンラインゲーム
            </h1>
            <p style={{
              fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)',
              color: '#4a5568',
              lineHeight: 1.7,
              marginBottom: '1.5rem',
              maxWidth: '500px',
              margin: '0 auto 1.5rem'
            }}>
              将棋、チェス、リバーシなどの定番ボードゲームから、
              株取引シミュレーターやカードゲームまで。
              インストール不要でどのデバイスからでもプレイ可能。
            </p>
            <button
              onClick={signInWithGoogle}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.875rem 1.5rem',
                fontSize: '1rem',
                background: '#3182ce',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                boxShadow: '0 4px 14px rgba(49, 130, 206, 0.4)'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Googleで始める
            </button>
          </div>

          {/* Game Preview Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
            gap: '0.75rem',
            maxWidth: '400px',
            margin: '0 auto'
          }}>
            {[
              { icon: <IconShogi size={28} color="#2c5282" />, name: '将棋' },
              { icon: <IconChess size={28} color="#2b6cb0" />, name: 'チェス' },
              { icon: <IconReversi size={28} color="#1a202c" />, name: 'リバーシ' },
              { icon: <IconStock size={28} />, name: '株取引' },
            ].map((item, i) => (
              <div key={i} style={{
                background: '#f7fafc',
                borderRadius: '10px',
                padding: '1rem 0.5rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                {item.icon}
                <span style={{ fontSize: '0.7rem', color: '#4a5568' }}>{item.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section style={{
          background: '#f7fafc',
          padding: '2.5rem 1.5rem'
        }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#1a202c',
              textAlign: 'center',
              marginBottom: '1.5rem'
            }}>
              特徴
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: '#ebf4ff',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.75rem',
                  color: '#3182ce'
                }}>
                  <IconCloud size={24} />
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem', color: '#1a202c' }}>
                  クラウドセーブ
                </h3>
                <p style={{ color: '#718096', fontSize: '0.85rem', lineHeight: 1.6 }}>
                  ゲームの進行状況は自動で保存。どのデバイスでも続きをプレイ可能。
                </p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: '#ebf4ff',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.75rem',
                  color: '#3182ce'
                }}>
                  <IconGames size={24} />
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem', color: '#1a202c' }}>
                  15種類以上のゲーム
                </h3>
                <p style={{ color: '#718096', fontSize: '0.85rem', lineHeight: 1.6 }}>
                  定番から株取引シミュレーターまで豊富なラインナップ。
                </p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: '#ebf4ff',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.75rem',
                  color: '#3182ce'
                }}>
                  <IconDevices size={24} />
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem', color: '#1a202c' }}>
                  マルチデバイス対応
                </h3>
                <p style={{ color: '#718096', fontSize: '0.85rem', lineHeight: 1.6 }}>
                  インストール不要。PC、スマホ、タブレットで今すぐプレイ。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Game Categories */}
        <section style={{ padding: '2.5rem 1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: '#1a202c',
            marginBottom: '1.5rem'
          }}>
            ゲームラインナップ
          </h2>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.75rem',
              flexWrap: 'wrap'
            }}>
              <span style={{
                background: '#38a169',
                color: 'white',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                fontSize: '0.7rem',
                fontWeight: 600
              }}>
                CLOUD SAVE
              </span>
              <span style={{ fontWeight: 600, color: '#1a202c', fontSize: '0.9rem' }}>クラウドセーブ対応</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {['Stock Trade Simulator', 'Divine Duel', 'Civilization Builder', 'マインスイーパー'].map(name => (
                <span key={name} style={{
                  background: '#f0fff4',
                  border: '1px solid #c6f6d5',
                  color: '#22543d',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem'
                }}>
                  {name}
                </span>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontWeight: 600, color: '#1a202c', marginBottom: '0.75rem', fontSize: '0.9rem' }}>ボードゲーム</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {['将棋', 'チェス', 'リバーシ', '五目並べ', '四目並べ', 'チェッカー', 'マンカラ', '蜂の陣'].map(name => (
                <span key={name} style={{
                  background: '#edf2f7',
                  color: '#4a5568',
                  padding: '0.35rem 0.6rem',
                  borderRadius: '5px',
                  fontSize: '0.75rem'
                }}>
                  {name}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 600, color: '#1a202c', marginBottom: '0.75rem', fontSize: '0.9rem' }}>パーティーゲーム</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {['トランプ', 'お絵かきクイズ'].map(name => (
                <span key={name} style={{
                  background: '#edf2f7',
                  color: '#4a5568',
                  padding: '0.35rem 0.6rem',
                  borderRadius: '5px',
                  fontSize: '0.75rem'
                }}>
                  {name}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section style={{
          background: '#1a202c',
          padding: '2.5rem 1.5rem',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'white',
            marginBottom: '0.75rem'
          }}>
            今すぐ無料で始めよう
          </h2>
          <p style={{ color: '#a0aec0', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
            Googleアカウントでログインするだけ
          </p>
          <button
            onClick={signInWithGoogle}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.875rem 2rem',
              fontSize: '1rem',
              background: 'white',
              color: '#1a202c',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Googleで始める
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
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#2d3748', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.displayName}</span>
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
          <Link href="/polyomino" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.7rem', color: '#718096' }}>2025.12.07</span>
              <span style={{ background: '#d53f8c', color: '#fff', fontSize: '0.6rem', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>NEW</span>
              <span style={{ color: '#2d3748', fontWeight: '600', fontSize: '0.85rem' }}>Neon Territory (陣取りゲーム) リリース</span>
            </div>
          </Link>
          <Link href="/piano" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.7rem', color: '#718096' }}>2025.12.07</span>
              <span style={{ background: '#3182ce', color: '#fff', fontSize: '0.6rem', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>NEW</span>
              <span style={{ color: '#2d3748', fontWeight: '600', fontSize: '0.85rem' }}>Virtual Piano リリース</span>
            </div>
          </Link>
          <Link href="/plague" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.7rem', color: '#718096' }}>2025.12.07</span>
              <span style={{ color: '#2d3748', fontWeight: '600', fontSize: '0.85rem' }}>Bio-Hazard Simulator リリース</span>
            </div>
          </Link>
          <Link href="/clicker" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.7rem', color: '#718096' }}>2025.12.05</span>
              <span style={{ color: '#2d3748', fontWeight: '600', fontSize: '0.85rem' }}>Civilization Builder リリース</span>
            </div>
          </Link>
        </div>
      </section>

      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem 2rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: '#2d3748' }}>ゲーム一覧</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: '0.75rem'
        }}>
          <Link href="/stock" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', border: '2px solid #38a169', borderRadius: '12px', padding: '1rem 0.5rem', textAlign: 'center', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '0.3rem', right: '0.3rem', background: '#38a169', color: 'white', fontSize: '0.5rem', padding: '0.1rem 0.3rem', borderRadius: '6px', fontWeight: 'bold' }}>CLOUD</div>
              <IconStock size={36} />
              <div style={{ fontWeight: 600, fontSize: '0.75rem', color: '#1a202c', marginTop: '0.3rem' }}>Stock Simulator</div>
            </div>
          </Link>

          <Link href="/card-game/lobby" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', border: '2px solid #38a169', borderRadius: '12px', padding: '1rem 0.5rem', textAlign: 'center', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '0.3rem', right: '0.3rem', background: '#38a169', color: 'white', fontSize: '0.5rem', padding: '0.1rem 0.3rem', borderRadius: '6px', fontWeight: 'bold' }}>CLOUD</div>
              <IconSwords size={36} color="#805ad5" />
              <div style={{ fontWeight: 600, fontSize: '0.75rem', color: '#1a202c', marginTop: '0.3rem' }}>Divine Duel</div>
            </div>
          </Link>

          <Link href="/clicker" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', border: '2px solid #38a169', borderRadius: '12px', padding: '1rem 0.5rem', textAlign: 'center', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '0.3rem', right: '0.3rem', background: '#38a169', color: 'white', fontSize: '0.5rem', padding: '0.1rem 0.3rem', borderRadius: '6px', fontWeight: 'bold' }}>CLOUD</div>
              <IconCoin size={36} color="#ecc94b" />
              <div style={{ fontWeight: 600, fontSize: '0.75rem', color: '#1a202c', marginTop: '0.3rem' }}>Civilization</div>
            </div>
          </Link>

          <Link href="/plague" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 0.5rem', textAlign: 'center', position: 'relative' }}>
              <IconVirus size={36} />
              <div style={{ fontWeight: 600, fontSize: '0.75rem', color: '#1a202c', marginTop: '0.3rem' }}>Bio-Hazard</div>
            </div>
          </Link>

          <Link href="/piano" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 0.5rem', textAlign: 'center', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '0.3rem', right: '0.3rem', background: '#3182ce', color: 'white', fontSize: '0.5rem', padding: '0.1rem 0.3rem', borderRadius: '6px', fontWeight: 'bold' }}>NEW</div>
              <IconPalette size={36} color="#3182ce" />
              <div style={{ fontWeight: 600, fontSize: '0.75rem', color: '#1a202c', marginTop: '0.3rem' }}>Virtual Piano</div>
            </div>
          </Link>

          <Link href="/polyomino" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 0.5rem', textAlign: 'center', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '0.3rem', right: '0.3rem', background: '#d53f8c', color: 'white', fontSize: '0.5rem', padding: '0.1rem 0.3rem', borderRadius: '6px', fontWeight: 'bold' }}>NEW</div>
              <IconBlocks size={36} color="#d53f8c" />
              <div style={{ fontWeight: 600, fontSize: '0.75rem', color: '#1a202c', marginTop: '0.3rem' }}>Neon Territory</div>
            </div>
          </Link>

          <Link href="/hit-and-blow" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 0.5rem', textAlign: 'center' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#4299e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <div style={{ fontWeight: 600, fontSize: '0.75rem', color: '#1a202c', marginTop: '0.3rem' }}>Hit & Blow</div>
            </div>
          </Link>

          <Link href="/dots-and-boxes" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 0.5rem', textAlign: 'center' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ed64a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                <circle cx="15.5" cy="8.5" r="1.5" fill="currentColor" />
                <circle cx="8.5" cy="15.5" r="1.5" fill="currentColor" />
                <circle cx="15.5" cy="15.5" r="1.5" fill="currentColor" />
                <line x1="8.5" y1="8.5" x2="15.5" y2="8.5" />
                <line x1="8.5" y1="8.5" x2="8.5" y2="15.5" />
              </svg>
              <div style={{ fontWeight: 600, fontSize: '0.75rem', color: '#1a202c', marginTop: '0.3rem' }}>Dots & Boxes</div>
            </div>
          </Link>

          <Link href="/yacht" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 0.5rem', textAlign: 'center' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ed8936" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <circle cx="8" cy="8" r="2" fill="currentColor" />
                <circle cx="16" cy="16" r="2" fill="currentColor" />
                <circle cx="8" cy="16" r="2" fill="currentColor" />
                <circle cx="16" cy="8" r="2" fill="currentColor" />
                <circle cx="12" cy="12" r="2" fill="currentColor" />
              </svg>
              <div style={{ fontWeight: 600, fontSize: '0.75rem', color: '#1a202c', marginTop: '0.3rem' }}>Yacht</div>
            </div>
          </Link>

          <Link href="/minesweeper" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', border: '2px solid #38a169', borderRadius: '12px', padding: '1rem 0.5rem', textAlign: 'center', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '0.3rem', right: '0.3rem', background: '#38a169', color: 'white', fontSize: '0.5rem', padding: '0.1rem 0.3rem', borderRadius: '6px', fontWeight: 'bold' }}>CLOUD</div>
              <IconBomb size={36} color="#e53e3e" />
              <div style={{ fontWeight: 600, fontSize: '0.75rem', color: '#1a202c', marginTop: '0.3rem' }}>マインスイーパー</div>
            </div>
          </Link>

          <Link href="/shogi" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 0.5rem', textAlign: 'center' }}>
              <IconShogi size={36} color="#2c5282" />
              <div style={{ fontWeight: 600, fontSize: '0.75rem', color: '#1a202c', marginTop: '0.3rem' }}>将棋</div>
            </div>
          </Link>

          <Link href="/chess" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 0.5rem', textAlign: 'center' }}>
              <IconChess size={36} color="#2b6cb0" />
              <div style={{ fontWeight: 600, fontSize: '0.75rem', color: '#1a202c', marginTop: '0.3rem' }}>チェス</div>
            </div>
          </Link>

          <Link href="/reversi" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 0.5rem', textAlign: 'center' }}>
              <IconReversi size={36} color="#1a202c" />
              <div style={{ fontWeight: 600, fontSize: '0.75rem', color: '#1a202c', marginTop: '0.3rem' }}>リバーシ</div>
            </div>
          </Link>

          <Link href="/connect4" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 0.5rem', textAlign: 'center' }}>
              <IconConnect4 size={36} color="#c53030" />
              <div style={{ fontWeight: 600, fontSize: '0.75rem', color: '#1a202c', marginTop: '0.3rem' }}>四目並べ</div>
            </div>
          </Link>

          <Link href="/gomoku" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 0.5rem', textAlign: 'center' }}>
              <IconGomoku size={36} color="#c53030" />
              <div style={{ fontWeight: 600, fontSize: '0.75rem', color: '#1a202c', marginTop: '0.3rem' }}>五目並べ</div>
            </div>
          </Link>

          <Link href="/checkers" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 0.5rem', textAlign: 'center' }}>
              <IconCheckers size={36} color="#e53e3e" />
              <div style={{ fontWeight: 600, fontSize: '0.75rem', color: '#1a202c', marginTop: '0.3rem' }}>チェッカー</div>
            </div>
          </Link>

          <Link href="/mancala" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 0.5rem', textAlign: 'center' }}>
              <IconMancala size={36} color="#d69e2e" />
              <div style={{ fontWeight: 600, fontSize: '0.75rem', color: '#1a202c', marginTop: '0.3rem' }}>マンカラ</div>
            </div>
          </Link>

          <Link href="/simple-shogi" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 0.5rem', textAlign: 'center' }}>
              <IconKing size={36} color="#4a5568" />
              <div style={{ fontWeight: 600, fontSize: '0.75rem', color: '#1a202c', marginTop: '0.3rem' }}>ファンタジー将棋</div>
            </div>
          </Link>

          <Link href="/drawing" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 0.5rem', textAlign: 'center' }}>
              <IconPalette size={36} color="#d53f8c" />
              <div style={{ fontWeight: 600, fontSize: '0.75rem', color: '#1a202c', marginTop: '0.3rem' }}>お絵かきクイズ</div>
            </div>
          </Link>

          <Link href="/honeycomb" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 0.5rem', textAlign: 'center' }}>
              <IconGomoku size={36} color="#d69e2e" />
              <div style={{ fontWeight: 600, fontSize: '0.75rem', color: '#1a202c', marginTop: '0.3rem' }}>蜂の陣</div>
            </div>
          </Link>

          <Link href="/trump" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 0.5rem', textAlign: 'center' }}>
              <IconCards size={36} color="#2b6cb0" />
              <div style={{ fontWeight: 600, fontSize: '0.75rem', color: '#1a202c', marginTop: '0.3rem' }}>トランプ</div>
            </div>
          </Link>
        </div>
      </section>
    </main>
  );
}
