# Architecture — Universal Profile Engine

> CSE226 — CMS & Multi-Tenant Architecture  
> SELISE Blocks Platform | React 19 + TypeScript + Vite

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           REACT SPA (Vite)                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  Landing    │  │   Auth      │  │  Dashboard  │  │   Public    │    │
│  │    Page     │  │   Pages     │  │   Pages     │  │   Profile   │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
│         │                │                │                │           │
│  ┌──────▼────────────────▼────────────────▼────────────────▼──────┐     │
│  │                    React Router DOM                             │     │
│  └──────┬────────────────┬────────────────┬────────────────┬──────┘     │
│         │                │                │                │            │
│  ┌──────▼──────┐  ┌─────▼──────┐  ┌─────▼──────┐  ┌─────▼──────┐      │
│  │   Zustand   │  │ TanStack   │  │  i18next   │  │  Tailwind  │      │
│  │    Auth     │  │   Query    │  │    i18n    │  │   + Radix  │      │
│  └──────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘      │
│         │               │               │               │             │
│  ┌──────▼───────────────▼───────────────▼───────────────▼──────┐      │
│  │              GraphQL Client (auth + public)                  │      │
│  └─────────────────────────┬──────────────────────────────────┘      │
└────────────────────────────│──────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         SELISE BLOCKS CLOUD                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │   IAM Block    │  │ Data Gateway │  │ Storage Block│  │ Localization│ │
│  │ (Auth/SSO/JWT) │  │ (GraphQL/CRUD│  │(S3/Presigned│  │ (i18n/UILM) │ │
│  │                │  │ /RLS/CLS)    │  │    URLs)     │  │             │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘ │
│                              │                                          │
│                    ┌─────────▼──────────┐                               │
│                    │  Blocks Database   │                               │
│                    │    (MongoDB)       │                               │
│                    └────────────────────┘                               │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Module Breakdown

### 2.1 Profile Module (`src/modules/profile/`)

The core of the project. Organized by Clean Architecture layers:

| Layer | Path | Responsibility |
|-------|------|----------------|
| **GraphQL** | `graphql/` | Query & mutation string definitions |
| **Services** | `services/` | Raw API calls (auth + public clients) |
| **Hooks** | `hooks/` | TanStack Query hooks for data fetching |
| **Types** | `types/` | TypeScript interfaces for all domain objects |
| **Pages** | `pages/` | React page components (routing targets) |

### 2.2 Auth Module (`src/modules/auth/`)

Inherited from SELISE Construct blueprint. Handles:
- Email/password login & signup
- Social login (SSO/OIDC)
- Account activation & password reset
- JWT token management (access + refresh)

### 2.3 State Management

| Store | Library | Purpose |
|-------|---------|---------|
| Auth Store | Zustand | Access token, refresh token, user object |
| Server State | TanStack Query | All GraphQL data fetching & caching |
| Theme | React Context | Dark/light mode toggle |
| Language | React Context | i18next language switching |

---

## 3. Data Flow

### 3.1 Authenticated Request Flow

```
Component → Hook (useQuery/useMutation) → Service → graphqlClient
                                                               │
                                                               ▼
                                                    ┌────────────────────┐
                                                    │  https.ts fetch   │
                                                    │  + JWT header     │
                                                    └────────────────────┘
                                                               │
                                                               ▼
                                                    ┌────────────────────┐
                                                    │  Data Gateway      │
                                                    │  GraphQL endpoint  │
                                                    └────────────────────┘
```

### 3.2 Public Request Flow (No Auth)

```
Public Page → usePublicProfile Hook → publicProfileService
                                               │
                                               ▼
                                    ┌────────────────────┐
                                    │ publicGraphqlClient │
                                    │ (NO auth headers) │
                                    └────────────────────┘
                                               │
                                               ▼
                                    ┌────────────────────┐
                                    │  Data Gateway RLS  │
                                    │  "Public can view" │
                                    └────────────────────┘
```

### 3.3 File Upload Flow

```
User selects file → useGetPreSignedUrlForUpload → Storage Block API
                                                          │
                                                          ▼
                                               ┌──────────────────┐
                                               │ Presigned URL    │
                                               │ (expires in ~5min)│
                                               └──────────────────┘
                                                          │
                                                          ▼
                                               ┌──────────────────┐
                                               │ PUT file to S3   │
                                               └──────────────────┘
                                                          │
                                                          ▼
                                               ┌──────────────────┐
                                               │ Save download URL│
                                               │ to Data Gateway  │
                                               └──────────────────┘
```

---

## 4. Routing Architecture

| Route | Guard | Experience |
|-------|-------|------------|
| `/` | Public | Landing page |
| `/login` | `PublicRoute` (redirects if authed) | Sign in |
| `/signup` | `PublicRoute` | Register |
| `/dashboard/*` | `ProtectedRoute` (redirects if not authed) | Creator Dashboard |
| `/u/:username` | Public | Public Profile Renderer |
| `/browse` | Public | Browse all published profiles |

---

## 5. Schema Design

### 5.1 user_profile

Core identity schema. One record per user.

