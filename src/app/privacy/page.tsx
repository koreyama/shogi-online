import React from 'react';
import Link from 'next/link';

export default function PrivacyPage() {
    return (
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem', fontFamily: 'sans-serif', lineHeight: '1.8', color: '#2d3748' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '3rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem', fontWeight: '800' }}>プライバシーポリシー</h1>

            <div style={{ background: 'white', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <p style={{ marginBottom: '2rem' }}>
                    Asobi Lounge（以下，「当サイト」といいます。）は，本ウェブサイト上で提供するサービス（以下，「本サービス」といいます。）における，ユーザーの個人情報の取扱いについて，以下のとおりプライバシーポリシー（以下，「本ポリシー」といいます。）を定めます。
                </p>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #3182ce', paddingLeft: '1rem', color: '#2c5282' }}>第1条（個人情報の収集方法）</h2>
                    <p>当サイトは，ユーザーが利用登録をする際にGoogleアカウント情報（氏名，メールアドレス，プロフィール画像等）を収集することがあります。また，ユーザーのゲームプレイ履歴，チャットログ等の情報を収集します。</p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #3182ce', paddingLeft: '1rem', color: '#2c5282' }}>第2条（個人情報の利用目的）</h2>
                    <p>当サイトが個人情報を利用する目的は，以下のとおりです。</p>
                    <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                        <li>本サービスの提供・運営のため</li>
                        <li>ユーザーからのお問い合わせに回答するため</li>
                        <li>利用規約に違反したユーザーや，不正・不当な目的でサービスを利用しようとするユーザーの特定をし，ご利用をお断りするため</li>
                        <li>上記の利用目的に付随する目的</li>
                    </ul>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #3182ce', paddingLeft: '1rem', color: '#2c5282' }}>第3条（広告の配信について）</h2>
                    <p style={{ marginBottom: '1rem' }}>当サイトでは、第三者配信の広告サービス（Googleアドセンス）を利用しています。</p>
                    <p style={{ marginBottom: '1rem' }}>このような広告配信事業者は、ユーザーの興味に応じた商品やサービスの広告を表示するため、当サイトや他サイトへのアクセスに関する情報 『Cookie』(氏名、住所、メール アドレス、電話番号は含まれません) を使用することがあります。</p>
                    <p>またGoogleアドセンスに関して、このプロセスの詳細やこのような情報が広告配信事業者に使用されないようにする方法については、<a href="https://policies.google.com/technologies/ads?hl=ja" target="_blank" rel="noopener noreferrer" style={{ color: '#3182ce', textDecoration: 'underline' }}>こちら</a>をご覧ください。</p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #3182ce', paddingLeft: '1rem', color: '#2c5282' }}>第4条（アクセス解析ツールについて）</h2>
                    <p>当サイトでは、Googleによるアクセス解析ツール「Googleアナリティクス」を利用しています。</p>
                    <p>このGoogleアナリティクスはトラフィックデータの収集のためにCookieを使用しています。このトラフィックデータは匿名で収集されており、個人を特定するものではありません。この機能はCookieを無効にすることで収集を拒否することが出来ますので、お使いのブラウザの設定をご確認ください。</p>
                </section>

                <section>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #3182ce', paddingLeft: '1rem', color: '#2c5282' }}>第5条（お問い合わせ窓口）</h2>
                    <p>本ポリシーに関するお問い合わせは，下記の窓口までお願いいたします。</p>
                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', marginTop: '1rem' }}>
                        <p><strong>運営者:</strong> Asobi Lounge 運営事務局</p>
                        <p><strong>お問い合わせ:</strong> <Link href="/contact" style={{ color: '#3182ce', textDecoration: 'underline' }}>お問い合わせフォーム</Link></p>
                    </div>
                </section>
            </div>

            <div style={{ marginTop: '4rem', textAlign: 'center' }}>
                <Link href="/" style={{
                    display: 'inline-block',
                    padding: '0.8rem 2rem',
                    background: '#edf2f7',
                    color: '#4a5568',
                    textDecoration: 'none',
                    borderRadius: '30px',
                    fontWeight: 'bold',
                    transition: 'background 0.2s'
                }}>
                    トップページへ戻る
                </Link>
            </div>
        </main>
    );
}
