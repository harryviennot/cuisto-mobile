# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server
npm start

# Run on specific platform
npm run android
npm run ios
npm run web

# Build native projects (run before ios/android if needed)
npm run build:ios
npm run build:android

# Code quality checks
npm run lint              # Run ESLint
npm run type-check        # Run TypeScript type checking
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting
```

## Project Architecture

### Expo Router (File-Based Routing)

This project uses Expo Router for navigation. Routes are determined by the file structure in the `app/` directory:

- Files/folders in `app/` automatically become routes
- `_layout.tsx` is a special file that wraps its children (like middleware/providers)
- `index.tsx` represents the default route for its directory
- Typed routes are enabled (`typedRoutes: true` in app.json) for type-safe navigation

The root layout at `src/app/_layout.tsx` configures global providers (QueryClientProvider, i18n).

### API Client Architecture

**Location:** `src/api/`

The API client is built on Axios with sophisticated authentication handling:

**Base URL Resolution:**
1. `Constants.expoConfig?.extra?.apiUrl` (from app.json)
2. `process.env.EXPO_PUBLIC_API_URL` (environment variable)
3. Fallback: `http://localhost:8000`

**Automatic Token Management:**
- Request interceptor adds Bearer token from secure storage (expo-secure-store)
- Response interceptor handles 401 errors with automatic token refresh
- Token refresh queues subsequent requests to prevent race conditions
- On refresh failure: clears tokens, shows alert, redirects to home

**API Helper Methods:**
```typescript
// Standard authenticated requests
api.get/post/put/patch/delete()

// Public endpoints (no auth required)
api.public.get/post/put/patch/delete()

// External APIs (custom base URL)
api.external.get/post/put/patch/delete()
```

**Custom Request Options (`ApiRequestConfig`):**
- `skipAuth` - Don't add Authorization header
- `skipAuthRetry` - Don't auto-retry on 401
- `skipAuthRedirect` - Don't redirect to login on auth failure
- `absoluteUrl` - Use full URL for external APIs
- `customBaseURL` - Override base URL for specific request
- `silent` - Don't log errors to console

**Service Layer Pattern:**
Organize API calls by domain in `src/api/services/`:
- `auth.service.ts` - Authentication endpoints (magic link, OTP, token refresh)
- Create new service files following the same pattern (e.g., `recipe.service.ts`, `user.service.ts`)
- See `example.service.ts` for 11+ different API usage patterns

### State Management

**TanStack Query (@tanstack/react-query)** is configured in `src/app/_layout.tsx`:
- Default retry: 2 attempts
- Default stale time: 5 minutes
- QueryClientProvider wraps entire app
- Create custom hooks in `src/hooks/` that use `useQuery`, `useMutation`, etc.
- Integrates seamlessly with the API client for automatic caching and background refetching

### Authentication & Token Storage

**Location:** `src/api/token-manager.ts`

Tokens are stored in **expo-secure-store** (encrypted, not AsyncStorage):

```typescript
// Token management methods
tokenManager.setTokens(accessToken, refreshToken, expiresIn)
tokenManager.getAccessToken()
tokenManager.getRefreshToken()
tokenManager.clearTokens()
tokenManager.isTokenExpired()
```

Token expiry includes a 5-minute buffer to prevent using tokens about to expire. The API client automatically refreshes tokens when they expire.

### Styling with NativeWind/Tailwind CSS

This project uses **NativeWind** (Tailwind CSS for React Native):

**Configuration Files:**
- `tailwind.config.js` - Comprehensive theme with custom colors
- `src/global.css` - Tailwind directives
- `babel.config.js` - NativeWind Babel preset
- `metro.config.js` - Path aliases for NativeWind

**Custom Theme Colors:**
- Primary: Forest green palette (`primary`, `primary-light`, `primary-dark`)
- Text: Brown tones (`text-heading`, `text-body`, `text-muted`)
- Surface: Warm beige backgrounds (`surface`, `surface-elevated`, `surface-overlay`, `surface-texture`)
- State colors: `state-success`, `state-warning`, `state-error`, `state-info`
- Interactive: `interactive-primary`, `interactive-secondary`, `interactive-muted`

**Typography:**
- Font Family: PlayfairDisplay (elegant serif)
- Classes: `font-playfair`, `font-playfair-bold`, `font-playfair-italic`

**Usage:**
```typescript
<View className="flex-1 items-center justify-center gap-6 p-6">
  <Text className="text-2xl font-bold text-foreground-heading">Title</Text>
</View>
```

**Utility Function:**
Use `cn()` from `src/utils/cn.ts` to merge classes intelligently:
```typescript
cn("px-2 px-4", condition && "px-8")  // Resolves conflicting classes
```

### Internationalization (i18n)

**Location:** `src/locales/`

