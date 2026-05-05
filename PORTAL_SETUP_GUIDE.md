# Portal Setup Guide — Universal Profile Engine

> Step-by-step instructions for configuring the Blocks Cloud portal.  
> These are **manual steps** that must be done in the Blocks Cloud web interface.

---

## Prerequisites

- Blocks Cloud account with a project created
- GitHub repository connected: `CodeCraftsmaniac/Selise-Block-Project`
- This frontend code deployed (or running locally)

---

## Step 1: Enable Authentication (IAM Block)

1. Go to **Blocks Cloud > Services > Authentication**
2. Enable **Email/Password** login
3. Configure token validity:
   - Access Token: `60` minutes
   - Refresh Token: `7` days
   - "Remember Me" Token: `30` days
4. Set account security:
   - Max wrong attempts: `5`
   - Lock duration: `30` minutes
5. (Optional) Enable **Social Login** (Google / Microsoft) if needed
6. Save settings

---

## Step 2: Create Roles & Permissions

1. Go to **Blocks Cloud > Services > Access Manager > Roles**
2. Create role: **`user`** (default for all signups)
3. Create role: **`admin`** (platform administrators)
4. Create role: **`public`** (unauthenticated visitors)
5. Assign default role: **`user`** for new signups

### Permission Strings

| Role | Permission |
|------|-----------|
| `user` | `blocks-data-gateway-api::user_profile::create` |
| `user` | `blocks-data-gateway-api::user_profile::view` |
| `user` | `blocks-data-gateway-api::user_profile::edit` |
| `user` | `blocks-data-gateway-api::user_custom_section::create` |
| `user` | `blocks-data-gateway-api::user_custom_section::view` |
| `user` | `blocks-data-gateway-api::user_custom_section::edit` |
| `user` | `blocks-data-gateway-api::user_custom_section::delete` |
| `user` | `blocks-storage-api::file::upload` |
| `user` | `blocks-storage-api::file::download` |
| `admin` | All `user` permissions + `blocks-data-gateway-api::user_profile::delete` |
| `public` | `blocks-data-gateway-api::user_profile::view` |
| `public` | `blocks-data-gateway-api::user_custom_section::view` |
| `public` | `blocks-storage-api::file::download` |

---

## Step 3: Create Data Gateway Schemas

### 3.1 Create `user_profile` Schema

1. Go to **Blocks Cloud > Services > Data Gateway**
2. Click **"Create Schema"**
3. Name: `user_profile`
4. Add fields:

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `user_id` | String | Yes | — | Links to IAM `User.itemId` |
| `username` | String | Yes | — | Mark as **Unique** |
| `display_name` | String | Yes | — | |
| `headline` | String | No | `''` | |
| `bio_text` | String | No | `''` | |
| `profile_image_url` | String | No | `''` | |
| `header_image_url` | String | No | `''` | |
| `social_links` | Array of Objects | No | `[]` | Schema: `{platform, url, label}` |
| `theme_preference` | String | No | `'minimal'` | |
| `accent_color` | String | No | `'#3b82f6'` | |
| `font_family` | String | No | `'sans'` | |
| `view_count` | Number | No | `0` | |
| `is_published` | Boolean | No | `false` | |
| `created_at` | DateTime | Auto | `now()` | |
| `updated_at` | DateTime | Auto | `now()` | |

5. **Publish** the schema

### 3.2 Create `user_custom_section` Schema

1. Click **"Create Schema"**
2. Name: `user_custom_section`
3. Add fields:

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `user_id` | String | Yes | — | Owner reference |
| `section_type` | String | Yes | — | `Experience`, `Project`, `Skill`, `Education`, `Custom` |
| `section_title` | String | No | `''` | |
| `section_content` | String | No | `''` | Markdown supported |
| `section_order` | Number | No | `0` | Display ordering |
| `is_visible` | Boolean | No | `true` | Toggle visibility |
| `created_at` | DateTime | Auto | `now()` | |
| `updated_at` | DateTime | Auto | `now()` | |

4. **Publish** the schema

---

## Step 4: Configure Row-Level Security (RLS)

### 4.1 `user_profile` RLS

1. Open `user_profile` schema → **Security** tab
2. Set rules:

