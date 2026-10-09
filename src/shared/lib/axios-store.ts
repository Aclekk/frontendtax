import axios from "axios";

// Instance terpisah untuk Store API — service beda dari tax-refund-api utama
// (host: 110.239.86.241:5299), BUKAN lewat proxy Next.js internal seperti
// axios instance `api` biasa.
export const storeApi = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_TAX_REFUND_API_URL ??
    process.env.STORE_API_BASE_URL ??
    "https://api-gateway.delamibrands.com/api",
});