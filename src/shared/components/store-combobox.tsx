"use client";

import * as React from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Loader2, Search } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { apiGetStores, type StoreApiResponse } from "@/features/store/api/store.api";

const PAGE_SIZE = 5;

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export function StoreCombobox({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (storeId: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [searchInput, setSearchInput] = React.useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    isPending,
  } = useInfiniteQuery({
    queryKey: ["stores", debouncedSearch, { isTaxRefund: true, pageSize: PAGE_SIZE }],
    queryFn: ({ pageParam }) =>
      apiGetStores({
        search: debouncedSearch,
        page: pageParam,
        pageSize: PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.totalPages > 0 && lastPage.page >= lastPage.totalPages) {
        return undefined;
      }
      if (lastPage.items.length < lastPage.pageSize) return undefined;
      return lastPage.page + 1;
    },
    enabled: open,
    staleTime: 30_000,
  });

  const stores = data?.pages.flatMap((page) => page.items) ?? [];
  const selectedStore = stores.find((s) => s.storeId === value);
  const showInitialLoading = isPending && stores.length === 0;

  React.useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleSelect = (storeId: string) => {
    onChange(storeId);
    setOpen(false);
    setSearchInput("");
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const reachedBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 16;
    if (reachedBottom && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className="w-full justify-between font-normal"
      >
        <span className={cn(!value && "text-muted-foreground")}>
          {selectedStore
            ? `${selectedStore.storeId} — ${selectedStore.storeName}`
            : value || "Pilih toko..."}
        </span>
        <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
      </Button>

      {open && (
        <div
          data-slot="store-combobox-content"
          className="mt-1 w-full rounded-lg border border-border bg-popover text-popover-foreground shadow-md"
        >
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari nama/kode toko..."
              className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div
            ref={listRef}
            onScroll={handleScroll}
            className="max-h-52 overflow-y-auto overscroll-contain p-1"
          >
            {showInitialLoading && (
              <div className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                Memuat...
              </div>
            )}
            {!showInitialLoading && stores.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Toko tidak ditemukan.
              </p>
            )}
            {stores.map((store: StoreApiResponse) => (
              <button
                key={store.id}
                type="button"
                onClick={() => handleSelect(store.storeId)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
              >
                <Check
                  className={cn(
                    "size-4 shrink-0",
                    value === store.storeId ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex flex-col">
                  <span className="font-mono text-xs">{store.storeId}</span>
                  <span className="text-xs text-muted-foreground">
                    {store.storeName} &middot; {store.city}
                  </span>
                </div>
              </button>
            ))}
            {isFetchingNextPage && (
              <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                Memuat lagi...
              </div>
            )}
            {!hasNextPage && stores.length > 0 && !isFetching && (
              <p className="py-2 text-center text-[11px] text-muted-foreground">
                Semua toko sudah ditampilkan
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
