import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import fc from 'fast-check';

import { useUploadImage } from './use-upload-image';

/**
 * Tasks 3.2 (unit) and 3.3 (property) for `useUploadImage`.
 *
 * `msw` is not installed in this scaffold, so we stub the two network
 * dependencies directly:
 *   - `getPreSignedUrlForUpload` from the storage service
 *   - `globalThis.fetch` for the presigned blob PUT
 *
 * _Design: §Components and Interfaces (useUploadImage),
 *          §Correctness Properties #6 (single-use upload URL)._
 */

// ---- Module mocks (hoisted) ------------------------------------------------
vi.mock('@/lib/api/services/storage.service', () => ({
  getPreSignedUrlForUpload: vi.fn(),
}));

// Import AFTER vi.mock so the reference below points at the mock fn.
import { getPreSignedUrlForUpload } from '@/lib/api/services/storage.service';

const mockedPresign = getPreSignedUrlForUpload as unknown as ReturnType<typeof vi.fn>;

// ---- File helpers ----------------------------------------------------------

/**
 * Construct a `File` with controllable size, MIME type, and body. Using a
 * `Uint8Array` of the requested byte length gives us an exact `file.size` so
 * the size-boundary tests are deterministic.
 */
const makeFile = (opts?: {
  name?: string;
  type?: string;
  content?: string;
  size?: number;
}): File => {
  const name = opts?.name ?? 'pic.png';
  const type = opts?.type ?? 'image/png';

  let parts: BlobPart[];
  if (typeof opts?.size === 'number') {
    parts = [new Uint8Array(opts.size)];
  } else {
    parts = [opts?.content ?? 'abc'];
  }
  return new File(parts, name, { type });
};

// ---- Fixtures --------------------------------------------------------------
const OK_PRESIGN = {
  uploadUrl: 'https://blob.test/put?sig=1',
  fileId: 'f1',
  fileUrl: 'https://blob.test/f1',
  isSuccess: true,
} as const;

// ===========================================================================
// Task 3.2 — Unit tests
// ===========================================================================
describe('useUploadImage — unit (Task 3.2)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Fresh fetch stub per test; individual tests override as needed.
    globalThis.fetch = vi.fn() as unknown as typeof fetch;
  });

  it('happy path: returns { fileId, fileUrl } and progress === 100 after presign + PUT 200', async () => {
    mockedPresign.mockResolvedValue({ ...OK_PRESIGN });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useUploadImage({ moduleName: 'profile_image' }));

    const file = makeFile({ name: 'pic.png', type: 'image/png', content: 'abc' });

    let ret: { fileId: string; fileUrl: string } | undefined;
    await act(async () => {
      ret = await result.current.upload(file);
    });

    expect(ret).toEqual({ fileId: 'f1', fileUrl: 'https://blob.test/f1' });
    expect(result.current.progress).toBe(100);
    expect(result.current.error).toBeNull();
    expect(result.current.isUploading).toBe(false);

    // Presign called once, fetch PUT once.
    expect(mockedPresign).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [putUrl, putInit] = fetchMock.mock.calls[0];
    expect(putUrl).toBe(OK_PRESIGN.uploadUrl);
    expect((putInit as RequestInit).method).toBe('PUT');
  });

  it('size validation: throws BEFORE any network call when file.size > maxBytes', async () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useUploadImage({ moduleName: 'profile_image' }));
    // Default maxBytes for profile = 5 MB. Send 5 MB + 1 byte.
    const tooBig = makeFile({ size: 5 * 1024 * 1024 + 1, type: 'image/png' });

    await act(async () => {
      await expect(result.current.upload(tooBig)).rejects.toThrow();
    });

    expect(mockedPresign).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.isUploading).toBe(false);
  });

  it('MIME validation: throws BEFORE any network call for disallowed MIME (application/pdf)', async () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useUploadImage({ moduleName: 'profile_image' }));
    const pdf = makeFile({ name: 'doc.pdf', type: 'application/pdf', content: 'x' });

    await act(async () => {
      await expect(result.current.upload(pdf)).rejects.toThrow();
    });

    expect(mockedPresign).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('PUT 4xx: sets error, throws, and clears isUploading on PUT 403', async () => {
    mockedPresign.mockResolvedValue({ ...OK_PRESIGN });
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useUploadImage({ moduleName: 'profile_image' }));

    await act(async () => {
      await expect(
        result.current.upload(makeFile({ type: 'image/png' }))
      ).rejects.toThrow(/403/);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect((result.current.error as Error).message).toMatch(/403/);
    expect(result.current.isUploading).toBe(false);
  });

  it('reset() clears error and sets progress back to 0', async () => {
    mockedPresign.mockResolvedValue({ ...OK_PRESIGN });
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useUploadImage({ moduleName: 'profile_image' }));

    await act(async () => {
      await expect(
        result.current.upload(makeFile({ type: 'image/png' }))
      ).rejects.toThrow();
    });

    expect(result.current.error).not.toBeNull();

    act(() => {
      result.current.reset();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.progress).toBe(0);
  });
});