| Action | Type | Configuration |
|--------|------|---------------|
| **View** | Public | Anyone can view published profiles |
| **Create** | Custom | `user_id` equals `auth.userId` |
| **Edit** | Custom | `user_id` equals `auth.userId` |
| **Delete** | Role-based | `admin` role only |

3. For **Public View**: Add condition `is_published == true`

### 4.2 `user_custom_section` RLS

1. Open `user_custom_section` schema → **Security** tab
2. Set rules:

| Action | Type | Configuration |
|--------|------|---------------|
| **View** | Public | Anyone can view (filters by `is_visible`) |
| **Create** | Custom | `user_id` equals `auth.userId` |
| **Edit** | Custom | `user_id` equals `auth.userId` |
| **Delete** | Custom | `user_id` equals `auth.userId` |

---

## Step 5: Configure Column-Level Security (CLS)

### 5.1 `user_profile` CLS

1. Open `user_profile` schema → **Column Security** tab
2. Set rules:

| Field | Rule |
|-------|------|
| `user_id` | Read-only after creation |
| `is_published` | Editable by owner only |

### 5.2 `user_custom_section` CLS

1. Open `user_custom_section` schema → **Column Security** tab
2. Set rule:

| Field | Rule |
|-------|------|
| `user_id` | Read-only after creation |

---

## Step 6: Configure Storage Block

1. Go to **Blocks Cloud > Services > Storage**
2. Verify managed blob storage is active
3. Configure upload settings:
   - Allowed file types: `jpg`, `jpeg`, `png`, `gif`, `webp`
   - Max file size: `5MB` for profile pictures, `10MB` for headers
4. Save settings

---

## Step 7: Test in Data Playground

1. Go to **Blocks Cloud > Services > Data Gateway > Data Playground**
2. Test these queries:

### Create a profile
```graphql
mutation {
  insertUserProfile(input: {
    user_id: "test-user-id",
    username: "testuser",
    display_name: "Test User",
    headline: "Developer",
    bio_text: "Hello world",
    theme_preference: "minimal",
    is_published: true
  }) {
    itemId
    acknowledged
  }
}
```

### Fetch by username
```graphql
query {
  getUserProfiles(input: {
    filter: { username: "testuser" }
  }) {
    items {
      ItemId
      username
      display_name
      is_published
    }
  }
}
```

### Create a section
```graphql
mutation {
  insertUserCustomSection(input: {
    user_id: "test-user-id",
    section_type: "Experience",
    section_title: "Software Engineer",
    section_content: "Worked on...",
    section_order: 0,
    is_visible: true
  }) {
    itemId
    acknowledged
  }
}
```

### Fetch sections
```graphql
query {
  getUserCustomSections(input: {
    filter: { user_id: "test-user-id" }
  }) {
    items {
      ItemId
      section_type
      section_title
      section_order
    }
  }
}
```

---

## Step 8: Client Credentials for Public Access

1. Go to **Blocks Cloud > Services > Access Manager > Client Credentials**
2. Click **"Create Client Credential"**
3. Name: `public-profile-reader`
4. Assign role: **`public`**
5. Copy the **Client ID** and **Client Secret**
6. Add to `.env`:
   ```bash
   VITE_CLIENT_ID=<your-client-id>
   VITE_CLIENT_SECRET=<your-client-secret>
   ```
7. Test: Use the credential to fetch a published profile via GraphQL (no user auth required)

---

## Step 9: Organizations (Multi-Tenancy)

1. Go to **Blocks Cloud > Services > Access Manager > Organizations**
2. Create default organization: **`universal-profile-engine`**
3. Ensure all new users are auto-assigned to this organization
4. Verify: Users in Org A cannot access Org B data (if multi-org is needed)

---

## Step 10: Localization Keys

1. Go to **Blocks Cloud > Services > Localization**
2. Add language: **English (en)** — primary
3. (Optional) Add language: **Bengali (bn)**

### Create Module: `auth`

| Key | Value |
|-----|-------|
| `auth.login_title` | Sign In |
| `auth.signup_title` | Create Account |
| `auth.email_label` | Email |
| `auth.password_label` | Password |
| `auth.login_button` | Log In |
| `auth.signup_button` | Sign Up |
| `auth.forgot_password` | Forgot Password? |
| `auth.logout` | Log Out |

### Create Module: `editor`

