"use client";

import * as React from "react";
import { UploadCloud, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import type { InvoiceRecord } from "@/features/invoice/types/invoice.type";

export function UploadFpDialog({
  invoice,
  open,
  onOpenChange,
  onSubmit,
}: {
  invoice: InvoiceRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (fileName: string) => void;
}) {
  const [file, setFile] = React.useState<File | null>(null);

  React.useEffect(() => {
    if (open) setFile(null);
  }, [open]);

  if (!invoice) return null;

  const handleSubmit = () => {
    if (!file) return;
    onSubmit(file.name);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Faktur Pajak</DialogTitle>
          <DialogDescription>
            Unggah dokumen FP hasil Core Tax untuk invoice{" "}
            <span className="font-mono text-foreground">
              {invoice.receiptNo}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border px-6 py-10 text-center transition-colors hover:border-primary hover:bg-secondary/40">
          <input
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <>
              <FileText className="size-6 text-primary" />
              <p className="text-sm font-medium text-foreground">
                {file.name}
              </p>
              <p className="text-xs text-muted-foreground">
                Klik untuk ganti file
              </p>
            </>
          ) : (
            <>
              <UploadCloud className="size-6 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                Klik untuk pilih file PDF
              </p>
              <p className="text-xs text-muted-foreground">
                Format PDF, maks. 5MB
              </p>
            </>
          )}
        </label>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button disabled={!file} onClick={handleSubmit}>
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}   