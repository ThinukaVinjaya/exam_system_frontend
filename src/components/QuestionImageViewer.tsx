import React, { useState, useEffect } from 'react';
import { getQuestionImageUrl } from '../utils/imageUrl.js';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  Image as ImageIcon,
  ExternalLink,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface QuestionImageViewerProps {
  imageUrl?: string;
  fallbackUrl?: string;
  imageCaption?: string;
  altText?: string;
  className?: string;
  maxHeightClass?: string;
}

export const QuestionImageViewer: React.FC<QuestionImageViewerProps> = ({
  imageUrl,
  fallbackUrl,
  imageCaption,
  altText = 'Question Diagram',
  className = '',
  maxHeightClass = 'max-h-72 sm:max-h-96',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hasError, setHasError] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);

  const resolvedUrl = getQuestionImageUrl(imageUrl);
  const resolvedFallback = getQuestionImageUrl(fallbackUrl);

  const [currentSrc, setCurrentSrc] = useState<string>(resolvedUrl || resolvedFallback);

  useEffect(() => {
    const src = resolvedUrl || resolvedFallback;
    setCurrentSrc(src);
    setHasError(false);
  }, [resolvedUrl, resolvedFallback, retryNonce]);

  // Clean body scroll lock handling
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          closeModal();
        }
      };

      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = prevOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  const closeModal = () => {
    setIsOpen(false);
    setZoomLevel(1);
  };

  const handleImageError = () => {
    // If main URL failed and a different fallback exists, try fallback
    if (resolvedFallback && currentSrc !== resolvedFallback) {
      setCurrentSrc(resolvedFallback);
      return;
    }
    setHasError(true);
  };

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHasError(false);
    const target = resolvedUrl || resolvedFallback;
    if (target) {
      const sep = target.includes('?') ? '&' : '?';
      setCurrentSrc(`${target}${sep}retry=${Date.now()}`);
    }
    setRetryNonce((prev) => prev + 1);
  };

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel((prev) => Math.min(prev + 0.35, 4));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel((prev) => Math.max(prev - 0.35, 0.75));
  };

  const handleResetZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel(1);
  };

  if (!imageUrl && !fallbackUrl && !currentSrc) return null;

  return (
    <>
      <div className={`my-3 sm:my-4 ${className}`}>
        <div className="relative group inline-block max-w-full">
          <div
            onClick={() => {
              if (!hasError && currentSrc) {
                setIsOpen(true);
                setZoomLevel(1);
              }
            }}
            className={`overflow-hidden rounded-2xl border bg-slate-100 dark:bg-slate-950/70 p-2 shadow-sm dark:shadow-lg transition-all ${
              hasError
                ? 'border-rose-300 dark:border-rose-800/60 bg-rose-50 dark:bg-rose-950/20'
                : 'border-slate-200 dark:border-slate-700/80 cursor-zoom-in hover:border-blue-500/60 hover:shadow-blue-500/10'
            }`}
          >
            {hasError ? (
              <div className="p-4 flex flex-col items-center justify-center gap-2.5 text-xs text-rose-700 dark:text-rose-300 font-sans text-center max-w-sm">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                  <span className="font-semibold font-sinhala">Failed to load image preview</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  (Failed to load image preview)
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="px-3 py-1 bg-rose-100 hover:bg-rose-200 dark:bg-rose-500/20 dark:hover:bg-rose-500/30 text-rose-700 dark:text-rose-200 border border-rose-300 dark:border-rose-500/40 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry</span>
                  </button>
                  {currentSrc && (
                    <a
                      href={currentSrc}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Open Link</span>
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <img
                src={currentSrc}
                alt={imageCaption || altText}
                onError={handleImageError}
                className={`${maxHeightClass} w-auto max-w-full rounded-xl object-contain mx-auto transition-transform duration-200 group-hover:scale-[1.01] block`}
              />
            )}

            {!hasError && (
              <div className="absolute top-4 right-4 bg-slate-900/90 dark:bg-slate-900/90 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-slate-700/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 shadow-md pointer-events-none">
                <ZoomIn className="w-3.5 h-3.5 text-blue-400" />
                <span>Click to Zoom</span>
              </div>
            )}
          </div>

          {imageCaption && (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-sinhala flex items-center justify-center gap-1.5 text-center">
              <ImageIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span className="font-medium text-slate-700 dark:text-slate-300">{imageCaption}</span>
            </p>
          )}
        </div>
      </div>

      {/* Lightbox / Zoom Modal Dialog */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={closeModal}
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-between p-3 sm:p-5 select-none animate-in fade-in duration-150"
        >
          {/* Prominent Fixed Close Button at Top-Right */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              closeModal();
            }}
            className="fixed top-4 right-4 z-[100] px-3.5 py-2 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold rounded-2xl shadow-2xl border border-rose-400/50 flex items-center gap-1.5 transition-all cursor-pointer hover:shadow-rose-600/30"
            title="Close Zoom (Esc)"
            aria-label="Close zoom viewer"
          >
            <X className="w-5 h-5" />
            <span className="text-xs font-bold font-sans">Close</span>
          </button>

          {/* Header Bar */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-5xl flex items-center justify-between pb-3 text-white border-b border-slate-800/80 px-2 sm:px-4 flex-wrap gap-2 pr-32"
          >
            <div className="flex items-center gap-2 font-sinhala truncate max-w-md">
              <ImageIcon className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-semibold truncate text-slate-200">
                {imageCaption || altText}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span className="bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                Zoom: {Math.round(zoomLevel * 100)}%
              </span>
            </div>
          </div>

          {/* Full-view Image Canvas (Clicking canvas background outside image closes modal) */}
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                closeModal();
              }
            }}
            className="flex-1 w-full flex items-center justify-center overflow-auto p-2 sm:p-4 cursor-zoom-out"
          >
            <img
              src={currentSrc}
              alt={imageCaption || altText}
              style={{ transform: `scale(${zoomLevel})` }}
              onClick={(e) => {
                e.stopPropagation();
                // Toggle zoom on image click
                setZoomLevel((prev) => (prev > 1.1 ? 1 : 2));
              }}
              className={`max-h-[75vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl transition-transform duration-200 border border-slate-800 bg-slate-900/60 ${
                zoomLevel > 1.1 ? 'cursor-zoom-out' : 'cursor-zoom-in'
              }`}
            />
          </div>

          {/* Floating Controls Bar */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col items-center gap-2 pb-2"
          >
            <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900/90 backdrop-blur-xl border border-slate-800 p-1.5 sm:p-2 rounded-2xl shadow-2xl">
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white rounded-xl transition-all flex items-center gap-1 text-xs font-bold cursor-pointer"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-4 h-4 text-blue-400" />
                <span className="hidden sm:inline">Zoom In</span>
              </button>

              <button
                type="button"
                onClick={handleZoomOut}
                className="p-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white rounded-xl transition-all flex items-center gap-1 text-xs font-bold cursor-pointer"
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-4 h-4 text-blue-400" />
                <span className="hidden sm:inline">Zoom Out</span>
              </button>

              <button
                type="button"
                onClick={handleResetZoom}
                className="p-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white rounded-xl transition-all flex items-center gap-1 text-xs font-bold cursor-pointer"
                title="Reset Zoom (100%)"
              >
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Reset</span>
              </button>

              <a
                href={currentSrc}
                target="_blank"
                rel="noreferrer"
                className="p-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white rounded-xl transition-all flex items-center gap-1 text-xs font-bold"
                title="Open full image in new tab"
              >
                <ExternalLink className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Open</span>
              </a>

              <button
                type="button"
                onClick={closeModal}
                className="px-3 py-2 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white rounded-xl transition-all flex items-center gap-1 text-xs font-bold shadow-md shadow-rose-600/30 cursor-pointer"
                title="Close Zoom (Esc)"
              >
                <X className="w-4 h-4" />
                <span>Close</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-400 font-sans flex items-center gap-2 select-none">
              <span>Click anywhere outside image or press <strong>Esc</strong> to close</span>
              <span>•</span>
              <span>Click image to toggle zoom</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
