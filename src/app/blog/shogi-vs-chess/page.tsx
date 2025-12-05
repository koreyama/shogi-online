import React from 'react';
import Link from 'next/link';

export default function ArticlePage() {
    return (
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem', fontFamily: 'sans-serif', lineHeight: '1.8', color: '#2d3748' }}>
            <header style={{ marginBottom: '3rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '2rem' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: '800', letterSpacing: '-0.02em' }}>将棋とチェスの違い：持ち駒と盤の広さ</h1>
                <p style={{ color: '#718096', fontSize: '0.95rem' }}>2025年12月5日</p>
            </header>

            <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #3182ce', paddingLeft: '1rem', color: '#2c5282' }}>兄弟だけど全然違う</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        将棋とチェスは、どちらも古代インドの「チャトランガ」を起源に持つ兄弟のようなゲームです。
                        しかし、長い歴史の中でそれぞれ独自の進化を遂げ、今では全く異なるゲーム性を持っています。
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #3182ce', paddingLeft: '1rem', color: '#2c5282' }}>最大の違い「持ち駒」</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        将棋の最大の特徴は、取った相手の駒を自分の駒として再利用できる「持ち駒」ルールです。
                        これにより、盤上の駒が減っていっても戦力が補充されるため、終盤になるほど激しい戦いになります。
                        一方、チェスは取られた駒はゲームから除外されるため、終盤は駒が少なくなり、スピーディーな収束に向かいます。
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #3182ce', paddingLeft: '1rem', color: '#2c5282' }}>盤の広さと駒の動き</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        将棋は9x9マス、チェスは8x8マスです。
                        チェスの駒（クイーンやビショップなど）は、将棋の駒に比べて射程が長く、一気に遠くまで移動できるものが多いです。
                        そのため、チェスは序盤からダイナミックな展開になりやすく、将棋はジリジリとした押し引きが続く傾向があります。
                    </p>
                    <p>
                        どちらも奥深いゲームです。ぜひ両方プレイして、その違いを楽しんでみてください。
                    </p>
                </section>
            </div>

            <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link href="/blog" style={{ color: '#3182ce', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    &larr; コラム一覧へ戻る
                </Link>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Link href="/shogi" style={{
                        padding: '0.8rem 1.5rem',
                        background: '#2c5282',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '30px',
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                        boxShadow: '0 4px 6px rgba(44, 82, 130, 0.3)'
                    }}>
                        将棋をプレイ
                    </Link>
                    <Link href="/chess" style={{
                        padding: '0.8rem 1.5rem',
                        background: '#2b6cb0',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '30px',
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                        boxShadow: '0 4px 6px rgba(43, 108, 176, 0.3)'
                    }}>
                        チェスをプレイ
                    </Link>
                </div>
            </div>
        </main>
    );
}
