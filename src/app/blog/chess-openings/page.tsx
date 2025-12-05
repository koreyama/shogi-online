'use client';

import React from 'react';
import Link from 'next/link';

export default function ChessOpeningsPage() {
    return (
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif', lineHeight: '1.8', color: '#2d3748' }}>
            <nav style={{ marginBottom: '2rem' }}>
                <Link href="/blog" style={{ color: '#3182ce', textDecoration: 'none' }}>&larr; ブログ一覧へ戻る</Link>
            </nav>

            <article>
                <header style={{ marginBottom: '2rem' }}>
                    <span style={{ color: '#718096', fontSize: '0.9rem' }}>2025年12月6日</span>
                    <h1 style={{ fontSize: '2rem', marginTop: '0.5rem', color: '#1a202c' }}>チェス初心者のための定跡ガイド：最初の10手で差をつける</h1>
                </header>

                <div style={{ color: '#4a5568' }}>
                    <p style={{ marginBottom: '1.5rem' }}>
                        チェスにおいて、オープニング（序盤）の10手は勝敗を大きく左右する重要な局面です。
                        この記事では、初心者でも覚えやすく、かつ効果的な定跡をご紹介します。
                    </p>

                    <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem', color: '#1a202c' }}>オープニングの3つの原則</h2>

                    <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.5rem', color: '#2d3748' }}>1. センターをコントロールする</h3>
                    <p style={{ marginBottom: '1rem' }}>
                        盤面の中央（e4, d4, e5, d5）は最も重要なマスです。
                        中央を支配することで、駒の展開が容易になり、攻撃の選択肢が広がります。
                    </p>

                    <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.5rem', color: '#2d3748' }}>2. マイナーピースを早く展開する</h3>
                    <p style={{ marginBottom: '1rem' }}>
                        ナイトとビショップを早い段階で活用しましょう。
                        理想的な順序は、キングサイドのナイトとビショップを先に動かし、安全にキャスリングを行うことです。
                    </p>

                    <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.5rem', color: '#2d3748' }}>3. キングの安全を確保する</h3>
                    <p style={{ marginBottom: '1rem' }}>
                        キャスリングは通常7〜8手目までに行うのが理想です。
                        キングを安全にしないまま中盤に突入すると、思わぬ攻撃を受けるリスクが高まります。
                    </p>

                    <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem', color: '#1a202c' }}>初心者におすすめの定跡</h2>

                    <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.5rem', color: '#2d3748' }}>イタリアンゲーム</h3>
                    <p style={{ marginBottom: '1rem' }}>
                        1.e4 e5 2.Nf3 Nc6 3.Bc4 という流れで始まる古典的な定跡です。
                        白はセンターを支配しつつ、f7のポーンを狙う攻撃的な布陣を敷きます。
                        基本原則に忠実で、初心者が最初に習得すべき定跡の一つです。
                    </p>

                    <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.5rem', color: '#2d3748' }}>ロンドンシステム</h3>
                    <p style={{ marginBottom: '1rem' }}>
                        1.d4 d5 2.Bf4 という進行で、相手の対応を問わず同じ形で指せる堅実な定跡です。
                        ビショップをd4のポーンよりも先に展開するのが特徴で、覚えることが少なく実戦的です。
                    </p>

                    <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem', color: '#1a202c' }}>避けるべきオープニングのミス</h2>
                    <ul style={{ paddingLeft: '1.5rem', marginBottom: '1.5rem' }}>
                        <li style={{ marginBottom: '0.5rem' }}>同じ駒を何度も動かす（他の駒が未展開なのに）</li>
                        <li style={{ marginBottom: '0.5rem' }}>クイーンを早く出しすぎる</li>
                        <li style={{ marginBottom: '0.5rem' }}>ポーンだけを動かして駒を展開しない</li>
                        <li style={{ marginBottom: '0.5rem' }}>キャスリングを忘れる</li>
                    </ul>

                    <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem', color: '#1a202c' }}>まとめ</h2>
                    <p style={{ marginBottom: '1.5rem' }}>
                        オープニングの基本を押さえることで、中盤・終盤で有利なポジションを確保できます。
                        まずはイタリアンゲームかロンドンシステムを繰り返し練習し、
                        自分の得意な戦型を見つけていきましょう。
                    </p>

                    <div style={{ background: '#ebf8ff', padding: '1.5rem', borderRadius: '8px', marginTop: '2rem' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#2b6cb0' }}>Asobi Loungeでチェスを練習しよう</h3>
                        <p style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>
                            当サイトでは、CPUとの対戦でオープニングの練習ができます。
                            何度も繰り返し練習して、定跡を体に染み込ませましょう。
                        </p>
                        <Link href="/chess" style={{ color: '#3182ce', fontWeight: 600 }}>チェスをプレイする →</Link>
                    </div>
                </div>
            </article>
        </main>
    );
}
