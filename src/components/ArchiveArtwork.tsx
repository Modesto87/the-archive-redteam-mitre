import React from 'react';

export const ArchiveWireframeGlobe: React.FC<{ className?: string }> = ({
  className = 'w-10 h-10'
}) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className={className}
  >
    <circle cx="32" cy="32" r="28" />
    <ellipse cx="32" cy="32" rx="18" ry="28" />
    <ellipse cx="32" cy="32" rx="8" ry="28" />
    <line x1="32" y1="4" x2="32" y2="60" />
    <line x1="4" y1="32" x2="60" y2="32" />
    <path d="M8 20 Q32 24 56 20" />
    <path d="M8 44 Q32 40 56 44" />
    <path d="M14 11 Q32 15 50 11" />
    <path d="M14 53 Q32 49 50 53" />
  </svg>
);

export const ArchiveDeltaSymbol: React.FC<{ className?: string }> = ({
  className = 'w-6 h-6'
}) => (
  <svg viewBox="0 0 40 36" fill="currentColor" className={className}>
    {/* Triângulo superior */}
    <polygon points="20,2 11,18 29,18" />
    {/* Triângulo inferior esquerdo */}
    <polygon points="10,20 1,35 19,35" />
    {/* Triângulo inferior direito */}
    <polygon points="30,20 21,35 39,35" />
  </svg>
);

export const ArchiveRubberStamp: React.FC<{ className?: string }> = ({
  className = 'w-28 h-28'
}) => (
  <div
    className={`relative select-none pointer-events-none flex items-center justify-center ${className}`}
  >
    <svg viewBox="0 0 160 160" className="w-full h-full text-[#b81d18] opacity-90 -rotate-6">
      <circle
        cx="80"
        cy="80"
        r="74"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
      />
      <circle
        cx="80"
        cy="80"
        r="68"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <circle
        cx="80"
        cy="80"
        r="46"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />

      {/* Caminhos circulares para o texto THE ARCHIVE e RED TEAM */}
      <defs>
        <path
          id="stampTopArc"
          d="M 24,80 A 56,56 0 1,1 136,80"
        />
        <path
          id="stampBottomArc"
          d="M 136,80 A 56,56 0 1,1 24,80"
        />
      </defs>

      <text
        fill="currentColor"
        fontSize="12.5"
        fontWeight="700"
        letterSpacing="3.5"
        className="font-mono"
      >
        <textPath href="#stampTopArc" startOffset="50%" textAnchor="middle">
          THE ARCHIVE
        </textPath>
      </text>

      <text
        fill="currentColor"
        fontSize="12"
        fontWeight="700"
        letterSpacing="4"
        className="font-mono"
      >
        <textPath href="#stampBottomArc" startOffset="50%" textAnchor="middle">
          ★ RED TEAM ★
        </textPath>
      </text>

      {/* Silhueta da Águia Tática no centro do carimbo */}
      <path
        fill="currentColor"
        d="M80 56 L75 64 L64 60 L50 50 L55 62 L46 61 L56 69 L49 70 L62 76 L72 79 L67 90 L75 88 L80 96 L85 88 L93 90 L88 79 L98 76 L111 70 L104 69 L114 61 L105 62 L110 50 L96 60 L85 64 Z"
      />
    </svg>
  </div>
);

interface ArchiveRedSpineProps {
  volumeNumber: string;
  volumeTitle: string;
  refCode: string;
}

export const ArchiveRedSpine: React.FC<ArchiveRedSpineProps> = ({
  volumeNumber,
  volumeTitle,
  refCode
}) => {
  return (
    <aside className="hidden xl:flex flex-col items-center justify-between w-14 shrink-0 archive-red-spine text-[#161514] py-6 px-1.5 border-l-2 border-[#161514] select-none sticky top-0 h-screen z-40">
      {/* Topo: VOL. XX */}
      <div className="text-center border-b border-[#161514]/40 pb-3 w-full">
        <div className="font-archive-serif font-bold text-[10px] tracking-widest uppercase">
          VOL.
        </div>
        <div className="font-archive-serif font-black text-2xl leading-none mt-0.5">
          {volumeNumber}
        </div>
      </div>

      {/* Globo + RED TEAM */}
      <div className="flex flex-col items-center gap-1.5 py-2 border-b border-[#161514]/40 w-full">
        <ArchiveWireframeGlobe className="w-8 h-8 text-[#161514]" />
        <div className="font-mono font-bold text-[9px] tracking-widest text-center leading-tight uppercase">
          RED
          <br />
          TEAM
        </div>
      </div>

      {/* Título Vertical Rotacionado */}
      <div className="flex-1 flex items-center justify-center py-4 overflow-hidden">
        <div className="writing-vertical-rl font-mono font-bold text-[10px] tracking-[0.22em] uppercase text-[#161514] flex items-center gap-3 whitespace-nowrap">
          <span>{volumeTitle}</span>
          <span className="opacity-50">|</span>
          <span>NOTAS DE CAMPO</span>
          <span className="opacity-50">|</span>
          <span>{refCode}</span>
        </div>
      </div>

      {/* Riscas Diagonais + Emblema Delta */}
      <div className="flex flex-col items-center gap-4 w-full pt-3 border-t border-[#161514]/40">
        <div className="w-8 h-12 archive-hazard-stripes" />
        <ArchiveDeltaSymbol className="w-6 h-6 text-[#161514]" />
      </div>
    </aside>
  );
};
