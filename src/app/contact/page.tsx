'use client';

import React from 'react';
import { useForm, ValidationError } from '@formspree/react';
import { IconSend } from '@/components/Icons';

export default function ContactPage() {
    const [state, handleSubmit] = useForm("mzzlepoy");

    if (state.succeeded) {
        return (
            <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem', fontFamily: 'sans-serif', color: '#333' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem', borderBottom: '2px solid #eee', paddingBottom: '0.5rem' }}>お問い合わせ</h1>
                <div style={{ padding: '1rem', backgroundColor: '#c6f6d5', color: '#2f855a', borderRadius: '8px', marginBottom: '1.5rem' }}>
                    お問い合わせありがとうございます。送信が完了しました。
                </div>
                <button
                    onClick={() => window.location.reload()}
                    style={{
                        padding: '0.8rem 1.5rem',
                        backgroundColor: '#3182ce',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer'
                    }}
                >
                    フォームに戻る
                </button>
            </main>
        );
    }

    return (
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem', fontFamily: 'sans-serif', color: '#333' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem', borderBottom: '2px solid #eee', paddingBottom: '0.5rem' }}>お問い合わせ</h1>

            <p style={{ marginBottom: '2rem', color: '#666' }}>
                ご質問、ご要望、バグ報告などがございましたら、以下のフォームよりお気軽にお問い合わせください。
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label htmlFor="name" style={{ fontWeight: 'bold' }}>お名前</label>
                    <input
                        id="name"
                        type="text"
                        name="name"
                        required
                        style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1rem' }}
                        placeholder="山田 太郎"
                    />
                    <ValidationError prefix="Name" field="name" errors={state.errors} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label htmlFor="email" style={{ fontWeight: 'bold' }}>メールアドレス</label>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        required
                        style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1rem' }}
                        placeholder="your@email.com"
                    />
                    <ValidationError prefix="Email" field="email" errors={state.errors} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label htmlFor="subject" style={{ fontWeight: 'bold' }}>件名</label>
                    <input
                        id="subject"
                        type="text"
                        name="subject"
                        required
                        style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1rem' }}
                        placeholder="お問い合わせの件名"
                    />
                    <ValidationError prefix="Subject" field="subject" errors={state.errors} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label htmlFor="message" style={{ fontWeight: 'bold' }}>お問い合わせ内容</label>
                    <textarea
                        id="message"
                        name="message"
                        required
                        rows={6}
                        style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1rem', resize: 'vertical' }}
                        placeholder="お問い合わせ内容をご記入ください"
                    />
                    <ValidationError prefix="Message" field="message" errors={state.errors} />
                </div>

                <button
                    type="submit"
                    disabled={state.submitting}
                    style={{
                        padding: '1rem 2rem',
                        backgroundColor: state.submitting ? '#cbd5e0' : '#3182ce',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        cursor: state.submitting ? 'not-allowed' : 'pointer',
                        alignSelf: 'flex-start',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <IconSend size={20} />
                    {state.submitting ? '送信中...' : '送信する'}
                </button>
            </form>
        </main>
    );
}
