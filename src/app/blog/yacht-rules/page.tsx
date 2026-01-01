'use client';

import React from 'react';
import Link from 'next/link';

export default function YachtRulesPage() {
    return (
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem', fontFamily: 'sans-serif', lineHeight: '1.8', color: '#2d3748' }}>
            <header style={{ marginBottom: '3rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '2rem' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: '800', letterSpacing: '-0.02em' }}>ヨット（ヤッツィー）のルール完全ガイド</h1>
                <p style={{ color: '#718096', fontSize: '0.95rem' }}>2026年1月2日</p>
            </header>

            <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #ed8936', paddingLeft: '1rem', color: '#c05621' }}>ヨットとは？</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        ヨット（Yacht）は、5つのサイコロを使って役を作るダイスゲームです。
                        「ヤッツィー（Yahtzee）」という名前でも知られ、世界中で愛されています。
                        ポーカーのような役を作りながら、限られた回数で高得点を目指す戦略的なゲームです。
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #ed8936', paddingLeft: '1rem', color: '#c05621' }}>基本ルール</h2>
                    <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
                        <li style={{ marginBottom: '0.5rem' }}>プレイヤーは1ターンに最大3回までサイコロを振れます</li>
                        <li style={{ marginBottom: '0.5rem' }}>1回目の後、残したいサイコロを選んで固定し、残りだけ振り直せます</li>
                        <li style={{ marginBottom: '0.5rem' }}>3回以内に役を完成させ、スコアシートの対応する欄に記入します</li>
                        <li style={{ marginBottom: '0.5rem' }}>各役は1ゲームで1回しか使えません</li>
                        <li style={{ marginBottom: '0.5rem' }}>全13の役を埋めたらゲーム終了、合計点が高い方の勝ちです</li>
                    </ul>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #ed8936', paddingLeft: '1rem', color: '#c05621' }}>役の種類と得点</h2>
                    <p style={{ marginBottom: '1rem' }}><strong>【上段（数字系）】</strong></p>
                    <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
                        <li style={{ marginBottom: '0.5rem' }}>1の目〜6の目：該当する目の合計点（例：3が4つなら12点）</li>
                        <li style={{ marginBottom: '0.5rem' }}>上段の合計が63点以上ならボーナス35点！</li>
                    </ul>
                    <p style={{ marginBottom: '1rem' }}><strong>【下段（役系）】</strong></p>
                    <ul style={{ marginLeft: '1.5rem' }}>
                        <li style={{ marginBottom: '0.5rem' }}>スリーカード：同じ目が3つ（全サイコロの合計点）</li>
                        <li style={{ marginBottom: '0.5rem' }}>フォーカード：同じ目が4つ（全サイコロの合計点）</li>
                        <li style={{ marginBottom: '0.5rem' }}>フルハウス：3つ+2つの組み合わせ（25点）</li>
                        <li style={{ marginBottom: '0.5rem' }}>スモールストレート：4つ連続（30点）</li>
                        <li style={{ marginBottom: '0.5rem' }}>ラージストレート：5つ連続（40点）</li>
                        <li style={{ marginBottom: '0.5rem' }}>ヨット（ヤッツィー）：5つ全て同じ（50点）</li>
                        <li style={{ marginBottom: '0.5rem' }}>チャンス：何でもOK（全サイコロの合計点）</li>
                    </ul>
                </section>

                <section>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #ed8936', paddingLeft: '1rem', color: '#c05621' }}>勝つためのコツ</h2>
                    <ul style={{ marginLeft: '1.5rem' }}>
                        <li style={{ marginBottom: '0.5rem' }}><strong>上段ボーナスを狙う：</strong>63点ボーナスは大きいので、特に5と6は多めに取りたい</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>ヨットは無理に狙わない：</strong>確率が低いので、チャンスとして使う判断も重要</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>序盤は柔軟に：</strong>後半に役が埋まらなくなるリスクを避けるため、序盤は選択肢を残す</li>
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
