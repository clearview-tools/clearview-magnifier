#!/usr/bin/env node
/**
 * 生成 ClearView Pro License Key
 * 格式: CVPRO-XXXX-XXXX-XXXX （末 4 位为校验码）
 *
 * 用法: node scripts/generate-license-key.js
 *       node scripts/generate-license-key.js ABCD EFGH
 */

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

const key = buildLicense(process.argv[2], process.argv[3]);
console.log(key);
