export interface ChatKnowledge {
    keywords: string[];
    question: string;
    answer: string;
    link?: { text: string; url: string };
}

export const CHAT_KNOWLEDGE: ChatKnowledge[] = [
    // --- System / General ---
    {
        keywords: ['ログイン', 'アカウント', '登録', 'サインイン', 'login'],
        question: 'ログイン方法は？',
        answer: '画面右上の「ログイン」ボタン、またはGoogleログインボタンから、お持ちのGoogleアカウントを使ってログインできます。会員登録の手続きは不要です。'
    },
    {
        keywords: ['無料', '料金', '課金', 'money', 'free'],
        question: '料金はかかりますか？',
        answer: '当サイトのゲームはすべて無料で遊べます。課金要素はありません。'
    },
    {
        keywords: ['フレンド', '友達', '申請', '追加', 'friend'],
        question: 'フレンド機能について',
        answer: 'プロフィールページから、他のユーザーに「フレンド申請」を送ることができます。相手が承認するとフレンドになり、オンライン対局のルーム招待などがスムーズになります。ID検索で友達を追加することも可能です。'
    },
    {
        keywords: ['プロフィール', '名前', 'アイコン', '変更', 'profile'],
        question: 'プロフィールの変更方法は？',
        answer: 'ログイン後、右上のアイコンまたはメニューから「プロフィール」へ移動し、「編集」ボタンを押すことで、表示名と自己紹介文を変更できます。アイコンはGoogleアカウントのものが自動的に使用されます。'
    },
    {
        keywords: ['アプリ', 'インストール', 'スマホ', 'iphone', 'android'],
        question: 'アプリ版はありますか？',
        answer: '現在アプリ版はありませんが、PC・スマホ・タブレットのブラウザからそのまま遊べます。インストール不要です。PWA対応も検討中です。'
    },
    {
        keywords: ['重い', '遅い', 'バグ', '動かない', 'bug', 'error'],
        question: '動作が重い・不具合がある場合',
        answer: '申し訳ありません。ブラウザのキャッシュクリアや再読み込みをお試しください。それでも直らない場合は、開発者までご報告いただけると幸いです。'
    },
    {
        keywords: ['セーブ', '保存', 'データ', 'save'],
        question: 'セーブデータについて',
        answer: '多くのゲーム（Civilization Builder, Stock Simulator, Divine Duelなど）は、ログインしている場合クラウドに自動保存されます。ゲストの状態ではブラウザに保存される場合がありますが、データ消失を防ぐためログインを推奨します。'
    },
    {
        keywords: ['ルーム', '招待', 'room', '合言葉'],
        question: '友達と対戦するには？',
        answer: '各ゲームのメニューにある「ルーム対戦」または「ルーム作成」を選んでください。そこで発行されるルームIDを友達に教え、友達がそのIDを入力して「参加」ボタンを押すことで対戦できます。'
    },
    {
        keywords: ['ランキング', 'rank', 'leaderboard'],
        question: 'ランキングに参加するには？',
        answer: 'ログインしてゲームをプレイすると、スコアや資産が自動的にランキングに登録されます（対応ゲームのみ）。'
    },

    // --- Mahjong (麻雀) ---
    {
        keywords: ['麻雀', 'マージャン', 'mahjong', '牌', 'ルール'],
        question: '麻雀のルールは？',
        answer: '3人麻雀と4人麻雀に対応しています。喰いタンあり、後付けありの一般的なアリアリルールです。役一覧はゲーム内の「？」ボタンから確認できます。',
        link: { text: '麻雀をプレイ', url: '/mahjong' }
    },
    {
        keywords: ['麻雀', '人数', '3人', '4人', 'サンマ'],
        question: '何人で遊べますか？',
        answer: '3人打ち（サンマ）と4人打ちに対応しています。ルーム作成時に人数を選択できます。人数が足りない場合はCPUが自動的に追加されます。',
        link: { text: '麻雀ロビーへ', url: '/mahjong' }
    },
    {
        keywords: ['麻雀', 'cpu', 'ai', 'コンピュータ'],
        question: 'CPUと対戦できますか？',
        answer: 'はい、ルーム作成時にCPUを含めることができます。また、ソロプレイモード（AI対戦）も用意されています。',
    },

    // --- Shogi (将棋) ---
    {
        keywords: ['将棋', 'ルール', 'shogi'],
        question: '将棋について',
        answer: '日本の伝統的なボードゲームです。AI対戦とオンライン対人戦に対応しています。「待った」機能はありません。',
        link: { text: '将棋をプレイ', url: '/shogi' }
    },
    {
        keywords: ['将棋', 'ai', '強さ', 'レベル'],
        question: '将棋AIの強さは？',
        answer: 'AIのレベルは調整可能です。初心者向けのレベルから、少し歯ごたえのあるレベルまで用意しています。'
    },
    {
        keywords: ['将棋', '先手', '後手', '振り駒'],
        question: '先手後手はどう決まりますか？',
        answer: 'ランダムに決定されます。AI戦の場合は、プレイヤーが先手か後手かを選択できる場合があります。'
    },

    // --- Simple Shogi (ファンタジー将棋) ---
    {
        keywords: ['ファンタジー将棋', 'simple', 'shogi', 'どうぶつ', '動物'],
        question: 'ファンタジー将棋とは？',
        answer: '3×4マスの小さな盤面で行うミニ将棋です。「ライオン（王）」「キリン（飛車もどき）」「ゾウ（角もどき）」「ヒヨコ（歩）」の4種類の駒を使います。',
        link: { text: 'ファンタジー将棋', url: '/simple-shogi' }
    },
    {
        keywords: ['ファンタジー将棋', 'ライオン', 'キャッチ', 'トライ'],
        question: '勝利条件は（キャッチとトライ）？',
        answer: '相手のライオンを取る「キャッチ」か、自分のライオンが相手陣地（一番奥の列）に入って一ターン耐える「トライ」で勝利となります。'
    },

    // --- Civilization Builder (Clicker) ---
    {
        keywords: ['civ', '文明', 'clicker', 'クリッカー', 'builder', 'シミュレーション'],
        question: 'Civilization Builderとは？',
        answer: '資源を集めて文明を発展させるクリッカーゲームです。食料や木材を集め、建物を建て、技術を研究して時代を進めましょう。放置しても資源は溜まります。',
        link: { text: 'Civilization Builder', url: '/clicker' }
    },
    {
        keywords: ['civ', '幸福度', 'happiness'],
        question: '幸福度（Happiness）とは？',
        answer: '国民の幸福度を表します。幸福度が高いと生産効率が上がり、低いと下がります。贅沢品（金、文化など）や特定の政策によって上げることができます。'
    },
    {
        keywords: ['civ', '技術', 'tech', '研究'],
        question: '技術ツリーについて',
        answer: '「知識」ポイントを使って新しい技術を研究できます。技術をアンロックすると、新しい建物や職業、資源が解放されます。'
    },
    {
        keywords: ['civ', 'リセット', '転生'],
        question: 'リセット（強くてニューゲーム）はありますか？',
        answer: '設定タブからゲームをリセットできます。現在は単純なリセットですが、将来的にプレステージ機能（強くてニューゲーム）の実装も検討されています。'
    },

    // --- Stock Simulator (株) ---
    {
        keywords: ['株', 'stock', '投資', 'トレード', 'シミュレーター'],
        question: 'Stock Simulatorについて',
        answer: '架空の資金（初期100万円）でリアルな株価連動の投資体験ができるゲームです。実際の市場データ（遅延あり）を使用しています。',
        link: { text: '株シミュをプレイ', url: '/stock' }
    },
    {
        keywords: ['株', 'ランキング', 'leaderboard', '順位'],
        question: 'ランキング機能について',
        answer: '総資産額に基づいたランキングが表示されます。ログインしていると、自分の順位がリーダーボードに登録されます。'
    },
    {
        keywords: ['株', '円安', 'ドル', '為替'],
        question: '為替の影響はありますか？',
        answer: 'はい、米ドル建ての資産はUSD/JPYの為替レートの影響を受けます。円安になると円換算の資産額は増えます。'
    },

    // --- Divine Duel (Card Game) ---
    {
        keywords: ['Divine', 'Duel', 'カード', 'バトル', 'card'],
        question: 'Divine Duelとは？',
        answer: '3種類の守護神（アバター）から一人を選び、デッキを組んで戦う1対1の戦略カードゲームです。マナを消費してユニットやスペルを使い、相手のHPを0にすると勝利です。',
        link: { text: 'Divine Duel', url: '/card-game/lobby' }
    },
    {
        keywords: ['card', 'マナ', 'mana', 'コスト'],
        question: 'マナシステムについて',
        answer: 'ターンごとに最大マナが1増え、全回復します（最大10）。カードにはコストがあり、その分のマナを消費してプレイします。'
    },
    {
        keywords: ['card', 'デッキ', 'deck', '組む'],
        question: 'デッキの組み方は？',
        answer: '「デッキ選択」から「新規作成」を選ぶか、スターターデッキを使用できます。自分の戦略に合わせたオリジナルデッキを作ってランクマッチに挑みましょう。'
    },
    {
        keywords: ['card', '守護神', 'アバター', 'スキル', '必殺技'],
        question: '守護神（アバター）の特徴',
        answer: '各アバターには独自の「パッシブスキル」と「アルティメットスキル（必殺技）」があります。必殺技はMPを消費して発動でき、戦況を大きく変える力を持っています。'
    },

    // --- Virtual Piano ---
    {
        keywords: ['ピアノ', '楽器', 'piano', '演奏', 'midi'],
        question: 'Virtual Pianoについて',
        answer: 'ブラウザで演奏できる高機能ピアノです。詳細設定から音色（ピアノ、シンセ、和楽器など）を変更したり、リバーブエフェクトをかけたりできます。MIDIキーボードにも対応しています。',
        link: { text: 'ピアノを弾く', url: '/piano' }
    },

    // --- Drawing Quiz (お絵かき) ---
    {
        keywords: ['お絵かき', 'drawing', 'クイズ', 'draw', 'イラスト'],
        question: 'お絵かきクイズについて',
        answer: '出題者が描いた絵を他プレイヤーが当てるパーティゲームです。正解するとポイントが入り、最終的なスコアを競います。ルーム作成で友達と遊ぶのがおすすめです。',
        link: { text: 'お絵かきクイズ', url: '/drawing' }
    },

    // --- Reversi (オセロ) ---
    {
        keywords: ['リバーシ', 'オセロ', 'reversi'],
        question: 'リバーシについて',
        answer: '相手の石を挟んでひっくり返す定番ゲームです。石の数が最終的に多い方が勝ちとなります。',
        link: { text: 'リバーシをプレイ', url: '/reversi' }
    },
    {
        keywords: ['リバーシ', 'コツ', '勝つ', '角'],
        question: 'リバーシで勝つコツは？',
        answer: '「角（四隅）」を取ることが重要です。角の石は絶対に裏返されません。また、相手に角を取らせないように、角の隣（XやCと呼ばれる位置）にはむやみに置かないのが定石です。'
    },

    // --- Chess (チェス) ---
    {
        keywords: ['チェス', 'chess', 'チェックメイト'],
        question: 'チェスについて',
        answer: '世界で最も人気のあるボードゲームの一つです。相手のキングを「チェックメイト（詰み）」の状態にすれば勝ちです。',
        link: { text: 'チェスをプレイ', url: '/chess' }
    },
    {
        keywords: ['チェス', 'キャスリング', 'アンパッサン', '特殊'],
        question: '特殊ルール（キャスリング等）はありますか？',
        answer: 'はい、キャスリング（キングとルークの同時移動）、アンパッサン（ポーンの特殊な取り方）、プロモーション（ポーンの昇格）に対応しています。'
    },

    // --- Dots & Boxes ---
    {
        keywords: ['ドット', 'ボックス', 'dots', 'boxes', '陣取り'],
        question: 'Dots & Boxesについて',
        answer: '点と点を線で結び、四角形（ボックス）を完成させて自分の陣地にするゲームです。シンプルながら深い読み合いが必要です。',
        link: { text: 'Dots & Boxes', url: '/dots-and-boxes' }
    },
    {
        keywords: ['ドット', '連続', 'ターン'],
        question: '連続手番の条件は？',
        answer: '四角形（ボックス）を1つ完成させると、陣地を獲得し、もう一度線を引くことができます。これを利用して一気に陣地を増やすコンボが可能です。'
    },

    // --- Minesweeper (マインスイーパー) ---
    {
        keywords: ['マインスイーパー', 'mine', 'sweeper', '爆弾'],
        question: 'マインスイーパーについて',
        answer: '地雷を避けて全ての安全なマスを開けるパズルゲームです。数字をヒントに地雷の位置を特定します。旗（フラグ）モードで地雷の場所に目印をつけられます。',
        link: { text: 'マインスイーパー', url: '/minesweeper' }
    },
    {
        keywords: ['マインスイーパー', '旗', 'フラグ', '右クリック'],
        question: '操作方法は？',
        answer: '左クリックでマスを開け、右クリック（または旗モードボタン）で地雷だと思う場所に旗を立てます。数字マスを両クリック（またはコードクリック）すると、周りの未開封マスを一気に開ける便利機能もあります。'
    },

    // --- Mancala (マンカラ) ---
    {
        keywords: ['マンカラ', 'mancala', 'カラハ'],
        question: 'マンカラについて',
        answer: '世界最古の知育ゲームの一つです。ポケットの石を反時計回りに動かし、自分のゴール（ストア）に多くの石を集めた方が勝ちです。',
        link: { text: 'マンカラをプレイ', url: '/mancala' }
    },
    {
        keywords: ['マンカラ', 'ルール', '横取り', 'ぴったり'],
        question: 'マンカラのルール（ぴったり/横取り）',
        answer: '最後の石が自分のゴールに入ると「もう一回」遊べます。最後の石が自分の空のポケットに入ると、向かい側の相手の石を「横取り」できます。この2つが勝利の鍵です。'
    },

    // --- Yacht (ヨット) ---
    {
        keywords: ['ヨット', 'yacht', 'ダイス', 'ポーカー'],
        question: 'Yachtについて',
        answer: '5つのダイスを振って役を作るゲームです。1ターンに3回まで振り直しができ、出た目をどの役（フルハウス、ストレート等）に割り当てるか選びます。合計得点を競います。',
        link: { text: 'Yachtをプレイ', url: '/yacht' }
    },
    {
        keywords: ['ヨット', 'ボーナス', 'bonus'],
        question: 'ボーナス点はありますか？',
        answer: 'はい、1～6の目の合計点が63点以上になると、ボーナスとして35点が加算されます。これを達成するのが勝利への近道です。'
    },

    // --- Honeycomb (蜂の陣) ---
    {
        keywords: ['蜂の陣', 'honeycomb', 'ハニカム', '六角形'],
        question: '「蜂の陣」とは？',
        answer: '六角形の盤面で行う、3目並べ/4目並べの変種ゲームです。自分の色を並べて勝利を目指します。',
        link: { text: '蜂の陣をプレイ', url: '/honeycomb' }
    },
    {
        keywords: ['蜂の陣', '勝ち', '負け', '3つ', '4つ'],
        question: '勝利条件と敗北条件',
        answer: '自分の色を「一直線に4つ」並べると勝ちです。逆に、自分の色を「3つ」並べてしまうと負け（反則負け）になります。3つ並ばないようにしながら4つを目指すのがコツです。'
    },

    // --- Polyomino (Block Territory) ---
    {
        keywords: ['polyomino', 'block', 'territory', 'パズル', '陣取り'],
        question: 'Block Territoryについて',
        answer: '様々な形のブロック（ポリオミノ）を盤面に配置していく陣取りゲームです。より多くのマスを自分の色で埋めたプレイヤーが勝利します。',
        link: { text: 'Block Territory', url: '/polyomino' }
    },
    {
        keywords: ['polyomino', '置けない', 'パス'],
        question: '置けなくなったらどうなりますか？',
        answer: '置ける場所がない場合はパスとなります。両者とも置けなくなるか、すべてのピースを使い切るとゲーム終了です。'
    },

    // --- Trump / Daifugo (大富豪) ---
    {
        keywords: ['大富豪', '大貧民', 'trump', 'トランプ', 'daifugo'],
        question: '大富豪について',
        answer: '誰よりも早く手札を出し切ることを目指すカードゲームです。革命、8切り、都落ち、縛りなど、多彩なローカルルールを採用しています。',
        link: { text: '大富豪をプレイ', url: '/trump' }
    },
    {
        keywords: ['大富豪', '革命', 'ルール'],
        question: '革命とは？',
        answer: '同じ数字のカードを4枚以上出すと「革命」が起き、カードの強さが逆転します（3が最強、2が最弱になります）。'
    },

    // --- Backgammon (バックギャモン) ---
    {
        keywords: ['バックギャモン', 'backgammon', '西洋すごろく'],
        question: 'バックギャモンについて',
        answer: '2つのサイコロを振って駒を進め、全ての駒を先に盤外へゴールさせた方が勝つボードゲームです。相手の駒をヒットしてスタートに戻すなどの駆け引きがあります。',
        link: { text: 'バックギャモン', url: '/backgammon' }
    },

    // --- Checkers (チェッカー) ---
    {
        keywords: ['チェッカー', 'ドラフツ', 'checkers', 'draughts'],
        question: 'チェッカーについて',
        answer: '斜めに動く駒を使い、相手の駒を飛び越えて取るゲームです。取れる駒がある場合は「必ず」取らなければならない（強制ジャンプ）ルールが特徴です。',
        link: { text: 'チェッカーをプレイ', url: '/checkers' }
    },
    {
        keywords: ['チェッカー', 'キング', '成る'],
        question: 'キングとは？',
        answer: '相手側の最奥の列に到達した駒は「キング」になり、斜め後ろにも移動できるようになります。'
    },

    // --- Connect 4 (四目並べ) ---
    {
        keywords: ['connect', 'four', 'コネクトフォー', '四目'],
        question: 'Connect Fourについて',
        answer: '上から駒を落とし、縦・横・斜めのいずれかに自分の色を4つ並べるゲームです。重力があるため、下に駒がない場所には置けません。',
        link: { text: 'Connect Four', url: '/connect4' }
    },

    // --- Gomoku (五目並べ) ---
    {
        keywords: ['五目並べ', 'gomoku', '連珠'],
        question: '五目並べについて',
        answer: '黒と白の石を交互に打ち、先に5つ並べた方が勝ちとなるシンプルなゲームです。当サイトでは禁じ手のないシンプルなルールを採用しています。',
        link: { text: '五目並べをプレイ', url: '/gomoku' }
    },

    // --- Hit & Blow ---
    {
        keywords: ['hit', 'blow', 'ヒット', 'ブロー', '推理'],
        question: 'Hit & Blowについて',
        answer: '隠された色の組み合わせを当てる推理ゲームです。色が合っていて場所も合っていれば「HIT」、色は合っているが場所が違う場合は「BLOW」となります。',
        link: { text: 'Hit & Blow', url: '/hit-and-blow' }
    }
];

export function findAnswer(query: string): ChatKnowledge | null {
    const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, '');
    const nQuery = normalize(query);

    let bestMatch: ChatKnowledge | null = null;
    let maxScore = 0;

    for (const item of CHAT_KNOWLEDGE) {
        let score = 0;
        let exactMatch = false;

        for (const kw of item.keywords) {
            const nKw = normalize(kw);
            if (nQuery.includes(nKw)) {
                score += nKw.length; // Weigh longer keywords higher
                if (nQuery === nKw) exactMatch = true;
            }
        }

        // Boost score for exact question matches or very strong keyword overlap
        if (exactMatch) score *= 2;

        if (score > maxScore) {
            maxScore = score;
            bestMatch = item;
        }
    }

    if (maxScore > 0) return bestMatch;
    return null;
}
