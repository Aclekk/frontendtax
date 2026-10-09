export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginApiResponse = {
  code: number;
  success: boolean;
  message: string;
  data: {
    user: {
      id: number;
      userName: string;
      email: string;
    };
    application: { applicationId: number; applicationName: string }[];
    role: { applicationId: number; roleId: number; roleName: string }[];
    store?: { storeCode: string; storeName: string; email?: string }[];
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
};

export type AppRole = "sa" | "tax" | "admin";

export type AuthStore = {
  storeCode: string;
  storeName: string;
  email?: string;
};

export function resolveActiveStoreFromLogin(
  stores: AuthStore[] | null | undefined,
  fallbackStoreCode?: string | null,
  extraCandidateStoreCode?: string | null
): AuthStore | null {
  const candidates = (stores ?? []).filter(
    (store): store is AuthStore => Boolean(store?.storeCode?.trim())
  );

  if (candidates.length === 0) return null;

  const selectedByPreference = candidates.find((store) => {
    const meta = store as AuthStore & {
      isActive?: boolean;
      selected?: boolean;
      isDefault?: boolean;
      default?: boolean;
      active?: boolean;
    };

    return (
      meta.isActive === true ||
      meta.selected === true ||
      meta.isDefault === true ||
      meta.default === true ||
      meta.active === true
    );
  });

  if (selectedByPreference) return selectedByPreference;

  const normalizedFallback = fallbackStoreCode?.trim().toLowerCase();
  const normalizedExtraCandidate = extraCandidateStoreCode?.trim().toLowerCase();

  const preferredByCode = candidates.find((store) => {
    const code = store.storeCode.trim().toLowerCase();
    return code === normalizedFallback || code === normalizedExtraCandidate;
  });
  if (preferredByCode) return preferredByCode;

  return candidates[0];
}

const ROLE_ALIASES: Record<string, AppRole> = {
  "store assistant": "sa",
  sa: "sa",
  tax: "tax",
  "tax dept": "tax",
  admin: "admin",
};

export const ROLE_NAME_MAP: Record<string, AppRole> = {
  "Store Assistant": "sa",
  Tax: "tax",
  Admin: "admin",
  admin: "admin",
};

export function resolveAppRole(roleName: string): AppRole | null {
  return ROLE_ALIASES[roleName.trim().toLowerCase()] ?? null;
}

export function resolveAppRoleFromList(
  roles: { roleName: string }[]
): AppRole | null {
  const mapped = roles
    .map((r) => resolveAppRole(r.roleName))
    .filter((role): role is AppRole => role != null);
  if (mapped.includes("admin")) return "admin";
  return mapped[0] ?? null;
}

export function hasSaAccess(role: AppRole | null | undefined): boolean {
  return role === "sa" || role === "admin";
}

export function hasTaxAccess(role: AppRole | null | undefined): boolean {
  return role === "tax" || role === "admin";
}