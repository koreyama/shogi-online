import React from 'react';
import Link from 'next/link';

export default function ArticlePage() {
    return (
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif', lineHeight: '1.8', color: '#2d3748' }}>
            <header style={{ marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>将棋の歴史：古代インドから現代AIまで</h1>
                <p style={{ color: '#718096' }}>2025年12月1日</p>
            </header>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', borderLeft: '4px solid #3182ce', paddingLeft: '0.5rem' }}>起源は古代インドの「チャトランガ」</h2>
                <p>
                    将棋のルーツは、紀元前3世紀頃の古代インドで遊ばれていた「チャトランガ」というゲームにあると言われています。
                    チャトランガは4人制のサイコロゲームでしたが、これが西に伝わって「チェス」になり、東に伝わって「シャンチー（中国将棋）」や「将棋」になったと考えられています。
                </p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', borderLeft: '4px solid #3182ce', paddingLeft: '0.5rem' }}>日本独自の進化「持ち駒」</h2>
                <p>
                    日本に将棋が伝わったのは平安時代と言われていますが、当時の将棋（平安将棋）にはまだ「持ち駒」のルールはありませんでした。
                    「取った駒を自分の味方として使える」という画期的なルールが生まれたのは、室町時代から戦国時代にかけてだと言われています。
                    これは、捕虜を処刑せずに味方に引き入れるという、当時の日本の戦争観や雇用形態が影響しているという説もあります。
                    このルールのおかげで、将棋は引き分けが極端に少なく、終盤までスリリングな展開が続く世界でも稀有なゲームとなりました。
                </p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', borderLeft: '4px solid #3182ce', paddingLeft: '0.5rem' }}>江戸時代の将棋所と家元</h2>
                <p>
                    江戸時代に入ると、徳川幕府によって「将棋所」が設けられ、大橋家・大橋分家・伊藤家の「将棋三家」が家元として将棋界を統率しました。
                    年に一度、将軍の御前で対局する「御城将棋」が行われ、これが現在の「名人戦」のルーツとなっています。
                    また、この時代には「定跡（じょうせき）」の研究が進み、多くの戦法が編み出されました。
                </p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', borderLeft: '4px solid #3182ce', paddingLeft: '0.5rem' }}>現代、そしてAIとの共存</h2>
                <p>
                    昭和、平成を経て、将棋はプロ棋士たちの激闘によって多くのファンを魅了してきました。
                    そして21世紀、AI（人工知能）の登場により、将棋界は大きな変革期を迎えました。
                    かつては「人間には勝てない」と言われたコンピュータ将棋ですが、現在ではプロ棋士を凌駕する実力を持ち、棋士の研究パートナーとして欠かせない存在となっています。
                    AIが発見した新しい手や感覚は、人間の将棋をさらに進化させています。
                </p>
            </section>

            <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                <Link href="/blog" style={{ color: '#3182ce', textDecoration: 'underline' }}>&larr; コラム一覧へ戻る</Link>
                <Link href="/shogi" style={{ color: '#3182ce', textDecoration: 'underline' }}>将棋をプレイする &rarr;</Link>
            </div>
        </main>
    );
}
