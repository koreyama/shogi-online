import React from 'react';
import Link from 'next/link';

export default function ArticlePage() {
    return (
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem', fontFamily: 'sans-serif', lineHeight: '1.8', color: '#2d3748' }}>
            <header style={{ marginBottom: '3rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '2rem' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: '800', letterSpacing: '-0.02em' }}>リバーシ初心者必見！勝率を上げる3つのコツ</h1>
                <p style={{ color: '#718096', fontSize: '0.95rem' }}>2025年12月2日</p>
            </header>

            <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #3182ce', paddingLeft: '1rem', color: '#2c5282' }}>1. 四隅（角）を取る</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        リバーシにおいて最も重要な場所は、盤面の四隅（角）です。
                        角に置かれた石は、決して相手にひっくり返されることがありません。
                    </p>
                    <p>
                        角を取ることで、そこを起点に周囲の石を確定石（ひっくり返されない石）にしていくことができます。
                        逆に、相手に角を取らせないように、角の隣（XやCと呼ばれるマス）には安易に石を置かないように注意しましょう。
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #3182ce', paddingLeft: '1rem', color: '#2c5282' }}>2. 序盤は石を取りすぎない</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        初心者がやりがちな間違いの一つが、序盤からたくさん石を取ってしまうことです。
                        リバーシは最終的に石が多い方が勝ちですが、序盤に石を取りすぎると、自分の打てる場所が減ってしまい、相手に有利な場所（角など）を打たされてしまう「手詰まり」の状態になりやすくなります。
                    </p>
                    <p>
                        序盤から中盤にかけては、あえて石を少なく保ち、相手に打つ場所を制限させる「中割り」などのテクニックが有効です。
                    </p>
                </section>

                <section>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #3182ce', paddingLeft: '1rem', color: '#2c5282' }}>3. 相手の打てる場所を減らす</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        リバーシは「相手が良い手を打てないようにする」ゲームでもあります。
                        自分が打つことで、相手が次に打てる場所がどう変わるかを意識しましょう。
                    </p>
                    <p>
                        例えば、相手が角の隣に打たざるを得ないような状況を作れば、次のターンで自分が角を取れるチャンスが生まれます。
                        常に数手先を読み、相手をコントロールする意識を持つことが上達への近道です。
                    </p>
                </section>
            </div>

            <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link href="/blog" style={{ color: '#3182ce', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    &larr; コラム一覧へ戻る
                </Link>
                <Link href="/reversi" style={{
                    padding: '0.8rem 2rem',
                    background: '#3182ce',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '30px',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 6px rgba(49, 130, 206, 0.3)'
                }}>
                    リバーシをプレイする &rarr;
                </Link>
            </div>
        </main>
    );
}
