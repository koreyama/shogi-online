import React from 'react';
import Link from 'next/link';

export default function ArticlePage() {
    return (
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem', fontFamily: 'sans-serif', lineHeight: '1.8', color: '#2d3748' }}>
            <header style={{ marginBottom: '3rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '2rem' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: '800', letterSpacing: '-0.02em' }}>マインスイーパーのコツ：数字のパターンを覚えよう</h1>
                <p style={{ color: '#718096', fontSize: '0.95rem' }}>2025年12月5日</p>
            </header>

            <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #3182ce', paddingLeft: '1rem', color: '#2c5282' }}>運ゲーではありません</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        マインスイーパーを「運任せにクリックするゲーム」だと思っていませんか？
                        実は、論理的な思考で爆弾の位置を特定できるパズルゲームなのです。
                        基本となるいくつかの「パターン」を覚えるだけで、クリア率は劇的に上がります。
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #3182ce', paddingLeft: '1rem', color: '#2c5282' }}>基本パターン「1-1」</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        壁際で「1」が2つ並んでいる場合（1-1）、その外側の3マス目は必ず安全です。
                        これは、もしそこに爆弾があったら矛盾が生じてしまうからです。
                        この「1-1の法則」は頻出パターンなので、見つけたらラッキーと思いましょう。
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #3182ce', paddingLeft: '1rem', color: '#2c5282' }}>基本パターン「1-2-1」</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        「1-2-1」と並んでいる場合、両端の「1」のそばに爆弾があり、真ん中の「2」のそばは安全です。
                        これも理屈を考えると分かりますが、プレイ中は理屈よりも「形」で覚えてしまった方が早いです。
                    </p>
                    <p>
                        これらの定石を駆使して、タイムアタックに挑戦してみてください！
                    </p>
                </section>
            </div>

            <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link href="/blog" style={{ color: '#3182ce', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    &larr; コラム一覧へ戻る
                </Link>
                <Link href="/minesweeper" style={{
                    padding: '0.8rem 2rem',
                    background: '#e53e3e',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '30px',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 6px rgba(229, 62, 62, 0.3)'
                }}>
                    マインスイーパーをプレイする &rarr;
                </Link>
            </div>
        </main>
    );
}
