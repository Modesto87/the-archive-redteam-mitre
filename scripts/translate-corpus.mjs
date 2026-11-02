// Ferramenta de preparação. O catálogo e a aplicação não usam serviços externos.
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { protectTechnicalText, restoreTechnicalText, splitProtectedText, joinTranslatedParts } from './translation-format.mjs';

const directory = '.translation-work';
const sources = JSON.parse(fs.readFileSync(`${directory}/sources.json`, 'utf8'));
const destination = 'scripts/translations/pt-PT.json';
const translated = fs.existsSync(destination) ? JSON.parse(fs.readFileSync(destination, 'utf8')) : {};
const reviewed = JSON.parse(fs.readFileSync('scripts/translations/reviewed-pt-PT.json', 'utf8'));
const progressFile = `${directory}/progress.jsonl`;
if (fs.existsSync(progressFile)) {
  for (const line of fs.readFileSync(progressFile, 'utf8').split('\n').filter(Boolean)) {
    const [key, text] = JSON.parse(line);
    if (!translated[key]) translated[key] = text;
  }
}
if (process.env.RECHECK_TRANSLATIONS === '1') {
  let discarded = 0;
  for (const [key, source] of Object.entries(sources)) {
    if (!translated[key] || reviewed[source]) continue;
    const { tokens } = protectTechnicalText(source);
    const unprotected = protectTechnicalText(source).text.replace(/ZXQ\d{6}QXZ/g, '');
    if (tokens.some(token => !translated[key].toLowerCase().includes(token.toLowerCase())) || (source === translated[key] && /[A-Za-z]{3}/.test(unprotected)) || (process.env.RECHECK_PARAGRAPHS === '1' && splitProtectedText(protectTechnicalText(source).text).length > 1)) {
      delete translated[key]; discarded++;
    }
  }
  console.log(JSON.stringify({ discardedForTechnicalReview: discarded }));
}

const work = [];
const records = new Map();
let completed = 0;
let requests = 0;
let failures = 0;
const save = () => fs.writeFileSync(destination, JSON.stringify(translated, null, 2) + '\n');
const append = (key, text) => {
  translated[key] = text;
  fs.appendFileSync(progressFile, JSON.stringify([key, text]) + '\n');
  completed++;
};

for (const [key, source] of Object.entries(sources)) {
  if (translated[key] || reviewed[source]) continue;
  if (/^Analytic \d+$/.test(source)) { append(key, source.replace('Analytic ', 'Regra de deteção ')); continue; }
  const { text, tokens } = protectTechnicalText(source);
  if (!/[A-Za-z]{2}/.test(text.replace(/ZXQ\d{6}QXZ/g, ''))) { append(key, source); continue; }
  const parts = splitProtectedText(text);
  const record = { key, source, tokens, parts, results: new Array(parts.length).fill(null) };
  records.set(key, record);
  parts.forEach((part, index) => work.push({ key, index, text: part }));
}

const batches = [];
let batch = [];
let length = 0;
for (const item of work) {
  if (batch.length && (process.env.TRANSLATION_SINGLE === '1' || length + item.text.length + 24 > Number(process.env.TRANSLATION_BATCH_SIZE || 3400))) { batches.push(batch); batch = []; length = 0; }
  batch.push(item); length += item.text.length + 24;
}
if (batch.length) batches.push(batch);

async function request(text) {
  const url = new URL('https://translate.googleapis.com/translate_a/single');
  Object.entries({ client: 'gtx', sl: 'en', tl: 'pt-PT', dt: 't', q: text }).forEach(([k, v]) => url.searchParams.set(k, v));
  requests++;
  const response = await fetch(url, { signal: AbortSignal.timeout(45000) });
  if (!response.ok) throw new Error(`Serviço de tradução: HTTP ${response.status}`);
  const payload = await response.json();
  if (!Array.isArray(payload[0])) throw new Error('Resposta de tradução inválida');
  return payload[0].map(part => part[0] || '').join('');
}

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
async function withRetry(text) {
  let last;
  for (let attempt = 0; attempt < 5; attempt++) {
    try { return await request(text); }
    catch (error) { last = error; await wait(Math.min(2000 * 2 ** attempt, 20000)); }
  }
  throw last;
}

