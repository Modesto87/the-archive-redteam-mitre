import React, { useState, useMemo } from 'react';
import {
  Search,
  BookOpen,
  Terminal,
  ShieldAlert,
  Bookmark,
  Zap,
  Filter
} from 'lucide-react';
import type { Tactic, Technique } from '../types/mitre';
import { cyberAudio } from '../utils/cyberAudio';

interface CatalogExplorerViewProps {
  techniques: Technique[];
  tactics: Tactic[];
  tacticsByShortname: Map<string, Tactic>;
  platforms: string[];
  globalSearch: string;
  onSelectTechnique: (id: string) => void;
  bookmarkedIds: Set<string>;
  onToggleBookmark: (id: string) => void;
}

export const CatalogExplorerView: React.FC<CatalogExplorerViewProps> = ({
  techniques,
  tactics,
  tacticsByShortname,
  platforms,
  globalSearch,
  onSelectTechnique,
  bookmarkedIds,
  onToggleBookmark
}) => {
  const [localSearch, setLocalSearch] = useState('');
  const [selectedTactic, setSelectedTactic] = useState('ALL');
  const [selectedPlatform, setSelectedPlatform] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'PARENT' | 'SUB'>('ALL');
  const [onlyWithCommands, setOnlyWithCommands] = useState(false);
  const [visibleLimit, setVisibleLimit] = useState(48);

  const effectiveQuery = (localSearch || globalSearch).trim().toLowerCase();

  const filtered = useMemo(() => {
    return techniques.filter(t => {
      if (typeFilter === 'PARENT' && t.isSubtechnique) return false;
      if (typeFilter === 'SUB' && !t.isSubtechnique) return false;
      if (selectedTactic !== 'ALL' && !t.tactics.includes(selectedTactic)) return false;
      if (selectedPlatform !== 'ALL' && !t.platforms.includes(selectedPlatform)) return false;
      if (onlyWithCommands && t.codeArtifacts.length === 0) return false;

      if (effectiveQuery) {
        const hit =
          t.id.toLowerCase().includes(effectiveQuery) ||
          t.fullNameEn.toLowerCase().includes(effectiveQuery) ||
          t.fullNamePt.toLowerCase().includes(effectiveQuery) ||
          t.descriptionPt.toLowerCase().includes(effectiveQuery) ||
          t.tools.some(tl => tl.name.toLowerCase().includes(effectiveQuery)) ||
          t.codeArtifacts.some(c => c.toLowerCase().includes(effectiveQuery));
        if (!hit) return false;
      }
      return true;
    });
  }, [
    techniques,
    typeFilter,
    selectedTactic,
    selectedPlatform,
    onlyWithCommands,
    effectiveQuery
  ]);

  const displayed = filtered.slice(0, visibleLimit);

  return (
    <div className="space-y-5">
      {/* Painel de Filtros Avançados do Catálogo Acadêmico */}
      <div className="p-5 bg-[#e3dccf] border-2 border-[#161514] space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#b81d18] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={localSearch}
              onChange={e => {
                setLocalSearch(e.target.value);
                setVisibleLimit(48);
              }}
              placeholder="Pesquisa em todas as 706 fichas de arquivo (ID, nome em inglês/português, APIs, comandos, ferramentas como Mimikatz/Rubeus/Impacket)..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#f4efe6] border border-[#161514] text-sm font-mono text-[#161514] placeholder:text-[#6e6a63] outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedTactic}
              onChange={e => {
                cyberAudio.playClick();
                setSelectedTactic(e.target.value);
                setVisibleLimit(48);
              }}
              className="px-3 py-2 bg-[#f4efe6] border border-[#161514] text-xs font-mono font-bold text-[#161514] outline-none cursor-pointer"
            >
              <option value="ALL">VOLUME / TÁTICA: TODAS (15)</option>
              {tactics.map(tac => (
                <option key={tac.shortname} value={tac.shortname}>
                  VOL. {String(tac.order).padStart(2, '0')} // {tac.namePt} ({tac.nameEn})
                </option>
              ))}
            </select>

            <select
              value={selectedPlatform}
              onChange={e => {
                cyberAudio.playClick();
                setSelectedPlatform(e.target.value);
                setVisibleLimit(48);
              }}
              className="px-3 py-2 bg-[#f4efe6] border border-[#161514] text-xs font-mono font-bold text-[#161514] outline-none cursor-pointer"
            >
              <option value="ALL">PLATAFORMA: TODAS</option>
              {platforms.map(p => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#161514]/25">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono font-bold text-[#161514] flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5 text-[#b81d18]" /> NÍVEL:
            </span>
            {[
              { id: 'ALL', label: 'TODAS (706)' },
              { id: 'PARENT', label: 'TÉCNICAS PRINCIPAIS (227)' },
              { id: 'SUB', label: 'SUBTÉCNICAS (479)' }
            ].map(btn => (
              <button
                key={btn.id}
                type="button"
                onClick={() => {
                  cyberAudio.playClick();
                  setTypeFilter(btn.id as 'ALL' | 'PARENT' | 'SUB');
                  setVisibleLimit(48);
                }}
                className={`px-3 py-1 text-xs font-mono font-bold border border-[#161514] transition-colors cursor-pointer ${
                  typeFilter === btn.id
                    ? 'bg-[#161514] text-[#f4efe6]'
                    : 'bg-[#f4efe6] text-[#262421] hover:bg-[#d8d0c0]'
                }`}
              >
                {btn.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => {
                cyberAudio.playClick();
                setOnlyWithCommands(!onlyWithCommands);
                setVisibleLimit(48);
              }}
              className={`px-3 py-1 text-xs font-mono font-bold border border-[#161514] flex items-center gap-1.5 transition-colors cursor-pointer ${
                onlyWithCommands
                  ? 'bg-[#b81d18] text-[#f4efe6]'
                  : 'bg-[#f4efe6] text-[#b81d18] hover:bg-[#d8d0c0]'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              COM COMANDOS / EXCERTOS CLI
            </button>
          </div>

          <div className="text-xs font-mono font-bold text-[#161514]">
            A EXIBIR <strong className="text-[#b81d18]">{displayed.length}</strong> DE{' '}
            <strong>{filtered.length}</strong> FICHAS TÉCNICAS
          </div>
        </div>
      </div>

      {/* Grelha de Cartões de Técnicas Académicas */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {displayed.map(tech => {
          const isBooked = bookmarkedIds.has(tech.id);
          return (
            <div
              key={tech.id}
              onClick={() => {
                cyberAudio.playDossierOpen();
                onSelectTechnique(tech.id);
              }}
              className="bg-[#f4efe6] border-2 border-[#161514] hover:border-[#b81d18] p-5 flex flex-col justify-between gap-4 cursor-pointer transition-all group relative"
            >
              <div className="space-y-2.5">
                {/* Topo do Cartão */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-[#161514] text-[#f4efe6] font-mono text-xs font-bold">
                      REF // {tech.id}
                    </span>
                    {tech.isSubtechnique ? (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-[#e3dccf] text-[#161514] border border-[#161514]/40">
                        SUBTÉCNICA
                      </span>
                    ) : (
                      tech.subtechniqueIds.length > 0 && (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-[#b81d18]/10 text-[#b81d18] border border-[#b81d18]">
                          +{tech.subtechniqueIds.length} VARIANTES
                        </span>
                      )
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      cyberAudio.playClick();
                      onToggleBookmark(tech.id);
                    }}
                    className={`p-1.5 border border-[#161514] transition-colors cursor-pointer ${
                      isBooked
                        ? 'bg-[#b81d18] text-[#f4efe6]'
                        : 'bg-[#ece6da] text-[#161514] hover:bg-[#161514] hover:text-[#f4efe6]'
                    }`}
                    title={isBooked ? 'Remover das notas de campo' : 'Adicionar às notas de campo'}
                  >
                    <Bookmark className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>

                {/* Títulos EN e PT */}
                <div>
                  <h3 className="font-condensed font-bold text-lg uppercase text-[#161514] group-hover:text-[#b81d18] transition-colors leading-snug">
                    {tech.fullNamePt}
                  </h3>
                  <p className="text-xs font-mono font-bold text-[#b81d18] mt-0.5">
                    MITRE: {tech.fullNameEn}
                  </p>
                </div>

                {/* Táticas */}
                <div className="flex flex-wrap gap-1">
                  {tech.tactics.map(tShort => {
                    const tac = tacticsByShortname.get(tShort);
                    return (
                      <span
                        key={tShort}
                        className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#e3dccf] text-[#161514] border border-[#161514]/40 uppercase"
                      >
                        {tac ? `VOL.${String(tac.order).padStart(2, '0')} ${tac.namePt}` : tShort}
                      </span>
                    );
                  })}
                </div>

                {/* Excerto da Descrição Académica em Português */}
                <p className="text-xs text-[#262421] line-clamp-3 leading-relaxed">
                  {tech.descriptionPt.replace(/[*`]/g, '')}
                </p>
              </div>

              {/* Rodapé do Cartão */}
              <div className="pt-3 border-t border-[#161514]/30 flex items-center justify-between text-[11px] font-mono text-[#4a4742]">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-[#b81d18] font-bold">
                    <Zap className="w-3 h-3" /> Com notas de contorno
                  </span>
                  {tech.codeArtifacts.length > 0 && (
                    <span className="flex items-center gap-1 text-[#161514] font-bold">
                      <Terminal className="w-3 h-3" /> {tech.codeArtifacts.length} CLI
                    </span>
                  )}
                  {tech.mitigations.length > 0 && (
                    <span className="flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" /> {tech.mitigations.length} Mit.
                    </span>
                  )}
                </div>

                <span className="text-[#161514] group-hover:text-[#b81d18] font-bold flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> LER DOSSIER →
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Botão Carregar Mais */}
      {visibleLimit < filtered.length && (
        <div className="flex justify-center pt-4">
          <button
            type="button"
            onClick={() => {
              cyberAudio.playClick();
              setVisibleLimit(prev => prev + 60);
            }}
            className="px-6 py-3 bg-[#161514] hover:bg-[#b81d18] text-[#f4efe6] font-mono font-bold text-xs uppercase tracking-widest cursor-pointer transition-colors"
          >
            CARREGAR MAIS FICHAS ({filtered.length - visibleLimit} RESTANTES)
          </button>
        </div>
      )}
    </div>
  );
};
