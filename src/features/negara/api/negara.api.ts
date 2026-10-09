import { api } from "@/shared/lib/axios";
import { NEGARA_LIST } from "@/shared/constants/negara.constant";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type Negara = {
  id: number;
  kode: string;
  nama: string;
  isActive?: boolean;
};

export async function apiGetNegara(): Promise<Negara[]> {
  try {
    const res = await api.get<ApiEnvelope<Negara[]>>("/negara");
    const data = Array.isArray(res.data?.data) ? res.data.data : [];
    return data.length
      ? data.map((item) => ({ ...item, id: item.id ?? 0, isActive: item.isActive ?? true }))
      : NEGARA_LIST.map((item, index) => ({
          id: index + 1,
          kode: item.kode,
          nama: item.nama,
          isActive: true,
        }));
  } catch {
    return NEGARA_LIST.map((item, index) => ({
      id: index + 1,
      kode: item.kode,
      nama: item.nama,
      isActive: true,
    }));
  }
}