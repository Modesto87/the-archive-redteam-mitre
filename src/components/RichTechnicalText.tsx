import React from 'react';

interface RichTechnicalTextProps {
  text: string;
  onSelectTechnique?: (id: string) => void;
  className?: string;
}

export const RichTechnicalText: React.FC<RichTechnicalTextProps> = ({
  text,
  onSelectTechnique,
  className = ''
}) => {
  if (!text) return null;

  const paragraphs = text.split(/\n\n+/);

  const renderInline = (line: string, keyPrefix: string) => {
    const regex = /(`[^`]+`|\*\*[^*]+\*\*|\bT\d{4}(?:\.\d{3})?\b)/g;
    const parts = line.split(regex);

    return parts.map((part, idx) => {
      const key = `${keyPrefix}-${idx}`;
      if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
        const inner = part.slice(1, -1);
        if (/^T\d{4}(?:\.\d{3})?$/.test(inner) && onSelectTechnique) {
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectTechnique(inner)}
              className="inline-flex items-center px-1.5 py-0.5 mx-0.5 text-xs font-mono font-bold bg-[#b81d18]/10 text-[#b81d18] border border-[#b81d18] hover:bg-[#b81d18] hover:text-[#f4efe6] transition-colors cursor-pointer"
              title={`Abrir Dossier da Técnica ${inner}`}
            >
              {inner}
            </button>
          );
        }
        return (
          <code
            key={key}
            className="px-1.5 py-0.5 mx-0.5 text-[12.5px] font-mono font-medium bg-[#e3dccf] text-[#8f1410] border border-[#161514]/20"
          >
            {inner}
          </code>
        );
      }

      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return (
          <strong key={key} className="font-bold text-[#161514]">
            {part.slice(2, -2)}
          </strong>
        );
      }

      if (/^T\d{4}(?:\.\d{3})?$/.test(part) && onSelectTechnique) {
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelectTechnique(part)}
            className="inline-flex items-center px-1.5 py-0.5 mx-0.5 text-xs font-mono font-bold bg-[#b81d18]/10 text-[#b81d18] border border-[#b81d18] hover:bg-[#b81d18] hover:text-[#f4efe6] transition-colors cursor-pointer"
            title={`Abrir Dossier da Técnica ${part}`}
          >
            {part}
          </button>
        );
      }

      return <React.Fragment key={key}>{part}</React.Fragment>;
    });
  };

  return (
    <div className={`space-y-3 leading-relaxed text-[#262421] ${className}`}>
      {paragraphs.map((para, pIdx) => {
        const lines = para.split('\n');
        const isList = lines.every(
          l => l.trim().startsWith('* ') || l.trim().startsWith('- ') || l.trim() === ''
        );

        if (isList) {
          return (
            <ul key={pIdx} className="space-y-1.5 pl-4 border-l-2 border-[#b81d18] my-2">
              {lines
                .filter(l => l.trim().length > 0)
                .map((l, lIdx) => {
                  const clean = l.trim().replace(/^[*-]\s+/, '');
                  return (
                    <li key={lIdx} className="text-sm text-[#262421] flex items-start gap-2">
                      <span className="text-[#b81d18] font-mono text-xs font-bold mt-0.5">▪</span>
                      <span className="flex-1">{renderInline(clean, `p${pIdx}-l${lIdx}`)}</span>
                    </li>
                  );
                })}
            </ul>
          );
        }

        return (
          <p key={pIdx} className="text-[14.5px] text-[#262421] leading-relaxed">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {renderInline(line, `p${pIdx}-ln${lIdx}`)}
                {lIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
};
