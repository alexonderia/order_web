import { apiConfig } from './client';

const normalizeBaseUrl = () => apiConfig.baseUrl.trim().replace(/\/$/, '');

const resolveBaseUrl = () => {
  const configuredBaseUrl = normalizeBaseUrl();
  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  return '';
};

const buildAbsoluteUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.replace(/^\//, '');
  const baseUrl = resolveBaseUrl();

  if (!baseUrl) {
    return `/${normalizedPath}`;
  }

  return `${baseUrl}/${normalizedPath}`;
};

export const getDownloadUrl = (fileId?: number | null, filePath?: string | null): string | null => {
  if (fileId) {
    return buildAbsoluteUrl(`/api/web/files/${fileId}/download`);
  }

  if (filePath) {
    return buildAbsoluteUrl(filePath);
  }

  return null;
};