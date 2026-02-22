'use client';

import React from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

import Link from 'next/link';

export default function ContactPage() {
    return (
        <main style={{ minHeight: '100vh', background: '#ffffff' }}>
            {/* Navigation */}
            <nav style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.5rem 4rem',
                borderBottom: '1px solid #edf2f7'
            }}>
                <Link href="/" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1a202c', textDecoration: 'none' }}>
                    Asobi Lounge
                </Link>
            </nav>

            {/* Content */}
            <article style={{ maxWidth: '600px', margin: '0 auto', padding: '3rem 2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#1a202c', marginBottom: '2rem' }}>
                    お問い合わせ
                </h1>

                <div style={{ color: '#4a5568', lineHeight: 1.8 }}>
                    <p style={{ marginBottom: '2rem' }}>
                        Asobi Loungeに関するお問い合わせ、不具合の報告、機能リクエストなどは、
                        下記の連絡先までお気軽にご連絡ください。
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Email */}
                        <div style={{
                            background: '#f7fafc',
                            padding: '1.5rem',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3182ce" strokeWidth="2">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                    <polyline points="22,6 12,13 2,6" />
                                </svg>
                                <span style={{ fontWeight: 600, color: '#1a202c' }}>メール</span>
                            </div>
                            <a
                                href="mailto:zangecreate@gmail.com"
                                style={{ color: '#3182ce', textDecoration: 'none', fontSize: '1.1rem' }}
                            >
                                zangecreate@gmail.com
                            </a>
                        </div>

                        {/* X (Twitter) */}
                        <div style={{
                            background: '#f7fafc',
                            padding: '1.5rem',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="#1a202c">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                                <span style={{ fontWeight: 600, color: '#1a202c' }}>X (Twitter)</span>
                            </div>
                            <a
                                href="https://x.com/GeZAN477888"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#3182ce', textDecoration: 'none', fontSize: '1.1rem' }}
                            >
                                @GeZAN477888
                            </a>
                        </div>
                    </div>

                    <div style={{ marginTop: '2rem', padding: '1rem', background: '#ebf8ff', borderRadius: '8px' }}>
                        <p style={{ fontSize: '0.9rem', color: '#2b6cb0', margin: 0 }}>
                            通常、3営業日以内にご返信いたします。
                        </p>
                    </div>
                </div>
            </article>
        </main>
    );
}
