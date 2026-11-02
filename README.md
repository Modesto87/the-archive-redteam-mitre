# THE ARCHIVE // RED TEAM
### Manual de campo MITRE ATT&CK® e procedimentos de evasão

Plataforma tática interativa baseada na matriz global do **MITRE ATT&CK® Enterprise** (STIX 2.1), com design editorial inspirado em manuais de campo militares e relatórios de inteligência ofensiva (*The Archive // Red Team*).

Criada especificamente como guia de referência rápida e motor de desbloqueio para operadores de Red Team e consultores de testes de intrusão (pentesters).

---

## ⚡ Principais Funcionalidades

1. **Matriz Tática de 15 Fases (15 Volumes da Kill Chain)**:
   - Navegação por todas as 15 táticas do MITRE ATT&CK: Reconhecimento, Acesso Inicial, Execução, Persistência, Escalada de Privilégios, Furtividade, Neutralização de Defesas, Acesso a Credenciais, Descoberta, Movimentação Lateral, Recolha, C2, Exfiltração e Impacto.
   - Mais de **706 técnicas e sub-técnicas** catalogadas.
   - Descrições, mitigações, deteções e exemplos de procedimentos traduzidos integralmente para **português de Portugal**, com termos técnicos, código, identificadores e nomes próprios preservados em inglês.

2. **Motor de Desbloqueio Tático ("ICE Breaker / Evasion Playbooks")**:
   - **16 procedimentos de desbloqueio** com notas de contorno e exemplos de comandos para quando o profissional de testes de intrusão encontra restrições. As notas editoriais não constituem validação laboratorial dos procedimentos:
     - AMSI & Constrained Language Mode (CLM)
     - LSASS RunAsPPL & Credential Guard
     - EDR User-Mode Inline Hooking em `ntdll.dll`
     - AppLocker & Windows Defender Application Control (WDAC)
     - Restrições de Porta SMB 445 / WinRM 5985
     - Grupo Protected Users & Desativação de NTLM
     - Egress Filtering Restrito & Proxy Corporativo com TLS Inspection
     - UAC Split Token & Privilege Escalation
     - Linux Hardened (Capabilities, Namespaces, AppArmor/SELinux)
     - Container Escape (Docker & Kubernetes Pods)
     - AD CS (ESC1-ESC8) & Shadow Credentials
     - WAF Bypass (Deep Packet Inspection & Encoding Smuggling)
     - MFA & Entra ID Conditional Access
     - Evasão de Sysmon & Detecções SIEM
     - Persistência Furtiva a Autoruns
     - Evasão de DLP em Exfiltração

3. **Arsenal Living-off-the-Land (LOLBAS & GTFOBins)**:
   - Mapeamento direto de binários nativos assinados (ex: `MSBuild.exe`, `InstallUtil.exe`, `rundll32 comsvcs`, `certutil`, `getcap`, `nsenter`) para contornar restrições de execução.

4. **Matriz Anti-Mitigação (M1xxx)**:
   - Mapeamento de cada mitigação oficial do MITRE para o respetivo procedimento ofensivo de contorno.

5. **Vista dividida e histórico de navegação**:
   - Navegação contínua sem modais bloqueantes: a árvore tática permanece acessível à esquerda enquanto o dossier técnico atualiza instantaneamente à direita.
   - Histórico de navegação fluida com navegação `ANTERIOR` e `SEGUINTE` entre técnicas, volumes e playbooks.

6. **Notas de campo pessoais e construção da cadeia de ataque**:
   - Permite arquivar técnicas na Kill Chain do pentest, registar notas de campo por técnica e exportar relatórios completos em formato Markdown (`.md`).
   - Dados guardados localmente no navegador (`localStorage`). Os dados do catálogo são locais; fontes tipográficas e referências externas podem exigir ligação à rede.

---

## 🛠️ Stack Tecnológica

- **Framework**: React 19 + TypeScript + Vite
- **Estilização**: Tailwind CSS v4 com paleta editorial *The Archive* (`#ece6da`, `#161514`, `#b81d18`)
- **Ícones**: Lucide React
- **Áudio Tático**: Web Audio API (sintetizador nativo para feedback operacional)
- **Dados**: Ingestão oficial MITRE ATT&CK STIX 2.1 compilada para JSON estático local (`public/data/mitre-catalog.json`)

---

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+ (testado em Node.js v24)
- npm

### Instalação e Execução
```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Compilar para produção
npm run build

# Pré-visualizar build de produção
npm run preview
```

### Recompilar Dados do MITRE (Opcional)
Se desejar reprocessar o STIX canónico do MITRE:
```bash
npm run rebuild-catalog
```

---

## 📜 Licença e Isenção de Responsabilidade

Os dados de técnicas, táticas e mitigações são propriedade de **The MITRE Corporation** e regidos pelos termos do [MITRE ATT&CK®](https://attack.mitre.org/).

Esta ferramenta foi desenvolvida para fins educativos, investigação académica em segurança ofensiva e execução de testes de intrusão autorizados.

## Tradução e revisão

O STIX original permanece intacto. `scripts/translations/pt-PT.json` guarda traduções completas por SHA-256 do texto original normalizado; `reviewed-pt-PT.json` contém correções editoriais explícitas. O catálogo é gerado localmente e a aplicação não contacta o serviço de tradução.

Uma descrição nova sem tradução faz a regeneração falhar, em vez de produzir frases híbridas. Os exemplos de procedimentos mantêm o texto completo. Os títulos portugueses são apresentados primeiro; os nomes originais MITRE permanecem como referência técnica.

```powershell
npm.cmd test
npm.cmd run check-translations
npm.cmd run rebuild-catalog
npm.cmd run build
npm.cmd run lint
```

Para atualizar as traduções após uma atualização do STIX, recolher primeiro os textos com `COLLECT_TRANSLATIONS=1` e executar `node scripts/build-mitre-catalog.mjs`. Essa execução escreve apenas em `.translation-work/`. A ferramenta `node scripts/translate-corpus.mjs` utiliza o serviço Google Translate (`pt-PT`) com marcadores para proteger o código e o glossário técnico; requer rede e guarda o progresso para permitir retomar. Rever o resultado antes de regenerar o catálogo final.

A cobertura integral e a preservação dos elementos técnicos são verificadas automaticamente. A revisão humana incide na terminologia, nos títulos, nas táticas e em amostras bilingues; não equivale a uma revisão humana frase a frase de todo o corpus.
