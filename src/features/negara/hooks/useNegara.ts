import { useQuery } from "@tanstack/react-query";
import { apiGetNegara } from "../api/negara.api";

const NEGARA_KEY = ["negara"];

export function useNegara() {
  return useQuery({
    queryKey: NEGARA_KEY,
    queryFn: apiGetNegara,
  });
}