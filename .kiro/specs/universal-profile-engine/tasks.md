# Implementation Plan: Universal Profile Engine

## Overview

Convert the feature design into a series of prompts for a code-generation LLM that will implement each step with incremental progress. Make sure that each prompt builds on the previous prompts, and ends with wiring things together. There should be no hanging or orphaned code that isn't integrated into a previous step. Focus ONLY on tasks that involve writing, modifying, or testing code.

The Construct scaffold at `d:\Project 3 Selise Block\universal-profile-engine` already contains the authenticated and public GraphQL clients, presigned-URL storage service, profile and public-profile services, most read/write hooks, route guards, auth store, and stub pages. This plan closes the gaps marked 🟡 or ❌ in `design.md`, wires the remaining integrations, adds Zod-based validation, extends theming for `/u/:username`, delivers the ten Correctness Properties as `fast-check` property tests, and verifies the Blocks Cloud deployment path. Implementation language is **TypeScript** (React 19, Vite, Vitest, `fast-check`, `react-hook-form` + `zod`).

Traceability: since this spec skipped `requirements.md`, each task references design sections or numbered Correctness Properties from `design.md` (§Data Models, §Components and Interfaces, §API Integration Patterns, §Theme System, §Testing Strategy, §Correctness Properties §Deployment).

## Tasks

- [x] 1. Install additional runtime and test dependencies
  - [x] 1.1 Add `fast-check`, `react-dropzone`, `react-markdown`, and `rehype-sanitize` to `package.json` and run install
    - Pin exact versions; update `package-lock.json`
    - No code changes beyond dependency manifest
    - _Design: §Dependencies (Runtime, Dev/Test)_

- [x] 2. Domain validation: extend `profile.types.ts` with Zod schemas
  - [x] 2.1 Add `zod` schemas and `ProfileFormValues` / `SectionFormValues` types
    - `usernameSchema = z.string().regex(/^[a-z0-9][a-z0-9-_]{2,29}$/)`
    - `displayNameSchema = z.string().trim().min(1).max(60)`
    - `headlineSchema = z.string().max(120).default('')`
    - `bioTextSchema = z.string().max(2000).default('')`
    - `accentColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/)`
    - `themePreferenceSchema = z.enum(['minimal','bold','dark','gradient'])`
    - `fontFamilySchema = z.enum(['sans','serif','mono'])`
    - `socialLinkSchema` with platform enum and `url`/`mailto:` discriminated validation; reject `javascript:` scheme
    - `imageUrlSchema = z.union([z.literal(''), z.string().url().startsWith('https://')])`
    - `profileFormSchema` and `sectionFormSchema` aggregates
    - Export `parseUsername`, `parseAccentColor` helpers that throw on invalid input
    - _Design: §Data Models (Validation rules), §Security Considerations (Open redirect protection)_

  - [x]* 2.2 Property test: username validator round-trip
    - **Property: Zod username schema round-trips inputs matching the spec regex and throws on all others**
    - `fast-check` generator: `fc.stringMatching(/^[a-z0-9][a-z0-9-_]{2,29}$/)` asserts `usernameSchema.parse(s) === s`
    - Negative generator: arbitrary strings filtered by `!regex.test(s)` asserts `parse` throws
    - **Validates: Design §Data Models username rule**

  - [x]* 2.3 Property test: accent_color hex validator
    - **Property: Only `#RRGGBB` hex strings are accepted; all other strings throw**
    - Generate valid hex via `fc.tuple(fc.hexaString({minLength:6,maxLength:6}))`
    - **Validates: Design §Data Models accent_color rule**

  - [x]* 2.4 Property test: social_links url sanitization
    - **Property: `socialLinkSchema` rejects `javascript:` URLs; accepts `mailto:` only when `platform='email'`; accepts https URLs for other platforms**
    - **Validates: Design §Data Models social_links rule, §Security Considerations (Open redirect protection)_

  - [x]* 2.5 Unit tests: display_name / headline / bio_text length bounds and theme_preference / font_family enums
    - Boundary cases at 0, 1, max, max+1 for each string field
    - Enum rejection for unknown values
    - _Design: §Data Models (Validation rules)_

