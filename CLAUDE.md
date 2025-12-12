# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm start              # Start Expo dev server
npm run ios            # Run on iOS (requires prebuild)
npm run android        # Run on Android (requires prebuild)
npm run build:ios      # Prebuild iOS native project
npm run build:android  # Prebuild Android native project
npm run lint           # Run ESLint
npm run type-check     # Run TypeScript type checking
npm run format         # Format with Prettier
npm run format:check   # Check formatting
```

## Architecture

### Expo Router (File-Based Routing)

Routes are defined by the directory structure in `src/app/`:

```
src/app/
├── _layout.tsx           # Root layout with providers (Query, Auth, etc.)
├── (auth)/               # Unauthenticated routes (login, welcome)
├── (onboarding)/         # Post-auth onboarding flow
└── (protected)/          # Authenticated main app
    ├── (tabs)/           # Bottom tab navigator
    │   ├── index.tsx     # Home/discovery screen
    │   ├── new-recipe.tsx
    │   └── library/      # Recipe library with nested routes
    ├── recipe/[id]/      # Recipe detail and edit screens
    ├── extraction/       # Recipe extraction flow
    └── settings.tsx
```

**Route Groups:** Parentheses `()` create groups that don't appear in URLs. The root layout uses `Stack.Protected` guards to show routes based on auth state.

### Authentication System

**File:** `src/contexts/AuthContext.tsx`

Uses Supabase Auth directly with OTP email verification:
- `authStatus`: `"loading"` | `"unauthenticated"` | `"authenticated_new_user"` | `"authenticated"`
- `isNewUser`: Determines onboarding routing
- Token refresh handled automatically by Supabase client

**Supabase Client:** `src/lib/supabase.ts` - Uses `LargeSecureStore` for encrypted token storage (handles tokens > 2048 bytes).

### API Client

**File:** `src/api/api-client.ts`

Axios-based client with Supabase session integration:

```typescript
import { api } from "@/api";

// Standard authenticated requests
api.get<Recipe[]>("/recipes");
api.post("/recipes", { title: "..." });

// Public endpoints (no auth)
api.public.get("/health");

// External APIs
api.external.get("https://external-api.com/data");
```

**Custom options:** `skipAuth`, `skipAuthRedirect`, `absoluteUrl`, `customBaseURL`, `silent`

### Service Layer

**Location:** `src/api/services/`

- `auth.service.ts` - Authentication (OTP, logout, user info, onboarding)
- `recipe.service.ts` - Recipe CRUD operations
- `extraction.service.ts` - Recipe extraction submission
- `collection.service.ts` - Cookbook/collection management
- `discovery.service.ts` - Discovery feed data
- `upload.service.ts` - Image uploads

### State Management

**TanStack Query** for server state with 5-minute default stale time. Custom hooks in `src/hooks/` wrap query/mutation logic.

**Contexts:**
- `AuthContext` - User authentication state and methods
- `RecipeContext` - Current recipe data for detail/edit screens
- `SearchContext` - Search functionality

## Styling

**NativeWind (Tailwind CSS for React Native)**

Design tokens defined in `tailwind.config.js`:
- **Primary:** Forest green (`primary`, `primary-light`, `primary-dark`)
- **Text:** Brown tones (`text-heading`, `text-body`, `text-muted`)
- **Surface:** Warm beige (`surface`, `surface-elevated`, `surface-overlay`)
- **State:** `state-success`, `state-warning`, `state-error`, `state-info`
- **Font:** PlayfairDisplay (`font-playfair`, `font-playfair-bold`)

Use `cn()` from `src/utils/cn.ts` to merge classes.

## TypeScript Path Aliases

```typescript
@/*           → src/*
@components/* → src/components/*
@hooks/*      → src/hooks/*
@api/*        → src/api/*
@types/*      → src/types/*
@locales/*    → src/locales/*
@utils/*      → src/utils/*
@constants    → src/constants.ts
@theme        → src/theme.ts
```

## Recipe Extraction System

Extraction methods are configured in `src/config/extractionMethods.ts`. Each method requires:

1. **Configuration** - Method type, label, icon
2. **Flow Hook** - Business logic (`src/hooks/useImageExtractionFlow.ts`)
3. **Input Component** - UI for the extraction method (`src/components/extraction/methods/`)
4. **API Service Method** - Backend integration

**See:** `docs/ADD_EXTRACTION_METHOD.md` for detailed implementation guide.

## Environment Variables

```env
# Required in .env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_API_URL=http://localhost:8000  # Backend API
```

EAS build profiles in `eas.json` configure environment per build type (development, preview, production).

## Key Patterns

- **File-based routing** via Expo Router with typed routes enabled
- **Declarative auth routing** using `Stack.Protected` guards
- **Service layer pattern** for API calls organized by domain
- **Supabase handles auth** - no manual token refresh logic needed
- **React Native New Architecture** enabled (`newArchEnabled: true`)
- **FlashList** for performant lists, **expo-image** for optimized images
