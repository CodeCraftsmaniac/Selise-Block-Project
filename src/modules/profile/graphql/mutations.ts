/**
 * GraphQL Mutations for User Profile Management
 */

export const CREATE_USER_PROFILE_MUTATION = `
  mutation InsertUserProfile($input: UserProfileInsertInput!) {
    insertUserProfile(input: $input) {
      itemId
      totalImpactedData
      acknowledged
    }
  }
`;

export const UPDATE_USER_PROFILE_MUTATION = `
  mutation UpdateUserProfile($filter: String!, $input: UserProfileUpdateInput!) {
    updateUserProfile(filter: $filter, input: $input) {
      itemId
      totalImpactedData
      acknowledged
    }
  }
`;

export const PUBLISH_USER_PROFILE_MUTATION = `
  mutation PublishUserProfile($filter: String!, $input: UserProfileUpdateInput!) {
    updateUserProfile(filter: $filter, input: $input) {
      itemId
      totalImpactedData
      acknowledged
    }
  }
`;

export const UNPUBLISH_USER_PROFILE_MUTATION = `
  mutation UnpublishUserProfile($filter: String!, $input: UserProfileUpdateInput!) {
    updateUserProfile(filter: $filter, input: $input) {
      itemId
      totalImpactedData
      acknowledged
    }
  }
`;

export const CREATE_CUSTOM_SECTION_MUTATION = `
  mutation InsertUserCustomSection($input: UserCustomSectionInsertInput!) {
    insertUserCustomSection(input: $input) {
      itemId
      totalImpactedData
      acknowledged
    }
  }
`;

export const UPDATE_CUSTOM_SECTION_MUTATION = `
  mutation UpdateUserCustomSection($filter: String!, $input: UserCustomSectionUpdateInput!) {
    updateUserCustomSection(filter: $filter, input: $input) {
      itemId
      totalImpactedData
      acknowledged
    }
  }
`;

export const DELETE_CUSTOM_SECTION_MUTATION = `
  mutation DeleteUserCustomSection($filter: String!, $input: UserCustomSectionDeleteInput!) {
    deleteUserCustomSection(filter: $filter, input: $input) {
      itemId
      totalImpactedData
      acknowledged
    }
  }
`;

/**
 * Bulk reorder mutation for custom sections.
 * Note: SELISE Data Gateway does not natively support bulk updates.
 * The frontend iterates over reordered items and calls UPDATE_CUSTOM_SECTION_MUTATION
 * for each changed item. This mutation is reserved for future gateway bulk support.
 */
export const REORDER_CUSTOM_SECTIONS_MUTATION = `
  mutation ReorderUserCustomSections($items: [UserCustomSectionUpdateInput!]!) {
    reorderUserCustomSections(items: $items) {
      itemId
      totalImpactedData
      acknowledged
    }
  }
`;
