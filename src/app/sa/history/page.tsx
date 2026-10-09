"use client";

import { useEffect, useMemo, useState } from "react";
import { History, Search, UserRound } from "lucide-react";
import { SaShell } from "@/features/sa/components/sa-shell";
import { Button } from "@/shared/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/shared/ui/table";
import { formatApiDateOnly } from "@/shared/lib/date-time";

type HistoryCustomer = {
  id: number;
  fullName: string;
  email?: string | null;
  address?: string | null;
  passportNumber?: string | null;
  nationality?: string | null;
  sourceChannel?: string | null;
  lastActivityAt?: string | null;
  createdAt?: string | null;
};

export default function SaHistoryPage() {
  const [customers, setCustomers] = useState<HistoryCustomer[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/gw/tax-refund-customer/history");
        const result = await response.json();

        if (!response.ok || !result?.success) {
          throw new Error(result?.message || "Gagal memuat history customer.");
        }

        setCustomers(Array.isArray(result.data) ? result.data : []);
      } catch (error) {
        console.error(error);
        setCustomers([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, []);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return customers;

    return customers.filter((customer) => {
      const haystack = [
        customer.fullName,
        customer.email,
        customer.address,
        customer.passportNumber,
        customer.nationality,
        customer.sourceChannel,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [search, customers]);

  return (
    <SaShell activeHref="/sa/history">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">History</p>
            <h1 className="mt-2 text-2xl font-bold text-foreground">Customer History</h1>
          </div>
          <Button onClick={() => window.location.assign("/sa")}>
            <History className="mr-2 h-4 w-4" />
            Back to Customer List
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama, paspor, email, negara..."
              className="w-full border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer Name</TableHead>
                <TableHead>Passport Number</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Nationality</TableHead>
                <TableHead>Last Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    Loading customer history...
                  </TableCell>
                </TableRow>
              )}
 
              {!isLoading && filteredCustomers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    No customer activity in history yet.
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                        <UserRound className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{customer.fullName || "-"}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{customer.passportNumber || "-"}</TableCell>
                  <TableCell>{customer.email || "-"}</TableCell>
                  <TableCell>{customer.nationality || "-"}</TableCell>
                  <TableCell>
                    {formatApiDateOnly(customer.lastActivityAt ?? customer.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </SaShell>
  );
}