**Setup:**
- i18next + react-i18next for translations
- Device language auto-detection via expo-localization
- User language preference saved to AsyncStorage
- Currently supports: English (`en.json`), French (`fr.json`)

**Translation Structure:**
```json
{
  "common": {},      // Shared strings (cancel, save, delete, etc.)
  "app": {},         // App-specific strings
  "language": {},    // Language selection strings
  // Add feature-specific keys as needed
}
```

**TypeScript Integration:**
`src/types/i18next.d.ts` provides type-safe translation keys with autocomplete.

**Usage:**
```typescript
import { useTranslation } from "react-i18next";

const { t, i18n } = useTranslation();
<Text>{t("app.title")}</Text>
i18n.changeLanguage("fr");
```

### TypeScript Path Aliases

Configured in `tsconfig.json` and `metro.config.js`:

```typescript
@/*                  → src/*
@components/*        → src/components/*
@hooks/*            → src/hooks/*
@api/*              → src/api/*
@types/*            → src/types/*
@locales/*          → src/locales/*
@utils/*            → src/utils/*
@constants          → src/constants.ts
@theme              → src/theme.ts
@global             → src/global.css
```

Use these aliases instead of relative paths for cleaner imports.

### Component Organization

**Directory Structure:**
```
src/
├── api/              # API client, services, token management
├── app/              # Expo Router routes (file-based routing)
├── components/       # Reusable UI components
│   ├── ui/          # Generic UI components (ActionSheet, ErrorState, Skeleton)
│   ├── extraction/  # Recipe extraction components (FAB, ImageUploadCard, ExtractionProgress)
│   ├── recipe/      # Recipe-specific components (RecipeCard, RecipeDetail, RecipeEdit)
│   ├── home/        # Home screen components (Header, SearchBar, MasonryGrid)
│   ├── forms/       # Form components (TextInput, FormGroupInput)
│   ├── DragAndDrop/ # Drag-and-drop system with custom hooks
│   └── navigation/  # Navigation components (FloatingTabBar)
├── config/          # Configuration files (extractionMethods.ts)
├── contexts/        # React Contexts (AuthContext, RecipeContext, SearchContext)
├── hooks/           # Custom React hooks
│   └── recipe/     # Recipe-specific hooks
├── locales/         # i18n translation files
├── schemas/         # Validation schemas (Zod)
├── types/           # TypeScript type definitions
└── utils/           # Utility functions
```

**Pattern to follow:**
```typescript
// Example component structure
import { useTranslation } from "react-i18next";

export default function MyComponent() {
  const { t } = useTranslation();

  return (
    <View className="gap-4 rounded-lg bg-surface-elevated p-4">
      {/* Component JSX */}
    </View>
  );
}
```

## Key Architectural Patterns

1. **Service Layer Pattern** - Organize API calls by domain in `src/api/services/`
2. **Centralized Error Handling** - `ApiError` class with status, code, and details
3. **Secure Token Storage** - expo-secure-store (encrypted) instead of AsyncStorage
4. **Token Refresh Queue** - Prevents multiple simultaneous refresh requests
5. **Type Safety** - Full TypeScript with path aliases throughout
6. **File-based Routing** - Expo Router for intuitive navigation
7. **Utility-first Styling** - NativeWind/Tailwind CSS for consistent design
8. **Modular Structure** - Clear separation: components, hooks, services, types

## Data Flow

### Typical Request Flow:
```
Component (useQuery/useMutation)
  ↓
Custom Hook (src/hooks/)
  ↓
API Service (src/api/services/)
  ↓
API Client (src/api/api-client.ts)
  ↓
Request Interceptor (add token)
  ↓
Axios HTTP Request
  ↓
Response Interceptor (handle 401, parse errors)
  ↓
Return to Component
```

### Authentication Flow:
```
1. User logs in → authService.sendMagicLink()
2. User verifies → authService.verifyEmailOTP()
3. Backend returns AuthResponse with tokens
4. tokenManager.setTokens() stores in secure storage
5. Subsequent requests auto-include token via interceptor
6. Token expires → Interceptor catches 401
7. Calls /auth/refresh automatically
8. Retries original request with new token
9. On refresh failure → Clear tokens, redirect to home
```

## Adding New Features

### Creating a New API Service:
1. Create service file in `src/api/services/` (e.g., `recipe.service.ts`)
2. Use api helper methods: `api.get()`, `api.post()`, etc.
3. Define TypeScript types in `src/types/`
4. Export from `src/api/services/index.ts`

### Creating a New Screen:
1. Add file to `src/app/` directory (e.g., `recipe.tsx` for `/recipe` route)
2. For complex screens, create screen component in `src/screens/` and import in app file
3. Use NativeWind classes for styling
4. Import translations with `useTranslation()`

### Creating a Custom Hook:
1. Create hook file in `src/hooks/` (e.g., `useRecipes.ts`)
2. Use `useQuery` or `useMutation` from @tanstack/react-query
3. Call API service methods
4. Return data, loading state, error state