// ===========================================================================
// Task 3.3 — Property test: upload URL is single-use (Correctness Property #6)
// ===========================================================================
describe('useUploadImage — property (Task 3.3)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('**Validates: Requirements Design §Correctness Properties #6** — after a successful PUT to `p.uploadUrl`, any subsequent PUT to the same URL returns 4xx', async () => {
    /**
     * Mock blob endpoint: accepts the FIRST PUT to any URL (200), returns 403
     * on every subsequent PUT to the same URL.
     *
     * To verify the invariant with the hook, we force the presign service to
     * return the SAME url twice in a row. Since each `upload(file)` call
     * issues a fresh presign, a well-behaved blob store will reject the
     * second PUT — which the hook must surface as a thrown error.
     */
    await fc.assert(
      fc.asyncProperty(
        fc
          .record({
            name: fc
              .string({ minLength: 1, maxLength: 16 })
              // Keep names filesystem-safe; File ctor tolerates more but this
              // keeps counter-examples readable.
              .filter((s) => /^[A-Za-z0-9._-]+$/.test(s)),
            content: fc.string({ minLength: 1, maxLength: 64 }),
          })
          .map(({ name, content }) =>
            new File([content], `${name}.png`, { type: 'image/png' })
          ),
        async (file) => {
          const sharedUrl = 'https://blob.test/put?sig=shared';

          mockedPresign.mockReset();
          mockedPresign.mockResolvedValue({
            uploadUrl: sharedUrl,
            fileId: 'f-shared',
            fileUrl: 'https://blob.test/f-shared',
            isSuccess: true,
          });

          // Stateful mock blob endpoint: first PUT to a URL wins, later PUTs 403.
          const seen = new Set<string>();
          globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
            const key =
              typeof input === 'string'
                ? input
                : input instanceof URL
                ? input.toString()
                : (input as Request).url;
            if (seen.has(key)) {
              return {
                ok: false,
                status: 403,
                statusText: 'Forbidden',
              } as unknown as Response;
            }
            seen.add(key);
            return { ok: true, status: 200 } as unknown as Response;
          }) as unknown as typeof fetch;

          const { result } = renderHook(() =>
            useUploadImage({ moduleName: 'profile_image' })
          );

          // First upload: fresh presign → PUT 200 → succeeds.
          let first: { fileId: string; fileUrl: string } | undefined;
          await act(async () => {
            first = await result.current.upload(file);
          });
          expect(first).toEqual({
            fileId: 'f-shared',
            fileUrl: 'https://blob.test/f-shared',
          });

          // Second upload: presign returns the SAME url (reuse scenario).
          // Blob endpoint remembers the URL and 4xx's → hook must throw.
          let secondThrew = false;
          await act(async () => {
            try {
              await result.current.upload(file);
            } catch {
              secondThrew = true;
            }
          });
          expect(secondThrew).toBe(true);

          // Invariant: exactly two PUTs to the shared URL, only the first 200.
          const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
          expect(fetchMock).toHaveBeenCalledTimes(2);
          expect(fetchMock.mock.calls[0][0]).toBe(sharedUrl);
          expect(fetchMock.mock.calls[1][0]).toBe(sharedUrl);
        }
      ),
      { numRuns: 20 }
    );
  });
});
