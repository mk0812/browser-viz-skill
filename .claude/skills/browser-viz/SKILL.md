---
name: browser-viz
description: Visualize agent-browser operations with GIF recording and screenshot annotations (red frame highlights, zoom). Use when the user wants to capture browser test logs visually, highlight UI elements in screenshots, or record browser sessions as GIF.
---

# browser-viz

agent-browserの操作を可視化するツール。スクリーンショットへのアノテーション（赤枠ハイライト、ズーム）とGIF録画機能を提供します。

## Prerequisites

- [agent-browser](https://github.com/vercel-labs/agent-browser) がインストールされていること
- ffmpegがインストールされていること（GIF生成用: `brew install ffmpeg`）
- browser-viz-skillがビルド済みであること（`npm run build`）

## Quick Start

```bash
# 1. agent-browserでページを開く
agent-browser open "http://localhost:5173" --headed

# 2. スナップショットで要素のrefを確認
agent-browser snapshot -i

# 3. スクリーンショットを撮影
agent-browser screenshot screenshot.png

# 4. 赤枠ハイライトを追加（座標指定）
browser-viz annotate screenshot.png --highlight-box 860,478,95,50 -o highlighted.png

# 5. ズームを追加
browser-viz annotate screenshot.png --zoom-box 327,318,611,55 --scale 2 -o zoomed.png
```

## Commands

### annotate - 既存画像へのアノテーション（推奨）

```bash
# 座標指定で赤枠追加 (x,y,width,height)
browser-viz annotate screenshot.png --highlight-box 860,478,95,50 -o annotated.png

# 座標指定でズーム
browser-viz annotate screenshot.png --zoom-box 327,318,611,55 --scale 2 -o zoomed.png

# ref指定で赤枠追加（agent-browserセッションが必要）
browser-viz annotate screenshot.png --highlight @e5 -o annotated.png
```

### capture - スクリーンショット + アノテーション

```bash
# 単純なスクリーンショット
browser-viz capture -o capture.png

# 赤枠ハイライト（agent-browserセッションが必要）
browser-viz capture --highlight @e5 -o highlighted.png

# ズーム（拡大）
browser-viz capture --zoom @e5 --scale 2 -o zoomed.png

# 赤枠 + ズーム同時適用
browser-viz capture --highlight @e5 --zoom @e5 -o both.png

# 自動フォーカス（AIが最適な要素を選択）
browser-viz capture --auto-focus -o auto.png
```

### record - GIF録画

```bash
# 5秒間録画（デフォルト5fps）
browser-viz record start -o recording.gif

# 10秒間、10fpsで録画
browser-viz record start -d 10000 --fps 10 -o recording.gif
```

### ユーティリティ

```bash
# 現在のページのインタラクティブ要素一覧
browser-viz refs

# バウンディングボックス取得
browser-viz box @e5 --json
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `-s, --session` | agent-browserセッション名 | default |
| `-o, --output` | 出力ファイルパス | capture.png |
| `--highlight` | ハイライトする要素のref | - |
| `--highlight-box` | ハイライト座標 (x,y,w,h) | - |
| `--zoom` | ズームする要素のref | - |
| `--zoom-box` | ズーム座標 (x,y,w,h) | - |
| `--scale` | ズーム倍率 | 2 |
| `--color` | ハイライト枠の色 | #FF0000 |
| `--border-width` | ハイライト枠の太さ | 3 |
| `--padding` | 要素周囲の余白 | 10 |
| `-d, --duration` | 録画時間（ms） | 5000 |
| `--fps` | 録画フレームレート | 5 |

## GIF録画の代替方法（ffmpeg直接使用）

agent-browserで連続スクリーンショットを撮影し、ffmpegでGIF化：

```bash
# 1. フレームをキャプチャ（スクリプトで自動化）
mkdir -p frames
agent-browser screenshot frames/frame-001.png
# ... 操作を行いながら連続撮影 ...

# 2. ffmpegでGIF生成
ffmpeg -y -framerate 3 -i frames/frame-%03d.png \
  -vf "fps=3,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" \
  -loop 0 recording.gif

# 高品質版（フルサイズ）
ffmpeg -y -framerate 3 -i frames/frame-%03d.png \
  -vf "fps=3,split[s0][s1];[s0]palettegen=max_colors=256:stats_mode=full[p];[s1][p]paletteuse=dither=sierra2_4a" \
  -loop 0 recording-hq.gif
```

## Example Workflow: TODO App Testing

```bash
# 1. TODOアプリを開く
agent-browser open "http://localhost:5173" --headed

# 2. スナップショットで要素を確認
agent-browser snapshot -i
# 出力例:
# - textbox "検索..." [ref=e1]
# - button "すべて" [ref=e2]
# - textbox "新しいタスクを追加..." [ref=e5]
# - button "追加" [ref=e7]

# 3. スクリーンショット撮影
agent-browser screenshot screenshot.png

# 4. 追加ボタン周辺を赤枠でハイライト
browser-viz annotate screenshot.png --highlight-box 860,478,95,50 -o highlighted.png

# 5. 入力フィールドをズーム表示
browser-viz annotate screenshot.png --zoom-box 327,318,611,55 --scale 1.5 -o zoomed.png

# 6. 操作しながらフレームをキャプチャしてGIF作成
mkdir -p frames
agent-browser screenshot frames/frame-001.png
agent-browser click @e5
agent-browser screenshot frames/frame-002.png
agent-browser type @e5 "テストタスク"
agent-browser screenshot frames/frame-003.png
agent-browser click @e7
agent-browser screenshot frames/frame-004.png

ffmpeg -y -framerate 2 -i frames/frame-%03d.png \
  -vf "fps=2,scale=640:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" \
  -loop 0 todo-flow.gif
```

## Programmatic API

```typescript
import {
  addHighlight,
  addHighlightToBuffer,
  zoomToArea,
  highlightAndZoom,
  saveImage,
} from "browser-viz-skill";

// ファイルから読み込んで赤枠を追加
const box = { x: 860, y: 478, width: 95, height: 50 };
const highlighted = await addHighlight("screenshot.png", box);
await saveImage(highlighted, "highlighted.png");

// ズーム（拡大）
const zoomed = await zoomToArea("screenshot.png", box, { scale: 2 });
await saveImage(zoomed, "zoomed.png");

// 赤枠 + ズームの組み合わせ
const combined = await highlightAndZoom("screenshot.png", box,
  { borderColor: "#FF0000", borderWidth: 4 },
  { scale: 1.5, padding: 30 }
);
await saveImage(combined, "highlight-zoom.png");
```

## 赤枠ハイライトの座標精度を高める方法

### 問題: ハードコードされた座標は不正確

テストスクリプトで固定の座標値（例: `{ x: 860, y: 478, width: 95, height: 50 }`）を使用すると、以下の理由でハイライト位置がずれる：

- ブラウザのウィンドウサイズの違い
- 動的に生成されるコンテンツ
- タスク数の変化による要素位置の変動

### 解決策: JavaScriptで動的に位置を取得

`agent-browser eval`を使って`getBoundingClientRect()`で要素の正確な位置を取得する。

#### 1. 基本パターン: インデックスで要素を取得

```javascript
// agent-browser evalの結果は二重にJSONエンコードされる
function parseEvalResult(result) {
  if (!result || result === 'null' || result === '"null"') return null;
  try {
    const jsonStr = JSON.parse(result);  // 外側のクォートを除去
    if (!jsonStr || jsonStr === 'null') return null;
    const obj = JSON.parse(jsonStr);     // 実際のJSONをパース
    return obj ? { x: obj.x, y: obj.y, width: obj.width, height: obj.height } : null;
  } catch {
    return null;
  }
}

// ボタンをインデックスで取得
async function getButtonBoxByIndex(index = 0) {
  const result = await agentBrowser('eval', [
    `JSON.stringify(document.querySelectorAll('button')[${index}]?.getBoundingClientRect())`
  ]);
  return parseEvalResult(result);
}

// 使用例
const addBtnBox = await getButtonBoxByIndex(3); // 4番目のボタン
```

#### 2. テキストで要素を検索

```javascript
// ボタンをテキスト内容で検索
async function getButtonBoxByText(text) {
  const result = await agentBrowser('eval', [
    `(function() {
      var buttons = document.querySelectorAll('button');
      for(var i=0; i<buttons.length; i++) {
        if(buttons[i].textContent.indexOf('${text}') !== -1) {
          var rect = buttons[i].getBoundingClientRect();
          return JSON.stringify({x: rect.x, y: rect.y, width: rect.width, height: rect.height});
        }
      }
      return "null";
    })()`
  ]);
  return parseEvalResult(result);
}

// 使用例
const saveBtnBox = await getButtonBoxByText('保存');
```

#### 3. 入力要素の取得

```javascript
async function getInputBoxByIndex(index = 0) {
  const result = await agentBrowser('eval', [
    `JSON.stringify(document.querySelectorAll('input')[${index}]?.getBoundingClientRect())`
  ]);
  return parseEvalResult(result);
}

// 使用例: 検索ボックス（最初のinput）
const searchBox = await getInputBoxByIndex(0);

// 使用例: タイトル入力欄（2番目のinput）
const titleBox = await getInputBoxByIndex(1);
```

### 重要: ホバー時のみ表示される要素

編集・削除ボタンなど、ホバー時にのみ表示される要素は、スクリーンショット前にホバーが必要：

```javascript
// Step 2: 編集ボタンを確認
let snapshot = await agentBrowser('snapshot', ['-i']);
const editBtnRef = findRef(snapshot, /button "✎" \[ref=(e\d+)\]/);

// ★重要: ホバーしてボタンを表示させる
if (editBtnRef) {
  await agentBrowser('hover', [editBtnRef]);
  await sleep(300);  // 表示アニメーション待ち
}

// その後にスクリーンショット
const editBtnBox = await getButtonBoxByIndex(4);
await screenshotWithHighlight('02-edit-button', editBtnBox, '編集ボタン');
```

### eval使用時の注意点

1. **IIFEは`function`構文を使う** - アロー関数 `(() => {})()` はシェルのクォートと相性が悪い
2. **結果は二重クォート** - `agent-browser eval`の結果は `""{...}""` 形式で返る
3. **シンプルな式を使う** - 複雑なロジックは避け、`JSON.stringify(element?.getBoundingClientRect())` のようなシンプルな式を使う
4. **日本語を含む場合は注意** - シェル経由で実行する場合、日本語テキストの検索は避けるかエスケープする

### 完全なヘルパー関数セット

```javascript
// 共通パーサー
function parseEvalResult(result) {
  if (!result || result === 'null' || result === '"null"') return null;
  try {
    const jsonStr = JSON.parse(result);
    if (!jsonStr || jsonStr === 'null') return null;
    const obj = JSON.parse(jsonStr);
    return obj ? { x: obj.x, y: obj.y, width: obj.width, height: obj.height } : null;
  } catch {
    return null;
  }
}

// インデックスベースの取得関数
async function getButtonBoxByIndex(index) {
  const result = await agentBrowser('eval', [
    `JSON.stringify(document.querySelectorAll('button')[${index}]?.getBoundingClientRect())`
  ]);
  return parseEvalResult(result);
}

async function getInputBoxByIndex(index) {
  const result = await agentBrowser('eval', [
    `JSON.stringify(document.querySelectorAll('input')[${index}]?.getBoundingClientRect())`
  ]);
  return parseEvalResult(result);
}

async function getCheckboxBoxByIndex(index) {
  const result = await agentBrowser('eval', [
    `JSON.stringify(document.querySelectorAll('input[type="checkbox"]')[${index}]?.getBoundingClientRect())`
  ]);
  return parseEvalResult(result);
}

// ハイライト付きスクリーンショット
async function screenshotWithHighlight(name, box, description) {
  const rawPath = `${FRAMES_DIR}/${name}-raw.png`;
  const highlightedPath = `${FRAMES_DIR}/${name}.png`;

  await agentBrowser('screenshot', [rawPath]);

  if (box) {
    await addHighlight(rawPath, box, highlightedPath);
  } else {
    // フォールバック座標を使用
    await addHighlight(rawPath, { x: 0, y: 0, width: 100, height: 100 }, highlightedPath);
  }

  console.log(`📸 ${description} (highlighted)`);
  return highlightedPath;
}
```

## AI Usage Examples

以下のような指示でこのツールを活用できます：

- 「TODO追加ボタンをクリックした部分を赤枠で囲んでスクリーンショットを保存して」
- 「検索ボックスにフォーカスしたスクリーンショットを撮って」
- 「この操作の流れをGIFで録画して」
- 「入力フォームの部分を拡大したスクリーンショットを撮って」
- 「ボタンの位置を赤い枠で強調表示して」
