export interface ChatKnowledge {
    keywords: string[];
    question: string;
    answer: string;
    link?: { text: string; url: string };
    priority?: number; // Higher priority matches first
}

export const CHAT_KNOWLEDGE: ChatKnowledge[] = [
    // ==========================================
    // PRIVACY & CONTACT (High Priority)
    // ==========================================
    {
        keywords: ['住所', '電話', '本名', '名前', 'address', 'phone', 'name', 'real name', '住み', '何歳', '彼氏', '彼女'],
        question: '個人的な質問について',
        answer: '申し訳ありませんが、開発者の個人的な情報（住所、氏名、連絡先など）についてはお答えできません。',
        priority: 10
    },
    {
        keywords: ['問い合わせ', '連絡', 'バグ', '不具合', '要望', 'contact', 'bug', 'request', 'feedback', 'メール'],
        question: '問い合わせ・連絡方法は？',
        answer: 'お問い合わせ、バグ報告、機能要望は、開発者のX（Twitter）アカウントへのDM、またはサイト内の問い合わせフォーム（準備中）からお願いします。',
        link: { text: '開発者のX (@example)', url: 'https://twitter.com' } // Placeholder
    },
    {
        keywords: ['開発者', '誰', 'who', 'developer', '作者'],
        question: '開発者は誰ですか？',
        answer: 'このサイトは個人の開発者が運営しています。Next.jsやFirebaseなどの技術を使って、日々アップデートを行っています。',
    },

    // ==========================================
    // SYSTEM & META
    // ==========================================
    {
        keywords: ['技術', 'スタック', 'tech', 'stack', 'next', 'firebase', '言語', '仕組み'],
        question: 'このサイトの技術スタックは？',
        answer: 'Frontend: Next.js 15 (App Router)\nBackend: Node.js (Colyseus for Multiplayer), Cloudflare Pages (Hosting)\nDatabase: Firebase (Firestore, Auth, Realtime DB)',
    },
    {
        keywords: ['ログイン', 'アカウント', '登録', 'sign in', 'login'],
        question: 'ログイン方法は？',
        answer: 'Googleアカウントを使ってワンクリックでログインできます。面倒なID・パスワード管理や会員登録手続きは不要です。画面右上のボタンからどうぞ。',
    },
    {
        keywords: ['保存', 'セーブ', 'save', 'データ'],
        question: 'セーブデータはどこに保存されますか？',
        answer: 'ログイン中はクラウド（Firebase）に自動保存されるため、PCとスマホでデータを共有できます。ゲストプレイ（未ログイン）の場合はブラウザに一時保存されますが、データが消える可能性があるためログインを推奨します。',
    },
    {
        keywords: ['最新', 'アップデート', '更新', 'new', 'update', 'release'],
        question: '最新のアップデート情報は？',
        answer: 'バージョン更新や新機能の追加情報は「リリースノート」ページで確認できます。',
        link: { text: 'リリースノートを見る', url: '/releases' }
    },
    {
        keywords: ['ランキング', '順位', 'rank'],
        question: 'ランキングについて',
        answer: 'Civilization Builder、Stock Simulator、Typingなどのスコア系ゲームにはランキングがあります。ログインしてプレイすると自動的に集計されます。',
    },

    // ==========================================
    // GAME SPECIFIC: SIMULATION & STRATEGY
    // ==========================================
    // Civilization Builder
    {
        keywords: ['civ', 'クリッカー', '文明', 'civilization', 'builder'],
        question: 'Civilization Builderとは？',
        answer: '資源を集めて文明を発展させる放置系・経営シミュレーションです。石器時代から始まり、宇宙開発を目指します。',
        link: { text: 'Play Civ Builder', url: '/clicker' }
    },
    {
        keywords: ['civ', '幸福', 'happiness', '生産'],
        question: '[Civ] 幸福度について',
        answer: '幸福度が高いと資源の生産効率が上がります。低いと暴動が起きる可能性があります。贅沢資源や政策で維持しましょう。'
    },
    // Stock Simulator
    {
        keywords: ['株', 'stock', '投資', 'トレード', 'fx'],
        question: 'Stock Simulatorとは？',
        answer: '架空の100万円を元手に、実際の株価チャート（遅延あり）を使ってトレードの練習ができるシミュレーターです。リスクゼロで投資を学べます。',
        link: { text: 'Play Stock Sim', url: '/stock' }
    },
    // Divine Duel (Card Game)
    {
        keywords: ['divine', 'duel', 'カード', 'tcg', 'duel'],
        question: 'Divine Duel (カードゲーム) とは？',
        answer: '3人の守護神からアバターを選び、デッキを組んで戦う1vs1の対戦カードゲームです。ハースストーンライクなマナシステムを採用しています。',
        link: { text: 'Play Divine Duel', url: '/card-game/lobby' }
    },
    {
        keywords: ['duel', 'マナ', 'mana', 'コスト'],
        question: '[Duel] マナの仕組み',
        answer: '毎ターン最大マナが1つ増え、全回復します（最大10）。カードの使用にはマナが必要です。マナカーブを意識したデッキ構築が重要です。'
    },

    // ==========================================
    // GAME SPECIFIC: BOARD GAMES
    // ==========================================
    // Fantasy Shogi
    {
        keywords: ['ファンタジー', 'fantasy', 'simple', 'shogi', 'こども', '魔王'],
        question: 'ファンタジー将棋とは？',
        answer: '3x4マスの盤面で遊ぶミニ将棋です。魔王(王)、戦士(飛)、魔法使い(角)、スライム(歩)などを操り、相手の魔王を倒すか、敵陣に侵入すれば勝ちです。',
        link: { text: 'Play Fantasy Shogi', url: '/simple-shogi' }
    },
    // Shogi
    {
        keywords: ['将棋', 'shogi', '本将棋'],
        question: '将棋について',
        answer: '本格的な本将棋も遊べます。AI対戦とオンライン対人戦に対応。感想戦機能はありませんが、棋譜は履歴に残ります。',
        link: { text: 'Play Shogi', url: '/shogi' }
    },
    // Chess
    {
        keywords: ['チェス', 'chess', '西洋'],
        question: 'チェスについて',
        answer: '世界標準ルールのチェスです。キャスリング、アンパッサン、プロモーションに対応しています。',
        link: { text: 'Play Chess', url: '/chess' }
    },
    // Mahjong
    {
        keywords: ['麻雀', 'mahjong', 'サンマ', '4人'],
        question: '麻雀について',
        answer: 'ブラウザで遊べる3D麻雀です。3人打ち（サンマ）と4人打ちに対応。友人とのルーム対戦に特化しています。',
        link: { text: 'Play Mahjong', url: '/mahjong' }
    },
    // Reversi
    {
        keywords: ['リバーシ', 'オセロ', 'reversi'],
        question: 'リバーシについて',
        answer: '「角をとる」のが必勝法の定番ボードゲーム。AIが意外と強いので挑戦してみてください。',
        link: { text: 'Play Reversi', url: '/reversi' }
    },
    // Gomoku
    {
        keywords: ['五目', 'gomoku', '連珠'],
        question: '五目並べについて',
        answer: '5つ並べたら勝ち。禁じ手なしのシンプルルールです。',
        link: { text: 'Play Gomoku', url: '/gomoku' }
    },
    // Mancala
    {
        keywords: ['マンカラ', 'mancala'],
        question: 'マンカラについて',
        answer: '種まきゲーム。最後の石がゴールに入ると「もう一回」。空のポケットに入ると「横取り」。この2つのルールを使いこなすのが鍵です。',
        link: { text: 'Play Mancala', url: '/mancala' }
    },
    // Backgammon
    {
        keywords: ['バックギャモン', 'backgammon'],
        question: 'バックギャモンについて',
        answer: 'サイコロを使うすごろく系ゲーム。相手の駒をヒットして戻したり、バリケードを作ったりする戦略性があります。',
        link: { text: 'Play Backgammon', url: '/backgammon' }
    },
    // Checkers
    {
        keywords: ['チェッカー', 'checkers', 'draughts'],
        question: 'チェッカーについて',
        answer: '斜めに動いて相手を飛び越すゲーム。「取れる時は取らなければならない」強制ルールがあります。',
        link: { text: 'Play Checkers', url: '/checkers' }
    },
    // Connect 4
    {
        keywords: ['connect', 'four', 'コネクト', '四目'],
        question: 'Connect 4について',
        answer: '重力付きの四目並べ。縦・横・斜めに4つ揃えたら勝ちです。',
        link: { text: 'Play Connect 4', url: '/connect4' }
    },
    // Honeycomb
    {
        keywords: ['蜂の陣', 'honeycomb', 'ハニカム', '六角'],
        question: '蜂の陣 (Honeycomb) とは？',
        answer: '六角形のマスでの変則並べゲーム。4つ並べたら勝ちですが、3つ並べてしまうと「負け」になる心理戦ゲームです。',
        link: { text: 'Play Honeycomb', url: '/honeycomb' }
    },

    // ==========================================
    // GAME SPECIFIC: PUZZLE & PARTY
    // ==========================================
    // Drawing
    {
        keywords: ['お絵かき', 'drawing', 'quiz', 'gartic'],
        question: 'お絵かきクイズについて',
        answer: '絵を描いて当て合うパーティゲームです。PCならマウス、スマホならタッチで描けます。大人数推奨です。',
        link: { text: 'Play Drawing Quiz', url: '/drawing' }
    },
    // Minesweeper
    {
        keywords: ['マインスイーパー', 'mine', 'sweeper', '爆弾'],
        question: 'マインスイーパーについて',
        answer: '地雷処理パズル。右クリック（長押し）で旗を立てられます。数字の同時押し機能でサクサク進めます。',
        link: { text: 'Play Minesweeper', url: '/minesweeper' }
    },
    // Yacht
    {
        keywords: ['ヨット', 'yacht', 'ポーカー', 'ダイス'],
        question: 'Yacht (ヨット) について',
        answer: 'ダイス版ポーカー。5つのサイコロを振って役を作ります。ボーナス（63点以上で+35点）を狙うのが定石です。',
        link: { text: 'Play Yacht', url: '/yacht' }
    },
    // Pollyomino
    {
        keywords: ['block', 'territory', 'polyomino', 'パズル', '陣取り'],
        question: 'Block Territoryについて',
        answer: 'テトリスのようなブロックを盤面に敷き詰めていく陣取りゲーム。置けなくなったら負け（パス）です。',
        link: { text: 'Play Block Territory', url: '/polyomino' }
    },
    // Hit & Blow
    {
        keywords: ['hit', 'blow', 'numer0', '推理'],
        question: 'Hit & Blowについて',
        answer: '数字当て推理ゲーム。Hitは場所も数字も正解、Blowは数字だけ正解。論理的思考力が試されます。',
        link: { text: 'Play Hit & Blow', url: '/hit-and-blow' }
    },
    // Dots & Boxes
    {
        keywords: ['dots', 'boxes', '線', '四角'],
        question: 'Dots & Boxesについて',
        answer: '線を引いて四角（ボックス）を完成させる陣取りゲーム。四角を作ると連続で手番が回ってくるので、終盤の大逆転が熱いです。',
        link: { text: 'Play Dots & Boxes', url: '/dots-and-boxes' }
    },
    // Piano
    {
        keywords: ['ピアノ', 'piano', 'music', '音楽'],
        question: 'Virtual Pianoについて',
        answer: '高機能なWebピアノです。MIDIキーボード対応。音色変更（シンセ、ドラムなど）やレコーディング機能も搭載（予定）。',
        link: { text: 'Play Piano', url: '/piano' }
    },

    // ==========================================
    // INTERACTION / EASTER EGGS / FALLBACK
    // ==========================================
    {
        keywords: ['こんにちは', 'hello', 'hi', '挨拶'],
        question: '挨拶',
        answer: 'こんにちは！今日はどのゲームで遊びますか？',
    },
    {
        keywords: ['ありがとう', 'thank', '感謝'],
        question: '感謝',
        answer: 'どういたしまして！楽しんでいただければ嬉しいです。',
    },
    {
        keywords: ['疲れた', 'tired'],
        question: '疲れた',
        answer: 'お疲れ様です。たまには「Civilization Builder」でまったり放置したり、「ピアノ」でリラックスするのはいかがですか？',
    },
];

export function findAnswer(query: string): ChatKnowledge | null {
    const normalize = (s: string) => s.toLowerCase().replace(/[\s\u3000]+/g, '');
    const nQuery = normalize(query);

    let bestMatch: ChatKnowledge | null = null;
    let maxScore = 0;
    let maxPriority = -1;

    for (const item of CHAT_KNOWLEDGE) {
        let score = 0;
        let exactMatch = false;

        const currentPriority = item.priority || 0;

        for (const kw of item.keywords) {
            const nKw = normalize(kw);
            if (nQuery.includes(nKw)) {
                score += nKw.length;
                if (nQuery === nKw) exactMatch = true;
            }
        }

        if (exactMatch) score *= 2;

        // Logic: 
        // 1. If priority is higher than current max, take it (if score > 0)
        // 2. If priority is equal, check score
        if (score > 0) {
            if (currentPriority > maxPriority) {
                maxPriority = currentPriority;
                maxScore = score;
                bestMatch = item;
            } else if (currentPriority === maxPriority) {
                if (score > maxScore) {
                    maxScore = score;
                    bestMatch = item;
                }
            }
        }
    }

    if (maxScore > 0) return bestMatch;
    return null;
}
