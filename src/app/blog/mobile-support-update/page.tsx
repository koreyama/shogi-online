import React from 'react';
import Link from 'next/link';

export default function ArticlePage() {
    return (
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem', fontFamily: 'sans-serif', lineHeight: '1.8', color: '#2d3748' }}>
            <header style={{ marginBottom: '3rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '2rem' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: '800', letterSpacing: '-0.02em' }}>スマホ対応を順次開始！まずは新作から</h1>
                <p style={{ color: '#718096', fontSize: '0.95rem' }}>2025年12月5日</p>
            </header>

            <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #3182ce', paddingLeft: '1rem', color: '#2c5282' }}>スマートフォンでのプレイが可能に</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        多くのユーザー様からご要望をいただいていた「スマートフォン対応」を、新作ゲーム『Civilization Builder』にて実施いたしました！
                        これまではPCでの表示を前提としていたため、スマホでは遊びにくい部分がありましたが、今回の対応で快適にプレイできるようになりました。
                    </p>
                    <p>
                        他のゲームにつきましても、順次スマートフォンへの最適化を進めていく予定です。
                        完全対応まで今しばらくお待ちください。
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #3182ce', paddingLeft: '1rem', color: '#2c5282' }}>特に変わったポイント</h2>
                    <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                        <li style={{ marginBottom: '0.5rem' }}><strong>画面レイアウトの最適化:</strong> 縦画面でも情報が見やすいよう、パネル配置を自動調整するようにしました。</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>タッチ操作の改善:</strong> ボタンや駒のサイズを大きくし、指での操作ミスが減るように調整しました。</li>
                        <li style={{ marginBottom: '0.5rem' }}><strong>文字サイズの調整:</strong> 小さな画面でも読みやすいフォントサイズに変更しました。</li>
                    </ul>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #3182ce', paddingLeft: '1rem', color: '#2c5282' }}>ホーム画面に追加機能も</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        また、ゲーム中の「設定」メニューやタイトル画面から、ワンタップでホーム画面に戻れるボタンも追加しました。
                        これにより、別のゲームへの切り替えもスムーズに行えます。
                    </p>
                    <p>
                        新しくなったAsobi Loungeを、ぜひお手元のスマートフォンで体験してみてください！
                    </p>
                </section>
            </div>

            <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link href="/blog" style={{ color: '#3182ce', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    &larr; コラム一覧へ戻る
                </Link>
                <Link href="/" style={{
                    padding: '0.8rem 2rem',
                    background: '#3182ce',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '30px',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 6px rgba(49, 130, 206, 0.3)'
                }}>
                    トップページへ &rarr;
                </Link>
            </div>
        </main>
    );
}
