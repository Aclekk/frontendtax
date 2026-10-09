import type { InvoiceStatus } from "@/features/sa/types/invoice.type";

// Backend (C# enum ToString()) pakai PascalCase, frontend pakai lowercase.
// Satu titik mapping — biar UI existing gak perlu tau soal casing backend.
const BACKEND_TO_FRONTEND: Record<string, InvoiceStatus> = {
  New: "new",
  Downloaded: "downloaded",
  FpUploaded: "fp_uploaded",
  Sent: "sent",
  EmailFailed: "email_failed",
};

export function mapBackendStatus(backendStatus: string): InvoiceStatus {
  return BACKEND_TO_FRONTEND[backendStatus] ?? "new";
}