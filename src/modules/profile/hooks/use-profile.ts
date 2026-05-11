import { useGlobalQuery, useGlobalMutation } from '@/state/query-client/hooks';
import { useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { useAuthStore } from '@/state/store/auth';
import {
  CreateProfileParams,
  UpdateProfileParams,
  CreateSectionParams,
  UpdateSectionParams,
  DeleteSectionParams,
  UserCustomSection,
  ProfileMutationResponse,
} from '../types/profile.types';
import {
  getProfileByUsername,
  getProfileByUserId,
  getAllPublishedProfiles,
  getSectionsByUserId,
  createUserProfile,
  updateUserProfile,
  publishUserProfile,
  unpublishUserProfile,
  createCustomSection,
  updateCustomSection,
  deleteCustomSection,
} from '../services/profile.service';

export const useGetProfileByUsername = (username: string) => {
  return useGlobalQuery({
    queryKey: ['profile', { username }],
    queryFn: getProfileByUsername,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!username,
  });
};

export const useGetProfileByUserId = (userId: string) => {
  return useGlobalQuery({
    queryKey: ['profile', { userId }],
    queryFn: getProfileByUserId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!userId,
  });
};

/**
 * Convenience wrapper that fetches the authenticated user's profile.
 *
 * Reads `useAuthStore.user.itemId` and delegates to `useGetProfileByUserId`.
 * When the user has not yet loaded (e.g. while `Guard` is still fetching the
 * account), the underlying query is disabled via the `enabled` flag on
 * `useGetProfileByUserId`, so no network request is issued.
 *
 * Matches design §Hook Signatures.
 */
export const useGetMyProfile = () => {
  const userId = useAuthStore((state) => state.user?.itemId ?? '');
  return useGetProfileByUserId(userId);
};

export const useGetAllPublishedProfiles = (pageNo = 1, pageSize = 20) => {
  return useGlobalQuery({
    queryKey: ['profiles', { pageNo, pageSize }],
    queryFn: getAllPublishedProfiles,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useGetSectionsByUserId = (userId: string) => {
  return useGlobalQuery({
    queryKey: ['sections', { userId }],
    queryFn: getSectionsByUserId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!userId,
  });
};

/**
 * Convenience wrapper that fetches the authenticated user's custom sections.
 *
 * Reads `useAuthStore.user.itemId` and delegates to `useGetSectionsByUserId`.
 * When the user is not yet loaded, the underlying query stays disabled so no
 * network request is issued.
 *
 * Matches design §Hook Signatures.
 */
export const useGetMySections = () => {
  const userId = useAuthStore((state) => state.user?.itemId ?? '');
  return useGetSectionsByUserId(userId);
};

export const useCreateProfile = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useGlobalMutation({
    mutationFn: (params: CreateProfileParams) => createUserProfile(params),
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'profile' || query.queryKey[0] === 'profiles',
      });
      toast({
        variant: 'success',
        title: t('PROFILE_CREATED'),
        description: t('PROFILE_CREATED_SUCCESSFULLY'),
      });
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { handleError } = useErrorHandler();

  return useGlobalMutation({
    mutationFn: (params: UpdateProfileParams) => updateUserProfile(params),
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'profile' || query.queryKey[0] === 'profiles',
      });
      toast({
        variant: 'success',
        title: t('PROFILE_UPDATED'),
        description: t('PROFILE_UPDATED_SUCCESSFULLY'),
      });
    },
    onError: (error) => {
      handleError(error, { variant: 'destructive' });
    },
  });
};

export const usePublishProfile = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useGlobalMutation({
    mutationFn: (filter: string) => publishUserProfile(filter),
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'profile' || query.queryKey[0] === 'profiles',
      });
      toast({
        variant: 'success',
        title: t('PROFILE_PUBLISHED'),
        description: t('PROFILE_PUBLISHED_SUCCESSFULLY'),
      });
    },
  });
};

