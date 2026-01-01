'use client';

import React from 'react';
import Link from 'next/link';

export default function HitBlowTipsPage() {
    return (
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem', fontFamily: 'sans-serif', lineHeight: '1.8', color: '#2d3748' }}>
            <header style={{ marginBottom: '3rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '2rem' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: '800', letterSpacing: '-0.02em' }}>Hit & Blow攻略：論理的思考で数字を当てる</h1>
                <p style={{ color: '#718096', fontSize: '0.95rem' }}>2026年1月2日</p>
            </header>

            <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #4299e1', paddingLeft: '1rem', color: '#2b6cb0' }}>Hit & Blowとは？</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        Hit & Blow（ヒット・アンド・ブロー）は、相手が設定した秘密の数字を論理的に推理して当てるゲームです。
                        「マスターマインド」「ヌメロン」などの名前でも知られており、
                        プログラマーやエンジニアにも人気のある論理パズルです。
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #4299e1', paddingLeft: '1rem', color: '#2b6cb0' }}>基本ルール</h2>
                    <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
                        <li style={{ marginBottom: '0.5rem' }}>相手が秘密の数字（通常4桁、各桁は0-9で重複なし）を設定します</li>
                        <li style={{ marginBottom: '0.5rem' }}>あなたは数字を予想して回答します</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>Hit：</strong>数字も位置も正解</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>Blow：</strong>数字は含まれているが位置が違う</li>
                        <li style={{ marginBottom: '0.5rem' }}>ヒントを元に推理を繰り返し、正解（4Hit）を目指します</li>
                    </ul>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #4299e1', paddingLeft: '1rem', color: '#2b6cb0' }}>効率的な推理方法</h2>
                    <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
                        <li style={{ marginBottom: '0.5rem' }}><strong>最初の予想：</strong>「1234」「5678」など、まず広く数字を探りましょう</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>消去法：</strong>0Hitの数字は全て除外できます</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>位置の特定：</strong>Blowの数字は、位置を変えて試してみましょう</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>メモを取る：</strong>各桁ごとに可能性のある数字をメモすると整理しやすいです</li>
                    </ul>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #4299e1', paddingLeft: '1rem', color: '#2b6cb0' }}>高度なテクニック</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        上級者向けのテクニックをいくつか紹介します：
                    </p>
                    <ul style={{ marginLeft: '1.5rem' }}>
                        <li style={{ marginBottom: '0.5rem' }}><strong>情報最大化：</strong>なるべく多くの情報が得られる予想を選ぶ</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>確率計算：</strong>残りの候補数を常に把握し、最も効率的な質問をする</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>パターン認識：</strong>よくあるパターンを覚えておくと素早く絞り込める</li>
                    </ul>
                </section>

                <section>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #4299e1', paddingLeft: '1rem', color: '#2b6cb0' }}>脳トレ効果</h2>
                    <p>
                        Hit & Blowは論理的思考力を鍛えるのに最適なゲームです。
                        プログラミングやデバッグにも通じる「仮説→検証→修正」のサイクルを
                        楽しみながら体験できます。毎日の脳トレとしてもおすすめです。
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
