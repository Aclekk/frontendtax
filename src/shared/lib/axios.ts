import axios from "axios";
import { clearTokens, getAccessToken, setTokens } from "@/shared/lib/auth-token";

type RetriableRequestConfig = {
  _retry?: boolean;
};

let refreshRequest: Promise<string> | null = null;

async function refreshAccessToken() {
  if (!refreshRequest) {
    refreshRequest = authApi
      .post<{
        success: boolean;
        data?: { accessToken: string; refreshToken: string };
      }>("/auth/refresh")
      .then((response) => {
        const refreshed = response.data.data;
        if (!response.data.success || !refreshed?.accessToken || !refreshed.refreshToken) {
          throw new Error("Refresh token gagal.");
        }

        setTokens(refreshed.accessToken, refreshed.refreshToken);
        return refreshed.accessToken;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
}

// Same-origin proxy â†’ Next.js `/api/gw/*` meneruskan ke API Gateway.
// Browser tidak boleh hit gateway langsung (CORS, response kosong).
const API_GATEWAY_BASE_URL = "/api/gw";
const AUTH_API_BASE_URL = "/api";

export const api = axios.create({
  baseURL: API_GATEWAY_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const hasToken = !!getAccessToken();
    const url = String(error.config?.url ?? "");
    const isLogin = url.includes("/auth/login");
    const isRefresh = url.includes("/auth/refresh");
    const requestConfig = error.config as (typeof error.config & RetriableRequestConfig) | undefined;

    if (
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      hasToken &&
      !isLogin &&
      !isRefresh &&
      requestConfig &&
      !requestConfig._retry
    ) {
      requestConfig._retry = true;
      try {
        const accessToken = await refreshAccessToken();
        requestConfig.headers = requestConfig.headers ?? {};
        requestConfig.headers.Authorization = `Bearer ${accessToken}`;
        return api(requestConfig);
      } catch {
        clearTokens();
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export const authApi = axios.create({
  baseURL: AUTH_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

authApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const hasToken = !!getAccessToken();
    const url = String(error.config?.url ?? "");
    const isLogin = url.includes("/auth/login");
    const isRefresh = url.includes("/auth/refresh");
    if (
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      hasToken &&
      !isLogin &&
      !isRefresh
    ) {
      clearTokens();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
