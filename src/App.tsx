import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Zap,
  Grid,
  BookOpen,
  Bookmark,
  Search,
  Volume2,
  VolumeX,
  X
} from 'lucide-react';
import type {
  MitreCatalog,
  ActiveTab,
  Technique,
  Tactic,
  PentesterWorkspaceState
} from './types/mitre';
import { TacticalMatrixView } from './components/TacticalMatrixView';
import { IceBreakerView } from './components/IceBreakerView';
import { CatalogExplorerView } from './components/CatalogExplorerView';
import { WorkspaceView } from './components/WorkspaceView';
import { TechniqueDossier } from './components/TechniqueDossier';
import { TraceBreadcrumbBar, type TraceHistoryItem } from './components/TraceBreadcrumbBar';
import {
  ArchiveWireframeGlobe,
  ArchiveRedSpine,
  ArchiveDeltaSymbol
} from './components/ArchiveArtwork';
import { cyberAudio } from './utils/cyberAudio';

const WORKSPACE_STORAGE_KEY = 'cyber_attack_2077_workspace_v1';

export function App() {
  const [catalog, setCatalog] = useState<MitreCatalog | null>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('matrix');
  const [selectedTechniqueId, setSelectedTechniqueId] = useState<string | null>('T1003.001');
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('blk-lsass-ppl');
  const [activeTacticFocus, setActiveTacticFocus] = useState<string>('credential-access');
  const [globalSearch, setGlobalSearch] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('ALL');
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [showQuickSearchDropdown, setShowQuickSearchDropdown] = useState(false);

  const [traceHistory, setTraceHistory] = useState<TraceHistoryItem[]>([
    { type: 'tactic', id: 'TA0006', label: 'Acesso a Credenciais' },
    { type: 'technique', id: 'T1003.001', label: 'Memória do LSASS' }
  ]);
  const [traceIndex, setTraceIndex] = useState<number>(1);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const [workspace, setWorkspace] = useState<PentesterWorkspaceState>(() => {
    try {
      const saved = localStorage.getItem(WORKSPACE_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore storage errors
    }
    return {
      bookmarkedIds: ['T1003.001', 'T1059.001', 'T1649', 'T1055.012'],
      notesByTechniqueId: {},
      engagementName: 'RT-ARCH-03 // Operações adversárias',
      targetScope: 'Active Directory e infraestrutura empresarial'
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(workspace));
    } catch {
      // ignore storage errors
    }
  }, [workspace]);

  useEffect(() => {
    fetch('/data/mitre-catalog.json')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: MitreCatalog) => {
        setCatalog(data);
      })
      .catch(err => {
        setLoadingError(String(err));
      });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setShowQuickSearchDropdown(true);
      } else if (e.key === 'Escape') {
        if (drawerOpen) {
          setDrawerOpen(false);
        } else {
          setShowQuickSearchDropdown(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen]);

  const techniquesById = useMemo(() => {
    const map = new Map<string, Technique>();
    if (!catalog) return map;
    for (const t of catalog.techniques) {
      map.set(t.id, t);
    }
    return map;
  }, [catalog]);

  const tacticsByShortname = useMemo(() => {
    const map = new Map<string, Tactic>();
    if (!catalog) return map;
    for (const tac of catalog.tactics) {
      map.set(tac.shortname, tac);
    }
    return map;
  }, [catalog]);

  const scenariosById = useMemo(() => {
    const map = new Map<string, MitreCatalog['iceBreakerScenarios'][number]>();
    if (!catalog) return map;
    for (const s of catalog.iceBreakerScenarios) {
      map.set(s.id, s);
    }
    return map;
  }, [catalog]);

  const platforms = useMemo(() => {
    if (!catalog) return [];
    const counts = new Map<string, number>();
    for (const t of catalog.techniques) {
      for (const p of t.platforms) {
        counts.set(p, (counts.get(p) || 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);
  }, [catalog]);

  const bookmarkedSet = useMemo(
    () => new Set(workspace.bookmarkedIds),
    [workspace.bookmarkedIds]
  );

  const pushTrace = useCallback(
    (item: TraceHistoryItem) => {
      setTraceHistory(prev => {
        const sliced = prev.slice(0, traceIndex + 1);
        const last = sliced[sliced.length - 1];
        if (last && last.type === item.type && last.id === item.id) {
          return sliced;
        }
        const next = [...sliced, item].slice(-14);
        setTraceIndex(next.length - 1);
        return next;
      });
    },
    [traceIndex]
  );

  const handleSelectTechnique = useCallback(
    (id: string, forceModalDrawer = false) => {
      const tech = techniquesById.get(id);
      setSelectedTechniqueId(id);

      if (tech) {
        pushTrace({
          type: 'technique',
          id: tech.id,
          label: tech.namePt
        });
      }

      if (forceModalDrawer || activeTab !== 'matrix') {
        setDrawerOpen(true);
      }
    },
    [techniquesById, pushTrace, activeTab]
  );

  const handleJumpToScenario = useCallback(
    (scenarioId: string) => {
      const scen = scenariosById.get(scenarioId);
      setSelectedScenarioId(scenarioId);
      setDrawerOpen(false);
      setActiveTab('icebreaker');

      if (scen) {
        pushTrace({
          type: 'scenario',
          id: 'BYPASS',
          label: scen.title
        });
      }
    },
    [scenariosById, pushTrace]
  );

  const handleJumpToTactic = useCallback(
    (tacticShortname: string) => {
      setActiveTacticFocus(tacticShortname);
      setDrawerOpen(false);
      setActiveTab('matrix');

      const tac = tacticsByShortname.get(tacticShortname);
      if (tac) {
        pushTrace({
          type: 'tactic',
          id: tac.id,
          label: tac.namePt
        });
      }
    },
    [tacticsByShortname, pushTrace]
  );

  const handleNavigateTraceIndex = (idx: number) => {
    const item = traceHistory[idx];
    if (!item) return;
    setTraceIndex(idx);

    if (item.type === 'technique') {
      setSelectedTechniqueId(item.id);
      if (activeTab !== 'matrix') {
        setDrawerOpen(true);
      }
    } else if (item.type === 'scenario') {
      const scen = catalog?.iceBreakerScenarios.find(s => s.title === item.label);
      if (scen) {
        setSelectedScenarioId(scen.id);
        setDrawerOpen(false);
        setActiveTab('icebreaker');
      }
    } else if (item.type === 'tactic') {
      const tac = catalog?.tactics.find(t => t.id === item.id);
      if (tac) {
        setActiveTacticFocus(tac.shortname);
        setDrawerOpen(false);
        setActiveTab('matrix');
      }
    }
  };

  const quickSearchResults = useMemo(() => {
    if (!catalog || !globalSearch.trim()) return { techniques: [], scenarios: [] };
    const q = globalSearch.trim().toLowerCase();
    const matchedTechs = catalog.techniques
      .filter(
        t =>
          t.id.toLowerCase().includes(q) ||
          t.fullNameEn.toLowerCase().includes(q) ||
          t.fullNamePt.toLowerCase().includes(q) ||
          t.tools.some(tl => tl.name.toLowerCase().includes(q))
      )
      .slice(0, 6);

    const matchedScenarios = catalog.iceBreakerScenarios
      .filter(
        s =>
          s.title.toLowerCase().includes(q) ||
          s.defenseMechanism.toLowerCase().includes(q) ||
          s.symptom.toLowerCase().includes(q)
      )
      .slice(0, 3);

    return { techniques: matchedTechs, scenarios: matchedScenarios };
  }, [catalog, globalSearch]);

  const handleToggleBookmark = (id: string) => {
    setWorkspace(prev => {
      const exists = prev.bookmarkedIds.includes(id);
      return {
        ...prev,
        bookmarkedIds: exists
          ? prev.bookmarkedIds.filter(item => item !== id)
          : [...prev.bookmarkedIds, id]
      };
    });
  };

  const handleChangeNote = (id: string, note: string) => {
    setWorkspace(prev => ({
      ...prev,
      notesByTechniqueId: {
        ...prev.notesByTechniqueId,
        [id]: note
      }
    }));
  };

  const toggleAudio = () => {
    const next = !audioEnabled;
    cyberAudio.enabled = next;
    setAudioEnabled(next);
    if (next) cyberAudio.playBreach();
  };

  if (loadingError) {
    return (
      <div className="min-h-screen archive-paper-bg flex items-center justify-center p-6">
        <div className="max-w-lg p-6 bg-[#f4efe6] border-2 border-[#161514] text-center space-y-3">
          <h1 className="text-xl font-slab uppercase text-[#b81d18]">
            ERRO DE CARREGAMENTO DO ARQUIVO STIX
          </h1>
          <p className="text-sm font-mono text-[#161514]">{loadingError}</p>
        </div>
      </div>
    );
  }

  if (!catalog) {
    return (
      <div className="min-h-screen archive-paper-bg flex flex-col items-center justify-center p-6 space-y-4">
        <ArchiveWireframeGlobe className="w-16 h-16 text-[#161514] animate-spin" />
        <div className="text-center space-y-1">
          <div className="font-archive-serif font-black text-3xl text-[#161514] tracking-widest">
            THE ARCHIVE // RED TEAM
          </div>
          <p className="text-xs font-mono text-[#b81d18] uppercase tracking-widest">
            A carregar 706 técnicas MITRE ATT&amp;CK e procedimentos de evasão...
          </p>
        </div>
      </div>
    );
  }

  const selectedTechnique = selectedTechniqueId
    ? techniquesById.get(selectedTechniqueId) || null
    : null;

  const activeTacticObj =
    activeTacticFocus !== 'ALL' ? tacticsByShortname.get(activeTacticFocus) : null;

  const spineVolNumber =
    activeTab === 'icebreaker'
      ? 'SP'
      : activeTacticObj
        ? String(activeTacticObj.order).padStart(2, '0')
        : '00';

  const spineVolTitle =
    activeTab === 'icebreaker'
      ? 'EVASÃO E DESBLOQUEIO'
      : activeTacticObj
        ? activeTacticObj.namePt.toUpperCase()
        : 'MATRIZ COMPLETA';

  const spineRefCode = `RT-ARCH-${spineVolNumber}`;

  return (
    <div className="min-h-screen archive-paper-bg text-[#161514] flex relative">
      {/* Textura subtil de grão de papel impresso */}
      <div className="paper-grain-overlay" />

      {/* Coluna Principal da Página do Livro / Manual */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* =========================================================================
            CABEÇALHO DE ARQUIVO FIEL À CAPA DOS LIVROS "THE ARCHIVE // RED TEAM"
           ========================================================================= */}
        <header className="bg-[#ece6da] border-b-2 border-[#161514]">
          <div className="max-w-[1800px] mx-auto px-4 lg:px-8 pt-4 pb-3 space-y-3">
            {/* Linha 1: Metadados Técnicos de Topo (Globo + 3 Colunas de Classificação + Pesquisa) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center border-b border-[#161514]/30 pb-3">
              {/* Bloco Esquerdo: Globo Wireframe + INFORMAÇÕES / PRÁTICAS OPERACIONAIS */}
              <div className="lg:col-span-4 flex items-center gap-4">
                <ArchiveWireframeGlobe className="w-11 h-11 text-[#161514] shrink-0" />
                <div className="h-11 w-px bg-[#161514]" />
                <div className="text-[10px] font-mono font-bold tracking-[0.22em] uppercase leading-tight text-[#161514]">
                  <div>INFORMAÇÕES</div>
                  <div>PRÁTICAS OPERACIONAIS</div>
                  <div>SEGURANÇA OFENSIVA</div>
                  <div>NOTAS DE CAMPO</div>
                </div>
              </div>

              {/* Bloco Central: REF / CAT / VOL / CLASS (Idêntico à capa) */}
              <div className="hidden sm:flex lg:col-span-4 items-center justify-between gap-4 border-l border-r border-[#161514]/30 px-4">
                <div className="text-[10px] font-mono font-bold tracking-[0.18em] uppercase leading-tight text-[#161514]">
                  <div>
                    REF &nbsp;&nbsp;// <span className="font-semibold">{spineRefCode}</span>
                  </div>
                  <div>
                    CAT &nbsp;&nbsp;// <span className="font-semibold">{spineVolTitle}</span>
                  </div>
                  <div>
                    VOL &nbsp;&nbsp;// <span className="font-semibold">{spineVolNumber}</span>
                  </div>
                  <div>
                    CLASSIF. // <span className="text-[#b81d18] font-bold">TLP:AMBER</span>
                  </div>
                </div>

                <div className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase leading-tight text-[#161514]">
                  <div>PESSOAS</div>
                  <div>SISTEMAS</div>
                  <div>INFRAESTRUTURA</div>
                  <div>SUPERFÍCIE DE ATAQUE</div>
                  <div className="w-5 h-1 bg-[#b81d18] mt-1" />
                </div>
              </div>

              {/* Bloco Direito: Pesquisa Rápida (Ctrl+K) + Som */}
              <div className="lg:col-span-4 flex items-center gap-2">
                <div className="relative flex-1">
                  <div className="relative flex items-center">
                    <Search className="w-4 h-4 text-[#b81d18] absolute left-3 pointer-events-none" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={globalSearch}
                      onFocus={() => setShowQuickSearchDropdown(true)}
                      onChange={e => {
                        setGlobalSearch(e.target.value);
                        setShowQuickSearchDropdown(true);
                      }}
                      placeholder="Pesquisar técnica (T1003), ferramenta ou bloqueio [Ctrl+K]..."
                      className="w-full pl-9 pr-14 py-1.5 bg-[#f4efe6] border-2 border-[#161514] text-xs font-mono text-[#161514] placeholder:text-[#6e6a63] outline-none"
                    />
                    {globalSearch ? (
                      <button
                        type="button"
                        onClick={() => {
                          setGlobalSearch('');
                          setShowQuickSearchDropdown(false);
                        }}
                        className="absolute right-2.5 text-[#161514] hover:text-[#b81d18] cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    ) : (
                      <span className="absolute right-2 px-1.5 py-0.5 bg-[#e3dccf] text-[#161514] font-mono text-[9px] font-bold border border-[#161514]/40 pointer-events-none">
                        Ctrl+K
                      </span>
                    )}
                  </div>

                  {/* Dropdown de Salto Rápido */}
                  {showQuickSearchDropdown &&
                    (quickSearchResults.scenarios.length > 0 ||
                      quickSearchResults.techniques.length > 0) && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-[#f4efe6] border-2 border-[#161514] shadow-2xl z-50 max-h-96 overflow-y-auto">
                        <div className="px-3 py-1.5 bg-[#161514] text-[#f4efe6] flex items-center justify-between text-[10px] font-mono font-bold">
                          <span>ÍNDICE RÁPIDO // PROCEDIMENTOS &amp; TÉCNICAS</span>
                          <button
                            type="button"
                            onClick={() => setShowQuickSearchDropdown(false)}
                            className="hover:text-[#b81d18] cursor-pointer"
                          >
                            FECHAR [ESC]
                          </button>
                        </div>

                        {quickSearchResults.scenarios.map(scen => (
                          <button
                            key={scen.id}
                            type="button"
                            onClick={() => {
                              cyberAudio.playBreach();
                              handleJumpToScenario(scen.id);
                              setShowQuickSearchDropdown(false);
                            }}
                            className="w-full text-left px-3.5 py-2 bg-[#ece6da] hover:bg-[#b81d18] text-[#161514] hover:text-[#f4efe6] border-b border-[#161514] flex items-center justify-between gap-3 cursor-pointer transition-colors group"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="px-1.5 py-0.2 bg-[#b81d18] group-hover:bg-[#161514] text-[#f4efe6] font-mono text-[10px] font-bold">
                                  PROCEDIMENTO DE CONTORNO
                                </span>
                                <span className="font-bold text-xs">{scen.title}</span>
                              </div>
                              <div className="text-[11px] font-mono opacity-80 truncate">
                                Defesa: {scen.defenseMechanism}
                              </div>
                            </div>
                            <span className="text-[10px] font-mono font-bold shrink-0">
                              ABRIR →
                            </span>
                          </button>
                        ))}

                        {quickSearchResults.techniques.map(res => (
                          <button
                            key={res.id}
                            type="button"
                            onClick={() => {
                              cyberAudio.playDossierOpen();
                              handleSelectTechnique(res.id, activeTab !== 'matrix');
                              setShowQuickSearchDropdown(false);
                            }}
                            className="w-full text-left px-3.5 py-2 hover:bg-[#161514] text-[#161514] hover:text-[#f4efe6] border-b border-[#161514]/30 flex items-center justify-between gap-3 cursor-pointer transition-colors group"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-[#b81d18] group-hover:text-[#f4efe6]">
                                  {res.id}
                                </span>
                                <span className="font-bold text-xs">{res.fullNamePt}</span>
                              </div>
                              <div className="text-[11px] opacity-80">MITRE: {res.fullNameEn}</div>
                            </div>
                            <span className="text-[10px] font-mono font-bold shrink-0">
                              DOSSIER →
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                </div>

                <button
                  type="button"
                  onClick={toggleAudio}
                  className={`px-2.5 py-1.5 text-xs font-mono font-bold border-2 border-[#161514] flex items-center gap-1 cursor-pointer transition-colors ${
                    audioEnabled
                      ? 'bg-[#b81d18] text-[#f4efe6]'
                      : 'bg-[#f4efe6] text-[#161514]'
                  }`}
                  title="Ativar/Desativar Som Tático"
                >
                  {audioEnabled ? (
                    <Volume2 className="w-4 h-4" />
                  ) : (
                    <VolumeX className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Linha 2: Logótipo Editorial Central "THE ARCHIVE™ — RED TEAM" */}
            <div className="py-1 text-center">
              <h1 className="font-archive-serif font-black text-4xl sm:text-5xl md:text-6xl tracking-[0.06em] uppercase text-[#161514] leading-none select-none">
                THE ARCHIVE<sup className="text-xs font-mono align-super ml-0.5">™</sup>
              </h1>

              {/* Linha horizontal com retângulo vermelho e RED TEAM exatamente como na capa */}
              <div className="flex items-center justify-center gap-3 mt-2">
                <div className="h-[1.5px] bg-[#161514] flex-1 max-w-xs" />
                <div className="flex items-center gap-2.5 px-2">
                  <span className="w-7 h-2.5 bg-[#b81d18] inline-block" />
                  <span className="font-condensed font-bold text-base md:text-lg tracking-[0.28em] uppercase text-[#b81d18]">
                    RED TEAM
                  </span>
                </div>
                <div className="h-[1.5px] bg-[#161514] flex-1 max-w-xs" />
              </div>
            </div>

            {/* Linha 3: Separadores Principais dos Módulos do Manual */}
            <nav className="flex flex-wrap items-center justify-center gap-2 pt-1">
              {[
                {
                  id: 'matrix',
                  label: '01 // VOLUMES E MANUAL DE CAMPO (MATRIZ MITRE)',
                  icon: Grid
                },
                {
                  id: 'icebreaker',
                  label: '02 // PROCEDIMENTOS DE EVASÃO E DESBLOQUEIO (ESTOU BLOQUEADO)',
                  icon: Zap,
                  highlight: true
                },
                {
                  id: 'catalog',
                  label: `03 // ÍNDICE COMPLETO DO ARQUIVO (${catalog.metadata.counts.totalTechniques} TÉCNICAS)`,
                  icon: BookOpen
                },
                {
                  id: 'workspace',
                  label: `04 // NOTAS PESSOAIS E CADEIA DE ATAQUE (${workspace.bookmarkedIds.length})`,
                  icon: Bookmark
                }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      cyberAudio.playClick();
                      setActiveTab(tab.id as ActiveTab);
                    }}
                    className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider border-2 border-[#161514] flex items-center gap-2 transition-all cursor-pointer ${
                      isActive
                        ? tab.highlight
                          ? 'bg-[#b81d18] text-[#f4efe6] shadow-sm'
                          : 'bg-[#161514] text-[#f4efe6] shadow-sm'
                        : 'bg-[#f4efe6] text-[#161514] hover:bg-[#dfd8c8]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                    {tab.highlight && !isActive && (
                      <span className="px-1.5 py-0.2 bg-[#b81d18] text-[#f4efe6] text-[9px] font-mono font-bold">
                        BYPASS
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Barra de Rastro de Navegação (Breadcrumbs) */}
          <TraceBreadcrumbBar
            history={traceHistory}
            currentIndex={traceIndex}
            onNavigateIndex={handleNavigateTraceIndex}
            onClearHistory={() => {
              setTraceHistory(traceHistory.slice(traceIndex, traceIndex + 1));
              setTraceIndex(0);
            }}
          />
        </header>

        {/* Área Principal do Manual */}
        <main
          className="flex-1 max-w-[1800px] w-full mx-auto px-4 lg:px-8 py-5"
          onClick={() => {
            if (showQuickSearchDropdown) setShowQuickSearchDropdown(false);
          }}
        >
          {activeTab === 'matrix' && (
            <TacticalMatrixView
              tactics={catalog.tactics}
              techniques={catalog.techniques}
              techniquesById={techniquesById}
              tacticsByShortname={tacticsByShortname}
              scenarios={catalog.iceBreakerScenarios}
              selectedPlatform={selectedPlatform}
              onChangePlatform={setSelectedPlatform}
              platforms={platforms}
              searchQuery={globalSearch}
              selectedTechniqueId={selectedTechniqueId}
              onSelectTechnique={id => handleSelectTechnique(id, false)}
              onJumpToScenario={handleJumpToScenario}
              bookmarkedIds={bookmarkedSet}
              onToggleBookmark={handleToggleBookmark}
              notesByTechniqueId={workspace.notesByTechniqueId}
              onChangeNote={handleChangeNote}
              activeTacticFocus={activeTacticFocus}
              onChangeTacticFocus={handleJumpToTactic}
            />
          )}

          {activeTab === 'icebreaker' && (
            <IceBreakerView
              scenarios={catalog.iceBreakerScenarios}
              lolbasArsenal={catalog.lolbasArsenal}
              mitigationBypassMap={catalog.mitigationBypassMap}
              techniquesById={techniquesById}
              onSelectTechnique={(id, openModal) => handleSelectTechnique(id, openModal)}
              selectedScenarioId={selectedScenarioId}
              onSelectScenarioId={id => {
                const scen = scenariosById.get(id);
                setSelectedScenarioId(id);
                if (scen) {
                  pushTrace({
                    type: 'scenario',
                    id: 'BYPASS',
                    label: scen.title
                  });
                }
              }}
            />
          )}

          {activeTab === 'catalog' && (
            <CatalogExplorerView
              techniques={catalog.techniques}
              tactics={catalog.tactics}
              tacticsByShortname={tacticsByShortname}
              platforms={platforms}
              globalSearch={globalSearch}
              onSelectTechnique={id => handleSelectTechnique(id, true)}
              bookmarkedIds={bookmarkedSet}
              onToggleBookmark={handleToggleBookmark}
            />
          )}

          {activeTab === 'workspace' && (
            <WorkspaceView
              workspace={workspace}
              onUpdateWorkspace={setWorkspace}
              techniquesById={techniquesById}
              tactics={catalog.tactics}
              tacticsByShortname={tacticsByShortname}
              onSelectTechnique={id => handleSelectTechnique(id, true)}
            />
          )}
        </main>

        {/* Rodapé Editorial Fiel à Base da Capa do Livro */}
        <footer className="bg-[#e3dccf] border-t-2 border-[#161514] py-4 px-6 lg:px-8 text-[11px] font-mono text-[#161514]">
          <div className="max-w-[1800px] mx-auto flex flex-wrap items-center justify-between gap-4">
            <div className="font-bold tracking-widest uppercase">
              <div>THE ARCHIVE</div>
              <div className="text-[#b81d18]">RED TEAM</div>
            </div>

            <div className="text-center tracking-[0.2em] uppercase font-bold">
              <div>NOTAS DE CAMPO DE SEGURANÇA OFENSIVA // MITRE ATT&amp;CK® {catalog.metadata.specVersion}</div>
              <div className="text-[#4a4742] text-[10px]">
                O CONHECIMENTO PRECEDE O ACESSO • PREPARAÇÃO • RECONHECIMENTO • OPERAÇÕES ADVERSÁRIAS
              </div>
            </div>

            <div className="text-right font-bold tracking-widest uppercase flex items-center gap-3">
              <div>
                <div>VOL. {spineVolNumber}</div>
                <div className="text-[#b81d18]">{spineRefCode}</div>
              </div>
              <ArchiveDeltaSymbol className="w-6 h-6 text-[#161514]" />
            </div>
          </div>
        </footer>
      </div>

      {/* Lombada Vermelha Vertical Direita (Idêntica às capas enviadas) */}
      <ArchiveRedSpine
        volumeNumber={spineVolNumber}
        volumeTitle={spineVolTitle}
        refCode={spineRefCode}
      />

      {/* Gaveta Slide-Over de Dossier (Quando aberto fora do Split-View) */}
      {drawerOpen && selectedTechnique && (
        <TechniqueDossier
          technique={selectedTechnique}
          techniquesById={techniquesById}
          tactics={catalog.tactics}
          tacticsByShortname={tacticsByShortname}
          scenarios={catalog.iceBreakerScenarios}
          onClose={() => setDrawerOpen(false)}
          onSelectTechnique={id => handleSelectTechnique(id, true)}
          onJumpToScenario={handleJumpToScenario}
          onJumpToTactic={handleJumpToTactic}
          isBookmarked={bookmarkedSet.has(selectedTechnique.id)}
          onToggleBookmark={handleToggleBookmark}
          operatorNote={workspace.notesByTechniqueId[selectedTechnique.id] || ''}
          onChangeNote={handleChangeNote}
          inlineMode={false}
        />
      )}
    </div>
  );
}

export default App;
