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

- `user_profile` — display name, username, bio, images, social links, theme, publish status
- `user_custom_section` — sections (experience, projects, skills, etc.) with order & visibility

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

## Deployment

Connected to GitHub: `CodeCraftsmaniac/Selise-Block-Project`
- `main` branch → production
- `dev` branch → development

Deploy via Blocks Cloud (Git-based) or manual upload.
