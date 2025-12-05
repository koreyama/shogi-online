import React from 'react';
import Link from 'next/link';

export default function ArticlePage() {
    return (
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem', fontFamily: 'sans-serif', lineHeight: '1.8', color: '#2d3748' }}>
            <header style={{ marginBottom: '3rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '2rem' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: '800', letterSpacing: '-0.02em' }}>新作ゲーム『Civilization Builder』リリース！</h1>
                <p style={{ color: '#718096', fontSize: '0.95rem' }}>2025年12月5日</p>
            </header>

            <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #3182ce', paddingLeft: '1rem', color: '#2c5282' }}>文明を築く放置系シミュレーション</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        Asobi Loungeに新しいゲームが仲間入りしました！その名も『Civilization Builder（シヴィライゼーション・ビルダー）』。
                        クリック一つで資源を集め、技術を研究し、文明を発展させていく放置系シミュレーションゲームです。
                    </p>
                    <p>
                        最初は「食料」を集めるだけの原始時代からスタートしますが、やがて「火」を発見し、「農耕」を覚え、文明は急速に発展していきます。
                        最終的には産業革命を経て、現代文明へと到達することを目指します。
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #3182ce', paddingLeft: '1rem', color: '#2c5282' }}>やり込み要素満載の技術ツリー</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        このゲームの最大の魅力は、広大な「技術ツリー」です。
                        「文字」を発明すれば「学校」が建設できるようになり、「航海術」を覚えれば「交易」が可能になります。
                        どの技術から研究するかによって、文明の発展スピードや得意分野が変わってくるため、プレイヤーごとの戦略が試されます。
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #3182ce', paddingLeft: '1rem', color: '#2c5282' }}>クラウドセーブでいつでも続きを</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        放置系ゲームで一番怖いのは「データの消失」ですが、ご安心ください。
                        Googleアカウントでログインしていれば、ゲームデータは自動的にクラウドに保存されます。
                        PCで遊んだ続きを、移動中にスマホでチェックする…なんてことも可能です。
                    </p>
                    <p>
                        さあ、あなたも自分だけの文明を築き上げてみませんか？
                    </p>
                </section>
            </div>

            <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link href="/blog" style={{ color: '#3182ce', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    &larr; コラム一覧へ戻る
                </Link>
                <Link href="/clicker" style={{
                    padding: '0.8rem 2rem',
                    background: '#ecc94b',
                    color: '#744210',
                    textDecoration: 'none',
                    borderRadius: '30px',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 6px rgba(236, 201, 75, 0.3)'
                }}>
                    今すぐプレイする &rarr;
                </Link>
            </div>
        </main>
    );
}
