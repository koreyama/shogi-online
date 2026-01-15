export const RELEASES = [
    {
        version: '2.4.0',
        date: '2026.01.15',
        title: 'ビリヤード (8-Ball) 正式リリース',
        categories: ['New Game', 'Game', 'Feature'],
        content: [
            {
                head: 'ビリヤード (8-Ball) リリース',
                text: 'リアルな物理演算を搭載した本格的な「8ボール」をリリースしました。Matter.jsによりボールの挙動を忠実に再現しています。'
            },
            {
                head: 'マルチプレイ対応',
                text: '世界中のプレイヤーと対戦できる「ランダムマッチ」に加え、友達と合言葉で遊べる「ルーム対戦」機能を搭載しました。'
            },
            {
                head: 'ソロ練習モード',
                text: '一人でじっくりショットの練習ができるソロモードも完備。物理挙動の確認や、角度の調整など自由にプレイできます。'
            }
        ]
    },
    {
        version: '2.3.0',
        date: '2026.01.14',
        title: 'Global Chat統合 & UI改善',
        categories: ['Update', 'System', 'Feature'],
        content: [
            {
                head: 'Global Chat & サポート統合',
                text: 'チャットボット機能をGlobal Chatに統合し、「サポート」タブとして利用可能にしました。これにより、画面上のボタンが整理され、より快適に操作できるようになりました。'
            },
            {
                head: 'フレンド表示の改善',
                text: 'オンラインフレンドリストに、プロフィールで設定した名前とアイコンが正しく表示されるようになりました。'
            },
            {
                head: 'UI改善',
                text: 'スマートフォンでのチャット表示を最適化し、ボタン配置を調整しました。'
            }
        ]
    },
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
