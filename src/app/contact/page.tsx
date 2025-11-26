'use client';

import React, { useState } from 'react';
import { IconSend } from '@/components/Icons';

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setStatus('success');
                setFormData({ name: '', email: '', subject: '', message: '' });
            } else {
                setStatus('error');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            setStatus('error');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem', fontFamily: 'sans-serif', color: '#333' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem', borderBottom: '2px solid #eee', paddingBottom: '0.5rem' }}>お問い合わせ</h1>

            <p style={{ marginBottom: '2rem', color: '#666' }}>
                ご質問、ご要望、バグ報告などがございましたら、以下のフォームよりお気軽にお問い合わせください。
            </p>

            {status === 'success' && (
                <div style={{ padding: '1rem', backgroundColor: '#c6f6d5', color: '#2f855a', borderRadius: '8px', marginBottom: '1.5rem' }}>
                    お問い合わせありがとうございます。送信が完了しました。
                </div>
            )}

            {status === 'error' && (
                <div style={{ padding: '1rem', backgroundColor: '#fed7d7', color: '#c53030', borderRadius: '8px', marginBottom: '1.5rem' }}>
                    送信に失敗しました。時間をおいて再度お試しください。
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label htmlFor="name" style={{ fontWeight: 'bold' }}>お名前</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        disabled={status === 'loading'}
                        style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1rem' }}
                        placeholder="山田 太郎"
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label htmlFor="email" style={{ fontWeight: 'bold' }}>メールアドレス</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={status === 'loading'}
                        style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1rem' }}
                        placeholder="your@email.com"
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label htmlFor="subject" style={{ fontWeight: 'bold' }}>件名</label>
                    <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        disabled={status === 'loading'}
                        style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1rem' }}
                        placeholder="お問い合わせの件名"
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label htmlFor="message" style={{ fontWeight: 'bold' }}>お問い合わせ内容</label>
                    <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        disabled={status === 'loading'}
                        rows={6}
                        style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1rem', resize: 'vertical' }}
                        placeholder="お問い合わせ内容をご記入ください"
                    />
                </div>

                <button
                    type="submit"
                    disabled={status === 'loading'}
                    style={{
                        padding: '1rem 2rem',
                        backgroundColor: status === 'loading' ? '#cbd5e0' : '#3182ce',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                        alignSelf: 'flex-start',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <IconSend size={20} />
                    {status === 'loading' ? '送信中...' : '送信する'}
                </button>
            </form>
        </main>
    );
}
