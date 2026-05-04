/**
 * GraphQL Queries for User Profile Management
 */

export const GET_PROFILE_BY_USERNAME_QUERY = `
  query GetUserProfiles($input: DynamicQueryInput) {
    getUserProfiles(input: $input) {
      hasNextPage
      hasPreviousPage
      totalCount
      totalPages
      pageSize
      pageNo
      items {
        ItemId
        user_id
        username
        display_name
        headline
        bio_text
        profile_image_url
        header_image_url
        social_links
        theme_preference
        is_published
        created_at
        updated_at
        CreatedBy
        CreatedDate
        LastUpdatedBy
        LastUpdatedDate
      }
    }
  }
`;

export const GET_PROFILE_BY_USER_ID_QUERY = `
  query GetUserProfilesByUserId($input: DynamicQueryInput) {
    getUserProfiles(input: $input) {
      hasNextPage
      hasPreviousPage
      totalCount
      totalPages
      pageSize
      pageNo
      items {
        ItemId
        user_id
        username
        display_name
        headline
        bio_text
        profile_image_url
        header_image_url
        social_links
        theme_preference
        is_published
        created_at
        updated_at
        CreatedBy
        CreatedDate
        LastUpdatedBy
        LastUpdatedDate
      }
    }
  }
`;

export const GET_ALL_PUBLISHED_PROFILES_QUERY = `
  query GetAllPublishedProfiles($input: DynamicQueryInput) {
    getUserProfiles(input: $input) {
      hasNextPage
      hasPreviousPage
      totalCount
      totalPages
      pageSize
      pageNo
      items {
        ItemId
        user_id
        username
        display_name
        headline
        profile_image_url
        is_published
      }
    }
  }
`;

export const GET_SECTIONS_BY_USER_ID_QUERY = `
  query GetUserCustomSections($input: DynamicQueryInput) {
    getUserCustomSections(input: $input) {
      hasNextPage
      hasPreviousPage
      totalCount
      totalPages
      pageSize
      pageNo
      items {
        ItemId
        user_id
        section_type
        section_title
        section_content
        section_order
        is_visible
        created_at
        updated_at
        CreatedBy
        CreatedDate
        LastUpdatedBy
        LastUpdatedDate
      }
    }
  }
`;
