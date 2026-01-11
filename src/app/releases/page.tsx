'use client';

import React from 'react';
import Link from 'next/link';
import { IconBack } from '@/components/Icons';

const RELEASES = [
    {
        version: '2.2.0',
        date: '2026.01.11',
        title: '人狼ゲーム (Werewolf) リリース & 公式Discord開設',
        categories: ['New Game', 'Community', 'Feature'],
        content: [
            {
                head: '人狼ゲーム (Werewolf) リリース',
                text: 'オンラインで遊べる「人狼ゲーム」をリリースしました。配役設定、投票システム、チャット機能など、ブラウザだけで本格的な人狼が楽しめます。友達とルームを作って遊ぶことも、ランダムマッチで対戦することも可能です。'
            },
            {
                head: '公式Discordサーバー開設',
                text: 'Asobi Loungeの公式Discordサーバーを開設しました。開発情報の先行公開や、ユーザー同士の交流、フィードバックの受付を行っています。ヘッダーのアイコンから参加できます。'
            }
        ]
    },
    {
        version: '2.1.0',
        date: '2026.01.09',
        title: 'カードゲームUI改善 & Stock Simulator更新',
        categories: ['Update', 'Game', 'Feature'],
        content: [
            {
                head: 'カードゲーム (Divinduel) UI改善',
                text: 'モバイル版の操作性を大幅に向上させました。手札のスクロール修正、プレイしたカードの視認性向上（サイズ統一・最前面表示）、アクションボタンのレイアウト最適化を行いました。また、PC版のボタンデザインもモダンなスタイルに統一しました。'
            },
            {
                head: 'Stock Simulator プロフィール連携',
                text: 'ランキングやクラウド同期ステータスに表示される名前が、Googleアカウント名からサイト内のプロフィール設定名に変更されました。これにより、他のゲームと同じ名前でランキングに参加できるようになります。'
            }
        ]
    },
    {
        version: '2.0.0',
        date: '2026.01.07',
        title: 'UI全面リニューアル & ゲームリスト拡充',
        categories: ['Update', 'System', 'Game'],
        content: [
            {
                head: 'デザイン刷新',
                text: 'ランディングページおよびログイン後のゲーム一覧（ダッシュボード）のデザインを完全にリニューアル。アニメーションを取り入れ、より美しく使いやすいインターフェースになりました。'
            },
            {
                head: 'ゲーム追加・名称変更',
                text: '「蜂の陣」「バックギャモン」「簡易将棋」など、リストに表示されていなかったゲームを追加し、全23種類のゲームに簡単にアクセスできるようになりました。「どうぶつ将棋」の名称を「ファンタジー将棋」に変更しました。'
            },
            {
                head: 'システム改善',
                text: 'スマートフォンでの表示を最適化し、プロフィールや最新情報へのアクセスを改善しました。'
            }
        ]
    },
    {
        version: '1.6.0',
        date: '2026.01.02',
        title: 'システム＆プロフィール大型アップデート',
        categories: ['System', 'Feature'],
        content: [
            {
                head: 'チャットボット',
                text: 'ゲームプレイ中にチャットボットのアイコンを自動的に非表示にする機能を追加。盤面が見やすくなりました。'
            },
            {
                head: 'プロフィール機能',
                text: 'フレンド機能（申請・承認・ブロック）、詳細な対戦戦績の表示、プロフィール編集機能を追加。'
            }
        ]
    },
    {
        version: '1.5.0',
        date: '2026.01.02',
        title: 'ゲーム機能強化 (蜂の陣・ピアノ・麻雀)',
        categories: ['Game', 'Update'],
        content: [
            {
                head: '蜂の陣 (Honeycomb)',
                text: 'AI対戦モードを復旧し、思考ロジックを強化（Minimax法導入）。'
            },
            {
                head: 'Virtual Piano',
                text: 'サンプラーエンジンを刷新し、よりリアルな音質を実現。ボリュームコントロールとホワイトテーマUIを追加。'
            },
            {
                head: '麻雀 (Mahjong)',
                text: 'オンライン対戦機能を実装。効果音(SE)や役一覧表示を追加し、プレイ感を向上。'
            }
        ]
    },
    {
        version: '1.4.5',
        date: '2026.01.01',
        title: 'お絵かきクイズ (Drawing) 修正',
        categories: ['Fix', 'Game'],
        content: [
            {
                head: 'UI/UX改善',
                text: 'プレイヤー名の表示不具合を修正。ゲーム開始時の挙動を安定化。キャンバスの描画同期ズレを解消。'
            }
        ]
    },
    {
        version: '1.4.0',
        date: '2025.12.25',
        title: 'Civilization Builder 拡張',
        categories: ['Feature', 'Game'],
        content: [
            {
                head: 'ゲームバランス調整',
                text: '製油所（Refinery）の容量ロジックを修正。手動回収の実績解除判定を修正。'
            },
            {
                head: 'UI改善',
                text: '金融（Finance）画面の同期処理を改善。スキルツリーのUI表示バグを修正。'
            }
        ]
    },
    {
        version: '1.2.0',
        date: '2025.12.07',
        title: 'Block Territory (Polyomino) リリース',
        categories: ['New Game', 'Puzzle'],
        content: [
            {
                head: '新作パズルゲーム',
                text: 'テトリスのようなブロックを使って陣地を取り合う「Block Territory」をリリース。AI対戦に対応。'
            }
        ]
    },
    {
        version: '1.0.0',
        date: '2025.12.05',
        title: 'Civilization Builder リリース',
        categories: ['New Game', 'Simulation'],
        content: [
            {
                head: '新作シミュレーション',
                text: '資源管理と文明発展を楽しむクリッカー系ゲーム「Civilization Builder」をリリース。'
            }
        ]
    }
];

export default function ReleasesPage() {
    return (
        <main style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem 1rem' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: '#718096', fontWeight: 600 }}>
                        <IconBack size={18} /> トップへ戻る
                    </Link>
                </div>

                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1a202c', marginBottom: '1rem' }}>リリースノート</h1>
                <p style={{ color: '#718096', marginBottom: '3rem' }}>Asobi Lounge のアップデート履歴</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {RELEASES.map((release, i) => (
                        <div key={i} style={{ background: 'white', borderRadius: '16px', padding: '2rem', border: '1px solid #edf2f7', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#2d3748' }}>v{release.version}</span>
                                <span style={{ fontSize: '0.9rem', color: '#718096' }}>{release.date}</span>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {release.categories.map(c => (
                                        <span key={c} style={{
                                            fontSize: '0.7rem',
                                            padding: '0.15rem 0.5rem',
                                            borderRadius: '100px',
                                            background: c === 'System' ? '#ebf8ff' : c === 'Game' ? '#f0fff4' : c === 'Fix' ? '#fff5f5' : '#fefcbf',
                                            color: c === 'System' ? '#3182ce' : c === 'Game' ? '#38a169' : c === 'Fix' ? '#e53e3e' : '#d69e2e',
                                            fontWeight: 600
                                        }}>
                                            {c}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1a202c', marginBottom: '1.5rem' }}>{release.title}</h2>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                {release.content.map((item, j) => (
                                    <div key={j}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#2d3748', marginBottom: '0.25rem' }}>{item.head}</h3>
                                        <p style={{ fontSize: '0.95rem', color: '#4a5568', lineHeight: 1.6 }}>{item.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
