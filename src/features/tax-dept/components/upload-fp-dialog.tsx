"use client";

import * as React from "react";
import { UploadCloud, FileText, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { useUploadFakturPajak } from "@/features/invoice/hooks/useInvoices";
import type { InvoiceRecord } from "@/features/sa/types/invoice.type";

type Step = "select" | "preview" | "confirm";

export function UploadFpDialog({
  invoice,
  open,
  onOpenChange,
}: {
  invoice: InvoiceRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [step, setStep] = React.useState<Step>("select");
  const [file, setFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const uploadFp = useUploadFakturPajak();

  React.useEffect(() => {
    if (open) {
      setStep("select");
      setFile(null);
      setPreviewUrl(null);
    }
  }, [open]);

  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (!invoice) return null;

  const handleFileSelected = (selected: File | null) => {
    if (!selected) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setStep("preview");
  };

  const handleNotCorrect = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setStep("select");
  };

  const handleFinalSubmit = async () => {
    if (!file) return;
    try {
      await uploadFp.mutateAsync({
        invoiceId: invoice.id,
        file,
      });
      onOpenChange(false);
    } catch {
      // error ditampilkan lewat uploadFp.isError di bawah
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={step === "preview" ? "sm:max-w-2xl" : undefined}>
        <DialogHeader>
          <DialogTitle>Upload Faktur Pajak</DialogTitle>
          <DialogDescription>
            Invoice <span className="font-mono text-foreground">{invoice.receiptNo}</span>
            {" — "}
            {invoice.namaPembeli}
          </DialogDescription>
        </DialogHeader>

        {step === "select" && (
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border px-6 py-10 text-center transition-colors hover:border-primary hover:bg-secondary/40">
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => handleFileSelected(e.target.files?.[0] ?? null)}
            />
            <UploadCloud className="size-6 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Klik untuk pilih file PDF</p>
            <p className="text-xs text-muted-foreground">Format PDF, maks. 5MB</p>
          </label>
        )}

        {step === "preview" && previewUrl && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2 text-sm">
              <FileText className="size-4 text-primary" />
              <span className="font-medium">{file?.name}</span>
            </div>
            <iframe src={previewUrl} title="Preview FP" className="h-[420px] w-full rounded-lg border border-border" />
            <p className="text-sm text-muted-foreground">
              Pastikan dokumen di atas sudah sesuai sebelum melanjutkan.
            </p>
          </div>
        )}

        {step === "confirm" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2 text-sm">
              <CheckCircle2 className="size-4 text-green-600" />
              <span className="font-medium">{file?.name}</span>
              <span className="text-muted-foreground">— file dikonfirmasi benar</span>
            </div>
            {uploadFp.isError && (
              <p className="text-sm text-destructive">
                Gagal upload. Pastikan invoice sudah didownload dan belum pernah diupload FP.
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          {step === "select" && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          )}
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={handleNotCorrect}>Belum Benar, Upload Ulang</Button>
              <Button onClick={() => setStep("confirm")}>Ya, File Sudah Benar</Button>
            </>
          )}
          {step === "confirm" && (
            <>
              <Button variant="outline" onClick={() => setStep("preview")}>Kembali</Button>
              <Button disabled={uploadFp.isPending} onClick={handleFinalSubmit}>
                {uploadFp.isPending ? "Mengupload..." : "Simpan & Upload FP"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}