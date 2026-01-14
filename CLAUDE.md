# browser-viz-skill

agent-browserの操作を可視化するツール。スクリーンショットへのアノテーション（カラーハイライト、矢印、テキストラベル、ズーム）とGIF録画機能を提供。

## プロジェクト構造

```
src/
├── index.ts          # エクスポート
├── types.ts          # 型定義、カラープリセット
├── annotator.ts      # 画像アノテーション（ハイライト、矢印、ラベル、ズーム）
├── focus-detector.ts # 要素検出、バウンディングボックス取得
└── gif-recorder.ts   # GIF録画
bin/
└── browser-viz.js    # CLIエントリーポイント
```

## 開発コマンド

```bash
npm run build    # TypeScriptビルド
npm test         # Vitestでテスト実行
npm link         # CLIをグローバルにリンク
```

## 主要API

### アノテーション関数

| 関数 | 説明 |
|------|------|
| `addHighlight(imagePath, box, options?)` | カラーハイライト枠を追加 |
| `addArrow(imagePath, box, options?)` | 矢印を追加（8方向対応） |
| `addTextLabel(imagePath, box, text, options?)` | テキストラベルを追加 |
| `addAnnotations(imagePath, box, options)` | 複合アノテーション |
| `zoomToArea(imagePath, box, options?)` | 指定領域をズーム |
| `highlightAndZoom(imagePath, box, ...)` | ハイライト+ズーム |

すべての関数に `*ToBuffer` バージョンあり（例: `addHighlightToBuffer`）

### カラー

名前付きカラー: `red`, `blue`, `green`, `yellow`, `orange`, `purple`, `cyan`, `magenta`, `white`, `black`

hex値も使用可能（例: `#FF5500`）

### オプション型

```typescript
// ハイライト
interface AnnotationOptions {
  borderColor?: string | ColorName;  // default: "red"
  borderWidth?: number;              // default: 3
  padding?: number;                  // default: 5
}

// 矢印
interface ArrowOptions {
  color?: string | ColorName;        // default: "red"
  strokeWidth?: number;              // default: 3
  headSize?: number;                 // default: 12
  length?: number;                   // default: 60
  direction?: ArrowDirection;        // default: "top"
  from?: Point;                      // カスタム開始位置
}

// テキストラベル
interface TextLabelOptions {
  textColor?: string | ColorName;    // default: "white"
  backgroundColor?: string | ColorName; // default: "black"
  backgroundOpacity?: number;        // default: 0.8
  fontSize?: number;                 // default: 14
  fontWeight?: "normal" | "bold";    // default: "bold"
  position?: LabelPosition;          // default: "top"
  padding?: number;                  // default: 8
  borderRadius?: number;             // default: 4
  offset?: number;                   // default: 10
}

// 複合アノテーション
interface MultiAnnotationOptions {
  highlight?: AnnotationOptions;
  arrow?: ArrowOptions;
  label?: { text: string; options?: TextLabelOptions };
}
```

## 依存関係

- `sharp` - 画像処理
- `ws` - WebSocket（スクリーンキャスト用）
- `commander` - CLI
- `ffmpeg` - GIF生成（外部コマンド）
- `agent-browser` - ブラウザ操作（外部コマンド）

## テスト

```bash
npm test                           # 全テスト実行
npm test -- src/annotator.test.ts  # 特定ファイルのみ
```

テストフィクスチャは `test-fixtures/`、出力は `test-output/` に生成される。
