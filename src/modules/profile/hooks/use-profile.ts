import { useGlobalQuery, useGlobalMutation } from '@/state/query-client/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { useErrorHandler } from '@/hooks/use-error-handler';
import {
  CreateProfileParams,
  UpdateProfileParams,
  CreateSectionParams,
  UpdateSectionParams,
  DeleteSectionParams,
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

  return useGlobalMutation({
    mutationFn: (params: DeleteSectionParams) => deleteCustomSection(params),
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'sections',
      });
      toast({
        variant: 'success',
        title: t('SECTION_DELETED'),
        description: t('SECTION_DELETED_SUCCESSFULLY'),
      });
    },
    onError: (error) => {
      handleError(error, { variant: 'destructive' });
    },
  });
};
