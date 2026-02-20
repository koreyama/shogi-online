import React from 'react';
import Link from 'next/link';

export default function BoardGameBrainSciencePage() {
    return (
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem', fontFamily: 'sans-serif', lineHeight: '1.8', color: '#2d3748' }}>
            <header style={{ marginBottom: '3rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '2rem' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: '800', letterSpacing: '-0.02em', lineHeight: '1.4' }}>ボードゲームと脳科学：論理的思考力と認知機能の向上</h1>
                <p style={{ color: '#718096', fontSize: '0.95rem' }}>2026年2月20日</p>
            </header>

            <article style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <section style={{ marginBottom: '3rem' }}>
                    <p style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>
                        古代から人類に親しまれてきたボードゲーム。将棋やチェス、オセロ（リバーシ）といったゲームは、単なる娯楽の枠を超え、私たちの「脳」に多大な影響を与えることが近年の科学研究で明らかになっています。
                        なぜ私たちは数手先を読もうと思い悩み、その過程でどのような能力が鍛えられているのでしょうか。今回はボードゲームと脳科学の観点から、その奥深い魅力に迫ります。
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', borderLeft: '5px solid #3182ce', paddingLeft: '1rem', color: '#2b6cb0' }}>1. 前頭前野の活性化と実行機能</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        ボードゲームをプレイしている最中、人間の脳では特に「前頭前野（ぜんとうぜんや）」が活発に働いています。前頭前野は、思考、判断、意思決定、そして感情のコントロールなどを司る、いわば「脳の司令塔」です。
                    </p>
                    <p style={{ marginBottom: '1rem' }}>
                        例えば将棋で「相手がこう来たら、自分はこう指す」というシミュレーションを行うとき、私たちは脳内で**「ワーキングメモリ（作業記憶）」**をフル回転させています。現在の盤面を記憶したまま、複数の未来の展開を空想の中で描き、比較検討する。この高度な情報処理は、日常生活における問題解決能力や、計画的な行動を支える「実行機能（Executive Function）」を直接的に鍛えるトレーニングになります。
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', borderLeft: '5px solid #3182ce', paddingLeft: '1rem', color: '#2b6cb0' }}>2. パターン認識能力の向上</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        オセロなどのゲームでは、序盤の「定石（じょうせき）」や、中盤での有利な形（例えば「中割り」など）が存在します。上級者は盤面全体を一つ一つの石の集まりとしてではなく、ひとつの「意味のある塊（チャンク）」として認識しています。
                    </p>
                    <p style={{ marginBottom: '1rem' }}>
                        これを**パターン認識能力**と呼びます。プロの棋士が一瞬で盤面を記憶できるのも、膨大な対局経験によって脳内に無数のパターンが蓄積されているからです。ボードゲームを通じてこの能力が養われると、日常の複雑な事象を瞬時に構造化し、本質を見抜く力が身につくと言われています。プログラミングや言語学習においても、このパターン認識能力は極めて重要な役割を果たします。
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', borderLeft: '5px solid #3182ce', paddingLeft: '1rem', color: '#2b6cb0' }}>3. 認知機能の低下予防（アンチエイジング）</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        加齢に伴う認知機能の低下は多くの人が抱える不安ですが、継続的な精神的活動がその進行を遅らせることが様々な研究で示されています。フランスで行われた大規模な疫学調査では、ボードゲームを週に数回プレイする高齢者は、全くプレイしない高齢者に比べて、認知症のリスクが有意に低いことが報告されています。
                    </p>
                    <p style={{ marginBottom: '1rem' }}>
                        ボードゲームは言語機能、空間認識、論理的思考など、脳の多様な領域を同時に刺激します。さらに、対人ゲームである場合は「相手の意図を読む」というコミュニケーション能力も求められるため、社会的な脳の機能も維持されます。
                    </p>
                    <div style={{ background: '#ebf8ff', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #4299e1', marginTop: '1.5rem' }}>
                        <strong>🧠 脳トレ効果を高めるポイント：</strong>
                        馴染みのあるゲームだけでなく、**ルールを知らない新しいゲーム**に挑戦することが、脳の神経回路に新たな刺激（シナプス形成）を与え、最大の学習効果を生み出します。
                    </div>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', borderLeft: '5px solid #3182ce', paddingLeft: '1rem', color: '#2b6cb0' }}>4. メタ認知：自分自身を客観視する力</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        対戦ゲームで強くなるためには、「自分の思考のクセ」や「感情の揺れ」を客観的に認識する能力が不可欠です。不利な状況で焦って悪手を打ってしまった時、後から「あの時は冷静さを欠いていた」と分析する力。これを心理学では**「メタ認知」**と呼びます。
                    </p>
                    <p style={{ marginBottom: '1rem' }}>
                        メタ認知能力が高い人は、自分の限界やバイアスを理解しているため、より合理的な判断を下すことができます。負けた対局を振り返る（感想戦）行為は、まさにこのメタ認知を鍛える至高の時間なのです。
                    </p>
                </section>

                <section>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', borderLeft: '5px solid #3182ce', paddingLeft: '1rem', color: '#2b6cb0' }}>まとめ：ゲームは「脳のスポーツ」である</h2>
                    <p style={{ marginBottom: '1.5rem' }}>
                        ボードゲームは決して時間の無駄ではありません。それは安全な盤面という箱庭の中で行われる、高度な「脳のスポーツ」です。論理的思考力、パターン認識、メタ認知を鍛え、認知機能の健康を保つために、これほど手軽で優れたツールは他にありません。
                    </p>
                    <p style={{ marginBottom: '1.5rem' }}>
                        Asobi Loungeでは、将棋やリバーシをはじめ、論理的思考を鍛える様々なゲームを用意しています。1日1回の対局で、あなたの脳を気持ちよく汗ばませてみませんか？
                    </p>
                </section>
            </article>

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
                    ゲームを探す &rarr;
                </Link>
            </div>
        </main>
    );
}