- [x] 3. Implement `useUploadImage` hook (presigned-URL flow)
  - [x] 3.1 Create `src/modules/profile/hooks/use-upload-image.ts`
    - Signature matches design: `useUploadImage({ moduleName, maxBytes?, acceptedMimeTypes? }) => { upload, isUploading, progress, error, reset }`
    - Defaults: `maxBytes = 5 MB` for profile, `10 MB` for header, `acceptedMimeTypes = ['image/jpeg','image/png','image/webp','image/gif']`
    - Step 1: call `storage.service.getPreSignedUrlForUpload({ name, moduleName, projectKey: VITE_X_BLOCKS_KEY, accessModifier: 'Public' })`
    - Step 2: raw `fetch(uploadUrl, { method:'PUT', headers:{'Content-Type':file.type}, body:file })`, no auth headers
    - Step 3: return `{ fileId, fileUrl }` for caller to persist via `updateUserProfile`
    - Surface `progress` (0 → 25 on presign → 100 on PUT 2xx)
    - Destructive toast on failure via `useErrorHandler.handleError`
    - Never reuse a presigned URL; each `upload(file)` call issues a fresh presign
    - _Design: §Components and Interfaces (useUploadImage), §API Integration Patterns (Storage), §Algorithmic Pseudocode (uploadImage)_

  - [x]* 3.2 Unit tests for `useUploadImage` with `msw` mocks
    - Happy path: presign → PUT 200 → returns `{ fileId, fileUrl }`
    - Size validation: rejects files over `maxBytes` before any network call
    - MIME validation: rejects files with disallowed `type`
    - PUT 4xx: sets `error`, throws, triggers destructive toast, state shows `isUploading=false`
    - `reset()` clears `error` and `progress`
    - _Design: §Components and Interfaces (useUploadImage)_

  - [x]* 3.3 Property test: upload URL is single-use
    - **Property 6: After a successful PUT to `p.uploadUrl`, any subsequent PUT to the same URL returns 4xx**
    - Mock blob endpoint that accepts one PUT per URL then 403s; assert `fast-check` sampled `File` instances all honour this invariant across `n` draws
    - **Validates: Design §Correctness Properties #6**

- [x] 4. Extend profile hooks: `me` wrappers, reorder, delete re-normalization
  - [x] 4.1 Add `useGetMyProfile`, `useGetMySections`, and `useUpdateMyProfile` alias to `use-profile.ts`
    - `useGetMyProfile()` reads `useAuthStore.user.itemId` and delegates to `useGetProfileByUserId`
    - `useGetMySections()` reads `useAuthStore.user.itemId` and delegates to `useGetSectionsByUserId`
    - `export { useUpdateProfile as useUpdateMyProfile }` to match design contract
    - _Design: §Hook Signatures_

  - [x] 4.2 Implement `useReorderSections` in `use-profile.ts`
    - Signature: `UseMutationResult<ProfileMutationResponse[], Error, string[]>`
    - Pull current sections from `queryClient.getQueryData(['sections', { userId: me.itemId }])`
    - Build minimal set of `UPDATE_CUSTOM_SECTION_MUTATION` calls for sections whose `section_order` differs from target index
    - Execute in parallel via `Promise.all`
    - Optimistic cache update via `queryClient.setQueryData` before firing; rollback on error; destructive toast on failure
    - `onSettled` invalidates `['sections']`
    - _Design: §Key GraphQL Operations (Reorder composite), §Hook Signatures, §Algorithmic Pseudocode (reorderSections), §Error Handling Strategy (optimistic updates)_

  - [x] 4.3 Re-normalize `section_order` in `useDeleteSection` onSuccess
    - After delete, fetch remaining sections for the user, compute the contiguous `0..N-1` target order, and issue updates only for sections whose persisted order drifts
    - Batch via `Promise.all`
    - _Design: §Correctness Properties #9 (section_order contiguity)_

  - [x]* 4.4 Property test: section ordering stability
    - **Property 4: For any permutation π of the user's sections, after `useReorderSections(π.map(s=>s.ItemId))` and a refetch, sections sorted by `section_order` equal π**
    - Mock GraphQL gateway with in-memory collection; generate permutations via `fc.shuffledSubarray`
    - **Validates: Design §Correctness Properties #4**

  - [x]* 4.5 Property test: section_order contiguity
    - **Property 9: For any sequence of create/delete/reorder operations, the resulting set of `section_order` values is a contiguous prefix of ℕ starting at 0**
    - Command-based `fast-check` model with `Create`, `Delete`, `Reorder` commands; post-assert contiguity after every step
    - **Validates: Design §Correctness Properties #9**

