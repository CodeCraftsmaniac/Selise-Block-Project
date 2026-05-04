import { useQuery } from '@tanstack/react-query';
import {
  getPublicProfileByUsername,
  getPublicSectionsByUserId,
  getPublicPublishedProfiles,
} from '../services/public-profile.service';

/**
 * Public Profile Hooks
 *
 * React Query hooks for unauthenticated (public) data access.
 * These do NOT use useGlobalQuery since they should not trigger auth redirects.
 */

export const usePublicProfileByUsername = (username: string) => {
  return useQuery({
    queryKey: ['public-profile', { username }],
    queryFn: () => getPublicProfileByUsername(username),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!username,
    retry: false,
  });
};

export const usePublicSectionsByUserId = (userId: string) => {
  return useQuery({
    queryKey: ['public-sections', { userId }],
    queryFn: () => getPublicSectionsByUserId(userId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!userId,
    retry: false,
  });
};

export const usePublicPublishedProfiles = (pageNo = 1, pageSize = 20) => {
  return useQuery({
    queryKey: ['public-profiles', { pageNo, pageSize }],
    queryFn: () => getPublicPublishedProfiles(pageNo, pageSize),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
};
