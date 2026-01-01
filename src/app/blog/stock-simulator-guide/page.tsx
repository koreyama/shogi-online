'use client';

import React from 'react';
import Link from 'next/link';

export default function StockSimulatorGuidePage() {
    return (
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem', fontFamily: 'sans-serif', lineHeight: '1.8', color: '#2d3748' }}>
            <header style={{ marginBottom: '3rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '2rem' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: '800', letterSpacing: '-0.02em' }}>株シミュレーター入門：リスクゼロで投資を学ぶ</h1>
                <p style={{ color: '#718096', fontSize: '0.95rem' }}>2026年1月2日</p>
            </header>

            <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #38a169', paddingLeft: '1rem', color: '#276749' }}>なぜ株シミュレーターで学ぶべきなのか</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        「投資に興味があるけど、お金を失うのが怖い」という方は多いのではないでしょうか。
                        Asobi Loungeの株シミュレーターでは、仮想の資金を使って実際の株取引と同じ体験ができます。
                        失敗しても実際のお金は減らないので、思い切った投資戦略を試すことができます。
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #38a169', paddingLeft: '1rem', color: '#276749' }}>基本的な操作方法</h2>
                    <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
                        <li style={{ marginBottom: '0.5rem' }}><strong>銘柄選択：</strong>様々な業種の仮想銘柄から投資先を選びます</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>買い注文：</strong>買いたい株数を指定して購入します</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>売り注文：</strong>保有株を売却して利益（または損失）を確定します</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>ポートフォリオ確認：</strong>現在の保有資産と評価損益を確認できます</li>
                    </ul>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #38a169', paddingLeft: '1rem', color: '#276749' }}>初心者向け投資戦略</h2>
                    <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
                        <li style={{ marginBottom: '0.5rem' }}><strong>分散投資：</strong>一つの銘柄に集中せず、複数の銘柄に分けて投資しましょう</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>長期保有：</strong>短期的な値動きに一喜一憂せず、長い目で見ることが大切です</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>損切りライン：</strong>あらかじめ「ここまで下がったら売る」というラインを決めておきましょう</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>利確ライン：</strong>欲張りすぎず、目標利益に達したら売却することも重要です</li>
                    </ul>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #38a169', paddingLeft: '1rem', color: '#276749' }}>シミュレーターで学べること</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        株シミュレーターでは、以下のような投資の基本を実践的に学べます：
                    </p>
                    <ul style={{ marginLeft: '1.5rem' }}>
                        <li style={{ marginBottom: '0.5rem' }}>チャートの読み方と値動きの感覚</li>
                        <li style={{ marginBottom: '0.5rem' }}>感情に左右されない判断力</li>
                        <li style={{ marginBottom: '0.5rem' }}>リスク管理の重要性</li>
                        <li style={{ marginBottom: '0.5rem' }}>市場のニュースが株価に与える影響</li>
                    </ul>
                </section>

                <section>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #38a169', paddingLeft: '1rem', color: '#276749' }}>まとめ</h2>
                    <p>
                        実際の投資を始める前に、シミュレーターで十分に練習することをお勧めします。
                        失敗から学び、自分なりの投資スタイルを見つけてから本番に臨むことで、
                        より賢明な投資判断ができるようになるでしょう。
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
