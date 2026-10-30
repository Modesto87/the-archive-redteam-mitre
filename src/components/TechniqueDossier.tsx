import React, { useState, useMemo } from 'react';
import {
  X,
  ShieldAlert,
  Zap,
  Terminal,
  BookOpen,
  Eye,
  ExternalLink,
  Copy,
  Check,
  Bookmark,
  GitBranch,
  AlertTriangle,
  Crosshair,
  FileEdit,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Layers,
  Unlock
} from 'lucide-react';
import type { Technique, Tactic, IceBreakerScenario } from '../types/mitre';
import { RichTechnicalText } from './RichTechnicalText';
import { ArchiveRubberStamp } from './ArchiveArtwork';
import { cyberAudio } from '../utils/cyberAudio';

interface TechniqueDossierProps {
  technique: Technique | null;
  techniquesById: Map<string, Technique>;
  tactics: Tactic[];
  tacticsByShortname: Map<string, Tactic>;
  scenarios: IceBreakerScenario[];
  onClose?: () => void;
  onSelectTechnique: (id: string) => void;
  onJumpToScenario: (scenarioId: string) => void;
  onJumpToTactic?: (tacticShortname: string) => void;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  operatorNote: string;
  onChangeNote: (id: string, note: string) => void;
  inlineMode?: boolean;
  neighborIds?: { prevId: string | null; nextId: string | null };
}

type DossierSection = 'all' | 'bypass' | 'academic' | 'detection' | 'arsenal' | 'notes';

