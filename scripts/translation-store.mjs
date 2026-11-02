import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const collecting = process.env.COLLECT_TRANSLATIONS === '1';
const sources = new Map();
const storePath = path.join(root, 'translations/pt-PT.json');
const overridePath = path.join(root, 'translations/reviewed-pt-PT.json');
const translations = fs.existsSync(storePath) ? JSON.parse(fs.readFileSync(storePath, 'utf8')) : {};
const reviewed = fs.existsSync(overridePath) ? JSON.parse(fs.readFileSync(overridePath, 'utf8')) : {};

export const normalizeSource = text => String(text || '').replace(/\r\n/g, '\n').trim();
export const translationKey = text => createHash('sha256').update(normalizeSource(text)).digest('hex');

export function translateComplete(text) {
  const source = normalizeSource(text);
  if (!source) return '';
  const key = translationKey(source);
  if (collecting) {
    sources.set(key, source);
    return source;
  }
  const result = reviewed[source] ?? translations[key];
  if (typeof result !== 'string' || !result.trim()) {
    throw new Error(`Falta tradução integral (${key}): ${source.slice(0, 120)}`);
  }
  return result;
}

if (collecting) {
  process.on('exit', () => {
    fs.mkdirSync('.translation-work', { recursive: true });
    fs.writeFileSync('.translation-work/sources.json', JSON.stringify(Object.fromEntries(sources), null, 2));
  });
}
