import React from 'react';
import Link from 'next/link';

export default function ArticlePage() {
    return (
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif', lineHeight: '1.8', color: '#2d3748' }}>
            <header style={{ marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>世界最古のゲーム「マンカラ」の魅力とは</h1>
                <p style={{ color: '#718096' }}>2025年12月3日</p>
            </header>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', borderLeft: '4px solid #3182ce', paddingLeft: '0.5rem' }}>マンカラとは？</h2>
                <p>
                    マンカラ（Mancala）は、紀元前からアフリカや中近東で遊ばれてきた、世界最古のボードゲームの一つです。
                    「種まきゲーム」とも呼ばれ、自分の陣地の穴から石（種）を取り出し、反時計回りに一つずつ撒いていくというシンプルなルールが特徴です。
                    シンプルながらも先を読む力が求められ、子供の知育玩具としても、大人の頭脳戦としても非常に人気があります。
                </p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', borderLeft: '4px solid #3182ce', paddingLeft: '0.5rem' }}>基本的なルール（カラハ）</h2>
                <p>
                    マンカラには100種類以上のルールが存在しますが、世界中で最も普及しているのが「カラハ（Kalah）」というルールです。
                    <br /><br />
                    1. 自分の陣地の穴を一つ選び、そこに入っている石を全て手に取ります。<br />
                    2. 反時計回りに、隣の穴へ石を一つずつ入れていきます（自分のゴールである「ストア」にも入れますが、相手のストアは飛ばします）。<br />
                    3. 最後の石が自分のストアに入ったら、もう一度自分の番になります（これが大逆転の鍵！）。<br />
                    4. 最後の石が自分の陣地の空っぽの穴に入り、その向かい側の相手の穴に石があれば、その全ての石を横取りして自分のストアに入れることができます。
                </p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', borderLeft: '4px solid #3182ce', paddingLeft: '0.5rem' }}>勝つためのポイント</h2>
                <p>
                    マンカラで勝つための最大のコツは、「もう一度自分の番になる」手を最大限に活用することです。
                    自分のストアにぴったり石が入る穴を常に探し、連続行動を狙いましょう。
                    また、相手の陣地の石の数もよく見て、相手に横取りされないように注意することも大切です。
                    運の要素が全くない完全情報ゲームなので、実力がそのまま勝敗に直結する奥深さがあります。
                </p>
            </section>

            <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                <Link href="/blog" style={{ color: '#3182ce', textDecoration: 'underline' }}>&larr; コラム一覧へ戻る</Link>
                <Link href="/mancala" style={{ color: '#3182ce', textDecoration: 'underline' }}>マンカラをプレイする &rarr;</Link>
            </div>
        </main>
    );
}