- [x] 5. Create Zustand editor store for ephemeral UI state
  - [x] 5.1 Create `src/modules/profile/state/use-profile-editor-store.ts`
    - Shape per design: `{ isDirty, draftSection, dragPreviewOrder, markDirty, clearDirty, setDraftSection, setDragPreview, reset }`
    - No `persist` middleware; store is session-scoped
    - _Design: §State Management (useProfileEditorStore)_

  - [x]* 5.2 Unit tests for `useProfileEditorStore`
    - Dirty flag toggles, draft section round-trip, drag preview set/clear, `reset()` returns to initial state
    - _Design: §State Management (useProfileEditorStore)_

- [x] 6. Theme overrides for `/u/:username`
  - [x] 6.1 Extend `src/styles/theme/theme-provider.tsx` to accept `overrides`
    - Add `overrides?: { theme_preference?, accent_color?, font_family? }` prop
    - When `overrides` is present, apply `theme-minimal|bold|dark|gradient` and `font-sans|serif|mono` classes on `<html>`
    - Set `--accent` inline style only if `accent_color` matches `/^#[0-9a-fA-F]{6}$/`
    - Snapshot previous classes and `--accent` on mount; restore on unmount via cleanup function
    - Do not mutate `localStorage` `ui-theme` when `overrides` are active
    - _Design: §Components and Interfaces (ThemeProvider), §Theme System (applyProfileTheme)_

  - [x] 6.2 Add theme and font CSS contracts to `src/styles/globals.css`
    - `:root.theme-minimal|bold|dark|gradient` blocks with `--bg-hero`, `--text-primary` per design
    - `:root.font-sans|serif|mono` blocks setting `--font-family`
    - Ensure classes do not collide with existing dashboard `dark`/`light` classes
    - _Design: §Theme System (CSS contract)_

  - [x]* 6.3 Unit tests for `ThemeProvider` overrides
    - With `overrides`, `<html>` has the expected `theme-*` and `font-*` classes and `--accent` CSS var
    - On unmount, previous classes and `--accent` are restored exactly
    - Invalid accent_color is ignored (no `--accent` write)
    - _Design: §Theme System (apply algorithm)_

- [x] 7. Update localization route module map
  - [x] 7.1 Update `src/i18n/route-module-map.ts` per design
    - Replace existing dashboard/u/browse entries to match design contract:
      - `'/dashboard/profile'`: `['common','editor']`
      - `'/dashboard/appearance'`: `['common','editor','themes']`
      - `'/dashboard/sections'`: `['common','editor']`
      - `'/dashboard/preview'`: `['common','editor','viewer']`
      - `'/dashboard/admin'`: `['common','editor','admin']`
      - `'/u/:username'`: `['common','viewer']`
      - `'/browse'`: `['common','browse']`
      - Preserve auth routes with `['common','auth']`, MFA with `['common','auth','mfa']`
      - `'/404'`: `['common','error']`, `'/503'`: `['common','error']`
    - Keep existing non-profile routes (finance, iam, etc.) unchanged
    - _Design: §Components and Interfaces (route-module-map)_

  - [x]* 7.2 Unit tests for `routeModuleMap`
    - Every dashboard and public route declared in `app-routes.tsx` has an entry
    - `/u/:username` resolves for any concrete `/u/alice` via LanguageProvider's matcher
    - _Design: §Components and Interfaces (route-module-map)_

