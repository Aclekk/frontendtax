"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Search,
  ChevronLeft,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ReceiptText,
  User,
  Package,
} from "lucide-react";
import { useNegara } from "@/features/negara/hooks/useNegara";
import { getActiveStoreCode } from "@/shared/lib/auth-token";
import { NEGARA_LIST, type NegaraOption } from "@/shared/constants/negara.constant";
import { NegaraCombobox } from "@/shared/components/negara-combobox";
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
import {
  apiPreviewCegid,
  type CegidPreviewResponse,
} from "@/features/invoice/api/invoice.api";
import { useCreateInvoice } from "@/features/invoice/hooks/useInvoices";
import type { InvoiceRecord } from "@/features/sa/types/invoice.type";

// ---------- Step 1: Search schema ----------
const searchSchema = z.object({
  noInvoice: z.string().min(1, "Nomor invoice wajib diisi"),
});
type SearchValues = z.infer<typeof searchSchema>;

// ---------- Step 2: customer details entered by SA, without country dropdown ----------
const confirmSchema = z.object({
  fullName: z.string().min(1, "Customer name is required"),
  email: z.string().email("A valid customer email is required"),
  nationality: z.string().min(1, "Nationality is required"),
  passportNumber: z.string().min(1, "Passport number is required"),
});
type ConfirmValues = z.infer<typeof confirmSchema>;

// Field paten — display-only, TIDAK dikirim ke backend (backend yang hardcode)
const PATENT_FIELDS: { label: string; value: string }[] = [
  { label: "Jenis Faktur", value: "Normal" },
  { label: "Kode Transaksi", value: "06" },
  { label: "Jenis ID Pembeli", value: "Passport" },
];

