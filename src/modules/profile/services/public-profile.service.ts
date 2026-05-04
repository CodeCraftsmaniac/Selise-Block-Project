/**
 * Public Profile Service
 *
 * Service functions for unauthenticated access to public profile data.
 * Uses publicGraphqlClient which does not send Authorization headers.
 */

import { publicGraphqlClient } from '@/lib/public-graphql-client';
import {
  GET_PROFILE_BY_USERNAME_QUERY,
  GET_SECTIONS_BY_USER_ID_QUERY,
  GET_ALL_PUBLISHED_PROFILES_QUERY,
} from '../graphql/queries';
import { UPDATE_USER_PROFILE_MUTATION } from '../graphql/mutations';
import { UserProfile, UserCustomSection } from '../types/profile.types';

interface ProfileQueryResponse {
  getUserProfiles: {
    items: UserProfile[];
    totalCount: number;
  };
}

interface SectionQueryResponse {
  getUserCustomSections: {
    items: UserCustomSection[];
    totalCount: number;
  };
}

export const getPublicProfileByUsername = async (username: string): Promise<ProfileQueryResponse> => {
  return publicGraphqlClient.query<ProfileQueryResponse>({
    query: GET_PROFILE_BY_USERNAME_QUERY,
    variables: { username },
  });
};

export const getPublicSectionsByUserId = async (userId: string): Promise<SectionQueryResponse> => {
  return publicGraphqlClient.query<SectionQueryResponse>({
    query: GET_SECTIONS_BY_USER_ID_QUERY,
    variables: { userId },
  });
};

export const getPublicPublishedProfiles = async (pageNo = 1, pageSize = 20): Promise<ProfileQueryResponse> => {
  return publicGraphqlClient.query<ProfileQueryResponse>({
    query: GET_ALL_PUBLISHED_PROFILES_QUERY,
    variables: { pageNo, pageSize },
  });
};

export const incrementPublicProfileViewCount = async (itemId: string, currentCount: number): Promise<void> => {
  return publicGraphqlClient.mutate<void>({
    query: UPDATE_USER_PROFILE_MUTATION,
    variables: {
      filter: itemId,
      input: { view_count: currentCount + 1 },
    },
  });
};
