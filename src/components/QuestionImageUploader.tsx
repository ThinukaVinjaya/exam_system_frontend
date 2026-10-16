import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api.js';
import { getQuestionImageUrl } from '../utils/imageUrl.js';
import {
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  X,
} from 'lucide-react';
import { QuestionImageViewer } from './QuestionImageViewer.js';

interface QuestionImageUploaderProps {
  imageUrl?: string;
  imageCaption?: string;
  onChange: (imageUrl: string, imageCaption?: string) => void;
  questionNumberLabel?: string;
}

export const QuestionImageUploader: React.FC<QuestionImageUploaderProps> = ({
  imageUrl = '',
  imageCaption = '',
  onChange,
  questionNumberLabel,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [inputMode, setInputMode] = useState<'upload' | 'url'>('upload');
  const [urlDraft, setUrlDraft] = useState(imageUrl || '');
  const [captionDraft, setCaptionDraft] = useState(imageCaption || '');
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync draft if prop changes
  useEffect(() => {
    setUrlDraft(imageUrl || '');
  }, [imageUrl]);

  useEffect(() => {
    setCaptionDraft(imageCaption || '');
  }, [imageCaption]);

  // Clean up object URLs on unmount or replace
  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        try {
          URL.revokeObjectURL(localPreviewUrl);
        } catch {}
      }
    };
  }, [localPreviewUrl]);

  const handleUploadFile = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file (PNG, JPG, WebP, GIF)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Maximum image size is 5MB');
      return;
    }

    // Immediately create local preview object URL for instantaneous user preview
    if (localPreviewUrl) {
      try {
        URL.revokeObjectURL(localPreviewUrl);
      } catch {}
    }
    const localUrl = URL.createObjectURL(file);
    setLocalPreviewUrl(localUrl);

    setIsUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await api.post('/admin/questions/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data?.success && res.data?.data?.imageUrl) {
        const uploadedUrl = res.data.data.imageUrl;
        setUrlDraft(uploadedUrl);
        onChange(uploadedUrl, captionDraft);
      } else {
        setUploadError('Failed to upload image');
      }
    } catch (err: any) {
      setUploadError(
        err.response?.data?.message || 'Failed to upload image'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUploadFile(e.target.files[0]);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      const file = e.clipboardData.files[0];
      if (file.type.startsWith('image/')) {
        e.preventDefault();
        handleUploadFile(file);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        handleUploadFile(file);
      } else {
        setUploadError('Only image files allowed');
      }
    }
  };

  const handleApplyUrl = () => {
    const trimmed = urlDraft.trim();
    if (!trimmed) {
      onChange('', captionDraft);
      return;
    }
    onChange(trimmed, captionDraft);
  };

  const handleCaptionChange = (val: string) => {
    setCaptionDraft(val);
    onChange(imageUrl || localPreviewUrl, val);
  };

  const handleRemoveImage = () => {
    if (localPreviewUrl) {
      try {
        URL.revokeObjectURL(localPreviewUrl);
      } catch {}
    }
    setLocalPreviewUrl('');
    setUrlDraft('');
    setCaptionDraft('');
    setUploadError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onChange('', '');
  };

  // Active display image source: local object URL takes priority for instant preview, then prop imageUrl
  const activeDisplaySrc = localPreviewUrl || imageUrl;
  const hasImage = Boolean(activeDisplaySrc && activeDisplaySrc.trim());
  const resolvedDisplayUrl = getQuestionImageUrl(activeDisplaySrc);

  return (
    <div
      onPaste={handlePaste}
      className="p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 space-y-3 font-sans transition-all"
    >
      <div className="flex items-center justify-between flex-wrap gap-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
          <ImageIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Diagram / Image for Question</span>
          {questionNumberLabel && <span className="text-slate-400 dark:text-slate-500 font-normal">({questionNumberLabel})</span>}
        </label>

        {hasImage && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-500/20 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Change Image</span>
            </button>
            <button
              type="button"
              onClick={handleRemoveImage}
              className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center gap-1 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-500/20 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Immediate Visible Preview - NO CLICK NEEDED! */}
      {hasImage ? (
        <div className="space-y-3">
          <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/70 flex flex-col sm:flex-row items-center gap-4 shadow-sm">
            {/* The Direct Live Image Preview Card - ALWAYS VISIBLE IMMEDIATELY WITHOUT CLICKING */}
            <div className="flex-shrink-0">
              <QuestionImageViewer
                imageUrl={activeDisplaySrc}
                fallbackUrl={localPreviewUrl}
                imageCaption={captionDraft || imageCaption}
                maxHeightClass="max-h-40 sm:max-h-44"
                className="my-0"
              />
            </div>

            <div className="flex-1 space-y-2.5 w-full text-left">
              <div className="flex items-center gap-2 flex-wrap">
                {isUploading ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/15 px-2.5 py-0.5 rounded-md border border-blue-200 dark:border-blue-500/30">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading to server...</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Picture Ready
                  </span>
                )}
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate max-w-xs" title={activeDisplaySrc}>
                  {localPreviewUrl && !imageUrl
                    ? 'Local File'
                    : imageUrl.startsWith('/api')
                    ? 'Server Image'
                    : 'External Image'}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Image Caption / Figure Label (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Figure 1: Circuit Diagram"
                  value={captionDraft}
                  onChange={(e) => handleCaptionChange(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-xs font-sinhala placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {uploadError && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between gap-2 font-sinhala">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{uploadError}</span>
              </div>
              <button
                type="button"
                onClick={() => setUploadError('')}
                className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Empty state: Upload or URL */
        <div className="space-y-2.5">
          {/* Tab selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 w-fit">
            <button
              type="button"
              onClick={() => setInputMode('upload')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                inputMode === 'upload'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" /> Upload / Paste Image
            </button>
            <button
              type="button"
              onClick={() => setInputMode('url')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                inputMode === 'url'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" /> Image Web URL
            </button>
          </div>

          {inputMode === 'upload' ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-4 sm:p-5 text-center cursor-pointer transition-all ${
                isDragOver
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-300 dark:border-slate-800 hover:border-blue-500 dark:hover:border-slate-700 bg-white dark:bg-slate-900/40 hover:bg-blue-50/30 dark:hover:bg-slate-900/60'
              }`}
            >
              {isUploading ? (
                <div className="flex flex-col items-center justify-center py-2 space-y-2 text-blue-600 dark:text-blue-400">
                  <Loader2 className="w-7 h-7 animate-spin" />
                  <span className="text-xs font-bold font-sinhala">Uploading image...</span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto border border-blue-200 dark:border-blue-500/20">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div className="text-xs text-slate-700 dark:text-slate-300 font-semibold font-sinhala">
                    Click to choose image, drag & drop, or paste directly with <span className="text-blue-600 dark:text-blue-400 font-mono font-bold">Ctrl+V</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Supports PNG, JPG, JPEG, WebP, GIF (Max 5MB)
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  placeholder="Paste direct image URL (e.g. https://example.com/diagram.png)"
                  value={urlDraft}
                  onChange={(e) => setUrlDraft(e.target.value)}
                  className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Apply
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                You can link to an image on Google Drive, Imgur, or any website.
              </p>
            </div>
          )}

          {uploadError && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between gap-2 font-sinhala">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{uploadError}</span>
              </div>
              <button
                type="button"
                onClick={() => setUploadError('')}
                className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
