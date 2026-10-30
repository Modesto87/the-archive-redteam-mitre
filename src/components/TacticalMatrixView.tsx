import React, { useState, useMemo, useRef } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Bookmark,
  Layers,
  Maximize2,
  Minimize2,
  Filter,
  Columns,
  Grid,
  Terminal,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import type { Tactic, Technique, IceBreakerScenario } from '../types/mitre';
import { TechniqueDossier } from './TechniqueDossier';
import { ArchiveRubberStamp, ArchiveDeltaSymbol } from './ArchiveArtwork';
import { cyberAudio } from '../utils/cyberAudio';

interface TacticalMatrixViewProps {
  tactics: Tactic[];
  techniques: Technique[];
  techniquesById: Map<string, Technique>;
  tacticsByShortname: Map<string, Tactic>;
  scenarios: IceBreakerScenario[];
  selectedPlatform: string;
  onChangePlatform: (plat: string) => void;
  platforms: string[];
  searchQuery: string;
  selectedTechniqueId: string | null;
  onSelectTechnique: (id: string) => void;
  onJumpToScenario: (scenarioId: string) => void;
  bookmarkedIds: Set<string>;
  onToggleBookmark: (id: string) => void;
  notesByTechniqueId: Record<string, string>;
  onChangeNote: (id: string, note: string) => void;
  activeTacticFocus: string;
  onChangeTacticFocus: (tacticShortname: string) => void;
}

