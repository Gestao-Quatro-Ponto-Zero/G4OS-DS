/*
 * Datas só-dia em pt-BR, sem dependência. Convenções:
 *   · Valor público é sempre ISO "AAAA-MM-DD" (string). Nunca Date com hora.
 *   · Internamente, Date local ao meio-dia (não pula dia por fuso/horário de verão).
 *   · Semana começa na segunda. Dia útil = seg–sex fora de feriado nacional.
 * Horários são "HH:MM" (24h).
 */

export type IsoDate = string;
export type IsoRange = { from: IsoDate; to: IsoDate };

const pad = (n: number) => String(n).padStart(2, "0");

/** "2026-09-30" → Date local ao meio-dia. */
export function toDate(iso: IsoDate) {
  return new Date(`${iso}T12:00:00`);
}
/** Date → "2026-09-30". */
export function toIso(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
/** Hoje em ISO (ou a data de referência passada). */
export const todayIso = (now: Date = new Date()) => toIso(now);

export const monthNames = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
export const monthShort = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
/** Domingo = 0 (como Date#getDay). */
export const weekdayNames = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
/** Cabeçalho do calendário, começando na segunda. */
export const weekdayInitials = ["S", "T", "Q", "Q", "S", "S", "D"];
export const weekdayShort = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];

/* ------------------------------------------------------------------ */
/* Aritmética                                                          */
/* ------------------------------------------------------------------ */

export function addDays(iso: IsoDate, n: number) {
  const d = toDate(iso);
  d.setDate(d.getDate() + n);
  return toIso(d);
}
/** Soma meses sem estourar (31/01 + 1 mês = 28/02 ou 29/02). */
export function addMonths(iso: IsoDate, n: number) {
  const d = toDate(iso);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return toIso(d);
}
export const addYears = (iso: IsoDate, n: number) => addMonths(iso, n * 12);

/** Diferença em dias corridos (b − a). */
export function daysBetween(a: IsoDate, b: IsoDate) {
  return Math.round((toDate(b).getTime() - toDate(a).getTime()) / 86400000);
}
export const isSameDay = (a?: IsoDate | null, b?: IsoDate | null) => !!a && a === b;
export const isBefore = (a: IsoDate, b: IsoDate) => a < b;
export const isAfter = (a: IsoDate, b: IsoDate) => a > b;
export const isWithin = (iso: IsoDate, range: Partial<IsoRange>) => (!range.from || iso >= range.from) && (!range.to || iso <= range.to);
export const clampIso = (iso: IsoDate, min?: IsoDate, max?: IsoDate) => (min && iso < min ? min : max && iso > max ? max : iso);

/** Segunda-feira = 0 … domingo = 6. */
export const weekdayMon = (iso: IsoDate) => (toDate(iso).getDay() + 6) % 7;

export const startOfWeek = (iso: IsoDate) => addDays(iso, -weekdayMon(iso));
export const endOfWeek = (iso: IsoDate) => addDays(startOfWeek(iso), 6);
export const startOfMonth = (iso: IsoDate) => `${iso.slice(0, 7)}-01`;
export function endOfMonth(iso: IsoDate) {
  const d = toDate(iso);
  return toIso(new Date(d.getFullYear(), d.getMonth() + 1, 0, 12));
}
export function startOfQuarter(iso: IsoDate) {
  const d = toDate(iso);
  return toIso(new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1, 12));
}
export const endOfQuarter = (iso: IsoDate) => endOfMonth(addMonths(startOfQuarter(iso), 2));
export const startOfYear = (iso: IsoDate) => `${iso.slice(0, 4)}-01-01`;
export const endOfYear = (iso: IsoDate) => `${iso.slice(0, 4)}-12-31`;
/** 1–4 */
export const quarterOf = (iso: IsoDate) => Math.floor((Number(iso.slice(5, 7)) - 1) / 3) + 1;

/** Número da semana ISO-8601. */
export function isoWeek(iso: IsoDate) {
  const d = toDate(iso);
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 3 - ((d.getDay() + 6) % 7), 12);
  const firstThursday = new Date(target.getFullYear(), 0, 4, 12);
  return 1 + Math.round(((target.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getDay() + 6) % 7)) / 7);
}

