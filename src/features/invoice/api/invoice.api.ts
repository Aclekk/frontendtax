import { api } from "@/shared/lib/axios";
import { mapBackendStatus } from "@/shared/lib/status-map";
import type { InvoiceRecord } from "@/features/sa/types/invoice.type";

type ApiEnvelope<T> = { success: boolean; message: string; data: T };
type PagedData<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
};

// FIX Bug 2: tambah storeCode & alamatPembeli — backend MapToResponse
// sudah mengembalikan ini, sebelumnya "hilang" karena tidak ada di type.
type InvoiceApiResponse = {
  id: number;
  baris: number | null;
  storeCode: string;
  noInvoice: string;
  tanggalFaktur: string;
  jenisFaktur: string;
  kodeTransaksi: string;
  keteranganTambahan: string | null;
  referensi: string | null;
  namaPembeli: string;
  negaraPembeli: string;
  nomorDokumenPembeli: string;
  alamatPembeli: string | null;
  emailPembeli: string;
  status: string;
  createdBy: string;
  createdAt: string;
  coreTaxFailureEmailSentAt: string | null;
};

// FIX Bug 1: payload create SEKARANG cuma 4 field, sesuai
// InvoiceService.CreateInvoiceAsync yang cuma baca 4 field ini.
// (17-field lama dibuang — itu sisa draft form sebelum keputusan final §7)
export type CreateInvoicePayload = {
  storeCode: string;
  storeEmail?: string;
  noInvoice: string;
  namaPembeli: string;
  emailPembeli: string;
  negaraPembeli: string;
  nomorDokumenPembeli: string;
  alamatPembeli?: string;
};

// NOTE: response backend tidak mengembalikan semua 17 field CoreTax
// (InvoiceResponse cuma sebagian kolom). Field yang tidak dikembalikan
// (mis. dokumenPendukung, capFasilitas, dst) diisi string kosong di FE —
// cukup untuk list & badge status, TIDAK dipakai untuk re-edit invoice.
function toInvoiceRecord(res: InvoiceApiResponse): InvoiceRecord {
  return {
    id: String(res.id),
    baris: res.baris ?? undefined,
    storeCode: res.storeCode,
    createdBy: res.createdBy,
    receiptNo: res.noInvoice,
    status: mapBackendStatus(res.status),
    createdAt: res.createdAt,
    coreTaxFailureEmailSentAt: res.coreTaxFailureEmailSentAt ?? undefined,
    tanggalFaktur: res.tanggalFaktur,
    jenisFaktur: res.jenisFaktur,
    kodeTransaksi: res.kodeTransaksi,
    keteranganTambahan: res.keteranganTambahan ?? "",
    dokumenPendukung: "",
    periodDokPendukung: "",
    referensi: res.referensi ?? "",
    capFasilitas: "",
    idTkuPenjual: "",
    npwpNikPembeli: "",
    jenisIdPembeli: "",
    negaraPembeli: res.negaraPembeli,
    nomorDokumenPembeli: res.nomorDokumenPembeli,
    namaPembeli: res.namaPembeli,
    // FIX Bug 2: sebelumnya hardcode "", padahal backend punya datanya
    alamatPembeli: res.alamatPembeli ?? "",
    emailPembeli: res.emailPembeli,
    idTkuPembeli: "",
  };
}

export async function apiCreateInvoice(
  payload: CreateInvoicePayload
): Promise<InvoiceRecord> {
  const res = await api.post<ApiEnvelope<InvoiceApiResponse>>(
    "/invoice",
    payload
  );
  return toInvoiceRecord(res.data.data);
}

export async function apiGetInvoices(): Promise<InvoiceRecord[]> {
  const res = await api.get<ApiEnvelope<PagedData<InvoiceApiResponse>>>(
    "/invoice",
    { params: { page: 1, pageSize: 100 } }
  );
  return res.data.data.items.map(toInvoiceRecord);
}

export async function apiDownloadInvoice(id: string): Promise<void> {
  const res = await api.post(`/invoice/${id}/download`, null, {
    responseType: "blob",
  });

  const blob = new Blob([res.data], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;

  const disposition = String(res.headers?.["content-disposition"] ?? "");
  const match = /filename\*?=(?:UTF-8''|")?([^";]+)/i.exec(disposition);
  const fallbackName = `invoice-${id}.xlsx`;
  link.download = match ? decodeURIComponent(match[1].replace(/"/g, "")) : fallbackName;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// BARU — untuk preview-cegid, dipakai di AddInvoiceDialog step 1
export type CegidPreviewItem = {
  namaBrg: string;
  hargaSatuan: string;
  jumlahBrgJasa: string;
  hargaTotal: string;
  totalDiskon: string;
  dpp: string;
  ppn: string;
};

export type CegidStoreOption = {
  storeCode: string;
  storeName: string;
  itemCount: number;
  subtotal: number;
};

export type CegidPreviewResponse = {
  storeCode: string;
  storeName: string;
  receiptNo: string;
  transDate: string;
  namaMember: string;
  email: string | null;
  address: string | null;
  availableStoreCodes?: string[];
  storeOptions?: CegidStoreOption[];
  itemCount: number;
  subtotal: number;
  alreadyExists: boolean;
  items: CegidPreviewItem[];
};

export async function apiPreviewCegid(
  storeCode: string,
  noInvoice: string
): Promise<CegidPreviewResponse> {
  const res = await api.get<ApiEnvelope<CegidPreviewResponse>>(
    "/invoice/preview-cegid",
    { params: { storeCode, noInvoice } }
  );
  return res.data.data;
}

export async function apiGetAllInvoices(): Promise<InvoiceRecord[]> {
  const pageSize = 100;
  const firstPage = await api.get<ApiEnvelope<PagedData<InvoiceApiResponse>>>(
    "/invoice",
    { params: { page: 1, pageSize } }
  );

  const firstData = firstPage.data.data;
  const pageCount = Math.ceil(firstData.totalCount / pageSize);
  const remainingPages = await Promise.all(
    Array.from({ length: Math.max(0, pageCount - 1) }, (_, index) =>
      api.get<ApiEnvelope<PagedData<InvoiceApiResponse>>>("/invoice", {
        params: { page: index + 2, pageSize },
      })
    )
  );

  return [
    ...firstData.items,
    ...remainingPages.flatMap((response) => response.data.data.items),
  ].map(toInvoiceRecord);
}
