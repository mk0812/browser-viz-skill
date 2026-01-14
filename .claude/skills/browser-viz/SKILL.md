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

## AI Usage Examples

以下のような指示でこのツールを活用できます：

- 「TODO追加ボタンをクリックした部分を赤枠で囲んでスクリーンショットを保存して」
- 「検索ボックスにフォーカスしたスクリーンショットを撮って」
- 「この操作の流れをGIFで録画して」
- 「入力フォームの部分を拡大したスクリーンショットを撮って」
- 「ボタンの位置を赤い枠で強調表示して」
