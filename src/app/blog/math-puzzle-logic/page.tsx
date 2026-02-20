import React from 'react';
import Link from 'next/link';

export default function MathPuzzleLogicPage() {
    return (
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem', fontFamily: 'sans-serif', lineHeight: '1.8', color: '#2d3748' }}>
            <header style={{ marginBottom: '3rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '2rem' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: '800', letterSpacing: '-0.02em', lineHeight: '1.4' }}>数理パズルの美しさ：マインスイーパーに見る論理と演繹の魅力</h1>
                <p style={{ color: '#718096', fontSize: '0.95rem' }}>2026年2月20日</p>
            </header>

            <article style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <section style={{ marginBottom: '3rem' }}>
                    <p style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>
                        数独（ナンプレ）やマインスイーパーに代表される「数理パズル（論理パズル）」。これらはただの暇つぶしではありません。限られた情報から「絶対に矛盾しない真実」だけを紡ぎ出していく過程は、数学の証明問題を解くような、純粋で美しい知的体験をもたらしてくれます。
                        今回は、これらのパズルがなぜ私たちを夢中にさせるのか、その論理構造の美しさと「演繹的思考」について解説します。
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', borderLeft: '5px solid #805ad5', paddingLeft: '1rem', color: '#6b46c1' }}>1. ゲームの支配法則「演繹法（えんえきほう）」</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        数理パズルの多くは**「演繹法（Deduction）」**の連続で成り立っています。演繹法とは、「AがBであり、BがCであるならば、AはCである」というように、前提から必然的な結論を導き出す論理展開のことです。
                    </p>
                    <p style={{ marginBottom: '1rem' }}>
                        例えばマインスイーパーにおいて、「『1』の周囲8マスのうち7マスが安全だと確定している」という前提があれば、「残る1マスの見知らぬ空間には『絶対に』地雷が存在する」という結論が一義的に導かれます。ここには一切の感性や直感、曖昧さは入り込みません。100%の確率で真となる事実を積み上げ、混沌とした盤面を秩序ある状態へと自らの手で整理していく快感が、数理パズルの最大の魅力です。
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', borderLeft: '5px solid #805ad5', paddingLeft: '1rem', color: '#6b46c1' }}>2. 背理法：間違っていることを証明して正解を見つける</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        複雑な局面に直面した時、論理パズルプレイヤーは無意識のうちに**「背理法（Reduction ad absurdum）」**を用いています。これは数学の強力な証明手法の一つです。
                    </p>
                    <p style={{ marginBottom: '1rem' }}>
                        「もしこのマスに地雷があると仮定しよう。そうすると、隣のあの『1』の周囲に地雷が2つになってしまい、ルールに矛盾が生じる。ゆえに、このマスには絶対に地雷はない！」
                    </p>
                    <p style={{ marginBottom: '1rem' }}>
                        このように、直接正解を導き出せないときは「仮設を立てて、その結果が矛盾破綻することを確認することで、逆側の事実を確定させる」という高度な思考が行われています。これはプログラミングのデバッグや、科学的な仮説検証のプロセスと全く同じ頭の使い方です。
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', borderLeft: '5px solid #805ad5', paddingLeft: '1rem', color: '#6b46c1' }}>3. 情報の連鎖反応（カスケード）が生むカタルシス</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        数独で何十分も悩んだ末に、ある一つの数字が確定した瞬間、そこを突破口にして他のマスが次々とドミノ倒しのように埋まっていく経験はありませんか？マインスイーパーでも、一つの地雷を特定したことで、周囲の巨大な安全地帯が一気に開ける爽快感があります。
                    </p>
                    <p style={{ marginBottom: '1rem' }}>
                        論理的制約が強く絡み合ったシステムの中で、たった一つの新しい「真実（情報）」が追加されることで、全体のパズルが劇的に解きほぐされていく現象。この情報の連鎖反応（カスケード）によって得られるカタルシス（精神の浄化）は、数理パズル固有の中毒性をもたらします。脳内でパチパチとシナプスが繋がる音が聞こえるかのような、あの「アハ体験（Aha! experience）」です。
                    </p>
                    <div style={{ background: '#faf5ff', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #b794f4', marginTop: '1.5rem' }}>
                        <strong>📐 数学的思考のトレーニング：</strong>
                        数理パズルは文系・理系を問わず、ものごとを「漏れなく、ダブりなく（MECE）」考え、複雑な問題を小さな要素に分解して解決する論理力の良いトレーニングになります。教育現場でも積極的に取り入れられている所以です。
                    </div>
                </section>

                <section>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', borderLeft: '5px solid #805ad5', paddingLeft: '1rem', color: '#6b46c1' }}>まとめ：複雑な世界に秩序をもたらす喜び</h2>
                    <p style={{ marginBottom: '1.5rem' }}>
                        現実世界は曖昧で、理不尽で、白黒はっきりしない不確実性に満ちています。だからこそ私たちは、ルールが完璧に定義され、論理さえ正しければ必ず「唯一の正解」に辿り着ける数理パズルの世界に強く惹かれるのかもしれません。
                    </p>
                    <p style={{ marginBottom: '1.5rem' }}>
                        パズルを解き終えた時の、あの「全てが完璧に機能した」という充足感。Asobi Loungeのマインスイーパーや数独で、その究極の論理美をぜひ体験してください。
                    </p>
                </section>
            </article>

            <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link href="/blog" style={{ color: '#805ad5', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    &larr; コラム一覧へ戻る
                </Link>
                <Link href="/minesweeper" style={{
                    padding: '0.8rem 2rem',
                    background: '#805ad5',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '30px',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 6px rgba(128, 90, 213, 0.3)'
                }}>
                    マインスイーパーに挑戦する &rarr;
                </Link>
            </div>
        </main>
    );
}
