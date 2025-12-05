'use client';

import React from 'react';
import Link from 'next/link';

export default function Connect4StrategyPage() {
    return (
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif', lineHeight: '1.8', color: '#2d3748' }}>
            <nav style={{ marginBottom: '2rem' }}>
                <Link href="/blog" style={{ color: '#3182ce', textDecoration: 'none' }}>&larr; ブログ一覧へ戻る</Link>
            </nav>

            <article>
                <header style={{ marginBottom: '2rem' }}>
                    <span style={{ color: '#718096', fontSize: '0.9rem' }}>2025年12月6日</span>
                    <h1 style={{ fontSize: '2rem', marginTop: '0.5rem', color: '#1a202c' }}>四目並べ必勝法：中央を制する者がゲームを制する</h1>
                </header>

                <div style={{ color: '#4a5568' }}>
                    <p style={{ marginBottom: '1.5rem' }}>
                        四目並べ（Connect Four）は、縦・横・斜めに4つ並べれば勝ちというシンプルなルールですが、
                        実は奥深い戦略性を持つゲームです。この記事では、勝率を上げるための基本戦略を解説します。
                    </p>

                    <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem', color: '#1a202c' }}>先手必勝？ゲームの性質を理解する</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        数学的な解析によると、四目並べは先手が完璧にプレイすれば必ず勝てるゲームであることが証明されています。
                        しかし、完璧なプレイは人間には難しいため、戦略を知っているかどうかが勝敗を分けます。
                    </p>

                    <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem', color: '#1a202c' }}>最重要：中央の列を取れ</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        四目並べで最も重要なのは、盤面の中央列（4列目）です。
                        中央に置いた駒は、横方向だけでなく斜め方向にも多くの勝ち筋に関与できます。
                    </p>
                    <p style={{ marginBottom: '1rem' }}>
                        先手なら、まず中央に置くのが最善手です。
                        後手の場合も、相手が中央以外に置いたらすぐに中央を取りましょう。
                    </p>

                    <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem', color: '#1a202c' }}>「7」の形を作る</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        「7」の形（または逆7）は、相手に選択を強いる強力な配置です。
                        2方向に3つ並んだ状態を作ることで、相手はどちらか一方しか防げません。
                    </p>

                    <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem', color: '#1a202c' }}>偶数・奇数の戦略</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        各列の空きマス数に注目しましょう。
                        先手は奇数段目（下から1, 3, 5段目）での勝ち筋を狙い、
                        後手は偶数段目（2, 4, 6段目）で勝つことを目指すと有利になります。
                    </p>

                    <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem', color: '#1a202c' }}>防御の基本</h2>
                    <ul style={{ paddingLeft: '1.5rem', marginBottom: '1.5rem' }}>
                        <li style={{ marginBottom: '0.5rem' }}>相手が3つ並んだら即座にブロック</li>
                        <li style={{ marginBottom: '0.5rem' }}>相手に縦の3つを作らせない（縦は確実に負ける）</li>
                        <li style={{ marginBottom: '0.5rem' }}>相手の駒の上に置くときは、その上に何が来るかを考える</li>
                    </ul>

                    <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem', color: '#1a202c' }}>トラップを仕掛ける</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        上級者は「ダブルスレット」を狙います。
                        これは2箇所同時にリーチをかけ、相手がどちらか一方しか防げない状況を作ることです。
                        斜めのラインを2本同時に狙うのが効果的です。
                    </p>

                    <div style={{ background: '#ebf8ff', padding: '1.5rem', borderRadius: '8px', marginTop: '2rem' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#2b6cb0' }}>四目並べでトレーニング</h3>
                        <p style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>
                            Asobi Loungeの四目並べでは、AIとの対戦で戦略を練習できます。
                            中央支配とダブルスレットを意識してプレイしてみましょう。
                        </p>
                        <Link href="/connect4" style={{ color: '#3182ce', fontWeight: 600 }}>四目並べをプレイする →</Link>
                    </div>
                </div>
            </article>
        </main>
    );
}