export const useUnpublishProfile = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useGlobalMutation({
    mutationFn: (filter: string) => unpublishUserProfile(filter),
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'profile' || query.queryKey[0] === 'profiles',
      });
      toast({
        variant: 'success',
        title: t('PROFILE_UNPUBLISHED'),
        description: t('PROFILE_UNPUBLISHED_SUCCESSFULLY'),
      });
    },
  });
};

export const useCreateSection = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useGlobalMutation({
    mutationFn: (params: CreateSectionParams) => createCustomSection(params),
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'sections',
      });
      toast({
        variant: 'success',
        title: t('SECTION_CREATED'),
        description: t('SECTION_CREATED_SUCCESSFULLY'),
      });
    },
  });
};

export const useUpdateSection = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useGlobalMutation({
    mutationFn: (params: UpdateSectionParams) => updateCustomSection(params),
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'sections',
      });
      toast({
        variant: 'success',
        title: t('SECTION_UPDATED'),
        description: t('SECTION_UPDATED_SUCCESSFULLY'),
      });
    },
  });
};

export const useDeleteSection = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { handleError } = useErrorHandler();
  const userId = useAuthStore((state) => state.user?.itemId ?? '');

  return useGlobalMutation({
    mutationFn: (params: DeleteSectionParams) => deleteCustomSection(params),
    onSuccess: async () => {
      // Invalidate first so any consumer reading `['sections']` refetches
      // against authoritative server state after the delete.
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'sections',
      });

      toast({
        variant: 'success',
        title: t('SECTION_DELETED'),
        description: t('SECTION_DELETED_SUCCESSFULLY'),
      });

      // Re-normalize `section_order` so the remaining sections form a
      // contiguous `0..N-1` prefix. Guards design §Correctness Properties
      // #9 (section_order contiguity) against drift over time.
      if (!userId) return;

      try {
        const fresh = await getSectionsByUserId({
          queryKey: ['sections', { userId }],
        });
        const remaining = fresh?.getUserCustomSections?.items ?? [];

        // Deterministic target order: sort ascending by current
        // `section_order`, then the index in that sorted list is the
        // target contiguous index `0..N-1`. Treat an undefined
        // `section_order` as `0` for comparison purposes — such rows are
        // always considered out-of-position and will be normalized.
        const sorted = [...remaining].sort(
          (a, b) => (a.section_order ?? 0) - (b.section_order ?? 0)
        );

        const updates = sorted
          .map((section, targetIndex) => {
            if (section.section_order === targetIndex) return null;
            return updateCustomSection({
              filter: JSON.stringify({ ItemId: section.ItemId }),
              input: { section_order: targetIndex },
            }).catch((err) => {
              // Swallow per-row failures: the delete itself succeeded and
              // the success toast must not be blocked. The next reorder or
              // delete will converge the indices.
              console.warn(
                '[useDeleteSection] Failed to re-normalize section_order for ItemId=%s: %o',
                section.ItemId,
                err
              );
              return null;
            });
          })
          .filter((p): p is Promise<ProfileMutationResponse | null> => p !== null);

        if (updates.length > 0) {
          await Promise.all(updates);
          // Refresh once more so the re-normalized values land in cache.
          queryClient.invalidateQueries({
            predicate: (query) => query.queryKey[0] === 'sections',
          });
        }
      } catch (err) {
        // Re-normalization is best-effort; never surface to the user.
        console.warn('[useDeleteSection] Re-normalization pass failed: %o', err);
      }
    },
    onError: (error) => {
      handleError(error, { variant: 'destructive' });
    },
  });
};

/**
 * Cache shape for the `['sections', { userId }]` query. Mirrors the return
 * type of `getSectionsByUserId` in `profile.service.ts`.
 */
type SectionsQueryData =
  | { getUserCustomSections: { items: UserCustomSection[] } }
  | undefined;

