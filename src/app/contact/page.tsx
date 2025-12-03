import React from 'react';
import Link from 'next/link';

export default function ContactPage() {
    return (
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem', fontFamily: 'sans-serif', lineHeight: '1.6', color: '#2d3748' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem', fontWeight: '800' }}>お問い合わせ</h1>

            <p style={{ marginBottom: '3rem', fontSize: '1.1rem' }}>
                当サイトに関するお問い合わせは、以下のメールアドレス、またはTwitter (X) までお願いいたします。
            </p>

            <div style={{ padding: '3rem', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <div style={{ marginBottom: '2.5rem' }}>
                    <p style={{ fontSize: '1rem', color: '#718096', marginBottom: '0.5rem', fontWeight: 'bold' }}>メールでのお問い合わせ</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2d3748', fontFamily: 'monospace' }}>zangecreate@gmail.com</p>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <p style={{ fontSize: '1rem', color: '#718096', marginBottom: '0.5rem', fontWeight: 'bold' }}>Twitter (X) でのお問い合わせ</p>
                    <a href="https://twitter.com/GeZAN477888" target="_blank" rel="noopener noreferrer" style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: '#1DA1F2',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        @GeZAN477888
                    </a>
                </div>

                <p style={{ fontSize: '0.9rem', color: '#a0aec0', marginTop: '2rem' }}>※返信には数日いただく場合がございます。</p>
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
