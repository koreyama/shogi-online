'use client';

import React from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

import Link from 'next/link';

export default function PrivacyPolicyPage() {
    return (
        <main style={{ minHeight: '100vh', background: '#ffffff', fontFamily: 'sans-serif' }}>
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
            <article style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem 2rem', color: '#4a5568', lineHeight: 1.8 }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#1a202c', marginBottom: '2rem' }}>
                    プライバシーポリシー
                </h1>

                <p style={{ marginBottom: '1.5rem' }}>
                    Asobi Lounge（以下「当サイト」）は、ユーザーの個人情報の取り扱いについて、以下の通りプライバシーポリシー（以下「本ポリシー」）を定めます。
                </p>

                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1a202c', marginTop: '2.5rem', marginBottom: '1rem', borderBottom: '2px solid #edf2f7', paddingBottom: '0.5rem' }}>
                    1. 個人情報の収集方法
                </h2>
                <p style={{ marginBottom: '1rem' }}>
                    当サイトでは、ユーザーが利用登録をする際に、Googleアカウント連携を通じて以下の情報を取得することがあります。
                </p>
                <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', listStyleType: 'disc' }}>
                    <li>氏名（ニックネーム）</li>
                    <li>メールアドレス</li>
                    <li>プロフィール画像</li>
                </ul>
                <p style={{ marginBottom: '1rem' }}>
                    また、当サイトの利用にあたり、以下の情報を自動的に収集することがあります。
                </p>
                <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', listStyleType: 'disc' }}>
                    <li>IPアドレス</li>
                    <li>Cookie情報</li>
                    <li>ブラウザの種類やバージョン</li>
                    <li>閲覧したページや滞在時間、ゲームのスコアデータ</li>
                </ul>

                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1a202c', marginTop: '2.5rem', marginBottom: '1rem', borderBottom: '2px solid #edf2f7', paddingBottom: '0.5rem' }}>
                    2. 個人情報の利用目的
                </h2>
                <p style={{ marginBottom: '1rem' }}>収集した情報は、以下の目的で利用します。</p>
                <ol style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', listStyleType: 'decimal' }}>
                    <li>本サービスの提供・運営（ログイン機能、スコア保存、ランキング表示など）のため</li>
                    <li>ユーザーからのお問い合わせに回答するため</li>
                    <li>メンテナンスや重要なお知らせをご連絡するため</li>
                    <li>不正・不当な目的での利用を防止するため</li>
                    <li>利用規約に違反したユーザーへの対応のため</li>
                </ol>

                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1a202c', marginTop: '2.5rem', marginBottom: '1rem', borderBottom: '2px solid #edf2f7', paddingBottom: '0.5rem' }}>
                    3. 広告の配信について
                </h2>
                <p style={{ marginBottom: '1rem' }}>
                    当サイトでは、第三者配信の広告サービス（Google AdSenseを含む）を利用しています。
                </p>
                <p style={{ marginBottom: '1rem' }}>
                    このような広告配信事業者は、ユーザーの興味に応じた商品やサービスの広告を表示するため、当サイトや他サイトへのアクセスに関する情報 「Cookie」(氏名、住所、メール アドレス、電話番号は含まれません) を使用することがあります。
                </p>
                <p style={{ marginBottom: '1rem' }}>
                    Googleなどの第三者配信事業者がCookieを使用して、ユーザーが当サイトや他のウェブサイトに過去にアクセスした際の情報に基づいて広告を配信します。
                    Googleが広告Cookieを使用することにより、ユーザーが当サイトや他のウェブサイトにアクセスした際の情報に基づいて、Googleやそのパートナーが適切な広告をユーザーに表示できる仕組みとなっています。
                </p>
                <p style={{ marginBottom: '1rem' }}>
                    ユーザーは、<a href="https://myadcenter.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#3182ce', textDecoration: 'underline' }}>Googleの広告設定</a>でパーソナライズ広告を無効にすることができます。
                    また、<a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" style={{ color: '#3182ce', textDecoration: 'underline' }}>www.aboutads.info</a> にアクセスすれば、パーソナライズ広告に使われる第三者配信事業者の Cookie を無効にすることもできます。
                </p>
                <p style={{ marginBottom: '1rem' }}>
                    Googleアドセンスに関して、このプロセスの詳細やこのような情報が広告配信事業者に使用されないようにする方法については、
                    <a href="https://policies.google.com/technologies/ads?hl=ja" target="_blank" rel="noopener noreferrer" style={{ color: '#3182ce', textDecoration: 'underline' }}>
                        Googleの広告やポリシー規約
                    </a>
                    をご覧ください。
                </p>

                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1a202c', marginTop: '2.5rem', marginBottom: '1rem', borderBottom: '2px solid #edf2f7', paddingBottom: '0.5rem' }}>
                    4. アクセス解析ツールについて
                </h2>
                <p style={{ marginBottom: '1rem' }}>
                    当サイトでは、Googleによるアクセス解析ツール「Googleアナリティクス」を利用しています。
                    このGoogleアナリティクスはトラフィックデータの収集のためにCookieを使用しています。
                    このトラフィックデータは匿名で収集されており、個人を特定するものではありません。
                </p>
                <p style={{ marginBottom: '1rem' }}>
                    この機能はCookieを無効にすることで収集を拒否することが出来ますので、お使いのブラウザの設定をご確認ください。
                    この規約に関して、詳しくは
                    <a href="https://marketingplatform.google.com/about/analytics/terms/jp/" target="_blank" rel="noopener noreferrer" style={{ color: '#3182ce', textDecoration: 'underline' }}>
                        Googleアナリティクス利用規約
                    </a>
                    をご確認ください。
                </p>

                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1a202c', marginTop: '2.5rem', marginBottom: '1rem', borderBottom: '2px solid #edf2f7', paddingBottom: '0.5rem' }}>
                    5. お問い合わせ窓口
                </h2>
                <p style={{ marginBottom: '1.5rem' }}>
                    本ポリシーに関するお問い合わせは、以下の窓口までお願いいたします。
                </p>
                <div style={{ background: '#f7fafc', padding: '1.5rem', borderRadius: '8px' }}>
                    <p style={{ marginBottom: '0.5rem' }}><strong>Asobi Lounge 運営事務局</strong></p>
                    <p>お問い合わせフォーム：<Link href="/contact" style={{ color: '#3182ce', textDecoration: 'underline' }}>こちら</Link>からご連絡ください。</p>
                </div>

                <p style={{ marginTop: '4rem', textAlign: 'right', fontSize: '0.9rem', color: '#718096' }}>
                    制定日：2025年12月6日<br />
                    改定日：2026年2月20日
                </p>
            </article>

            <footer style={{ marginTop: 'auto', padding: '2rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
                <Link href="/" style={{ color: '#718096', textDecoration: 'none', fontSize: '0.9rem' }}>
                    &copy; 2026 Asobi Lounge. All rights reserved.
                </Link>
            </footer>
        </main>
    );
}
