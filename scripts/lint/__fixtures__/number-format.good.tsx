import { formatCurrency, formatPercent } from "@g4ai/ds";
export const fmt = (v: number) => formatCurrency(v);
export const pct = (v: number) => formatPercent(v);
export const ratio = (v: number) => v.toFixed(1);