- [x] 8. Profile editor page polish (`src/modules/profile/pages/profile-editor/profile-editor.tsx`)
  - [x] 8.1 Scaffold form with `useForm` + `zodResolver(profileFormSchema)`
    - Pull current profile via `useGetMyProfile`; seed `defaultValues`
    - Fields: `display_name`, `username`, `headline`, `bio_text`, `social_links` (field array)
    - Submit handler calls `useUpdateMyProfile.mutateAsync({ filter: JSON.stringify({ ItemId: profile.ItemId }), input: values })`
    - Wire `useProfileEditorStore.markDirty()` on form change; `clearDirty()` on successful save
    - Disable submit while mutation is pending (conservative update)
    - Loading and empty-profile branches render `Skeleton`
    - _Design: §Example Usage (ProfileEditorPage), §Error Handling Strategy (Conservative updates)_

  - [x] 8.2 Wire profile_image and header_image uploads
    - Use `useUploadImage({ moduleName: 'profile_image', maxBytes: 5*1024*1024 })` and `useUploadImage({ moduleName: 'header_image', maxBytes: 10*1024*1024 })`
    - Picker UI via `react-dropzone`
    - After `upload(file)` resolves, call `useUpdateMyProfile` with the new `profile_image_url` or `header_image_url`
    - Show progress indicator bound to hook `progress`
    - _Design: §Upload Flow (Pseudocode), §Example Usage (handleProfilePick)_

  - [x] 8.3 Wire publish / unpublish toggle
    - Call `usePublishProfile(filter)` / `useUnpublishProfile(filter)` with `JSON.stringify({ ItemId: profile.ItemId })`
    - Display destructive confirmation modal before unpublish (section already has modal primitives under `components/modals`)
    - Show share URL `${VITE_APP_DOMAIN}/u/${username}` once published
    - _Design: §Key GraphQL Operations (publish/unpublish), §Components and Interfaces_

  - [x]* 8.4 Unit tests for ProfileEditorPage branches
    - Loading skeleton while query pending
    - Form renders seeded values
    - Invalid username shows inline Zod error and blocks submit
    - Successful save invalidates `['profile']` cache (spy on `queryClient`)
    - Image upload success updates preview and triggers profile update mutation
    - Publish toggle calls the right mutation
    - _Design: §Example Usage, §Error Handling Strategy_

- [x] 9. Appearance page polish (`src/modules/profile/pages/appearance/appearance.tsx`)
  - [x] 9.1 Implement `theme_preference`, `accent_color`, `font_family` selectors
    - `useForm` + `zodResolver` for the three-field subset schema
    - Live preview via `ThemeProvider` overrides bound to form `watch()`
    - Submit persists via `useUpdateMyProfile`
    - _Design: §Theme System, §Data Models (theme_preference/accent_color/font_family)_

  - [x]* 9.2 Unit tests for appearance page
    - Selector changes update the preview DOM classes
    - Submit calls `updateMyProfile` with the expected input shape
    - Zod rejects malformed `#GGGGGG` accent value
    - _Design: §Theme System_

- [x] 10. Sections page polish (`src/modules/profile/pages/sections/sections.tsx`)
  - [x] 10.1 Implement create / edit / delete UI for `user_custom_section`
    - List uses `useGetMySections`, sorted by `section_order`
    - Create modal with `sectionFormSchema` (`section_type` enum, `section_title` ≤ 80, `section_content` ≤ 5000 Markdown, `is_visible`)
    - Edit modal reuses same schema; mutation via `useUpdateSection`
    - Delete flow via `useDeleteSection` with confirmation modal; passes `filter: JSON.stringify({ ItemId }), input: { isHardDelete: true }`
    - Render `section_content` through `react-markdown` + `rehype-sanitize` (no `dangerouslySetInnerHTML`)
    - _Design: §Data Models (user_custom_section), §Security Considerations (XSS in bio/sections)_

  - [x] 10.2 Wire `@dnd-kit` drag-reorder with optimistic update
    - `DndContext` + `SortableContext`; `onDragEnd` recomputes ordered `ItemId[]` then calls `useReorderSections.mutate(orderedIds)`
    - Populate `useProfileEditorStore.setDragPreview` during drag for ghost rendering
    - On mutation error, `queryClient.setQueryData` rolls back to previous order and surface destructive toast
    - _Design: §Error Handling Strategy (optimistic updates), §Algorithmic Pseudocode (reorderSections)_

  - [x] 10.3 Wire `section_media` upload for section content
    - Inline uploader using `useUploadImage({ moduleName: 'section_media', maxBytes: 5*1024*1024 })`
    - On success, insert the returned `fileUrl` as a Markdown image into `section_content` textarea
    - _Design: §API Integration Patterns (Storage), §Components and Interfaces (useUploadImage)_

  - [x]* 10.4 Unit tests for sections page
    - Create / edit / delete flows invoke the right mutation with the right filter/input shape
    - Drag reorder issues a single `useReorderSections` call with the computed ordering
    - Markdown renders sanitized (script tags stripped)
    - _Design: §Data Models, §Security Considerations_

