import { graphqlClient } from '@/lib/graphql-client';
import {
  UserProfile,
  UserCustomSection,
  CreateProfileParams,
  UpdateProfileParams,
  CreateSectionParams,
  UpdateSectionParams,
  DeleteSectionParams,
  ProfileMutationResponse,
} from '../types/profile.types';
import {
  GET_PROFILE_BY_USERNAME_QUERY,
  GET_PROFILE_BY_USER_ID_QUERY,
  GET_ALL_PUBLISHED_PROFILES_QUERY,
  GET_SECTIONS_BY_USER_ID_QUERY,
} from '../graphql/queries';
import {
  CREATE_USER_PROFILE_MUTATION,
  UPDATE_USER_PROFILE_MUTATION,
  PUBLISH_USER_PROFILE_MUTATION,
  UNPUBLISH_USER_PROFILE_MUTATION,
  CREATE_CUSTOM_SECTION_MUTATION,
  UPDATE_CUSTOM_SECTION_MUTATION,
  DELETE_CUSTOM_SECTION_MUTATION,
} from '../graphql/mutations';

export const getProfileByUsername = async (context: {
  queryKey: [string, { username: string }];
}) => {
  const [, { username }] = context.queryKey;
  return graphqlClient.query<{ getUserProfiles: { items: UserProfile[] } }>({
    query: GET_PROFILE_BY_USERNAME_QUERY,
    variables: {
      input: {
        filter: JSON.stringify({ username }),
        sort: '{}',
        pageNo: 1,
        pageSize: 1,
      },
    },
  });
};

export const getProfileByUserId = async (context: {
  queryKey: [string, { userId: string }];
}) => {
  const [, { userId }] = context.queryKey;
  return graphqlClient.query<{ getUserProfiles: { items: UserProfile[] } }>({
    query: GET_PROFILE_BY_USER_ID_QUERY,
    variables: {
      input: {
        filter: JSON.stringify({ user_id: userId }),
        sort: '{}',
        pageNo: 1,
        pageSize: 1,
      },
    },
  });
};

export const getAllPublishedProfiles = async (context: {
  queryKey: [string, { pageNo: number; pageSize: number }];
}) => {
  const [, { pageNo, pageSize }] = context.queryKey;
  return graphqlClient.query<{ getUserProfiles: { items: UserProfile[] } }>({
    query: GET_ALL_PUBLISHED_PROFILES_QUERY,
    variables: {
      input: {
        filter: JSON.stringify({ is_published: true }),
        sort: '{}',
        pageNo,
        pageSize,
      },
    },
  });
};

export const getSectionsByUserId = async (context: {
  queryKey: [string, { userId: string }];
}) => {
  const [, { userId }] = context.queryKey;
  return graphqlClient.query<{ getUserCustomSections: { items: UserCustomSection[] } }>({
    query: GET_SECTIONS_BY_USER_ID_QUERY,
    variables: {
      input: {
        filter: JSON.stringify({ user_id: userId }),
        sort: JSON.stringify({ section_order: 'asc' }),
        pageNo: 1,
        pageSize: 100,
      },
    },
  });
};

export const createUserProfile = async (
  params: CreateProfileParams
): Promise<ProfileMutationResponse> => {
  const response = await graphqlClient.mutate<{
    insertUserProfile: ProfileMutationResponse;
  }>({
    query: CREATE_USER_PROFILE_MUTATION,
    variables: params,
  });
  return response.insertUserProfile;
};

export const updateUserProfile = async (
  params: UpdateProfileParams
): Promise<ProfileMutationResponse> => {
  const response = await graphqlClient.mutate<{
    updateUserProfile: ProfileMutationResponse;
  }>({
    query: UPDATE_USER_PROFILE_MUTATION,
    variables: params,
  });
  return response.updateUserProfile;
};

export const publishUserProfile = async (
  filter: string
): Promise<ProfileMutationResponse> => {
  const response = await graphqlClient.mutate<{
    updateUserProfile: ProfileMutationResponse;
  }>({
    query: PUBLISH_USER_PROFILE_MUTATION,
    variables: {
      filter,
      input: { is_published: true },
    },
  });
  return response.updateUserProfile;
};

export const unpublishUserProfile = async (
  filter: string
): Promise<ProfileMutationResponse> => {
  const response = await graphqlClient.mutate<{
    updateUserProfile: ProfileMutationResponse;
  }>({
    query: UNPUBLISH_USER_PROFILE_MUTATION,
    variables: {
      filter,
      input: { is_published: false },
    },
  });
  return response.updateUserProfile;
};

export const createCustomSection = async (
  params: CreateSectionParams
): Promise<ProfileMutationResponse> => {
  const response = await graphqlClient.mutate<{
    insertUserCustomSection: ProfileMutationResponse;
  }>({
    query: CREATE_CUSTOM_SECTION_MUTATION,
    variables: params,
  });
  return response.insertUserCustomSection;
};

export const updateCustomSection = async (
  params: UpdateSectionParams
): Promise<ProfileMutationResponse> => {
  const response = await graphqlClient.mutate<{
    updateUserCustomSection: ProfileMutationResponse;
  }>({
    query: UPDATE_CUSTOM_SECTION_MUTATION,
    variables: params,
  });
  return response.updateUserCustomSection;
};

export const deleteCustomSection = async (
  params: DeleteSectionParams
): Promise<ProfileMutationResponse> => {
  const response = await graphqlClient.mutate<{
    deleteUserCustomSection: ProfileMutationResponse;
  }>({
    query: DELETE_CUSTOM_SECTION_MUTATION,
    variables: params,
  });
  return response.deleteUserCustomSection;
};
