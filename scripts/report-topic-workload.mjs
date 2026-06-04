#!/usr/bin/env node
/**
 * Offline catalog workload from gen-practice-tasks-sql.mjs (no DB).
 * Run: node scripts/report-topic-workload.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(__dirname, 'gen-practice-tasks-sql.mjs'), 'utf8');

const slugRe = /topic_slug:\s*'([^']+)'/g;
const byTopic = new Map();
let m;
while ((m = slugRe.exec(src)) !== null) {
  const slug = m[1];
  byTopic.set(slug, (byTopic.get(slug) ?? 0) + 1);
}

const rows = [...byTopic.entries()].sort((a, b) => a[0].localeCompare(b[0]));
const total = rows.reduce((s, [, n]) => s + n, 0);

console.log('# CodeUp — навантаження вправ (offline, з seed)\n');
console.log(`Усього вправ у каталозі: **${total}**\n`);
console.log('| Тема (slug) | Кількість вправ |');
console.log('|-------------|-----------------|');
for (const [slug, count] of rows) {
  console.log(`| ${slug} | ${count} |`);
}
console.log('\nДля статистики проходження учнів запустіть `scripts/report-topic-workload.sql` у Supabase SQL Editor.');