- [x] 11. Preview page (`src/modules/profile/pages/preview/preview.tsx`)
  - [x] 11.1 Render live preview of the authenticated user's profile
    - Read `useGetMyProfile` + `useGetMySections`
    - Delegate rendering to the same component tree used by `PublicProfilePage` (extract shared `ProfileView` if not already extracted)
    - Wrap in `ThemeProvider overrides={profile}` so preview matches the public rendering exactly
    - No public GraphQL client is used on this route
    - _Design: §Algorithmic Pseudocode (renderPublicProfile)_

  - [x]* 11.2 Unit tests for preview page
    - Preview renders identical hero, bio, social links, and sections to `PublicProfilePage` given the same data
    - Unpublished profile still renders in preview (owner context)
    - _Design: §Algorithmic Pseudocode (renderPublicProfile)_

- [x] 12. Admin page polish (`src/modules/profile/pages/admin/admin.tsx`)
  - [x] 12.1 Build admin table of profiles with role-gated actions
    - Gate the route with `<ProtectedRoute roles={['admin']}>` (already wired at routing layer)
    - Table backed by `useGetAllPublishedProfiles` with pagination
    - Row actions: unpublish (`useUnpublishProfile`), open public URL in new tab
    - Do NOT expose hard-delete from the UI (delete is admin-only RLS, not part of V1 admin UX)
    - _Design: §Route Guard Design, §Data Models (RLS rules)_

  - [x]* 12.2 Unit tests for admin page
    - Non-admin user receives `<UnauthorizedPage />` (`ProtectedRoute` branch covered by existing tests — assert admin sees table)
    - Unpublish action invokes the right mutation with the right filter
    - _Design: §Route Guard Design_

- [x] 13. Dashboard checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Public profile page polish (`src/modules/profile/pages/public-profile/public-profile.tsx`)
  - [x] 14.1 Render the public profile view
    - `useParams<{ username }>()` → `usePublicProfileByUsername(username)` → `usePublicSectionsByUserId(profile.user_id)`
    - Wrap the tree in `<ThemeProvider overrides={{ theme_preference, accent_color, font_family }}>`
    - Sections: defense-in-depth filter `is_visible === true` then sort ascending by `section_order`
    - Structure per design: `HeaderBanner`, `ProfileHero`, `AboutSection`, `SocialLinksList`, custom `sections.map(CustomSection)`
    - Render `bio_text` and `section_content` through `react-markdown` + `rehype-sanitize`
    - Add minimal SEO head (`<title>`, `<meta name="description">`, `og:image`) via a lightweight `SeoHead` component
    - _Design: §Algorithmic Pseudocode (renderPublicProfile), §Security Considerations (XSS)_

  - [x] 14.2 Handle not-published / not-found branch
    - Skeleton while loading
    - If `data.items.length === 0`, render `NotFoundPage` with link back to `/`
    - Set `retry: false` on the public query so private profiles do not thrash the gateway
    - _Design: §Error Handling Strategy (404 on /u/:username), §API Integration Patterns (publicGraphqlClient)_

  - [x]* 14.3 Unit tests for PublicProfilePage
    - Loading → skeleton; success → hero + bio + sections; empty → NotFoundPage
    - Hidden sections (`is_visible=false`) are filtered client-side as well (defense-in-depth)
    - Theme overrides apply to `<html>` while mounted and are restored on unmount
    - _Design: §Algorithmic Pseudocode (renderPublicProfile)_

  - [x]* 14.4 Property test: unpublished profile invisibility to public
    - **Property 3: For any profile p with `is_published = false`, `publicGraphqlClient.getUserProfiles({filter:{username:p.username}}).items === []`**
    - Mock gateway enforces the RLS filter; sample over randomized usernames and boolean `is_published` values
    - **Validates: Design §Correctness Properties #3**

  - [x]* 14.5 Property test: tenant data isolation on reads
    - **Property 8: For any two users u1, u2 (u1 ≠ u2), `graphqlClient(token=u1).getUserCustomSections({filter:{user_id:u2.ItemId}}).items` contains only rows where `is_visible === true`**
    - Mock gateway's RLS model; generate pairs of users with mixed visible/private sections
    - **Validates: Design §Correctness Properties #8**

