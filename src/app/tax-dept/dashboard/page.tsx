"use client";
import { Mail, AlertCircle, Clock, X } from "lucide-react";
import { useState } from "react";
import { TaxDeptShell } from "@/features/tax-dept/components/tax-dept-shell";
import { UploadFpDialog } from "@/features/tax-dept/components/upload-fp-dialog";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/shared/ui/table";
import { useInvoices, useResendEmail, useSendCoreTaxFailureEmail } from "@/features/invoice/hooks/useInvoices";
import type { InvoiceRecord, InvoiceStatus } from "@/features/sa/types/invoice.type";
import { formatApiDateTime } from "@/shared/lib/date-time";
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

const TABS: { value: InvoiceStatus; label: string }[] = [
  { value: "new", label: "New Invoice" },
  { value: "downloaded", label: "Awaiting FP Upload" },
  { value: "sent", label: "Completed" },
  { value: "email_failed", label: "Email Failed" },
];

export default function TaxDeptDashboardPage() {
  const { invoices, fakturPajakIdByInvoiceId, isLoading } = useInvoices();
  const resendEmail = useResendEmail();
  const sendCoreTaxFailureEmail = useSendCoreTaxFailureEmail();
  const [activeTab, setActiveTab] = useState<InvoiceStatus>("downloaded");
  const [uploadTarget, setUploadTarget] = useState<InvoiceRecord | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [showNewInvoiceAlert, setShowNewInvoiceAlert] = useState(true);
  const [sendingCoreTaxFailureEmail, setSendingCoreTaxFailureEmail] = useState<Set<string>>(new Set());
  const newInvoices = invoices.filter((inv) => inv.status === "new");

  const rowsForTab = invoices.filter((inv) => inv.status === activeTab);

  const handleOpenUpload = (invoice: InvoiceRecord) => {
    setUploadTarget(invoice);
    setUploadOpen(true);
  };

  const handleResend = (invoiceId: string) => {
    const fpId = fakturPajakIdByInvoiceId.get(invoiceId);
    if (fpId) resendEmail.mutate(fpId);
  };

  return (
    <TaxDeptShell activeHref="/tax-dept/dashboard">
      {showNewInvoiceAlert && newInvoices.length > 0 && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
    <div className="relative w-full max-w-md rounded-2xl bg-background p-6 shadow-2xl border border-border">

      <button
        type="button"
        onClick={() => setShowNewInvoiceAlert(false)}
        className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:bg-muted"
      >
        <X className="size-4" />
      </button>

      <div className="flex items-start gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-yellow-100 text-yellow-700">
          <AlertCircle className="size-6" />
        </div>

        <div>
          <h2 className="text-lg font-semibold">
        New invoice received
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
        There are{" "}
            <span className="font-semibold text-foreground">
          {newInvoices.length} invoice(s)
            </span>{" "}
        waiting to be processed by the Tax Dept.
          </p>

          <div className="mt-4 rounded-lg bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            <div className="flex items-center gap-2 font-medium">
              <Clock className="size-4" />
          Needs prompt processing
            </div>

            <p className="mt-1 text-xs">
          Please review the new invoice list and process the items promptly.
            </p>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowNewInvoiceAlert(false)}
            >
          Later
            </Button>

            <Button
              onClick={() => {
                setShowNewInvoiceAlert(false);
                setActiveTab("new");
              }}
            >
          View invoice
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
      <div className="space-y-1">
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-foreground sm:text-2xl">Tax Invoice</h1>
        <p className="text-sm text-muted-foreground">
          Monitor the status of invoices currently being processed by the Tax Dept.
        </p>
      </div>

      <Tabs className="mt-5 space-y-4" value={activeTab} onValueChange={(v) => setActiveTab(v as InvoiceStatus)}>
        <TabsList className="flex w-full flex-wrap justify-start gap-2 sm:flex-nowrap">
          {TABS.map((tab) => {
            const count = invoices.filter((i) => i.status === tab.value).length;
            return (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
                <span className="ml-1 rounded-full bg-muted-foreground/15 px-1.5 text-xs">{count}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
           {tab.value === "email_failed" && rowsForTab.length > 0 && (
             <div className="mb-3 flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
               <AlertCircle className="size-4" />
               There are {rowsForTab.length} invoice(s) that failed to send automatically — resend them manually below.
             </div>
           )}
           <div className="overflow-x-auto rounded-xl border border-border">
             <Table className="min-w-[980px]">
               <TableHeader>
                 <TableRow>
                   <TableHead>No. Invoice</TableHead>
                   <TableHead>Buyer Name</TableHead>
                   <TableHead>Country</TableHead>
                   {(tab.value === "downloaded" || tab.value === "sent") && <TableHead>Email</TableHead>}
                   <TableHead>Invoice Date</TableHead>
                   <TableHead>SA Upload Time (Local)</TableHead>
                   <TableHead>Status</TableHead>
                   {tab.value !== "new" && <TableHead className="text-right">Action</TableHead>}
                 </TableRow>
               </TableHeader>

               <TableBody>
                 {isLoading ? (
                   <TableRow>
                     <TableCell
                       colSpan={tab.value === "sent" ? 8 : tab.value === "email_failed" ? 7 : tab.value === "downloaded" ? 7 : 5}
                       className="py-10 text-center text-sm text-muted-foreground"
                     >
                       Loading data...
                     </TableCell>
                   </TableRow>
                 ) : rowsForTab.length === 0 ? (
                   <TableRow>
                     <TableCell
                       colSpan={tab.value === "sent" ? 8 : tab.value === "email_failed" ? 7 : tab.value === "downloaded" ? 7 : 5}
                       className="py-10 text-center text-sm text-muted-foreground"
                     >
                       No invoices in this stage.
                     </TableCell>
                   </TableRow>
                 ) : (
                   rowsForTab.map((inv) => (
                     <TableRow key={inv.id}>
                       <TableCell className="font-mono text-xs">{inv.receiptNo}</TableCell>
                       <TableCell>{inv.namaPembeli || "-"}</TableCell>
                       <TableCell className="text-muted-foreground">{formatCountryCode(inv.negaraPembeli)}</TableCell>
                       {(tab.value === "downloaded" || tab.value === "sent") && (
                         <TableCell>
                           <span className={inv.emailPembeli ? "text-sm" : "text-sm text-destructive"}>
                             {inv.emailPembeli || "Email belum tersedia"}
                           </span>
                         </TableCell>
                       )}
                       <TableCell className="text-muted-foreground">{formatApiDateOnly(inv.tanggalFaktur)}</TableCell>
                       <TableCell className="text-muted-foreground">{formatApiDateTime(inv.createdAt)}</TableCell>
                       <TableCell>
                         {tab.value === "new" && (
                           <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
                             Needs processing
                           </Badge>
                         )}

                         {tab.value === "downloaded" && (
                           <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                             Awaiting FP upload
                           </Badge>
                         )}

                         {tab.value === "sent" && (
                           <Badge variant="success">Completed</Badge>
                         )}

                         {tab.value === "email_failed" && (
                           <Badge variant="destructive">Email failed</Badge>
                         )}
                       </TableCell>

                       {tab.value !== "new" && (
                         <TableCell className="text-right">
                           {tab.value === "downloaded" && (
                             <div className="flex justify-end gap-2">
                               <Button size="sm" onClick={() => handleOpenUpload(inv)}>
                                 Upload FP
                               </Button>
                               <Button
                                 size="sm"
                                 variant="outline"
                                 onClick={() => {
                                   setSendingCoreTaxFailureEmail((previous) => new Set(previous).add(inv.id));
                                   sendCoreTaxFailureEmail.mutate(inv.id, {
                                     onSettled: () =>
                                       setSendingCoreTaxFailureEmail((previous) => {
                                         const next = new Set(previous);
                                         next.delete(inv.id);
                                         return next;
                                       }),
                                   });
                                 }}
                                 disabled={
                                   sendingCoreTaxFailureEmail.has(inv.id) ||
                                   Boolean(inv.coreTaxFailureEmailSentAt)
                                 }
                               >
                                 {sendingCoreTaxFailureEmail.has(inv.id)
                                   ? "Sending..."
                                   : inv.coreTaxFailureEmailSentAt
                                     ? "Email Sent"
                                     : "Send Email (if it fails)"}
                               </Button>
                             </div>
                           )}

                           {tab.value === "sent" && (
                             <Button
                               size="sm"
                               variant="outline"
                               onClick={() => handleResend(inv.id)}
                               disabled={
                                 resendEmail.isPending ||
                                 !fakturPajakIdByInvoiceId.has(inv.id)
                               }
                             >
                               <Mail />
                               {resendEmail.isPending ? "Resending..." : "Resend Email"}
                             </Button>
                           )}

                           {tab.value === "email_failed" && (
                             <Button size="sm" onClick={() => handleResend(inv.id)} disabled={resendEmail.isPending}>
                               <Mail />
                               {resendEmail.isPending ? "Resending..." : "Resend Email"}
                             </Button>
                           )}
                         </TableCell>
                       )}
                     </TableRow>
                   ))
                 )}
               </TableBody>
             </Table>
           </div>
          </TabsContent>
        ))}
      </Tabs>

      <UploadFpDialog invoice={uploadTarget} open={uploadOpen} onOpenChange={setUploadOpen} />
    </TaxDeptShell>
  );
}