/** Todos os dias de [from, to] (inclusive). */
export function eachDay(from: IsoDate, to: IsoDate) {
  const out: IsoDate[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

/* ------------------------------------------------------------------ */
/* Feriados e dias úteis                                               */
/* ------------------------------------------------------------------ */

/** Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher). */
export function easterSunday(year: number): IsoDate {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return `${year}-${pad(month)}-${pad(day)}`;
}

export type Holiday = { date: IsoDate; name: string; kind: "nacional" | "ponto facultativo" };

const holidayCache = new Map<number, Holiday[]>();
/**
 * Feriados nacionais do Brasil + pontos facultativos móveis (Carnaval e
 * Corpus Christi, que quase todo mundo trata como folga). Feriados estaduais
 * e municipais entram via `extraHolidays` nos componentes.
 */
export function brHolidays(year: number): Holiday[] {
  const cached = holidayCache.get(year);
  if (cached) return cached;
  const easter = easterSunday(year);
  const fixed: [string, string][] = [
    ["01-01", "Confraternização Universal"],
    ["04-21", "Tiradentes"],
    ["05-01", "Dia do Trabalho"],
    ["09-07", "Independência do Brasil"],
    ["10-12", "Nossa Senhora Aparecida"],
    ["11-02", "Finados"],
    ["11-15", "Proclamação da República"],
    ["12-25", "Natal"],
  ];
  const list: Holiday[] = fixed.map(([md, name]) => ({ date: `${year}-${md}`, name, kind: "nacional" }));
  if (year >= 2024) list.push({ date: `${year}-11-20`, name: "Dia da Consciência Negra", kind: "nacional" });
  list.push(
    { date: addDays(easter, -48), name: "Carnaval (segunda)", kind: "ponto facultativo" },
    { date: addDays(easter, -47), name: "Carnaval (terça)", kind: "ponto facultativo" },
    { date: addDays(easter, -2), name: "Sexta-feira Santa", kind: "nacional" },
    { date: addDays(easter, 60), name: "Corpus Christi", kind: "ponto facultativo" },
  );
  list.sort((a, b) => a.date.localeCompare(b.date));
  holidayCache.set(year, list);
  return list;
}

/** Nome do feriado nessa data (nacional ou extra), ou undefined. */
export function holidayName(iso: IsoDate, extra: Holiday[] = []) {
  return (extra.find((h) => h.date === iso) ?? brHolidays(Number(iso.slice(0, 4))).find((h) => h.date === iso))?.name;
}
export const isHoliday = (iso: IsoDate, extra: Holiday[] = []) => holidayName(iso, extra) != null;
export const isWeekend = (iso: IsoDate) => weekdayMon(iso) >= 5;
export const isBusinessDay = (iso: IsoDate, extra: Holiday[] = []) => !isWeekend(iso) && !isHoliday(iso, extra);

/** Soma (ou subtrai) n dias úteis. n = 0 → próximo dia útil se hoje não for. */
export function addBusinessDays(iso: IsoDate, n: number, extra: Holiday[] = []) {
  const step = n < 0 ? -1 : 1;
  let d = iso;
  let left = Math.abs(n);
  if (left === 0) {
    while (!isBusinessDay(d, extra)) d = addDays(d, 1);
    return d;
  }
  while (left > 0) {
    d = addDays(d, step);
    if (isBusinessDay(d, extra)) left--;
  }
  return d;
}
/** Dias úteis em [from, to], inclusive nas duas pontas. */
export function businessDaysBetween(from: IsoDate, to: IsoDate, extra: Holiday[] = []): number {
  if (from > to) return -businessDaysBetween(to, from, extra);
  let n = 0;
  for (let d = from; d <= to; d = addDays(d, 1)) if (isBusinessDay(d, extra)) n++;
  return n;
}

/* ------------------------------------------------------------------ */
/* Formatação                                                          */
/* ------------------------------------------------------------------ */

/** "30/09/2026" */
export const formatIsoBr = (iso: IsoDate) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : "");
/** "sexta, 03/10/2026" */
export const formatDateLong = (iso: IsoDate) => (iso ? `${weekdayNames[toDate(iso).getDay()]}, ${formatIsoBr(iso)}` : "");
/** "3 out" · com ano se diferente do ano de referência: "3 out 2027" */
export function formatDayMonth(iso: IsoDate, refYear = new Date().getFullYear()) {
  const d = toDate(iso);
  return `${d.getDate()} ${monthShort[d.getMonth()]}${d.getFullYear() !== refYear ? ` ${d.getFullYear()}` : ""}`;
}
/** "1–15 out 2026" · "28 set – 4 out 2026" · "15 dez 2026 – 10 jan 2027" */
export function formatRange(range: Partial<IsoRange>) {
  const { from, to } = range;
  if (!from && !to) return "";
  if (!from || !to) return from ? `a partir de ${formatIsoBr(from)}` : `até ${formatIsoBr(to!)}`;
  const a = toDate(from);
  const b = toDate(to);
  if (from === to) return `${a.getDate()} ${monthShort[a.getMonth()]} ${a.getFullYear()}`;
  if (a.getFullYear() !== b.getFullYear()) return `${a.getDate()} ${monthShort[a.getMonth()]} ${a.getFullYear()} – ${b.getDate()} ${monthShort[b.getMonth()]} ${b.getFullYear()}`;
  if (a.getMonth() !== b.getMonth()) return `${a.getDate()} ${monthShort[a.getMonth()]} – ${b.getDate()} ${monthShort[b.getMonth()]} ${b.getFullYear()}`;
  return `${a.getDate()}–${b.getDate()} ${monthShort[a.getMonth()]} ${a.getFullYear()}`;
}
/** "setembro de 2026" */
export const formatMonthYear = (iso: IsoDate) => `${monthNames[toDate(iso).getMonth()]} de ${iso.slice(0, 4)}`;

/**
 * Prazo relativo para leitura rápida: "vence hoje", "vence amanhã",
 * "vence em 3 dias úteis", "venceu há 2 dias". `tone` diz como pintar.
 */
export function describeDue(due: IsoDate, now: IsoDate = todayIso(), { businessDays = true, extra = [] as Holiday[] } = {}) {
  const diff = daysBetween(now, due);
  if (diff === 0) return { label: "vence hoje", tone: "warn" as const, diff };
  if (diff === 1) return { label: "vence amanhã", tone: "warn" as const, diff };
  if (diff < 0) return { label: `venceu há ${-diff} ${-diff === 1 ? "dia" : "dias"}`, tone: "bad" as const, diff };
  if (businessDays) {
    const bd = businessDaysBetween(addDays(now, 1), due, extra);
    return { label: `vence em ${bd} ${bd === 1 ? "dia útil" : "dias úteis"}`, tone: bd <= 2 ? ("warn" as const) : ("neutral" as const), diff };
  }
  return { label: `vence em ${diff} dias`, tone: diff <= 2 ? ("warn" as const) : ("neutral" as const), diff };
}

/* ------------------------------------------------------------------ */
/* Períodos (presets) e comparação                                     */
/* ------------------------------------------------------------------ */

export type PeriodPreset =
  | "today"
  | "yesterday"
  | "last7"
  | "last30"
  | "last90"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "this_quarter"
  | "last_quarter"
  | "ytd"
  | "last12m"
  | "this_year"
  | "last_year";

export const periodPresets: { id: PeriodPreset; label: string }[] = [
  { id: "today", label: "Hoje" },
  { id: "yesterday", label: "Ontem" },
  { id: "last7", label: "Últimos 7 dias" },
  { id: "last30", label: "Últimos 30 dias" },
  { id: "last90", label: "Últimos 90 dias" },
  { id: "this_week", label: "Esta semana" },
  { id: "last_week", label: "Semana passada" },
  { id: "this_month", label: "Este mês" },
  { id: "last_month", label: "Mês passado" },
  { id: "this_quarter", label: "Este trimestre" },
  { id: "last_quarter", label: "Trimestre passado" },
  { id: "ytd", label: "Ano até hoje" },
  { id: "last12m", label: "Últimos 12 meses" },
  { id: "this_year", label: "Este ano" },
  { id: "last_year", label: "Ano passado" },
];

/** Converte um preset em intervalo ISO inclusivo, relativo a `now`. */
export function resolvePeriod(preset: PeriodPreset, now: IsoDate = todayIso()): IsoRange {
  switch (preset) {
    case "today":
      return { from: now, to: now };
    case "yesterday":
      return { from: addDays(now, -1), to: addDays(now, -1) };
    case "last7":
      return { from: addDays(now, -6), to: now };
    case "last30":
      return { from: addDays(now, -29), to: now };
    case "last90":
      return { from: addDays(now, -89), to: now };
    case "this_week":
      return { from: startOfWeek(now), to: endOfWeek(now) };
    case "last_week":
      return { from: startOfWeek(addDays(now, -7)), to: endOfWeek(addDays(now, -7)) };
    case "this_month":
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case "last_month": {
      const p = addMonths(startOfMonth(now), -1);
      return { from: p, to: endOfMonth(p) };
    }
    case "this_quarter":
      return { from: startOfQuarter(now), to: endOfQuarter(now) };
    case "last_quarter": {
      const p = addMonths(startOfQuarter(now), -3);
      return { from: p, to: endOfQuarter(p) };
    }
    case "ytd":
      return { from: startOfYear(now), to: now };
    case "last12m":
      return { from: addDays(addMonths(now, -12), 1), to: now };
    case "this_year":
      return { from: startOfYear(now), to: endOfYear(now) };
    case "last_year": {
      const p = addYears(startOfYear(now), -1);
      return { from: p, to: endOfYear(p) };
    }
  }
}

/** Qual preset gera exatamente este intervalo (para marcar a opção ativa). */
export function matchPeriod(range: Partial<IsoRange>, now: IsoDate = todayIso()): PeriodPreset | undefined {
  if (!range.from || !range.to) return undefined;
  return periodPresets.find((p) => {
    const r = resolvePeriod(p.id, now);
    return r.from === range.from && r.to === range.to;
  })?.id;
}

export type CompareMode = "none" | "previous" | "year";
/**
 * Período de comparação: "previous" = mesmo tamanho imediatamente antes
 * (meses cheios comparam com os meses cheios anteriores); "year" = mesmas
 * datas no ano anterior.
 */
export function comparePeriod(range: IsoRange, mode: CompareMode): IsoRange | undefined {
  if (mode === "none") return undefined;
  if (mode === "year") return { from: addYears(range.from, -1), to: addYears(range.to, -1) };
  const wholeMonths = range.from === startOfMonth(range.from) && range.to === endOfMonth(range.to);
  if (wholeMonths) {
    const months = (Number(range.to.slice(0, 4)) - Number(range.from.slice(0, 4))) * 12 + Number(range.to.slice(5, 7)) - Number(range.from.slice(5, 7)) + 1;
    const from = addMonths(range.from, -months);
    return { from, to: endOfMonth(addMonths(from, months - 1)) };
  }
  const len = daysBetween(range.from, range.to) + 1;
  return { from: addDays(range.from, -len), to: addDays(range.from, -1) };
}

/* ------------------------------------------------------------------ */
/* Leitura de texto (digitado ou linguagem natural)                    */
/* ------------------------------------------------------------------ */

const strip = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const weekdayIndex: Record<string, number> = { dom: 0, domingo: 0, seg: 1, segunda: 1, ter: 2, terca: 2, qua: 3, quarta: 3, qui: 4, quinta: 4, sex: 5, sexta: 5, sab: 6, sabado: 6 };
const monthIndex = (s: string) => monthShort.findIndex((m) => strip(s).startsWith(strip(m)));

function validYmd(y: number, m: number, d: number) {
  if (m < 1 || m > 12 || d < 1) return undefined;
  const last = new Date(y, m, 0).getDate();
  return d <= last ? `${y}-${pad(m)}-${pad(d)}` : undefined;
}

/**
 * Entende o que a pessoa digita e devolve ISO (ou undefined):
 *   "30/09/2026" "30/09/26" "30/9" "30092026" "2026-09-30"
 *   "hoje" "amanhã" "depois de amanhã" "ontem"
 *   "sexta" "próxima segunda" "segunda que vem"
 *   "em 3 dias" "em 2 semanas" "em 1 mês" "daqui a 5 dias úteis" "+3d" "-2s" "+1m" "+5du"
 *   "fim do mês" "início do mês" "fim da semana" "fim do ano"
 *   "15 out" "15 de outubro" "15 out 2027"
 */
export function parseDateInput(input: string, now: IsoDate = todayIso()): IsoDate | undefined {
  const s = strip(input).replace(/\s+/g, " ");
  if (!s) return undefined;
  const year = Number(now.slice(0, 4));

  // ISO
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return validYmd(+m[1], +m[2], +m[3]);
  // dd/mm[/aa[aa]]  (também . ou -)
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?$/);
  if (m) {
    const y = m[3] ? (m[3].length === 2 ? 2000 + +m[3] : +m[3]) : year;
    return validYmd(y, +m[2], +m[1]);
  }
  // ddmmaaaa · ddmm
  m = s.match(/^(\d{2})(\d{2})(\d{4})?$/);
  if (m) return validYmd(m[3] ? +m[3] : year, +m[2], +m[1]);

  if (s === "hoje" || s === "hj") return now;
  if (s === "amanha") return addDays(now, 1);
  if (s === "depois de amanha") return addDays(now, 2);
  if (s === "ontem") return addDays(now, -1);
  if (s === "anteontem") return addDays(now, -2);
  if (/^fim (do|deste) mes$/.test(s)) return endOfMonth(now);
  if (/^(inicio|comeco) do mes$/.test(s)) return startOfMonth(now);
  if (/^fim (da|desta) semana$/.test(s)) return addDays(startOfWeek(now), 4);
  if (/^fim do ano$/.test(s)) return endOfYear(now);
  if (/^(inicio|comeco) do (proximo|mes que vem)( mes)?$/.test(s) || s === "proximo mes") return startOfMonth(addMonths(now, 1));

  // +3d  -2s  +1m  +5du
  m = s.match(/^([+-])\s?(\d+)\s?(du|d|s|m|a)$/);
  if (m) {
    const n = (m[1] === "-" ? -1 : 1) * +m[2];
    return m[3] === "du" ? addBusinessDays(now, n) : m[3] === "d" ? addDays(now, n) : m[3] === "s" ? addDays(now, n * 7) : m[3] === "m" ? addMonths(now, n) : addYears(now, n);
  }
  // em 3 dias / daqui a 2 semanas / em 5 dias uteis
  m = s.match(/^(?:em|daqui a|daqui) (\d+|um|uma|dois|duas|tres) (dias? uteis|dias?|semanas?|mes|meses|anos?)$/);
  if (m) {
    const words: Record<string, number> = { um: 1, uma: 1, dois: 2, duas: 2, tres: 3 };
    const n = words[m[1]] ?? +m[1];
    const u = m[2];
    if (u.includes("uteis")) return addBusinessDays(now, n);
    if (u.startsWith("dia")) return addDays(now, n);
    if (u.startsWith("semana")) return addDays(now, 7 * n);
    if (u.startsWith("mes")) return addMonths(now, n);
    return addYears(now, n);
  }
  // há 3 dias
  m = s.match(/^ha (\d+) (dias?|semanas?|mes|meses)$/);
  if (m) return m[2].startsWith("dia") ? addDays(now, -m[1]) : m[2].startsWith("semana") ? addDays(now, -7 * +m[1]) : addMonths(now, -m[1]);

  // "sexta" = próxima sexta (hoje excluído) · "próxima sexta"/"sexta que vem" = sexta da semana que vem · "sexta passada"
  m = s.match(/^(proxima |proximo |esta |nesta )?(dom|domingo|seg|segunda|ter|terca|qua|quarta|qui|quinta|sex|sexta|sab|sabado)(?:-feira)?( que vem| passada| passado)?$/);
  if (m && weekdayIndex[m[2]] != null) {
    const target = weekdayIndex[m[2]];
    const cur = toDate(now).getDay();
    if (m[3] === " passada" || m[3] === " passado") return addDays(now, -((cur - target + 7) % 7 || 7));
    if (m[1]?.startsWith("prox") || m[3] === " que vem") return addDays(startOfWeek(now), 7 + ((target + 6) % 7));
    return addDays(now, (target - cur + 7) % 7 || 7);
  }
  // 15 out / 15 de outubro / 15 out 2027
  m = s.match(/^(\d{1,2})(?: de)? ([a-zç]+)(?:(?: de)? (\d{4}))?$/);
  if (m) {
    const mi = monthIndex(m[2]);
    if (mi >= 0) return validYmd(m[3] ? +m[3] : year, mi + 1, +m[1]);
  }
  return undefined;
}

