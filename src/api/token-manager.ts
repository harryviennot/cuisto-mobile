/**
 * Token manager - DEPRECATED
 *
 * Token management is now handled automatically by Supabase.
 * This file is kept for backward compatibility but should not be used.
 *
 * Supabase stores tokens in expo-secure-store via the adapter in lib/supabase.ts
 * and handles refresh automatically.
 *
 * To get the current access token, use:
 *   const { data: { session } } = await supabase.auth.getSession();
 *   const token = session?.access_token;
 */

// This export is kept for any code that might still import tokenManager
// but all methods are now no-ops or return safe defaults
export const tokenManager = {
  /**
   * @deprecated Use supabase.auth.getSession() instead
   */
  async getAccessToken(): Promise<string | null> {
    console.warn("tokenManager.getAccessToken() is deprecated. Use supabase.auth.getSession() instead.");
    return null;
  },

  /**
   * @deprecated Use supabase.auth.getSession() instead
   */
  async getRefreshToken(): Promise<string | null> {
    console.warn("tokenManager.getRefreshToken() is deprecated. Supabase handles refresh automatically.");
    return null;
  },

  /**
   * @deprecated Tokens are managed by Supabase
   */
  async setTokens(_accessToken: string, _refreshToken: string, _expiresIn: number): Promise<void> {
    console.warn("tokenManager.setTokens() is deprecated. Supabase manages tokens automatically.");
  },

  /**
   * @deprecated Use supabase.auth.signOut() instead
   */
  async clearTokens(): Promise<void> {
    console.warn("tokenManager.clearTokens() is deprecated. Use supabase.auth.signOut() instead.");
  },

  /**
   * @deprecated Supabase handles token expiry automatically
   */
  async isTokenExpired(): Promise<boolean> {
    console.warn("tokenManager.isTokenExpired() is deprecated. Supabase handles refresh automatically.");
    return false;
  },
};
