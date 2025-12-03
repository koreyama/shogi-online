import React from 'react';
import Link from 'next/link';

export default function TermsPage() {
    return (
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem', fontFamily: 'sans-serif', lineHeight: '1.8', color: '#2d3748' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '3rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem', fontWeight: '800' }}>利用規約</h1>

            <div style={{ background: 'white', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <p style={{ marginBottom: '2rem' }}>
                    この利用規約（以下，「本規約」といいます。）は，Asobi Lounge（以下，「当サイト」といいます。）がこのウェブサイト上で提供するサービス（以下，「本サービス」といいます。）の利用条件を定めるものです。登録ユーザーの皆さま（以下，「ユーザー」といいます。）には，本規約に従って，本サービスをご利用いただきます。
                </p>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #3182ce', paddingLeft: '1rem', color: '#2c5282' }}>第1条（適用）</h2>
                    <p>本規約は，ユーザーと当サイトとの間の本サービスの利用に関わる一切の関係に適用されるものとします。</p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #3182ce', paddingLeft: '1rem', color: '#2c5282' }}>第2条（利用登録）</h2>
                    <p>本サービスにおいては，登録希望者が当サイト所定の方法（Googleアカウント連携等）によって利用登録を申請し，当サイトがこれを承認することによって，利用登録が完了するものとします。</p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #3182ce', paddingLeft: '1rem', color: '#2c5282' }}>第3条（禁止事項）</h2>
                    <p style={{ marginBottom: '1rem' }}>ユーザーは，本サービスの利用にあたり，以下の行為をしてはなりません。</p>
                    <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginTop: '0.5rem', background: '#f8fafc', padding: '1.5rem 1.5rem 1.5rem 3rem', borderRadius: '8px' }}>
                        <li style={{ marginBottom: '0.5rem' }}>法令または公序良俗に違反する行為</li>
                        <li style={{ marginBottom: '0.5rem' }}>犯罪行為に関連する行為</li>
                        <li style={{ marginBottom: '0.5rem' }}>当サイト，本サービスの他のユーザー，または第三者のサーバーまたはネットワークの機能を破壊したり，妨害したりする行為</li>
                        <li style={{ marginBottom: '0.5rem' }}>当サイトのサービスの運営を妨害するおそれのある行為</li>
                        <li style={{ marginBottom: '0.5rem' }}>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
                        <li style={{ marginBottom: '0.5rem' }}>不正アクセスをし，またはこれを試みる行為</li>
                        <li style={{ marginBottom: '0.5rem' }}>他のユーザーに成りすます行為</li>
                        <li style={{ marginBottom: '0.5rem' }}>当サイトのサービスに関連して，反社会的勢力に対して直接または間接に利益を供与する行為</li>
                        <li style={{ marginBottom: '0.5rem' }}>チャット機能において，他者を誹謗中傷する内容，暴力的・猥褻な内容，その他公序良俗に反する内容を投稿する行為</li>
                        <li>ゲームの公平性を損なう行為（チートツールの使用，意図的な切断等）</li>
                    </ul>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #3182ce', paddingLeft: '1rem', color: '#2c5282' }}>第4条（本サービスの提供の停止等）</h2>
                    <p>当サイトは，以下のいずれかの事由があると判断した場合，ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。</p>
                    <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                        <li>本サービスにかかるコンピュータシステムの保守点検または更新を行う場合</li>
                        <li>地震，落雷，火災，停電または天災などの不可抗力により，本サービスの提供が困難となった場合</li>
                        <li>コンピュータまたは通信回線等が事故により停止した場合</li>
                        <li>その他，当サイトが本サービスの提供が困難と判断した場合</li>
                    </ul>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #3182ce', paddingLeft: '1rem', color: '#2c5282' }}>第5条（免責事項）</h2>
                    <p>当サイトの債務不履行責任は，当サイトの故意または重過失によらない場合には免責されるものとします。</p>
                    <p>当サイトは，本サービスに関して，ユーザーと他のユーザーまたは第三者との間において生じた取引，連絡または紛争等について一切責任を負いません。</p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #3182ce', paddingLeft: '1rem', color: '#2c5282' }}>第6条（サービス内容の変更等）</h2>
                    <p>当サイトは，ユーザーに通知することなく，本サービスの内容を変更しまたは本サービスの提供を中止することができるものとし，これによってユーザーに生じた損害について一切の責任を負いません。</p>
                </section>

                <section>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid #3182ce', paddingLeft: '1rem', color: '#2c5282' }}>第7条（準拠法・裁判管轄）</h2>
                    <p>本規約の解釈にあたっては，日本法を準拠法とします。</p>
                    <p>本サービスに関して紛争が生じた場合には，当サイト運営者の所在地を管轄する裁判所を専属的合意管轄とします。</p>
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
