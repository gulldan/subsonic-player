import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const linesThreshold = Number(process.argv[2] ?? '80');
const funcsThreshold = Number(process.argv[3] ?? '80');

if (!Number.isFinite(linesThreshold) || !Number.isFinite(funcsThreshold)) {
  console.error('Usage: bun scripts/check-coverage.ts [linesThreshold] [funcsThreshold]');
  process.exit(1);
}

const lcovPath = join(process.cwd(), 'coverage', 'lcov.info');

if (!existsSync(lcovPath)) {
  console.error(`Coverage file not found: ${lcovPath}`);
  console.error('Run: bun test --coverage --coverage-reporter=lcov --coverage-dir=coverage');
  process.exit(1);
}

const content = readFileSync(lcovPath, 'utf8');
const records = content
  .split('end_of_record')
  .map((chunk) => chunk.trim())
  .filter(Boolean);

const linePercents: number[] = [];
const funcPercents: number[] = [];
let weightedLf = 0;
let weightedLh = 0;
let weightedFnf = 0;
let weightedFnh = 0;

for (const record of records) {
  let lf = 0;
  let lh = 0;
  let fnf = 0;
  let fnh = 0;

  for (const line of record.split(/\r?\n/)) {
    if (line.startsWith('LF:')) lf = Number(line.slice(3)) || 0;
    if (line.startsWith('LH:')) lh = Number(line.slice(3)) || 0;
    if (line.startsWith('FNF:')) fnf = Number(line.slice(4)) || 0;
    if (line.startsWith('FNH:')) fnh = Number(line.slice(4)) || 0;
  }

  const linePct = lf > 0 ? (lh / lf) * 100 : 100;
  const funcPct = fnf > 0 ? (fnh / fnf) * 100 : 100;
  linePercents.push(linePct);
  funcPercents.push(funcPct);

  weightedLf += lf;
  weightedLh += lh;
  weightedFnf += fnf;
  weightedFnh += fnh;
}

const avgLinesPct = linePercents.length > 0 ? linePercents.reduce((a, b) => a + b, 0) / linePercents.length : 100;
const avgFuncsPct = funcPercents.length > 0 ? funcPercents.reduce((a, b) => a + b, 0) / funcPercents.length : 100;
const weightedLinesPct = weightedLf > 0 ? (weightedLh / weightedLf) * 100 : 100;
const weightedFuncsPct = weightedFnf > 0 ? (weightedFnh / weightedFnf) * 100 : 100;

console.log(`Coverage (file-average): lines=${avgLinesPct.toFixed(2)}% funcs=${avgFuncsPct.toFixed(2)}%`);
console.log(`Coverage (weighted): lines=${weightedLinesPct.toFixed(2)}% funcs=${weightedFuncsPct.toFixed(2)}%`);
console.log(`Thresholds: lines>=${linesThreshold}% funcs>=${funcsThreshold}%`);

const failed: string[] = [];
if (avgLinesPct < linesThreshold) failed.push(`lines ${avgLinesPct.toFixed(2)}% < ${linesThreshold}%`);
if (avgFuncsPct < funcsThreshold) failed.push(`funcs ${avgFuncsPct.toFixed(2)}% < ${funcsThreshold}%`);

if (failed.length > 0) {
  console.error('Coverage check failed:');
  for (const msg of failed) console.error(`- ${msg}`);
  process.exit(1);
}

console.log('Coverage check passed.');
