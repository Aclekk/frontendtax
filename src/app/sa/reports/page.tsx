"use client";

import { InvoiceReport } from "@/features/reports/components/invoice-report";
import { SaShell } from "@/features/sa/components/sa-shell";

export default function SaReportsPage() {
  return (
    <SaShell activeHref="/sa/reports">
      <InvoiceReport audience="sa" />
    </SaShell>
  );
}
