'use client';

import React from 'react';
import Link from 'next/link';

export default function BrainTrainingPage() {
    return (
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem', fontFamily: 'sans-serif', lineHeight: '1.8', color: '#2d3748' }}>
            <header style={{ marginBottom: '3rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '2rem' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: '800', letterSpacing: '-0.02em' }}>ボードゲームで脳トレ：科学が証明する効果とおすすめゲーム</h1>
                <p style={{ color: '#718096', fontSize: '0.95rem' }}>2026年1月2日</p>
            </header>

            <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #805ad5', paddingLeft: '1rem', color: '#553c9a' }}>ボードゲームが脳に良い理由</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        ボードゲームが認知機能の維持・向上に効果的であることは、多くの研究で示されています。
                        特に将棋やチェスなどの戦略ゲームは、以下のような効果が期待できます：
                    </p>
                    <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
                        <li style={{ marginBottom: '0.5rem' }}><strong>記憶力の向上：</strong>定跡や局面を覚えることで、ワーキングメモリが鍛えられます</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>問題解決能力：</strong>最善手を探す過程で、論理的思考が養われます</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>集中力の持続：</strong>長時間の対局は、持続的な注意力を必要とします</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>認知症予防：</strong>高齢者においても、認知機能の低下を遅らせる効果が報告されています</li>
                    </ul>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #805ad5', paddingLeft: '1rem', color: '#553c9a' }}>目的別おすすめゲーム</h2>

                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#4a5568' }}>論理的思考力を鍛えたい</h3>
                    <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
                        <li style={{ marginBottom: '0.5rem' }}>将棋・チェス：先読みと戦略立案</li>
                        <li style={{ marginBottom: '0.5rem' }}>Hit & Blow：仮説検証と消去法</li>
                        <li style={{ marginBottom: '0.5rem' }}>マインスイーパー：確率計算とパターン認識</li>
                    </ul>

                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#4a5568' }}>計算力を鍛えたい</h3>
                    <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
                        <li style={{ marginBottom: '0.5rem' }}>株シミュレーター：数値計算と判断</li>
                        <li style={{ marginBottom: '0.5rem' }}>マンカラ：先読み計算</li>
                    </ul>

                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#4a5568' }}>創造力を鍛えたい</h3>
                    <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
                        <li style={{ marginBottom: '0.5rem' }}>お絵かきクイズ：表現力と発想力</li>
                        <li style={{ marginBottom: '0.5rem' }}>Block Territory：空間認識と創造的配置</li>
                    </ul>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #805ad5', paddingLeft: '1rem', color: '#553c9a' }}>効果的な脳トレのコツ</h2>
                    <ul style={{ marginLeft: '1.5rem' }}>
                        <li style={{ marginBottom: '0.5rem' }}><strong>毎日少しずつ：</strong>1日15-30分が効果的。無理なく続けられる時間を設定しましょう</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>難易度を調整：</strong>簡単すぎても難しすぎても効果は薄い。適度な挑戦が大切です</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>種類を変える：</strong>同じゲームばかりでなく、違う種類のゲームにも挑戦しましょう</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>振り返りをする：</strong>対局後に「なぜ負けたか」を考えると、より効果的です</li>
                    </ul>
                </section>

                <section>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #805ad5', paddingLeft: '1rem', color: '#553c9a' }}>まとめ</h2>
                    <p>
                        ボードゲームは楽しみながら脳を鍛えられる、理想的な脳トレ方法です。
                        Asobi Loungeでは多彩なゲームを無料で楽しめるので、
                        ぜひ日課として取り入れてみてください。続けることが最も大切です。
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
