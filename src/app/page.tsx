'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Added useRouter import
import styles from './page.module.css';
import { IconShogi, IconOthello, IconGomoku, IconMancala, IconChess, IconUser, IconCards, IconPalette, IconCheckers, IconConnect4, IconSwords } from '@/components/Icons';
import { IconKing } from '@/components/SimpleShogiIcons';
import { usePlayer } from '@/hooks/usePlayer';

import { useRoomJanitor } from '@/hooks/useRoomJanitor';

import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const router = useRouter();
  const { playerName, savePlayerName, isLoaded } = usePlayer();
  const { user, signInWithGoogle, signOut, loading: authLoading } = useAuth();
  const [showNameModal, setShowNameModal] = useState(false);
  const [inputName, setInputName] = useState('');
  const [mounted, setMounted] = useState(false);

  // Clean up empty rooms for all games
  useRoomJanitor();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isLoaded && !authLoading && !playerName && !user) {
      setShowNameModal(true);
    }
  }, [isLoaded, authLoading, playerName, user]);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputName.trim()) {
      savePlayerName(inputName.trim());
      setShowNameModal(false);
    }
  };

  const openNameEdit = () => {
    setInputName(playerName);
    setShowNameModal(true);
  };

  if (!isLoaded) return null;

  return (
    <main className={styles.main}>
      {/* Name Modal */}
      {showNameModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>ようこそ Asobi Lounge へ</h2>
            <p className={styles.modalDesc}>ゲームで使用するプレイヤー名を入力してください</p>
            <form onSubmit={handleNameSubmit}>
              <div className={styles.inputGroup}>
                <input
                  type="text"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  placeholder="プレイヤー名"
                  className={styles.input}
                  required
                  autoFocus
                />
              </div>
              <button type="submit" className={styles.submitBtn}>はじめる</button>
            </form>
          </div>
        </div>
      )}

      {/* Header / Hero */}
      <header className={styles.hero}>
        <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end', zIndex: 20 }}>
          {/* Login/User Section */}
          <div>
            {user ? (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(255,255,255,0.8)', padding: '0.5rem', borderRadius: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                {user.photoURL && <img src={user.photoURL} alt="User" style={{ width: 32, height: 32, borderRadius: '50%' }} />}
                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#2d3748' }}>{user.displayName}</span>
                <button
                  onClick={signOut}
                  style={{
                    padding: '0.3rem 0.8rem',
                    fontSize: '0.8rem',
                    background: '#e53e3e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '15px',
                    cursor: 'pointer'
                  }}
                >
                  ログアウト
                </button>
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.9rem',
                  background: '#4285F4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              >
                Googleログイン
              </button>
            )}
          </div>

          {/* Player Name Section (Local) */}
          {playerName && !user && (
            <div className={styles.playerBar} style={{ position: 'static', transform: 'none', margin: 0 }}>
              <IconUser size={20} color="#2d3748" />
              <span className={styles.playerName}>{playerName}</span>
              <button onClick={openNameEdit} className={styles.editButton}>変更</button>
            </div>
          )}
        </div>
        <h1 className={styles.title}>Asobi Lounge</h1>
        <p className={styles.subtitle}>
          シンプルで美しい、オンラインゲームプラットフォーム。<br />
          一人でも友達とでも今すぐ遊ぼう
        </p>
      </header>

      {/* About Section */}
      <section className={styles.aboutSection}>
        <div className={styles.aboutContainer}>
          <div className={styles.aboutCard}>
            <h3>🎮 Asobi Loungeとは？</h3>
            <p>
              将棋、チェス、オセロなどの定番ゲームから、オリジナルのカードゲームまで。<br />
              インストール不要で、PCでもスマホでも、すぐに遊べるブラウザゲームサイトです。
            </p>
            <Link href="/about" style={{ display: 'inline-block', marginTop: '1rem', color: '#3182ce', fontWeight: 'bold' }}>
              詳しく見る &rarr;
            </Link>
          </div>
          <div className={styles.aboutCard}>
            <h3>☁️ ログインするとできること</h3>
            <p>
              Googleアカウントでログインすると、<strong>Divine Duel</strong>のデッキデータがクラウドに保存されます。<br />
              スマホで作ったデッキをPCで使ったり、機種変更してもデータを引き継げます。
            </p>
          </div>
          <div className={styles.aboutCard}>
            <h3>📚 ゲームコラム</h3>
            <p>
              ゲームの歴史や戦略、上達のコツなどを紹介するコラムを連載中。<br />
              初心者から上級者まで楽しめる情報をお届けします。
            </p>
            <Link href="/blog" style={{ display: 'inline-block', marginTop: '1rem', color: '#3182ce', fontWeight: 'bold' }}>
              コラムを読む &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Game Grid */}
      <div className={styles.gameGrid}>
        <Link href="/shogi" className={styles.gameCard}>
          <div className={styles.cardContent}>
            <div className={styles.iconWrapper}>
              <IconShogi size={50} color="#2c5282" />
            </div>
            <h2 className={styles.cardTitle}>将棋</h2>
            <p className={styles.cardDesc}>日本の伝統的な戦略ボードゲーム。王将を詰ませたら勝ち。</p>
          </div>
        </Link>

        <Link href="/chess" className={styles.gameCard}>
          <div className={styles.cardContent}>
            <div className={styles.iconWrapper}>
              <IconChess size={50} color="#2b6cb0" />
            </div>
            <h2 className={styles.cardTitle}>チェス</h2>
            <p className={styles.cardDesc}>世界中で愛されるボードゲームの王様。チェックメイトを目指せ。</p>
          </div>
        </Link>

        <Link href="/othello" className={styles.gameCard}>
          <div className={styles.cardContent}>
            <div className={styles.iconWrapper}>
              <IconOthello size={50} color="#1a202c" />
            </div>
            <h2 className={styles.cardTitle}>オセロ</h2>
            <p className={styles.cardDesc}>覚えるのは一分、極めるのは一生。石を挟んでひっくり返す。</p>
          </div>
        </Link>

        <Link href="/connect4" className={styles.gameCard}>
          <div className={styles.cardContent}>
            <div className={styles.iconWrapper}>
              <IconConnect4 size={50} color="#c53030" />
            </div>
            <h2 className={styles.cardTitle}>四目並べ</h2>
            <p className={styles.cardDesc}>コインを落として4つ並べる戦略パズル。シンプルで熱い！</p>
          </div>
        </Link>

        <Link href="/gomoku" className={styles.gameCard}>
          <div className={styles.cardContent}>
            <div className={styles.iconWrapper}>
              <IconGomoku size={50} color="#c53030" />
            </div>
            <h2 className={styles.cardTitle}>五目並べ</h2>
            <p className={styles.cardDesc}>縦・横・斜めに5つ並べたら勝ち。シンプルながら奥深い。</p>
          </div>
        </Link>

        <Link href="/checkers" className={styles.gameCard}>
          <div className={styles.cardContent}>
            <div className={styles.iconWrapper}>
              <IconCheckers size={50} color="#e53e3e" />
            </div>
            <h2 className={styles.cardTitle}>チェッカー</h2>
            <p className={styles.cardDesc}>斜めに進んで相手を飛び越える。連続ジャンプで逆転を狙え！</p>
          </div>
        </Link>

        <Link href="/mancala" className={styles.gameCard}>
          <div className={styles.cardContent}>
            <div className={styles.iconWrapper}>
              <IconMancala size={50} color="#d69e2e" />
            </div>
            <h2 className={styles.cardTitle}>マンカラ</h2>
            <p className={styles.cardDesc}>世界最古の知育ゲーム。種を撒いて自分の陣地を増やそう。</p>
          </div>
        </Link>

        <Link href="/simple-shogi" className={styles.gameCard}>
          <div className={styles.cardContent}>
            <div className={styles.iconWrapper}>
              <IconKing size={48} color="#4a5568" />
            </div>
            <h2 className={styles.cardTitle}>ファンタジー将棋</h2>
            <p className={styles.cardDesc}>3x4マスの小さな将棋。スライムを進化させてドラゴンにしよう！</p>
          </div>
        </Link>

        <Link href="/drawing" className={styles.gameCard}>
          <div className={styles.cardContent}>
            <div className={styles.iconWrapper}>
              <IconPalette size={50} color="#d53f8c" />
            </div>
            <h2 className={styles.cardTitle}>お絵かきクイズ</h2>
            <p className={styles.cardDesc}>描いて当てて盛り上がろう！リアルタイムお絵かき伝言ゲーム。</p>
          </div>
        </Link>

        <Link href="/card-game/lobby" className={styles.gameCard}>
          <div className={styles.cardContent}>
            <div className={styles.iconWrapper}>
              <IconSwords size={50} color="#805ad5" />
            </div>
            <h2 className={styles.cardTitle}>Divine Duel</h2>
            <p className={styles.cardDesc}>神々の戦い。デッキを構築し、魔法と武器で相手を倒せ！</p>
          </div>
        </Link>

        <Link href="/honeycomb" className={styles.gameCard}>
          <div className={styles.cardContent}>
            <div className={styles.iconWrapper}>
              <IconGomoku size={50} color="#d69e2e" />
            </div>
            <h2 className={styles.cardTitle}>蜂の陣</h2>
            <p className={styles.cardDesc}>4つ並べたら勝ち、3つ並べたら負け。六角形の戦略パズル。</p>
          </div>
        </Link>

        {/* Trump section hidden for AdSense approval
        <div className={`${styles.gameCard} ${styles.disabledCard}`}>
          <div className={styles.cardContent}>
            <div className={styles.iconWrapper}>
              <IconCards size={50} color="#a0aec0" />
            </div>
            <h2 className={styles.cardTitle}>
              トランプ <span className={styles.comingSoonBadge}>開発中</span>
            </h2>
            <p className={styles.cardDesc}>大富豪、ポーカー、ブラックジャック。最大4人で遊べるカードゲーム集。</p>
          </div>
        </div>
        */}
      </div>
    </main>
  );
}