export function AddInvoiceDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (record: InvoiceRecord) => void;
}) {
  const [step, setStep] = React.useState<"search" | "confirm">("search");
  const [preview, setPreview] = React.useState<CegidPreviewResponse | null>(null);
  const [selectedStoreCode, setSelectedStoreCode] = React.useState<string>(() => getActiveStoreCode() ?? "");
  const { data: fetchedNegara = [] } = useNegara();

  const isIndonesiaCountry = (country: Partial<NegaraOption> | null | undefined) => {
    const nama = String(country?.nama ?? "").trim().toLowerCase();
    const kode = String(country?.kode ?? "").trim().toLowerCase();
    return kode === "idn" || kode === "id" || nama === "indonesia";
  };

  const negaraOptions = React.useMemo<NegaraOption[]>(() => {
    const source = fetchedNegara.length ? fetchedNegara : NEGARA_LIST;
    return source.filter((country: Partial<NegaraOption>) => !isIndonesiaCountry(country));
  }, [fetchedNegara]);

  const searchForm = useForm<SearchValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: { noInvoice: "" },
  });

  const confirmForm = useForm<ConfirmValues>({
    resolver: zodResolver(confirmSchema),
    defaultValues: {
      fullName: "",
      email: "",
      nationality: "",
      passportNumber: "",
    },
  });

  React.useEffect(() => {
    if (open) {
      const params = new URLSearchParams(window.location.search);
      const customerName = params.get("customerName");
      const customerEmail = params.get("customerEmail");
      const customerNationality = params.get("customerNationality");
      const customerPassportNumber = params.get("customerPassportNumber");

      setStep("search");
      setPreview(null);
      setSelectedStoreCode(getActiveStoreCode() ?? "");
      searchForm.reset();
      confirmForm.reset({
        fullName: customerName ?? "",
        email: customerEmail ?? "",
        nationality: customerNationality && customerNationality.toLowerCase() !== "indonesia" ? customerNationality : "",
        passportNumber: customerPassportNumber ?? "",
      });
    }
  }, [open, searchForm, confirmForm]);

  // ---------- Step 1: preview mutation ----------
  const previewMutation = useMutation({
    mutationFn: (values: SearchValues) =>
      apiPreviewCegid(selectedStoreCode || getActiveStoreCode() || "", values.noInvoice),
    onSuccess: (data) => {
      // Always use active store (from login) or backend's storeCode; dropdown removed.
      const chosen = selectedStoreCode || data.storeCode || getActiveStoreCode() || "";
      setPreview(data);
      setSelectedStoreCode(chosen);
      setStep("confirm");
    },
  });

  const handleSearch = searchForm.handleSubmit((values) => {
    previewMutation.mutate(values);
  });


  // ---------- Step 2: create mutation ----------
  const createInvoice = useCreateInvoice();

  const createMutation = {
    ...createInvoice,
    mutate: (values: ConfirmValues) =>
      createInvoice.mutate(
        {
          storeCode: selectedStoreCode || getActiveStoreCode() || (preview?.storeCode ?? ""),
          noInvoice: searchForm.getValues("noInvoice"),
          namaPembeli: (values.fullName || preview?.namaMember || "").trim(),
          emailPembeli: (values.email || preview?.email || "").trim(),
          negaraPembeli: values.nationality,
          nomorDokumenPembeli: values.passportNumber,
        },
        {
          onSuccess: (record) => {
            onSubmit?.(record);
            onOpenChange(false);
          },
        }
      ),
  };
  const handleConfirm = confirmForm.handleSubmit((values) => {
    if (preview?.alreadyExists) {
      return;
    }
    createMutation.mutate(values);
  });

  // Pesan error preview: bedakan 404 (data tidak ada di CEGID) vs error lain
  const previewErrorMessage = previewMutation.isError
    ? // @ts-expect-error - axios error shape, disesuaikan kalau ada helper getErrorMessage
      previewMutation.error?.response?.data?.message ??
      "Transaksi tidak ditemukan di CEGID. Periksa kembali Kode Toko dan Nomor Invoice."
    : null;

  const createErrorMessage = createMutation.isError
    ? // @ts-expect-error - axios error shape
      createMutation.error?.response?.data?.message ??
      "Invoice gagal disimpan. Silakan coba lagi."
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent
        className={
          step === "search"
            ? "gap-0 overflow-visible p-0 sm:max-w-lg"
            : "gap-0 max-h-[88vh] overflow-y-auto p-0 sm:max-w-2xl"
        }
    onInteractOutside={(e) => {
  const target = e.target as HTMLElement;
  if (
    target.closest("[data-slot='select-content']") ||
    target.closest("[data-slot='store-combobox-content']") ||
    target.closest("[data-slot='negara-combobox-content']") ||
    target.closest("[role='listbox']")
  ) {
    e.preventDefault();
  }
}}
      >
        {/* ---------- Header dengan step indicator ---------- */}
        <div className="border-b border-border px-6 pb-5 pt-6">
          {step === "confirm" && (
            <button
              type="button"
              onClick={() => setStep("search")}
              className="mb-3 flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-[#0B1B3B]"
            >
              <ChevronLeft className="size-3.5" />
              Kembali ke pencarian
            </button>
          )}

          <DialogHeader className="gap-1">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#0B1B3B]">
                <ReceiptText className="size-4 text-[#F3E2B8]" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-[#0B1B3B]">
                  {step === "search" ? "Add Invoice" : "Confirm Invoice"}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {step === "search"
                    ? "Find the transaction in CEGID by invoice number."
                    : "Review the CEGID item details, then complete the required customer information."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Step indicator */}
          <div className="mt-4 flex items-center gap-2">
            <StepDot active={step === "search"} done={step === "confirm"} label="1" />
            <div
              className={`h-px flex-1 transition-colors ${
                step === "confirm" ? "bg-[#0B1B3B]" : "bg-border"
              }`}
            />
            <StepDot active={step === "confirm"} done={false} label="2" />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
            <span className={step === "search" ? "text-[#0B1B3B]" : ""}>
              Find Transaction
            </span>
            <span className={step === "confirm" ? "text-[#0B1B3B]" : ""}>
              Complete Details
            </span>
          </div>
        </div>

        {step === "search" ? (
          <form onSubmit={handleSearch} className="flex flex-col gap-5 px-6 py-6">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="noInvoice">Nomor Invoice</Label>
              <Input
                id="noInvoice"
                placeholder="Contoh: 40633"
                className="font-mono"
                {...searchForm.register("noInvoice")}
              />
              {searchForm.formState.errors.noInvoice && (
                <p className="text-xs text-destructive">
                  {searchForm.formState.errors.noInvoice.message}
                </p>
              )}
            </div>

            <p className="text-xs leading-relaxed text-muted-foreground">
              Transaction item details are pulled automatically from CEGID based on the invoice number.
              Customer details remain based on the earlier entry.
            </p>


            {previewErrorMessage && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-xs text-destructive">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                <span>{previewErrorMessage}</span>
              </div>
            )}

            <DialogFooter className="mt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={previewMutation.isPending}
                className="bg-[#0B1B3B] hover:bg-[#0B1B3B]/90"
              >
                {previewMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Mencari transaksi...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 size-4" />
                    Cari Transaksi
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={handleConfirm} className="flex flex-col gap-6 px-6 py-6">
            {preview?.alreadyExists && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  Nomor invoice ini sudah pernah digunakan untuk site ini dan
                  tidak dapat diinput ulang.
                </span>
              </div>
            )}

           {/* --- Customer details entered by SA --- */}
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#0B1B3B]">
                 Customer Details
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                 This information is entered by SA and used as the buyer identity for the refund process.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-[#0B1B3B]/15 bg-[#0B1B3B]/[0.02] p-3.5">
               <div className="col-span-2 flex flex-col gap-1.5">
                 <Label htmlFor="fullName">Customer Name</Label>
                 <Input
                   id="fullName"
                   placeholder="Full customer name"
                   {...confirmForm.register("fullName")}
                 />
                 {confirmForm.formState.errors.fullName && (
                   <p className="text-xs text-destructive">
                     {confirmForm.formState.errors.fullName.message}
                   </p>
                 )}
               </div>
               <div className="flex flex-col gap-1.5">
                 <Label htmlFor="email">Email</Label>
                 <Input
                   id="email"
                   type="email"
                   placeholder="e.g. customer@example.com"
                   {...confirmForm.register("email")}
                 />
                 {confirmForm.formState.errors.email && (
                   <p className="text-xs text-destructive">
                     {confirmForm.formState.errors.email.message}
                   </p>
                 )}
               </div>
               <div className="flex flex-col gap-1.5">
                 <Label htmlFor="nationality">Nationality</Label>
                 <NegaraCombobox
                   value={
                     negaraOptions.find((country) => country.nama === confirmForm.watch("nationality"))?.kode ?? ""
                   }
                   onChange={(kodeNegara) => {
                     const matchedCountry = negaraOptions.find((country) => country.kode === kodeNegara);
                     if (matchedCountry) {
                       confirmForm.setValue("nationality", matchedCountry.nama, {
                         shouldValidate: true,
                       });
                     }
                   }}
                 />
                 {confirmForm.formState.errors.nationality && (
                   <p className="text-xs text-destructive">
                     {confirmForm.formState.errors.nationality.message}
                   </p>
                 )}
               </div>
               <div className="flex flex-col gap-1.5">
                 <Label htmlFor="passportNumber">Passport Number</Label>
                 <Input
                   id="passportNumber"
                   placeholder="Passport number"
                   className="font-mono"
                   {...confirmForm.register("passportNumber")}
                 />
                 {confirmForm.formState.errors.passportNumber && (
                   <p className="text-xs text-destructive">
                     {confirmForm.formState.errors.passportNumber.message}
                   </p>
                 )}
               </div>
             </div>
           </div>

            {/* --- Ringkasan transaksi --- */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-1.5">
                <User className="size-3.5 text-muted-foreground" />
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Data Transaksi dari CEGID
                </p>
              </div>

              <div className="rounded-xl border border-border bg-secondary/30 p-4">
                <div className="mb-3 flex items-center justify-between border-b border-border/70 pb-3">
                  <div>
                    <p className="text-sm font-semibold text-[#0B1B3B]">
                      {preview?.storeName || "-"}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                      No. {preview?.receiptNo}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {preview?.transDate ? preview.transDate.slice(0, 10) : "-"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <ReadonlyField
                    label="Jumlah Item"
                    value={String(preview?.itemCount ?? "-")}
                  />
                  <ReadonlyField
                    label="Subtotal"
                    value={
                      preview
                        ? preview.subtotal.toLocaleString("id-ID", {
                            style: "currency",
                            currency: "IDR",
                            maximumFractionDigits: 0,
                          })
                        : "-"
                    }
                    emphasize
                  />
                </div>
              </div>

              {preview?.items && preview.items.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-border">
                  <div className="flex items-center gap-1.5 border-b border-border bg-secondary/40 px-3 py-2">
                    <Package className="size-3.5 text-muted-foreground" />
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Rincian Barang
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-secondary/20 text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">
                            Nama Barang
                          </th>
                          <th className="px-3 py-2 text-right font-medium">
                            Qty
                          </th>
                          <th className="px-3 py-2 text-right font-medium">
                            Harga
                          </th>
                          <th className="px-3 py-2 text-right font-medium">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.items.map((item, idx) => (
                          <tr
                            key={`${item.namaBrg}-${idx}`}
                            className="border-t border-border"
                          >
                            <td className="px-3 py-2">{item.namaBrg || "-"}</td>
                            <td className="px-3 py-2 text-right font-mono">
                              {item.jumlahBrgJasa}
                            </td>
                            <td className="px-3 py-2 text-right font-mono">
                              {item.hargaSatuan}
                            </td>
                            <td className="px-3 py-2 text-right font-mono">
                              {item.hargaTotal}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* --- Field paten (display-only) --- */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-muted-foreground" />
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Ditetapkan Otomatis oleh Sistem
                </p>
              </div>
              <div className="grid grid-cols-3 gap-x-4 gap-y-2 rounded-xl border border-border bg-white p-3.5 text-sm">
                {PATENT_FIELDS.map((f) => (
                  <ReadonlyField key={f.label} label={f.label} value={f.value} />
                ))}
              </div>
            </div>

            {createErrorMessage && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-xs text-destructive">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                <span>{createErrorMessage}</span>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || Boolean(preview?.alreadyExists)}
                className="bg-[#0B1B3B] hover:bg-[#0B1B3B]/90"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Menyimpan invoice...
                  </>
                ) : preview?.alreadyExists ? (
                  "Invoice sudah digunakan"
                ) : (
                  "Simpan Invoice"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StepDot({
  active,
  done,
  label,
}: {
  active: boolean;
  done: boolean;
  label: string;
}) {
  return (
    <div
      className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold transition-colors ${
        active || done
          ? "bg-[#0B1B3B] text-white"
          : "bg-secondary text-muted-foreground"
      }`}
    >
      {done ? <CheckCircle2 className="size-3.5" /> : label}
    </div>
  );
}

function ReadonlyField({
  label,
  value,
  full,
  emphasize,
}: {
  label: string;
  value?: string | null;
  full?: boolean;
  emphasize?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-0.5 ${full ? "col-span-2" : ""}`}>
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span
        className={`font-mono text-xs ${
          emphasize ? "font-semibold text-[#0B1B3B]" : "text-foreground"
        }`}
      >
        {value || "-"}
      </span>
    </div>
  );
}