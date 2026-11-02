import assert from 'node:assert/strict';
import test from 'node:test';
import { protectTechnicalText, restoreTechnicalText, splitProtectedText, formatTechnicalProse, joinTranslatedParts } from './translation-format.mjs';

test('protege código, caminhos, URLs, citações e termos técnicos', () => {
  const source = 'Use `whoami /all`, PowerShell and CreateProcessWithTokenW. Read /etc/shadow. (Citation: Example) See [LSASS](https://attack.mitre.org/techniques/T1003/001).';
  const { text, tokens } = protectTechnicalText(source);
  for (const literal of ['whoami /all', 'PowerShell', 'CreateProcessWithTokenW', '/etc/shadow', 'https://']) assert.ok(!text.includes(literal));
  assert.equal(restoreTechnicalText(text, tokens), source);
});

test('rejeita uma tradução que elimina ou duplica elementos protegidos', () => {
  const { text, tokens } = protectTechnicalText('Use `whoami`.');
  assert.throws(() => restoreTechnicalText('Utilizar.', tokens), /marcador/i);
  assert.throws(() => restoreTechnicalText(text + text, tokens), /marcador/i);
});

test('protege termos compostos antes das siglas sem tocar em código', () => {
  const source = 'Use AS-REP Roasting and DLL Hijacking. Keep `AS-REP Roasting` literal.';
  const { text, tokens } = protectTechnicalText(source);
  assert.ok(tokens.includes('AS-REP Roasting'));
  assert.ok(tokens.includes('DLL Hijacking'));
  assert.ok(tokens.includes('`AS-REP Roasting`'));
  assert.equal(restoreTechnicalText(text, tokens), source);
});

test('preserva marcadores junto de siglas sem criar marcadores aninhados', () => {
  const source = 'API`CreateProcess` and DNS(Citation: Example)';
  const { text, tokens } = protectTechnicalText(source);
  assert.ok(tokens.every(token => !token.includes('ZXQ')));
  assert.equal(restoreTechnicalText(text, tokens), source);
});

test('divide textos longos sem perder conteúdo nem cortar marcadores', () => {
  const source = ('A sentence with PowerShell and `whoami`.\n\n').repeat(200);
  const { text } = protectTechnicalText(source);
  const parts = splitProtectedText(text, 1800);
  assert.ok(parts.every(s => s.length <= 1800));
  assert.equal(parts.join(''), text);
  assert.ok(parts.every(s => !/ZXQ\d*$/.test(s)));
});

test('mantém referências MITRE navegáveis sem ponto extra e formata código HTML', () => {
  assert.equal(formatTechnicalProse('Consultar [PowerShell](https://attack.mitre.org/techniques/T1059/001/) e <code>whoami /all</code>. (Citation: Example)'), 'Consultar **PowerShell** (`T1059.001`) e `whoami /all`.  `[Ref: Example]`');
});

test('mantém parágrafos e espaços entre frases ao reunir blocos traduzidos', () => {
  assert.equal(joinTranslatedParts(['First.\n\n', 'Second.', ' Third.'], ['Primeiro.', 'Segundo.', 'Terceiro.']), 'Primeiro.\n\nSegundo. Terceiro.');
});

test('traduz os títulos visíveis das ligações MITRE mantendo nomes de software', () => {
  const text = '[Data Obfuscation](https://attack.mitre.org/techniques/T1001/) / [Mimikatz](https://attack.mitre.org/software/S0002/)';
  assert.equal(formatTechnicalProse(text, name => name === 'Data Obfuscation' ? 'Ofuscação de dados' : name), '**Ofuscação de dados** (`T1001`) / **Mimikatz** (`S0002`)');
});
