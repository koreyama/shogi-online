'use client';

import React from 'react';
import Link from 'next/link';

export default function CivilizationGuidePage() {
    return (
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem', fontFamily: 'sans-serif', lineHeight: '1.8', color: '#2d3748' }}>
            <header style={{ marginBottom: '3rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '2rem' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: '800', letterSpacing: '-0.02em' }}>Civilization Builder完全攻略：効率的な文明発展の道</h1>
                <p style={{ color: '#718096', fontSize: '0.95rem' }}>2026年1月2日</p>
            </header>

            <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #ecc94b', paddingLeft: '1rem', color: '#975a16' }}>ゲーム概要</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        Civilization Builderは、原始時代から現代文明まで、文明を発展させていく放置系シミュレーションゲームです。
                        クリックで資源を集め、建物を建て、技術を研究して、より高度な文明を目指します。
                        放置しながらでも資源が貯まるので、忙しい人にもピッタリです。
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #ecc94b', paddingLeft: '1rem', color: '#975a16' }}>序盤の進め方</h2>
                    <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
                        <li style={{ marginBottom: '0.5rem' }}><strong>採集を優先：</strong>まずは食料を集めて人口を増やしましょう</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>住居を建設：</strong>人口が増えると労働力が増え、効率が上がります</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>道具を開発：</strong>技術研究で採集効率を上げましょう</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>バランスを意識：</strong>食料・木材・石材をバランスよく確保</li>
                    </ul>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #ecc94b', paddingLeft: '1rem', color: '#975a16' }}>中盤以降のポイント</h2>
                    <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
                        <li style={{ marginBottom: '0.5rem' }}><strong>自動化を進める：</strong>農場や鉱山で自動収集できるようになります</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>新しい資源：</strong>金属や貨幣など、新しい資源の獲得方法を研究</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>ワンダー建設：</strong>特殊効果のある建物を目指しましょう</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>放置時間を活用：</strong>寝ている間に資源を貯めると効率的です</li>
                    </ul>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #ecc94b', paddingLeft: '1rem', color: '#975a16' }}>クラウドセーブを活用しよう</h2>
                    <p>
                        Civilization BuilderはGoogleアカウントでログインすると、
                        進行状況がクラウドに保存されます。
                        PCで始めた文明をスマホで続けることも可能です。
                        複数デバイスで効率よく文明を発展させましょう。
                    </p>
                </section>

                <section>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #ecc94b', paddingLeft: '1rem', color: '#975a16' }}>最後に</h2>
                    <p>
                        Civilization Builderは、ゲームに張り付かなくても楽しめる設計になっています。
                        1日数回チェックして、建物を建てたり技術を研究したりするだけで
                        着実に文明は発展していきます。気長に楽しんでください！
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
