export const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatBRL(value: number): string {
  return BRL.format(value);
}

export function parseDigits(input: string): number {
  const digits = input.replace(/\D/g, "");
  if (!digits) return 0;
  return parseInt(digits, 10);
}

/** Máscara em reais inteiros (sem centavos) — formato 50.000 */
export function formatMaskedInt(rawDigits: string): string {
  const v = parseDigits(rawDigits);
  return v === 0 ? "" : v.toLocaleString("pt-BR");
}

export function formatPhoneBR(input: string): string {
  const d = input.replace(/\D/g, "").slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
}

export function pct(num: number, denom: number, digits = 1): string {
  if (denom <= 0) return "0%";
  return ((num / denom) * 100).toFixed(digits) + "%";
}