```
user_id          → String  (FK to IAM User.itemId)
username         → String  (unique, URL slug)
display_name     → String
headline         → String
bio_text         → String
profile_image_url→ String  (Storage Block presigned URL)
header_image_url → String  (Storage Block presigned URL)
social_links     → Object[] { platform, url, label }
theme_preference → String  (minimal | bold | dark | gradient)
accent_color     → String  (hex)
font_family      → String  (sans | serif | mono)
view_count       → Number  (analytics)
is_published     → Boolean
created_at       → DateTime
updated_at       → DateTime
```

### 5.2 user_custom_section

Modular content attached to a profile.

```
user_id          → String  (FK to user_profile.user_id)
section_type     → String  (Experience | Project | Skill | Education | Custom)
section_title    → String
section_content  → String  (markdown supported)
section_order    → Number  (display ordering index)
is_visible       → Boolean
created_at       → DateTime
updated_at       → DateTime
```

---

## 6. Security Model

### 6.1 Row-Level Security (RLS)

| Schema | View | Create | Edit | Delete |
|--------|------|--------|------|--------|
| `user_profile` | Public | Owner | Owner | Admin only |
| `user_custom_section` | Public | Owner | Owner | Owner |

### 6.2 Column-Level Security (CLS)

| Schema | Field | Rule |
|--------|-------|------|
| `user_profile` | `user_id` | Read-only after creation |
| `user_profile` | `is_published` | Editable by owner only |
| `user_custom_section` | `user_id` | Read-only after creation |

### 6.3 Auth Token Flow

1. User logs in → IAM returns `access_token` + `refresh_token`
2. `access_token` sent in `Authorization: bearer <token>` header
3. On 401 → auto-refresh using `refresh_token`
4. If refresh fails → redirect to `/login`

---

## 7. Key Design Decisions

### 7.1 Why TanStack Query over Apollo?

SELISE Construct already uses TanStack Query. Apollo would add unnecessary bundle size (~30KB gzipped). TanStack Query provides:
- Automatic caching
- Background refetching
- Mutation invalidation
- DevTools support

### 7.2 Why Two GraphQL Clients?

- **`graphqlClient`** → Sends JWT headers. Used by authenticated pages.
- **`publicGraphqlClient`** → No JWT headers. Relies on Data Gateway RLS for public reads.

This avoids the auth redirect loop when unauthenticated users visit `/u/:username`.

### 7.3 Why No Custom Backend?

Per PRD constraints: "No custom SQL/NoSQL, no custom API servers." All data operations go through SELISE Data Gateway GraphQL. This is frontend-first orchestration.

### 7.4 Theme System

Four preset themes (minimal, bold, dark, gradient) + accent color + font family. Themes are applied as Tailwind CSS class combinations on the public profile page. No CSS-in-JS library needed.

---

## 8. Performance Optimizations

| Technique | Where | Benefit |
|-----------|-------|---------|
| Code splitting | React.lazy for routes | Reduces initial bundle |
| Image optimization | Storage Block serves WebP | Faster image loads |
| Debounced auto-save | Profile editor (1.5s) | Reduces API calls |
| Query caching | TanStack Query staleTime: 5min | Fewer refetches |
| LocalStorage dedup | View count tracking | One count per 24h per user |

---

## 9. Extension Points

The architecture supports adding new features without major refactoring:

| Feature | How to Add |
|---------|-----------|
| Blog posts | New `user_blog_post` schema + page module |
| Forums | New `user_forum_thread` schema + page module |
| Calendars | New `user_calendar_event` schema + page module |
| Analytics | Extend `user_profile.view_count` + add chart library |
| New theme | Add entry to `profileThemePresets` object |
| New social platform | Add to `PREDEFINED_PLATFORMS` array |

---

## 10. File Structure

```
universal-profile-engine/
├── src/
│   ├── modules/
│   │   ├── profile/
│   │   │   ├── graphql/          # Query & mutation definitions
│   │   │   ├── services/         # API service layer
│   │   │   │   ├── profile.service.ts
│   │   │   │   ├── public-profile.service.ts
│   │   │   ├── hooks/
│   │   │   │   ├── use-profile.ts
│   │   │   │   ├── use-public-profile.ts
│   │   │   ├── types/
│   │   │   │   └── profile.types.ts
│   │   │   └── pages/
│   │   │       ├── landing/
│   │   │       ├── public-profile/
│   │   │       ├── profile-editor/
│   │   │       ├── appearance/
│   │   │       ├── sections/
│   │   │       ├── preview/
│   │   │       ├── browse/
│   │   │       └── admin/
│   │   └── auth/                 # Construct auth module
│   ├── components/
│   │   └── core/                 # Shared UI components
│   ├── lib/
│   │   ├── graphql-client.ts     # Authenticated GraphQL client
│   │   ├── public-graphql-client.ts # Public GraphQL client
│   │   └── https.ts              # HTTP client with token refresh
│   ├── routes/
│   │   └── app-routes.tsx        # React Router config
│   └── styles/
│       └── theme/
│           ├── theme-provider.tsx
│           └── design-tokens.ts
├── README.md
├── ARCHITECTURE.md
└── TASK_LIST.md
```
