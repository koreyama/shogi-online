import React from 'react';
import Link from 'next/link';

export default function ContactPage() {
    return (
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif', lineHeight: '1.6' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem', borderBottom: '2px solid #eee', paddingBottom: '0.5rem' }}>お問い合わせ</h1>

            <p style={{ marginBottom: '2rem' }}>
                当サイトに関するお問い合わせは、以下のメールアドレス、またはTwitter (X) までお願いいたします。
            </p>

            <div style={{ padding: '2rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                    <p style={{ fontSize: '1rem', color: '#718096', marginBottom: '0.5rem' }}>メールでのお問い合わせ</p>
                    <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#4a5568' }}>zangecreate@gmail.com</p>
                </div>

                <div>
                    <p style={{ fontSize: '1rem', color: '#718096', marginBottom: '0.5rem' }}>Twitter (X) でのお問い合わせ</p>
                    <a href="https://twitter.com/GeZAN477888" target="_blank" rel="noopener noreferrer" style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1DA1F2', textDecoration: 'none' }}>
                        @GeZAN477888
                    </a>
                </div>

                <p style={{ fontSize: '0.9rem', color: '#718096', marginTop: '1.5rem' }}>※返信には数日いただく場合がございます。</p>
            </div>

            <div style={{ marginTop: '3rem', textAlign: 'center' }}>
                <Link href="/" style={{ color: '#3182ce', textDecoration: 'underline' }}>トップページへ戻る</Link>
            </div>
        </main>
    );
}
