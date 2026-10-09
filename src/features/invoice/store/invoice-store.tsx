"use client";

import * as React from "react";
import type { InvoiceRecord } from "@/features/sa/types/invoice.type";

// NOTE: state sementara di client (belum ada API invoice/faktur-pajak).
// Setelah backend endpoint tersedia, provider ini WAJIB diganti TanStack Query
// sesuai .ai/rules.md (features/invoice/hooks/useInvoices.ts).

const EMPTY_CORE_TAX_FIELDS = {
  jenisFaktur: "Faktur Pajak",
  kodeTransaksi: "",
  keteranganTambahan: "",
  dokumenPendukung: "",
  periodDokPendukung: "",
  referensi: "",
  capFasilitas: "",
  idTkuPenjual: "",
  npwpNikPembeli: "",
  jenisIdPembeli: "",
  nomorDokumenPembeli: "",
  alamatPembeli: "",
  emailPembeli: "",
  idTkuPembeli: "",
};

const INITIAL_INVOICES: InvoiceRecord[] = [
  {
    id: "1",
    baris: 1,
    receiptNo: "CGD-BALI-001234",
    status: "new",
    tanggalFaktur: "2026-08-08",
    namaPembeli: "Emma Wilson",
    negaraPembeli: "Australia",
    ...EMPTY_CORE_TAX_FIELDS,
  },
  {
    id: "2",
    baris: 2,
    receiptNo: "CGD-JKT-009821",
    status: "downloaded",
    tanggalFaktur: "2026-08-09",
    namaPembeli: "Liam Chen",
    negaraPembeli: "Singapore",
    ...EMPTY_CORE_TAX_FIELDS,
  },
  {
    id: "3",
    baris: 3,
    receiptNo: "CGD-JOG-004410",
    status: "fp_uploaded",
    tanggalFaktur: "2026-08-09",
    namaPembeli: "Sophie Dubois",
    negaraPembeli: "France",
    fpFileName: "FP-CGD-JOG-004410.pdf",
    ...EMPTY_CORE_TAX_FIELDS,
  },
  {
    id: "4",
    baris: 4,
    receiptNo: "CGD-MDN-002210",
    status: "sent",
    tanggalFaktur: "2026-08-07",
    namaPembeli: "Hans Mueller",
    negaraPembeli: "Germany",
    fpFileName: "FP-CGD-MDN-002210.pdf",
    emailSentAt: "07 Agu 2026, 16.40",
    ...EMPTY_CORE_TAX_FIELDS,
  },
];

type InvoiceStoreValue = {
  invoices: InvoiceRecord[];
  addInvoice: (record: InvoiceRecord) => void;
  downloadInvoices: (ids: string[]) => void;
  uploadFp: (
    id: string,
    payload: { fileName: string; fileUrl: string; nomorFakturPajak: string }
  ) => void;
  sendEmail: (id: string) => void;
  resendEmail: (id: string) => void;
};

const InvoiceStoreContext = React.createContext<InvoiceStoreValue | undefined>(undefined);

export function InvoiceStoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [invoices, setInvoices] =
    React.useState<InvoiceRecord[]>(INITIAL_INVOICES);

  const addInvoice = React.useCallback((record: InvoiceRecord) => {
    setInvoices((prev) => [record, ...prev]);
  }, []);

  const downloadInvoices = React.useCallback((ids: string[]) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        ids.includes(inv.id) && inv.status === "new"
          ? { ...inv, status: "downloaded" as const }
          : inv
      )
    );
  }, []);

  const uploadFp = React.useCallback(
  (
    id: string,
    payload: { fileName: string; fileUrl: string; nomorFakturPajak: string }
  ) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === id
          ? {
              ...inv,
              status: "fp_uploaded" as const,
              fpFileName: payload.fileName,
              fpFileUrl: payload.fileUrl,
              nomorFakturPajak: payload.nomorFakturPajak,
            }
          : inv
      )
    );
  },
  []
);

const sendEmail = React.useCallback((id: string) => {
  setInvoices((prev) =>
    prev.map((inv) =>
      inv.id === id
        ? {
            ...inv,
            status: "sent" as const,
            emailSentAt: new Date().toLocaleString("id-ID"),
          }
        : inv
    )
  );
}, []);

// Kirim ulang email TANPA mengubah status (invoice tetap "sent").
const resendEmail = React.useCallback((id: string) => {
  setInvoices((prev) =>
    prev.map((inv) =>
      inv.id === id
        ? { ...inv, emailSentAt: new Date().toLocaleString("id-ID") }
        : inv
    )
  );
}, []);

const value = React.useMemo(
  () => ({
    invoices,
    addInvoice,
    downloadInvoices,
    uploadFp,
    sendEmail,
    resendEmail,
  }),
  [invoices, addInvoice, downloadInvoices, uploadFp, sendEmail, resendEmail]
);

  return (
    <InvoiceStoreContext.Provider value={value}>
      {children}
    </InvoiceStoreContext.Provider>
  );
}

export function useInvoiceStore() {
  const ctx = React.useContext(InvoiceStoreContext);
  if (!ctx)
    throw new Error(
      "useInvoiceStore must be used within InvoiceStoreProvider"
    );
  return ctx;
}