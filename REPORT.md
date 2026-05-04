# Universal Profile Engine — Project Report

> CSE226: CMS & Multi-Tenant Architecture  
> SELISE Blocks Platform | React 19 + TypeScript + Vite

---

## 1. Project Overview

The **Universal Profile Engine** is a Website Builder SaaS where anyone can sign up, customize their digital presence, and publish a personal website at a unique URL (`/u/:username`).

### Three User Experiences

1. **Authentication Layer** — Sign up / log in via SELISE IAM Block
2. **Creator Dashboard** — Edit profile, manage sections, pick themes, preview live site
3. **Public Renderer** — Anyone can visit `/u/:username` to view a published profile

### Core Value Proposition

Instead of building "a personal site," we built **a platform** that lets *anyone* build their own site — a true "Platform, Not a Page" architecture.

---

## 2. Architecture Decisions

### 2.1 Frontend-First Orchestration

**Decision**: No custom backend. All data flows through SELISE Blocks APIs.

**Rationale**:
- PRD constraint: "No custom SQL/NoSQL, no custom API servers"
- SELISE Data Gateway provides GraphQL CRUD with RLS/CLS
- SELISE IAM handles auth, tokens, roles
- SELISE Storage handles file uploads via presigned URLs
- This approach lets us focus on user experience rather than infrastructure

**Trade-off**: We are dependent on Blocks Cloud portal configuration. Schemas, permissions, and auth settings must be configured manually in the portal before the app works end-to-end.

### 2.2 TanStack Query over Apollo

**Decision**: Use TanStack Query (already in Construct) instead of Apollo Client.

**Rationale**:
- Construct blueprint already uses TanStack Query
- Smaller bundle size (~30KB saved vs Apollo)
- Automatic caching, background refetching, and mutation invalidation
- No additional dependency to manage

### 2.3 Two GraphQL Clients

**Decision**: Separate `graphqlClient` (auth) and `publicGraphqlClient` (no auth).

**Rationale**:
- Public profile pages (`/u/:username`, `/browse`) must work without login
- If the auth client sends JWT headers on public pages, unauthenticated users get 401 → redirect loop
- Public client relies on Data Gateway RLS rules: "Public can view published profiles"

### 2.4 Zustand for Auth State

**Decision**: Use Zustand (from Construct) for auth store instead of React Context.

**Rationale**:
- Construct already uses Zustand
- No provider wrapping needed
- Direct store access outside React components (useful in HTTP client)
- Minimal boilerplate

### 2.5 Theme System: Tailwind Classes over CSS-in-JS

**Decision**: Apply themes as Tailwind CSS class combinations.

**Rationale**:
- No additional CSS-in-JS library (styled-components, emotion)
- Themes are just class name strings stored in `theme_preference`
- Easy to extend: add a new preset theme by adding an entry to `profileThemePresets`
- Accent colors and fonts are separate fields, giving users granular control

---

## 3. SELISE Blocks Services Used

### 3.1 Identity & Access Management (IAM Block)

| Feature | How We Used It |
|---------|---------------|
| Email/Password Auth | Login, signup, account activation, password reset |
| Social Login | SSO via Google/Microsoft ( Construct `SsoSignin` component) |
| JWT Tokens | Access token + refresh token with auto-refresh on 401 |
| Roles | `user`, `admin`, `public` roles for RLS |

### 3.2 Data Gateway

| Feature | How We Used It |
|---------|---------------|
| Schema Design | `user_profile` + `user_custom_section` schemas |
| GraphQL CRUD | All data operations via queries and mutations |
| RLS | Public view, owner-only create/edit |
| CLS | Read-only `user_id`, owner-only `is_published` |

### 3.3 Storage Block

| Feature | How We Used It |
|---------|---------------|
| Presigned URLs | Upload profile pictures and header images |
| S3-Compatible | Images stored in managed blob storage |
| Download URLs | Saved in Data Gateway schema fields |

### 3.4 Localization Block

| Feature | How We Used It |
|---------|---------------|
| i18next | All UI strings wrapped in `t()` calls |
| UILM Chrome Extension | Keys can be edited via WYSIWYG Chrome extension |
| Language Switcher | Construct's `LanguageSelector` component |

### 3.5 Construct Blueprint