async function translateGrouped(text) {
  // Sequências como Kerberos AS-REQ/AS-REP são um só elemento técnico.
  // Evita que o serviço elimine um marcador por o considerar redundante.
  const groups = [];
  const grouped = text.replace(/ZXQ\d{6}QXZ(?:[\s/,+&().:_-]*ZXQ\d{6}QXZ)*/g, value => {
    groups.push(value);
    return `GXP${String(groups.length - 1).padStart(6, '0')}PXG`;
  });
  let result = await withRetry(grouped);
  result = result.replace(/GXP\s*(\d{6})\s*PXG/gi, 'GXP$1PXG');
  for (let i = 0; i < groups.length; i++) {
    const marker = `GXP${String(i).padStart(6, '0')}PXG`;
    if (result.split(marker).length !== 2) throw new Error('Marcador composto alterado na tradução');
  }
  return result.replace(/GXP(\d{6})PXG/g, (_, index) => groups[Number(index)]);
}

async function translateHashed(text) {
  const markers = new Map();
  const protectedText = text.replace(/ZXQ\d{6}QXZ/g, marker => {
    const hash = createHash('sha256').update(text + marker).digest('hex').slice(0, 24);
    markers.set(hash, marker);
    return hash;
  });
  let result = await withRetry(protectedText);
  for (const [hash, marker] of markers) {
    if (result.split(hash).length !== 2) throw new Error('Identificador técnico alterado na tradução');
    result = result.replace(hash, marker);
  }
  return result;
}

async function translateFallback(item) {
  try { return await translateGrouped(item.text); }
  catch { return translateHashed(item.text); }
}

function commitPart(item, result) {
  const record = records.get(item.key);
  result = result.replace(/ZXQ\s*(\d{6})\s*QXZ/gi, 'ZXQ$1QXZ');
  // Validar cada bloco antes de o aceitar, incluindo repetições de marcadores.
  const markers = [...item.text.matchAll(/ZXQ\d{6}QXZ/g)].map(m => m[0]);
  if (markers.some(marker => result.split(marker).length !== 2) || [...result.matchAll(/ZXQ\d{6}QXZ/g)].length !== markers.length) {
    throw new Error('Marcadores alterados na tradução');
  }
  record.results[item.index] = result;
  if (record.results.every(part => part !== null)) {
    // O espaço na fronteira de blocos é estrutural, não deve unir palavras.
    const joined = joinTranslatedParts(record.parts, record.results);
    append(record.key, restoreTechnicalText(joined, record.tokens));
  }
}

async function processBatch(items) {
  const input = items.map((item, i) => `⟦${String(i).padStart(4, '0')}⟧\n${item.text}`).join('\n\n');
  const output = await withRetry(input);
  const matches = [...output.matchAll(/⟦\s*(\d{4})\s*⟧\s*/g)];
  if (matches.length === items.length && matches.every((m, i) => Number(m[1]) === i)) {
    for (let i = 0; i < items.length; i++) {
      const result = output.slice(matches[i].index + matches[i][0].length, matches[i + 1]?.index ?? output.length).trim();
      try { commitPart(items[i], result); }
      catch {
        try { commitPart(items[i], (await translateFallback(items[i])).trim()); }
        catch (error) {
          failures++;
          fs.appendFileSync(`${directory}/failures.jsonl`, JSON.stringify({ key: items[i].key, error: error.message }) + '\n');
        }
      }
    }
  } else {
    for (const item of items) {
      try { commitPart(item, (await translateFallback(item)).trim()); }
      catch (error) {
        failures++;
        fs.appendFileSync(`${directory}/failures.jsonl`, JSON.stringify({ key: item.key, error: error.message }) + '\n');
      }
    }
  }
}

console.log(JSON.stringify({ pendingRecords: records.size, batches: batches.length, alreadySaved: Object.keys(translated).length }));
let next = 0;
const limit = Number(process.env.TRANSLATION_BATCH_LIMIT || batches.length);
const workers = Number(process.env.TRANSLATION_WORKERS || 3);
async function worker() {
  while (next < Math.min(batches.length, limit)) {
    const index = next++;
    try { await processBatch(batches[index]); }
    catch (error) {
      failures++;
      fs.appendFileSync(`${directory}/failures.jsonl`, JSON.stringify({ batch: index, keys: batches[index].map(x => x.key), error: error.message }) + '\n');
    }
    if ((index + 1) % 20 === 0) { save(); console.log(JSON.stringify({ batch: index + 1, total: batches.length, completed, requests, failures })); }
  }
}
await Promise.all(Array.from({ length: workers }, worker));
save();
const missing = Object.entries(sources).filter(([key, source]) => !translated[key] && !reviewed[source]);
console.log(JSON.stringify({ completed, requests, failures, missing: missing.length }));
if (missing.length && !process.env.TRANSLATION_BATCH_LIMIT) process.exitCode = 1;
