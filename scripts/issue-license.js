#!/usr/bin/env node
/**
 * 生成 Pro License 并可写入 docs/licenses.json
 *
 * 用法:
 *   node scripts/issue-license.js
 *   node scripts/issue-license.js --add
 *   node scripts/issue-license.js --add --push   # 写入后 git add/commit（不 push）
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const licensesPath = path.join(root, 'docs', 'licenses.json');

function buildLicense(part1, part2) {
  const p1 = (part1 || randomBlock()).toUpperCase().replace(/[^A-Z0-9]/g, '').padEnd(4, '0').slice(0, 4);
  const p2 = (part2 || randomBlock()).toUpperCase().replace(/[^A-Z0-9]/g, '').padEnd(4, '0').slice(0, 4);
  const body = `CVPRO${p1}${p2}`;
  let hash = 0;
  for (let i = 0; i < body.length; i++) {
    hash = (hash * 31 + body.charCodeAt(i)) >>> 0;
  }
  const check = (hash % 65536).toString(16).toUpperCase().padStart(4, '0');
  return `CVPRO-${p1}-${p2}-${check}`;
}

function randomBlock() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 4; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function loadLicenses() {
  if (!fs.existsSync(licensesPath)) {
    return { keys: [] };
  }
  return JSON.parse(fs.readFileSync(licensesPath, 'utf8'));
}

function saveLicenses(data) {
  fs.writeFileSync(licensesPath, JSON.stringify({ keys: data.keys }, null, 2) + '\n', 'utf8');
}

const add = process.argv.includes('--add');
const gitCommit = process.argv.includes('--push') || process.argv.includes('--commit');

const key = buildLicense(process.argv.find((a) => !a.startsWith('-') && a !== process.argv[0] && a !== process.argv[1]));

console.log('\n=== ClearView Pro License ===\n');
console.log(key);
console.log('\n--- 发给买家的激活说明 ---\n');
console.log(`1. 安装扩展： https://github.com/clearview-tools/clearview-magnifier/releases
2. 点击浏览器工具栏 ClearView 图标
3. 输入 License：${key}
4. 点「激活」，勾选「启用实时翻译」
5. 问题反馈： https://github.com/clearview-tools/clearview-magnifier/issues
`);

if (add) {
  const data = loadLicenses();
  if (!data.keys.includes(key)) {
    data.keys.push(key);
    saveLicenses(data);
    console.log(`已写入 ${licensesPath}`);
  }
  if (gitCommit) {
    execSync(`git add "${licensesPath}"`, { cwd: root, stdio: 'inherit' });
    execSync(`git commit -m "chore: add license ${key}"`, { cwd: root, stdio: 'inherit' });
    console.log('已提交。请执行 git push 使远程校验生效。');
  } else if (add) {
    console.log('记得 git push，Pages 上的 licenses.json 才会更新。');
  }
}
