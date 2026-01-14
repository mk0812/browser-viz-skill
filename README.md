# browser-viz-skill

[agent-browser](https://github.com/vercel-labs/agent-browser)の操作を可視化するClaude Code Skill。GIF録画とスナップショットへのアノテーション（カラーハイライト、矢印、テキストラベル、ズーム）機能を提供します。

**[テスト結果サンプル（GIF付き）を見る →](docs/test-results.md)**

## 機能

| 機能 | 説明 |
|------|------|
| **カラーハイライト** | 指定した要素を色付き枠で強調表示（10色対応） |
| **矢印アノテーション** | 要素を指し示す矢印を描画（8方向対応） |
| **テキストラベル** | スクリーンショット上にキャプションや説明を追加 |
| **ズーム・フォーカス** | 指定した要素周辺を拡大表示 |
| **GIF録画** | ブラウザ操作の一連の流れをアニメーションGIFとして記録 |
| **自動フォーカス** | AIがsnapshotから最適な要素を自動選択 |

## インストール

```bash
# 依存パッケージのインストール
npm install

# ビルド
npm run build

# グローバルにコマンドを使えるようにする（オプション）
npm link
```

### 前提条件

- Node.js 18+
- [agent-browser](https://github.com/vercel-labs/agent-browser) がインストールされていること
- ffmpeg（GIF生成に必要: `brew install ffmpeg`）

## CLI使い方

### capture - スクリーンショット + アノテーション

```bash
# 要素をハイライト（デフォルト: 赤）
browser-viz capture --highlight @e5 -o highlighted.png

# 色を指定してハイライト
browser-viz capture --highlight @e5 --color blue -o highlighted.png

# 要素にズーム
browser-viz capture --zoom @e5 --scale 2 -o zoomed.png

# ハイライト + ズーム同時適用
browser-viz capture --highlight @e5 --zoom @e5 -o both.png

# 自動フォーカス（AIが最適な要素を選択）
browser-viz capture --auto-focus -o auto.png
```

### annotate - 既存画像へのアノテーション

```bash
# ref指定でハイライト追加
browser-viz annotate screenshot.png --highlight @e5 -o annotated.png

# 色を指定
browser-viz annotate screenshot.png --highlight @e5 --color green -o annotated.png

# 座標指定でハイライト追加 (x,y,width,height)
browser-viz annotate screenshot.png --highlight-box 860,478,95,50 -o annotated.png

# ズーム
browser-viz annotate screenshot.png --zoom @e5 --scale 2 -o zoomed.png
```

### record - GIF録画

```bash
# 5秒間録画（デフォルト）
browser-viz record start -o recording.gif

# 10秒間、10fpsで録画
browser-viz record start -d 10000 --fps 10 -o recording.gif
```

### ユーティリティ

```bash
# 要素一覧を表示
browser-viz refs

# 要素のバウンディングボックス取得
browser-viz box @e5 --json
```

## オプション一覧

| Option | Description | Default |
|--------|-------------|---------|
| `-s, --session` | agent-browserセッション名 | default |
| `-o, --output` | 出力ファイルパス | capture.png |
| `--highlight` | ハイライトする要素のref | - |
| `--zoom` | ズームする要素のref | - |
| `--scale` | ズーム倍率 | 2 |
| `--color` | ハイライト枠の色（名前またはhex） | red |
| `--border-width` | ハイライト枠の太さ | 3 |
| `--padding` | 要素周囲の余白 | 10 |
| `--auto-focus` | AIが自動で要素を選択 | false |
| `-d, --duration` | 録画時間（ms） | 5000 |
| `--fps` | 録画フレームレート | 5 |

### 利用可能なカラー名

`red`, `blue`, `green`, `yellow`, `orange`, `purple`, `cyan`, `magenta`, `white`, `black`

hex値（例: `#FF5500`）も使用可能です。

## Claude Code Skillとして使う

このプロジェクトには `.claude/skills/browser-viz/SKILL.md` が含まれています。

Claude Codeはプロジェクトディレクトリ内の `.claude/skills/` を自動的に検出してスキルとして読み込みます。このリポジトリをクローンしてClaude Codeで開くと、browser-vizスキルが自動的に利用可能になります。

**グローバルに使う場合**:
```bash
# スキルをグローバルにコピー
cp -r .claude/skills/browser-viz ~/.claude/skills/
```

## API

プログラマティックに使う場合：

```typescript
import {
  addHighlight,
  addArrow,
  addTextLabel,
  addAnnotations,
  zoomToArea,
  highlightAndZoom,
  saveImage,
  COLOR_PRESETS,
} from "browser-viz-skill";

const box = { x: 860, y: 478, width: 95, height: 50 };
```

### ハイライト（複数カラー対応）

```typescript
// 名前付きカラーでハイライト
const highlighted = await addHighlight("screenshot.png", box, {
  borderColor: "blue",  // red, green, yellow, orange, purple, cyan, magenta
  borderWidth: 4,
});
await saveImage(highlighted, "highlighted.png");

// hex値も使用可能
const customColor = await addHighlight("screenshot.png", box, {
  borderColor: "#FF5500",
});
```

### 矢印アノテーション

```typescript
// 基本的な矢印（上から指す）
const withArrow = await addArrow("screenshot.png", box);

// カスタマイズした矢印
const customArrow = await addArrow("screenshot.png", box, {
  color: "blue",           // 矢印の色
  strokeWidth: 5,          // 線の太さ
  headSize: 15,            // 矢頭のサイズ
  length: 80,              // 矢印の長さ
  direction: "top-right",  // 方向: top, bottom, left, right, top-left, top-right, bottom-left, bottom-right
});

// カスタム開始位置
const fromPoint = await addArrow("screenshot.png", box, {
  from: { x: 50, y: 100 },
  color: "green",
});
```

### テキストラベル

```typescript
// 基本的なラベル
const labeled = await addTextLabel("screenshot.png", box, "Click here");

// カスタマイズしたラベル
const customLabel = await addTextLabel("screenshot.png", box, "Step 1: 入力", {
  textColor: "white",        // テキスト色
  backgroundColor: "blue",   // 背景色
  backgroundOpacity: 0.9,    // 背景の透明度 (0-1)
  fontSize: 18,              // フォントサイズ
  fontWeight: "bold",        // フォントウェイト
  position: "bottom",        // 位置: top, bottom, left, right, center, top-left, etc.
  padding: 12,               // 内側余白
  borderRadius: 8,           // 角丸
  offset: 15,                // 要素からの距離
});
```

### 複合アノテーション

```typescript
// ハイライト + 矢印 + ラベルを一度に追加
const annotated = await addAnnotations("screenshot.png", box, {
  highlight: { borderColor: "red", borderWidth: 3 },
  arrow: { color: "blue", direction: "top" },
  label: { text: "重要!", options: { position: "bottom" } },
});
await saveImage(annotated, "annotated.png");
```

### ズーム

```typescript
// ズーム（拡大）
const zoomed = await zoomToArea("screenshot.png", box, { scale: 2 });
await saveImage(zoomed, "zoomed.png");

// ハイライト + ズームの組み合わせ
const combined = await highlightAndZoom("screenshot.png", box,
  { borderColor: "green", borderWidth: 4 },
  { scale: 1.5, padding: 30 }
);
await saveImage(combined, "highlight-zoom.png");
```

### GIF録画（スクリーンショット方式）

```typescript
import { recordWithScreenshots } from "browser-viz-skill";

// 5秒間、10fpsで録画
await recordWithScreenshots(5000, "output.gif", { frameRate: 10 }, "default");
```

### ffmpegを直接使う場合

```bash
# PNGフレームからGIF生成
ffmpeg -y -framerate 3 -i frames/frame-%03d.png \
  -vf "fps=3,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" \
  -loop 0 output.gif
```

## 実例: TODOアプリのテスト

```bash
# 1. TODOアプリを開く
agent-browser open "http://localhost:5173" --headed

# 2. スナップショットで要素を確認
agent-browser snapshot -i
# - textbox "新しいタスクを追加..." [ref=e5]
# - button "追加" [ref=e7]

# 3. スクリーンショット撮影
agent-browser screenshot screenshot.png

# 4. 追加ボタンを赤枠でハイライト
browser-viz annotate screenshot.png --highlight-box 860,478,95,50 -o highlighted.png

# 5. 入力フィールドをズーム
browser-viz annotate screenshot.png --zoom-box 327,318,611,55 --scale 1.5 -o zoomed.png
```

## ライセンス

MIT
