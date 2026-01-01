'use client';

import React from 'react';
import Link from 'next/link';

export default function OnlineGamingBenefitsPage() {
    return (
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem', fontFamily: 'sans-serif', lineHeight: '1.8', color: '#2d3748' }}>
            <header style={{ marginBottom: '3rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '2rem' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: '800', letterSpacing: '-0.02em' }}>ブラウザゲームの魅力：いつでもどこでも始められる手軽さ</h1>
                <p style={{ color: '#718096', fontSize: '0.95rem' }}>2026年1月2日</p>
            </header>

            <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #3182ce', paddingLeft: '1rem', color: '#2c5282' }}>インストール不要という革命</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        かつてゲームをプレイするには、専用のハードウェアやソフトウェアが必要でした。
                        しかし今、ブラウザ技術の進化により、URLを開くだけでハイクオリティなゲームを楽しめる時代になりました。
                    </p>
                    <p>
                        ストレージ容量を気にする必要もなく、アップデートを待つ必要もありません。
                        常に最新版のゲームが自動的に提供されます。
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #3182ce', paddingLeft: '1rem', color: '#2c5282' }}>マルチデバイス対応の便利さ</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        ブラウザゲームの大きな利点は、デバイスを選ばないことです：
                    </p>
                    <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
                        <li style={{ marginBottom: '0.5rem' }}>自宅のPCで腰を据えてじっくりプレイ</li>
                        <li style={{ marginBottom: '0.5rem' }}>通勤中にスマホでサクッと対局</li>
                        <li style={{ marginBottom: '0.5rem' }}>カフェでタブレットを使ってリラックスプレイ</li>
                        <li style={{ marginBottom: '0.5rem' }}>会社の休憩時間に気分転換</li>
                    </ul>
                    <p>
                        Asobi Loungeではクラウドセーブに対応しているため、デバイスを変えても続きからプレイできます。
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #3182ce', paddingLeft: '1rem', color: '#2c5282' }}>オンライン対戦の楽しさ</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        一人で黙々とCPUと対戦するのも良いですが、
                        やはり人間同士の対戦には独特の緊張感と楽しさがあります。
                    </p>
                    <ul style={{ marginLeft: '1.5rem' }}>
                        <li style={{ marginBottom: '0.5rem' }}>予想外の手に驚く瞬間</li>
                        <li style={{ marginBottom: '0.5rem' }}>接戦の末に勝利した時の達成感</li>
                        <li style={{ marginBottom: '0.5rem' }}>お絵かきクイズで友達と大笑い</li>
                        <li style={{ marginBottom: '0.5rem' }}>見知らぬ人とでも繋がれるオンラインの魅力</li>
                    </ul>
                </section>

                <section>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #3182ce', paddingLeft: '1rem', color: '#2c5282' }}>これからのブラウザゲーム</h2>
                    <p>
                        WebGL、WebAssemblyなどの技術発展により、
                        ブラウザゲームのクオリティは年々向上しています。
                        将来的にはコンソールゲームと遜色のない体験がブラウザで可能になるでしょう。
                        Asobi Loungeは、この進化の最前線で最高のゲーム体験を提供し続けます。
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
