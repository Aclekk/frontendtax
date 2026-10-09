"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, UserRound, ArrowUpRight, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { SaShell } from "@/features/sa/components/sa-shell";
import { Button } from "@/shared/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/shared/ui/table";
import { getActiveStoreCode, getActiveStoreName } from "@/shared/lib/auth-token";
import { formatApiDateTime } from "@/shared/lib/date-time";

type CustomerRecord = {
  id: number;
  fullName: string;
  email?: string;
  address?: string;
  passportNumber: string;
  nationality?: string;
  sourceChannel?: string;
  createdAt?: string;
  updatedAt?: string;
};

export default function SaLandingPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeCustomerId, setActiveCustomerId] = useState<string | null>(null);
  const [activeStoreCode, setActiveStoreCode] = useState<string | null>(null);
  const [activeStoreName, setActiveStoreName] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    setActiveCustomerId(params.get("customerId"));
    setActiveStoreCode(getActiveStoreCode());
    setActiveStoreName(getActiveStoreName());
  }, []);

  // Extract loader so it can be reused by storage listener
  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/gw/tax-refund-customer");
      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Gagal memuat data customer.");
      }

      setCustomers(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error(error);
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  // Listen for other tabs creating customer and refresh list automatically via BroadcastChannel (non-persistent)
  useEffect(() => {
    if (typeof window === "undefined") return;

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("customer-events");
      const onMessage = (ev: MessageEvent) => {
        // small debounce to allow backend to commit
        setTimeout(() => {
          loadCustomers();
        }, 300);
      };
      bc.addEventListener("message", onMessage as EventListener);
      return () => {
        if (bc) {
          bc.removeEventListener("message", onMessage as EventListener);
          bc.close();
        }
      };
    } catch (e) {
      // BroadcastChannel not available in this environment — fallback to no-op
      return () => {};
    }
  }, []);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    const sortedCustomers = [...customers].sort((a, b) => {
      const aTime = Date.parse(a.createdAt ?? "");
      const bTime = Date.parse(b.createdAt ?? "");
      return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
    });

    if (!query) return sortedCustomers;

    return sortedCustomers.filter((customer) => {
      const haystack = [
        customer.fullName,
        customer.email,
        customer.address,
        customer.passportNumber,
        customer.nationality,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [search, customers]);

  const openCustomer = (customer: CustomerRecord) => {
    const customerNationality = customer.nationality ?? "";
    const customerEmail = customer.email ?? "";
    const customerAddress = customer.address ?? "";

    router.push(
      `/landing-page?customerId=${customer.id}&customerName=${encodeURIComponent(customer.fullName)}&customerEmail=${encodeURIComponent(customerEmail)}&customerAddress=${encodeURIComponent(customerAddress)}&customerNationality=${encodeURIComponent(customerNationality)}&customerPassportNumber=${encodeURIComponent(customer.passportNumber)}`
    );
  };

  return (
    <SaShell activeHref="/sa">
      <div className="space-y-5 sm:space-y-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground sm:text-sm">SA Dashboard</p>
          <h1 className="mt-2 text-2xl font-bold text-foreground">Customer Data</h1>
        </div>

        {activeStoreCode && (
          <div className="flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="leading-relaxed">
              Active site: <span className="font-semibold">{activeStoreName || "-"}</span> ({activeStoreCode})
            </span>
          </div>
        )}

        {activeCustomerId && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Active customer: <span className="font-semibold">{customers.find((customer) => String(customer.id) === activeCustomerId)?.fullName ?? "-"}</span>
          </div>
        )}

        <div className="rounded-xl border border-border bg-card p-3 shadow-sm sm:p-4">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, passport, nationality, or email..."
              className="w-full border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow>
                <TableHead>Customer Name</TableHead>
                <TableHead>Passport Number</TableHead>
                <TableHead>Nationality</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Customer Since (WIB)</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    Loading customer data...
                  </TableCell>
                </TableRow>
              )}
  
              {!isLoading && filteredCustomers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    No customer records yet. Add a new customer or adjust the search.
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && filteredCustomers.map((customer) => {
                const isActive = String(customer.id) === activeCustomerId;

                return (
                  <TableRow key={customer.id} className={isActive ? "bg-emerald-50/60" : "align-middle"}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${isActive ? "bg-emerald-100 text-emerald-700" : "bg-sky-100 text-sky-700"}`}>
                          <UserRound className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{customer.fullName || "-"}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{customer.passportNumber || "-"}</TableCell>
                    <TableCell>{customer.nationality || "-"}</TableCell>
                    <TableCell>
                                          {customer.email || "-"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatApiDateTime(customer.createdAt, "UTC")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant={isActive ? "default" : "outline"} size="sm" onClick={() => openCustomer(customer)}>
                        {isActive ? "Continue" : "Process"}
                        <ArrowUpRight className="ml-2 h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </SaShell>
  );
}
