# Tradução e revisão para português de Portugal

Tradução integral aplicada ao catálogo e aos textos da interface. O STIX original não foi alterado.

## Conteúdo

- 18 293 textos de origem com tradução disponível.
- 706 técnicas e subtécnicas, 15 táticas, mitigações, descrições de deteção, parâmetros ajustáveis e exemplos de procedimentos.
- Termos técnicos, APIs, identificadores, comandos, caminhos, nomes próprios e referências preservados.
- Títulos portugueses apresentados primeiro, com o nome original MITRE como referência técnica.
- Exemplos completos: removido o limite de 320 caracteres.
- Dicionário local persistente e correções editoriais explícitas; texto novo sem tradução faz a regeneração falhar.

## Revisão

Tradução inicial pelo serviço Google Translate para `pt-PT`, com proteção dos elementos técnicos. Revisão humana dos títulos das técnicas e subtécnicas, das descrições das 15 táticas, da interface, dos títulos e categorias dos 16 cenários e de amostras bilingues das descrições. Corrigidas traduções literais de ferramentas, autores e conceitos, bem como variantes de português e problemas gramaticais identificados nas amostras. A revisão não equivale a uma revisão humana frase a frase das cerca de 426 mil palavras da fonte.

## Verificação

- `npm.cmd run check-translations`: 18 293/18 293 textos; zero traduções em falta, zero perdas dos elementos verificados e zero ocorrências dos padrões de prosa inglesa pesquisados.
- `npm.cmd run rebuild-catalog`: concluído.
- `npm.cmd test`: 12 testes aprovados.
- `npm.cmd run build`: aprovado.
- `npm.cmd run lint`: aprovado.
- `git diff --check`: sem erros de espaços em branco.

A verificação linguística automática usa padrões e uma lista revista de termos técnicos; não demonstra ausência de todos os erros semânticos ou gramaticais. A inspeção visual não foi concluída: o acesso ao navegador estava indisponível e a abertura da aplicação Chrome expirou. A revisão não valida em laboratório os procedimentos de segurança descritos.
