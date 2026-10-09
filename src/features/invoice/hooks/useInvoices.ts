"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiCreateInvoice,
  apiGetInvoices,
  apiDownloadInvoice,
  type CreateInvoicePayload,
} from "../api/invoice.api";
import {
  apiUploadFakturPajak,
  apiGetFakturPajakList,
  apiResendEmail,
  apiSendCoreTaxFailureEmail,
  mergeFakturPajakIntoInvoice,
} from "../api/faktur-pajak.api";
import type { InvoiceRecord } from "@/features/sa/types/invoice.type";

const INVOICES_KEY = ["invoices"];
const FAKTUR_PAJAK_KEY = ["faktur-pajak"];

function sortInvoicesByOldestFirst<T extends { createdAt?: string; tanggalFaktur?: string }>(items: T[]) {
  return [...items].sort((a, b) => {
    const aDate = a.createdAt ?? a.tanggalFaktur ?? "1970-01-01";
    const bDate = b.createdAt ?? b.tanggalFaktur ?? "1970-01-01";
    return new Date(aDate).getTime() - new Date(bDate).getTime();
  });
}

export function useInvoices() {
  const invoicesQuery = useQuery({
    queryKey: INVOICES_KEY,
    queryFn: apiGetInvoices,
  });
  const fpQuery = useQuery({
    queryKey: FAKTUR_PAJAK_KEY,
    queryFn: apiGetFakturPajakList,
  });

  const invoices = invoicesQuery.data ?? [];
  const fpList = fpQuery.data ?? [];
  const merged = sortInvoicesByOldestFirst(
    mergeFakturPajakIntoInvoice(invoices, fpList)
  );

  // fakturPajakId dibutuhkan buat resend — dari fpList, dicocokkan by invoiceId
  const fakturPajakIdByInvoiceId = new Map(
    fpList.map((fp) => [String(fp.invoiceId), fp.id])
  );

  return {
    invoices: merged,
    fakturPajakIdByInvoiceId,
    isLoading: invoicesQuery.isPending || fpQuery.isPending,
  };
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateInvoicePayload) => apiCreateInvoice(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVOICES_KEY });
    },
  });
}

export function useDownloadInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDownloadInvoice(id),
    onSuccess: async (_data, id) => {
      // File baru diberikan ketika backend sudah berhasil menyimpan status.
      // Perbarui baris langsung agar pengguna tidak perlu refresh manual.
      queryClient.setQueryData<InvoiceRecord[]>(INVOICES_KEY, (current) =>
        current?.map((invoice) =>
          invoice.id === id ? { ...invoice, status: "downloaded" } : invoice
        )
      );

      // Sinkronkan kedua sumber data yang dipakai oleh halaman invoice.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: INVOICES_KEY }),
        queryClient.invalidateQueries({ queryKey: FAKTUR_PAJAK_KEY }),
      ]);
    },
    onError: (error) => {
      console.error("Download failed:", error);
    },
  });
}

export function useUploadFakturPajak() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      invoiceId,
      file,
      nomorFakturPajak = "",
    }: {
      invoiceId: string;
      file: File;
      nomorFakturPajak?: string;
    }) => apiUploadFakturPajak(invoiceId, file, nomorFakturPajak),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVOICES_KEY });
      queryClient.invalidateQueries({ queryKey: FAKTUR_PAJAK_KEY });
    },
  });
}

export function useResendEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fakturPajakId: number) => apiResendEmail(fakturPajakId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVOICES_KEY });
      queryClient.invalidateQueries({ queryKey: FAKTUR_PAJAK_KEY });
    },
  });
}

export function useSendCoreTaxFailureEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invoiceId: string) => apiSendCoreTaxFailureEmail(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVOICES_KEY });
      queryClient.invalidateQueries({ queryKey: FAKTUR_PAJAK_KEY });
    },
  });
}