- [x] 15. Browse + landing page polish
  - [x] 15.1 Polish `pages/browse/browse.tsx`
    - Paginated grid of published profiles via `usePublicPublishedProfiles(pageNo, pageSize)`
    - Each card links to `/u/:username`
    - Empty state when no profiles are public yet
    - _Design: §Hook Signatures (usePublicPublishedProfiles), §Components and Interfaces (route-module-map)_

  - [x] 15.2 Polish `pages/landing/landing.tsx`
    - Marketing home at `/` with CTA to `/signup` and `/browse`
    - Respect `routeModuleMap['/']` → `['common','landing']`
    - _Design: §Components and Interfaces (route-module-map)_

  - [x]* 15.3 Unit tests for browse and landing pages
    - Browse paginates correctly; empty state renders on zero results
    - Landing renders CTAs and translates strings through `common`/`landing` modules
    - _Design: §Hook Signatures_

- [x] 16. RLS, auth, and session boundary property tests
  - [x]* 16.1 Property test: public GraphQL client cannot mutate
    - **Property 7: For any mutation M ∈ {INSERT,UPDATE,DELETE}×{UserProfile,UserCustomSection}, `publicGraphqlClient.mutate(M, anyInput)` throws a GraphQLError**
    - Spy on `publicGraphqlClient` to assert no `Authorization` header is attached to the request; mock gateway responds with RLS denial; sample `fast-check` generated inputs across all four mutations
    - **Validates: Design §Correctness Properties #7**

  - [x]* 16.2 Property test: RLS editor isolation
    - **Property 2: For any users u1 ≠ u2, `updateUserProfile(filter={user_id:u2.ItemId}, token=u1)` returns a GraphQLError**
    - Mock gateway evaluates RLS Edit rule `user_id == auth.userId`; `fast-check` samples random user pairs and update inputs
    - **Validates: Design §Correctness Properties #2**

  - [x]* 16.3 Integration test: username uniqueness
    - **Property 1: Creating a profile with an existing username fails with a duplicate-key error**
    - Gated behind `describe.skipIf(!process.env.BLOCKS_INTEGRATION)`
    - Issues two `CREATE_USER_PROFILE_MUTATION` calls with the same `username` against the real Data Playground and asserts the second fails
    - **Validates: Design §Correctness Properties #1, §Testing Strategy (Integration Testing)_

  - [x]* 16.4 Property test: auth token refresh idempotent on 401
    - **Property 5: For any request r that returns 401 with refreshable error, after silent refresh the retried r returns the same logical response as if the token had never expired, and the retry happens exactly once**
    - `msw` handler returns 401 once, 200 afterwards; spy confirms only a single refresh call and a single retry
    - **Validates: Design §Correctness Properties #5, §API Integration Patterns (401 refresh flow)_

  - [x]* 16.5 Property test: logout clears all tokens
    - **Property 10: After `useAuthStore.logout()`, `localStorage['auth-storage']` is undefined, all token/user fields are null, and subsequent `graphqlClient` calls include no `Authorization` header**
    - Spy on `fetch` to inspect outgoing headers; assert over many sampled call counts
    - **Validates: Design §Correctness Properties #10, §State Management_

- [x] 17. Routing and code-splitting
  - [x] 17.1 Convert `/dashboard/*`, `/u/:username`, `/browse` routes to `React.lazy` in `src/routes/app-routes.tsx`
    - Keep landing route eagerly imported to preserve first-paint budget
    - Wrap lazy routes in `<Suspense fallback={<LoadingOverlay/>}>`
    - Preserve existing `ProtectedRoute` and `Guard` composition
    - _Design: §Performance Considerations (Code-splitting)_

  - [x] 17.2 Ensure `src/state/client-middleware.tsx` public allowlist covers all public routes
    - Confirm `/`, `/browse`, `/u/:username`, `/404`, `/503`, auth routes, and SSO callbacks match the allowlist described in the design
    - Update `publicRoutes` array if any are missing so the wildcard matcher honours `/u/*` and `/sso/*/callback`
    - _Design: §Components and Interfaces (ClientMiddleware)_

  - [x]* 17.3 Unit tests for updated `ClientMiddleware`
    - `/u/alice` on an unauthenticated session renders children (no redirect)
    - `/dashboard/profile` on an unauthenticated session redirects to `/login`
    - Existing `client-middleware.spec.tsx` cases still pass
    - _Design: §Components and Interfaces (ClientMiddleware)_

