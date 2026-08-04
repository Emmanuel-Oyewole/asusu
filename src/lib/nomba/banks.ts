// Static fallback — GET /v1/transfers/banks requires authenticated access,
// which isn't available without a real Nomba account. Swap this for a live
// fetch once real sandbox credentials exist.
export const NIGERIAN_BANKS = [
  { name: "Access Bank", code: "044" },
  { name: "First Bank of Nigeria", code: "011" },
  { name: "GTBank", code: "058" },
  { name: "UBA", code: "033" },
  { name: "Zenith Bank", code: "057" },
  { name: "Nomba", code: "000026" },
] as const;
