import React from 'react';
import Link from 'next/link';

export default function BlogPage() {
    const articles = [
        {
            slug: 'clicker-game-release',
            title: '新作ゲーム『Civilization Builder』リリース！',
            excerpt: 'クリックで文明を築く放置系シミュレーションが登場。技術ツリーを進めて、原始時代から現代文明を目指そう！',
            date: '2025-12-05'
        },
        {
            slug: 'mobile-support-update',
            title: 'スマホ対応を順次開始！まずは新作から',
            excerpt: 'ご要望の多かったスマートフォン対応を、新作「Civilization Builder」から開始しました。他のゲームも順次対応予定です。',
            date: '2025-12-05'
        },
        {
            slug: 'chess-openings',
            title: 'チェス初心者のための定跡ガイド：最初の10手で差をつける',
            excerpt: 'イタリアンゲーム、ロンドンシステムなど、初心者が覚えるべきオープニングの基本原則を解説します。',
            date: '2025-12-06'
        },
        {
            slug: 'connect4-strategy',
            title: '四目並べ必勝法：中央を制する者がゲームを制する',
            excerpt: '先手必勝と言われる四目並べ。中央支配やダブルスレットなど、勝率を上げるための戦略を紹介。',
            date: '2025-12-06'
        },
        {
            slug: 'board-game-benefits',
            title: 'ボードゲームが脳に与える5つの効果：科学的に証明されたメリット',
            excerpt: '論理的思考力、記憶力、集中力の向上など、ボードゲームがもたらす脳への好影響を科学的根拠とともに解説。',
            date: '2025-12-05'
        },
        {
            slug: 'checkers-history',
            title: 'チェッカー（ドラフツ）の歴史：5000年前から愛されるゲーム',
            excerpt: '古代エジプトで生まれ、ヨーロッパで発展したチェッカー。その長い歴史と世界のバリエーションを紹介。',
            date: '2025-12-05'
        },
        {
            slug: 'shogi-vs-chess',
            title: '将棋とチェスの違い：持ち駒と盤の広さ',
            excerpt: '兄弟ゲームでありながら全く異なる進化を遂げた2つのボードゲーム。その決定的な違いとは？',
            date: '2025-12-05'
        },
        {
            slug: 'minesweeper-tips',
            title: 'マインスイーパーのコツ：数字のパターンを覚えよう',
            excerpt: '運ゲーだと思っていませんか？「1-1」や「1-2-1」などの定石を覚えるだけで、クリア率は劇的に上がります。',
            date: '2025-12-05'
        },
        {
            slug: 'gomoku-rules',
            title: '五目並べの必勝法：「三三」と「四三」',
            excerpt: 'ただ並べるだけでは勝てない。最強の形「四三」と、禁じ手「三三」について解説します。',
            date: '2025-12-05'
        },
        {
            slug: 'divine-duel-strategies',
            title: '『Divine Duel』初心者向け攻略ガイド',
            excerpt: 'オリジナルカードゲームで勝つためのコツを伝授。マナ管理の基本から、おすすめのアバター、デッキ構築まで。',
            date: '2025-12-04'
        },
        {
            slug: 'history-of-shogi',
            title: '将棋の歴史：古代インドから現代AIまで',
            excerpt: '将棋のルーツはどこにあるのか？平安時代から現代に至るまでの進化の過程を解説します。',
            date: '2025-12-01'
        },
        {
            slug: 'reversi-strategy-beginners',
            title: 'リバーシ初心者必見！勝率を上げる3つのコツ',
            excerpt: '「角を取る」だけじゃない？初心者が覚えるべき基本的な定石と、やってはいけない悪手について。',
            date: '2025-12-02'
        },
        {
            slug: 'mancala-rules-explained',
            title: '世界最古のゲーム「マンカラ」の魅力とは',
            excerpt: 'シンプルなルールながら奥深い。子供から大人まで楽しめるマンカラの遊び方を徹底解説。',
            date: '2025-12-03'
        }
    ];

    return (
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem', fontFamily: 'sans-serif' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '3rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem', color: '#2d3748' }}>ボードゲームコラム</h1>

            <div style={{ display: 'grid', gap: '2rem' }}>
                {articles.map(article => (
                    <article key={article.slug} style={{
                        padding: '2rem',
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '16px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                    }}>
                        <Link href={`/blog/${article.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#2d3748' }}>{article.title}</h2>
                            <p style={{ color: '#718096', fontSize: '0.9rem', marginBottom: '1rem' }}>{article.date}</p>
                            <p style={{ lineHeight: '1.6', color: '#4a5568', marginBottom: '1.5rem' }}>{article.excerpt}</p>
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                color: '#3182ce',
                                fontWeight: 'bold',
                                fontSize: '0.95rem'
                            }}>
                                続きを読む &rarr;
                            </span>
                        </Link>
                    </article>
                ))}
            </div>

            <div style={{ marginTop: '4rem', textAlign: 'center' }}>
                <Link href="/" style={{
                    display: 'inline-block',
                    padding: '0.8rem 2rem',
                    background: '#edf2f7',
                    color: '#4a5568',
                    textDecoration: 'none',
                    borderRadius: '30px',
                    fontWeight: 'bold',
                    transition: 'background 0.2s'
                }}>
                    トップページへ戻る
                </Link>
            </div>
        </main>
    );
}
