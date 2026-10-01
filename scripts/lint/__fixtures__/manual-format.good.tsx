// preset strict
import { formatCurrency, formatPercent } from "@g4ai/ds";
export const brl = (n: number) => formatCurrency(n);
export const pct = (n: number) => formatPercent(n);
