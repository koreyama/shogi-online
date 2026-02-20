'use client';

import React from 'react';
import Link from 'next/link';

export default function ReversiStrategyPage() {
    return (
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem', fontFamily: 'sans-serif', lineHeight: '1.8', color: '#2d3748' }}>
            <header style={{ marginBottom: '3rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '2rem' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: '800', letterSpacing: '-0.02em' }}>リバーシ（オセロ）の勝ち方：角を取るだけでは勝てない理由</h1>
                <p style={{ color: '#718096', fontSize: '0.95rem' }}>2026年2月16日</p>
            </header>

            <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <section style={{ marginBottom: '3rem' }}>
                    <p style={{ marginBottom: '1.5rem' }}>
                        「リバーシは角（スミ）を取れば勝てる」と考えていませんか？
                        確かに角は絶対にひっくり返されない最強のマスですが、上級者同士の戦いでは、角を取るまでの過程、つまり「中盤の主導権争い」が勝敗を分けます。
                        この記事では、脱初心者を目指すための重要な概念「開放度（リバティ）」と「確定石」について解説します。
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', borderLeft: '5px solid #38a169', paddingLeft: '1rem', color: '#276749' }}>とってはいけない石がある？「開放度理論」</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        リバーシの序盤～中盤において最も重要なセオリーは、<strong>「自分の打てる場所を多く保ち、相手の打てる場所を減らす」</strong>ことです。
                        これを実現するために意識すべきなのが「開放度」です。
                    </p>
                    <p style={{ marginBottom: '1rem' }}>
                        簡単に言うと、<strong>「中割りを狙う」</strong>のが基本です。
                        盤面の外側の石を裏返すと、その外側にさらに相手が石を置けるようになり、相手の選択肢を増やしてしまいます。
                        逆に、盤面の内側（中側）にある石だけを裏返すように打てば、相手は外側に置く手がなくなり、苦しい手を打たざるを得なくなります。
                    </p>
                    <div style={{ background: '#f0fff4', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #48bb78', marginTop: '1rem' }}>
                        <strong>★初心者がやりがちなミス</strong><br />
                        「たくさん裏返せる場所」に打ってはいけません！<br />
                        中盤で石を多く取りすぎると、自分の石が盤面を埋め尽くしてしまい、次に打てる場所がなくなって「パス」に追い込まれる危険があります。
                        <strong>序盤～中盤は「石を少なく保つ」のが鉄則です。</strong>
                    </div>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', borderLeft: '5px solid #38a169', paddingLeft: '1rem', color: '#276749' }}>危険なマス「X」と「C」</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        角の隣のマスには名前がついています。
                        角の斜め内側を「X（エックス）」、角の縦横隣を「C（シー）」と呼びます。
                    </p>
                    <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', lineHeight: '2' }}>
                        <li><strong>X打ち：</strong>基本的に<strong>禁じ手</strong>です。ここに打つと、相手に簡単に角を取られてしまいます。終盤の特別な状況以外では絶対に打ってはいけません。</li>
                        <li><strong>C打ち：</strong>不用意に打つと相手に角を取られるきっかけを与えますが、戦術としてあえて打つ場合もあります（通称「ウィング」など）。</li>
                    </ul>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', borderLeft: '5px solid #38a169', paddingLeft: '1rem', color: '#276749' }}>「確定石」を増やす</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        「確定石」とは、ゲーム終了まで絶対に裏返されることがない石のことです。
                        角の石は確定石の代表ですが、角から辺に沿って連続している自分の石も確定石になります。
                        終盤は、この確定石をいかに増やしていくかが勝負の鍵を握ります。
                    </p>
                </section>

                <section>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', borderLeft: '5px solid #38a169', paddingLeft: '1rem', color: '#276749' }}>まとめ</h2>
                    <p style={{ marginBottom: '1.5rem' }}>
                        1. 序盤・中盤は石を取りすぎない（中割りを目指す）<br />
                        2. 相手の手を減らすように打つ<br />
                        3. X打ちは絶対に避ける
                    </p>
                    <p>
                        この3つを意識するだけで、あなたのリバーシの実力は劇的に向上します。
                        Asobi Loungeのリバーシモードで、CPU相手に練習してみましょう！
                    </p>
                </section>
            </div>

            <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link href="/blog" style={{ color: '#38a169', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    &larr; コラム一覧へ戻る
                </Link>
                <Link href="/reversi" style={{
                    padding: '0.8rem 2rem',
                    background: '#38a169',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '30px',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 6px rgba(56, 161, 105, 0.3)'
                }}>
                    リバーシをプレイする &rarr;
                </Link>
            </div>
        </main>
    );
}
