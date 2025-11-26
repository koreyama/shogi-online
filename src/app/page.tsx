'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Added useRouter import
import styles from './page.module.css';
import { IconShogi, IconOthello, IconGomoku, IconMancala, IconChess, IconUser, IconCards, IconPalette } from '@/components/Icons';
import { usePlayer } from '@/hooks/usePlayer';

import { useRoomJanitor } from '@/hooks/useRoomJanitor';

export default function Home() {
  const router = useRouter();
  const { playerName, savePlayerName, isLoaded } = usePlayer();
  const [showNameModal, setShowNameModal] = useState(false);
  const [inputName, setInputName] = useState('');
  const [mounted, setMounted] = useState(false);

  // Clean up empty rooms for all games
  useRoomJanitor();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isLoaded && !playerName) {
      setShowNameModal(true);
    }
  }, [isLoaded, playerName]);

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
        {playerName && (
          <div className={styles.playerBar}>
            <IconUser size={20} color="#2d3748" />
            <span className={styles.playerName}>{playerName}</span>
            <button onClick={openNameEdit} className={styles.editButton}>変更</button>
          </div>
        )}
        <h1 className={styles.title}>Asobi Lounge</h1>
        <p className={styles.subtitle}>
          シンプルで美しい、オンラインゲームプラットフォーム。<br />
          一人でも友達とでも今すぐ遊ぼう
        </p>
      </header>

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

        <Link href="/othello" className={styles.gameCard}>
          <div className={styles.cardContent}>
            <div className={styles.iconWrapper}>
              <IconOthello size={50} color="#1a202c" />
            </div>
            <h2 className={styles.cardTitle}>オセロ</h2>
            <p className={styles.cardDesc}>覚えるのは一分、極めるのは一生。石を挟んでひっくり返す。</p>
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

        <Link href="/mancala" className={styles.gameCard}>
          <div className={styles.cardContent}>
            <div className={styles.iconWrapper}>
              <IconMancala size={50} color="#d69e2e" />
            </div>
            <h2 className={styles.cardTitle}>マンカラ</h2>
            <p className={styles.cardDesc}>世界最古の知育ゲーム。種を撒いて自分の陣地を増やそう。</p>
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

        <Link href="/trump" className={styles.gameCard}>
          <div className={styles.cardContent}>
            <div className={styles.iconWrapper}>
              <IconCards size={50} color="#e53e3e" />
            </div>
            <h2 className={styles.cardTitle}>トランプ</h2>
            <p className={styles.cardDesc}>大富豪、ポーカー、ブラックジャック。最大4人で遊べるカードゲーム集。</p>
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
      </div>
    </main>
  );
}