| Feature | How We Used It |
|---------|---------------|
| React Router | Auth routes, protected routes, public routes |
| Zustand Auth Store | Token management, user info, login/logout |
| TanStack Query | Data fetching, caching, mutations |
| Radix UI + Tailwind | All UI components (button, input, dialog, etc.) |

---

## 4. Schema Design Rationale

### 4.1 user_profile

**One record per user.** This is the core identity document.

**Why these fields?**
- `user_id` → Links to IAM user for RLS (owner-based permissions)
- `username` → Unique URL slug. Indexed for fast lookup by `/u/:username`
- `display_name`, `headline`, `bio_text` → Standard personal site content
- `profile_image_url`, `header_image_url` → Storage Block presigned URLs
- `social_links` → JSON array of `{platform, url, label}` — flexible, no separate table needed
- `theme_preference`, `accent_color`, `font_family` → Presentation settings
- `view_count` → Analytics (increments on public page visits)
- `is_published` → Visibility toggle (RLS checks this for public access)

**Why not separate social_links into its own schema?**
- Social links are small (usually < 10 per user)
- No complex queries needed on social links alone
- Storing as JSON array in the parent record reduces join complexity

### 4.2 user_custom_section

**Many records per user.** Modular content blocks.

**Why these fields?**
- `section_type` → Categorizes content (Experience, Project, Skill, Education, Custom)
- `section_title` → User-defined title override
- `section_content` → Body text (markdown supported for future rich text)
- `section_order` → Display ordering (supports drag-to-reorder)
- `is_visible` → Toggle visibility without deleting

**Why not a single `sections` JSON array in user_profile?**
- Separate schema allows independent CRUD operations
- Sections can be queried independently (e.g., "get all Experience sections")
- Supports future features like section-level analytics

---

## 5. RLS / Permission Strategy

### 5.1 Row-Level Security (RLS)

| Schema | Action | Rule | Reason |
|--------|--------|------|--------|
| user_profile | View | Public | Anyone can view published profiles |
| user_profile | Create | `user_id == auth.userId` | Only the owner can create their profile |
| user_profile | Edit | `user_id == auth.userId` | Only the owner can edit their profile |
| user_profile | Delete | Role `admin` | Prevent accidental data loss |
| user_custom_section | View | Public | Public profiles show all visible sections |
| user_custom_section | Create | `user_id == auth.userId` | Owner-only |
| user_custom_section | Edit | `user_id == auth.userId` | Owner-only |
| user_custom_section | Delete | `user_id == auth.userId` | Owner-only |

### 5.2 Column-Level Security (CLS)

| Schema | Field | Rule | Reason |
|--------|-------|------|--------|
| user_profile | `user_id` | Read-only after creation | Prevents profile hijacking |
| user_profile | `is_published` | Editable by owner only | Users control their own visibility |
| user_custom_section | `user_id` | Read-only after creation | Prevents section reassignment |

### 5.3 Public Access Strategy

Unauthenticated users access public data via `publicGraphqlClient` (no auth headers). Data Gateway RLS checks the request context:
- If no auth token → treat as "public" role
- Public role can only view published profiles (`is_published == true`)
- All edit mutations are blocked for public role

This means **no client credential token is needed** for basic public reads. The `public` role in RLS handles it.

---

## 6. Challenges Faced

### 6.1 No Official Documentation for Construct

**Challenge**: SELISE Construct is a blueprint, not a documented framework. We had to reverse-engineer:
- How the HTTP client handles token refresh
- How GraphQL queries should be structured for Data Gateway
- How the auth store interacts with React components

**Solution**: Read every file in the Construct repo, traced execution paths, and documented findings in `CONSTRUCT_REFERENCE.md`.

### 6.2 Public Profile Pages Causing Auth Redirect Loops

**Challenge**: Unauthenticated users visiting `/u/:username` were redirected to `/login` because the global query hook checks for auth tokens.

**Solution**: Created a separate `publicGraphqlClient` that does not send auth headers. Created `usePublicProfileByUsername` hook that uses `useQuery` directly (not the global hook). Public pages now work without login.

### 6.3 TypeScript Type Mismatches

**Challenge**: Construct uses `any` in many places. Adding strict types to profile-related code caused conflicts.

**Solution**: Created explicit TypeScript interfaces (`UserProfile`, `UserCustomSection`) and used them consistently. Added type annotations to public profile hooks to satisfy React Query's generic expectations.

