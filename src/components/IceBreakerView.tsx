import React, { useState, useMemo } from 'react';
import {
  Terminal,
  Search,
  Copy,
  Check,
  ChevronRight,
  Cpu,
  Lock,
  Unlock,
  Layers,
  AlertOctagon,
  BookOpen
} from 'lucide-react';
import type {
  IceBreakerScenario,
  LolbasEntry,
  MitigationBypassEntry,
  Technique
} from '../types/mitre';
import { ArchiveRubberStamp } from './ArchiveArtwork';
import { cyberAudio } from '../utils/cyberAudio';

interface IceBreakerViewProps {
  scenarios: IceBreakerScenario[];
  lolbasArsenal: LolbasEntry[];
  mitigationBypassMap: Record<string, MitigationBypassEntry>;
  techniquesById: Map<string, Technique>;
  onSelectTechnique: (id: string, openModal?: boolean) => void;
  selectedScenarioId: string;
  onSelectScenarioId: (id: string) => void;
}

export const IceBreakerView: React.FC<IceBreakerViewProps> = ({
  scenarios,
  lolbasArsenal,
  mitigationBypassMap,
  techniquesById,
  onSelectTechnique,
  selectedScenarioId,
  onSelectScenarioId
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [subMode, setSubMode] = useState<'scenarios' | 'lolbas' | 'mitigations'>('scenarios');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [quickPreviewTechId, setQuickPreviewTechId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    scenarios.forEach(s => set.add(s.category));
    return ['ALL', ...Array.from(set)];
  }, [scenarios]);

  const filteredScenarios = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return scenarios.filter(s => {
      if (selectedCategory !== 'ALL' && s.category !== selectedCategory) return false;
      if (!q) return true;
      return (
        s.title.toLowerCase().includes(q) ||
        s.symptom.toLowerCase().includes(q) ||
        s.defenseMechanism.toLowerCase().includes(q) ||
        s.academicContext.toLowerCase().includes(q) ||
        s.lolbasTools.some(t => t.toLowerCase().includes(q)) ||
        s.bypassSteps.some(
          st =>
            st.title.toLowerCase().includes(q) ||
            st.description.toLowerCase().includes(q) ||
            st.command.toLowerCase().includes(q) ||
            st.mitreIds.some(id => id.toLowerCase().includes(q))
        )
      );
    });
  }, [scenarios, selectedCategory, searchQuery]);

  const activeScenario = useMemo(() => {
    return (
      filteredScenarios.find(s => s.id === selectedScenarioId) ||
      scenarios.find(s => s.id === selectedScenarioId) ||
      filteredScenarios[0] ||
      null
    );
  }, [filteredScenarios, scenarios, selectedScenarioId]);

  const quickPreviewTech = quickPreviewTechId
    ? techniquesById.get(quickPreviewTechId) || null
    : null;

  const handleCopy = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    cyberAudio.playClick();
    setCopiedText(cmd);
    setTimeout(() => setCopiedText(null), 1800);
  };

  return (
    <div className="space-y-5">
      {/* Banner Editorial Estilo Capa "THE ARCHIVE — EVASION & BYPASS" */}
      <div className="p-6 bg-[#f4efe6] border-2 border-[#161514] relative overflow-hidden">
        <div className="hidden xl:block absolute right-8 top-1/2 -translate-y-1/2 opacity-25">
          <ArchiveRubberStamp className="w-32 h-32" />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-4">
              <div className="flex items-baseline gap-1.5">
                <span className="font-archive-serif font-black text-2xl text-[#161514]">
                  VOL.
                </span>
                <span className="font-archive-serif font-black text-5xl text-[#b81d18] leading-none">
                  SP
                </span>
              </div>
              <div className="h-10 w-0.5 bg-[#161514]" />
              <div className="text-[10px] font-mono font-bold tracking-[0.22em] uppercase text-[#161514] leading-snug">
                <div>EVASÃO DE DEFESAS</div>
                <div>PROCEDIMENTOS DE DESBLOQUEIO</div>
                <div>LOLBAS &amp; GTFOBINS</div>
                <div>PRÁTICAS DE OPSEC</div>
              </div>
            </div>

            <h2 className="text-3xl md:text-4xl font-slab uppercase text-[#161514] tracking-wide">
              MANUAL DE EVASÃO E DESBLOQUEIO
            </h2>

            <div className="border-t-2 border-[#161514] border-b-2 border-b-[#b81d18] py-1.5">
              <div className="font-condensed font-bold text-sm tracking-[0.25em] uppercase text-[#161514]">
                NOTAS DE CAMPO DE SEGURANÇA OFENSIVA // QUANDO O PENTESTER ESTÁ BLOQUEADO
              </div>
              <div className="font-mono font-bold text-[10.5px] tracking-[0.18em] uppercase text-[#b81d18]">
                AMSI • RUNASPPL • EDR HOOKS • APPLOCKER • PROTECTED USERS • FIREWALL EGRESS • MFA • WAF
              </div>
            </div>
          </div>

          {/* Seletor de Sub-Modo */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 xl:mr-28">
            {[
              { id: 'scenarios', label: '01 // 16 PROCEDIMENTOS DE DESBLOQUEIO', icon: Unlock },
              { id: 'lolbas', label: '02 // ARSENAL LOLBAS & GTFOBINS', icon: Terminal },
              { id: 'mitigations', label: '03 // MATRIZ ANTI-MITIGAÇÃO (M1xxx)', icon: Layers }
            ].map(tab => {
              const Icon = tab.icon;
              const active = subMode === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    cyberAudio.playClick();
                    setSubMode(tab.id as 'scenarios' | 'lolbas' | 'mitigations');
                  }}
                  className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider border-2 border-[#161514] flex items-center gap-2 transition-all cursor-pointer ${
                    active
                      ? 'bg-[#b81d18] text-[#f4efe6]'
                      : 'bg-[#ece6da] text-[#161514] hover:bg-[#161514] hover:text-[#f4efe6]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODO 1: 16 CENÁRIOS DE BLOQUEIO INTERATIVOS */}
      {subMode === 'scenarios' && (
        <div className="space-y-4">
          {/* Barra de Pesquisa de Sintoma/Bloqueio e Categorias */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-[#e3dccf] p-3.5 border-2 border-[#161514]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#b81d18] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Pesquisar bloqueio, código de erro ou defesa (ex: AMSI, RunAsPPL, 0x00000005, AppLocker, SMB 445, Protected Users, WAF, MFA)..."
                className="w-full pl-10 pr-4 py-2 bg-[#f4efe6] border border-[#161514] text-xs md:text-sm font-mono text-[#161514] placeholder:text-[#6e6a63] outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    cyberAudio.playClick();
                    setSelectedCategory(cat);
                  }}
                  className={`px-2.5 py-1 text-[11px] font-mono font-bold uppercase border border-[#161514] transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#161514] text-[#f4efe6]'
                      : 'bg-[#f4efe6] text-[#262421] hover:bg-[#d8d0c0]'
                  }`}
                >
                  {cat === 'ALL' ? 'TODOS (16)' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Layout Master-Detail dos Cenários de Bloqueio */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Coluna Esquerda: Lista de Obstáculos */}
            <div className="lg:col-span-4 space-y-2 max-h-[76vh] overflow-y-auto pr-1">
              {filteredScenarios.map((scen, idx) => {
                const isSelected = activeScenario?.id === scen.id;
                return (
                  <button
                    key={scen.id}
                    type="button"
                    onClick={() => {
                      cyberAudio.playBreach();
                      onSelectScenarioId(scen.id);
                    }}
                    className={`w-full text-left p-3.5 border-2 transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'bg-[#f4efe6] border-[#b81d18] shadow-sm'
                        : 'bg-[#f4efe6] border-[#161514] hover:bg-[#e3dccf]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 bg-[#161514] text-[#f4efe6]">
                        CASO #{String(idx + 1).padStart(2, '0')} // {scen.category}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 ${
                          scen.severity === 'CRÍTICO'
                            ? 'bg-[#b81d18] text-[#f4efe6]'
                            : 'bg-[#e3dccf] text-[#161514] border border-[#161514]'
                        }`}
                      >
                        {scen.severity}
                      </span>
                    </div>

                    <h3 className="font-condensed font-bold text-base uppercase text-[#161514] group-hover:text-[#b81d18] transition-colors flex items-center justify-between gap-2">
                      <span>{scen.title}</span>
                      <ChevronRight
                        className={`w-4 h-4 shrink-0 transition-transform ${
                          isSelected ? 'text-[#b81d18] translate-x-1' : 'text-[#5c5852]'
                        }`}
                      />
                    </h3>

                    <p className="text-[11px] text-[#4a4742] mt-1 line-clamp-2 font-mono">
                      {scen.symptom}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Coluna Direita: Plano de Desbloqueio Tático + Quick-Peek de Técnica */}
            <div className="lg:col-span-8 space-y-4">
              {activeScenario ? (
                <div className="bg-[#f4efe6] border-2 border-[#161514] p-6 space-y-5">
                  {/* Cabeçalho do Cenário */}
                  <div className="border-b-2 border-[#161514] pb-4 space-y-2.5">
                    <span className="inline-flex px-2.5 py-1 bg-[#b81d18] text-[#f4efe6] font-mono text-xs font-bold items-center gap-1.5 uppercase">
                      <Lock className="w-3.5 h-3.5" />
                      DEFESA ATIVA: {activeScenario.defenseMechanism}
                    </span>

                    <h3 className="text-2xl md:text-3xl font-slab uppercase text-[#161514] leading-tight">
                      {activeScenario.title}
                    </h3>

                    <div className="p-3 bg-[#ece6da] border-l-4 border-[#b81d18] text-xs font-mono text-[#161514]">
                      <strong className="text-[#b81d18] uppercase block mb-0.5">
                        [!] SINTOMA / BLOQUEIO OBSERVADO EM CAMPO:
                      </strong>
                      {activeScenario.symptom}
                    </div>

                    <div className="p-3 bg-[#ece6da] border-l-4 border-[#161514] text-xs md:text-sm text-[#262421] leading-relaxed">
                      <strong className="text-[#161514] font-mono text-xs uppercase block mb-1 flex items-center gap-1.5">
                        <Cpu className="w-4 h-4 text-[#b81d18]" />
                        ANÁLISE ACADÉMICA &amp; MECÂNICA DA DEFESA:
                      </strong>
                      {activeScenario.academicContext}
                    </div>
                  </div>

                  {/* Quick-Preview Inline da Técnica clicada */}
                  {quickPreviewTech && (
                    <div className="p-4 bg-[#e3dccf] border-2 border-[#b81d18] space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-[#b81d18] text-[#f4efe6] font-mono text-xs font-bold">
                            {quickPreviewTech.id}
                          </span>
                          <h4 className="font-condensed font-bold text-lg uppercase text-[#161514]">
                            {quickPreviewTech.fullNamePt}
                          </h4>
                          <span className="text-xs font-mono text-[#4a4742]">
                            MITRE: {quickPreviewTech.fullNameEn}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              cyberAudio.playDossierOpen();
                              onSelectTechnique(quickPreviewTech.id, true);
                            }}
                            className="px-3 py-1 bg-[#161514] hover:bg-[#b81d18] text-[#f4efe6] font-mono text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <BookOpen className="w-3.5 h-3.5" /> ABRIR DOSSIER COMPLETO
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuickPreviewTechId(null)}
                            className="px-2 py-1 bg-[#f4efe6] text-[#161514] border border-[#161514] font-mono text-xs cursor-pointer"
                          >
                            FECHAR [X]
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-[#262421] line-clamp-3 leading-relaxed">
                        {quickPreviewTech.descriptionPt.replace(/[*`]/g, '')}
                      </p>
                    </div>
                  )}

                  {/* Vetores de Bypass Passo-a-Passo */}
                  <div className="space-y-3.5">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-[#b81d18] flex items-center gap-2">
                      <Unlock className="w-4 h-4" />
                      PROCEDIMENTOS DE CONTORNO ({activeScenario.bypassSteps.length} METODOLOGIAS)
                    </h4>

                    {activeScenario.bypassSteps.map((step, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-[#ece6da] border border-[#161514] space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#161514]/20 pb-2">
                          <h5 className="font-condensed font-bold text-lg uppercase text-[#161514]">
                            {step.title}
                          </h5>
                          <span className="px-2 py-0.5 text-[11px] font-mono font-bold bg-[#161514] text-[#f4efe6]">
                            OPSEC // {step.opsecRisk}
                          </span>
                        </div>

                        <p className="text-sm text-[#262421] leading-relaxed">{step.description}</p>

                        {/* Bloco de Comando / Tradecraft */}
                        <div className="relative bg-[#161514] text-[#f4efe6] p-3 font-mono text-xs overflow-x-auto">
                          <div className="flex items-start justify-between gap-3">
                            <pre className="whitespace-pre-wrap break-all flex-1">{step.command}</pre>
                            <button
                              type="button"
                              onClick={() => handleCopy(step.command)}
                              className="px-2.5 py-1 bg-[#b81d18] hover:bg-[#f4efe6] text-[#f4efe6] hover:text-[#161514] text-[10px] font-mono font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                            >
                              {copiedText === step.command ? (
                                <>
                                  <Check className="w-3 h-3" /> COPIADO
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" /> COPIAR
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Técnicas MITRE Relacionadas */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[11px] font-mono font-bold text-[#4a4742] uppercase mr-1">
                            REF MITRE:
                          </span>
                          {step.mitreIds.map(mId => {
                            const tech = techniquesById.get(mId);
                            const isPreviewed = quickPreviewTechId === mId;
                            return (
                              <div key={mId} className="inline-flex items-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    cyberAudio.playClick();
                                    setQuickPreviewTechId(isPreviewed ? null : mId);
                                  }}
                                  className={`px-2 py-1 text-xs font-mono font-bold border border-[#161514] transition-colors cursor-pointer flex items-center gap-1 ${
                                    isPreviewed
                                      ? 'bg-[#b81d18] text-[#f4efe6]'
                                      : 'bg-[#f4efe6] hover:bg-[#161514] text-[#161514] hover:text-[#f4efe6]'
                                  }`}
                                  title="Clique para pré-visualizar aqui mesmo"
                                >
                                  <span>{mId}</span>
                                  {tech && (
                                    <span className="text-[11px] opacity-85 font-normal">
                                      ({tech.namePt})
                                    </span>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    cyberAudio.playDossierOpen();
                                    onSelectTechnique(mId, true);
                                  }}
                                  className="px-1.5 py-1 bg-[#161514] hover:bg-[#b81d18] text-[#f4efe6] border-y border-r border-[#161514] text-[10px] font-mono font-bold cursor-pointer transition-colors"
                                  title="Abrir Dossier completo desta técnica"
                                >
                                  ↗
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Binários LOLBAS / GTFOBins Recomendados */}
                  {activeScenario.lolbasTools.length > 0 && (
                    <div className="p-3.5 bg-[#e3dccf] border border-[#161514] flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#b81d18] uppercase mr-1">
                        BINÁRIOS LIVING-OFF-THE-LAND (LOLBAS / GTFOBINS):
                      </span>
                      {activeScenario.lolbasTools.map(bin => (
                        <span
                          key={bin}
                          className="px-2 py-0.5 bg-[#f4efe6] text-[#161514] border border-[#161514] font-mono text-xs font-bold"
                        >
                          {bin}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-12 bg-[#f4efe6] border-2 border-[#161514] text-center text-[#4a4742] font-mono">
                  Nenhum cenário encontrado para o filtro atual.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODO 2: ARSENAL LOLBAS & GTFOBINS */}
      {subMode === 'lolbas' && (
        <div className="bg-[#f4efe6] border-2 border-[#161514] p-6 space-y-4">
          <div className="border-b-2 border-[#161514] pb-4">
            <h3 className="text-2xl font-slab uppercase text-[#161514]">
              ARSENAL LIVING-OFF-THE-LAND (LOLBAS &amp; GTFOBINS)
            </h3>
            <p className="text-sm text-[#262421]">
              Binários nativos assinados pelo fabricante presentes por omissão no Windows e Linux para contornar Application Whitelisting (AppLocker/WDAC).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lolbasArsenal.map((item, idx) => (
              <div
                key={idx}
                className="p-4 bg-[#ece6da] border border-[#161514] space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-base text-[#b81d18]">
                    {item.binary}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-xs font-mono bg-[#e3dccf] text-[#161514] border border-[#161514]">
                      {item.platform}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        cyberAudio.playDossierOpen();
                        onSelectTechnique(item.mitreId, true);
                      }}
                      className="px-2 py-0.5 text-xs font-mono font-bold bg-[#161514] text-[#f4efe6] cursor-pointer hover:bg-[#b81d18]"
                    >
                      {item.mitreId} ↗
                    </button>
                  </div>
                </div>

                <p className="text-sm text-[#262421]">{item.purpose}</p>

                <div className="flex items-center justify-between gap-2 p-2.5 bg-[#161514] text-[#f4efe6]">
                  <code className="text-xs font-mono break-all">{item.syntax}</code>
                  <button
                    type="button"
                    onClick={() => handleCopy(item.syntax)}
                    className="px-2 py-1 bg-[#b81d18] text-[#f4efe6] text-[10px] font-mono font-bold shrink-0 cursor-pointer"
                  >
                    {copiedText === item.syntax ? 'COPIADO' : 'COPIAR'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODO 3: MATRIZ ANTI-MITIGAÇÃO OFICIAL (M1xxx) */}
      {subMode === 'mitigations' && (
        <div className="bg-[#f4efe6] border-2 border-[#161514] p-6 space-y-4">
          <div className="border-b-2 border-[#161514] pb-4">
            <h3 className="text-2xl font-slab uppercase text-[#b81d18] flex items-center gap-2">
              <AlertOctagon className="w-6 h-6 text-[#161514]" />
              MATRIZ DE CONTORNO DE MITIGAÇÕES OFICIAIS MITRE (M1xxx)
            </h3>
            <p className="text-sm text-[#262421] mt-1">
              Mapeamento direto entre cada classe de defesa corporativa do MITRE ATT&amp;CK e as técnicas ofensivas recomendadas para a superar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(mitigationBypassMap).map(([mId, entry]) => (
              <div key={mId} className="p-5 bg-[#ece6da] border border-[#161514] space-y-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-[#b81d18] text-[#f4efe6] font-mono text-xs font-bold">
                    {mId}
                  </span>
                  <h4 className="font-condensed font-bold uppercase text-[#161514] text-base">
                    {entry.defenseName}
                  </h4>
                </div>

                <div className="p-2.5 bg-[#f4efe6] border-l-4 border-[#b81d18] text-xs font-mono text-[#161514]">
                  <strong>Sintoma de Bloqueio:</strong> {entry.blockerSymptom}
                </div>

                <p className="text-sm text-[#262421] leading-relaxed">
                  <strong className="text-[#b81d18] font-mono text-xs block uppercase mb-1">
                    Estratégia de Evasão &amp; Contorno:
                  </strong>
                  {entry.bypassStrategyPt}
                </p>

                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#161514]/25">
                  <span className="text-[11px] font-mono font-bold text-[#4a4742] mr-1">
                    TÉCNICAS DE CONTORNO:
                  </span>
                  {entry.recommendedTechniques.map(tId => {
                    const t = techniquesById.get(tId);
                    return (
                      <button
                        key={tId}
                        type="button"
                        onClick={() => {
                          cyberAudio.playDossierOpen();
                          onSelectTechnique(tId, true);
                        }}
                        className="px-2 py-0.5 bg-[#f4efe6] hover:bg-[#161514] text-[#161514] hover:text-[#f4efe6] border border-[#161514] text-xs font-mono font-bold transition-colors cursor-pointer"
                        title={t ? `${t.fullNameEn} (${t.fullNamePt})` : tId}
                      >
                        {tId} {t ? `// ${t.nameEn}` : ''} ↗
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