## Environment Configuration

Set `EXPO_PUBLIC_API_URL` in `.env` or configure `extra.apiUrl` in `app.json`:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://api.example.com"
    }
  }
}
```

## React Native New Architecture

This project uses React Native's New Architecture (`newArchEnabled: true` in app.json). Be aware of compatibility when adding new native modules.

## Authentication System

**Location:** `src/contexts/AuthContext.tsx`

The app supports both anonymous and authenticated users:

**Anonymous Authentication:**
- Users can browse and use the app without creating an account
- On first launch, `AuthContext` automatically signs in anonymously
- Anonymous users get temporary tokens for API access

**Authentication Flow:**
```
App Launch
  ↓
Check for existing tokens
  ↓
  ├─ Tokens exist → Get current user
  └─ No tokens → Sign in anonymously
```

**Usage:**
```typescript
import { useAuth } from "@/contexts/AuthContext";

const { user, isAuthenticated, isAnonymous, signOut } = useAuth();

// Check if user is authenticated (not anonymous)
if (isAuthenticated && !isAnonymous) {
  // Show authenticated features
}
```

**Available Contexts:**
- `AuthContext` - User authentication state
- `RecipeContext` - Recipe data management
- `SearchContext` - Search functionality

## Recipe Extraction System

**Architecture:** The recipe extraction system is modular and extensible.

**Current extraction methods:**
- **Image** - Camera or gallery photos (max 3 images)
- **Video** - Import from video link (TikTok, Instagram, YouTube)
- **URL** - Paste recipe URL (future)
- **Voice** - Record voice instructions (future)
- **Paste** - Paste recipe text (future)

**Configuration:** `src/config/extractionMethods.ts`

Each extraction method requires:
1. **Configuration** - Define method type, label, icon
2. **Flow Hook** - Business logic (useImageExtractionFlow.ts, useVideoExtractionFlow.ts)
3. **Confirmation View** - UI for confirming submission
4. **API Service Method** - Backend integration

**See:** `docs/ADD_EXTRACTION_METHOD.md` for detailed guide on adding new extraction methods.

**Extraction Flow:**
```
User selects method (FAB button)
  ↓
Method-specific input (camera, gallery, URL, etc.)
  ↓
Confirmation view (preview, validate)
  ↓
Submit to backend (POST /api/v1/extraction/submit)
  ↓
Poll job status (useExtractionJob hook)
  ↓
Navigate to recipe detail on completion
```

## Key Custom Hooks

**Data Fetching:**
- `useRecipes()` - Fetch and manage recipes with TanStack Query
- `useExtractionJob(jobId)` - Poll extraction job status with SSE
- `useCollections()` - Manage recipe collections/cookbooks

**Extraction:**
- `useImageExtractionFlow()` - Image extraction business logic
- `useVideoExtractionFlow()` - Video extraction business logic
- `useImagePicker()` - Native image picker with permissions

**UI/UX:**
- `useScrollHeader()` - Animated header on scroll
- `useSearch()` - Search functionality
- `useDeviceType()` - Detect device type (phone/tablet)

**Polling & Real-time:**
- `usePolling(callback, interval)` - Generic polling hook
- `useSSE(url, onMessage)` - Server-Sent Events for real-time updates

## Form Validation

**Library:** Zod with react-hook-form

**Location:** `src/schemas/`

**Pattern:**
```typescript
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const recipeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

export default function MyForm() {
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(recipeSchema),
  });

  // Use control with TextInput components
}
```

## Important Notes

### Expo Router File Structure
Routes in `src/app/` follow these conventions:
- `index.tsx` - Default route for directory
- `_layout.tsx` - Layout wrapper (provider, navigation)
- `[param].tsx` - Dynamic route parameter
- `(tabs)/` - Route group (doesn't appear in URL)

Example: `src/app/recipe/[id]/index.tsx` → `/recipe/123`

### API Services Organization
All API services are in `src/api/services/` and exported from `index.ts`:
- `auth.service.ts` - Authentication (magic link, OTP, tokens)
- `extraction.service.ts` - Recipe extraction submission
- `recipe.service.ts` - Recipe CRUD operations
- `collection.service.ts` - Cookbook/collection management

### Design System
The app uses a custom warm, cookbook-inspired design:
- **Primary color:** Forest green (#334d43)
- **Surface colors:** Warm beige/paper texture
- **Typography:** Playfair Display (elegant serif)
- Always use design tokens from `tailwind.config.js`, not hardcoded colors

### Performance Considerations
- Use `FlashList` (from @shopify/flash-list) instead of FlatList for long lists
- Use `expo-image` instead of React Native Image for better performance
- Lazy load images with NitroImage where appropriate
- Use React.memo() for expensive components that re-render frequently
