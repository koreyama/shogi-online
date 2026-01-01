'use client';

import React from 'react';
import Link from 'next/link';

export default function DotsBoxesStrategyPage() {
    return (
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem', fontFamily: 'sans-serif', lineHeight: '1.8', color: '#2d3748' }}>
            <header style={{ marginBottom: '3rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '2rem' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: '800', letterSpacing: '-0.02em' }}>Dots & Boxes攻略：陣取りゲームの必勝法</h1>
                <p style={{ color: '#718096', fontSize: '0.95rem' }}>2026年1月2日</p>
            </header>

            <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #ed64a6', paddingLeft: '1rem', color: '#97266d' }}>Dots & Boxesとは？</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        Dots & Boxes（ドット・アンド・ボックス）は、点と点を線で結んで四角形を作る陣取りゲームです。
                        紙とペンがあれば誰でもすぐに遊べるシンプルなゲームですが、
                        実は非常に奥深い戦略が必要とされる、数学者も研究する知的ゲームなのです。
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #ed64a6', paddingLeft: '1rem', color: '#97266d' }}>基本ルール</h2>
                    <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
                        <li style={{ marginBottom: '0.5rem' }}>プレイヤーは交互に2つの隣接する点を線で結びます</li>
                        <li style={{ marginBottom: '0.5rem' }}>四角形を完成させたプレイヤーは、その四角形を獲得し、もう一度手番が来ます</li>
                        <li style={{ marginBottom: '0.5rem' }}>すべての線が引かれたらゲーム終了</li>
                        <li style={{ marginBottom: '0.5rem' }}>より多くの四角形を獲得したプレイヤーの勝利です</li>
                    </ul>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #ed64a6', paddingLeft: '1rem', color: '#97266d' }}>勝つための戦略</h2>
                    <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
                        <li style={{ marginBottom: '0.5rem' }}><strong>3辺目を引かない：</strong>3辺が完成した四角形は、次の相手に取られてしまいます。序盤は3辺目を避けましょう</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>チェーンを理解する：</strong>四角形が連続する「チェーン」を作ると、一度に大量獲得できます</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>ダブルクロス戦略：</strong>チェーンの端で2つだけ取り、残りを相手に渡すことで主導権を握る高度なテクニック</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>奇数チェーンの支配：</strong>ゲーム全体のチェーン数を奇数に保つと有利になる場合があります</li>
                    </ul>
                </section>

                <section>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #ed64a6', paddingLeft: '1rem', color: '#97266d' }}>上達のコツ</h2>
                    <p>
                        Dots & Boxesは見た目以上に複雑なゲームです。
                        最初は「3辺目を引かない」という基本を守るだけでも、勝率は大きく上がります。
                        慣れてきたら、チェーンの概念を意識してプレイしてみてください。
                        Asobi Loungeではオンライン対戦で腕を磨くことができます。
                    </p>
                </section>
            </div>

            <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link href="/blog" style={{ color: '#3182ce', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    &larr; コラム一覧へ戻る
                </Link>
                <Link href="/" style={{
                    padding: '0.8rem 2rem',
                    background: '#3182ce',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '30px',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 6px rgba(49, 130, 206, 0.3)'
                }}>
                    ゲームで遊ぶ &rarr;
                </Link>
            </div>
        </main>
    );
}
