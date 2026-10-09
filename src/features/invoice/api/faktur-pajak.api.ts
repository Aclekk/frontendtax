import { api } from "@/shared/lib/axios";
import type { InvoiceRecord } from "@/features/sa/types/invoice.type";

type ApiEnvelope<T> = { success: boolean; message: string; data: T };

type FakturPajakApiResponse = {
  id: number;
  invoiceId: number;
  noInvoice: string;
  namaPembeli: string;
  negaraPembeli: string;
  nomorFakturPajak: string;
  fileName: string;
  uploadedBy: string;
  uploadedAt: string;
  emailSentAt: string | null;
  coreTaxFailureEmailSentAt: string | null;
  invoiceStatus: string;
};

export async function apiUploadFakturPajak(
  invoiceId: string,
  file: File,
  _nomorFakturPajak = ""
): Promise<FakturPajakApiResponse> {
  const formData = new FormData();
  formData.append("File", file);

  // Nomor Faktur Pajak tidak lagi diisi manual dari frontend.
  // Jika ada nilai legacy dari caller lama, jangan dikirim agar backend
  // tidak memvalidasi field required secara tidak sesuai.

  const res = await api.post<ApiEnvelope<FakturPajakApiResponse>>(
    `/faktur-pajak/${invoiceId}/upload`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data.data;
}

export async function apiGetFakturPajakList(): Promise<FakturPajakApiResponse[]> {
  const res = await api.get<ApiEnvelope<FakturPajakApiResponse[]>>(
    "/faktur-pajak"
  );

  return res.data.data;
}

export async function apiResendEmail(
  fakturPajakId: number
): Promise<FakturPajakApiResponse> {
  const res = await api.post<ApiEnvelope<FakturPajakApiResponse>>(
    `/faktur-pajak/${fakturPajakId}/resend-email`
  );
  return res.data.data;
}

export async function apiSendCoreTaxFailureEmail(invoiceId: string): Promise<void> {
  await api.post(`/faktur-pajak/${invoiceId}/coretax-failed-email`);
}

// Helper: gabung data invoice (status/badge) + data faktur pajak (nomor FP, file)
// jadi 1 InvoiceRecord, dipakai di tab "Perlu Kirim Email"/"Selesai"/"Gagal Kirim".
export function mergeFakturPajakIntoInvoice(
  invoices: InvoiceRecord[],
  fpList: FakturPajakApiResponse[]
): InvoiceRecord[] {
  const fpByInvoiceId = new Map(fpList.map((fp) => [String(fp.invoiceId), fp]));
  return invoices.map((inv) => {
    const fp = fpByInvoiceId.get(inv.id);
    if (!fp) return inv;
    return {
      ...inv,
      // Status invoice berasal dari endpoint /invoice sebagai sumber utama.
      // Data faktur pajak dapat masih tersimpan di cache ketika status invoice
      // baru saja berubah, sehingga tidak boleh menimpa status terbaru ini.
      fpFileName: fp.fileName,
      nomorFakturPajak: fp.nomorFakturPajak,
      emailSentAt: fp.emailSentAt ?? undefined,
      coreTaxFailureEmailSentAt:
        fp.coreTaxFailureEmailSentAt ?? inv.coreTaxFailureEmailSentAt,
      // fakturPajakId dipakai buat resend — disisipkan lewat cast, lihat hook
    };
  });
}
