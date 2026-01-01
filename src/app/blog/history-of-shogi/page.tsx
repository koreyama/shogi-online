import React from 'react';
import Link from 'next/link';

export default function ArticlePage() {
    return (
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem', fontFamily: 'sans-serif', lineHeight: '1.8', color: '#2d3748' }}>
            <header style={{ marginBottom: '3rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '2rem' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: '800', letterSpacing: '-0.02em' }}>将棋の歴史：古代インドから現代AIまで</h1>
                <p style={{ color: '#718096', fontSize: '0.95rem' }}>2025年12月1日</p>
            </header>

            <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #3182ce', paddingLeft: '1rem', color: '#2c5282' }}>起源は古代インドの「チャトランガ」</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        将棋のルーツは、紀元前3世紀頃の古代インドで遊ばれていた「チャトランガ」というゲームにあると言われています。
                        チャトランガは4人制のサイコロゲームでしたが、これが西に伝わって「チェス」になり、東に伝わって「シャンチー（中国将棋）」や「将棋」になったと考えられています。
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #3182ce', paddingLeft: '1rem', color: '#2c5282' }}>日本独自の進化「持ち駒」</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        日本に将棋が伝わったのは平安時代と言われていますが、当時の将棋（平安将棋）にはまだ「持ち駒」のルールはありませんでした。
                        「取った駒を自分の味方として使える」という画期的なルールが生まれたのは、室町時代から戦国時代にかけてだと言われています。
                    </p>
                    <p>
                        これは、捕虜を処刑せずに味方に引き入れるという、当時の日本の戦争観や雇用形態が影響しているという説もあります。
                        このルールのおかげで、将棋は引き分けが極端に少なく、終盤までスリリングな展開が続く世界でも稀有なゲームとなりました。
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #3182ce', paddingLeft: '1rem', color: '#2c5282' }}>江戸時代の将棋所と家元</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        江戸時代に入ると、徳川幕府によって「将棋所」が設けられ、大橋家・大橋分家・伊藤家の「将棋三家」が家元として将棋界を統率しました。
                        年に一度、将軍の御前で対局する「御城将棋」が行われ、これが現在の「名人戦」のルーツとなっています。
                        また、この時代には「定跡（じょうせき）」の研究が進み、多くの戦法が編み出されました。
                    </p>
                </section>

                <section>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #3182ce', paddingLeft: '1rem', color: '#2c5282' }}>現代、そしてAIとの共存</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        昭和、平成を経て、将棋はプロ棋士たちの激闘によって多くのファンを魅了してきました。
                        そして21世紀、AI（人工知能）の登場により、将棋界は大きな変革期を迎えました。
                    </p>
                    <p>
                        かつては「人間には勝てない」と言われたコンピュータ将棋ですが、現在ではプロ棋士を凌駕する実力を持ち、棋士の研究パートナーとして欠かせない存在となっています。
                        AIが発見した新しい手や感覚は、人間の将棋をさらに進化させています。
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
