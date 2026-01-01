'use client';

import React from 'react';
import Link from 'next/link';

export default function DrawingGameTipsPage() {
    return (
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem', fontFamily: 'sans-serif', lineHeight: '1.8', color: '#2d3748' }}>
            <header style={{ marginBottom: '3rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '2rem' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: '800', letterSpacing: '-0.02em' }}>お絵かきクイズを楽しむコツ：描く側も当てる側も</h1>
                <p style={{ color: '#718096', fontSize: '0.95rem' }}>2026年1月2日</p>
            </header>

            <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #d53f8c', paddingLeft: '1rem', color: '#97266d' }}>お絵かきクイズとは？</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        お絵かきクイズは、誰かが絵を描き、他のプレイヤーがそれを当てるパーティーゲームです。
                        絵が上手くなくても大丈夫！むしろ下手な絵の方が盛り上がることも多いのが、このゲームの魅力です。
                    </p>
                    <p>
                        Asobi Loungeでは、レイヤー機能や多彩なブラシサイズ、豊富なカラーパレットを使って
                        本格的なお絵かき体験ができます。マルチプレイで友達と遊ぶのはもちろん、
                        一人で絵の練習をするのにも最適です。
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #d53f8c', paddingLeft: '1rem', color: '#97266d' }}>描く側のコツ</h2>
                    <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
                        <li style={{ marginBottom: '0.5rem' }}><strong>特徴を誇張する：</strong>リアルに描くより、特徴的な部分を大きく描いた方が伝わりやすいです</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>シンプルに：</strong>細かい部分にこだわらず、全体像を素早く描きましょう</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>複数の視点を使う：</strong>正面だけでなく、横からの視点も描くと伝わりやすくなります</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>動きを表現：</strong>矢印や線で動きを表現すると、動詞系のお題も伝わりやすくなります</li>
                    </ul>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #d53f8c', paddingLeft: '1rem', color: '#97266d' }}>当てる側のコツ</h2>
                    <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
                        <li style={{ marginBottom: '0.5rem' }}><strong>最初の数秒で形を把握：</strong>何を描こうとしているか、形の輪郭から推測しましょう</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>連想ゲーム：</strong>見えたものから連想を広げていくと正解に近づけます</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>カテゴリを絞る：</strong>動物？食べ物？人？まずカテゴリを特定するのが効率的です</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>とにかく発言：</strong>迷ったらとりあえず答えてみましょう。間違っても新しいヒントになります</li>
                    </ul>
                </section>

                <section>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #d53f8c', paddingLeft: '1rem', color: '#97266d' }}>盛り上がるお題の例</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        友達と遊ぶ時は、以下のようなお題が盛り上がります：
                    </p>
                    <ul style={{ marginLeft: '1.5rem' }}>
                        <li style={{ marginBottom: '0.5rem' }}>有名人やキャラクター（みんなが知っているもの）</li>
                        <li style={{ marginBottom: '0.5rem' }}>身近な食べ物や動物</li>
                        <li style={{ marginBottom: '0.5rem' }}>動詞（走る、泳ぐなど動きのあるもの）</li>
                        <li style={{ marginBottom: '0.5rem' }}>内輪ネタ（仲間内だけで通じるもの）</li>
                    </ul>
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
