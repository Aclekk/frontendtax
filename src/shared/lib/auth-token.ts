const ACCESS_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";
const ACTIVE_STORE_CODE_KEY = "activeStoreCode";
const ACTIVE_STORE_NAME_KEY = "activeStoreName";
const ACTIVE_STORE_EMAIL_KEY = "activeStoreEmail";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_KEY);
}

export function getActiveStoreCode(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_STORE_CODE_KEY);
}

export function getActiveStoreName(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_STORE_NAME_KEY);
}

export function getActiveStoreEmail(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_STORE_EMAIL_KEY);
}

export function setTokens(accessToken: string, refreshToken: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCESS_KEY, accessToken);
  window.localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function setActiveStoreCode(
  storeCode: string | null,
  storeName?: string | null,
  storeEmail?: string | null
) {
  if (typeof window === "undefined") return;
  if (!storeCode) {
    window.localStorage.removeItem(ACTIVE_STORE_CODE_KEY);
    window.localStorage.removeItem(ACTIVE_STORE_NAME_KEY);
    window.localStorage.removeItem(ACTIVE_STORE_EMAIL_KEY);
    return;
  }

  window.localStorage.setItem(ACTIVE_STORE_CODE_KEY, storeCode);
  if (storeName) {
    window.localStorage.setItem(ACTIVE_STORE_NAME_KEY, storeName);
  }

  if (storeEmail) {
    window.localStorage.setItem(ACTIVE_STORE_EMAIL_KEY, storeEmail);
  } else {
    window.localStorage.removeItem(ACTIVE_STORE_EMAIL_KEY);
  }
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
  window.localStorage.removeItem(ACTIVE_STORE_CODE_KEY);
  window.localStorage.removeItem(ACTIVE_STORE_NAME_KEY);
  window.localStorage.removeItem(ACTIVE_STORE_EMAIL_KEY);
}
