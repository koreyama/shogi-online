'use client';

import React from 'react';
import Link from 'next/link';

export default function TermsPage() {
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
                    利用規約
                </h1>

                <div style={{ color: '#4a5568', lineHeight: 1.8 }}>
                    <p style={{ marginBottom: '1.5rem' }}>
                        この利用規約（以下「本規約」）は、Asobi Lounge（以下「当サイト」）の利用条件を定めるものです。
                        ユーザーの皆様には、本規約に同意いただいた上で当サイトをご利用いただきます。
                    </p>

                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1a202c', marginTop: '2rem', marginBottom: '1rem' }}>
                        第1条（適用）
                    </h2>
                    <p style={{ marginBottom: '1.5rem' }}>
                        本規約は、ユーザーと当サイトとの間の本サービスの利用に関わる一切の関係に適用されるものとします。
                    </p>

                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1a202c', marginTop: '2rem', marginBottom: '1rem' }}>
                        第2条（利用登録）
                    </h2>
                    <p style={{ marginBottom: '1.5rem' }}>
                        当サイトの利用には、Googleアカウントによるログインが必要です。
                        ログインをもって、本規約に同意したものとみなします。
                    </p>

                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1a202c', marginTop: '2rem', marginBottom: '1rem' }}>
                        第3条（禁止事項）
                    </h2>
                    <p style={{ marginBottom: '1rem' }}>ユーザーは、以下の行為をしてはなりません：</p>
                    <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem' }}>
                        <li style={{ marginBottom: '0.5rem' }}>法令または公序良俗に違反する行為</li>
                        <li style={{ marginBottom: '0.5rem' }}>犯罪行為に関連する行為</li>
                        <li style={{ marginBottom: '0.5rem' }}>当サイトのサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
                        <li style={{ marginBottom: '0.5rem' }}>当サイトのサービスの運営を妨害するおそれのある行為</li>
                        <li style={{ marginBottom: '0.5rem' }}>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
                        <li style={{ marginBottom: '0.5rem' }}>他のユーザーに成りすます行為</li>
                        <li style={{ marginBottom: '0.5rem' }}>不正アクセスをし、またはこれを試みる行為</li>
                        <li style={{ marginBottom: '0.5rem' }}>チート、BOT、スクリプトなどを使用した不正行為</li>
                        <li style={{ marginBottom: '0.5rem' }}>その他、当サイトが不適切と判断する行為</li>
                    </ul>

                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1a202c', marginTop: '2rem', marginBottom: '1rem' }}>
                        第4条（本サービスの提供の停止等）
                    </h2>
                    <p style={{ marginBottom: '1rem' }}>
                        当サイトは、以下のいずれかの事由があると判断した場合、
                        ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします：
                    </p>
                    <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem' }}>
                        <li style={{ marginBottom: '0.5rem' }}>本サービスにかかるシステムの保守点検または更新を行う場合</li>
                        <li style={{ marginBottom: '0.5rem' }}>地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合</li>
                        <li style={{ marginBottom: '0.5rem' }}>その他、当サイトが本サービスの提供が困難と判断した場合</li>
                    </ul>

                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1a202c', marginTop: '2rem', marginBottom: '1rem' }}>
                        第5条（免責事項）
                    </h2>
                    <p style={{ marginBottom: '1.5rem' }}>
                        当サイトは、本サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、
                        特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます）が
                        ないことを明示的にも黙示的にも保証しておりません。
                    </p>

                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1a202c', marginTop: '2rem', marginBottom: '1rem' }}>
                        第6条（サービス内容の変更等）
                    </h2>
                    <p style={{ marginBottom: '1.5rem' }}>
                        当サイトは、ユーザーに通知することなく、本サービスの内容を変更しまたは本サービスの提供を中止することができるものとし、
                        これによってユーザーに生じた損害について一切の責任を負いません。
                    </p>

                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1a202c', marginTop: '2rem', marginBottom: '1rem' }}>
                        第7条（利用規約の変更）
                    </h2>
                    <p style={{ marginBottom: '1.5rem' }}>
                        当サイトは、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。
                        変更後の利用規約は、当サイトに掲載した時点から効力を生じるものとします。
                    </p>

                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1a202c', marginTop: '2rem', marginBottom: '1rem' }}>
                        第8条（準拠法・裁判管轄）
                    </h2>
                    <p style={{ marginBottom: '1.5rem' }}>
                        本規約の解釈にあたっては、日本法を準拠法とします。
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
