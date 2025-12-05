import React from 'react';
import Link from 'next/link';

export default function ArticlePage() {
    return (
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem', fontFamily: 'sans-serif', lineHeight: '1.8', color: '#2d3748' }}>
            <header style={{ marginBottom: '3rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '2rem' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: '800', letterSpacing: '-0.02em' }}>『Divine Duel』初心者向け攻略ガイド</h1>
                <p style={{ color: '#718096', fontSize: '0.95rem' }}>2025年12月4日</p>
            </header>

            <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #3182ce', paddingLeft: '1rem', color: '#2c5282' }}>まずは「マナ」の管理から</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        オリジナルカードゲーム『Divine Duel』で勝つための基本は、マナ（魔力）の管理です。
                        強力なカードは多くのマナを消費しますが、序盤はマナが少ないため使えません。
                        低コストのユニットで序盤を凌ぎ、後半に高コストの強力なユニットで逆転するというのが王道のパターンです。
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #3182ce', paddingLeft: '1rem', color: '#2c5282' }}>おすすめの神（アバター）</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        ゲーム開始時に選ぶアバターによって、戦い方が大きく変わります。初心者におすすめなのは以下の2柱です。
                    </p>
                    <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                        <li style={{ marginBottom: '0.5rem' }}><strong>オーディン (Odin):</strong> 攻撃的なスキルを持っています。相手のユニットを直接攻撃できるため、盤面の制圧がしやすいです。</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>アレス (Ares):</strong> ユニットの攻撃力を強化するスキルが得意です。低コストのユニットでも強化すれば脅威になります。</li>
                    </ul>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #3182ce', paddingLeft: '1rem', color: '#2c5282' }}>デッキ構築のコツ</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        デッキには20枚のカードを入れることができますが、バランスが重要です。
                        高コストのカードばかり入れると、序盤に何もできずに負けてしまいます。
                        コスト1〜3のカードを半分くらい入れ、残りを中・高コストのカードにするのが安定するでしょう。
                    </p>
                    <p>
                        また、「スペルカード」も重要です。ユニットだけでなく、相手を妨害したり味方を回復するスペルをうまく組み合わせることで、戦況を有利に進められます。
                    </p>
                </section>
            </div>

            <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link href="/blog" style={{ color: '#3182ce', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    &larr; コラム一覧へ戻る
                </Link>
                <Link href="/card-game/lobby" style={{
                    padding: '0.8rem 2rem',
                    background: '#805ad5',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '30px',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 6px rgba(128, 90, 213, 0.3)'
                }}>
                    デッキを組んでみる &rarr;
                </Link>
            </div>
        </main>
    );
}
