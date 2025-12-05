'use client';

import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
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
            <article style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem 2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#1a202c', marginBottom: '2rem' }}>
                    プライバシーポリシー
                </h1>

                <div style={{ color: '#4a5568', lineHeight: 1.8 }}>
                    <p style={{ marginBottom: '1.5rem' }}>
                        Asobi Lounge（以下「当サイト」）は、ユーザーのプライバシーを尊重し、
                        個人情報の保護に努めています。本プライバシーポリシーでは、
                        当サイトがどのような情報を収集し、どのように使用するかについて説明します。
                    </p>

                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1a202c', marginTop: '2rem', marginBottom: '1rem' }}>
                        1. 収集する情報
                    </h2>
                    <p style={{ marginBottom: '1rem' }}>当サイトは以下の情報を収集することがあります：</p>
                    <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem' }}>
                        <li style={{ marginBottom: '0.5rem' }}>Googleアカウントによるログイン時の基本情報（名前、メールアドレス、プロフィール画像）</li>
                        <li style={{ marginBottom: '0.5rem' }}>ゲームの進行状況やスコア</li>
                        <li style={{ marginBottom: '0.5rem' }}>サイトの利用状況に関する分析データ</li>
                    </ul>

                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1a202c', marginTop: '2rem', marginBottom: '1rem' }}>
                        2. 情報の利用目的
                    </h2>
                    <p style={{ marginBottom: '1rem' }}>収集した情報は以下の目的で使用します：</p>
                    <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem' }}>
                        <li style={{ marginBottom: '0.5rem' }}>ユーザー認証とアカウント管理</li>
                        <li style={{ marginBottom: '0.5rem' }}>ゲームデータのクラウド保存</li>
                        <li style={{ marginBottom: '0.5rem' }}>ランキング機能の提供</li>
                        <li style={{ marginBottom: '0.5rem' }}>サービスの改善と分析</li>
                    </ul>

                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1a202c', marginTop: '2rem', marginBottom: '1rem' }}>
                        3. 第三者への提供
                    </h2>
                    <p style={{ marginBottom: '1.5rem' }}>
                        当サイトは、法令に基づく場合を除き、ユーザーの同意なく個人情報を第三者に提供することはありません。
                    </p>

                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1a202c', marginTop: '2rem', marginBottom: '1rem' }}>
                        4. Cookieの使用
                    </h2>
                    <p style={{ marginBottom: '1.5rem' }}>
                        当サイトでは、ユーザー体験の向上やアクセス解析のためにCookieを使用しています。
                        ブラウザの設定によりCookieを無効にすることができますが、
                        一部の機能が正常に動作しない場合があります。
                    </p>

                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1a202c', marginTop: '2rem', marginBottom: '1rem' }}>
                        5. 広告について
                    </h2>
                    <p style={{ marginBottom: '1.5rem' }}>
                        当サイトでは、第三者配信の広告サービス（Google AdSenseなど）を利用することがあります。
                        これらの広告配信事業者は、ユーザーの興味に応じた広告を表示するためにCookieを使用することがあります。
                        Google AdSenseに関する詳細は、
                        <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" style={{ color: '#3182ce' }}>
                            Googleのポリシーと規約
                        </a>
                        をご確認ください。
                    </p>

                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1a202c', marginTop: '2rem', marginBottom: '1rem' }}>
                        6. アクセス解析ツール
                    </h2>
                    <p style={{ marginBottom: '1.5rem' }}>
                        当サイトでは、Googleアナリティクスなどのアクセス解析ツールを使用することがあります。
                        これらのツールはトラフィックデータの収集のためにCookieを使用しています。
                        収集されるデータは匿名であり、個人を特定するものではありません。
                    </p>

                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1a202c', marginTop: '2rem', marginBottom: '1rem' }}>
                        7. プライバシーポリシーの変更
                    </h2>
                    <p style={{ marginBottom: '1.5rem' }}>
                        当サイトは、必要に応じて本プライバシーポリシーを変更することがあります。
                        重要な変更がある場合は、サイト上でお知らせします。
                    </p>

                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1a202c', marginTop: '2rem', marginBottom: '1rem' }}>
                        8. お問い合わせ
                    </h2>
                    <p style={{ marginBottom: '1.5rem' }}>
                        プライバシーポリシーに関するお問い合わせは、
                        <Link href="/contact" style={{ color: '#3182ce' }}>お問い合わせページ</Link>
                        よりご連絡ください。
                    </p>

                    <p style={{ marginTop: '3rem', color: '#718096', fontSize: '0.9rem' }}>
                        最終更新日：2025年12月6日
                    </p>
                </div>
            </article>

            {/* Footer */}
            <footer style={{
                padding: '2rem 4rem',
                borderTop: '1px solid #edf2f7',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#718096',
                fontSize: '0.85rem'
            }}>
                <div>© 2025 Asobi Lounge</div>
                <div style={{ display: 'flex', gap: '2rem' }}>
                    <Link href="/about" style={{ color: '#718096', textDecoration: 'none' }}>About</Link>
                    <Link href="/terms" style={{ color: '#718096', textDecoration: 'none' }}>利用規約</Link>
                    <Link href="/privacy" style={{ color: '#718096', textDecoration: 'none' }}>プライバシーポリシー</Link>
                    <Link href="/contact" style={{ color: '#718096', textDecoration: 'none' }}>お問い合わせ</Link>
                </div>
            </footer>
        </main>
    );
}