- [x] 18. Deployment verification (code-only, no live deploy)
  - [x] 18.1 Verify `.env`, `.env.dev`, `.env.prod` contents
    - Each file must define `VITE_API_BASE_URL`, `VITE_X_BLOCKS_KEY`, `VITE_PROJECT_SLUG`, `VITE_APP_DOMAIN`, optional OIDC/CAPTCHA variables, and `VITE_PRIMARY_COLOR`/`VITE_SECONDARY_COLOR`
    - `VITE_CLIENT_SECRET` must be empty in production build
    - Do not commit real secrets; use placeholders with comments if values are unknown locally
    - _Design: §Deployment (Environment variables)_

  - [x] 18.2 Verify GitHub Actions workflows
    - `.github/workflows/main.yml` deploys production, `dev.yml` deploys dev, `stg.yml` deploys staging per Blocks Cloud branch convention
    - Each workflow runs `npm ci`, `npm run lint`, `npm run test -- --run`, `npm run build` before the deploy step
    - `set-env.cjs` is invoked to copy the branch-matching `.env.<branch>` into `.env`
    - _Design: §Deployment (Branch → environment mapping, Deployment flow)_

  - [x] 18.3 Add a pre-deploy gate script to `package.json`
    - `"predeploy": "npm run lint && tsc --noEmit && vitest --run && vite build"`
    - Enforce `no-console` / `no-debugger` eslint rules for `src/**` in `.eslintrc.cjs`
    - Verify `vite build` succeeds with zero TypeScript errors and bundle sizes within the `< 400 KB gz` landing / `< 700 KB gz` dashboard budgets (log `rollup-plugin-visualizer` output)
    - _Design: §Deployment (Pre-deploy gates), §Performance Considerations (Bundle budget)_

- [x] 19. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional test tasks that can be skipped for a faster MVP; core implementation tasks must not be skipped.
- Each task references the design section(s) or numbered Correctness Property it implements for traceability (`requirements.md` was intentionally skipped for this spec).
- Checkpoints 13 and 19 are verification gates, not code tasks.
- Property-based tests use `fast-check` and exercise the 10 numbered Correctness Properties from the design. The Zod-validator property tests in task 2 cover the field-level regex invariants documented in §Data Models.
- Image upload never writes a `*_image_url` field until the blob PUT returns 2xx (conservative update per §Error Handling Strategy).
- Section reorder is optimistic with cache rollback; profile and section field edits, plus publish/unpublish, are conservative.
- Dashboard themes remain light/dark/system; the `theme-minimal|bold|dark|gradient` classes are exclusively for `/u/:username` via the `ThemeProvider overrides` code path.
- The public GraphQL client never carries `Authorization`; RLS on the Data Gateway is the primary isolation mechanism and frontend filters are defense-in-depth only.
- Dependencies already present in the scaffold (`@dnd-kit`, `zod`, `sonner`, `jwt-decode`, `react-hook-form`, `@hookform/resolvers`) are reused. Task 1.1 only adds what is missing (`fast-check`, `react-dropzone`, `react-markdown`, `rehype-sanitize`).

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "5.1", "6.2", "7.1"] },
    { "id": 1, "tasks": ["2.2", "3.1", "4.1", "5.2", "6.1", "7.2"] },
    { "id": 2, "tasks": ["2.3", "3.2", "4.2", "6.3", "8.1", "9.1", "10.1", "11.1", "12.1", "14.1", "15.1", "15.2"] },
    { "id": 3, "tasks": ["2.4", "3.3", "4.3", "8.2", "10.2", "14.2"] },
    { "id": 4, "tasks": ["2.5", "4.4", "8.3", "10.3"] },
    { "id": 5, "tasks": ["4.5", "8.4", "9.2", "10.4", "11.2", "12.2", "14.3", "14.4", "14.5", "15.3", "17.1", "17.2"] },
    { "id": 6, "tasks": ["16.1", "16.2", "16.3", "16.4", "16.5", "17.3", "18.1", "18.2"] },
    { "id": 7, "tasks": ["18.3"] }
  ]
}
```
