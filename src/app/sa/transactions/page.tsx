"use client";

import { useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { SaShell } from "@/features/sa/components/sa-shell";
import { TaxDeptShell } from "@/features/tax-dept/components/tax-dept-shell";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/shared/ui/table";
import { useRole } from "@/shared/lib/role-context";
import { useInvoices, useDownloadInvoice } from "@/features/invoice/hooks/useInvoices";
import { hasTaxAccess } from "@/features/auth/types/auth.type";
import { formatApiDateOnly } from "@/shared/lib/date-time";
import { NEGARA_LIST } from "@/shared/constants/negara.constant";

function formatCountryCode(value?: string | null) {
  const normalized = value?.trim() ?? "";
  if (!normalized) return "-";
  return NEGARA_LIST.find(
    (country) =>
      country.kode.toLowerCase() === normalized.toLowerCase() ||
      country.nama.toLowerCase() === normalized.toLowerCase()
  )?.kode ?? normalized.toUpperCase();
}

const STATUS_LABEL: Record<string, { label: string; variant: "outline" | "success" }> = {
  new: { label: "Belum Download", variant: "outline" },
  downloaded: { label: "Sudah Didownload", variant: "success" },
  fp_uploaded: { label: "FP Terupload", variant: "success" },
  sent: { label: "Selesai", variant: "success" },
  email_failed: { label: "Email Gagal", variant: "outline" },
};

type InvoiceFilter = "all" | "new" | "downloaded" | "fp_uploaded" | "sent" | "email_failed";

const STATUS_OPTIONS: { value: InvoiceFilter; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "new", label: "Belum Download" },
  { value: "downloaded", label: "Sudah Didownload" },
  { value: "fp_uploaded", label: "FP Terupload" },
  { value: "sent", label: "Selesai" },
  { value: "email_failed", label: "Email Gagal" },
];

export default function SaInvoicesPage() {
  const { role } = useRole();
  const { invoices, isLoading } = useInvoices();
  const downloadInvoice = useDownloadInvoice();
  const [statusFilter, setStatusFilter] = useState<InvoiceFilter>("all");
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);
  const [customerAddress, setCustomerAddress] = useState<string | null>(null);
  const [downloadingInvoiceIds, setDownloadingInvoiceIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const customerId = params.get("customerId");
    const nextCustomerName = params.get("customerName");
    const nextCustomerEmail = params.get("customerEmail");
    const nextCustomerAddress = params.get("customerAddress");
    const nextCustomerNationality = params.get("customerNationality");

    setCustomerName(nextCustomerName);
    setCustomerEmail(nextCustomerEmail);
    setCustomerAddress(nextCustomerAddress);

    if (customerId) {
      const url = new URL(window.location.href);
      url.searchParams.set("customerNationality", nextCustomerNationality ?? "");
      if (nextCustomerAddress) {
        url.searchParams.set("customerAddress", nextCustomerAddress);
      }
      window.history.replaceState({}, "", url.toString());
    }

  }, []);

  const canDownload = hasTaxAccess(role);
  const Shell = hasTaxAccess(role) ? TaxDeptShell : SaShell;
  const shouldHideInvoiceTable = role == null;

  const filteredInvoices =
    statusFilter === "all"
      ? invoices
      : invoices.filter((inv) => inv.status === statusFilter);

  const handleDownload = async (id: string) => {
    setDownloadingInvoiceIds((previous) => new Set([...previous, id]));
    try {
      await downloadInvoice.mutateAsync(id);
    } finally {
      setDownloadingInvoiceIds((previous) => {
        const next = new Set(previous);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <Shell activeHref="/sa/transactions">
      {!shouldHideInvoiceTable && (
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-foreground">Invoice</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Daftar invoice yang sudah dilengkapi datanya untuk diproses Tax Dept.
              </p>
              {(customerName || customerEmail || customerAddress) && (
                <div className="mt-3 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
                  Customer aktif: {customerName || "-"}
                  {customerEmail && <span className="ml-2 text-emerald-600">({customerEmail})</span>}
                  {customerAddress && <span className="ml-2 text-emerald-600">{customerAddress}</span>}
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 flex items-center justify-end">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Filter status</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as InvoiceFilter)}
                className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-primary"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-5 overflow-hidden rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Invoice</TableHead>
                  <TableHead>Tanggal Faktur</TableHead>
                  <TableHead>Jenis Faktur</TableHead>
                  <TableHead>Nama Pembeli</TableHead>
                  <TableHead>Negara</TableHead>
                  <TableHead>Status</TableHead>
                  {canDownload && <TableHead className="text-right">Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={canDownload ? 7 : 6} className="py-10 text-center text-sm text-muted-foreground">
                      Memuat data...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && filteredInvoices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={canDownload ? 7 : 6} className="py-10 text-center text-sm text-muted-foreground">
                      {statusFilter === "all"
                        ? "Belum ada invoice."
                        : "Tidak ada invoice pada filter ini."}
                    </TableCell>
                  </TableRow>
                )}
                {filteredInvoices.map((inv) => {
                  const statusInfo = STATUS_LABEL[inv.status];
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-xs">{inv.receiptNo}</TableCell>
                      <TableCell className="text-muted-foreground">{formatApiDateOnly(inv.tanggalFaktur)}</TableCell>
                      <TableCell>{inv.jenisFaktur}</TableCell>
                      <TableCell>{customerName || inv.namaPembeli || "-"}</TableCell>
                      <TableCell className="text-muted-foreground">{formatCountryCode(inv.negaraPembeli)}</TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      </TableCell>
                      {canDownload && (
                        <TableCell className="text-right">
                          {inv.status === "new" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownload(inv.id)}
                              disabled={downloadingInvoiceIds.has(inv.id)}
                            >
                              {downloadingInvoiceIds.has(inv.id) ? (
                                <Loader2 className="animate-spin" />
                              ) : (
                                <Download />
                              )}
                              {downloadingInvoiceIds.has(inv.id) ? "Mengunduh..." : "Download"}
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}

    </Shell>
  );
}
