import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { protectTechnicalText } from './translation-format.mjs';

// A recolha nunca substitui o catálogo publicado.
const collect = spawnSync(process.execPath, ['scripts/build-mitre-catalog.mjs'], {
  env: { ...process.env, COLLECT_TRANSLATIONS: '1' }, encoding: 'utf8'
});
if (collect.status !== 0) throw new Error(collect.stderr || collect.stdout);

const sources = JSON.parse(fs.readFileSync('.translation-work/sources.json', 'utf8'));
const translations = JSON.parse(fs.readFileSync('scripts/translations/pt-PT.json', 'utf8'));
const reviewed = JSON.parse(fs.readFileSync('scripts/translations/reviewed-pt-PT.json', 'utf8'));
const properNames = new Set(JSON.parse(fs.readFileSync('scripts/translations/proper-names.json', 'utf8')));
const missing = [];
const damaged = [];
const residualEnglish = [];
let protectedElements = 0;

for (const [key, source] of Object.entries(sources)) {
  const target = reviewed[source] ?? translations[key];
  if (!target?.trim()) { missing.push({ key, source: source.slice(0, 150) }); continue; }
  const { tokens } = protectTechnicalText(source);
  protectedElements += tokens.length;
  const lost = [...new Set(tokens)].filter(token => {
    const literal = /^(?:`|<code>|https?:|\[|\(Citation:|[A-Za-z]:\\|\/|%)/.test(token) || /[_\\]|[a-z][A-Z]/.test(token);
    if (literal) return target.split(token).length !== source.split(token).length;
    if (reviewed[source] && !properNames.has(token)) return false;
    return !target.toLowerCase().includes(token.toLowerCase());
  });
  if (lost.length) damaged.push({ key, lost });
  const unprotected = protectTechnicalText(target).text.replace(/ZXQ\d{6}QXZ/g, '');
  // Sinaliza prosa inglesa, sem confundir nomes de produtos e termos técnicos.
  const unchangedProse = target === source && /[A-Za-z]{3}/.test(unprotected) && !reviewed[source];
  if (unchangedProse || /\b(?:the adversary|adversaries may|this technique|can be used|in order to|such as|which allows|that allows|to obtain|to execute)\b/i.test(unprotected)) {
    residualEnglish.push({ key, source: source.slice(0, 150), target: target.slice(0, 300) });
  }
}

const report = {
  sourceStrings: Object.keys(sources).length,
  translatedStrings: Object.keys(sources).length - missing.length,
  protectedElements,
  missing, damaged, residualEnglish
};
fs.writeFileSync('.translation-work/quality-report.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ ...report, missing: missing.length, damaged: damaged.length, residualEnglish: residualEnglish.length }, null, 2));
if (missing.length || damaged.length || residualEnglish.length) process.exitCode = 1;
