"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2, Search } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { useNegara } from "@/features/negara/hooks/useNegara";

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

const LABELS = {
  id: {
    loading: "Memuat daftar negara...",
    placeholder: "Pilih negara...",
    search: "Cari nama/kode negara...",
    notFound: "Negara tidak ditemukan.",
    foundCount: (count: number) => `${count} negara ditemukan`,
  },
  en: {
    loading: "Loading countries...",
    placeholder: "Select a country...",
    search: "Search country name or code...",
    notFound: "Country not found.",
    foundCount: (count: number) => `${count} countries found`,
  },
} as const;

export function NegaraCombobox({
  value,
  onChange,
  disabled,
  locale = "id",
}: {
  value: string;
  onChange: (kodeNegara: string) => void;
  disabled?: boolean;
  locale?: "id" | "en";
}) {
  const [open, setOpen] = React.useState(false);
  const [searchInput, setSearchInput] = React.useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 150);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const optionGestureRef = React.useRef<{
    x: number;
    y: number;
    moved: boolean;
    pointerType: string;
  } | null>(null);
  const suppressNextClickRef = React.useRef(false);

  const { data: negaraList = [], isPending } = useNegara();

  const selectedNegara = negaraList.find((n) => n.kode === value);

  const filteredNegara = React.useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    if (!query) return negaraList;
    return negaraList.filter(
      (n) =>
        n.nama.toLowerCase().includes(query) ||
        n.kode.toLowerCase().includes(query)
    );
  }, [negaraList, debouncedSearch]);

 React.useEffect(() => {
  if (!open) return;
  function handleOutside(e: MouseEvent) {
    if (
      containerRef.current &&
      !containerRef.current.contains(e.target as Node)
    ) {
      setOpen(false);
    }
  }
  document.addEventListener("mousedown", handleOutside);
  return () => document.removeEventListener("mousedown", handleOutside);
}, [open]);

  const handleSelect = (kode: string) => {
    onChange(kode);
    setOpen(false);
    setSearchInput("");
  };

  const handleOptionPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    optionGestureRef.current = {
      x: event.clientX,
      y: event.clientY,
      moved: false,
      pointerType: event.pointerType,
    };
  };

  const handleOptionPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const gesture = optionGestureRef.current;
    if (!gesture) return;

    const distance = Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y);
    if (distance > 8) {
      gesture.moved = true;
    }
  };

  const handleOptionPointerUp = (kode: string) => {
    const gesture = optionGestureRef.current;
    optionGestureRef.current = null;
    if (gesture?.pointerType === "touch" && !gesture.moved) {
      suppressNextClickRef.current = true;
      handleSelect(kode);
    }
  };

  const labels = LABELS[locale];

  return (
    <div ref={containerRef} className="relative min-w-0">
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className="h-auto min-h-11 w-full justify-between gap-2 py-2.5 font-normal"
      >
        <span className={cn("min-w-0 truncate text-left", !value && "text-muted-foreground")}>
          {selectedNegara
              ? `${selectedNegara.nama} (${selectedNegara.kode})`
              : isPending
                ? labels.loading
                : labels.placeholder}
        </span>
        {isPending ? (
          <Loader2 className="ml-2 size-4 shrink-0 animate-spin opacity-50" />
        ) : (
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        )}
      </Button>

      {open && (
        <div
          data-slot="negara-combobox-content"
          className="absolute z-50 mt-1 w-full max-w-full overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-md"
        >
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={labels.search}
              className="flex h-11 w-full min-w-0 bg-transparent py-3 text-base outline-none placeholder:text-muted-foreground sm:h-10 sm:text-sm"
            />
          </div>

          <div className="max-h-[min(16rem,50vh)] overflow-y-auto overscroll-contain p-1 touch-pan-y">
            {filteredNegara.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {labels.notFound}
              </p>
            )}
            {filteredNegara.map((negara) => (
<button
  key={negara.kode}
  type="button"
  onPointerDown={handleOptionPointerDown}
  onPointerMove={handleOptionPointerMove}
  onPointerUp={() => handleOptionPointerUp(negara.kode)}
  onClick={(event) => {
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      return;
    }
    handleSelect(negara.kode);
  }}
  className="flex min-h-11 w-full touch-pan-y items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
>
                <Check
                  className={cn(
                    "size-4 shrink-0",
                    value === negara.kode ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex flex-col">
                  <span className="text-xs">{negara.nama}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {negara.kode}
                  </span>
                </div>
              </button>
            ))}
            {filteredNegara.length > 0 && (
              <p className="px-2 py-1.5 text-[11px] text-muted-foreground">
                {labels.foundCount(filteredNegara.length)}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}