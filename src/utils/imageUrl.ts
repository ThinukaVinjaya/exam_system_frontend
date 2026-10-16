import { API_BASE_URL } from '../services/api.js';

/**
 * Resolves a question/option image URL into a fully-qualified browser loadable URL.
 * Supports:
 * - External URLs: https://... or http://... or //...
 * - Data URLs: data:image/...
 * - Blob URLs: blob:...
 * - Server endpoints: /api/quizzes/images/:id
 * - Relative paths: /uploads/...
 */
export function getQuestionImageUrl(url?: string): string {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (!trimmed) return '';

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  if (trimmed.startsWith('//')) {
    const protocol = typeof window !== 'undefined' ? window.location.protocol : 'https:';
    return `${protocol}${trimmed}`;
  }

  const base = API_BASE_URL || '';
  const baseHost = base.replace(/\/api\/?$/, '');

  if (trimmed.startsWith('/')) {
    return `${baseHost}${trimmed}`;
  }

  return `${baseHost}/${trimmed}`;
}