| Key | Value |
|-----|-------|
| `editor.dashboard_title` | My Profile |
| `editor.display_name_label` | Display Name |
| `editor.headline_label` | Professional Headline |
| `editor.bio_label` | About Me |
| `editor.profile_image_label` | Profile Picture |
| `editor.header_image_label` | Header Image |
| `editor.social_links_label` | Social Links |
| `editor.add_link_button` | Add Link |
| `editor.save_button` | Save |
| `editor.publish_button` | Publish |
| `editor.unpublish_button` | Unpublish |
| `editor.preview_button` | Preview |
| `editor.saved_toast` | Profile saved! |
| `editor.published_toast` | Profile is now live! |

### Create Module: `public`

| Key | Value |
|-----|-------|
| `public.view_profile` | View Profile |
| `public.connect_with_me` | Connect with me |
| `public.about_section` | About |
| `public.not_found` | Profile not found |

### Create Module: `common`

| Key | Value |
|-----|-------|
| `common.app_name` | Universal Profile Engine |
| `common.loading` | Loading... |
| `common.error` | Something went wrong |
| `common.save` | Save |
| `common.cancel` | Cancel |
| `common.delete` | Delete |

### Profile-specific Keys (add to `editor` or `common` module)

| Key | Value |
|-----|-------|
| `USERNAME_MIN_3` | Username must be at least 3 characters |
| `USERNAME_MAX_30` | Username must be at most 30 characters |
| `USERNAME_ALPHANUMERIC` | Only lowercase letters, numbers, and underscores |
| `USERNAME` | Username |
| `CHOOSE_USERNAME` | Choose a username |
| `CHECKING_AVAILABILITY` | Checking availability... |
| `USERNAME_AVAILABLE` | Username is available |
| `USERNAME_TAKEN` | Username is already taken |

---

## Step 11: Activation & Recovery Links

1. Verify **activation link** flow:
   - Invite a user via Blocks Cloud > User Management
   - Check email for activation link
   - Click link → set password + name + username → account activated
2. Verify **recovery link** flow:
   - Go to `/forgot-password` in the app
   - Enter email → check email for reset link
   - Click link → set new password → login works
3. (Optional) Customize email templates in Blocks Cloud

---

## Step 12: Environment Variables

1. Copy `.env.example` to `.env`
2. Fill in your Blocks Cloud credentials:

```bash
VITE_API_BASE_URL=https://your-api-domain.seliseblocks.com
VITE_X_BLOCKS_KEY=your_actual_project_key
VITE_PROJECT_SLUG=your_project_slug
VITE_APP_DOMAIN=https://your-app.seliseblocks.com
VITE_CLIENT_ID=<public-client-id>
VITE_CLIENT_SECRET=<public-client-secret>
```

---

## Step 13: Deploy the Application

### Option A: Git-based Deployment

1. Push `main` branch to GitHub
2. In Blocks Cloud: **Deployments > Git-based**
3. Select `main` branch
4. Trigger deployment
5. Monitor build logs

### Option B: Manual Upload

1. Run `npm run build` locally
2. Upload `dist/` folder via Blocks Cloud portal
3. Verify deployment succeeds

---

## Step 14: Post-Deployment Verification

| Test | Expected Result |
|------|----------------|
| Visit app URL | Landing page loads |
| Sign up | Account created, activation email sent |
| Activate account | Profile auto-created, redirected to dashboard |
| Edit profile | Changes save to Data Gateway |
| Upload image | Image appears in preview |
| Publish profile | Public page accessible at `/u/:username` |
| Visit public page | Profile renders with theme, sections, social links |
| Unpublish profile | Public page shows "not public" message |

---

## Troubleshooting

### "Unauthorized" when creating profile
- Check that the user has the `user` role
- Verify RLS create permission: `user_id == auth.userId`

### Public profile page not loading
- Check that `publicGraphqlClient` does NOT send auth headers
- Verify RLS view permission is set to "Public"

### Images not uploading
- Verify Storage Block is enabled
- Check that `blocks-storage-api::file::upload` permission is granted
- Check presigned URL response format

### Theme not applying on public page
- Verify `theme_preference` field exists in schema
- Check that value is one of: `minimal`, `bold`, `dark`, `gradient`

---

## Next Steps

After portal setup is complete:
1. Run E2E tests from `TASK_LIST.md` Layer 7
2. Add localization keys via UILM Chrome extension
3. (Optional) Configure Blocks AI agent for bio suggestions
4. (Optional) Create welcome email workflow
