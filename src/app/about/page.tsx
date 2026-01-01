import React from 'react';
import Link from 'next/link';
import { IconShogi, IconChess, IconReversi, IconSwords, IconPalette } from '@/components/Icons';

export default function AboutPage() {
    return (
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif', lineHeight: '1.8', color: '#2d3748' }}>
            <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#2b6cb0' }}>Asobi Lounge について</h1>
                <p style={{ fontSize: '1.1rem', color: '#718096' }}>
                    シンプルで美しい、誰でも楽しめる総合オンラインゲームプラットフォーム
                </p>
            </header>

            <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>私たちのミッション</h2>
                <p style={{ marginBottom: '1rem' }}>
                    Asobi Lounge（アソビラウンジ）は、「いつでも、どこでも、誰とでも」をコンセプトに作られた、完全無料のブラウザゲームサイトです。
                    アプリのインストールや面倒な登録なしで、URLにアクセスするだけですぐに遊べる手軽さを大切にしています。
                </p>
                <p>
                    古くから愛される伝統的なボードゲームから、デジタルならではの新しい体験を提供するオリジナルゲームまで、
                    幅広いジャンルのゲームを取り揃え、世代を超えて楽しめる「遊びの場」を提供することを目指しています。
                </p>
            </section>

            <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>主な機能と特徴</h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                    <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#2d3748' }}>
                            <IconShogi size={24} color="#2b6cb0" /> 多彩なゲームラインナップ
                        </h3>
                        <p style={{ fontSize: '0.95rem', color: '#4a5568' }}>
                            将棋、チェス、リバーシといった定番ボードゲームはもちろん、マンカラやバックギャモンなどの古典的名作、
                            そして「Block Territory」や「Minesweeper」などのパズルゲームまで、幅広いジャンルを網羅しています。
                        </p>
                    </div>

                    <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#2d3748' }}>
                            <IconSwords size={24} color="#805ad5" /> クラウドセーブ機能
                        </h3>
                        <p style={{ fontSize: '0.95rem', color: '#4a5568' }}>
                            Googleアカウントでログインすることで、ゲームの進行状況や作成したデッキデータをクラウドに保存できます。
                            PCで遊んだ続きをスマホで楽しむなど、デバイスを跨いだプレイが可能です。
                        </p>
                    </div>

                    <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#2d3748' }}>
                            <IconChess size={24} color="#2b6cb0" /> 賢いAIとの対戦
                        </h3>
                        <p style={{ fontSize: '0.95rem', color: '#4a5568' }}>
                            一人でも楽しめるよう、多くのゲームにCPU対戦モードを搭載しています。
                            将棋やリバーシでは、初心者から上級者まで楽しめるよう、AIの強さを調整しています。
                        </p>
                    </div>

                    <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#2d3748' }}>
                            <IconPalette size={24} color="#d53f8c" /> 本格的なお絵かき機能
                        </h3>
                        <p style={{ fontSize: '0.95rem', color: '#4a5568' }}>
                            「お絵かきクイズ」では、3000px超の高解像度キャンバス、レイヤー機能、筆圧感知に対応。
                            さらに「Virtual Piano」や「Yacht」などのパーティーゲームも充実し、友達とわいわい楽しめます。
                        </p>
                    </div>
                </div>
            </section>

            <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>今後の展望</h2>
                <p>
                    現在はベータ版として運営していますが、今後は以下の機能追加を予定しています。
                </p>
                <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginTop: '1rem' }}>
                    <li style={{ marginBottom: '0.5rem' }}><strong>リアルタイムオンライン対戦機能の強化:</strong> 遠くの友達や世界中のプレイヤーとマッチングして遊べる機能を拡充します。</li>
                    <li style={{ marginBottom: '0.5rem' }}><strong>新しいゲームの追加:</strong> トランプゲーム（大富豪、ポーカー）や、協力プレイが可能なアクションゲームの開発を進めています。</li>
                    <li style={{ marginBottom: '0.5rem' }}><strong>コミュニティ機能:</strong> プレイヤー同士が交流できるチャットや掲示板機能の実装を検討しています。</li>
                </ul>
            </section>

            <div style={{ marginTop: '3rem', textAlign: 'center' }}>
                <Link href="/" style={{
                    display: 'inline-block',
                    padding: '1rem 2rem',
                    background: '#3182ce',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '30px',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                    ゲーム一覧へ戻る
                </Link>
            </div>
        </main>
    );
}
