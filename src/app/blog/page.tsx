import React from 'react';
import Link from 'next/link';

export default function BlogPage() {
    const articles = [
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