export const TacticalMatrixView: React.FC<TacticalMatrixViewProps> = ({
  tactics,
  techniques,
  techniquesById,
  tacticsByShortname,
  scenarios,
  selectedPlatform,
  onChangePlatform,
  platforms,
  searchQuery,
  selectedTechniqueId,
  onSelectTechnique,
  onJumpToScenario,
  bookmarkedIds,
  onToggleBookmark,
  notesByTechniqueId,
  onChangeNote,
  activeTacticFocus,
  onChangeTacticFocus
}) => {
  const [layoutMode, setLayoutMode] = useState<'cockpit' | 'panorama'>('cockpit');
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());
  const [compactMode, setCompactMode] = useState<boolean>(false);

  const matrixScrollRef = useRef<HTMLDivElement>(null);
  const columnRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const matchingTechIds = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const matched = new Set<string>();

    for (const t of techniques) {
      if (selectedPlatform !== 'ALL' && !t.platforms.includes(selectedPlatform)) {
        continue;
      }
      if (q) {
        const hit =
          t.id.toLowerCase().includes(q) ||
          t.nameEn.toLowerCase().includes(q) ||
          t.namePt.toLowerCase().includes(q) ||
          t.fullNameEn.toLowerCase().includes(q) ||
          t.fullNamePt.toLowerCase().includes(q) ||
          t.tools.some(tl => tl.name.toLowerCase().includes(q));
        if (!hit) continue;
      }
      matched.add(t.id);
      if (t.parentId) {
        matched.add(t.parentId);
      }
    }
    return matched;
  }, [techniques, selectedPlatform, searchQuery]);

  const parentTechniquesByTactic = useMemo(() => {
    const map = new Map<string, Technique[]>();
    for (const tac of tactics) {
      map.set(tac.shortname, []);
    }

    for (const t of techniques) {
      if (t.isSubtechnique) continue;
      if (!matchingTechIds.has(t.id)) continue;

      for (const tacShort of t.tactics) {
        const list = map.get(tacShort);
        if (list) {
          list.push(t);
        }
      }
    }

    for (const [, list] of map) {
      list.sort((a, b) => a.id.localeCompare(b.id));
    }

    return map;
  }, [tactics, techniques, matchingTechIds]);

  const effectiveCockpitTactic = useMemo(() => {
    if (activeTacticFocus !== 'ALL') {
      return tacticsByShortname.get(activeTacticFocus) || tactics[0];
    }
    return null;
  }, [activeTacticFocus, tacticsByShortname, tactics]);

  const cockpitParentList = useMemo(() => {
    if (effectiveCockpitTactic) {
      return parentTechniquesByTactic.get(effectiveCockpitTactic.shortname) || [];
    }
    return techniques
      .filter(t => !t.isSubtechnique && matchingTechIds.has(t.id))
      .sort((a, b) => a.id.localeCompare(b.id));
  }, [effectiveCockpitTactic, parentTechniquesByTactic, techniques, matchingTechIds]);

  const activeCockpitTechnique = useMemo(() => {
    if (selectedTechniqueId && techniquesById.has(selectedTechniqueId)) {
      return techniquesById.get(selectedTechniqueId)!;
    }
    if (cockpitParentList.length > 0) {
      return cockpitParentList[0];
    }
    return techniques[0] || null;
  }, [selectedTechniqueId, techniquesById, cockpitParentList, techniques]);

  const neighborIds = useMemo(() => {
    if (!activeCockpitTechnique) return { prevId: null, nextId: null };
    const flatIds: string[] = [];
    for (const p of cockpitParentList) {
      flatIds.push(p.id);
      for (const sId of p.subtechniqueIds) {
        if (matchingTechIds.has(sId)) flatIds.push(sId);
      }
    }
    const idx = flatIds.indexOf(activeCockpitTechnique.id);
    if (idx === -1) return { prevId: null, nextId: null };
    return {
      prevId: idx > 0 ? flatIds[idx - 1] : null,
      nextId: idx < flatIds.length - 1 ? flatIds[idx + 1] : null
    };
  }, [activeCockpitTechnique, cockpitParentList, matchingTechIds]);

  const tacticScenarios = useMemo(() => {
    if (!effectiveCockpitTactic) return scenarios.slice(0, 4);
    const tShort = effectiveCockpitTactic.shortname;
    return scenarios.filter(scen =>
      scen.bypassSteps.some(st =>
        st.mitreIds.some(mId => {
          const tech = techniquesById.get(mId);
          return tech?.tactics.includes(tShort);
        })
      )
    );
  }, [effectiveCockpitTactic, scenarios, techniquesById]);

  const handleSelectTacticRibbon = (shortname: string) => {
    cyberAudio.playClick();
    onChangeTacticFocus(shortname);

    if (layoutMode === 'panorama' && shortname !== 'ALL') {
      const colEl = columnRefs.current[shortname];
      if (colEl) {
        colEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    } else if (layoutMode === 'cockpit' && shortname !== 'ALL') {
      const list = parentTechniquesByTactic.get(shortname) || [];
      if (list.length > 0) {
        onSelectTechnique(list[0].id);
      }
    }
  };

  const scrollPanorama = (dir: 'left' | 'right') => {
    if (!matrixScrollRef.current) return;
    matrixScrollRef.current.scrollBy({
      left: dir === 'left' ? -580 : 580,
      behavior: 'smooth'
    });
  };

  const toggleExpandParent = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    cyberAudio.playClick();
    setExpandedParents(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const expandAll = () => {
    cyberAudio.playClick();
    const allKeys = new Set<string>();
    for (const tac of tactics) {
      const list = parentTechniquesByTactic.get(tac.shortname) || [];
      for (const p of list) {
        if (p.subtechniqueIds.length > 0) {
          allKeys.add(`${tac.shortname}:${p.id}`);
          allKeys.add(`cockpit:${p.id}`);
        }
      }
    }
    setExpandedParents(allKeys);
  };

  const collapseAll = () => {
    cyberAudio.playClick();
    setExpandedParents(new Set());
  };

  const volNumber = effectiveCockpitTactic
    ? String(effectiveCockpitTactic.order).padStart(2, '0')
    : '00';

  const keywordsList = effectiveCockpitTactic
    ? effectiveCockpitTactic.subtitle.split(/[,&]/).map(s => s.trim().toUpperCase())
    : ['RECONNAISSANCE', 'INITIAL ACCESS', 'PRIVILEGE ESCALATION', 'LATERAL MOVEMENT', 'OPSEC'];

  return (
    <div className="space-y-5">
      {/* 1. SELETOR DE VOLUMES DA COLEÇÃO "THE ARCHIVE // RED TEAM" (VOL. 01 A VOL. 15) */}
      <div className="bg-[#e3dccf] border-2 border-[#161514] p-3 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#161514]/30 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-[#b81d18] inline-block" />
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#161514]">
              ÍNDICE DE VOLUMES // 15 FASES TÁTICAS MITRE ATT&amp;CK:
            </span>
          </div>

          {/* Alternador de Vista: Cockpit de Campo vs Grelha Completa */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                cyberAudio.playClick();
                setLayoutMode('cockpit');
              }}
              className={`px-3 py-1 text-xs font-mono font-bold border border-[#161514] flex items-center gap-1.5 cursor-pointer transition-all ${
                layoutMode === 'cockpit'
                  ? 'bg-[#b81d18] text-[#f4efe6]'
                  : 'bg-[#f4efe6] text-[#161514] hover:bg-[#161514] hover:text-[#f4efe6]'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              MODO MANUAL ABERTO (SPLIT-VIEW)
            </button>

            <button
              type="button"
              onClick={() => {
                cyberAudio.playClick();
                setLayoutMode('panorama');
              }}
              className={`px-3 py-1 text-xs font-mono font-bold border border-[#161514] flex items-center gap-1.5 cursor-pointer transition-all ${
                layoutMode === 'panorama'
                  ? 'bg-[#161514] text-[#f4efe6]'
                  : 'bg-[#f4efe6] text-[#161514] hover:bg-[#161514] hover:text-[#f4efe6]'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              MATRIZ COMPLETA (15 COLUNAS)
            </button>
          </div>
        </div>

        {/* Fita Horizontal dos 15 Volumes */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => handleSelectTacticRibbon('ALL')}
            className={`px-3 py-1.5 text-xs font-mono font-bold uppercase shrink-0 border border-[#161514] transition-all cursor-pointer ${
              activeTacticFocus === 'ALL'
                ? 'bg-[#161514] text-[#f4efe6]'
                : 'bg-[#f4efe6] text-[#161514] hover:bg-[#d8d0c0]'
            }`}
          >
            VOL. 00 // CATÁLOGO GLOBAL (706)
          </button>

          {tactics.map(tac => {
            const count = (parentTechniquesByTactic.get(tac.shortname) || []).length;
            const isSelected = activeTacticFocus === tac.shortname;
            const vNum = String(tac.order).padStart(2, '0');

            return (
              <button
                key={tac.id}
                type="button"
                onClick={() => handleSelectTacticRibbon(tac.shortname)}
                className={`px-2.5 py-1.5 text-left shrink-0 border border-[#161514] transition-all cursor-pointer flex flex-col min-w-[138px] ${
                  isSelected
                    ? 'bg-[#b81d18] text-[#f4efe6] shadow-sm'
                    : 'bg-[#f4efe6] text-[#161514] hover:bg-[#d8d0c0]'
                }`}
              >
                <div className="flex items-center justify-between gap-1 w-full">
                  <span
                    className={`text-[10px] font-mono font-bold ${
                      isSelected ? 'text-[#f4efe6]' : 'text-[#b81d18]'
                    }`}
                  >
                    VOL. {vNum} // {tac.id}
                  </span>
                  <span className="text-[10px] font-mono opacity-80">{count}T</span>
                </div>
                <span className="font-condensed font-bold text-sm uppercase truncate mt-0.5">
                  {tac.nameEn}
                </span>
                <span className="text-[10px] font-mono truncate opacity-85">
                  {tac.namePt}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filtro de Plataforma & Controlos */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#161514]/25">
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[11px] font-mono font-bold text-[#161514] uppercase flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3 text-[#b81d18]" /> SUPERFÍCIE / PLATAFORMA:
            </span>
            {['ALL', ...platforms.slice(0, 8)].map(plat => (
              <button
                key={plat}
                type="button"
                onClick={() => {
                  cyberAudio.playClick();
                  onChangePlatform(plat);
                }}
                className={`px-2 py-0.5 text-[11px] font-mono font-bold transition-colors border border-[#161514] cursor-pointer ${
                  selectedPlatform === plat
                    ? 'bg-[#161514] text-[#f4efe6]'
                    : 'bg-[#f4efe6] text-[#262421] hover:bg-[#d8d0c0]'
                }`}
              >
                {plat === 'ALL' ? 'TODAS' : plat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={expandAll}
              className="px-2.5 py-1 bg-[#f4efe6] hover:bg-[#161514] text-[#161514] hover:text-[#f4efe6] border border-[#161514] text-[11px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Maximize2 className="w-3 h-3" /> EXPANDIR SUB-TÉCNICAS
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="px-2.5 py-1 bg-[#f4efe6] hover:bg-[#161514] text-[#161514] hover:text-[#f4efe6] border border-[#161514] text-[11px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Minimize2 className="w-3 h-3" /> RECOLHER
            </button>
          </div>
        </div>
      </div>

      {/* =================================================================================
          MODO 1: MANUAL DE CAMPO ABERTO (CAPA DO VOLUME + SPLIT-VIEW COCKPIT)
         ================================================================================= */}
      {layoutMode === 'cockpit' && (
        <div className="space-y-5">
          {/* CABEÇALHO DE CAPA DO VOLUME (IDÊNTICO À CAPA DOS LIVROS "THE ARCHIVE") */}
          <div className="bg-[#f4efe6] border-2 border-[#161514] p-5 lg:p-6 relative overflow-hidden">
            {/* Carimbo Red Team no Canto Direito */}
            <div className="hidden xl:block absolute right-6 top-1/2 -translate-y-1/2">
              <ArchiveRubberStamp className="w-32 h-32" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
              {/* Esquerda: VOL. XX + Título Slab + Barra OFFENSIVE SECURITY FIELD NOTES */}
              <div className="lg:col-span-7 space-y-3">
                {/* Linha VOL. 01 | Palavras-Chave Empilhadas */}
                <div className="flex items-center gap-5">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-archive-serif font-black text-2xl md:text-3xl text-[#161514]">
                      VOL.
                    </span>
                    <span className="font-archive-serif font-black text-5xl md:text-6xl text-[#b81d18] leading-none">
                      {volNumber}
                    </span>
                  </div>

                  <div className="h-12 w-0.5 bg-[#161514]" />

                  <div className="text-[10px] font-mono font-bold tracking-[0.22em] uppercase text-[#161514] leading-snug">
                    {keywordsList.slice(0, 4).map((kw, i) => (
                      <div key={i}>{kw}</div>
                    ))}
                  </div>
                </div>

                {/* Título Gigante Estilo "RECON & DISCOVERY" / "ADVERSARY OPERATIONS" */}
                <div>
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-slab uppercase text-[#161514] leading-[1.02] tracking-wide">
                    {effectiveCockpitTactic
                      ? `${effectiveCockpitTactic.nameEn} // ${effectiveCockpitTactic.namePt}`
                      : 'COMPLETE ADVERSARY ARCHIVE'}
                  </h2>
                </div>

                {/* Faixa Dupla: OFFENSIVE SECURITY FIELD NOTES */}
                <div className="border-t-2 border-[#161514] border-b-2 border-b-[#b81d18] py-2 text-center sm:text-left">
                  <div className="font-condensed font-bold text-sm md:text-base tracking-[0.28em] uppercase text-[#161514]">
                    OFFENSIVE SECURITY FIELD NOTES //{' '}
                    {effectiveCockpitTactic ? effectiveCockpitTactic.id : 'MITRE ATT&CK v18'}
                  </div>
                  <div className="font-mono font-bold text-[11px] tracking-[0.2em] uppercase text-[#b81d18] mt-0.5">
                    {keywordsList.join(' • ')}
                  </div>
                </div>

                {effectiveCockpitTactic && (
                  <p className="text-xs md:text-sm text-[#262421] leading-relaxed">
                    {effectiveCockpitTactic.descriptionPt}{' '}
                    <strong className="font-mono text-xs text-[#b81d18]">
                      [MISSÃO: {effectiveCockpitTactic.pentesterRole}]
                    </strong>
                  </p>
                )}
              </div>

              {/* Direita: Playbooks de Desbloqueio (ICE Breaker) Deste Volume */}
              <div className="lg:col-span-5 xl:pr-28 space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#b81d18]">
                  <ArchiveDeltaSymbol className="w-4 h-4 text-[#161514]" />
                  <span>KNOWLEDGE PRECEDES ACCESS // PLAYBOOKS DESTE VOLUME:</span>
                </div>

                <div className="space-y-1.5">
                  {tacticScenarios.slice(0, 3).map(scen => (
                    <button
                      key={scen.id}
                      type="button"
                      onClick={() => {
                        cyberAudio.playBreach();
                        onJumpToScenario(scen.id);
                      }}
                      className="w-full text-left p-2.5 bg-[#ece6da] hover:bg-[#161514] text-[#161514] hover:text-[#f4efe6] border border-[#161514] transition-colors cursor-pointer flex items-center justify-between gap-2 group"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.2 bg-[#b81d18] text-[#f4efe6] font-mono text-[9px] font-bold">
                            BYPASS
                          </span>
                          <span className="font-condensed font-bold text-xs uppercase truncate">
                            {scen.title}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono opacity-75 truncate mt-0.5">
                          {scen.defenseMechanism}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#b81d18] group-hover:text-[#f4efe6] shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SPLIT-VIEW DE CAMPO: ÍNDICE DE TÉCNICAS À ESQUERDA + PÁGINA DO DOSSIER À DIREITA */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Coluna Esquerda: Índice de Técnicas e Sub-técnicas do Volume */}
            <div className="lg:col-span-5 xl:col-span-4 bg-[#f4efe6] border-2 border-[#161514] flex flex-col h-[78vh]">
              <div className="p-3 bg-[#161514] text-[#f4efe6] flex items-center justify-between shrink-0">
                <span className="font-mono text-xs font-bold uppercase tracking-wider">
                  {effectiveCockpitTactic
                    ? `VOL. ${volNumber} INDEX (${cockpitParentList.length} TÉCNICAS)`
                    : `ÍNDICE GERAL (${cockpitParentList.length} TÉCNICAS)`}
                </span>
                <span className="text-[10px] font-mono text-[#b81d18] bg-[#f4efe6] px-1.5 py-0.5 font-bold">
                  SELECIONE P/ LER →
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-2.5 space-y-2 bg-[#ece6da]">
                {cockpitParentList.map(tech => {
                  const validSubs = tech.subtechniqueIds
                    .map(sId => techniquesById.get(sId))
                    .filter((s): s is Technique => Boolean(s) && matchingTechIds.has(s!.id));

                  const isParentActive = activeCockpitTechnique?.id === tech.id;
                  const isChildActive = validSubs.some(
                    s => s.id === activeCockpitTechnique?.id
                  );
                  const expandKey = `cockpit:${tech.id}`;
                  const isExpanded =
                    expandedParents.has(expandKey) ||
                    isParentActive ||
                    isChildActive ||
                    searchQuery.trim().length > 0;

                  return (
                    <div
                      key={tech.id}
                      className={`border transition-all ${
                        isParentActive || isChildActive
                          ? 'bg-[#f4efe6] border-2 border-[#b81d18] shadow-sm'
                          : 'bg-[#f4efe6] border-[#161514]/60 hover:border-[#161514]'
                      }`}
                    >
                      <div
                        onClick={() => {
                          cyberAudio.playClick();
                          onSelectTechnique(tech.id);
                        }}
                        className="p-3 cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`font-mono text-xs font-bold px-1.5 py-0.2 border border-[#161514] ${
                                isParentActive
                                  ? 'bg-[#b81d18] text-[#f4efe6]'
                                  : 'bg-[#e3dccf] text-[#161514]'
                              }`}
                            >
                              {tech.id}
                            </span>
                            {bookmarkedIds.has(tech.id) && (
                              <Bookmark className="w-3.5 h-3.5 text-[#b81d18] fill-current" />
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {tech.codeArtifacts.length > 0 && (
                              <span
                                className="text-[10px] font-mono font-bold text-[#161514] flex items-center gap-0.5"
                                title="Inclui comandos CLI"
                              >
                                <Terminal className="w-3 h-3 text-[#b81d18]" /> CLI
                              </span>
                            )}
                            {tech.mitigations.length > 0 && (
                              <span
                                className="text-[10px] font-mono font-bold text-[#b81d18] flex items-center gap-0.5"
                                title="Inclui bypass de mitigações"
                              >
                                <ShieldAlert className="w-3 h-3" /> {tech.mitigations.length}
                              </span>
                            )}
                            {validSubs.length > 0 && (
                              <button
                                type="button"
                                onClick={e => toggleExpandParent(expandKey, e)}
                                className="px-1.5 py-0.5 bg-[#161514] hover:bg-[#b81d18] text-[#f4efe6] font-mono text-[10px] font-bold flex items-center gap-0.5 transition-colors cursor-pointer"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-3 h-3" />
                                ) : (
                                  <ChevronRight className="w-3 h-3" />
                                )}
                                {validSubs.length} SUB
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="font-condensed font-bold text-base uppercase text-[#161514] leading-snug">
                          {tech.nameEn}
                        </div>
                        <div className="text-xs font-mono text-[#4a4742] leading-tight mt-0.5">
                          {tech.namePt}
                        </div>
                      </div>

                      {/* Pílulas de Sub-técnicas Rápidas */}
                      {isExpanded && validSubs.length > 0 && (
                        <div className="px-3 pb-3 pt-2 border-t border-[#161514]/30 bg-[#e3dccf] flex flex-wrap gap-1.5">
                          {validSubs.map(sub => {
                            const isSubSelected = activeCockpitTechnique?.id === sub.id;
                            return (
                              <button
                                key={sub.id}
                                type="button"
                                onClick={() => {
                                  cyberAudio.playClick();
                                  onSelectTechnique(sub.id);
                                }}
                                className={`px-2 py-1 text-left font-mono text-[11px] border border-[#161514] transition-all cursor-pointer flex items-center gap-1 ${
                                  isSubSelected
                                    ? 'bg-[#b81d18] text-[#f4efe6] font-bold'
                                    : 'bg-[#f4efe6] text-[#161514] hover:bg-[#161514] hover:text-[#f4efe6]'
                                }`}
                              >
                                <span className="text-[10px] font-bold">
                                  .{sub.id.split('.')[1]}
                                </span>
                                <span className="truncate max-w-[170px]">{sub.nameEn}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Coluna Direita: Página Aberta do Dossier */}
            <div className="lg:col-span-7 xl:col-span-8 h-[78vh]">
              <TechniqueDossier
                technique={activeCockpitTechnique}
                techniquesById={techniquesById}
                tactics={tactics}
                tacticsByShortname={tacticsByShortname}
                scenarios={scenarios}
                onSelectTechnique={onSelectTechnique}
                onJumpToScenario={onJumpToScenario}
                onJumpToTactic={handleSelectTacticRibbon}
                isBookmarked={
                  activeCockpitTechnique ? bookmarkedIds.has(activeCockpitTechnique.id) : false
                }
                onToggleBookmark={onToggleBookmark}
                operatorNote={
                  activeCockpitTechnique
                    ? notesByTechniqueId[activeCockpitTechnique.id] || ''
                    : ''
                }
                onChangeNote={onChangeNote}
                inlineMode={true}
                neighborIds={neighborIds}
              />
            </div>
          </div>
        </div>
      )}

      {/* =================================================================================
          MODO 2: MATRIZ COMPLETA DE 15 COLUNAS ESTILO TABELA DE ARQUIVO IMPRESSA
         ================================================================================= */}
      {layoutMode === 'panorama' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-[#e3dccf] px-4 py-2 border-2 border-[#161514]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollPanorama('left')}
                className="px-3 py-1 bg-[#f4efe6] hover:bg-[#161514] text-[#161514] hover:text-[#f4efe6] border border-[#161514] text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> DESLIZAR ESQUERDA
              </button>
              <button
                type="button"
                onClick={() => scrollPanorama('right')}
                className="px-3 py-1 bg-[#f4efe6] hover:bg-[#161514] text-[#161514] hover:text-[#f4efe6] border border-[#161514] text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                DESLIZAR DIREITA <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                cyberAudio.playClick();
                setCompactMode(!compactMode);
              }}
              className={`px-2.5 py-1 text-xs font-mono border border-[#161514] flex items-center gap-1 cursor-pointer ${
                compactMode
                  ? 'bg-[#161514] text-[#f4efe6] font-bold'
                  : 'bg-[#f4efe6] text-[#161514]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />{' '}
              {compactMode ? 'VISTA COMPACTA' : 'VISTA BILINGUE PT/EN'}
            </button>
          </div>

          <div ref={matrixScrollRef} className="overflow-x-auto pb-4 scroll-smooth">
            <div className="inline-flex gap-3 min-w-max">
              {tactics.map(tac => {
                const parentTechs = parentTechniquesByTactic.get(tac.shortname) || [];
                const totalSubCount = parentTechs.reduce(
                  (acc, p) =>
                    acc + p.subtechniqueIds.filter(id => matchingTechIds.has(id)).length,
                  0
                );
                const isFocused = activeTacticFocus === tac.shortname;
                const vNum = String(tac.order).padStart(2, '0');

                return (
                  <div
                    key={tac.id}
                    ref={el => {
                      columnRefs.current[tac.shortname] = el;
                    }}
                    className={`w-[275px] shrink-0 flex flex-col bg-[#f4efe6] border-2 ${
                      isFocused ? 'border-[#b81d18]' : 'border-[#161514]'
                    }`}
                  >
                    {/* Cabeçalho da Coluna */}
                    <div
                      onClick={() => {
                        setLayoutMode('cockpit');
                        handleSelectTacticRibbon(tac.shortname);
                      }}
                      className="p-3 bg-[#161514] text-[#f4efe6] border-b-4 border-[#b81d18] cursor-pointer hover:bg-[#262421] transition-colors sticky top-0 z-10"
                      title="Clique para abrir este Volume em Modo Manual Aberto"
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 bg-[#b81d18] text-[#f4efe6]">
                          VOL. {vNum} // {tac.id}
                        </span>
                        <span className="text-[11px] font-mono text-[#d8d0c0]">
                          {parentTechs.length}T + {totalSubCount}S
                        </span>
                      </div>

                      <h3 className="font-condensed font-bold text-base text-[#f4efe6] uppercase tracking-wider truncate">
                        {tac.nameEn}
                      </h3>
                      <p className="text-xs font-mono text-[#d8d0c0] truncate">{tac.namePt}</p>
                    </div>

                    {/* Lista de Técnicas da Coluna */}
                    <div className="p-2 space-y-1.5 max-h-[70vh] overflow-y-auto bg-[#ece6da]">
                      {parentTechs.map(tech => {
                        const expandKey = `${tac.shortname}:${tech.id}`;
                        const isExpanded =
                          expandedParents.has(expandKey) || searchQuery.trim().length > 0;
                        const validSubs = tech.subtechniqueIds
                          .map(sId => techniquesById.get(sId))
                          .filter(
                            (s): s is Technique => Boolean(s) && matchingTechIds.has(s!.id)
                          );
                        const isBooked = bookmarkedIds.has(tech.id);

                        return (
                          <div
                            key={tech.id}
                            className="bg-[#f4efe6] border border-[#161514] hover:border-[#b81d18] transition-all group"
                          >
                            <div
                              onClick={() => {
                                cyberAudio.playDossierOpen();
                                onSelectTechnique(tech.id);
                              }}
                              className="p-2.5 cursor-pointer"
                            >
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="font-mono text-[11px] font-bold text-[#b81d18] group-hover:underline">
                                  {tech.id}
                                </span>
                                <div className="flex items-center gap-1">
                                  {isBooked && (
                                    <Bookmark className="w-3 h-3 text-[#b81d18] fill-current" />
                                  )}
                                  {validSubs.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={e => toggleExpandParent(expandKey, e)}
                                      className="px-1.5 py-0.5 bg-[#e3dccf] hover:bg-[#161514] text-[#161514] hover:text-[#f4efe6] border border-[#161514] font-mono text-[10px] font-bold flex items-center gap-0.5 transition-colors cursor-pointer"
                                    >
                                      {isExpanded ? (
                                        <ChevronDown className="w-3 h-3" />
                                      ) : (
                                        <ChevronRight className="w-3 h-3" />
                                      )}
                                      .{validSubs.length}
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className="text-xs font-bold text-[#161514] leading-snug group-hover:text-[#b81d18] transition-colors">
                                {tech.nameEn}
                              </div>

                              {!compactMode && (
                                <div className="text-[11px] text-[#4a4742] leading-tight mt-1">
                                  {tech.namePt}
                                </div>
                              )}
                            </div>

                            {isExpanded && validSubs.length > 0 && (
                              <div className="bg-[#e3dccf] border-t border-[#161514] p-1.5 space-y-1 pl-2.5">
                                {validSubs.map(sub => (
                                  <button
                                    key={sub.id}
                                    type="button"
                                    onClick={() => {
                                      cyberAudio.playDossierOpen();
                                      onSelectTechnique(sub.id);
                                    }}
                                    className="w-full text-left p-1.5 bg-[#f4efe6] hover:bg-[#161514] text-[#161514] hover:text-[#f4efe6] border-l-2 border-[#b81d18] transition-colors cursor-pointer block"
                                  >
                                    <div className="font-mono text-[10px] font-bold text-[#b81d18]">
                                      {sub.id}
                                    </div>
                                    <div className="text-[11px] font-semibold leading-tight">
                                      {sub.nameEn}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
