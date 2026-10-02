/**
 * Formatação pt-BR para números de negócio. Use sempre estas funções em
 * tabelas, KPIs e gráficos: o mesmo número aparece igual em todo lugar.
 */

const cache = new Map<string, Intl.NumberFormat>();
function nf(key: string, options: Intl.NumberFormatOptions) {
  let f = cache.get(key);
  if (!f) {
    f = new Intl.NumberFormat("pt-BR", options);
    cache.set(key, f);
  }
  return f;
}

/** 1234.5 → "1.234,5" */
export const formatNumber = (n: number, digits = 0) =>
  nf(`n${digits}`, { maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(n);

/** 1234.5 → "R$ 1.234,50". `compact` → "R$ 1,2 mil". */
export function formatCurrency(n: number, options: { compact?: boolean; currency?: string; cents?: boolean } = {}) {
  const { compact = false, currency = "BRL" } = options;
  const cents = options.cents ?? !compact;
  return nf(`c${currency}${compact}${cents}`, {
    style: "currency",
    currency,
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: cents ? 2 : compact ? 1 : 0,
    minimumFractionDigits: cents ? 2 : 0,
  }).format(n);
}

/** 1250000 → "1,3 mi" */
export const formatCompact = (n: number) =>
  nf("compact", { notation: "compact", maximumFractionDigits: 1 }).format(n);

/**
 * 0.1234 → "12,3 %". Recebe fração (0–1), não porcentagem.
 * Espaço inseparável antes do % (norma brasileira; o Intl pt-BR cola o sinal ao número).
 */
export const formatPercent = (fraction: number, digits = 1) =>
  nf(`p${digits}`, { style: "percent", maximumFractionDigits: digits }).format(fraction).replace(/\s?%/, "\u00A0%");

/** Variação assinada: 0.125 → "+12,5 %", -0.2 → "−20 %" (sinal de menos tipográfico). */
export const formatDelta = (fraction: number, digits = 1) => {
  const abs = formatPercent(Math.abs(fraction), digits);
  if (fraction > 0) return `+${abs}`;
  if (fraction < 0) return `−${abs}`;
  return abs;
};

const rtf = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
/** Data relativa curta: "há 5 min", "ontem", "em 3 dias". Acima de 30 dias mostra a data. */
export function formatRelative(date: Date | string | number, now: Date = new Date()) {
  const d = toDate(date);
  const s = Math.round((d.getTime() - now.getTime()) / 1000);
  const a = Math.abs(s);
  if (a < 60) return "agora";
  if (a < 3600) return rtf.format(Math.round(s / 60), "minute");
  if (a < 86400) return rtf.format(Math.round(s / 3600), "hour");
  if (a < 86400 * 30) return rtf.format(Math.round(s / 86400), "day");
  return formatDate(d);
}

/** "2026-10-01" (só data) é dia local, não meia-noite UTC — senão vira 30/09 no Brasil. */
const toDate = (date: Date | string | number) => (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00`) : new Date(date));

/** "30/09/2026"; `short` → "30 set" */
export function formatDate(date: Date | string | number, { short = false } = {}) {
  const d = toDate(date);
  return short
    ? d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "")
    : d.toLocaleDateString("pt-BR");
}
