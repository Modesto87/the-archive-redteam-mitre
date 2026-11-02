# Tradução integral e revisão

**Objetivo:** traduzir toda a prosa visível para português de Portugal, conservando termos técnicos, nomes próprios, identificadores e código.

**Arquitetura:** substituir substituições parciais por traduções completas, guardadas por hash do original. A compilação é local e exige cobertura completa; texto novo sem tradução deve causar erro. O STIX original permanece intacto. O serviço de tradução só recebe texto público, com código e termos protegidos por marcadores.

**Especificação:** pedido do utilizador de 2026-11-02 e problemas reproduzidos na revisão anterior.

## Tarefas

- [x] Inventariar os textos efetivamente usados, incluindo títulos, descrições, relações, deteções e parâmetros ajustáveis.
- [x] Escrever e executar testes que reproduzam frases híbridas, corrupção de títulos, alteração de código e ausência de traduções.
- [x] Preparar glossário e tradução integral persistente, com recuperação de progresso e validação de marcadores.
- [x] Integrar o dicionário no gerador; remover truncagem de exemplos e tradução dupla.
- [x] Rever a interface e o conteúdo editorial existente, corrigindo português e anglicismos de prosa.
- [x] Regenerar o catálogo, verificar cobertura e preservação dos elementos técnicos, rever amostras e corrigir resultados inadequados.
- [x] Executar testes, build e lint; registar os limites da revisão humana.

## Critérios de revisão

- Nenhum texto novo fica silenciosamente em inglês.
- Comandos, APIs, caminhos, URLs, citações e identificadores mantêm-se.
- Conteúdo completo, sem resumir ou cortar exemplos.
- Tradução não acrescenta operadores de Red Team ao texto da fonte.
- Parâmetros ajustáveis não são apresentados como vulnerabilidades confirmadas.

## Registo

- Execução diretamente na pasta autorizada pelo utilizador; sem publicação, push ou commit automático.
- Diagnóstico confirmado: substituições regex sem análise frásica; regra genérica de Proxy aplicada antes de títulos específicos; tratamento incorreto de plurais; descrições adicionais copiadas sem tradução.
- Revisão independente concluída; corrigidos os problemas encontrados com nomes próprios, títulos, ligações MITRE, parágrafos, recuperação do progresso e deteção de prosa não traduzida.
- Resultado e limites documentados em `docs/REVISAO_TRADUCAO.md`.
