import React from 'react';

export default function PrivacyPage() {
    return (
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem', fontFamily: 'sans-serif', lineHeight: '1.6', color: '#333' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem', borderBottom: '2px solid #eee', paddingBottom: '0.5rem' }}>プライバシーポリシー</h1>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>1. 情報の取得</h2>
                <p>当サイトでは、Googleを含む第三者配信事業者がCookieを使用して、ユーザーのウェブサイトでの閲覧履歴に基づく広告を配信します。</p>
                <p>Google広告Cookieを使用することにより、GoogleやGoogleのパートナーは当サイトや他のサイトへのアクセス情報に基づいて、適切な広告をユーザーに表示できます。</p>
                <p>ユーザーは<a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" style={{ color: '#3182ce' }}>広告設定</a>でパーソナライズ広告を無効にできます。また、<a href="http://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" style={{ color: '#3182ce' }}>www.aboutads.info</a>にアクセスすれば、パーソナライズ広告に使われる第三者配信事業者のCookieを無効にできます。</p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>2. アクセス解析ツールについて</h2>
                <p>当サイトでは、Googleによるアクセス解析ツール「Googleアナリティクス」を利用しています。</p>
                <p>このGoogleアナリティクスはトラフィックデータの収集のためにCookieを使用しています。このトラフィックデータは匿名で収集されており、個人を特定するものではありません。</p>
                <p>この機能はCookieを無効にすることで収集を拒否することが出来ますので、お使いのブラウザの設定をご確認ください。</p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>3. 免責事項</h2>
                <p>当サイトからリンクやバナーなどによって他のサイトに移動された場合、移動先サイトで提供される情報、サービス等について一切の責任を負いません。</p>
                <p>当サイトのコンテンツ・情報につきまして、可能な限り正確な情報を掲載するよう努めておりますが、誤情報が入り込んだり、情報が古くなっていることもございます。</p>
                <p>当サイトに掲載された内容によって生じた損害等の一切の責任を負いかねますのでご了承ください。</p>
            </section>
        </main>
    );
}
