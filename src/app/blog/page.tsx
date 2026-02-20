import React from 'react';
import Link from 'next/link';

export default function BlogPage() {
    const articles = [
        {
            slug: 'board-game-brain-science',
            title: 'ボードゲームと脳科学：論理的思考力と認知機能の向上',
            excerpt: '将棋やオセロは脳にどのような影響を与えるのか？前頭前野の活性化やパターン認識、メタ認知の観点から解説します。',
            date: '2026-02-20'
        },
        {
            slug: 'strategy-game-psychology',
            title: '戦略ゲームの心理学：なぜ私たちは「読み合い」に魅了されるのか',
            excerpt: '相手の思考を読む「心の理論」やメタゲームの面白さ。人が対人ゲームの駆け引きに熱狂する心理的メカニズムに迫ります。',
            date: '2026-02-20'
        },
        {
            slug: 'online-game-manners',
            title: 'オンラインゲームのマナーと楽しみ方：初心者向け完全ガイド',
            excerpt: '挨拶の重要性から、切断・放置のNG行動、そして負けた時のメンタルコントロール（ティルト対策）まで、気持ちよくプレイするための心得。',
            date: '2026-02-20'
        },
        {
            slug: 'typing-master-guide',
            title: 'タイピングマスターへの道：手元を見ない「ブラインドタッチ」習得の極意',
            excerpt: 'ホームポジションの絶対遵守から、単語単位での認識、筋肉の記憶の作り方まで。一生モノのスキルを最短で身につける科学的メソッド。',
            date: '2026-02-20'
        },
        {
            slug: 'math-puzzle-logic',
            title: '数理パズルの美しさ：マインスイーパーに見る論理と演繹の魅力',
            excerpt: '運ゲーではない、純粋な論理体系。演繹法と背理法を駆使して「唯一の正解」を導き出す、数学的思考の美しさを語ります。',
            date: '2026-02-20'
        },
        {
            slug: 'minesweeper-probability',
            title: 'マインスイーパーと確率論：運ゲーを実力ゲーに変える思考法',
            excerpt: '「運ゲーだ」と諦めていませんか？確率論を用いた論理的な攻略法と、どうしてもわからない時のリスク管理術。',
            date: '2026-02-17'
        },
        {
            slug: 'reversi-advanced-strategy',
            title: 'リバーシ（オセロ）の勝ち方：角を取るだけでは勝てない理由',
            excerpt: '初心者が陥りがちな「石を取りすぎ」の罠。「開放度理論」と「中割り」を理解して、中盤の主導権を握ろう。',
            date: '2026-02-16'
        },
        {
            slug: 'shogi-improvement-guide',
            title: '将棋の上達法：初段を目指すための3つのステップ',
            excerpt: '「終盤力」が全て？効率よく強くなるための練習法と、初心者が最初に覚えるべき戦法を解説します。',
            date: '2026-02-15'
        },
        {
            slug: 'history-of-shogi',
            title: '将棋の歴史：古代インドから現代AIまで',
            excerpt: '将棋のルーツはどこにあるのか？平安時代から現代に至るまでの進化の過程を解説します。',
            date: '2026-01-02'
        },
        {
            slug: 'backgammon-guide',
            title: 'バックギャモン入門：5000年の歴史を持つ最古のボードゲーム',
            excerpt: '世界最古のボードゲーム、バックギャモンの基本ルールと戦略を初心者向けに解説します。',
            date: '2026-01-02'
        },
        {
            slug: 'mancala-strategy',
            title: 'マンカラ攻略法：アフリカ生まれの種まきゲームを極める',
            excerpt: 'シンプルなルールながら奥深いマンカラ。連続手番やキャプチャを狙う戦略を紹介。',
            date: '2026-01-02'
        },
        {
            slug: 'drawing-game-tips',
            title: 'お絵かきクイズを楽しむコツ：描く側も当てる側も',
            excerpt: '描く人も当てる人も楽しめる！お絵かきクイズで盛り上がるためのテクニック集。',
            date: '2026-01-02'
        },
        {
            slug: 'stock-simulator-guide',
            title: '株シミュレーター入門：リスクゼロで投資を学ぶ',
            excerpt: '仮想資金で株取引を体験。初心者でも安心して投資の基本を学べます。',
            date: '2026-01-02'
        },
        {
            slug: 'yacht-rules',
            title: 'ヨット（ヤッツィー）のルール完全ガイド',
            excerpt: '5つのサイコロで役を作るダイスゲーム。役の種類と得点計算を詳しく解説。',
            date: '2026-01-02'
        },
        {
            slug: 'dots-boxes-strategy',
            title: 'Dots & Boxes攻略：陣取りゲームの必勝法',
            excerpt: '紙とペンで遊べる陣取りゲーム。チェーン理論とダブルクロス戦略をマスターしよう。',
            date: '2026-01-02'
        },
        {
            slug: 'hit-blow-tips',
            title: 'Hit & Blow攻略：論理的思考で数字を当てる',
            excerpt: '論理パズル好き必見！効率的に正解にたどり着く推理テクニックを紹介。',
            date: '2026-01-02'
        },
        {
            slug: 'brain-training',
            title: 'ボードゲームで脳トレ：科学が証明する効果とおすすめゲーム',
            excerpt: '認知機能向上に効果的なボードゲーム。目的別おすすめゲームと効果的な脳トレのコツ。',
            date: '2026-01-02'
        },
        {
            slug: 'online-gaming-benefits',
            title: 'ブラウザゲームの魅力：いつでもどこでも始められる手軽さ',
            excerpt: 'インストール不要、マルチデバイス対応。ブラウザゲームのメリットを解説。',
            date: '2026-01-02'
        },
        {
            slug: 'civilization-guide',
            title: 'Civilization Builder完全攻略：効率的な文明発展の道',
            excerpt: '放置系シミュレーションの攻略法。序盤から中盤の効率的な進め方を解説。',
            date: '2026-01-02'
        },
        {
            slug: 'clicker-game-release',
            title: '新作ゲーム『Civilization Builder』リリース！',
            excerpt: 'クリックで文明を築く放置系シミュレーションが登場。技術ツリーを進めて、原始時代から現代文明を目指そう！',
            date: '2025-12-05'
        },
        {
            slug: 'shogi-vs-chess',
            title: '将棋とチェスの違い：持ち駒と盤の広さ',
            excerpt: '兄弟ゲームでありながら全く異なる進化を遂げた2つのボードゲーム。その決定的な違いとは？',
            date: '2025-12-05'
        },
        {
            slug: 'chess-openings',
            title: 'チェス初心者のための定跡ガイド：最初の10手で差をつける',
            excerpt: 'イタリアンゲーム、ロンドンシステムなど、初心者が覚えるべきオープニングの基本原則を解説します。',
            date: '2025-12-06'
        },
        {
            slug: 'mobile-support-update',
            title: 'スマホ対応を順次開始！まずは新作から',
            excerpt: 'ご要望の多かったスマートフォン対応を、新作「Civilization Builder」から開始しました。他のゲームも順次対応予定です。',
            date: '2025-12-05'
        },
        {
            slug: 'connect4-strategy',
            title: '四目並べ必勝法：中央を制する者がゲームを制する',
            excerpt: '先手必勝と言われる四目並べ。中央支配やダブルスレットなど、勝率を上げるための戦略を紹介。',
            date: '2025-12-06'
        },
        {
            slug: 'minesweeper-tips',
            title: 'マインスイーパーのコツ：数字のパターンを覚えよう',
            excerpt: '運ゲーだと思っていませんか？「1-1」や「1-2-1」などの定石を覚えるだけで、クリア率は劇的に上がります。',
            date: '2025-12-05'
        },
        {
            slug: 'gomoku-rules',
            title: '五目並べ（連珠）の基本ルールと戦術',
            excerpt: 'シンプルに見えて奥深い五目並べ。禁じ手や必勝法について解説します。',
            date: '2025-12-04'
        },
        {
            slug: 'reversi-strategy-beginners',
            title: 'リバーシ初心者攻略：角の重要性と序盤の定石',
            excerpt: '角を取れば勝てる？実はそう単純ではないリバーシの戦略を初心者向けに解説。',
            date: '2025-12-04'
        },
        {
            slug: 'checkers-history',
            title: 'チェッカーの歴史と世界での人気',
            excerpt: '古代エジプトから現代まで愛され続けるチェッカー。その歴史と文化的背景を探ります。',
            date: '2025-12-03'
        },
        {
            slug: 'mancala-rules-explained',
            title: 'マンカラのルール詳細解説',
            excerpt: 'カラハ式マンカラのルールを図解で分かりやすく説明します。',
            date: '2025-12-03'
        },
        {
            slug: 'board-game-benefits',
            title: 'ボードゲームが子どもの発達に与える良い影響',
            excerpt: '集中力、社会性、論理的思考…ボードゲームで育まれる能力について。',
            date: '2025-12-02'
        },
        {
            slug: 'divine-duel-strategies',
            title: 'カードゲーム戦略ガイド：デッキ構築の基本',
            excerpt: 'トレーディングカードゲームで勝つためのデッキ構築と戦術の基礎。',
            date: '2025-12-02'
        }
    ];


    return (
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem', fontFamily: 'sans-serif' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '3rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem', color: '#2d3748' }}>ボードゲームコラム</h1>

            <div style={{ display: 'grid', gap: '2rem' }}>
                {articles.map(article => (
                    <article key={article.slug} style={{
                        padding: '2rem',
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '16px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                    }}>
                        <Link href={`/blog/${article.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#2d3748' }}>{article.title}</h2>
                            <p style={{ color: '#718096', fontSize: '0.9rem', marginBottom: '1rem' }}>{article.date}</p>
                            <p style={{ lineHeight: '1.6', color: '#4a5568', marginBottom: '1.5rem' }}>{article.excerpt}</p>
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                color: '#3182ce',
                                fontWeight: 'bold',
                                fontSize: '0.95rem'
                            }}>
                                続きを読む &rarr;
                            </span>
                        </Link>
                    </article>
                ))}
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