### 6.4 Drag-and-Drop with @dnd-kit

**Challenge**: Reordering sections visually while also updating `section_order` in the backend.

**Solution**: Used `@dnd-kit/core` + `@dnd-kit/sortable` for drag-and-drop. On drag end, compute new order indices and call `UPDATE_CUSTOM_SECTION_MUTATION` for each changed item. Added keyboard support via `KeyboardSensor`.

### 6.5 Presigned URL Upload Flow

**Challenge**: Understanding the three-step upload process: (1) request presigned URL, (2) PUT file to URL, (3) save download URL to Data Gateway.

**Solution**: Implemented inline in the profile editor page. Used `useGetPreSignedUrlForUpload` hook from Construct's Storage module. Added loading states and error handling for each step.

---

## 7. Performance Considerations

| Technique | Implementation | Impact |
|-----------|---------------|--------|
| Code Splitting | React.lazy for routes | Smaller initial bundle |
| Query Caching | TanStack Query `staleTime: 5min` | Fewer API calls |
| Debounced Auto-Save | Profile editor saves after 1.5s delay | Reduces mutation count |
| Image Optimization | Storage Block serves WebP | Faster image loads |
| LocalStorage Dedup | View count tracked once per 24h | Accurate analytics |
| Public Client | No token refresh for public pages | Faster public profile loads |

---

## 8. Extension Points

The architecture is designed to support future features with minimal changes:

| Feature | How to Add |
|---------|-----------|
| Blog posts | New `user_blog_post` schema + `/dashboard/blog` page |
| Forums | New `user_forum_thread` schema + `/dashboard/forum` page |
| Calendars | New `user_calendar_event` schema + `/dashboard/calendar` page |
| New theme | Add entry to `profileThemePresets` in `design-tokens.ts` |
| New social platform | Add to `PREDEFINED_PLATFORMS` array |
| Analytics dashboard | Extend `view_count` + add chart library (Recharts) |
| Custom domains | Add `custom_domain` field to `user_profile` schema |

---

## 9. Testing Strategy

### 9.1 Unit Tests

- React component tests with React Testing Library
- Hook tests for TanStack Query hooks
- Service layer tests for GraphQL client calls

### 9.2 Integration Tests

- Auth flow: signup → activation → login → dashboard
- Profile CRUD: create → edit → publish → view public → unpublish
- Section management: add → reorder → edit → delete → toggle visibility
- Image upload: select → upload → preview → save URL → display

### 9.3 Manual Testing Checklist

| Test | Expected Result |
|------|----------------|
| Visit `/u/:username` (published) | Profile renders with theme, sections, social links |
| Visit `/u/:username` (unpublished) | "Profile not found" or "Not public" message |
| Drag section in `/dashboard/sections` | Section reorders visually and persists after reload |
| Change theme in `/dashboard/appearance` | Live preview updates immediately |
| Upload profile picture | Image preview appears, URL saved to Data Gateway |
| Copy profile link in `/dashboard/preview` | URL copied to clipboard |

---

## 10. Deployment Notes

### 10.1 Environment Variables

| Variable | Source |
|----------|--------|
| `VITE_API_BASE_URL` | Blocks Cloud API settings |
| `VITE_X_BLOCKS_KEY` | Blocks Cloud project settings |
| `VITE_PROJECT_SLUG` | Blocks Cloud project slug |
| `VITE_APP_DOMAIN` | Deployed app domain |

### 10.2 Build Process

```bash
npm install
npm run build    # Output: dist/ folder
```

Build output is a static SPA (Single Page Application) that can be served by any static file server or deployed via Blocks Cloud Git integration.

### 10.3 Git Branches

| Branch | Purpose |
|--------|---------|
| `main` | Production deployment |
| `dev` | Development / feature work |

---

## 11. Conclusion

The Universal Profile Engine demonstrates:
- **Frontend-first orchestration** using SELISE Blocks APIs
- **Multi-tenant architecture** via RLS/CLS and unique user URLs
- **Three distinct user experiences** (auth, editor, public renderer)
- **Zero custom backend** — all data via GraphQL
- **Extensible design** — new features can be added via new schemas + pages

The project is production-ready from a code perspective. The remaining work is **manual portal configuration** in Blocks Cloud: schema creation, RLS setup, auth enablement, and deployment.
