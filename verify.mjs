#!/usr/bin/env node
// Recompute the lines LottSaver's $100-a-week ledger "bought" for a draw. No dependencies.
//
//   node verify.mjs us.powerball 2026-11-01
//   node verify.mjs --day 2026-11-02 us.powerball=2026-11-01 saturday-lotto=2026-10-31
//
// The seed is only public facts: game, draw date, line number. Nothing depends on the
// numbers drawn, so the same lines come out before and after the draw.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const spec = JSON.parse(readFileSync(new URL('./spec-v1.json', import.meta.url), 'utf8'));
const sha256 = (text) => createHash('sha256').update(text).digest();

export function line(gameId, date, index) {
  const game = spec.games[gameId];
  if (!game) throw new Error(`unknown game ${gameId}; see spec-v1.json`);
  return game.pools.map((pool) => {
    const range = pool.max - pool.min + 1;
    const limit = 2 ** 32 - 2 ** 32 % range;
    const picked = new Set();
    for (let counter = 0; picked.size < pool.count; counter++) {
      const digest = sha256(`${spec.version}|${gameId}|${date}|${index}|${pool.key}|${counter}`);
      for (let at = 0; at < 32 && picked.size < pool.count; at += 4) {
        const word = digest.readUInt32BE(at);
        if (word < limit) picked.add(pool.min + (word % range));
      }
    }
    return `${pool.key}:${[...picked].sort((a, b) => a - b).join(',')}`;
  }).join(' ');
}

export const lines = (gameId, date) =>
  Array.from({ length: spec.games[gameId].lines }, (_, i) => line(gameId, date, i));

export function dayHash(pairs) {
  const rows = [];
  const sorted = [...pairs].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] < b[1] ? -1 : 1));
  for (const [gameId, date] of sorted) {
    lines(gameId, date).forEach((text, i) => rows.push(`${gameId}|${date}|${i}|${text}`));
  }
  return sha256(rows.join('\n')).toString('hex');
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())) {
  const args = process.argv.slice(2);
  if (args[0] === '--day') {
    console.log(dayHash(args.slice(2).map((pair) => pair.split('='))));
  } else if (args.length === 2) {
    lines(args[0], args[1]).forEach((text, i) => console.log(`${String(i).padStart(3, '0')}  ${text}`));
  } else {
    console.error('usage: verify.mjs <game> <YYYY-MM-DD>  |  verify.mjs --day <date> <game>=<YYYY-MM-DD> ...');
    process.exit(1);
  }
}
