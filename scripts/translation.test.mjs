import assert from 'node:assert/strict';
import test from 'node:test';
import { translateTechnicalProse, translateTechniqueName } from './translator-pt.mjs';

test('traduz o título completo sem corromper Proxy', () => {
  assert.equal(translateTechniqueName('System Binary Proxy Execution'), 'Execução por intermédio de binários do sistema');
});

test('traduz a frase inteira e mantém o significado da fonte', () => {
  const pt = translateTechnicalProse('Adversaries may attempt to obtain credentials.');
  assert.equal(pt, 'Os adversários podem tentar obter credenciais.');
});

test('não aceita silenciosamente prosa sem tradução', () => {
  assert.throws(() => translateTechnicalProse('A newly introduced untranslated sentence for coverage testing.'), /tradução/i);
});

test('preserva o comando literal numa descrição traduzida', () => {
  const pt = translateTechnicalProse('Adversaries may use `whoami /all` to obtain information.');
  assert.equal(pt, 'Os adversários podem utilizar `whoami /all` para obter informações.');
});
