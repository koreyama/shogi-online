import React from 'react';
import Link from 'next/link';

export default function TermsPage() {
    return (
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif', lineHeight: '1.6' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem', borderBottom: '2px solid #eee', paddingBottom: '0.5rem' }}>利用規約</h1>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>1. 適用</h2>
                <p>本規約は、ユーザーと当サイト運営者との間の本サービスの利用に関わる一切の関係に適用されるものとします。</p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>2. 禁止事項</h2>
                <p>ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
                <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                    <li>法令または公序良俗に違反する行為</li>
                    <li>犯罪行為に関連する行為</li>
                    <li>当サイトのサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
                    <li>当サイトのサービスの運営を妨害するおそれのある行為</li>
                    <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
                    <li>不正アクセスをし、またはこれを試みる行為</li>
                </ul>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>3. 免責事項</h2>
                <p>当サイトのコンテンツ・情報につきまして、可能な限り正確な情報を掲載するよう努めておりますが、誤情報が入り込んだり、情報が古くなっていることもございます。当サイトに掲載された内容によって生じた損害等の一切の責任を負いかねますのでご了承ください。</p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>4. 運営者情報</h2>
                <p>運営者: Asobi Lounge 運営事務局</p>
                <p>お問い合わせ: <Link href="/contact" style={{ color: '#3182ce' }}>お問い合わせフォーム</Link>よりご連絡ください。</p>
            </section>

            <div style={{ marginTop: '3rem', textAlign: 'center' }}>
                <Link href="/" style={{ color: '#3182ce', textDecoration: 'underline' }}>トップページへ戻る</Link>
            </div>
        </main>
    );
}
