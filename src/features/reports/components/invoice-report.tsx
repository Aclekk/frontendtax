"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileSpreadsheet, Loader2, Search } from "lucide-react";
import { apiGetAllInvoices } from "@/features/invoice/api/invoice.api";
import type { InvoiceStatus } from "@/features/sa/types/invoice.type";
import { formatApiDateOnly, formatApiDateTime } from "@/shared/lib/date-time";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";

const STATUS_OPTIONS: { value: "all" | InvoiceStatus; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "new", label: "Belum Download" },
  { value: "downloaded", label: "Sudah Didownload" },
  { value: "fp_uploaded", label: "FP Terupload" },
  { value: "sent", label: "Selesai" },
  { value: "email_failed", label: "Email Gagal" },
];

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  new: "Belum Download",
  downloaded: "Sudah Didownload",
  fp_uploaded: "FP Terupload",
  sent: "Selesai",
  email_failed: "Email Gagal",
};

const STATUS_VARIANT: Record<InvoiceStatus, "default" | "secondary" | "success" | "destructive" | "outline"> = {
  new: "secondary",
  downloaded: "default",
  fp_uploaded: "outline",
  sent: "success",
  email_failed: "destructive",
};

function getReportDate(createdAt?: string, invoiceDate?: string) {
  const value = createdAt || invoiceDate;
  if (!value) return null;
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function escapeCsvCell(value: unknown) {
  let text = String(value ?? "");
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function localDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function InvoiceReport({ audience }: { audience: "sa" | "tax" }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<"all" | InvoiceStatus>("all");
  const [storeCode, setStoreCode] = useState("all");
  const [search, setSearch] = useState("");

  const { data: invoices = [], isPending, isError, refetch } = useQuery({
    queryKey: ["invoice-report"],
    queryFn: apiGetAllInvoices,
  });

  const stores = useMemo(
    () => Array.from(new Set(invoices.map((invoice) => invoice.storeCode).filter(Boolean))).sort(),
    [invoices]
  );

  const filteredInvoices = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const end = endDate ? new Date(`${endDate}T23:59:59.999`) : null;

    return invoices.filter((invoice) => {
      const reportDate = getReportDate(invoice.createdAt, invoice.tanggalFaktur);
      const matchesDate = (!start || (reportDate && reportDate >= start)) && (!end || (reportDate && reportDate <= end));
      const matchesStatus = status === "all" || invoice.status === status;
      const matchesStore = storeCode === "all" || invoice.storeCode === storeCode;
      const haystack = [invoice.receiptNo, invoice.namaPembeli, invoice.emailPembeli, invoice.nomorDokumenPembeli]
        .join(" ")
        .toLowerCase();
      return matchesDate && matchesStatus && matchesStore && (!normalizedSearch || haystack.includes(normalizedSearch));
    });
  }, [endDate, invoices, search, startDate, status, storeCode]);

  const summary = useMemo(
    () => ({
      total: filteredInvoices.length,
      processing: filteredInvoices.filter((invoice) => ["new", "downloaded", "fp_uploaded"].includes(invoice.status)).length,
      completed: filteredInvoices.filter((invoice) => invoice.status === "sent").length,
      failed: filteredInvoices.filter((invoice) => invoice.status === "email_failed").length,
    }),
    [filteredInvoices]
  );

  const resetFilters = () => {
    setStartDate("");
    setEndDate("");
    setStatus("all");
    setStoreCode("all");
    setSearch("");
  };

  const exportCsv = () => {
    const headers = [
      "Invoice Number", "Customer", "Passport Number", "Country", "Email", "Store", "Status", "Invoice Date", "Submitted At", "Created By",
    ];
    const rows = filteredInvoices.map((invoice) => [
      invoice.receiptNo,
      invoice.namaPembeli,
      invoice.nomorDokumenPembeli,
      invoice.negaraPembeli,
      invoice.emailPembeli,
      invoice.storeCode || "-",
      STATUS_LABEL[invoice.status],
      formatApiDateOnly(invoice.tanggalFaktur),
      formatApiDateTime(invoice.createdAt),
      invoice.createdBy || "-",
    ]);
    const csv = [headers, ...rows].map((row) => row.map(escapeCsvCell).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tax-refund-report-${startDate || "all"}-${endDate || localDateInput(new Date())}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">{audience === "sa" ? "Sales Assistant" : "Tax Department"}</p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-foreground">Tax Refund Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">Filter, review, and export invoice submission data.</p>
        </div>
        <Button onClick={exportCsv} disabled={isPending || filteredInvoices.length === 0}>
          <Download /> Export CSV
        </Button>
      </div>

      <Card>
        <CardContent className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-5">
          <label className="space-y-1.5 text-sm font-medium">
            <span>Start date</span>
            <Input type="date" value={startDate} max={endDate || undefined} onChange={(event) => setStartDate(event.target.value)} />
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            <span>End date</span>
            <Input type="date" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} />
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            <span>Status</span>
            <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={status} onChange={(event) => setStatus(event.target.value as "all" | InvoiceStatus)}>
              {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            <span>Store</span>
            <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={storeCode} onChange={(event) => setStoreCode(event.target.value)}>
              <option value="all">All stores</option>
              {stores.map((store) => <option key={store} value={store}>{store}</option>)}
            </select>
          </label>
          <div className="flex items-end">
            <Button type="button" variant="outline" className="w-full" onClick={resetFilters}>Reset filters</Button>
          </div>
          <label className="relative sm:col-span-2 xl:col-span-5">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search invoice, customer, email, or passport number..." />
          </label>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total submissions", summary.total, "text-foreground"],
          ["In process", summary.processing, "text-blue-700"],
          ["Completed", summary.completed, "text-green-700"],
          ["Email failed", summary.failed, "text-red-700"],
        ].map(([label, value, color]) => (
          <Card key={String(label)}><CardContent className="p-5"><p className="text-sm text-muted-foreground">{label}</p><p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p></CardContent></Card>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-background">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold"><FileSpreadsheet className="size-4" /> Report results</div>
          <span className="text-xs text-muted-foreground">{filteredInvoices.length} record(s)</span>
        </div>
        <div className="overflow-x-auto">
          <Table className="min-w-[1050px]">
            <TableHeader><TableRow><TableHead>Invoice</TableHead><TableHead>Customer</TableHead><TableHead>Passport</TableHead><TableHead>Country</TableHead><TableHead>Store</TableHead><TableHead>Status</TableHead><TableHead>Invoice Date</TableHead><TableHead>Submitted At</TableHead></TableRow></TableHeader>
            <TableBody>
              {isPending && <TableRow><TableCell colSpan={8} className="py-12 text-center"><Loader2 className="mx-auto size-5 animate-spin" /><span className="mt-2 block text-sm text-muted-foreground">Loading report...</span></TableCell></TableRow>}
              {isError && <TableRow><TableCell colSpan={8} className="py-12 text-center"><p className="text-sm text-destructive">Unable to load report data.</p><Button className="mt-3" size="sm" variant="outline" onClick={() => refetch()}>Try again</Button></TableCell></TableRow>}
              {!isPending && !isError && filteredInvoices.length === 0 && <TableRow><TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">No data matches the selected filters.</TableCell></TableRow>}
              {!isPending && !isError && filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono text-xs">{invoice.receiptNo}</TableCell>
                  <TableCell><p className="font-medium">{invoice.namaPembeli || "-"}</p><p className="text-xs text-muted-foreground">{invoice.emailPembeli || "-"}</p></TableCell>
                  <TableCell className="font-mono text-xs">{invoice.nomorDokumenPembeli || "-"}</TableCell>
                  <TableCell>{invoice.negaraPembeli || "-"}</TableCell>
                  <TableCell>{invoice.storeCode || "-"}</TableCell>
                  <TableCell><Badge variant={STATUS_VARIANT[invoice.status]}>{STATUS_LABEL[invoice.status]}</Badge></TableCell>
                  <TableCell>{formatApiDateOnly(invoice.tanggalFaktur)}</TableCell>
                  <TableCell>{formatApiDateTime(invoice.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
