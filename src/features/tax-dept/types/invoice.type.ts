export type InvoiceStatus =
  | "new"
  | "downloaded"
  | "fp_uploaded"
  | "sent"
  | "email_failed";

export type TaxDeptInvoice = {
  id: string;
  receiptNo: string;
  namaPembeli: string;
  negaraPembeli: string;
  tanggalFaktur: string;
  status: InvoiceStatus;
  fpFileName?: string;
  emailSentAt?: string;
  createdAt?: string;
};