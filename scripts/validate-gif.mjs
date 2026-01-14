#!/usr/bin/env node
/**
 * GIF品質検証スクリプト
 *
 * Usage:
 *   node scripts/validate-gif.mjs add-task
 *   node scripts/validate-gif.mjs --all
 */
import { readdirSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

const OUTPUT_DIR = './test-output';

// Parse eval result from agent-browser (handles double-quoted JSON)
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

/**
 * Get GIF frame count using ffprobe
 */
function getGifFrameCount(gifPath) {
  try {
    const result = execSync(
      `ffprobe -v error -select_streams v:0 -count_frames -show_entries stream=nb_read_frames -of csv=p=0 "${gifPath}"`,
      { encoding: 'utf-8' }
    ).trim();
    return parseInt(result) || 0;
  } catch {
    return -1;
  }
}

/**
 * Validate a single test's GIF and frames
 */
function validateTest(testName) {
  const framesDir = join(OUTPUT_DIR, `${testName}-frames`);
  const gifPath = join(OUTPUT_DIR, `${testName}.gif`);
  const issues = [];
  const warnings = [];

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`📋 検証: ${testName}`);
  console.log('═'.repeat(60));

  // Check if frames directory exists
  if (!existsSync(framesDir)) {
    issues.push(`フレームディレクトリが存在しません: ${framesDir}`);
    return { testName, issues, warnings, passed: false };
  }

  // Check if GIF exists
  if (!existsSync(gifPath)) {
    issues.push(`GIFファイルが存在しません: ${gifPath}`);
  }

  // Get frame files (exclude -raw files)
  const allFrames = readdirSync(framesDir)
    .filter(f => f.endsWith('.png'))
    .sort();

  const frames = allFrames.filter(f => !f.includes('-raw'));
  const rawFrames = allFrames.filter(f => f.includes('-raw'));

  console.log(`\n📁 フレームファイル:`);
  console.log(`   総数: ${allFrames.length}`);
  console.log(`   通常: ${frames.length}`);
  console.log(`   Raw:  ${rawFrames.length}`);

  // Check frame count
  if (frames.length < 3) {
    warnings.push(`フレーム数が少ないです (${frames.length}フレーム)`);
  }

  // Check GIF frame count
  if (existsSync(gifPath)) {
    const gifFrameCount = getGifFrameCount(gifPath);
    console.log(`\n🎬 GIF情報:`);
    console.log(`   フレーム数: ${gifFrameCount}`);

    if (gifFrameCount !== frames.length) {
      issues.push(`GIFフレーム数(${gifFrameCount})がソースフレーム数(${frames.length})と一致しません`);
    }
  }

  // List frames
  console.log(`\n📸 フレーム一覧:`);
  frames.forEach((frame, i) => {
    const hasRaw = rawFrames.some(r => r.replace('-raw', '') === frame);
    const indicator = hasRaw ? '🔴' : '⚪';
    console.log(`   ${indicator} [${String(i + 1).padStart(2, '0')}] ${frame}`);
  });

  // Check for highlight frames (frames with corresponding -raw files)
  const highlightFrames = frames.filter(f => {
    const rawName = f.replace('.png', '-raw.png');
    return rawFrames.some(r => r === rawName || f.includes(r.replace('-raw.png', '')));
  });

  console.log(`\n🔴 ハイライトフレーム: ${rawFrames.length / 2}個`);

  // Identify potential issues based on frame names
  const potentialIssues = [];

  // Check for hover-dependent elements
  const hoverFrames = frames.filter(f =>
    f.includes('edit-button') ||
    f.includes('delete-button') ||
    f.includes('hover')
  );

  if (hoverFrames.length > 0) {
    console.log(`\n⚠️  ホバー依存フレーム (要目視確認):`);
    hoverFrames.forEach(f => {
      console.log(`   - ${f}`);
      potentialIssues.push(`${f}: ホバー時のみ表示される要素を含む可能性があります`);
    });
  }

  // Summary
  console.log(`\n${'─'.repeat(60)}`);

  if (issues.length > 0) {
    console.log('❌ エラー:');
    issues.forEach(issue => console.log(`   - ${issue}`));
  }

  if (warnings.length > 0) {
    console.log('⚠️  警告:');
    warnings.forEach(warning => console.log(`   - ${warning}`));
  }

  if (potentialIssues.length > 0) {
    console.log('👀 要確認:');
    potentialIssues.forEach(pi => console.log(`   - ${pi}`));
  }

  const passed = issues.length === 0;
  console.log(`\n結果: ${passed ? '✅ PASS' : '❌ FAIL'}`);

  return { testName, issues, warnings, potentialIssues, passed, frameCount: frames.length };
}

/**
 * Get all test names from test-output directory
 */
function getAllTestNames() {
  if (!existsSync(OUTPUT_DIR)) {
    return [];
  }

  const dirs = readdirSync(OUTPUT_DIR)
    .filter(d => d.endsWith('-frames'))
    .map(d => d.replace('-frames', ''));

  return dirs;
}

// Main
const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log(`
GIF品質検証スクリプト

Usage:
  node scripts/validate-gif.mjs <test-name>   単一テストを検証
  node scripts/validate-gif.mjs --all         全テストを検証
  node scripts/validate-gif.mjs --list        テスト一覧を表示

Examples:
  node scripts/validate-gif.mjs add-task
  node scripts/validate-gif.mjs edit-task delete-task
  node scripts/validate-gif.mjs --all
`);
  process.exit(0);
}

if (args.includes('--list')) {
  const tests = getAllTestNames();
  console.log('利用可能なテスト:');
  tests.forEach(t => console.log(`  - ${t}`));
  process.exit(0);
}

const testNames = args.includes('--all') ? getAllTestNames() : args;

if (testNames.length === 0) {
  console.error('テストが見つかりません');
  process.exit(1);
}

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║              GIF 品質検証レポート                          ║');
console.log('╚════════════════════════════════════════════════════════════╝');

const results = testNames.map(name => validateTest(name));

// Final summary
console.log(`\n${'═'.repeat(60)}`);
console.log('📊 総合結果');
console.log('═'.repeat(60));

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;

console.log(`\n  ✅ 成功: ${passed}`);
console.log(`  ❌ 失敗: ${failed}`);
console.log(`  📁 合計: ${results.length}`);

if (failed > 0) {
  console.log('\n❌ 失敗したテスト:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  - ${r.testName}`);
    r.issues.forEach(i => console.log(`      ${i}`));
  });
}

console.log('\n💡 ヒント:');
console.log('  - ハイライトフレームは目視確認が必要です');
console.log('  - 「要確認」のフレームは特に注意してください');
console.log('  - 問題があれば: node tests/test-{name}.mjs で再生成');

process.exit(failed > 0 ? 1 : 0);
