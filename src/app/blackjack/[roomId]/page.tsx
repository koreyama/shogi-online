'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../page.module.css'; // Use shared styles or create new one? 
// Actually, I should probably use a local module css or reuse one. 
// Let's assume I can use inline styles or a simple module if I don't want to create a new css file.
// But for consistency I should probably create page.module.css too.
// For now, I'll use inline styles for the main container and reuse global classes if possible, 
// but since I can't easily verify global classes, I'll create a simple css file.
// Wait, I can import styles from '../page.module.css' if I put it in `src/app/blackjack`.
// Let's create `src/app/blackjack/page.module.css` as well.

import { IconBack, IconCards } from '@/components/Icons';

export const runtime = 'edge';

export default function BlackjackPage() {
    const router = useRouter();

    return (
        <main style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            padding: '2rem',
            background: '#f7fafc',
            fontFamily: '"Inter", sans-serif'
        }}>
            <div style={{ marginBottom: '2rem' }}>
                <button
                    onClick={() => router.push('/trump')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        color: '#4a5568',
                        fontWeight: 'bold'
                    }}
                >
                    <IconBack size={20} /> 戻る
                </button>
            </div>

            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                marginBottom: '4rem'
            }}>
                <div style={{ marginBottom: '1.5rem', color: '#2d3748' }}>
                    <IconCards size={80} />
                </div>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#1a202c' }}>ブラックジャック</h1>
                <p style={{ fontSize: '1.25rem', color: '#4a5568', marginBottom: '2rem' }}>
                    現在開発中です。公開までしばらくお待ちください。
                </p>
                <div style={{
                    padding: '1rem 2rem',
                    background: '#edf2f7',
                    borderRadius: '8px',
                    color: '#2d3748',
                    fontWeight: 'bold'
                }}>
                    Coming Soon...
                </div>
            </div>

            {/* AdSense Content Section */}
            <div className="contentSection" style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                maxWidth: '800px',
                margin: '0 auto',
                width: '100%'
            }}>
                <h2 style={{
                    fontSize: '1.5rem',
                    borderBottom: '2px solid #e2e8f0',
                    paddingBottom: '0.5rem',
                    marginBottom: '1.5rem',
                    color: '#2d3748'
                }}>
                    ブラックジャックの遊び方
                </h2>

                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>🃏</span>
                        <h3 style={{ fontSize: '1.25rem', margin: 0, color: '#2d3748' }}>カジノの王様</h3>
                    </div>
                    <p style={{ lineHeight: '1.6', color: '#4a5568' }}>
                        ブラックジャックは、ディーラー（親）とプレイヤー（子）が対戦するカードゲームです。
                        手持ちのカードの合計点数を「21」に近づけることを目指しますが、21を超えてはいけません。
                        運だけでなく、確率に基づいた判断（戦略）が勝敗を分ける、奥深いゲームです。
                    </p>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>📏</span>
                        <h3 style={{ fontSize: '1.25rem', margin: 0, color: '#2d3748' }}>基本ルール</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                        <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <span style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', color: '#2d3748' }}>1. カードの数え方</span>
                            <p style={{ fontSize: '0.9rem', color: '#4a5568', margin: 0 }}>
                                2〜9はそのまま、10・J・Q・Kはすべて「10」と数えます。A（エース）は「1」か「11」の都合の良い方で数えられます。
                            </p>
                        </div>
                        <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <span style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', color: '#2d3748' }}>2. アクション</span>
                            <p style={{ fontSize: '0.9rem', color: '#4a5568', margin: 0 }}>
                                カードをもう1枚引く「ヒット」、今の点数で勝負する「スタンド」などを選択します。
                            </p>
                        </div>
                        <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <span style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', color: '#2d3748' }}>3. 勝敗</span>
                            <p style={{ fontSize: '0.9rem', color: '#4a5568', margin: 0 }}>
                                ディーラーより21に近ければ勝ち。21を超えると「バースト」で負けとなります。
                            </p>
                        </div>
                    </div>
                </div>

                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>💡</span>
                        <h3 style={{ fontSize: '1.25rem', margin: 0, color: '#2d3748' }}>ベーシックストラテジー</h3>
                    </div>
                    <p style={{ lineHeight: '1.6', color: '#4a5568', marginBottom: '1rem' }}>
                        自分の手札とディーラーの表向きのカード（アップカード）の組み合わせによって、確率的に最適なアクションが決まっています。
                    </p>
                    <div style={{ padding: '1rem', background: '#fff5f5', borderRadius: '8px', borderLeft: '4px solid #fc8181' }}>
                        <span style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', color: '#c53030' }}>セオリーの例</span>
                        <p style={{ margin: 0, color: '#2d3748' }}>
                            ・手札が11以下のときは必ずヒットする。<br />
                            ・手札が17以上のときは必ずスタンドする。<br />
                            ・ディーラーのアップカードが弱い（2〜6）ときは、バーストを期待して無理に引かない。
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
