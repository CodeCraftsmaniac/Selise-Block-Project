# Universal Profile Engine

A **Website Builder SaaS** built on SELISE Blocks — where anyone can sign up, customize their digital presence, and publish a personal website at a unique URL.

## Project Info

- **Course**: CSE226 - CMS & Multi-Tenant Architecture
- **Platform**: SELISE Blocks (GraphQL, JWT, MongoDB, IAM, Storage, Localization)
- **Stack**: React 19, TypeScript, Vite, TailwindCSS, Radix UI, Zustand, TanStack Query, i18next
- **Constraint**: No custom backend. All data via SELISE Blocks APIs.

## Three User Experiences

1. **Authentication Layer** — Sign up / log in via SELISE IAM
2. **Creator Dashboard** — Edit profile, manage sections, pick themes, preview live site
3. **Public Renderer** — Anyone can visit `/u/:username` to view a published profile

## Quick Start

```bash
npm install
npm start          # http://localhost:3000
npm run build      # production build
```

## Environment Variables

Copy `.env.example` to `.env` and fill in your Blocks Cloud credentials.

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | SELISE Blocks API base URL |
| `VITE_X_BLOCKS_KEY` | Project key from Blocks Cloud |
| `VITE_PROJECT_SLUG` | Project slug identifier |
| `VITE_APP_DOMAIN` | Your deployed app domain |

## Architecture

- **Frontend**: React SPA with React Router DOM
- **State**: Zustand (auth), TanStack Query (server state)
- **Data**: GraphQL via SELISE Data Gateway (zero custom backend)
- **Auth**: SELISE IAM Block (JWT tokens, auto-refresh)
- **Storage**: SELISE Storage Block (presigned URL uploads)
- **Localization**: SELISE Localization Block (i18next, UILM Chrome extension)

## Key Routes

| Route | Access | Purpose |
|---|---|---|
| `/` | Public | Landing page |
| `/login` | Public | Sign in |
| `/signup` | Public | Register |
| `/u/:username` | Public | Published profile |
| `/dashboard/profile` | Auth | Edit profile |
| `/dashboard/appearance` | Auth | Pick theme |
| `/dashboard/sections` | Auth | Manage sections |
| `/dashboard/preview` | Auth | Preview & publish |

## Data Gateway Schemas (Manual Setup)

Two schemas power the entire profile engine. All fields are configured in **Blocks Cloud > Services > Data Gateway**.

### Schema 1: `user_profile`

Stores the core identity and presentation settings for each user.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `user_id` | String | Yes | — | Links to IAM `User.itemId` |
| `username` | String | Yes | — | Unique URL slug: `/u/:username` |
| `display_name` | String | Yes | — | Public name shown on profile |
| `headline` | String | No | `''` | Professional tagline |
| `bio_text` | String | No | `''` | Multi-line biography |
| `profile_image_url` | String | No | `''` | Presigned URL from Storage Block |
| `header_image_url` | String | No | `''` | Cover/banner image URL |
| `social_links` | Object[] | No | `[]` | Array of `{platform, url, label}` |
| `theme_preference` | String | No | `'minimal'` | `minimal`, `bold`, `dark`, `gradient` |
| `accent_color` | String | No | `'#3b82f6'` | Hex color for badges/buttons |
| `font_family` | String | No | `'sans'` | `sans`, `serif`, `mono` |
| `is_published` | Boolean | No | `false` | Public visibility toggle |
| `created_at` | DateTime | Auto | `now()` | Record creation |
| `updated_at` | DateTime | Auto | `now()` | Last update |

**Indexes**: `username` (unique), `user_id` (for fast lookup)

### Schema 2: `user_custom_section`

Stores modular content sections attached to a profile.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `user_id` | String | Yes | — | Owner reference |
| `section_type` | String | Yes | — | `Experience`, `Project`, `Skill`, `Education`, `Custom` |
| `section_title` | String | No | `''` | Display title |
| `section_content` | String | No | `''` | Body text (markdown supported) |
| `section_order` | Number | No | `0` | Display ordering index |
| `is_visible` | Boolean | No | `true` | Toggle visibility on public page |
| `created_at` | DateTime | Auto | `now()` | Record creation |
| `updated_at` | DateTime | Auto | `now()` | Last update |

**Indexes**: `user_id` (for filtering), `section_order` (for sorting)

### Row-Level Security (RLS)

| Schema | Action | Rule |
|--------|--------|------|
| `user_profile` | **View** | Public (anyone can view published profiles) |
| `user_profile` | **Create** | `user_id == auth.userId` (owner only) |
| `user_profile` | **Edit** | `user_id == auth.userId` (owner only) |
| `user_profile` | **Delete** | Role `admin` only |
| `user_custom_section` | **View** | Public |
| `user_custom_section` | **Create** | `user_id == auth.userId` |
| `user_custom_section` | **Edit** | `user_id == auth.userId` |
| `user_custom_section` | **Delete** | `user_id == auth.userId` |

### Column-Level Security (CLS)

| Schema | Field | Rule |
|--------|-------|------|
| `user_profile` | `user_id` | Read-only after creation |
| `user_profile` | `is_published` | Editable by owner only |
| `user_custom_section` | `user_id` | Read-only after creation |

See `PORTAL_SETUP_GUIDE.md` for step-by-step Blocks Cloud configuration.

## Project Structure

```
src/
  modules/
    profile/           # Core profile engine
      graphql/         # Queries & mutations
      services/        # API service functions
      hooks/           # TanStack Query hooks
      pages/           # All profile-related pages
        public-profile/
        profile-editor/
        appearance/
        sections/
        preview/
        landing/
    auth/              # SELISE IAM auth (from Construct)
    inventory/         # Example module (from Construct)
  state/
    store/auth/        # Zustand auth store
    query-client/      # TanStack Query client
  i18n/                # Localization setup
  routes/              # React Router config
```

## GraphQL API Reference

### Queries

| Query | Variables | Purpose |
|-------|-----------|---------|
| `GET_PROFILE_BY_USERNAME_QUERY` | `{ username: String }` | Fetch public profile by slug |
| `GET_PROFILE_BY_USER_ID_QUERY` | `{ userId: String }` | Fetch profile for current user |
| `GET_ALL_PUBLISHED_PROFILES_QUERY` | `{ pageNo, pageSize }` | Browse all published profiles |
| `GET_SECTIONS_BY_USER_ID_QUERY` | `{ userId: String }` | Fetch sections for a profile |

### Mutations

| Mutation | Input | Purpose |
|----------|-------|---------|
| `CREATE_USER_PROFILE_MUTATION` | `{ input: UserProfileInput }` | Create profile after signup |
| `UPDATE_USER_PROFILE_MUTATION` | `{ filter: itemId, input }` | Update any profile field |
| `PUBLISH_USER_PROFILE_MUTATION` | `{ filter: itemId }` | Set `is_published: true` |
| `UNPUBLISH_USER_PROFILE_MUTATION` | `{ filter: itemId }` | Set `is_published: false` |
| `CREATE_CUSTOM_SECTION_MUTATION` | `{ input: SectionInput }` | Add a new section |
| `UPDATE_CUSTOM_SECTION_MUTATION` | `{ filter: itemId, input }` | Edit section content/order |
| `DELETE_CUSTOM_SECTION_MUTATION` | `{ filter: itemId, input: { isHardDelete: true } }` | Remove section |

## Deployment

Connected to GitHub: `CodeCraftsmaniac/Selise-Block-Project`
- `main` branch → production
- `dev` branch → development

Deploy via Blocks Cloud (Git-based) or manual upload.
