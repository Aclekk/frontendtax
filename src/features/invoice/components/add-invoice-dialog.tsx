"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, ChevronLeft } from "lucide-react";
import { useNegara } from "@/features/negara/hooks/useNegara";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import type {
  SyncedInvoiceCandidate,
  InvoiceRecord,
} from "@/features/invoice/types/invoice.type";

// NOTE: placeholder hasil "sync" — nanti diganti pemanggilan API asli.
const MOCK_CANDIDATES: SyncedInvoiceCandidate[] = [
  {
    receiptNo: "CGD-SBY-005541",
    date: "10 Agu 2026",
    site: "Surabaya - Tunjungan",
    touristName: "Carlos Silva",
    country: "Brazil",
    subtotal: "Rp 890.000",
  },
  {
    receiptNo: "CGD-BALI-001299",
    date: "10 Agu 2026",
    site: "Bali - Seminyak",
    touristName: "Yuki Tanaka",
    country: "Japan",
    subtotal: "Rp 1.100.000",
  },
];

const formSchema = z.object({
  tanggalFaktur: z.string().min(1, "Wajib diisi"),
  jenisFaktur: z.string().min(1, "Wajib diisi"),
  kodeTransaksi: z.string().min(1, "Wajib diisi"),
  keteranganTambahan: z.string(),
  dokumenPendukung: z.string(),
  periodDokPendukung: z.string(),
  referensi: z.string(),
  capFasilitas: z.string(),
  idTkuPenjual: z.string().min(1, "Wajib diisi"),
  npwpNikPembeli: z.string().min(1, "Wajib diisi"),
  jenisIdPembeli: z.string().min(1, "Wajib diisi"),
  negaraPembeli: z.string().min(1, "Wajib diisi"),
  nomorDokumenPembeli: z.string().min(1, "Wajib diisi"),
  namaPembeli: z.string().min(1, "Wajib diisi"),
  alamatPembeli: z.string().min(1, "Wajib diisi"),
  emailPembeli: z.string().email("Format email tidak valid"),
  idTkuPembeli: z.string().min(1, "Wajib diisi"),
});

type FormValues = z.infer<typeof formSchema>;

const FIELD_GROUPS: {
  title: string;
  fields: { name: keyof FormValues; label: string; type?: string }[];
}[] = [
  {
    title: "Data Faktur",
    fields: [
      { name: "tanggalFaktur", label: "Tanggal Faktur", type: "date" },
      { name: "jenisFaktur", label: "Jenis Faktur" },
      { name: "kodeTransaksi", label: "Kode Transaksi" },
      { name: "referensi", label: "Referensi" },
      { name: "capFasilitas", label: "Cap Fasilitas" },
      { name: "keteranganTambahan", label: "Keterangan Tambahan" },
      { name: "dokumenPendukung", label: "Dokumen Pendukung" },
      { name: "periodDokPendukung", label: "Period Dok Pendukung" },
      { name: "idTkuPenjual", label: "ID TKU Penjual" },
    ],
  },
  {
    title: "Data Pembeli (Turis)",
    fields: [
      { name: "namaPembeli", label: "Nama Pembeli" },
      { name: "npwpNikPembeli", label: "NPWP / NIK Pembeli" },
      { name: "jenisIdPembeli", label: "Jenis ID Pembeli" },
      { name: "nomorDokumenPembeli", label: "Nomor Dokumen Pembeli" },
      { name: "negaraPembeli", label: "Negara Pembeli" },
      { name: "alamatPembeli", label: "Alamat Pembeli" },
      { name: "emailPembeli", label: "Email Pembeli", type: "email" },
      { name: "idTkuPembeli", label: "ID TKU Pembeli" },
    ],
  },
];

export function AddInvoiceDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (record: InvoiceRecord) => void;
}) {
  const [step, setStep] = React.useState<"search" | "form">("search");
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<SyncedInvoiceCandidate | null>(
    null
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: Object.fromEntries(
      Object.keys(formSchema.shape).map((k) => [k, ""])
    ) as FormValues,
  });

  React.useEffect(() => {
    if (open) {
      setStep("search");
      setQuery("");
      setSelected(null);
      form.reset();
    }
  }, [open, form]);

  const results = query.trim()
    ? MOCK_CANDIDATES.filter((c) =>
        c.receiptNo.toLowerCase().includes(query.trim().toLowerCase())
      )
    : MOCK_CANDIDATES;

  const handlePick = (candidate: SyncedInvoiceCandidate) => {
    setSelected(candidate);
    setStep("form");
  };

  const handleSubmit = form.handleSubmit((values) => {
    if (!selected) return;
    onSubmit({
      ...values,
      id: crypto.randomUUID(),
      baris: Date.now(),
      receiptNo: selected.receiptNo,
      status: "new",
    });
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        {step === "search" ? (
          <>
            <DialogHeader>
              <DialogTitle>Tambah Invoice</DialogTitle>
              <DialogDescription>
                Cari transaksi berdasarkan No. Invoice / No. Struk hasil
                sinkronisasi.
              </DialogDescription>
            </DialogHeader>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari No. Invoice / No. Struk..."
                className="pl-9"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              {results.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Tidak ada hasil ditemukan.
                </p>
              )}
              {results.map((candidate) => (
                <button
                  key={candidate.receiptNo}
                  type="button"
                  onClick={() => handlePick(candidate)}
                  className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-left text-sm transition-colors hover:border-primary hover:bg-secondary/50"
                >
                  <div>
                    <p className="font-mono text-xs text-foreground">
                      {candidate.receiptNo}
                    </p>
                    <p className="mt-0.5 text-muted-foreground">
                      {candidate.touristName} &middot; {candidate.site}
                    </p>
                  </div>
                  <span className="font-mono text-sm">
                    {candidate.subtotal}
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <button
                type="button"
                onClick={() => setStep("search")}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="size-3.5" />
                Kembali ke pencarian
              </button>
              <DialogTitle>Detail Invoice</DialogTitle>
              <DialogDescription>
                Transaksi{" "}
                <span className="font-mono text-foreground">
                  {selected?.receiptNo}
                </span>{" "}
                &mdash; lengkapi data sesuai format Core Tax.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {FIELD_GROUPS.map((group) => (
                <div key={group.title} className="flex flex-col gap-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.title}
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    {group.fields.map((field) => (
                      <div key={field.name} className="flex flex-col gap-1.5">
                        <Label htmlFor={field.name}>{field.label}</Label>
                        <Input
                          id={field.name}
                          type={field.type ?? "text"}
                          {...form.register(field.name)}
                        />
                        {form.formState.errors[field.name] && (
                          <p className="text-xs text-destructive">
                            {form.formState.errors[field.name]?.message}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Batal
                </Button>
                <Button type="submit">Simpan Invoice</Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}