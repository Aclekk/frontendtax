import { api } from "@/shared/lib/axios";

type ApiEnvelope<T> = { success: boolean; message: string; data: T };
type PagedData<T> = {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type StoreApiResponse = {
  id: number;
  storeId: string;
  storeName: string;
  city: string;
  latitude: number;
  longitude: number;
  isMigrate: boolean;
  status: number;
  lastSync: string | null;
};

export type StoreListResult = {
  items: StoreApiResponse[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function apiGetStores(options?: {
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<StoreListResult> {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 5;
  const res = await api.get<ApiEnvelope<PagedData<StoreApiResponse>>>(
    "/Store",
    {
      params: {
        search: options?.search || undefined,
        page,
        pageSize,
        isTaxRefund: true,
      },
    }
  );
  const data = res.data.data;
  return {
    items: data.items ?? [],
    totalCount: data.totalCount ?? 0,
    page: data.page ?? page,
    pageSize: data.pageSize ?? pageSize,
    totalPages: data.totalPages ?? 0,
  };
}