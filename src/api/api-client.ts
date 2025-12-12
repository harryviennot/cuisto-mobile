/**
 * Mobile-optimized Axios API client
 *
 * This client now uses Supabase for token management:
 * - Gets access tokens from Supabase session
 * - Token refresh is handled automatically by Supabase
 * - No more manual refresh logic or race conditions
 */
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import Constants from "expo-constants";
import { router } from "expo-router";
import { Alert } from "react-native";
import { supabase } from "@/lib/supabase";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Extended Axios request config with custom options
 */
export interface ApiRequestConfig extends AxiosRequestConfig {
  /**
   * Skip adding authentication token to this request
   * Useful for public endpoints
   */
  skipAuth?: boolean;

  /**
   * Skip automatic redirect to login on auth failure
   * Useful when you want to handle auth errors manually
   */
  skipAuthRedirect?: boolean;

  /**
   * Use absolute URL instead of baseURL
   * Set to true when making requests to external APIs
   */
  absoluteUrl?: boolean;

  /**
   * Custom base URL for this specific request
   * Overrides the default baseURL
   */
  customBaseURL?: string;

  /**
   * Disable error alerts for this request
   */
  silent?: boolean;
}

/**
 * Custom API Error class with detailed error information
 */
export class ApiError extends Error {
  status?: number;
  code?: string;
  details?: unknown;
  response?: AxiosResponse;

  constructor(
    message: string,
    status?: number,
    code?: string,
    details?: unknown,
    response?: AxiosResponse
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.response = response;
  }
}

// ============================================================================
// CONFIGURATION
// ============================================================================

// Get API URL from environment or use default
export const API_URL =
  Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";

// Default base path (can be overridden per request)
const DEFAULT_BASE_PATH = "/api/v1";

/**
 * Create axios instance with base configuration
 * This instance is used for all API requests
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_URL}${DEFAULT_BASE_PATH}`,
  timeout: 60000, // 60 seconds - increased for long-running operations like extraction
  headers: {
    "Content-Type": "application/json",
  },
  // Enable automatic following of redirects
  maxRedirects: 5,
  // Validate status codes (2xx and 3xx are considered success)
  validateStatus: (status) => status >= 200 && status < 400,
});

// ============================================================================
// REQUEST INTERCEPTOR
// ============================================================================

/**
 * Request interceptor for authentication and configuration
 * Gets access token from Supabase session (auto-refreshed by Supabase)
 */
apiClient.interceptors.request.use(
  async (config) => {
    const customConfig = config as ApiRequestConfig;

    // Handle custom base URL
    if (customConfig.customBaseURL) {
      config.baseURL = customConfig.customBaseURL;
    }

    // Handle absolute URLs (external APIs)
    if (customConfig.absoluteUrl) {
      config.baseURL = "";
    }

    // Add auth token from Supabase session if available and not skipped
    if (!customConfig.skipAuth) {
      try {
        // getSession() returns a valid session with auto-refreshed token
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.access_token) {
          config.headers.Authorization = `Bearer ${session.access_token}`;
        }
      } catch (error) {
        console.log("Failed to get session for request:", error);
        // Continue without token - backend will return 401 if needed
      }
    }

    // Log request in development
    if (__DEV__) {
      console.log("🚀 API Request:", {
        method: config.method?.toUpperCase(),
        url: config.baseURL ? `${config.baseURL}${config.url}` : config.url,
        data: config.data,
        hasToken: !!config.headers?.Authorization,
        skipAuth: customConfig.skipAuth,
        absoluteUrl: customConfig.absoluteUrl,
      });
    }

    return config;
  },
  (error) => {
    console.error("❌ Request Error:", error);
    return Promise.reject(error);
  }
);

// ============================================================================
// RESPONSE INTERCEPTOR
// ============================================================================

