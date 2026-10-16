import React from 'react';
import katex from 'katex';

interface MathRendererProps {
  text: string;
  className?: string;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ text, className = '' }) => {
  if (!text) return null;

  // Check if string contains LaTeX delimiter $...$ or $$...$$
  const hasLatex = text.includes('$') || text.includes('\\');

  if (hasLatex) {
    try {
      // Replace inline math $...$ with katex HTML
      const formatted = text.replace(/\$(.*?)\$/g, (_, math) => {
        try {
          return katex.renderToString(math, { throwOnError: false });
        } catch {
          return math;
        }
      });

      return (
        <span
          className={`font-sinhala leading-relaxed ${className}`}
          dangerouslySetInnerHTML={{ __html: formatted }}
        />
      );
    } catch {
      return <span className={`font-sinhala leading-relaxed ${className}`}>{text}</span>;
    }
  }

  // Pure Unicode rendering with Sinhala font support
  return <span className={`font-sinhala leading-relaxed ${className}`}>{text}</span>;
};
