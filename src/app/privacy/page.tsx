import React from 'react';
import Link from 'next/link';

export default function PrivacyPage() {
    return (
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif', lineHeight: '1.6' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem', borderBottom: '2px solid #eee', paddingBottom: '0.5rem' }}>プライバシーポリシー</h1>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>1. 情報の取得</h2>
                <p>当サイトでは、Googleを含む第三者配信事業者がCookieを使用して、ユーザーのウェブサイトでの閲覧履歴に基づく広告を配信します。Google広告Cookieを使用することにより、GoogleやGoogleのパートナーは当サイトや他のサイトへのアクセス情報に基づいて、適切な広告をユーザーに表示することができます。</p>
                <p>ユーザーは<a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" style={{ color: '#3182ce' }}>広告設定</a>でパーソナライズ広告を無効にすることができます。また、<a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" style={{ color: '#3182ce' }}>www.aboutads.info</a>にアクセスすれば、パーソナライズ広告に使われる第三者配信事業者のCookieを無効にすることができます。</p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>2. アクセス解析ツールについて</h2>
                <p>当サイトでは、Googleによるアクセス解析ツール「Googleアナリティクス」を利用しています。このGoogleアナリティクスはトラフィックデータの収集のためにCookieを使用しています。このトラフィックデータは匿名で収集されており、個人を特定するものではありません。この機能はCookieを無効にすることで収集を拒否することが出来ますので、お使いのブラウザの設定をご確認ください。</p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>3. 個人情報の利用目的</h2>
                <p>当サイトでは、お問い合わせや記事へのコメントの際、名前やメールアドレス等の個人情報を入力いただく場合がございます。取得した個人情報は、お問い合わせに対する回答や必要な情報を電子メールなどをでご連絡する場合に利用させていただくものであり、これらの目的以外では利用いたしません。</p>
            </section>

            <div style={{ marginTop: '3rem', textAlign: 'center' }}>
                <Link href="/" style={{ color: '#3182ce', textDecoration: 'underline' }}>トップページへ戻る</Link>
            </div>
        </main>
    );
}
