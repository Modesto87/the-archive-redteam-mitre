import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  History,
  Zap,
  Shield,
  Crosshair,
  Trash2
} from 'lucide-react';
import { cyberAudio } from '../utils/cyberAudio';

export interface TraceHistoryItem {
  type: 'technique' | 'scenario' | 'tactic';
  id: string;
  label: string;
  sublabel?: string;
}

interface TraceBreadcrumbBarProps {
  history: TraceHistoryItem[];
  currentIndex: number;
  onNavigateIndex: (index: number) => void;
  onClearHistory: () => void;
}

export const TraceBreadcrumbBar: React.FC<TraceBreadcrumbBarProps> = ({
  history,
  currentIndex,
  onNavigateIndex,
  onClearHistory
}) => {
  if (history.length === 0) return null;

  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < history.length - 1;

  return (
    <div className="bg-[#e3dccf] border-y border-[#161514] px-4 lg:px-8 py-1.5">
      <div className="max-w-[1800px] mx-auto flex items-center justify-between gap-3">
        {/* Botões Voltar / Avançar no Fluxo */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-mono font-bold text-[#161514] uppercase tracking-widest flex items-center gap-1 mr-1">
            <History className="w-3.5 h-3.5 text-[#b81d18]" />
            LOG DE NAVEGAÇÃO //
          </span>

          <button
            type="button"
            disabled={!canGoBack}
            onClick={() => {
              if (canGoBack) {
                cyberAudio.playClick();
                onNavigateIndex(currentIndex - 1);
              }
            }}
            className={`px-2 py-0.5 text-[11px] font-mono font-bold border flex items-center gap-0.5 transition-colors ${
              canGoBack
                ? 'bg-[#f4efe6] text-[#161514] border-[#161514] hover:bg-[#161514] hover:text-[#f4efe6] cursor-pointer'
                : 'bg-[#e8e2d6] text-[#9c968b] border-[#b8b1a3] cursor-not-allowed'
            }`}
            title="Voltar ao registo anterior"
          >
            <ChevronLeft className="w-3 h-3" /> ANT
          </button>

          <button
            type="button"
            disabled={!canGoForward}
            onClick={() => {
              if (canGoForward) {
                cyberAudio.playClick();
                onNavigateIndex(currentIndex + 1);
              }
            }}
            className={`px-2 py-0.5 text-[11px] font-mono font-bold border flex items-center gap-0.5 transition-colors ${
              canGoForward
                ? 'bg-[#f4efe6] text-[#161514] border-[#161514] hover:bg-[#161514] hover:text-[#f4efe6] cursor-pointer'
                : 'bg-[#e8e2d6] text-[#9c968b] border-[#b8b1a3] cursor-not-allowed'
            }`}
            title="Avançar para o registo seguinte"
          >
            SEG <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Trilha de Migalhas (Breadcrumbs) Interativa */}
        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto py-0.5">
          {history.map((item, idx) => {
            const isCurrent = idx === currentIndex;
            const isScenario = item.type === 'scenario';
            const isTactic = item.type === 'tactic';

            return (
              <React.Fragment key={`${item.type}-${item.id}-${idx}`}>
                {idx > 0 && (
                  <span className="text-[#6e6a63] font-mono text-xs select-none">•</span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    cyberAudio.playClick();
                    onNavigateIndex(idx);
                  }}
                  className={`px-2.5 py-0.5 text-[11px] font-mono flex items-center gap-1.5 shrink-0 border transition-all cursor-pointer ${
                    isCurrent
                      ? isScenario
                        ? 'bg-[#b81d18] text-[#f4efe6] border-[#161514] font-bold shadow-xs'
                        : 'bg-[#161514] text-[#f4efe6] border-[#161514] font-bold shadow-xs'
                      : 'bg-[#f4efe6] text-[#262421] border-[#161514]/40 hover:border-[#b81d18] hover:text-[#b81d18]'
                  }`}
                >
                  {isScenario ? (
                    <Zap className="w-3 h-3 shrink-0" />
                  ) : isTactic ? (
                    <Crosshair className="w-3 h-3 shrink-0" />
                  ) : (
                    <Shield className="w-3 h-3 shrink-0" />
                  )}
                  <span className="font-bold">{item.id}</span>
                  <span className="truncate max-w-[150px]">{item.label}</span>
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Limpar Rastro */}
        {history.length > 1 && (
          <button
            type="button"
            onClick={() => {
              cyberAudio.playClick();
              onClearHistory();
            }}
            className="text-[10px] font-mono font-bold text-[#5c5852] hover:text-[#b81d18] flex items-center gap-1 shrink-0 cursor-pointer uppercase"
            title="Limpar histórico de navegação"
          >
            <Trash2 className="w-3 h-3" /> LIMPAR
          </button>
        )}
      </div>
    </div>
  );
};
