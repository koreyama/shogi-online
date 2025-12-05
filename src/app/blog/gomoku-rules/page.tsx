import React from 'react';
import Link from 'next/link';

export default function ArticlePage() {
    return (
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem', fontFamily: 'sans-serif', lineHeight: '1.8', color: '#2d3748' }}>
            <header style={{ marginBottom: '3rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '2rem' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: '800', letterSpacing: '-0.02em' }}>五目並べの必勝法：「三三」と「四三」</h1>
                <p style={{ color: '#718096', fontSize: '0.95rem' }}>2025年12月5日</p>
            </header>

            <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #3182ce', paddingLeft: '1rem', color: '#2c5282' }}>ただ並べるだけじゃない？</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        五目並べは「5つ並べたら勝ち」という非常にシンプルなルールですが、実は奥深い戦略があります。
                        適当に石を置いていても、強い相手には勝てません。
                        勝つためには、相手が防ぎきれない形、「必勝形」を作ることが重要です。
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #3182ce', paddingLeft: '1rem', color: '#2c5282' }}>最強の形「四三（しさん）」</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        五目並べで最も基本的な勝ちパターンが「四三」です。
                        これは、「4つの並び（四）」と「3つの並び（三）」を同時に作る手のことです。
                    </p>
                    <p>
                        「四」を作られたら、相手は次に5つにされるのを防ぐために、必ず止めなければなりません。
                        しかし、止めている間に、もう一方の「三」が「四」になります。
                        こうなると、相手はもう防ぐことができません。これが「四三」の強さです。
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #3182ce', paddingLeft: '1rem', color: '#2c5282' }}>禁じ手「三三（さんさん）」</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        「四三」と同じように強力なのが「三三」ですが、実はこれ、公式ルール（連珠）では「禁じ手」とされています（先手のみ）。
                        先手が「三三」を打つと、その時点で負けになってしまうのです。
                    </p>
                    <p>
                        なぜなら、先手があまりにも有利すぎるからです。
                        Asobi Loungeの五目並べは、初心者でも楽しめるようにこの「禁じ手」ルールを採用していない場合もありますが、
                        本格的な対戦を目指すなら覚えておいて損はないでしょう。
                    </p>
                </section>
            </div>

            <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link href="/blog" style={{ color: '#3182ce', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    &larr; コラム一覧へ戻る
                </Link>
                <Link href="/gomoku" style={{
                    padding: '0.8rem 2rem',
                    background: '#e53e3e',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '30px',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 6px rgba(229, 62, 62, 0.3)'
                }}>
                    五目並べをプレイする &rarr;
                </Link>
            </div>
        </main>
    );
}
