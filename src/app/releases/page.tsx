'use client';

import React from 'react';
import Link from 'next/link';
import { IconBack } from '@/components/Icons';

import { RELEASES } from '@/lib/releases';

export default function ReleasesPage() {
    return (
        <main style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem 1rem' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: '#718096', fontWeight: 600 }}>
                        <IconBack size={18} /> トップへ戻る
                    </Link>
                </div>

                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1a202c', marginBottom: '1rem' }}>リリースノート</h1>
                <p style={{ color: '#718096', marginBottom: '3rem' }}>Asobi Lounge のアップデート履歴</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {RELEASES.map((release, i) => (
                        <div key={i} style={{ background: 'white', borderRadius: '16px', padding: '2rem', border: '1px solid #edf2f7', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#2d3748' }}>v{release.version}</span>
                                <span style={{ fontSize: '0.9rem', color: '#718096' }}>{release.date}</span>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {release.categories.map(c => (
                                        <span key={c} style={{
                                            fontSize: '0.7rem',
                                            padding: '0.15rem 0.5rem',
                                            borderRadius: '100px',
                                            background: c === 'System' ? '#ebf8ff' : c === 'Game' ? '#f0fff4' : c === 'Fix' ? '#fff5f5' : '#fefcbf',
                                            color: c === 'System' ? '#3182ce' : c === 'Game' ? '#38a169' : c === 'Fix' ? '#e53e3e' : '#d69e2e',
                                            fontWeight: 600
                                        }}>
                                            {c}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1a202c', marginBottom: '1.5rem' }}>{release.title}</h2>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                {release.content.map((item, j) => (
                                    <div key={j}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#2d3748', marginBottom: '0.25rem' }}>{item.head}</h3>
                                        <p style={{ fontSize: '0.95rem', color: '#4a5568', lineHeight: 1.6 }}>{item.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