export const TechniqueDossier: React.FC<TechniqueDossierProps> = ({
  technique,
  techniquesById,
  tactics,
  tacticsByShortname,
  scenarios,
  onClose,
  onSelectTechnique,
  onJumpToScenario,
  onJumpToTactic,
  isBookmarked,
  onToggleBookmark,
  operatorNote,
  onChangeNote,
  inlineMode = false,
  neighborIds
}) => {
  const [activeSection, setActiveSection] = useState<DossierSection>('all');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const relatedScenarios = useMemo(() => {
    if (!technique) return [];
    const directMatches: IceBreakerScenario[] = [];
    const familyMatches: IceBreakerScenario[] = [];

    for (const scen of scenarios) {
      const hasDirect = scen.bypassSteps.some(st =>
        st.mitreIds.includes(technique.id)
      );
      if (hasDirect) {
        directMatches.push(scen);
        continue;
      }
      const hasParentOrSub = scen.bypassSteps.some(st =>
        st.mitreIds.some(
          mId =>
            (technique.parentId && mId.startsWith(technique.parentId)) ||
            mId.startsWith(technique.id + '.')
        )
      );
      if (hasParentOrSub) {
        familyMatches.push(scen);
      }
    }
    return [...directMatches, ...familyMatches].slice(0, 4);
  }, [technique, scenarios]);

  const killChainFlow = useMemo(() => {
    if (!technique || technique.tactics.length === 0) return null;
    const primaryShort = technique.tactics[0];
    const currentTac = tacticsByShortname.get(primaryShort);
    if (!currentTac) return null;

    const idx = tactics.findIndex(t => t.shortname === primaryShort);
    const prevTac = idx > 0 ? tactics[idx - 1] : null;
    const nextTac = idx >= 0 && idx < tactics.length - 1 ? tactics[idx + 1] : null;

    return { currentTac, prevTac, nextTac };
  }, [technique, tactics, tacticsByShortname]);

  if (!technique) return null;

  const parentTech = technique.parentId ? techniquesById.get(technique.parentId) : null;
  const subtechs =
    technique.isSubtechnique && parentTech
      ? parentTech.subtechniqueIds
          .map(id => techniquesById.get(id))
          .filter((t): t is Technique => Boolean(t))
      : technique.subtechniqueIds
          .map(id => techniquesById.get(id))
          .filter((t): t is Technique => Boolean(t));

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    cyberAudio.playClick();
    setCopiedCmd(text);
    setTimeout(() => setCopiedCmd(null), 1800);
  };

  const showBypass = activeSection === 'all' || activeSection === 'bypass';
  const showAcademic = activeSection === 'all' || activeSection === 'academic';
  const showDetection = activeSection === 'all' || activeSection === 'detection';
  const showArsenal = activeSection === 'all' || activeSection === 'arsenal';
  const showNotes = activeSection === 'all' || activeSection === 'notes';

  const volNum = killChainFlow
    ? String(killChainFlow.currentTac.order).padStart(2, '0')
    : '01';

  const contentBody = (
    <div
      className={`bg-[#f4efe6] text-[#161514] border-2 border-[#161514] flex flex-col overflow-hidden relative ${
        inlineMode ? 'h-full' : 'w-full max-w-5xl h-full shadow-2xl'
      }`}
    >
      {/* Barra de Topo Estilo Ficha Técnica de Arquivo */}
      <div className="px-4 py-2 bg-[#e3dccf] border-b border-[#161514] flex flex-wrap items-center justify-between gap-2 text-xs font-mono shrink-0">
        {killChainFlow && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-[#5c5852] uppercase tracking-wider">
              KILL CHAIN VOL. {volNum} //
            </span>
            {killChainFlow.prevTac && onJumpToTactic && (
              <button
                type="button"
                onClick={() => {
                  cyberAudio.playClick();
                  onJumpToTactic(killChainFlow.prevTac!.shortname);
                }}
                className="px-2 py-0.5 bg-[#f4efe6] hover:bg-[#161514] text-[#262421] hover:text-[#f4efe6] border border-[#161514] text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                title={`Ir para Volume anterior: ${killChainFlow.prevTac.namePt}`}
              >
                <ChevronLeft className="w-3 h-3" />
                VOL. {String(killChainFlow.prevTac.order).padStart(2, '0')} {killChainFlow.prevTac.namePt}
              </button>
            )}

            <span className="px-2 py-0.5 text-[11px] font-bold bg-[#b81d18] text-[#f4efe6] border border-[#161514]">
              VOL. {volNum} // {killChainFlow.currentTac.namePt.toUpperCase()}
            </span>

            {killChainFlow.nextTac && onJumpToTactic && (
              <button
                type="button"
                onClick={() => {
                  cyberAudio.playClick();
                  onJumpToTactic(killChainFlow.nextTac!.shortname);
                }}
                className="px-2 py-0.5 bg-[#f4efe6] hover:bg-[#b81d18] text-[#161514] hover:text-[#f4efe6] border border-[#161514] text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                title={`Avançar para próximo Volume: ${killChainFlow.nextTac.namePt}`}
              >
                PRÓXIMO: VOL. {String(killChainFlow.nextTac.order).padStart(2, '0')} {killChainFlow.nextTac.namePt}
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Navegação Rápida Técnica Anterior / Seguinte */}
        {neighborIds && (neighborIds.prevId || neighborIds.nextId) && (
          <div className="flex items-center gap-1.5 ml-auto">
            <button
              type="button"
              disabled={!neighborIds.prevId}
              onClick={() => {
                if (neighborIds.prevId) {
                  cyberAudio.playClick();
                  onSelectTechnique(neighborIds.prevId);
                }
              }}
              className={`px-2 py-0.5 text-[11px] border flex items-center gap-1 font-bold ${
                neighborIds.prevId
                  ? 'bg-[#f4efe6] text-[#161514] border-[#161514] hover:bg-[#161514] hover:text-[#f4efe6] cursor-pointer'
                  : 'opacity-40 cursor-not-allowed border-[#9c968b] text-[#9c968b]'
              }`}
            >
              <ChevronLeft className="w-3 h-3" /> {neighborIds.prevId || 'ANT'}
            </button>
            <button
              type="button"
              disabled={!neighborIds.nextId}
              onClick={() => {
                if (neighborIds.nextId) {
                  cyberAudio.playClick();
                  onSelectTechnique(neighborIds.nextId);
                }
              }}
              className={`px-2 py-0.5 text-[11px] border flex items-center gap-1 font-bold ${
                neighborIds.nextId
                  ? 'bg-[#f4efe6] text-[#161514] border-[#161514] hover:bg-[#161514] hover:text-[#f4efe6] cursor-pointer'
                  : 'opacity-40 cursor-not-allowed border-[#9c968b] text-[#9c968b]'
              }`}
            >
              {neighborIds.nextId || 'SEG'} <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Cabeçalho Editorial Estilo Capa "THE ARCHIVE" */}
      <div className="p-5 bg-[#ece6da] border-b-2 border-[#161514] shrink-0 relative overflow-hidden">
        {/* Carimbo Circular THE ARCHIVE • RED TEAM em Marca de Água */}
        <div className="hidden md:block absolute right-24 top-2 opacity-20 pointer-events-none">
          <ArchiveRubberStamp className="w-28 h-28" />
        </div>

        <div className="flex flex-wrap items-start justify-between gap-4 relative z-10">
          <div className="space-y-1.5 flex-1 min-w-[260px]">
            {/* Metadados Tipo Máquina de Escrever */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono tracking-wider uppercase text-[#4a4742]">
              <span>
                REF // <strong className="text-[#161514]">{technique.id}</strong>
              </span>
              <span>•</span>
              <span>
                CLASS // <strong className="text-[#b81d18]">TLP:AMBER</strong>
              </span>
              <span>•</span>
              <span>VER // {technique.version}</span>

              {technique.isSubtechnique && parentTech && (
                <button
                  type="button"
                  onClick={() => {
                    cyberAudio.playClick();
                    onSelectTechnique(parentTech.id);
                  }}
                  className="px-2 py-0.5 bg-[#161514] text-[#f4efe6] hover:bg-[#b81d18] text-[10px] font-mono font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <GitBranch className="w-3 h-3" />
                  PAI: {parentTech.id} ({parentTech.nameEn})
                </button>
              )}
            </div>

            {/* Título Principal em Slab Serif Pesada */}
            <h2 className="text-2xl md:text-3xl font-slab text-[#161514] uppercase leading-tight tracking-wide pt-1">
              {technique.fullNameEn}
            </h2>

            {/* Subtítulo em Português com Faixa Vermelha */}
            <div className="flex items-center gap-2 pt-0.5">
              <span className="w-5 h-1.5 bg-[#b81d18] inline-block shrink-0" />
              <p className="text-sm md:text-base font-condensed font-bold uppercase tracking-wider text-[#b81d18]">
                {technique.fullNamePt}
              </p>
            </div>

            {/* Plataformas e Táticas */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2">
              {technique.tactics.map(tShort => {
                const tac = tacticsByShortname.get(tShort);
                return (
                  <button
                    key={tShort}
                    type="button"
                    onClick={() => {
                      if (onJumpToTactic) {
                        cyberAudio.playClick();
                        onJumpToTactic(tShort);
                      }
                    }}
                    className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-[#161514] text-[#f4efe6] hover:bg-[#b81d18] cursor-pointer transition-colors"
                  >
                    {tac ? `${tac.id} • ${tac.namePt}` : tShort}
                  </button>
                );
              })}

              {technique.platforms.map(plat => (
                <span
                  key={plat}
                  className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-[#e3dccf] text-[#161514] border border-[#161514]/40 uppercase"
                >
                  {plat}
                </span>
              ))}
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                cyberAudio.playBreach();
                onToggleBookmark(technique.id);
              }}
              className={`px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider border-2 border-[#161514] flex items-center gap-1.5 transition-all cursor-pointer ${
                isBookmarked
                  ? 'bg-[#b81d18] text-[#f4efe6]'
                  : 'bg-[#f4efe6] text-[#161514] hover:bg-[#161514] hover:text-[#f4efe6]'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 fill-current" />
              {isBookmarked ? 'ARCHIVED IN KILL CHAIN' : '+ FIELD NOTES'}
            </button>

            {technique.url && (
              <a
                href={technique.url}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1.5 bg-[#f4efe6] text-[#161514] hover:bg-[#161514] hover:text-[#f4efe6] border-2 border-[#161514] text-xs font-mono font-bold flex items-center gap-1 transition-colors"
                title="Ver fonte original no MITRE ATT&CK"
              >
                MITRE <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 bg-[#b81d18] text-[#f4efe6] hover:bg-[#161514] border-2 border-[#161514] transition-colors cursor-pointer"
                title="Fechar Dossier (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Separadores de Secção Estilo Dossier Militar */}
        <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-[#161514]/30">
          {[
            { id: 'all', label: 'DOSSIER COMPLETO (UNIFICADO)', icon: Layers },
            { id: 'bypass', label: 'EVASÃO & DESBLOQUEIO', icon: Zap },
            { id: 'academic', label: 'MECÂNICA & CLI', icon: BookOpen },
            {
              id: 'detection',
              label: `TELEMETRIA & DEFESA (${technique.mitigations.length + technique.detections.length})`,
              icon: Eye
            },
            {
              id: 'arsenal',
              label: `ARSENAL & APTs (${technique.tools.length + technique.groups.length})`,
              icon: Terminal
            },
            {
              id: 'notes',
              label: `ANOTAÇÕES (${operatorNote ? '1' : '0'})`,
              icon: FileEdit
            }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  cyberAudio.playClick();
                  setActiveSection(tab.id as DossierSection);
                }}
                className={`px-3 py-1 text-[11px] font-mono font-bold tracking-wider flex items-center gap-1.5 transition-all cursor-pointer border border-[#161514] ${
                  isActive
                    ? tab.id === 'bypass'
                      ? 'bg-[#b81d18] text-[#f4efe6]'
                      : 'bg-[#161514] text-[#f4efe6]'
                    : 'bg-[#f4efe6] text-[#262421] hover:bg-[#dfd8c8]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Corpo Rolável do Dossier */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* 1. PÍLULAS DE NAVEGAÇÃO RÁPIDA ENTRE SUB-TÉCNICAS / VARIANTES */}
        {subtechs.length > 0 && (
          <div className="p-3.5 bg-[#ece6da] border border-[#161514] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-[#161514] flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-[#b81d18]" />
                {technique.isSubtechnique
                  ? `ÍNDICE DE VARIANTES DE ${parentTech?.id} (${subtechs.length}):`
                  : `SUB-TÉCNICAS ESPECIALIZADAS DE ${technique.id} (${subtechs.length}):`}
              </span>
              {technique.isSubtechnique && parentTech && (
                <button
                  type="button"
                  onClick={() => {
                    cyberAudio.playClick();
                    onSelectTechnique(parentTech.id);
                  }}
                  className="text-[11px] font-mono font-bold text-[#b81d18] hover:underline cursor-pointer"
                >
                  ↑ VER TÉCNICA PRINCIPAL ({parentTech.id})
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {subtechs.map(st => {
                const isCurrent = st.id === technique.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      if (!isCurrent) {
                        cyberAudio.playClick();
                        onSelectTechnique(st.id);
                      }
                    }}
                    className={`px-2.5 py-1 text-xs font-mono border border-[#161514] transition-all cursor-pointer flex items-center gap-1.5 ${
                      isCurrent
                        ? 'bg-[#b81d18] text-[#f4efe6] font-bold'
                        : 'bg-[#f4efe6] text-[#161514] hover:bg-[#161514] hover:text-[#f4efe6]'
                    }`}
                  >
                    <span className="font-bold">{st.id}</span>
                    <span>{st.nameEn}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. SECÇÃO ICE BREAKER & TRADECRAFT DE DESBLOQUEIO */}
        {showBypass && (
          <div className="space-y-4">
            {/* Playbooks ICE Breaker Interligados */}
            {relatedScenarios.length > 0 && (
              <div className="p-4 bg-[#ece6da] border-2 border-[#b81d18] space-y-3">
                <div className="flex items-center justify-between gap-2 border-b border-[#b81d18]/30 pb-2">
                  <span className="text-xs font-mono font-bold uppercase text-[#b81d18] flex items-center gap-1.5">
                    <Unlock className="w-4 h-4" />
                    FIELD MANUAL PLAYBOOKS // CENÁRIOS DE DESBLOQUEIO ASSOCIADOS ({relatedScenarios.length})
                  </span>
                  <span className="text-[10px] font-mono text-[#5c5852] uppercase">
                    CLIQUE PARA ABRIR O PROCEDIMENTO COMPLETO
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {relatedScenarios.map(scen => (
                    <div
                      key={scen.id}
                      className="p-3 bg-[#f4efe6] border border-[#161514] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 bg-[#b81d18] text-[#f4efe6] font-mono text-[10px] font-bold">
                            {scen.severity}
                          </span>
                          <span className="font-condensed font-bold text-base uppercase text-[#161514]">
                            {scen.title}
                          </span>
                        </div>
                        <p className="text-xs text-[#4a4742] font-mono line-clamp-1">
                          Defesa Ativa: {scen.defenseMechanism}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          cyberAudio.playBreach();
                          onJumpToScenario(scen.id);
                        }}
                        className="px-3 py-1.5 bg-[#161514] hover:bg-[#b81d18] text-[#f4efe6] font-mono text-xs font-bold uppercase shrink-0 cursor-pointer flex items-center gap-1 transition-colors"
                      >
                        ABRIR PLAYBOOK <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Matriz de Bloqueio vs Contorno da Técnica */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* O que bloqueia */}
              <div className="p-4 bg-[#ece6da] border border-[#161514] space-y-2.5">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#b81d18] flex items-center gap-1.5 border-b border-[#161514]/20 pb-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  OBSTÁCULOS DEFENSIVOS &amp; SINTOMAS DE BLOQUEIO
                </h4>
                <div className="space-y-2">
                  {technique.bypassGuide.blockers.map((blk, i) => (
                    <div
                      key={i}
                      className="p-2.5 bg-[#f4efe6] border-l-4 border-[#b81d18] text-xs text-[#161514]"
                    >
                      <RichTechnicalText text={blk} onSelectTechnique={onSelectTechnique} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Como contornar */}
              <div className="p-4 bg-[#ece6da] border border-[#161514] space-y-2.5">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#161514] flex items-center gap-1.5 border-b border-[#161514]/20 pb-1.5">
                  <Crosshair className="w-4 h-4 text-[#b81d18]" />
                  TRADECRAFT DE EVASÃO &amp; CONTORNO (BYPASS)
                </h4>
                <div className="space-y-2">
                  {technique.bypassGuide.bypasses.map((byp, i) => (
                    <div
                      key={i}
                      className="p-2.5 bg-[#f4efe6] border-l-4 border-[#161514] text-xs text-[#161514]"
                    >
                      <RichTechnicalText text={byp} onSelectTechnique={onSelectTechnique} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pontos Cegos de Telemetria */}
            {technique.bypassGuide.blindSpots.length > 0 && (
              <div className="p-4 bg-[#ece6da] border border-[#161514] space-y-2">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#8f1410] flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  PONTOS CEGOS DE TELEMETRIA &amp; WHITELISTS (MITRE MUTABLE ELEMENTS)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {technique.bypassGuide.blindSpots.map((bs, i) => (
                    <div
                      key={i}
                      className="p-2.5 bg-[#f4efe6] border border-[#161514]/30 text-xs"
                    >
                      <RichTechnicalText text={bs} onSelectTechnique={onSelectTechnique} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. SECÇÃO TEORIA ACADÊMICA & COMANDOS CLI */}
        {showAcademic && (
          <div className="space-y-4">
            {/* Comandos & Snippets Extraídos */}
            {technique.codeArtifacts.length > 0 && (
              <div className="p-4 bg-[#ece6da] border border-[#161514] space-y-2.5">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#161514] flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#b81d18]" />
                  COMANDOS, PRIMITIVAS &amp; SINTAXE DE CAMPO ({technique.codeArtifacts.length})
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {technique.codeArtifacts.map((cmd, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-3 p-2.5 bg-[#161514] text-[#f4efe6] border border-[#161514]"
                    >
                      <code className="text-xs font-mono text-[#f4efe6] break-all">{cmd}</code>
                      <button
                        type="button"
                        onClick={() => handleCopy(cmd)}
                        className="px-2.5 py-1 bg-[#b81d18] hover:bg-[#f4efe6] text-[#f4efe6] hover:text-[#161514] text-[10px] font-mono font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                      >
                        {copiedCmd === cmd ? (
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
                  ))}
                </div>
              </div>
            )}

            {/* Especificação Acadêmica Completa */}
            <div className="p-5 bg-[#f4efe6] border border-[#161514] space-y-3">
              <div className="flex items-center justify-between border-b-2 border-[#161514] pb-2">
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#161514] flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#b81d18]" />
                  FUNDAMENTAÇÃO ACADÊMICA &amp; MECÂNICA OPERACIONAL // {technique.id}
                </h3>
                <span className="text-[10px] font-mono text-[#b81d18] font-bold">
                  OFFENSIVE SECURITY FIELD NOTES
                </span>
              </div>
              <RichTechnicalText
                text={technique.descriptionPt}
                onSelectTechnique={onSelectTechnique}
              />
            </div>
          </div>
        )}

        {/* 4. SECÇÃO TELEMETRIA, DETEÇÃO & MITIGAÇÃO */}
        {showDetection && (
          <div className="space-y-4">
            <div className="p-4 bg-[#ece6da] border border-[#161514] space-y-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#161514] flex items-center gap-2 border-b border-[#161514]/25 pb-2">
                <Eye className="w-4 h-4 text-[#b81d18]" />
                ESTRATÉGIAS DE DETEÇÃO &amp; FONTES DE LOG ({technique.detections.length})
              </h3>

              {technique.detections.length === 0 ? (
                <p className="text-xs text-[#4a4742] font-mono">
                  Sem analítica de deteção isolada; consulte a técnica principal ou volume associado.
                </p>
              ) : (
                <div className="space-y-3">
                  {technique.detections.map(det => (
                    <div key={det.id} className="p-3 bg-[#f4efe6] border border-[#161514] space-y-2">
                      <span className="font-mono text-xs font-bold text-[#b81d18]">
                        {det.id} // {det.name}
                      </span>
                      {det.analytics.map(an => (
                        <div
                          key={an.id}
                          className="p-2.5 bg-[#ece6da] border-l-4 border-[#161514] space-y-1.5"
                        >
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] font-mono font-bold text-[#161514]">
                              {an.id}
                            </span>
                            {an.platforms.map(p => (
                              <span
                                key={p}
                                className="text-[10px] font-mono px-1.5 py-0.2 bg-[#161514] text-[#f4efe6]"
                              >
                                {p}
                              </span>
                            ))}
                          </div>
                          <RichTechnicalText
                            text={an.descriptionPt}
                            onSelectTechnique={onSelectTechnique}
                          />
                          {an.logSources.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {an.logSources.map((ls, idx) => (
                                <span
                                  key={idx}
                                  className="px-1.5 py-0.5 text-[10px] font-mono bg-[#161514] text-[#f4efe6]"
                                >
                                  LOG: {ls.name} → {ls.channel}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {technique.mitigations.length > 0 && (
              <div className="p-4 bg-[#ece6da] border border-[#161514] space-y-3">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#161514] flex items-center gap-2 border-b border-[#161514]/25 pb-2">
                  <ShieldAlert className="w-4 h-4 text-[#b81d18]" />
                  MITIGAÇÕES OFICIAIS ({technique.mitigations.length}) &amp; NOTAS DE CONTORNO
                </h3>
                <div className="space-y-2.5">
                  {technique.mitigations.map(mit => (
                    <div key={mit.id} className="p-3 bg-[#f4efe6] border border-[#161514] space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-[#161514] text-[#f4efe6] font-mono text-xs font-bold">
                          {mit.id}
                        </span>
                        <h4 className="font-bold text-[#161514] text-sm">{mit.name}</h4>
                      </div>
                      <RichTechnicalText
                        text={mit.descriptionPt}
                        onSelectTechnique={onSelectTechnique}
                      />
                      {mit.bypassHint && (
                        <div className="p-2.5 bg-[#b81d18]/10 border-l-4 border-[#b81d18] text-xs">
                          <span className="font-mono font-bold text-[#b81d18] block mb-0.5">
                            ▪ NOTA DE CAMPO // BYPASS DE {mit.id}:
                          </span>
                          <RichTechnicalText
                            text={mit.bypassHint}
                            onSelectTechnique={onSelectTechnique}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. SECÇÃO FERRAMENTAS, APTs & REFERÊNCIAS */}
        {showArsenal && (
          <div className="space-y-4">
            {technique.tools.length > 0 && (
              <div className="p-4 bg-[#ece6da] border border-[#161514] space-y-2.5">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#161514] flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#b81d18]" />
                  ARSENAL OFENSIVO &amp; SOFTWARE ({technique.tools.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {technique.tools.map(tool => (
                    <div key={tool.id} className="p-3 bg-[#f4efe6] border border-[#161514] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-[#b81d18]">
                          {tool.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#161514] text-[#f4efe6]">
                          {tool.id} // {tool.type}
                        </span>
                      </div>
                      {tool.procedurePt && (
                        <p className="text-xs text-[#262421] leading-relaxed">{tool.procedurePt}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {technique.groups.length > 0 && (
              <div className="p-4 bg-[#ece6da] border border-[#161514] space-y-2.5">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#b81d18] flex items-center gap-2">
                  <Crosshair className="w-4 h-4" />
                  OPERAÇÕES ADVERSÁRIAS / GRUPOS APT ({technique.groups.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {technique.groups.map(grp => (
                    <div key={grp.id} className="p-3 bg-[#f4efe6] border border-[#161514] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-[#161514]">
                          {grp.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#b81d18] text-[#f4efe6]">
                          {grp.id}
                        </span>
                      </div>
                      {grp.procedurePt && (
                        <p className="text-xs text-[#262421] leading-relaxed">{grp.procedurePt}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {technique.references.length > 0 && (
              <div className="p-4 bg-[#ece6da] border border-[#161514] space-y-2">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#161514] flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#b81d18]" />
                  BIBLIOGRAFIA ACADÊMICA &amp; FONTES TÉCNICAS
                </h3>
                <div className="space-y-1.5">
                  {technique.references.map((ref, idx) => (
                    <a
                      key={idx}
                      href={ref.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-start justify-between gap-2 p-2.5 bg-[#f4efe6] border border-[#161514] hover:bg-[#161514] hover:text-[#f4efe6] transition-colors group"
                    >
                      <div className="text-xs">
                        <span className="font-mono font-bold text-[#b81d18] group-hover:text-[#f4efe6] mr-2">
                          [{ref.source}]
                        </span>
                        <span>{ref.description}</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 6. SECÇÃO NOTAS DO OPERADOR */}
        {showNotes && (
          <div className="p-4 bg-[#ece6da] border-2 border-[#161514] space-y-2.5">
            <h3 className="text-xs font-mono font-bold text-[#161514] uppercase flex items-center gap-1.5">
              <FileEdit className="w-4 h-4 text-[#b81d18]" />
              REGISTO DE CAMPO DO OPERADOR (FIELD NOTES // {technique.id})
            </h3>
            <textarea
              value={operatorNote}
              onChange={e => onChangeNote(technique.id, e.target.value)}
              placeholder={`Registe evidências, hosts comprometidos, comandos executados ou observações para ${technique.id}...`}
              rows={5}
              className="w-full p-3 bg-[#f4efe6] border border-[#161514] text-xs font-mono text-[#161514] placeholder:text-[#7a756c] outline-none resize-y"
            />
          </div>
        )}
      </div>
    </div>
  );

  if (inlineMode) {
    return contentBody;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      <div className="flex-1 cursor-pointer" onClick={onClose} />
      {contentBody}
    </div>
  );
};
