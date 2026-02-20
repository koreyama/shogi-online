'use client';

import React from 'react';
import Link from 'next/link';

export default function ShogiImprovementPage() {
    return (
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem', fontFamily: 'sans-serif', lineHeight: '1.8', color: '#2d3748' }}>
            <header style={{ marginBottom: '3rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '2rem' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: '800', letterSpacing: '-0.02em' }}>将棋の上達法：初段を目指すための3つのステップ</h1>
                <p style={{ color: '#718096', fontSize: '0.95rem' }}>2026年2月15日</p>
            </header>

            <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <section style={{ marginBottom: '3rem' }}>
                    <p style={{ marginBottom: '1.5rem' }}>
                        将棋を始めたけれど、なかなか勝てない、どうやって勉強すればいいかわからない…そんな悩みを持っていませんか？
                        将棋は非常に奥深いゲームですが、上達には明確な「順序」があります。
                        この記事では、初心者が効率よく実力をつけ、初段を目指すための3つのステップを解説します。
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', borderLeft: '5px solid #3182ce', paddingLeft: '1rem', color: '#2c5282' }}>ステップ1：詰将棋で「終盤力」を鍛える</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        将棋で最も重要なのは「終盤力」、つまり「相手の玉を詰ます力」です。
                        どんなに序盤や中盤で有利になっても、最後に相手玉を詰ませられなければ勝つことはできません。
                    </p>
                    <p style={{ marginBottom: '1rem' }}>
                        <strong>なぜ詰将棋が良いのか？</strong>
                        <br />
                        詰将棋は、駒の動かし方と「詰み」の形を覚えるのに最適なトレーニングです。
                        1手詰、3手詰といった短い手数の詰将棋を毎日解くことで、「この形なら詰む」というパターン認識能力が養われます。
                        これはスポーツで言うところの筋力トレーニングのようなもので、基礎体力をつけるために不可欠です。
                    </p>
                    <div style={{ background: '#f7fafc', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #4fd1c5' }}>
                        <strong>★ここがポイント</strong><br />
                        難しい問題を時間をかけて解くよりも、簡単な問題を「一瞬で」解けるようになるまで繰り返すのが効果的です。
                    </div>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', borderLeft: '5px solid #3182ce', paddingLeft: '1rem', color: '#2c5282' }}>ステップ2：得意な戦法を一つ持つ</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        将棋には「居飛車」「振り飛車」など多くの戦法がありますが、最初から全てを覚えるのは不可能です。
                        まずは「これだけは誰にも負けない」という得意戦法を一つ決めましょう。
                    </p>
                    <h3 style={{ fontSize: '1.4rem', marginTop: '1.5rem', marginBottom: '1rem', color: '#2d3748' }}>おすすめの戦法</h3>
                    <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', lineHeight: '2' }}>
                        <li><strong>棒銀（ぼうぎん）：</strong>居飛車の基本。攻めの狙いが明確でわかりやすい。</li>
                        <li><strong>四間飛車（しけんびしゃ）：</strong>振り飛車の代表格。守りが堅く、カウンター狙いが楽しい。</li>
                        <li><strong>中飛車（なかびしゃ）：</strong>攻守のバランスが良く、主導権を握りやすい。</li>
                    </ul>
                    <p>
                        一つの戦法を深く理解することで、駒の効率的な使い方や、攻めと守りのリズムが自然と身につきます。
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', borderLeft: '5px solid #3182ce', paddingLeft: '1rem', color: '#2c5282' }}>ステップ3：実戦と「感想戦」</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        知識をインプットしたら、実戦でアウトプットしましょう。
                        そして、実戦よりも大切なのが対局後の「振り返り（感想戦）」です。
                    </p>
                    <p style={{ marginBottom: '1rem' }}>
                        「どこで悪くなったのか？」「もっと良い手はなかったか？」を考えることで、同じミスを繰り返さなくなります。
                        最近はAI（人工知能）を使って自分の将棋を解析することもできます。
                        「評価値」を見て、形勢が大きく変わった局面だけでもチェックする習慣をつけましょう。
                    </p>
                </section>

                <section>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', borderLeft: '5px solid #3182ce', paddingLeft: '1rem', color: '#2c5282' }}>まとめ</h2>
                    <p style={{ marginBottom: '1.5rem' }}>
                        1. 毎日詰将棋を解く<br />
                        2. 得意戦法を磨く<br />
                        3. 実戦後に必ず振り返る
                    </p>
                    <p>
                        この3つを地道に続ければ、初段への道は必ず開けます。
                        Asobi Loungeの将棋ゲームで、ぜひ今日から練習を始めてみてください！
                    </p>
                </section>
            </div>

            <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link href="/blog" style={{ color: '#3182ce', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    &larr; コラム一覧へ戻る
                </Link>
                <Link href="/shogi" style={{
                    padding: '0.8rem 2rem',
                    background: '#3182ce',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '30px',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 6px rgba(49, 130, 206, 0.3)'
                }}>
                    将棋をプレイする &rarr;
                </Link>
            </div>
        </main>
    );
}
