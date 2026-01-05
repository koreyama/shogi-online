'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import styles from './about.module.css';
import { IconShogi, IconChess, IconSwords } from '@/components/Icons';

export default function AboutPage() {
    // Load Note embed script
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://note.com/scripts/embed.js';
        script.async = true;
        script.charset = 'utf-8';
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);
    return (
        <main className={styles.main}>
            {/* Hero Section */}
            <header className={styles.hero}>
                <h1 className={styles.title}>Asobi Lounge</h1>
                <p className={styles.subtitle}>
                    いつでも、どこでも、誰とでも。<br />
                    シンプルで美しい、無料で遊べる総合オンラインゲームプラットフォーム
                </p>
            </header>

            <div className={styles.container}>
                {/* Mission Section */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Asobi Loungeとは</h2>
                    <div className={styles.card}>
                        <p>
                            <strong>Asobi Lounge（アソビラウンジ）</strong>は、「いつでも、どこでも、誰とでも」をコンセプトに作られた、完全無料のブラウザゲームサイトです。
                        </p>
                        <p>
                            アプリのインストールや面倒な登録なしで、URLにアクセスするだけですぐに遊べる手軽さを大切にしています。
                            古くから愛される将棋やチェスといった伝統的なボードゲームから、デジタルならではの新しい体験を提供するオリジナルゲームまで、幅広いジャンルを取り揃えています。
                        </p>
                        <p style={{ marginBottom: 0 }}>
                            世代や国境を超えて、誰もが気軽に集まり、遊び、つながれる——そんな「遊びの場」を提供することが私たちの目標です。
                        </p>
                    </div>
                </section>

                {/* Developer Section */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>開発者について</h2>
                    <div className={styles.developerCard}>
                        <a
                            href="https://twitter.com/GeZAN477888"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.developerAvatarLink}
                        >
                            <img
                                src="https://unavatar.io/twitter/GeZAN477888"
                                alt="ZANGE"
                                className={styles.developerAvatarImg}
                            />
                        </a>
                        <div className={styles.developerInfo}>
                            <h3 className={styles.developerName}>ZANGE</h3>
                            <p className={styles.developerRole}>Developer / Creator</p>
                            <a
                                href="https://twitter.com/GeZAN477888"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.twitterLink}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                                @GeZAN477888
                            </a>
                        </div>
                    </div>

                    <div className={styles.card} style={{ marginTop: '1.5rem' }}>
                        <h4 className={styles.cardTitle}>開発のきっかけ</h4>
                        <p style={{ marginBottom: 0 }}>
                            「いつでも友達と、一人でも気軽にボードゲームやカードゲームを楽しめたらいいな」——そんなシンプルな想いから、このプロジェクトは始まりました。
                            忙しい日常の中でも、ブラウザを開くだけですぐに遊べる場所を作りたいと思い、Asobi Loungeを開発しています。
                        </p>
                    </div>
                </section>

                {/* Note Embed Section */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>開発ブログ</h2>
                    <div className={styles.card}>
                        <iframe
                            className="note-embed"
                            src="https://note.com/embed/notes/n7be45ded3cda"
                            style={{
                                border: 0,
                                display: 'block',
                                maxWidth: '100%',
                                width: '100%',
                                padding: 0,
                                margin: '0 auto',
                            }}
                            height={400}
                        />
                        <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem', color: '#718096' }}>
                            <a
                                href="https://note.com/zaaan477888"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#2b6cb0', textDecoration: 'none' }}
                            >
                                noteで他の記事も読む →
                            </a>
                        </p>
                    </div>
                </section>

                {/* Vision Section */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>目指す未来</h2>
                    <div className={styles.visionGrid}>
                        <div className={styles.visionCard}>
                            <h3>誰でも楽しめる</h3>
                            <p>
                                年齢や経験を問わず、誰でも気軽に参加できる場所を目指しています。初心者にも優しく、上級者も満足できるゲーム体験を提供します。
                            </p>
                        </div>
                        <div className={styles.visionCard}>
                            <h3>人が集まる場所</h3>
                            <p>
                                いろんな人が集まって、ずっと遊んでいられる。そんな居心地の良いコミュニティスペースを作りたいと考えています。
                            </p>
                        </div>
                        <div className={styles.visionCard}>
                            <h3>完全無料</h3>
                            <p>
                                課金要素は一切ありません。すべてのゲームを無料で提供し続けることをお約束します。
                            </p>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>主な機能</h2>
                    <div className={styles.featureGrid}>
                        <div className={styles.featureCard}>
                            <div className={styles.featureIcon}>
                                <IconShogi size={28} color="#2b6cb0" />
                            </div>
                            <div>
                                <h3>多彩なゲーム</h3>
                                <p>将棋、チェス、リバーシ、麻雀、大富豪など定番から、お絵かきクイズやVirtual Pianoなどユニークなゲームまで20種類以上。</p>
                            </div>
                        </div>
                        <div className={styles.featureCard}>
                            <div className={styles.featureIcon}>
                                <IconSwords size={28} color="#2b6cb0" />
                            </div>
                            <div>
                                <h3>オンライン対戦</h3>
                                <p>ランダムマッチや合言葉を使ったプライベートルームで、世界中のプレイヤーや友達とリアルタイム対戦。</p>
                            </div>
                        </div>
                        <div className={styles.featureCard}>
                            <div className={styles.featureIcon}>
                                <IconChess size={28} color="#2b6cb0" />
                            </div>
                            <div>
                                <h3>AI対戦</h3>
                                <p>一人でも楽しめるよう、多くのゲームにCPU対戦モードを搭載。練習や暇つぶしに最適です。</p>
                            </div>
                        </div>
                        <div className={styles.featureCard}>
                            <div className={styles.featureIcon}>
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2b6cb0" strokeWidth="1.5">
                                    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
                                </svg>
                            </div>
                            <div>
                                <h3>クラウドセーブ</h3>
                                <p>Googleログインでデータをクラウドに保存。PCで遊んだ続きをスマホで楽しむなど、シームレスなプレイが可能。</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Support Section */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>サポートのお願い</h2>
                    <div className={styles.supportCard}>
                        <p className={styles.supportText}>
                            Asobi Loungeは個人開発のプロジェクトです。<br />
                            より良いサービスを提供し続けるため、皆様のご支援をお待ちしております。
                        </p>

                        <div className={styles.supportGrid}>
                            <div className={styles.supportItem}>
                                <h3>開発に参加する</h3>
                                <p>プログラミング、デザイン、翻訳など、一緒に開発を手伝ってくださる方を募集しています。</p>
                            </div>
                            <div className={styles.supportItem}>
                                <h3>寄付で応援する</h3>
                                <p>サーバー維持費や開発の励みになります。少額からでも大歓迎です。</p>
                            </div>
                        </div>

                        <p className={styles.contactText}>
                            ご興味のある方は、Xでお気軽にDMください
                        </p>
                        <a
                            href="https://twitter.com/GeZAN477888"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.contactButton}
                        >
                            お問い合わせはこちら
                        </a>
                    </div>
                </section>

                {/* Roadmap Section */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>今後の予定</h2>
                    <div className={styles.card}>
                        <ul className={styles.roadmapList}>
                            <li>
                                <span className={styles.roadmapNumber}>1</span>
                                <div>
                                    <strong>新ゲームの追加</strong>
                                    <p>ポーカー、UNO風ゲーム、協力型ゲームなどを開発予定</p>
                                </div>
                            </li>
                            <li>
                                <span className={styles.roadmapNumber}>2</span>
                                <div>
                                    <strong>コミュニティ機能</strong>
                                    <p>フレンド機能の強化、チャット、掲示板など</p>
                                </div>
                            </li>
                            <li>
                                <span className={styles.roadmapNumber}>3</span>
                                <div>
                                    <strong>モバイル対応の強化</strong>
                                    <p>スマホでも快適に遊べるUIの改善</p>
                                </div>
                            </li>
                            <li>
                                <span className={styles.roadmapNumber}>4</span>
                                <div>
                                    <strong>多言語対応</strong>
                                    <p>英語版の提供と国際的なコミュニティの構築</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                </section>

                {/* CTA */}
                <div className={styles.cta}>
                    <Link href="/" className={styles.ctaButton}>
                        ゲーム一覧へ戻る
                    </Link>
                </div>
            </div>

            {/* Footer */}
            <footer className={styles.footer}>
                <p>© 2024-2026 Asobi Lounge by ZANGE</p>
                <p>Made with care in Japan</p>
            </footer>
        </main>
    );
}
