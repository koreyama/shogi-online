'use client';

import React from 'react';
import Link from 'next/link';

export default function BackgammonGuidePage() {
    return (
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem', fontFamily: 'sans-serif', lineHeight: '1.8', color: '#2d3748' }}>
            <header style={{ marginBottom: '3rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '2rem' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: '800', letterSpacing: '-0.02em' }}>バックギャモン入門：5000年の歴史を持つ最古のボードゲーム</h1>
                <p style={{ color: '#718096', fontSize: '0.95rem' }}>2026年1月2日</p>
            </header>

            <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #d69e2e', paddingLeft: '1rem', color: '#744210' }}>バックギャモンとは？</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        バックギャモンは、約5000年前のメソポタミア文明で生まれたとされる、世界最古のボードゲームの一つです。
                        2人のプレイヤーがサイコロを振り、15個の駒を自陣のゴールまで先に運んだほうが勝者となります。
                        運と戦略が絶妙にミックスされた、奥深いゲーム性が魅力です。
                    </p>
                    <p>
                        日本ではあまり馴染みがありませんが、欧米やトルコ、イランなどでは非常にポピュラーなゲームで、
                        多くのカフェやパブでプレイされています。近年はオンラインでも盛んにプレイされるようになりました。
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #d69e2e', paddingLeft: '1rem', color: '#744210' }}>基本ルール</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        バックギャモンのボードは24個の三角形（ポイント）で構成されています。各プレイヤーは15個の駒を持ち、
                        サイコロを2つ振って出た目の分だけ駒を進めます。
                    </p>
                    <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
                        <li style={{ marginBottom: '0.5rem' }}>駒は自分のホームボード（ゴール側の6ポイント）を目指して進みます</li>
                        <li style={{ marginBottom: '0.5rem' }}>相手の駒が1つだけあるポイントに止まると、その駒を「ヒット」してバーに送れます</li>
                        <li style={{ marginBottom: '0.5rem' }}>バーにある駒は相手陣地から再スタートしなければなりません</li>
                        <li style={{ marginBottom: '0.5rem' }}>全ての駒がホームボードに入ったら「ベアリングオフ」（駒をゴールさせる）できます</li>
                    </ul>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #d69e2e', paddingLeft: '1rem', color: '#744210' }}>勝つための基本戦略</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        バックギャモンで勝つためには、以下の戦略を意識することが重要です：
                    </p>
                    <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
                        <li style={{ marginBottom: '0.5rem' }}><strong>ブロックを作る：</strong>2つ以上の駒を同じポイントに置くと、相手はそこに止まれなくなります</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>プライムを形成：</strong>6つ連続したブロックは相手の駒を完全に封じ込める「プライム」になります</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>ブロットを避ける：</strong>1つだけの駒（ブロット）は相手にヒットされるリスクがあります</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>ダブリングキューブの使い方：</strong>優勢な時はダブルを提案し、相手にプレッシャーをかけましょう</li>
                    </ul>
                </section>

                <section>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #d69e2e', paddingLeft: '1rem', color: '#744210' }}>オンラインでプレイするメリット</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        Asobi Loungeでは、ブラウザだけでバックギャモンをプレイできます。
                        CPU対戦で練習したり、ルールを覚えながらゆっくりプレイすることが可能です。
                        インストール不要で、スマホからでもPCからでもすぐに始められます。
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
