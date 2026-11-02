import fs from 'node:fs';

const terms = [
  ...JSON.parse(fs.readFileSync(new URL('./translations/technical-terms.json', import.meta.url), 'utf8')),
  ...JSON.parse(fs.readFileSync(new URL('./translations/proper-names.json', import.meta.url), 'utf8'))
];
const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const glossary = new RegExp(`(?<![\\p{L}\\p{N}_])(?:${[...new Set(terms)].sort((a, b) => b.length - a.length).map(escape).join('|')})(?![\\p{L}\\p{N}_])`, 'gu');
const literals = /```[\s\S]*?```|<code>[\s\S]*?<\/code>|`[^`]+`|\(Citation:\s*[^)]+\)|\[[^\]]*\]\([^\s)]+\)|https?:\/\/[^\s<>)]+|\b[A-Za-z]:\\[^\s,;<>]+|\b(?:HKEY_[A-Z_]+|HKCU|HKLM|HKCR|HKU)\\[^\s,;<>]+|(?<![\w:])\/(?:etc|usr|var|tmp|proc|sys|dev|bin|sbin|opt|home|root|Library|System|Applications)\/[\w./*<>${}+-]*|%[A-Za-z_][A-Za-z0-9_]*%|<\/?[A-Za-z][^>]*>|\b(?:[A-Z][a-z]+){2,}[A-Za-z0-9]*\b|\b\w+_[\w_]+\b|\b[A-Za-z0-9_-]+\.(?:exe|dll|sys|dylib|so|conf|ini|plist|ps1|vbs|js|py|sh|bat|cmd|bin|dat|log|txt|xml|json|yml|yaml|service|timer|socket)\b|\b(?:T\d{4}(?:\.\d{3})?|TA\d{4}|M\d{4}|AN\d{4}|DET\d{4}|[A-Z][A-Z0-9]{1,})\b/g;
const literalParts = literals.source.split('|\\b(?:[A-Z][a-z]+){2,}');
const syntax = new RegExp(literalParts[0], 'g');
const identifiers = `\\b(?:[A-Z][a-z]+){2,}${literalParts[1]}`;
const lexical = new RegExp(`ZXQ\\d{6}QXZ|${glossary.source}|${identifiers}`, 'gu');

export function protectTechnicalText(source) {
  const tokens = [];
  const protect = value => {
    const marker = `ZXQ${String(tokens.length).padStart(6, '0')}QXZ`;
    tokens.push(value);
    return marker;
  };
  let text = source.replace(syntax, protect);
  text = text.split(/(ZXQ\d{6}QXZ)/g)
    .map(part => /^ZXQ\d{6}QXZ$/.test(part) ? part : part.replace(lexical, protect))
    .join('');
  return { text, tokens };
}

export function restoreTechnicalText(text, tokens) {
  const counts = new Array(tokens.length).fill(0);
  const restored = text.replace(/ZXQ\s*(\d{6})\s*QXZ/gi, (_, digits) => {
    const i = Number(digits);
    if (i >= tokens.length) throw new Error(`Marcador desconhecido: ${i}`);
    counts[i]++;
    return tokens[i];
  });
  if (counts.some(n => n !== 1) || /ZXQ|QXZ/.test(restored)) throw new Error('Marcador técnico perdido, duplicado ou alterado');
  return restored;
}

export function splitProtectedText(text, limit = 3200) {
  const parts = [];
  while (text.length > limit) {
    let end = text.lastIndexOf('\n', limit);
    if (end < limit * 0.5) end = text.lastIndexOf('. ', limit);
    if (end < limit * 0.5) end = text.lastIndexOf(' ', limit);
    if (end < 1) end = limit;
    else end++;
    const start = text.lastIndexOf('ZXQ', end);
    if (start >= 0 && start + 12 > end) end = start;
    if (!end) throw new Error('Não foi possível dividir o texto protegido');
    parts.push(text.slice(0, end));
    text = text.slice(end);
  }
  if (text) parts.push(text);
  return parts;
}

export function joinTranslatedParts(parts, results) {
  return results.map((result, i) => (parts[i].match(/^\s+/)?.[0] || '') + result.trim() + (parts[i].match(/\s+$/)?.[0] || '')).join('');
}

export function formatTechnicalProse(text, localize = name => name) {
  // Apenas apresentação: o dicionário conserva integralmente as fontes e os URLs.
  return text
    .replace(/<\/?code>/g, '`')
    .replace(/\(Citation:\s*([^)]+)\)/g, ' `[Ref: $1]`')
    .replace(/\[([^\]]+)\]\(https:\/\/attack\.mitre\.org\/(techniques|tactics|software|groups|mitigations)\/([^)]+)\)/g, (_, label, type, path) => `**${['techniques', 'tactics', 'mitigations'].includes(type) ? localize(label) : label}** (\`${path.split('/').filter(Boolean).join('.')}\`)`);
}
