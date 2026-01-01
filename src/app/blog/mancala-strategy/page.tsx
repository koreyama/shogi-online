'use client';

import React from 'react';
import Link from 'next/link';

export default function MancalaStrategyPage() {
    return (
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem', fontFamily: 'sans-serif', lineHeight: '1.8', color: '#2d3748' }}>
            <header style={{ marginBottom: '3rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '2rem' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: '800', letterSpacing: '-0.02em' }}>マンカラ攻略法：アフリカ生まれの種まきゲームを極める</h1>
                <p style={{ color: '#718096', fontSize: '0.95rem' }}>2026年1月2日</p>
            </header>

            <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #d69e2e', paddingLeft: '1rem', color: '#744210' }}>マンカラとは？</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        マンカラは、アフリカや中東で古くから遊ばれてきた「種まき型」のボードゲームです。
                        小石や種を穴に一つずつ撒いていき、より多くの石を自分のゴールに集めた方が勝者となります。
                        シンプルなルールながら、先読みと戦略が求められる奥深いゲームです。
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #d69e2e', paddingLeft: '1rem', color: '#744210' }}>基本ルール（カラハ式）</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        Asobi Loungeで採用している「カラハ」ルールでは、各プレイヤーは6つの穴と1つのゴール（ストア）を持ちます。
                    </p>
                    <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
                        <li style={{ marginBottom: '0.5rem' }}>自分の穴から石をすべて取り、反時計回りに1つずつ撒いていきます</li>
                        <li style={{ marginBottom: '0.5rem' }}>自分のストアには石を入れますが、相手のストアはスキップします</li>
                        <li style={{ marginBottom: '0.5rem' }}>最後の石が自分のストアに入ったら、もう一度プレイできます</li>
                        <li style={{ marginBottom: '0.5rem' }}>最後の石が自分の空の穴に入ったら、その穴と向かいの相手の穴の石を全て獲得できます（キャプチャ）</li>
                    </ul>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #d69e2e', paddingLeft: '1rem', color: '#744210' }}>勝つための戦略</h2>
                    <p style={{ marginBottom: '1rem' }}>マンカラで勝つための重要な戦略をご紹介します：</p>
                    <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
                        <li style={{ marginBottom: '0.5rem' }}><strong>連続手番を狙う：</strong>最後の石が自分のストアに入るように計算して撒きましょう</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>キャプチャを狙う：</strong>相手側に石が溜まっている穴の「向かい」を空にしておくと大量獲得のチャンス</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>右側の穴を重視：</strong>右側の穴はストアに近いため、連続手番を取りやすくなります</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>相手の動きを読む：</strong>相手がキャプチャを狙っている時は、穴を空にさせないよう妨害しましょう</li>
                    </ul>
                </section>

                <section>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #d69e2e', paddingLeft: '1rem', color: '#744210' }}>まとめ</h2>
                    <p>
                        マンカラは一見シンプルですが、計算と戦略が勝敗を分ける知的なゲームです。
                        Asobi LoungeではCPU対戦で練習できるので、まずは気軽に試してみてください。
                        繰り返しプレイすることで、確実に上達を実感できるはずです。
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