/**
 * Response interceptor for handling responses and errors
 *
 * Note: Token refresh is now handled automatically by Supabase.
 * If we get a 401, it means the session is truly invalid (not just expired).
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response in development
    if (__DEV__) {
      console.log("✅ API Response:", {
        status: response.status,
        url: response.config.url,
        data: response.data,
      });
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as ApiRequestConfig;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Handle 401 errors - session is invalid
    // With Supabase auto-refresh, a 401 means the session is truly invalid
    if (error.response?.status === 401 && !originalRequest.skipAuthRedirect) {
      await handleAuthFailure();
      return Promise.reject(error);
    }

    // Handle other errors
    let message = "An unexpected error occurred";
    const status = error.response?.status;
    let code: string | undefined;
    let details: unknown;

    if (error.response) {
      const { data } = error.response;

      // Backend returns errors in format: { error: { code, message }, timestamp, path }
      // or { message, detail }
      const errorData = data as {
        error?: {
          code?: string;
          message?: string;
        };
        message?: string;
        detail?: string;
        errors?: unknown;
      };

      // Try to extract message from backend error format first
      if (errorData?.error?.message) {
        message = errorData.error.message;
        code = errorData.error.code;
      } else if (errorData?.message) {
        message = errorData.message;
      } else if (errorData?.detail) {
        message = errorData.detail;
      } else {
        // Fallback to generic messages
        switch (status) {
          case 400:
            message = "Bad request";
            break;
          case 401:
            message = "Unauthorized";
            break;
          case 403:
            message = "Forbidden - Insufficient permissions";
            break;
          case 404:
            message = "Resource not found";
            break;
          case 409:
            message = "Resource already exists";
            break;
          case 422:
            message = "Validation error";
            details = errorData?.errors;
            break;
          case 500:
            message = "Internal server error";
            break;
          default:
            message = `Error ${status}`;
        }
      }
    } else if (error.request) {
      message = "Network error - Please check your connection";
    }

    const apiError = new ApiError(message, status, code, details, error.response);

    // Log error if not silent
    if (!originalRequest.silent) {
      console.error("❌ API Error:", apiError);
    }

    return Promise.reject(apiError);
  }
);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Handle authentication failure (redirect to login)
 */
async function handleAuthFailure(): Promise<void> {
  // Sign out from Supabase to clear local session
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.log("Error signing out:", error);
  }

  // Show alert on mobile
  Alert.alert("Session Expired", "Your session has expired. Please login again.", [{ text: "OK" }]);

  // Navigate to login screen
  try {
    router.replace("/");
  } catch (error) {
    console.error("Navigation error:", error);
  }
}

// ============================================================================
// API HELPERS
// ============================================================================

/**
 * Convenient API helper functions with type support
 */
export const api = {
  /**
   * GET request
   */
  get: <T = unknown>(url: string, config?: ApiRequestConfig) => apiClient.get<T>(url, config),

  /**
   * POST request
   */
  post: <T = unknown>(url: string, data?: unknown, config?: ApiRequestConfig) =>
    apiClient.post<T>(url, data, config),

  /**
   * PUT request
   */
  put: <T = unknown>(url: string, data?: unknown, config?: ApiRequestConfig) =>
    apiClient.put<T>(url, data, config),

  /**
   * PATCH request
   */
  patch: <T = unknown>(url: string, data?: unknown, config?: ApiRequestConfig) =>
    apiClient.patch<T>(url, data, config),

  /**
   * DELETE request
   */
  delete: <T = unknown>(url: string, config?: ApiRequestConfig) => apiClient.delete<T>(url, config),

  /**
   * HEAD request
   */
  head: <T = unknown>(url: string, config?: ApiRequestConfig) => apiClient.head<T>(url, config),

  /**
   * OPTIONS request
   */
  options: <T = unknown>(url: string, config?: ApiRequestConfig) =>
    apiClient.options<T>(url, config),

  /**
   * Make a request to an external API (absolute URL)
   */
  external: {
    get: <T = unknown>(url: string, config?: ApiRequestConfig) =>
      apiClient.get<T>(url, { ...config, absoluteUrl: true } as ApiRequestConfig),

    post: <T = unknown>(url: string, data?: unknown, config?: ApiRequestConfig) =>
      apiClient.post<T>(url, data, { ...config, absoluteUrl: true } as ApiRequestConfig),

    put: <T = unknown>(url: string, data?: unknown, config?: ApiRequestConfig) =>
      apiClient.put<T>(url, data, { ...config, absoluteUrl: true } as ApiRequestConfig),

    patch: <T = unknown>(url: string, data?: unknown, config?: ApiRequestConfig) =>
      apiClient.patch<T>(url, data, { ...config, absoluteUrl: true } as ApiRequestConfig),

    delete: <T = unknown>(url: string, config?: ApiRequestConfig) =>
      apiClient.delete<T>(url, { ...config, absoluteUrl: true } as ApiRequestConfig),
  },

  /**
   * Make a public request (no authentication)
   */
  public: {
    get: <T = unknown>(url: string, config?: ApiRequestConfig) =>
      apiClient.get<T>(url, { ...config, skipAuth: true } as ApiRequestConfig),

    post: <T = unknown>(url: string, data?: unknown, config?: ApiRequestConfig) =>
      apiClient.post<T>(url, data, { ...config, skipAuth: true } as ApiRequestConfig),

    put: <T = unknown>(url: string, data?: unknown, config?: ApiRequestConfig) =>
      apiClient.put<T>(url, data, { ...config, skipAuth: true } as ApiRequestConfig),

    patch: <T = unknown>(url: string, data?: unknown, config?: ApiRequestConfig) =>
      apiClient.patch<T>(url, data, { ...config, skipAuth: true } as ApiRequestConfig),

    delete: <T = unknown>(url: string, config?: ApiRequestConfig) =>
      apiClient.delete<T>(url, { ...config, skipAuth: true } as ApiRequestConfig),
  },
};

export default apiClient;
