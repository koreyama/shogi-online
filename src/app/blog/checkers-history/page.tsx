'use client';

import React from 'react';
import Link from 'next/link';

export default function CheckersHistoryPage() {
    return (
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif', lineHeight: '1.8', color: '#2d3748' }}>
            <nav style={{ marginBottom: '2rem' }}>
                <Link href="/blog" style={{ color: '#3182ce', textDecoration: 'none' }}>&larr; ブログ一覧へ戻る</Link>
            </nav>

            <article>
                <header style={{ marginBottom: '2rem' }}>
                    <span style={{ color: '#718096', fontSize: '0.9rem' }}>2025年12月5日</span>
                    <h1 style={{ fontSize: '2rem', marginTop: '0.5rem', color: '#1a202c' }}>チェッカー（ドラフツ）の歴史：5000年前から愛されるゲーム</h1>
                </header>

                <div style={{ color: '#4a5568' }}>
                    <p style={{ marginBottom: '1.5rem' }}>
                        チェッカー（イギリスではドラフツ）は、世界で最も古いボードゲームの一つです。
                        その歴史は紀元前3000年まで遡り、チェスよりも遥かに古いゲームなのです。
                    </p>

                    <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem', color: '#1a202c' }}>古代エジプトで生まれたゲーム</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        チェッカーの原型は、古代エジプトで発見された「アルケルク」というゲームだと考えられています。
                        ファラオの墓からもゲーム盤が出土しており、貴族たちの娯楽として親しまれていました。
                    </p>

                    <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem', color: '#1a202c' }}>ヨーロッパでの発展</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        中世ヨーロッパに伝わると、チェス盤（8×8マス）を使うようになり、現在の形に近づきました。
                        12世紀のフランスでは「フィエルジュ」と呼ばれ、貴族から庶民まで広く遊ばれました。
                    </p>
                    <p style={{ marginBottom: '1rem' }}>
                        「キング」のルール（端まで進んだ駒が強化される）が加わったのもこの頃で、
                        ゲームの戦略性が大きく向上しました。
                    </p>

                    <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem', color: '#1a202c' }}>イギリスとアメリカでの普及</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        16世紀にイギリスで「ドラフツ」として人気を博し、
                        アメリカに渡って「チェッカー」と呼ばれるようになりました。
                        アメリカでは、チェスよりも手軽に遊べるゲームとして大衆に広まりました。
                    </p>

                    <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem', color: '#1a202c' }}>コンピュータとチェッカー</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        1994年、コンピュータプログラム「チヌーク」が人間の世界チャンピオンを破りました。
                        そして2007年には、チェッカーは完全に解析され、両者が最善を尽くせば引き分けになることが証明されました。
                    </p>
                    <p style={{ marginBottom: '1rem' }}>
                        これは、完全に解かれた最も複雑なゲームとして歴史に残っています。
                    </p>

                    <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem', color: '#1a202c' }}>世界のチェッカーバリエーション</h2>
                    <ul style={{ paddingLeft: '1.5rem', marginBottom: '1.5rem' }}>
                        <li style={{ marginBottom: '0.5rem' }}><strong>国際ドラフツ</strong>：10×10盤、20枚ずつの駒を使用</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>ブラジリアンドラフツ</strong>：8×8盤だが国際ルールを適用</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>ロシアンチェッカー</strong>：キングが後ろにも動ける</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>トルキッシュドラフツ</strong>：斜めではなく縦横に動く</li>
                    </ul>

                    <div style={{ background: '#ebf8ff', padding: '1.5rem', borderRadius: '8px', marginTop: '2rem' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#2b6cb0' }}>チェッカーを体験しよう</h3>
                        <p style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>
                            Asobi Loungeでは、クラシックな8×8盤のチェッカーが遊べます。
                            5000年の歴史を持つゲームを、ぜひ体験してみてください。
                        </p>
                        <Link href="/checkers" style={{ color: '#3182ce', fontWeight: 600 }}>チェッカーをプレイする →</Link>
                    </div>
                </div>
            </article>
        </main>
    );
}
