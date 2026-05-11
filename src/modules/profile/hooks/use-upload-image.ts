import { useCallback, useState } from 'react';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { getPreSignedUrlForUpload } from '@/lib/api/services/storage.service';
import type { GetPreSignedUrlForUploadResponse } from '@/lib/api/types/storage.types';

/**
 * Supported storage modules for image uploads. Maps 1:1 to the Blocks
 * `moduleName` slot used when requesting a presigned URL.
 */
export type UploadModuleName = 'profile_image' | 'header_image' | 'section_media';

export interface UseUploadImageOptions {
  moduleName: UploadModuleName;
  /**
   * Maximum file size in bytes. When not provided, a sensible default is
   * picked per `moduleName` (5 MB for profile/section media, 10 MB for header).
   */
  maxBytes?: number;
  /**
   * Accepted MIME types. Defaults to the standard web image set.
   */
  acceptedMimeTypes?: string[];
}

export interface UseUploadImageResult {
  /** Issue a fresh presign + PUT for the given file. Never reuses a prior URL. */
  upload: (file: File) => Promise<{ fileId: string; fileUrl: string }>;
  isUploading: boolean;
  /** 0..100. 0 before start, 25 after presign, 100 after PUT 2xx. */
  progress: number;
  error: Error | null;
  /** Clears `error` and resets `progress` to 0. */
  reset: () => void;
}

const FIVE_MB = 5 * 1024 * 1024;
const TEN_MB = 10 * 1024 * 1024;

const DEFAULT_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const defaultMaxBytesFor = (moduleName: UploadModuleName): number => {
  switch (moduleName) {
    case 'header_image':
      return TEN_MB;
    case 'profile_image':
    case 'section_media':
    default:
      return FIVE_MB;
  }
};

/**
 * Derive a public file URL. Presign responses from Blocks storage include a
 * `fileUrl` field, but the generated TypeScript type in
 * `storage.types.ts` only models `uploadUrl` + `fileId`. As a fallback we
 * strip the query string from `uploadUrl` to obtain the canonical blob URL.
 */
const resolveFileUrl = (
  presigned: GetPreSignedUrlForUploadResponse & { fileUrl?: string }
): string => {
  if (presigned.fileUrl && presigned.fileUrl.length > 0) {
    return presigned.fileUrl;
  }
  const uploadUrl = presigned.uploadUrl ?? '';
  const qIndex = uploadUrl.indexOf('?');
  return qIndex >= 0 ? uploadUrl.slice(0, qIndex) : uploadUrl;
};

/**
 * `useUploadImage` encapsulates the three-step presigned-URL upload flow:
 *   1. POST `/uds/v1/Files/GetPreSignedUrlForUpload` to obtain `{ uploadUrl, fileId, fileUrl }`.
 *   2. Raw `fetch` PUT of the blob bytes directly to `uploadUrl`. No auth headers — the
 *      presigned URL is the capability.
 *   3. On PUT 2xx return `{ fileId, fileUrl }` so the caller can persist the URL
 *      via a subsequent `updateUserProfile` (conservative update).
 *
 * Every `upload(file)` call issues a fresh presign; URLs are never cached
 * across invocations (Correctness Property #6 — single-use upload URL).
 */
export const useUploadImage = (opts: UseUploadImageOptions): UseUploadImageResult => {
  const {
    moduleName,
    maxBytes = defaultMaxBytesFor(opts.moduleName),
    acceptedMimeTypes = DEFAULT_MIME_TYPES,
  } = opts;

  const { handleError } = useErrorHandler();

  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const reset = useCallback(() => {
    setError(null);
    setProgress(0);
  }, []);

  const upload = useCallback(
    async (file: File): Promise<{ fileId: string; fileUrl: string }> => {
      // --- Pre-network validation ---------------------------------------
      if (!file) {
        const err = new Error('No file provided to useUploadImage.upload');
        setError(err);
        handleError(err, { variant: 'destructive' });
        throw err;
      }

      if (file.size > maxBytes) {
        const mb = (maxBytes / (1024 * 1024)).toFixed(1);
        const err = new Error(
          `File "${file.name}" is ${file.size} bytes which exceeds the ${mb} MB limit for ${moduleName}.`
        );
        setError(err);
        handleError(err, { variant: 'destructive' });
        throw err;
      }

      if (!acceptedMimeTypes.includes(file.type)) {
        const err = new Error(
          `File type "${file.type || 'unknown'}" is not allowed. Accepted types: ${acceptedMimeTypes.join(', ')}.`
        );
        setError(err);
        handleError(err, { variant: 'destructive' });
        throw err;
      }

      // --- Upload flow --------------------------------------------------
      setError(null);
      setProgress(0);
      setIsUploading(true);

      try {
        // Step 1: request a fresh presigned URL. Never reuse a prior URL.
        const presigned = (await getPreSignedUrlForUpload({
          name: file.name,
          moduleName,
          projectKey: import.meta.env.VITE_X_BLOCKS_KEY,
          accessModifier: 'Public',
        })) as GetPreSignedUrlForUploadResponse & { fileUrl?: string };

        if (!presigned.uploadUrl || !presigned.fileId) {
          throw new Error('Presigned URL response was missing uploadUrl or fileId.');
        }

        setProgress(25);

        // Step 2: PUT the blob bytes directly. No Authorization, no x-blocks-key —
        // the presigned URL itself is the capability.
        const putResponse = await fetch(presigned.uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });

        if (!putResponse.ok) {
          throw new Error(
            `Blob PUT failed with status ${putResponse.status} ${putResponse.statusText}`.trim()
          );
        }

        setProgress(100);

        // Step 3: return IDs for the caller to persist via updateUserProfile.
        return {
          fileId: presigned.fileId,
          fileUrl: resolveFileUrl(presigned),
        };
      } catch (caught) {
        const err = caught instanceof Error ? caught : new Error(String(caught));
        setError(err);
        handleError(err, { variant: 'destructive' });
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [moduleName, maxBytes, acceptedMimeTypes, handleError]
  );

  return { upload, isUploading, progress, error, reset };
};

export default useUploadImage;
