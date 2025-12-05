'use client';

import React from 'react';
import Link from 'next/link';

export default function BoardGameBenefitsPage() {
    return (
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif', lineHeight: '1.8', color: '#2d3748' }}>
            <nav style={{ marginBottom: '2rem' }}>
                <Link href="/blog" style={{ color: '#3182ce', textDecoration: 'none' }}>&larr; ブログ一覧へ戻る</Link>
            </nav>

            <article>
                <header style={{ marginBottom: '2rem' }}>
                    <span style={{ color: '#718096', fontSize: '0.9rem' }}>2025年12月5日</span>
                    <h1 style={{ fontSize: '2rem', marginTop: '0.5rem', color: '#1a202c' }}>ボードゲームが脳に与える5つの効果：科学的に証明されたメリット</h1>
                </header>

                <div style={{ color: '#4a5568' }}>
                    <p style={{ marginBottom: '1.5rem' }}>
                        ボードゲームは単なる娯楽ではありません。
                        最新の研究では、定期的にボードゲームをプレイすることで、
                        脳の様々な機能が向上することが明らかになっています。
                    </p>

                    <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem', color: '#1a202c' }}>1. 論理的思考力の向上</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        チェスや将棋などの戦略ゲームは、論理的思考力を鍛えます。
                        「この手を打つと、相手はこう返してくる」という先読みを繰り返すことで、
                        因果関係を理解し、計画を立てる能力が向上します。
                    </p>
                    <p style={{ marginBottom: '1rem' }}>
                        研究によると、チェスを定期的にプレイする子供は、数学の成績が向上する傾向があります。
                    </p>

                    <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem', color: '#1a202c' }}>2. 記憶力の強化</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        ゲームのルールを覚え、過去の手筋を記憶し、相手のパターンを把握する。
                        これらの作業は、短期記憶と長期記憶の両方を活性化させます。
                    </p>
                    <p style={{ marginBottom: '1rem' }}>
                        特に高齢者においては、ボードゲームが認知症予防に効果があるという研究結果も報告されています。
                    </p>

                    <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem', color: '#1a202c' }}>3. 集中力の持続</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        ボードゲームでは、一局を通して集中力を維持する必要があります。
                        現代人に不足しがちな「深い集中」の練習になります。
                    </p>
                    <p style={{ marginBottom: '1rem' }}>
                        スマートフォンによる断片的な情報摂取とは異なり、
                        ボードゲームは長時間の集中を要求することで、注意力を鍛えます。
                    </p>

                    <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem', color: '#1a202c' }}>4. ストレス軽減</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        ゲームに没頭することで、日常のストレスから一時的に離れることができます。
                        これは「フロー状態」と呼ばれ、精神的なリフレッシュ効果があります。
                    </p>
                    <p style={{ marginBottom: '1rem' }}>
                        また、友人や家族とボードゲームを楽しむことで、社会的なつながりが強化され、
                        幸福感が向上することも研究で示されています。
                    </p>

                    <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem', color: '#1a202c' }}>5. 意思決定能力の向上</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        ボードゲームでは、限られた情報と時間の中で最善の選択をする必要があります。
                        この訓練は、実生活での意思決定能力にも良い影響を与えます。
                    </p>
                    <p style={{ marginBottom: '1rem' }}>
                        リスクとリターンを天秤にかけ、時には大胆な決断を下す経験は、
                        ビジネスパーソンにとっても貴重なトレーニングになります。
                    </p>

                    <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem', color: '#1a202c' }}>おすすめのゲーム</h2>
                    <ul style={{ paddingLeft: '1.5rem', marginBottom: '1.5rem' }}>
                        <li style={{ marginBottom: '0.5rem' }}><strong>論理的思考</strong>：チェス、将棋、リバーシ</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>記憶力</strong>：五目並べ、マンカラ</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>集中力</strong>：マインスイーパー、チェッカー</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>意思決定</strong>：ポーカー、大富豪</li>
                    </ul>

                    <div style={{ background: '#ebf8ff', padding: '1.5rem', borderRadius: '8px', marginTop: '2rem' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#2b6cb0' }}>今日から脳トレを始めよう</h3>
                        <p style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>
                            Asobi Loungeでは、15種類以上のボードゲームを無料でプレイできます。
                            毎日10分のゲームが、あなたの脳を活性化させます。
                        </p>
                        <Link href="/" style={{ color: '#3182ce', fontWeight: 600 }}>ゲーム一覧を見る →</Link>
                    </div>
                </div>
            </article>
        </main>
    );
}
