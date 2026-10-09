export type InvoiceStatus =
  | "new"
  | "downloaded"
  | "fp_uploaded"
  | "sent"
  | "email_failed";

export type SyncedInvoiceCandidate = {
  receiptNo: string;
  date: string;
  site: string;
  touristName: string;
  country: string;
  subtotal: string;
};

export type CoreTaxInvoiceFormValues = {
  tanggalFaktur: string;
  jenisFaktur: string;
  kodeTransaksi: string;
  keteranganTambahan: string;
  dokumenPendukung: string;
  periodDokPendukung: string;
  referensi: string;
  capFasilitas: string;
  idTkuPenjual: string;
  npwpNikPembeli: string;
  jenisIdPembeli: string;
  negaraPembeli: string;
  nomorDokumenPembeli: string;
  namaPembeli: string;
  alamatPembeli: string;
  emailPembeli: string;
  idTkuPembeli: string;
};

export type InvoiceRecord = CoreTaxInvoiceFormValues & {
  id: string; // string di FE (dari Number(backendId)), biar konsisten sama kode lama
  baris?: number; // backend nullable, tidak dikirim saat create
  storeCode?: string;
  createdBy?: string;
  receiptNo: string; // di FE tetap "receiptNo", mapped dari noInvoice backend
  status: InvoiceStatus;
  createdAt?: string;
  fpFileName?: string;
  fpFileUrl?: string;
  nomorFakturPajak?: string;
  emailSentAt?: string;
  coreTaxFailureEmailSentAt?: string;
  emailFailedReason?: string; // baru — pesan error dari email_failed
};
