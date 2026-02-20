import React from 'react';
import Link from 'next/link';

export default function OnlineGameMannersPage() {
    return (
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem', fontFamily: 'sans-serif', lineHeight: '1.8', color: '#2d3748' }}>
            <header style={{ marginBottom: '3rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '2rem' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: '800', letterSpacing: '-0.02em', lineHeight: '1.4' }}>オンラインゲームのマナーと楽しみ方：初心者向け完全ガイド</h1>
                <p style={{ color: '#718096', fontSize: '0.95rem' }}>2026年2月20日</p>
            </header>

            <article style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <section style={{ marginBottom: '3rem' }}>
                    <p style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>
                        インターネットの普及により、いつでもどこでも世界中の誰かとリアルタイムで対戦できる素晴らしい時代になりました。しかし、画面の向こうにいるのが「人間」である以上、そこには最低限のコミュニケーション・マナーが存在します。
                        誰もが気持ちよくプレイし、オンラインゲームを120%楽しむための重要なポイントを、初心者向けにわかりやすく解説します。
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', borderLeft: '5px solid #38a169', paddingLeft: '1rem', color: '#2f855a' }}>1. 挨拶（あいさつ）はすべての基本</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        「たかがゲームに挨拶なんて必要？」と思うかもしれません。しかし、チャットやエモート機能がある場合、対戦開始時の「よろしくお願いします」や、終了時の「ありがとうございました」があるだけで、お互いの心理的なハードルは大きく下がります。
                    </p>
                    <p style={{ marginBottom: '1rem' }}>
                        特に無言のまま圧倒的な実力差で勝つ/負けるという状況は殺伐としがちですが、挨拶一つで「お互いに良き時間を共有したライバル」へと変わります。システム的に挨拶機能がなくても、心のなかでの敬意を忘れないようにしましょう。
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', borderLeft: '5px solid #38a169', paddingLeft: '1rem', color: '#2f855a' }}>2. 切断・放置（AFK）は絶対NG</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        オンライン対戦において最もやってはいけないマナー違反が、意図的な**「通信切断（回線切り）」**と**「放置（AFK：Away From Keyboard）」**です。
                        負けが確定したから、あるいは思い通りにいかないからといってゲームを強制終了させる行為は、相手から貴重な「勝利の喜び」と「時間」を奪う最も自己中心的な行動です。
                    </p>
                    <p style={{ marginBottom: '1rem' }}>
                        将棋やチェスのような伝統的なゲームには「投了」という美しいシステムがあります。「負けました」と自ら認め、頭を下げること。これは自分自身の成長のためにも不可欠なプロセスです。負けを潔く認めるかっこよさを身につけましょう。急用ができた場合は、可能であれば投了するかチャットで一言伝えるのがベストです。
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', borderLeft: '5px solid #38a169', paddingLeft: '1rem', color: '#2f855a' }}>3. 煽り（あおり）プレイ・過度な長考への対処</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        残念ながらオンライン上には、スタンプを連打したり、勝負が決まっているのにわざと無駄な手を続ける「煽りプレイ」をするプレイヤーも少数存在します。また、必要以上の「長考（意図的な遅延）」も相手をイライラさせる原因になります。
                    </p>
                    <p style={{ marginBottom: '1rem' }}>
                        自分がやらないことは当然として、**相手にされた場合の対処法**が重要です。一番の対策は「無視すること」です。相手の目的はあなたを感情的にさせることですから、感情的になった時点で相手の思惑通りです。冷静に最善手を打ち続けるか、不快であればミュート機能を利用し、淡々とゲームを消化しましょう。
                    </p>
                    <div style={{ background: '#f0fff4', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #48bb78', marginTop: '1.5rem' }}>
                        <strong>🛡️ スルースキルを身につける：</strong>
                        ネット上での悪意を受け流す「スルースキル」は、現代社会を生き抜くための重要なライフハックでもあります。ゲームを通じたメンタルトレーニングだと割り切るのもひとつの方法です。
                    </div>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', borderLeft: '5px solid #38a169', paddingLeft: '1rem', color: '#2f855a' }}>4. 負けた時のメンタルコントロール（Tilt対策）</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        ポーカー用語に「ティルト（Tilt）」という言葉があります。負けが込んで感情的になり、普段なら絶対にやらないような無謀なプレイ・雑なプレイをしてしまう精神状態のことです。
                    </p>
                    <p style={{ marginBottom: '1rem' }}>
                        理不尽な負け方をしたり、連敗が続くと、誰でもティルトに陥ります。そのような時は「次で取り返す」と焦るのではなく、**一旦ゲームから離れて深呼吸する、水やコーヒーを飲む**などして、物理的にプレイを中断する勇気を持ちましょう。正常な判断力が戻ってから再開することが、結果的に勝率の安定に繋がります。
                    </p>
                </section>

                <section>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', borderLeft: '5px solid #38a169', paddingLeft: '1rem', color: '#2f855a' }}>まとめ：フェアプレーの精神こそが最高のエンターテインメント</h2>
                    <p style={{ marginBottom: '1.5rem' }}>
                        オンラインゲームは、顔も知らない人と一時的に作り上げる「共有の遊び場」です。双方がお互いをリスペクトし、ルールとマナーを守って全力を尽くした時、勝敗に関係なく「良い試合だった」という深い満足感を得ることができます。
                    </p>
                    <p style={{ marginBottom: '1.5rem' }}>
                        Asobi Loungeは皆様が気持ちよくプレイできる環境作りに努めています。ぜひ、フェアプレーの精神を持って、全国のライバルたちとの素晴らしい対局をお楽しみください。
                    </p>
                </section>
            </article>

            <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link href="/blog" style={{ color: '#38a169', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    &larr; コラム一覧へ戻る
                </Link>
                <Link href="/lobby" style={{
                    padding: '0.8rem 2rem',
                    background: '#38a169',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '30px',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 6px rgba(56, 161, 105, 0.3)'
                }}>
                    対戦ロビーへ行く &rarr;
                </Link>
            </div>
        </main>
    );
}