/**
 * Reorders the authenticated user's custom sections.
 *
 * @remarks
 * Implements the composite reorder described in design §Key GraphQL
 * Operations (Reorder composite) and §Algorithmic Pseudocode
 * (`reorderSections`). The Blocks Data Gateway has no bulk-update mutation,
 * so this hook:
 *
 * 1. Reads the current sections for the caller from the TanStack Query cache
 *    (`['sections', { userId: me.itemId }]`).
 * 2. Builds the minimal set of `UPDATE_CUSTOM_SECTION_MUTATION` calls — one
 *    per section whose persisted `section_order` differs from its target
 *    index in the supplied `orderedIds` array.
 * 3. Executes those UPDATEs in parallel via `Promise.all`.
 *
 * The UI is kept responsive via an optimistic cache update in `onMutate`,
 * which is rolled back in `onError` if any UPDATE fails. A destructive toast
 * is surfaced via `useErrorHandler.handleError` on failure. `onSettled`
 * invalidates every `['sections', ...]` query key so the next read reflects
 * the authoritative server state (design §Error Handling Strategy —
 * optimistic updates).
 *
 * @param variables - Ordered array of section `ItemId`s. The index of each
 *   id in this array becomes that section's target `section_order`.
 *
 * @returns A mutation whose success result is the array of
 *   `ProfileMutationResponse`s for only the sections that were actually
 *   updated (sections already in position are skipped).
 *
 * Matches design §Hook Signatures.
 */
export const useReorderSections = (): UseMutationResult<
  ProfileMutationResponse[],
  Error,
  string[]
> => {
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();
  const userId = useAuthStore((state) => state.user?.itemId ?? '');

  const queryKey = ['sections', { userId }] as const;

  return useGlobalMutation<
    ProfileMutationResponse[],
    Error,
    string[],
    { previous: SectionsQueryData }
  >({
    // `suppressToast` ensures our `onError` callback runs for every failure
    // class. The default `useGlobalMutation` error handler can short-circuit
    // before delegating to user-supplied `onError`, which would prevent the
    // optimistic cache rollback below from executing.
    suppressToast: true,

    mutationFn: async (orderedIds) => {
      const current = queryClient.getQueryData<SectionsQueryData>(queryKey);
      const sections = current?.getUserCustomSections?.items ?? [];
      const byId = new Map(sections.map((section) => [section.ItemId, section]));

      // Build the minimal set of UPDATE operations: only sections whose
      // persisted `section_order` differs from the target index.
      const updates: Promise<ProfileMutationResponse>[] = [];
      for (let i = 0; i < orderedIds.length; i += 1) {
        const section = byId.get(orderedIds[i]);
        if (!section) continue;
        if (section.section_order !== i) {
          updates.push(
            updateCustomSection({
              filter: JSON.stringify({ ItemId: section.ItemId }),
              input: { section_order: i },
            })
          );
        }
      }

      return Promise.all(updates);
    },

    onMutate: async (orderedIds) => {
      // Pause in-flight reads for this key so they do not clobber the
      // optimistic cache write below.
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<SectionsQueryData>(queryKey);

      const items = previous?.getUserCustomSections?.items;
      if (items && items.length > 0) {
        const byId = new Map(items.map((section) => [section.ItemId, section]));
        const reordered: UserCustomSection[] = [];
        orderedIds.forEach((id, index) => {
          const section = byId.get(id);
          if (section) {
            reordered.push({ ...section, section_order: index });
          }
        });

        queryClient.setQueryData<SectionsQueryData>(queryKey, {
          ...previous,
          getUserCustomSections: {
            ...previous!.getUserCustomSections,
            items: reordered,
          },
        });
      }

      return { previous };
    },

    onError: (error, _variables, context) => {
      // Roll back to the snapshot taken in `onMutate` so the UI returns to
      // the last server-confirmed order.
      if (context?.previous !== undefined) {
        queryClient.setQueryData<SectionsQueryData>(queryKey, context.previous);
      }
      handleError(error, { variant: 'destructive' });
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'sections',
      });
    },
  });
};

/**
 * Alias export retained for compatibility with the design contract.
 * `useUpdateMyProfile` is the name pages are expected to consume; the
 * underlying implementation is `useUpdateProfile`.
 *
 * Matches design §Hook Signatures.
 */
export { useUpdateProfile as useUpdateMyProfile };
