"use client";

import { InvoiceReport } from "@/features/reports/components/invoice-report";
import { TaxDeptShell } from "@/features/tax-dept/components/tax-dept-shell";

export default function TaxDeptReportsPage() {
  return (
    <TaxDeptShell activeHref="/tax-dept/reports">
      <InvoiceReport audience="tax" />
    </TaxDeptShell>
  );
}
