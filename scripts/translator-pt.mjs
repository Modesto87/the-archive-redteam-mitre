import { translateComplete } from './translation-store.mjs';
import { formatTechnicalProse } from './translation-format.mjs';

// Metadados editoriais. As descrições oficiais são traduzidas a partir do STIX.
export const TACTIC_METADATA_PT = {
  reconnaissance: {
    namePt: 'Reconhecimento',
    subtitle: 'OSINT, varrimento e mapeamento da superfície de ataque',
    pentesterRole: 'Mapear a infraestrutura, as identidades e os serviços expostos para identificar possíveis vetores de entrada.',
    color: '#00f0ff'
  },
  'resource-development': {
    namePt: 'Desenvolvimento de Recursos',
    subtitle: 'Infraestrutura C2, payloads e certificados',
    pentesterRole: 'Preparar a infraestrutura, os recursos e as ferramentas necessários à operação.',
    color: '#a855f7'
  },
  'initial-access': {
    namePt: 'Acesso Inicial',
    subtitle: 'Phishing, aplicações expostas e serviços remotos',
    pentesterRole: 'Obter o acesso inicial e avaliar a eficácia dos controlos perimetrais.',
    color: '#fcee0a'
  },
  execution: {
    namePt: 'Execução',
    subtitle: 'Interpretadores, scripts e Native API',
    pentesterRole: 'Executar código e avaliar as restrições impostas por AMSI, CLM, AppLocker e WDAC.',
    color: '#ff003c'
  },
  persistence: {
    namePt: 'Persistência',
    subtitle: 'Reinícios, backdoors e manutenção do acesso',
    pentesterRole: 'Avaliar a manutenção do acesso perante reinícios, alterações de credenciais e outros eventos de interrupção.',
    color: '#f97316'
  },
  'privilege-escalation': {
    namePt: 'Escalada de Privilégios',
    subtitle: 'SYSTEM/root, manipulação de tokens e elevação de permissões',
    pentesterRole: 'Avaliar caminhos de elevação de privilégios a partir de contas com permissões limitadas.',
    color: '#ff2a6d'
  },
  stealth: {
    namePt: 'Furtividade',
    subtitle: 'Process Injection, Masquerading e ofuscação',
    pentesterRole: 'Avaliar a deteção de comportamentos que ocultam a atividade sem modificar os sistemas defensivos.',
    color: '#00ff66'
  },
  'defense-impairment': {
    namePt: 'Degradação de Defesas',
    subtitle: 'Alteração de AMSI/ETW, EDR Unhooking e ferramentas de segurança',
    pentesterRole: 'Avaliar a resistência dos mecanismos de segurança à degradação, desativação e manipulação da telemetria.',
    color: '#e11d48'
  },
  'credential-access': {
    namePt: 'Acesso a Credenciais',
    subtitle: 'LSASS, Kerberoasting, NTDS e tokens',
    pentesterRole: 'Avaliar a proteção do material de autenticação, incluindo credenciais, hashes, tickets Kerberos e tokens.',
    color: '#eab308'
  },
  discovery: {
    namePt: 'Descoberta e Enumeração',
    subtitle: 'Active Directory, BloodHound e conhecimento do ambiente',
    pentesterRole: 'Mapear o sistema e a rede interna, os controlos de segurança e os possíveis caminhos de ataque.',
    color: '#38bdf8'
  },
  'lateral-movement': {
    namePt: 'Movimentação Lateral',
    subtitle: 'Pivoting, Pass-the-Hash/Ticket e serviços remotos',
    pentesterRole: 'Avaliar a possibilidade de aceder a outros sistemas e atravessar segmentos de rede com o acesso disponível.',
    color: '#06b6d4'
  },
  collection: {
    namePt: 'Recolha de Dados',
    subtitle: 'Repositórios, preparação de dados e Keylogging',
    pentesterRole: 'Identificar e reunir os dados relevantes para os objetivos da operação.',
    color: '#f472b6'
  },
  'command-and-control': {
    namePt: 'Command and Control (C2)',
    subtitle: 'Canais de comunicação, proxies e túneis',
    pentesterRole: 'Avaliar canais de comunicação com sistemas comprometidos e os controlos aplicados ao tráfego de saída.',
    color: '#10b981'
  },
  exfiltration: {
    namePt: 'Exfiltração',
    subtitle: 'Extração de dados por C2 e canais alternativos',
    pentesterRole: 'Avaliar o risco de extração de dados e a eficácia da inspeção do tráfego de saída e das soluções DLP.',
    color: '#3b82f6'
  },
  impact: {
    namePt: 'Impacto',
    subtitle: 'Interrupção operacional, ransomware e sabotagem',
    pentesterRole: 'Avaliar cenários de interrupção, destruição ou manipulação de sistemas e dados, nos limites da operação autorizada.',
    color: '#ef4444'
  }
};

export const translateTechniqueName = translateComplete;
export const translateTechnicalProse = text => formatTechnicalProse(translateComplete(text), translateComplete);
