import React from 'react';
import {
  Bookmark,
  Download,
  Trash2,
  FileText,
  Crosshair,
  ExternalLink
} from 'lucide-react';
import type { Tactic, Technique, PentesterWorkspaceState } from '../types/mitre';
import { ArchiveRubberStamp } from './ArchiveArtwork';
import { cyberAudio } from '../utils/cyberAudio';

interface WorkspaceViewProps {
  workspace: PentesterWorkspaceState;
  onUpdateWorkspace: (updater: (prev: PentesterWorkspaceState) => PentesterWorkspaceState) => void;
  techniquesById: Map<string, Technique>;
  tactics: Tactic[];
  tacticsByShortname: Map<string, Tactic>;
  onSelectTechnique: (id: string) => void;
}

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({
  workspace,
  onUpdateWorkspace,
  techniquesById,
  tacticsByShortname,
  onSelectTechnique
}) => {
  const bookmarkedTechs = workspace.bookmarkedIds
    .map(id => techniquesById.get(id))
    .filter((t): t is Technique => Boolean(t));

  const notedTechIds = Object.entries(workspace.notesByTechniqueId)
    .filter(([, text]) => text.trim().length > 0)
    .map(([id]) => id);

  const allActiveIds = Array.from(new Set([...workspace.bookmarkedIds, ...notedTechIds]));
  const allActiveTechs = allActiveIds
    .map(id => techniquesById.get(id))
    .filter((t): t is Technique => Boolean(t));

  const handleExportMarkdown = () => {
    cyberAudio.playBreach();
    const lines: string[] = [
      `# THE ARCHIVE // RED TEAM — NOTAS DE CAMPO DE SEGURANÇA OFENSIVA`,
      `**Operação:** ${workspace.engagementName || 'Avaliação de Red Team'}`,
      `**Âmbito / Alvo:** ${workspace.targetScope || 'Infraestrutura Corporativa'}`,
      `**Data de Exportação:** ${new Date().toISOString().slice(0, 10)}`,
      `**Classificação:** TLP:AMBER`,
      ``,
      `---`,
      `## 1. Cadeia de ataque mapeada (MITRE ATT&CK)`,
      ``
    ];

    if (allActiveTechs.length === 0) {
      lines.push(`_Nenhuma técnica registada nas notas de campo até ao momento._`);
    } else {
      for (const t of allActiveTechs) {
        const tacLabels = t.tactics
          .map(s => tacticsByShortname.get(s)?.namePt || s)
          .join(', ');
        lines.push(`### [${t.id}] ${t.fullNamePt}`);
        lines.push(`- **Nome original MITRE:** ${t.fullNameEn}`);
        lines.push(`- **Táticas:** ${tacLabels}`);
        lines.push(`- **Plataformas:** ${t.platforms.join(', ')}`);
        lines.push(`- **Referência Oficial:** ${t.url}`);
        const note = workspace.notesByTechniqueId[t.id];
        if (note && note.trim()) {
          lines.push(`- **Notas de Campo & Evidências do Operador:**`);
          lines.push('```text');
          lines.push(note.trim());
          lines.push('```');
        }
        if (t.bypassGuide.bypasses.length > 0) {
          lines.push(`- **Vetor de Evasão / Bypass Associado:** ${t.bypassGuide.bypasses[0]}`);
        }
        lines.push(``);
      }
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `the-archive-field-notes-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Workspace do Pentester */}
      <div className="p-6 bg-[#f4efe6] border-2 border-[#161514] space-y-4 relative overflow-hidden">
        <div className="hidden xl:block absolute right-8 top-4 opacity-25">
          <ArchiveRubberStamp className="w-28 h-28" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="text-xs font-mono font-bold text-[#b81d18] uppercase tracking-widest flex items-center gap-1.5">
              <Crosshair className="w-4 h-4" />
              THE ARCHIVE // RED TEAM — NOTAS PESSOAIS E CADEIA DE ATAQUE (ARMAZENAMENTO LOCAL)
            </div>
            <h2 className="text-3xl font-slab uppercase text-[#161514] mt-1">
              NOTAS OPERACIONAIS E CADEIA DE ATAQUE
            </h2>
            <p className="text-sm text-[#262421] mt-1">
              Organize as técnicas utilizadas ou planeadas para a sua operação, registe evidências de campo e exporte o dossier técnico em Markdown.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 xl:mr-28">
            <button
              type="button"
              onClick={handleExportMarkdown}
              className="px-4 py-2.5 bg-[#161514] hover:bg-[#b81d18] text-[#f4efe6] font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4" />
              EXPORTAR NOTAS DE CAMPO (.MD)
            </button>

            {allActiveTechs.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  cyberAudio.playClick();
                  onUpdateWorkspace(prev => ({
                    ...prev,
                    bookmarkedIds: [],
                    notesByTechniqueId: {}
                  }));
                }}
                className="px-3 py-2.5 bg-[#ece6da] hover:bg-[#b81d18] text-[#b81d18] hover:text-[#f4efe6] border-2 border-[#b81d18] text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Trash2 className="w-4 h-4" /> LIMPAR REGISTOS
              </button>
            )}
          </div>
        </div>

        {/* Metadados da Operação */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t-2 border-[#161514]">
          <div>
            <label className="text-xs font-mono font-bold text-[#161514] uppercase block mb-1">
              CÓDIGO DA OPERAÇÃO:
            </label>
            <input
              type="text"
              value={workspace.engagementName}
              onChange={e =>
                onUpdateWorkspace(prev => ({ ...prev, engagementName: e.target.value }))
              }
              placeholder="Ex: RT-ARCH-03 // Avaliação de Red Team"
              className="w-full px-3 py-2 bg-[#ece6da] border border-[#161514] text-sm font-mono text-[#161514] outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-mono font-bold text-[#161514] uppercase block mb-1">
              ÂMBITO / SUPERFÍCIE DE ATAQUE:
            </label>
            <input
              type="text"
              value={workspace.targetScope}
              onChange={e =>
                onUpdateWorkspace(prev => ({ ...prev, targetScope: e.target.value }))
              }
              placeholder="Ex: Active Directory + Cloud Tenant"
              className="w-full px-3 py-2 bg-[#ece6da] border border-[#161514] text-sm font-mono text-[#161514] outline-none"
            />
          </div>
        </div>
      </div>

      {/* Lista de Técnicas na Kill Chain / Com Notas */}
      {allActiveTechs.length === 0 ? (
        <div className="p-12 bg-[#f4efe6] border-2 border-[#161514] text-center space-y-3">
          <Bookmark className="w-10 h-10 text-[#b81d18] mx-auto" />
          <h3 className="text-xl font-slab uppercase text-[#161514]">
            NENHUMA TÉCNICA ARQUIVADA NAS NOTAS DE CAMPO
          </h3>
          <p className="text-sm text-[#4a4742] max-w-xl mx-auto">
            Navegue pelos Volumes do <strong>THE ARCHIVE</strong> e clique em <code className="text-[#b81d18] font-bold">+ NOTAS DE CAMPO</code> em qualquer técnica para construir a sua cadeia de ataque e registar notas de operação.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allActiveTechs.map(tech => {
            const note = workspace.notesByTechniqueId[tech.id] || '';
            const isBooked = bookmarkedTechs.some(b => b.id === tech.id);

            return (
              <div
                key={tech.id}
                className="p-5 bg-[#f4efe6] border-2 border-[#161514] flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-[#161514] text-[#f4efe6] font-mono text-xs font-bold">
                        {tech.id}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          cyberAudio.playDossierOpen();
                          onSelectTechnique(tech.id);
                        }}
                        className="font-condensed font-bold text-lg uppercase text-[#161514] hover:text-[#b81d18] cursor-pointer flex items-center gap-1"
                      >
                        {tech.fullNamePt}
                        <ExternalLink className="w-3.5 h-3.5 text-[#b81d18]" />
                      </button>
                    </div>

                    {isBooked && (
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateWorkspace(prev => ({
                            ...prev,
                            bookmarkedIds: prev.bookmarkedIds.filter(id => id !== tech.id)
                          }))
                        }
                        className="text-xs font-mono font-bold text-[#b81d18] hover:underline cursor-pointer uppercase"
                      >
                        Remover
                      </button>
                    )}
                  </div>

                  <p className="text-xs font-mono font-bold text-[#b81d18]">MITRE: {tech.fullNameEn}</p>

                  <div>
                    <label className="text-[11px] font-mono font-bold text-[#161514] uppercase flex items-center gap-1 mb-1">
                      <FileText className="w-3 h-3 text-[#b81d18]" /> Notas de Campo / Comandos Executados:
                    </label>
                    <textarea
                      value={note}
                      onChange={e => {
                        const val = e.target.value;
                        onUpdateWorkspace(prev => ({
                          ...prev,
                          notesByTechniqueId: {
                            ...prev.notesByTechniqueId,
                            [tech.id]: val
                          }
                        }));
                      }}
                      placeholder={`Apontamentos operacionais para ${tech.id}...`}
                      rows={4}
                      className="w-full p-2.5 bg-[#ece6da] border border-[#161514] text-xs font-mono text-[#161514] outline-none"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
