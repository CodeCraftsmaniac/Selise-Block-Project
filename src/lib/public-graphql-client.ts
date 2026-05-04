/**
 * Public GraphQL Client
 *
 * A GraphQL client for unauthenticated (public) requests.
 * Does NOT include Authorization headers or attempt token refresh.
 * Relies on Data Gateway RLS rules to allow public access to published data.
 *
 * Usage: Public profile pages (/u/:username), browse page (/browse)
 */

interface GraphQLRequest {
  query: string;
  variables?: Record<string, any>;
}

interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

const projectKey = import.meta.env.VITE_X_BLOCKS_KEY || '';
const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
const PROJECT_SLUG = import.meta.env.VITE_PROJECT_SLUG || '';
const projectSlug = PROJECT_SLUG ? `/${PROJECT_SLUG}` : '';
const GRAPHQL_BASE_URL = `${cleanBaseUrl}/uds/v1${projectSlug}/gateway`;

async function publicRequest<T>(request: GraphQLRequest): Promise<T> {
  const payload = {
    query: request.query,
    variables: request.variables || {},
  };

  const response = await fetch(GRAPHQL_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-blocks-key': projectKey,
    },
    body: JSON.stringify(payload),
  });

  const result: GraphQLResponse<T> = await response.json();

  if (result.errors && result.errors.length > 0) {
    throw new Error(result.errors[0].message);
  }

  return (result.data as T) ?? ({} as T);
}

export const publicGraphqlClient = {
  async query<T>(request: GraphQLRequest): Promise<T> {
    return publicRequest<T>(request);
  },

  async mutate<T>(request: GraphQLRequest): Promise<T> {
    return publicRequest<T>(request);
  },
};

export default publicGraphqlClient;