/** Máscara progressiva dd/mm/aaaa para o que está sendo digitado (só se for numérico). */
export function maskDateTyping(raw: string) {
  if (/[a-zA-ZÀ-ú+]/.test(raw)) return raw; // linguagem natural: não mascara
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/* ------------------------------------------------------------------ */
/* Horário                                                             */
/* ------------------------------------------------------------------ */

/** "9" "930" "9:30" "9h30" "21h" → "09:30" / "21:00". */
export function parseTimeInput(input: string): string | undefined {
  const s = input.trim().toLowerCase().replace(/\s/g, "");
  if (!s) return undefined;
  let m = s.match(/^(\d{1,2})(?:[:h.]?(\d{2}))?h?(?:min)?$/);
  if (!m) m = s.match(/^(\d{1,2})(\d{2})$/);
  if (!m) return undefined;
  const h = +m[1];
  const min = m[2] ? +m[2] : 0;
  if (h > 23 || min > 59) return undefined;
  return `${pad(h)}:${pad(min)}`;
}
/** Lista de horários "HH:MM" entre start e end (inclusive start, exclusivo end) a cada `step` minutos. */
export function timeSlots(start = "00:00", end = "24:00", step = 30) {
  const toMin = (t: string) => +t.slice(0, 2) * 60 + +t.slice(3, 5);
  const out: string[] = [];
  for (let t = toMin(start); t < toMin(end); t += step) out.push(`${pad(Math.floor(t / 60))}:${pad(t % 60)}`);
  return out;
}
export const minutesOf = (hhmm: string) => +hhmm.slice(0, 2) * 60 + +hhmm.slice(3, 5);
export const hhmmOf = (minutes: number) => `${pad(Math.floor(minutes / 60) % 24)}:${pad(minutes % 60)}`;

/** Fuso do navegador legível: "Horário de Brasília (GMT−3)". */
export function describeTimeZone(tz = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "America/Sao_Paulo") {
  const names: Record<string, string> = {
    "America/Sao_Paulo": "Horário de Brasília",
    "America/Manaus": "Horário do Amazonas",
    "America/Cuiaba": "Horário de Cuiabá",
    "America/Recife": "Horário de Recife",
    "America/Fortaleza": "Horário de Fortaleza",
    "America/Belem": "Horário de Belém",
    "America/Rio_Branco": "Horário do Acre",
    "America/Noronha": "Horário de Fernando de Noronha",
  };
  let offset = "";
  try {
    // g4os-ds-disable-next-line number-format -- só para ler o deslocamento ("GMT-3"); não é exibido como data
    const part = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" }).formatToParts(new Date()).find((p) => p.type === "timeZoneName");
    offset = part?.value.replace("-", "−") ?? "";
  } catch {
    /* navegador antigo */
  }
  return `${names[tz] ?? tz.replace(/_/g, " ")}${offset ? ` (${offset})` : ""}`;
}
