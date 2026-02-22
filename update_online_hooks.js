const fs = require('fs');
const path = require('path');

const pDir = 'src/app';
const dirs = fs.readdirSync(pDir).filter(f => fs.statSync(path.join(pDir, f)).isDirectory());

let count = 0;

dirs.forEach(g => {
    const pagePath = path.join(pDir, g, 'page.tsx');
    if (!fs.existsSync(pagePath)) return;
    if (g === 'mahjong') return; // 麻雀は適用済み

    let content = fs.readFileSync(pagePath, 'utf8');
    let changed = false;

    // hooksのインポート追加
    if (!content.includes('useOnlineStatus')) {
        const importStatement = "import { useOnlineStatus } from '@/hooks/useOnlineStatus';\n";
        // 'use client'; の後や先頭に近い import 群に挿入
        if (content.match(/import.*['"]react['"];?/)) {
            content = content.replace(/(import.*['"]react['"];?)/, "$1\n" + importStatement);
            changed = true;
        } else {
            content = importStatement + content;
            changed = true;
        }
    }

    // 各ゲーム（将棋、オセロ等）のトップ画面における modeBtn クリック処理を探す
    if ((content.includes("setView('random_select')") || content.includes('setView("random_select")') ||
        content.includes("setView('room_select')") || content.includes('setView("room_select")')) &&
        !content.includes('const isOnline = useOnlineStatus()')) {

        // コンポーネント定義直後の `const [view, setView]` 前後に `useOnlineStatus()` を仕込む
        content = content.replace(/(const \[view, setView\] = useState)/, "const isOnline = useOnlineStatus();\n    $1");
        changed = true;

        // Alert処理をonClick内にインライン挿入する
        const logic = "{ if(!isOnline) { alert('オフライン時はオンライン対戦機能を利用できません。インターネット接続を確認してください。'); return; } setView";

        content = content.replace(/onClick=\{\(\)\s*=>\s*setView\(['"]random_select['"]\)\}/g, `onClick={() => ` + logic + `('random_select'); }}`);
        content = content.replace(/onClick=\{\(\)\s*=>\s*setView\(['"]room_select['"]\)\}/g, `onClick={() => ` + logic + `('room_select'); }}`);
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(pagePath, content, 'utf8');
        console.log('Updated: ' + g);
        count++;
    }
});

console.log('Total updated games:', count);
