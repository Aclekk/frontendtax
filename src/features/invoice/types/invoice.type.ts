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

export type InvoiceRecord = {
  id: string;
  baris: number;

  // Identitas transaksi
  receiptNo: string;
  storeCode?: string;
  noInvoice?: string;

  // Data faktur
  tanggalFaktur: string;
  jenisFaktur: string;
  kodeTransaksi: string;
  keteranganTambahan: string;
  dokumenPendukung: string;
  periodDokPendukung: string;
  referensi: string;
  capFasilitas: string;
  idTkuPenjual: string;

  // Data pembeli
  npwpNikPembeli: string;
  jenisIdPembeli: string;
  negaraPembeli: string;
  nomorDokumenPembeli: string;
  namaPembeli: string;
  alamatPembeli: string;
  emailPembeli: string;
  idTkuPembeli: string;

  // Status & faktur pajak
  status: InvoiceStatus;
  fpFileName?: string;
  fpFileUrl?: string;
  nomorFakturPajak?: string;
  emailSentAt?: string;
  emailFailedReason?: string;
};