"use client";

import { Popover as BasePopover } from "@base-ui/react/popover";
import { ArrowLeft, Bookmark, CalendarDays, Check, ChevronDown, Filter, ListFilter, Plus, RotateCcw, SearchX, SlidersHorizontal, X } from "lucide-react";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { formatCurrency, formatDate, formatNumber } from "../lib/format";
import { usePortalContainer } from "../lib/portal";
import { normalize } from "../lib/text";
import { DatePicker } from "./date-picker";
import { Select } from "./forms";
import { popupClass } from "./overlays";
import { Sheet } from "./overlays-extra";
import { Button } from "./primitives";

/*
 * Filtros: o padrão definitivo para estreitar uma coleção.
 * Regras (docs/padroes/filtros.md, showcase › Filtros e busca):
 *
 *   BUSCA ("/")      texto livre, local à lista. Rápida, tolerante a acento.
 *   FILTRO           estrutura: campo + operador + valor. Combina com a busca (E).
 *   VISÃO SALVA      um conjunto nomeado de busca + filtros ("Meus atrasados").
 *   ⌘K               global: navegar, achar qualquer registro, agir. Não filtra a lista.
 *
 * Anatomia da FilterBar (uma linha; quebra no celular):
 *   [busca] [atalhos de faceta] [+ Filtro] ········ [contagem] [visualização/ordem]
 *   [chips dos filtros ativos …] [Limpar tudo]            ← só aparece com filtros
 *
 * Estado vive na URL (?q=…&f=…): link compartilhável, voltar do navegador
 * funciona, recarregar não perde o recorte.
 */

/* ================================================================== */
/* Modelo                                                              */
/* ================================================================== */

export type FilterType = "text" | "number" | "currency" | "date" | "enum" | "person" | "boolean";
export type FilterOption = { value: string; label: string; icon?: ReactNode; hint?: string };

export type FilterField<T> = {
  key: string;
  label: string;
  type: FilterType;
  /** Valor do campo na linha. enum/person: string ou string[]; date: ISO ou Date. */
  accessor: (row: T) => unknown;
  options?: FilterOption[];
  icon?: ReactNode;
  /** Vira atalho de faceta na barra (enum/person). Use em 1–3 campos, os mais usados. */
  quick?: boolean;
  /** Unidade exibida no chip de número ("dias", "itens"). */
  unit?: string;
};

export type FilterOperator =
  | "contains"
  | "not_contains"
  | "is"
  | "is_not"
  | "empty"
  | "not_empty"
  | "eq"
  | "neq"
  | "gt"
  | "lt"
  | "between"
  | "today"
  | "last7"
  | "last30"
  | "this_month"
  | "range"
  | "me";

export type FilterValue = string | number | string[] | [string | number, string | number] | undefined;
export type FilterCondition = { id: string; field: string; op: FilterOperator; value?: FilterValue };
export type FilterState = { query: string; conditions: FilterCondition[] };
export const emptyFilterState: FilterState = { query: "", conditions: [] };

const OPS: Record<FilterType, { op: FilterOperator; label: string }[]> = {
  text: [
    { op: "contains", label: "contém" },
    { op: "not_contains", label: "não contém" },
    { op: "is", label: "é exatamente" },
    { op: "empty", label: "está vazio" },
    { op: "not_empty", label: "não está vazio" },
  ],
  number: [
    { op: "gt", label: "maior que" },
    { op: "lt", label: "menor que" },
    { op: "between", label: "entre" },
    { op: "eq", label: "igual a" },
    { op: "neq", label: "diferente de" },
    { op: "empty", label: "está vazio" },
  ],
  currency: [
    { op: "gt", label: "maior que" },
    { op: "lt", label: "menor que" },
    { op: "between", label: "entre" },
    { op: "eq", label: "igual a" },
    { op: "neq", label: "diferente de" },
  ],
  date: [
    { op: "today", label: "é hoje" },
    { op: "last7", label: "nos últimos 7 dias" },
    { op: "last30", label: "nos últimos 30 dias" },
    { op: "this_month", label: "neste mês" },
    { op: "range", label: "entre" },
    { op: "lt", label: "antes de" },
    { op: "gt", label: "depois de" },
    { op: "empty", label: "sem data" },
  ],
  enum: [
    { op: "is", label: "é" },
    { op: "is_not", label: "não é" },
  ],
  person: [
    { op: "me", label: "sou eu" },
    { op: "is", label: "é" },
    { op: "is_not", label: "não é" },
    { op: "empty", label: "sem responsável" },
  ],
  boolean: [{ op: "is", label: "é" }],
};

/** Operadores disponíveis por tipo de campo, na ordem de uso mais comum. */
export const filterOperators = (type: FilterType) => OPS[type];
const opLabel = (type: FilterType, op: FilterOperator) => OPS[type].find((o) => o.op === op)?.label ?? op;
const needsValue = (op: FilterOperator) => !["empty", "not_empty", "today", "last7", "last30", "this_month", "me"].includes(op);
const defaultOp = (type: FilterType): FilterOperator => OPS[type][0].op;
/** No painel, o operador inicial não pode parecer um filtro ativo ("sou eu", "é hoje"). */
const sheetOp = (type: FilterType): FilterOperator => (type === "person" ? "is" : type === "date" ? "range" : defaultOp(type));

let uid = 0;
const newId = () => `c${Date.now().toString(36)}${(uid++).toString(36)}`;

/* ------------------------------------------------------------------ */
/* Avaliação                                                           */
/* ------------------------------------------------------------------ */

export type FilterContext = { me?: string; now?: Date };

const toTime = (v: unknown) => {
  if (v == null || v === "") return NaN;
  if (v instanceof Date) return v.getTime();
  const s = String(v);
  return new Date(/^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T00:00:00` : s).getTime();
};
const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

function matches<T>(field: FilterField<T>, c: FilterCondition, row: T, ctx: FilterContext) {
  const raw = field.accessor(row);
  const isEmpty = raw == null || raw === "" || (Array.isArray(raw) && raw.length === 0);
  if (c.op === "empty") return isEmpty;
  if (c.op === "not_empty") return !isEmpty;
  switch (field.type) {
    case "text": {
      const hay = normalize(String(raw ?? ""));
      const v = normalize(String(c.value ?? ""));
      if (c.op === "contains") return hay.includes(v);
      if (c.op === "not_contains") return !hay.includes(v);
      if (c.op === "is") return hay === v;
      return true;
    }
    case "number":
    case "currency": {
      const n = Number(raw);
      if (Number.isNaN(n)) return false;
      if (c.op === "between" && Array.isArray(c.value)) {
        const [a, b] = c.value.map(Number);
        return (Number.isNaN(a) || n >= a) && (Number.isNaN(b) || n <= b);
      }
      const v = Number(c.value);
      if (c.op === "eq") return n === v;
      if (c.op === "neq") return n !== v;
      if (c.op === "gt") return n > v;
      if (c.op === "lt") return n < v;
      return true;
    }
    case "date": {
      const t = toTime(raw);
      if (Number.isNaN(t)) return false;
      const now = ctx.now ?? new Date();
      const today = dayStart(now);
      const day = 86400000;
      if (c.op === "today") return t >= today && t < today + day;
      if (c.op === "last7") return t >= today - 6 * day && t < today + day;
      if (c.op === "last30") return t >= today - 29 * day && t < today + day;
      if (c.op === "this_month") {
        const d = new Date(t);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      }
      if (c.op === "range" && Array.isArray(c.value)) {
        const a = toTime(c.value[0]);
        const b = toTime(c.value[1]);
        return (Number.isNaN(a) || t >= a) && (Number.isNaN(b) || t < b + day);
      }
      if (c.op === "lt") return t < toTime(c.value);
      if (c.op === "gt") return t >= toTime(c.value) + day;
      return true;
    }
    case "enum":
    case "person":
    case "boolean": {
      const vals = (Array.isArray(raw) ? raw : [raw]).map((x) => String(x));
      if (c.op === "me") return ctx.me != null && vals.includes(ctx.me);
      const want = Array.isArray(c.value) ? c.value.map(String) : c.value == null ? [] : [String(c.value)];
      if (!want.length) return true;
      const hit = vals.some((v) => want.includes(v));
      return c.op === "is_not" ? !hit : hit;
    }
  }
  return true;
}

/** Filtro vazio (sem valor ainda) não restringe nada. */
function isComplete(c: FilterCondition) {
  if (!needsValue(c.op)) return true;
  if (Array.isArray(c.value)) return c.value.some((v) => v !== "" && v != null);
  return c.value !== undefined && c.value !== "";
}

/** Busca textual: todas as palavras precisam aparecer em algum dos textos (E). */
export function matchesQuery(query: string, texts: (string | number | null | undefined)[]) {
  const words = normalize(query).trim().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const hay = normalize(texts.filter((t) => t != null).join(" "));
  return words.every((w) => hay.includes(w));
}

/**
 * Aplica busca + filtros (tudo em E). Função pura: use no cliente ou
 * espelhe a mesma semântica no servidor.
 */
export function applyFilters<T>(rows: T[], fields: FilterField<T>[], state: FilterState, options: FilterContext & { search?: (row: T) => (string | number | null | undefined)[] } = {}) {
  const active = state.conditions.filter(isComplete);
  return rows.filter((row) => {
    if (state.query && options.search && !matchesQuery(state.query, options.search(row))) return false;
    for (const c of active) {
      const f = fields.find((x) => x.key === c.field);
      if (f && !matches(f, c, row, options)) return false;
    }
    return true;
  });
}

/* ------------------------------------------------------------------ */
/* Descrição (chip)                                                    */
/* ------------------------------------------------------------------ */

function valueText<T>(field: FilterField<T>, c: FilterCondition, ctx: FilterContext): string {
  if (!needsValue(c.op)) return "";
  const fmt = (v: string | number) =>
    field.type === "currency" ? formatCurrency(Number(v), { compact: Number(v) >= 10000 }) : field.type === "number" ? `${formatNumber(Number(v))}${field.unit ? ` ${field.unit}` : ""}` : field.type === "date" ? formatDate(String(v), { short: true }) : String(v);
  if (field.type === "enum" || field.type === "person" || field.type === "boolean") {
    const vals = Array.isArray(c.value) ? c.value.map(String) : c.value == null ? [] : [String(c.value)];
    const labels = vals.map((v) => (field.type === "person" && v === ctx.me ? "eu" : field.options?.find((o) => o.value === v)?.label ?? v));
    return labels.length > 2 ? `${labels.slice(0, 2).join(", ")} +${labels.length - 2}` : labels.join(", ");
  }
  if (Array.isArray(c.value)) {
    const [a, b] = c.value;
    const ha = a !== "" && a != null;
    const hb = b !== "" && b != null;
    if (ha && hb) return `${fmt(a)} e ${fmt(b)}`;
    if (ha) return `≥ ${fmt(a)}`;
    if (hb) return `≤ ${fmt(b)}`;
    return "…";
  }
  return c.value == null || c.value === "" ? "…" : fmt(c.value as string | number);
}

/** "Status é Ativo, Pendente" — texto do chip e do leitor de tela. */
export function describeCondition<T>(field: FilterField<T>, c: FilterCondition, ctx: FilterContext = {}) {
  const v = valueText(field, c, ctx);
  const op = field.type === "number" || field.type === "currency" ? { gt: ">", lt: "<", eq: "=", neq: "≠", between: "entre", empty: "vazio" }[c.op as string] ?? opLabel(field.type, c.op) : opLabel(field.type, c.op);
  return { field: field.label, op, value: v, text: `${field.label} ${op}${v ? ` ${v}` : ""}` };
}

/* ================================================================== */
/* Estado + URL                                                        */
/* ================================================================== */

/** Serializa para querystring: q=texto & f=campo~op~valor (valores múltiplos com "|", faixa com ".."). */
export function serializeFilters(state: FilterState) {
  const p = new URLSearchParams();
  if (state.query) p.set("q", state.query);
  for (const c of state.conditions.filter(isComplete)) {
    let v = "";
    if (Array.isArray(c.value)) v = c.op === "between" || c.op === "range" ? `${c.value[0] ?? ""}..${c.value[1] ?? ""}` : c.value.join("|");
    else if (c.value != null) v = String(c.value);
    p.append("f", `${c.field}~${c.op}${v ? `~${v}` : ""}`);
  }
  return p;
}

export function parseFilters(params: URLSearchParams): FilterState {
  const conditions: FilterCondition[] = params.getAll("f").flatMap((f) => {
    const [field, op, ...rest] = f.split("~");
    if (!field || !op) return [];
    const raw = rest.join("~");
    let value: FilterValue;
    if (op === "between" || op === "range") {
      const [a, b] = raw.split("..");
      value = [a ?? "", b ?? ""];
    } else if (op === "is" || op === "is_not") value = raw ? raw.split("|") : [];
    else value = raw || undefined;
    return [{ id: newId(), field, op: op as FilterOperator, value }];
  });
  return { query: params.get("q") ?? "", conditions };
}

/**
 * Espelha o estado na URL (location.search) sem recarregar e sem mexer no
 * hash nem em outros parâmetros. `prefix` separa duas listas na mesma tela.
 */
export function useUrlFilters(state: FilterState, setState: (s: FilterState) => void, { enabled = true, prefix = "" }: { enabled?: boolean; prefix?: string } = {}) {
  const loaded = useRef(false);
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const mine = new URLSearchParams();
    url.searchParams.forEach((v, k) => {
      if (k === `${prefix}q`) mine.append("q", v);
      if (k === `${prefix}f`) mine.append("f", v);
    });
    if (mine.toString()) setState(parseFilters(mine));
    loaded.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, prefix]);
  useEffect(() => {
    if (!enabled || !loaded.current || typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.delete(`${prefix}q`);
    url.searchParams.delete(`${prefix}f`);
    serializeFilters(state).forEach((v, k) => url.searchParams.append(`${prefix}${k}`, v));
    if (url.href !== window.location.href) window.history.replaceState(window.history.state, "", url);
  }, [state, enabled, prefix]);
}

export type FiltersApi<T> = ReturnType<typeof useFilters<T>>;

/**
 * Estado de busca + filtros de uma coleção.
 *
 *   const filters = useFilters(deals, { fields, search: (d) => [d.name, d.company], me: "ana", url: true });
 *   filters.rows      // já filtradas
 *   <FilterBar filters={filters} … />
 */
export function useFilters<T>(
  rows: T[],
  options: {
    fields: FilterField<T>[];
    /** Textos pesquisáveis pela busca livre. */
    search?: (row: T) => (string | number | null | undefined)[];
    initial?: FilterState;
    /** Pessoa atual, para "sou eu". */
    me?: string;
    now?: Date;
    /** Sincroniza com a URL. true ou prefixo ("c_") se houver 2 listas. */
    url?: boolean | string;
  },
) {
  const { fields, search, me, now } = options;
  const [state, setState] = useState<FilterState>(options.initial ?? emptyFilterState);
  useUrlFilters(state, setState, { enabled: !!options.url, prefix: typeof options.url === "string" ? options.url : "" });
  const ctx = useMemo(() => ({ me, now, search }), [me, now, search]);
  const filtered = useMemo(() => applyFilters(rows, fields, state, ctx), [rows, fields, state, ctx]);
  const active = state.conditions.filter(isComplete);
  const countFor = useCallback((s: FilterState) => applyFilters(rows, fields, s, ctx).length, [rows, fields, ctx]);

  return {
    fields,
    state,
    setState,
    rows: filtered,
    total: rows.length,
    shown: filtered.length,
    /** Filtros com valor (os que restringem). */
    active,
    dirty: !!state.query || active.length > 0,
    me,
    countFor,
    setQuery: (query: string) => setState((s) => ({ ...s, query })),
    add: (c: Omit<FilterCondition, "id">) => setState((s) => ({ ...s, conditions: [...s.conditions, { ...c, id: newId() }] })),
    update: (id: string, patch: Partial<FilterCondition>) => setState((s) => ({ ...s, conditions: s.conditions.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
    remove: (id: string) => setState((s) => ({ ...s, conditions: s.conditions.filter((c) => c.id !== id) })),
    removeLast: () => setState((s) => ({ ...s, conditions: s.conditions.slice(0, -1) })),
    clear: () => setState(emptyFilterState),
    /** Define (ou remove, com lista vazia) o filtro "é" de um campo — usado pelos atalhos de faceta. */
    setFacet: (field: string, values: string[]) =>
      setState((s) => {
        const rest = s.conditions.filter((c) => !(c.field === field && c.op === "is"));
        if (!values.length) return { ...s, conditions: rest };
        const existing = s.conditions.find((c) => c.field === field && c.op === "is");
        return { ...s, conditions: existing ? s.conditions.map((c) => (c === existing ? { ...c, value: values } : c)) : [...rest, { id: newId(), field, op: "is", value: values }] };
      }),
    facetValue: (field: string) => {
      const c = state.conditions.find((x) => x.field === field && x.op === "is");
      return Array.isArray(c?.value) ? c.value.map(String) : [];
    },
    describe: (c: FilterCondition) => {
      const f = fields.find((x) => x.key === c.field);
      return f ? describeCondition(f, c, { me }) : { field: c.field, op: c.op, value: "", text: c.field };
    },
  };
}

/* ================================================================== */
/* Peças visuais                                                       */
/* ================================================================== */

const popup = cn(popupClass, "bg-popover");
const chipBase =
  "inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-[12.5px] ring-1 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent/40";

/** Popover controlado com o posicionamento padrão do DS. */
function Pop({
  open,
  onOpenChange,
  trigger,
  triggerClassName,
  triggerLabel,
  children,
  width = 300,
  align = "start",
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  trigger: ReactNode;
  triggerClassName?: string;
  triggerLabel?: string;
  children: ReactNode;
  width?: number;
  align?: "start" | "end" | "center";
}) {
  const [ref, container] = usePortalContainer();
  return (
    <BasePopover.Root open={open} onOpenChange={onOpenChange}>
      <BasePopover.Trigger ref={ref} aria-label={triggerLabel} className={triggerClassName}>
        {trigger}
      </BasePopover.Trigger>
      <BasePopover.Portal container={container}>
        <BasePopover.Positioner sideOffset={6} align={align} collisionPadding={8} className="z-[100]">
          <BasePopover.Popup className={cn(popup, "max-w-[calc(100vw-16px)] overflow-hidden")} style={{ width }}>
            {children}
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </BasePopover.Root>
  );
}

/* ------------------------------------------------------------------ */
/* Highlight                                                           */
/* ------------------------------------------------------------------ */

/**
 * Destaca os trechos buscados, ignorando acento e caixa ("joao" acha
 * "João"). Use nas células da coluna principal e nos resultados do ⌘K.
 */
export function Highlight({ text, query, className }: { text: string; query: string; className?: string }) {
  const parts = useMemo(() => {
    const words = normalize(query).trim().split(/\s+/).filter((w) => w.length > 0);
    if (!words.length || !text) return null;
    // mapa: posição no texto normalizado → posição no original
    let norm = "";
    const map: number[] = [];
    for (let i = 0; i < text.length; i++) {
      const n = normalize(text[i]);
      for (let k = 0; k < n.length; k++) {
        norm += n[k];
        map.push(i);
      }
    }
    const marks: [number, number][] = [];
    for (const w of words) {
      let from = 0;
      let at = norm.indexOf(w, from);
      while (at !== -1) {
        marks.push([map[at], map[at + w.length - 1] + 1]);
        from = at + w.length;
        at = norm.indexOf(w, from);
      }
    }
    if (!marks.length) return null;
    marks.sort((a, b) => a[0] - b[0]);
    const merged: [number, number][] = [];
    for (const m of marks) {
      const last = merged[merged.length - 1];
      if (last && m[0] <= last[1]) last[1] = Math.max(last[1], m[1]);
      else merged.push([...m]);
    }
    const out: { t: string; hit: boolean }[] = [];
    let pos = 0;
    for (const [a, b] of merged) {
      if (a > pos) out.push({ t: text.slice(pos, a), hit: false });
      out.push({ t: text.slice(a, b), hit: true });
      pos = b;
    }
    if (pos < text.length) out.push({ t: text.slice(pos), hit: false });
    return out;
  }, [text, query]);
  if (!parts) return <span className={className}>{text}</span>;
  return (
    <span className={className}>
      {parts.map((p, i) =>
        p.hit ? (
          <mark key={i} className="rounded-[3px] bg-accent-soft px-px text-inherit ring-1 ring-accent/25 [color:inherit]">
            {p.t}
          </mark>
        ) : (
          <Fragment key={i}>{p.t}</Fragment>
        ),
      )}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Editor de valor                                                     */
/* ------------------------------------------------------------------ */

const inputCls = "h-9 w-full min-w-0 rounded-lg border border-line bg-surface px-2.5 text-[13px] text-ink outline-none placeholder:text-muted";

function OptionList({ options, value, onChange, me, autoFocus }: { options: FilterOption[]; value: string[]; onChange: (v: string[]) => void; me?: string; autoFocus?: boolean }) {
  const [q, setQ] = useState("");
  const list = options.filter((o) => matchesQuery(q, [o.label, o.hint]));
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <div>
      {options.length > 7 && <input autoFocus={autoFocus} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar opção…" aria-label="Buscar opção" className={cn(inputCls, "mb-1.5 h-8 bg-soft")} />}
      <div className="-mx-1 max-h-[240px] overflow-y-auto" role="group">
        {list.map((o) => {
          const on = value.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              role="menuitemcheckbox"
              aria-checked={on}
              onClick={() => toggle(o.value)}
              className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[13px] hover:bg-soft focus-visible:bg-soft focus-visible:outline-none"
            >
              <span className={cn("grid h-4 w-4 shrink-0 place-items-center rounded-[4px] ring-1", on ? "bg-primary text-on-primary ring-primary" : "ring-line-strong")}>{on && <Check className="h-3 w-3" strokeWidth={2.5} />}</span>
              {o.icon && <span className="shrink-0 text-muted [&_svg]:h-3.5 [&_svg]:w-3.5">{o.icon}</span>}
              <span className="min-w-0 flex-1 truncate">
                {o.label}
                {me && o.value === me && <span className="text-muted"> (eu)</span>}
              </span>
              {o.hint && <span className="shrink-0 text-[11.5px] tabular-nums text-muted">{o.hint}</span>}
            </button>
          );
        })}
        {!list.length && <p className="m-0 px-2 py-2 text-[12.5px] text-muted">Nenhuma opção com “{q}”.</p>}
      </div>
    </div>
  );
}

/** Editor de um filtro: operador + valor, pelo tipo do campo. */
export function ConditionEditor<T>({ field, value, onChange, me, autoFocus = true }: { field: FilterField<T>; value: FilterCondition; onChange: (c: FilterCondition) => void; me?: string; autoFocus?: boolean }) {
  const ops = OPS[field.type];
  const set = (patch: Partial<FilterCondition>) => onChange({ ...value, ...patch });
  const pair = (Array.isArray(value.value) ? value.value : ["", ""]) as [string | number, string | number];
  const numInput = (v: string | number | undefined, on: (s: string) => void, label: string) => (
    <div className="relative min-w-0 flex-1">
      {field.type === "currency" && <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[12.5px] text-muted">R$</span>}
      <input
        type="number"
        inputMode="decimal"
        aria-label={label}
        autoFocus={autoFocus && label !== "Até"}
        value={v ?? ""}
        onChange={(e) => on(e.target.value)}
        className={cn(inputCls, "tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none", field.type === "currency" && "pl-8")}
        placeholder={field.type === "currency" ? "0" : "0"}
      />
    </div>
  );
  return (
    <div className="space-y-2.5">
      {ops.length > 1 && (
        <Select
          label="Operador"
          size="compact"
          value={value.op}
          onValueChange={(op) => {
            const o = op as FilterOperator;
            const keepArray = ["is", "is_not"].includes(o) && Array.isArray(value.value);
            set({ op: o, value: o === "between" || o === "range" ? ["", ""] : keepArray ? value.value : ["is", "is_not"].includes(o) ? [] : undefined });
          }}
          options={ops.map((o) => ({ value: o.op, label: o.label }))}
          className="w-full"
        />
      )}
      {needsValue(value.op) && (
        <>
          {field.type === "text" && <input autoFocus={autoFocus} value={String(value.value ?? "")} onChange={(e) => set({ value: e.target.value })} placeholder="Digite um valor…" aria-label={`Valor de ${field.label}`} className={inputCls} />}
          {(field.type === "number" || field.type === "currency") &&
            (value.op === "between" ? (
              <div className="flex items-center gap-2">
                {numInput(pair[0], (s) => set({ value: [s, pair[1]] }), "De")}
                <span className="text-[12px] text-muted">e</span>
                {numInput(pair[1], (s) => set({ value: [pair[0], s] }), "Até")}
              </div>
            ) : (
              numInput(value.value as string | number | undefined, (s) => set({ value: s }), `Valor de ${field.label}`)
            ))}
          {field.type === "date" &&
            (value.op === "range" ? (
              <div className="grid grid-cols-2 gap-2">
                <DatePicker label="De" value={String(pair[0] ?? "")} onValueChange={(v) => set({ value: [v, pair[1]] })} placeholder="De" className="w-full" />
                <DatePicker label="Até" value={String(pair[1] ?? "")} onValueChange={(v) => set({ value: [pair[0], v] })} placeholder="Até" className="w-full" />
              </div>
            ) : (
              <DatePicker label={field.label} value={String(value.value ?? "")} onValueChange={(v) => set({ value: v })} className="w-full" />
            ))}
          {(field.type === "enum" || field.type === "person" || field.type === "boolean") && (
            <OptionList
              autoFocus={autoFocus}
              me={field.type === "person" ? me : undefined}
              options={field.type === "boolean" && !field.options ? [{ value: "true", label: "Sim" }, { value: "false", label: "Não" }] : field.options ?? []}
              value={Array.isArray(value.value) ? value.value.map(String) : []}
              onChange={(v) => set({ value: v })}
            />
          )}
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* + Filtro                                                            */
/* ------------------------------------------------------------------ */

/**
 * "+ Filtro": escolhe o campo (com busca), depois operador e valor, e aplica.
 * Dois passos no mesmo popover; ← volta para a lista de campos.
 */
export function AddFilterMenu<T>({ filters, label = "Filtro", compact }: { filters: FiltersApi<T>; label?: string; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [field, setField] = useState<FilterField<T> | null>(null);
  const [draft, setDraft] = useState<FilterCondition | null>(null);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const list = filters.fields.filter((f) => matchesQuery(q, [f.label]));
  const pick = (f: FilterField<T>) => {
    setField(f);
    setDraft({ id: "draft", field: f.key, op: defaultOp(f.type), value: f.type === "enum" || f.type === "person" || f.type === "boolean" ? [] : undefined });
  };
  const reset = () => {
    setField(null);
    setDraft(null);
    setQ("");
    setActive(0);
  };
  const apply = () => {
    if (!draft || !isComplete(draft)) return;
    filters.add({ field: draft.field, op: draft.op, value: draft.value });
    setOpen(false);
    reset();
  };
  const typeHint: Record<FilterType, string> = { text: "Texto", number: "Número", currency: "Valor", date: "Data", enum: "Lista", person: "Pessoa", boolean: "Sim/não" };
  return (
    <Pop
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
      width={field ? 300 : 260}
      triggerLabel={compact ? "Adicionar filtro" : undefined}
      triggerClassName={cn(chipBase, "h-10 border-dashed bg-surface text-ink-soft ring-line hover:bg-soft hover:text-ink data-popup-open:bg-soft", compact && "w-10 justify-center px-0")}
      trigger={
        <>
          <Plus className="h-3.5 w-3.5" />
          {!compact && label}
        </>
      }
    >
      {!field ? (
        <div
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(list.length - 1, a + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(0, a - 1));
            } else if (e.key === "Enter" && list[active]) {
              e.preventDefault();
              pick(list[active]);
            }
          }}
        >
          <div className="border-b border-line p-2">
            <input
              autoFocus
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setActive(0);
              }}
              placeholder="Filtrar por…"
              aria-label="Buscar campo"
              className="h-8 w-full rounded-md bg-soft px-2.5 text-[13px] outline-none placeholder:text-muted"
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto p-1" role="listbox" aria-label="Campos">
            {list.map((f, i) => (
              <button
                key={f.key}
                type="button"
                role="option"
                aria-selected={i === active}
                onPointerMove={() => setActive(i)}
                onClick={() => pick(f)}
                className={cn("flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[13px]", i === active && "bg-soft")}
              >
                <span className="grid h-5 w-5 shrink-0 place-items-center text-muted [&_svg]:h-3.5 [&_svg]:w-3.5">{f.icon ?? <ListFilter />}</span>
                <span className="min-w-0 flex-1 truncate">{f.label}</span>
                <span className="text-[11px] text-muted">{typeHint[f.type]}</span>
              </button>
            ))}
            {!list.length && <p className="m-0 px-2 py-3 text-[12.5px] text-muted">Nenhum campo com “{q}”.</p>}
          </div>
        </div>
      ) : (
        <form
          className="p-3"
          onSubmit={(e) => {
            e.preventDefault();
            apply();
          }}
        >
          <div className="mb-2.5 flex items-center gap-1.5">
            <button type="button" onClick={reset} aria-label="Voltar para os campos" className="-ml-1 grid h-6 w-6 place-items-center rounded-md text-muted hover:bg-soft hover:text-ink">
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
            <span className="text-[13px] font-medium">{field.label}</span>
          </div>
          {draft && <ConditionEditor field={field} value={draft} onChange={setDraft} me={filters.me} />}
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-[11.5px] tabular-nums text-muted" aria-live="polite">
              {draft && isComplete(draft) ? `${formatNumber(filters.countFor({ ...filters.state, conditions: [...filters.state.conditions, draft] }))} resultados` : ""}
            </span>
            <Button type="submit" size="sm" disabled={!draft || !isComplete(draft)}>
              Aplicar
            </Button>
          </div>
        </form>
      )}
    </Pop>
  );
}

/* ------------------------------------------------------------------ */
/* Chip de filtro ativo                                                */
/* ------------------------------------------------------------------ */

/** Filtro aplicado: clique edita, × remove. Texto = campo + operador + valor. */
export function ActiveFilterChip<T>({ filters, condition }: { filters: FiltersApi<T>; condition: FilterCondition }) {
  const [open, setOpen] = useState(false);
  const field = filters.fields.find((f) => f.key === condition.field);
  const [draft, setDraft] = useState(condition);
  useEffect(() => setDraft(condition), [condition]);
  if (!field) return null;
  const d = filters.describe(condition);
  return (
    <span className="inline-flex h-8 items-stretch overflow-hidden rounded-lg bg-surface text-[12.5px] ring-1 ring-line-strong">
      <Pop
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o && isComplete(draft)) filters.update(condition.id, { op: draft.op, value: draft.value });
        }}
        width={300}
        triggerLabel={`Editar filtro: ${d.text}`}
        triggerClassName="inline-flex min-w-0 items-center gap-1 px-2.5 hover:bg-soft data-popup-open:bg-soft"
        trigger={
          <>
            {field.icon && <span className="shrink-0 text-muted [&_svg]:h-3.5 [&_svg]:w-3.5">{field.icon}</span>}
            <span className="text-muted">{d.field}</span>
            <span className="text-muted">{d.op}</span>
            {d.value && <span className="max-w-[180px] truncate font-medium text-ink">{d.value}</span>}
          </>
        }
      >
        <div className="p-3">
          <p className="m-0 mb-2.5 text-[13px] font-medium">{field.label}</p>
          <ConditionEditor field={field} value={draft} onChange={setDraft} me={filters.me} />
          <div className="mt-3 flex justify-end">
            <Button
              size="sm"
              disabled={!isComplete(draft)}
              onClick={() => {
                filters.update(condition.id, { op: draft.op, value: draft.value });
                setOpen(false);
              }}
            >
              Aplicar
            </Button>
          </div>
        </div>
      </Pop>
      <button type="button" aria-label={`Remover filtro: ${d.text}`} onClick={() => filters.remove(condition.id)} className="grid w-7 place-items-center border-l border-line text-muted hover:bg-soft hover:text-ink">
        <X className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Atalho de faceta                                                    */
/* ------------------------------------------------------------------ */

/** Botão de faceta na barra (Status ▾). Ativo = rótulo com os valores. */
export function QuickFilter<T>({ filters, field }: { filters: FiltersApi<T>; field: FilterField<T> }) {
  const [open, setOpen] = useState(false);
  const value = filters.facetValue(field.key);
  const options = field.options ?? [];
  const labels = value.map((v) => (field.type === "person" && v === filters.me ? "Eu" : options.find((o) => o.value === v)?.label ?? v));
  return (
    <Pop
      open={open}
      onOpenChange={setOpen}
      width={260}
      triggerClassName={cn(chipBase, "h-10 bg-surface data-popup-open:bg-soft", value.length ? "font-medium text-ink ring-line-strong" : "text-ink-soft ring-line hover:bg-soft hover:text-ink")}
      trigger={
        <>
          {value.length > 0 ? <span className="text-muted">{field.label}:</span> : field.label}
          {value.length > 0 && (
            <>
              <span className="max-w-[140px] truncate">{labels.length > 1 ? `${labels[0]} +${labels.length - 1}` : labels[0]}</span>
            </>
          )}
          <ChevronDown className="h-3.5 w-3.5 text-muted" />
        </>
      }
    >
      <div className="p-2">
        <OptionList autoFocus options={options} value={value} onChange={(v) => filters.setFacet(field.key, v)} me={field.type === "person" ? filters.me : undefined} />
        {field.type === "person" && filters.me && (
          <button type="button" onClick={() => filters.setFacet(field.key, [filters.me!])} className="mt-1 w-full rounded-md px-2 py-1.5 text-left text-[12.5px] text-blue hover:bg-soft">
            Só os meus
          </button>
        )}
      </div>
      {value.length > 0 && (
        <button type="button" onClick={() => filters.setFacet(field.key, [])} className="flex w-full items-center gap-2 border-t border-line px-3 py-2 text-left text-[12.5px] text-muted hover:bg-soft hover:text-ink">
          <X className="h-3.5 w-3.5" /> Limpar {field.label.toLowerCase()}
        </button>
      )}
    </Pop>
  );
}

/* ------------------------------------------------------------------ */
/* Painel de filtros (celular / avançado)                              */
/* ------------------------------------------------------------------ */

/**
 * Todos os campos num Sheet (folha inferior no celular). Edita um rascunho
 * e só aplica em "Aplicar (N)": o número mostra quantos resultados virão.
 */
export function FilterSheet<T>({ filters, open, onClose, noun = "resultado", nounPlural }: { filters: FiltersApi<T>; open: boolean; onClose: () => void; noun?: string; nounPlural?: string }) {
  const [draft, setDraft] = useState<FilterState>(filters.state);
  useEffect(() => {
    if (open) setDraft(filters.state);
  }, [open, filters.state]);
  const count = filters.countFor(draft);
  const condFor = (f: FilterField<T>) => draft.conditions.find((c) => c.field === f.key);
  const setCond = (f: FilterField<T>, c: FilterCondition | null) =>
    setDraft((d) => ({ ...d, conditions: c ? (condFor(f) ? d.conditions.map((x) => (x.field === f.key ? c : x)) : [...d.conditions, c]) : d.conditions.filter((x) => x.field !== f.key) }));
  const activeCount = draft.conditions.filter(isComplete).length;
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Filtros"
      description={activeCount ? `${activeCount} ${activeCount === 1 ? "filtro ativo" : "filtros ativos"}` : "Nenhum filtro ativo"}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={() => setDraft({ ...draft, conditions: [] })} disabled={!activeCount}>
            Limpar
          </Button>
          <Button
            size="sm"
            onClick={() => {
              filters.setState(draft);
              onClose();
            }}
          >
            Aplicar ({formatNumber(count)} {count === 1 ? noun : nounPlural ?? `${noun}s`})
          </Button>
        </>
      }
    >
      <div className="divide-y divide-line">
        {filters.fields.map((f) => {
          const c = condFor(f);
          return (
            <section key={f.key} className="py-4 first:pt-0 last:pb-0">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="m-0 flex items-center gap-2 text-[13px] font-medium">
                  {f.icon && <span className="text-muted [&_svg]:h-3.5 [&_svg]:w-3.5">{f.icon}</span>}
                  {f.label}
                </h3>
                {c && (
                  <button type="button" onClick={() => setCond(f, null)} className="text-[12px] text-muted hover:text-ink">
                    Limpar
                  </button>
                )}
              </div>
              <ConditionEditor
                autoFocus={false}
                field={f}
                me={filters.me}
                value={c ?? { id: `d-${f.key}`, field: f.key, op: sheetOp(f.type), value: f.type === "enum" || f.type === "person" || f.type === "boolean" ? [] : f.type === "date" ? ["", ""] : undefined }}
                onChange={(next) => setCond(f, isComplete(next) || next.op !== sheetOp(f.type) ? { ...next, id: c?.id ?? newId() } : null)}
              />
            </section>
          );
        })}
      </div>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/* FilterBar                                                           */
/* ------------------------------------------------------------------ */

/**
 * Barra de filtros de uma lista. Uma linha: busca, atalhos de faceta
 * (campos com `quick`), "+ Filtro", contagem e controles de exibição à
 * direita. Filtros ativos aparecem como chips na linha de baixo.
 * Abaixo de 640px, atalhos e "+ Filtro" viram um botão "Filtros (N)" que
 * abre o FilterSheet.
 */
export function FilterBar<T>({
  filters,
  search,
  actions,
  noun = "resultado",
  nounPlural,
  showCount = true,
  className,
}: {
  filters: FiltersApi<T>;
  /** Normalmente <TableSearch …/> ligado a filters.state.query. */
  search?: ReactNode;
  /** Controles à direita: visualização, densidade, ordenação, exportar. */
  actions?: ReactNode;
  noun?: string;
  nounPlural?: string;
  showCount?: boolean;
  className?: string;
}) {
  const [sheet, setSheet] = useState(false);
  const quick = filters.fields.filter((f) => f.quick && (f.type === "enum" || f.type === "person"));
  const quickKeys = new Set(quick.map((f) => f.key));
  // chips: tudo que não é a faceta "é" de um campo rápido (essa já aparece no botão)
  const chips = filters.state.conditions.filter((c) => isComplete(c) && !(quickKeys.has(c.field) && c.op === "is"));
  const plural = nounPlural ?? `${noun}s`;
  const count = filters.shown === filters.total ? `${formatNumber(filters.total)} ${filters.total === 1 ? noun : plural}` : `${formatNumber(filters.shown)} de ${formatNumber(filters.total)} ${filters.total === 1 ? noun : plural}`;
  return (
    <div className={cn("space-y-2.5", className)} role="search" aria-label="Busca e filtros">
      <div className="flex flex-wrap items-center gap-2">
        {search && <div className="min-w-0 basis-full sm:basis-auto sm:min-w-[240px] sm:max-w-[360px] sm:flex-1">{search}</div>}
        <div className="hidden flex-wrap items-center gap-2 sm:flex">
          {quick.map((f) => (
            <QuickFilter key={f.key} filters={filters} field={f} />
          ))}
          <AddFilterMenu filters={filters} />
        </div>
        <button
          type="button"
          onClick={() => setSheet(true)}
          className={cn(chipBase, "h-10 bg-surface sm:hidden", filters.active.length ? "font-medium text-ink ring-line-strong" : "text-ink-soft ring-line")}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filtros
          {filters.active.length > 0 && <span className="rounded-md bg-primary px-1.5 text-[11px] font-medium text-on-primary">{filters.active.length}</span>}
        </button>
        <div className="ml-auto flex items-center gap-2">
          {showCount && (
            <span aria-live="polite" className="whitespace-nowrap text-[12px] tabular-nums text-muted">
              {count}
            </span>
          )}
          {actions}
        </div>
      </div>
      {chips.length > 0 && (
        <div className="hidden flex-wrap items-center gap-1.5 sm:flex" aria-label="Filtros ativos">
          {chips.map((c) => (
            <ActiveFilterChip key={c.id} filters={filters} condition={c} />
          ))}
          <button type="button" onClick={filters.clear} className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-[12.5px] text-muted hover:bg-soft hover:text-ink">
            <RotateCcw className="h-3.5 w-3.5" /> Limpar tudo
          </button>
        </div>
      )}
      {filters.active.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 sm:hidden">
          {filters.active.map((c) => (
            <ActiveFilterChip key={c.id} filters={filters} condition={c} />
          ))}
        </div>
      )}
      <FilterSheet filters={filters} open={sheet} onClose={() => setSheet(false)} noun={noun} nounPlural={plural} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Visões salvas                                                       */
/* ------------------------------------------------------------------ */

export type SavedView = { id: string; label: string; state: FilterState; /** Visão do sistema: não pode ser editada nem excluída. */ system?: boolean };

const sameState = (a: FilterState, b: FilterState) => serializeFilters(a).toString() === serializeFilters(b).toString();

/**
 * Visões salvas de uma lista. As do sistema vêm do código; as da pessoa
 * ficam no localStorage (troque `storageKey` por persistência no servidor
 * se precisar compartilhar com o time).
 */
export function useSavedViews<T>(filters: FiltersApi<T>, initial: SavedView[], storageKey?: string) {
  const [custom, setCustom] = useState<SavedView[]>(() => {
    if (!storageKey || typeof window === "undefined") return [];
    try {
      return JSON.parse(window.localStorage.getItem(storageKey) ?? "[]");
    } catch {
      return [];
    }
  });
  const views = [...initial, ...custom];
  const [activeId, setActiveId] = useState<string>(() => views.find((v) => sameState(v.state, filters.state))?.id ?? initial[0]?.id ?? "");
  const active = views.find((v) => v.id === activeId);
  const dirty = !!active && !sameState(active.state, filters.state);
  const persist = (next: SavedView[]) => {
    setCustom(next);
    if (storageKey)
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* armazenamento indisponível: a visão vale só nesta sessão */
      }
  };
  return {
    views,
    active,
    activeId,
    dirty,
    select: (id: string) => {
      const v = views.find((x) => x.id === id);
      if (!v) return;
      setActiveId(id);
      filters.setState(v.state);
    },
    saveAs: (label: string) => {
      const v: SavedView = { id: `v${Date.now().toString(36)}`, label, state: filters.state };
      persist([...custom, v]);
      setActiveId(v.id);
    },
    saveChanges: () => {
      if (!active || active.system) return;
      persist(custom.map((v) => (v.id === active.id ? { ...v, state: filters.state } : v)));
    },
    discard: () => active && filters.setState(active.state),
    remove: (id: string) => {
      persist(custom.filter((v) => v.id !== id));
      if (id === activeId) {
        setActiveId(initial[0]?.id ?? "");
        if (initial[0]) filters.setState(initial[0].state);
      }
    },
  };
}

export type SavedViewsApi = ReturnType<typeof useSavedViews>;

/**
 * Abas de visões ("Todos · Meus · Atrasados") acima da FilterBar. Quando o
 * recorte muda, a aba ganha um ponto e aparecem "Salvar alterações" /
 * "Salvar como nova" / "Descartar". Contagem por visão opcional.
 */
export function SavedViews({ views, counts, className }: { views: SavedViewsApi; counts?: Record<string, number>; className?: string }) {
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");
  return (
    <div className={cn("flex flex-wrap items-end gap-x-1 gap-y-2 border-b border-line", className)}>
      <div className="-mb-px flex min-w-0 flex-1 items-end gap-1 overflow-x-auto" role="tablist" aria-label="Visões salvas">
        {views.views.map((v) => {
          const on = v.id === views.activeId;
          return (
            <button
              key={v.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => views.select(v.id)}
              className={cn("group inline-flex shrink-0 items-center gap-1.5 border-b-2 px-2.5 pb-2.5 pt-1.5 text-[13px]", on ? "border-ink font-medium text-ink" : "border-transparent text-muted hover:text-ink")}
            >
              {!v.system && <Bookmark className="h-3 w-3 text-muted" aria-hidden />}
              {v.label}
              {counts?.[v.id] != null && <span className="text-[11px] tabular-nums text-muted">{formatNumber(counts[v.id])}</span>}
              {on && views.dirty && <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-label="alterada" />}
            </button>
          );
        })}
      </div>
      <div className="mb-1.5 flex shrink-0 items-center gap-1">
        {views.dirty && (
          <>
            <button type="button" onClick={views.discard} className="h-7 rounded-md px-2 text-[12px] text-muted hover:bg-soft hover:text-ink">
              Descartar
            </button>
            {views.active && !views.active.system && (
              <button type="button" onClick={views.saveChanges} className="h-7 rounded-md px-2 text-[12px] font-medium text-ink hover:bg-soft">
                Salvar alterações
              </button>
            )}
          </>
        )}
        <Pop
          open={naming}
          onOpenChange={(o) => {
            setNaming(o);
            if (!o) setName("");
          }}
          align="end"
          width={260}
          triggerClassName="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[12px] text-muted hover:bg-soft hover:text-ink data-popup-open:bg-soft"
          trigger={
            <>
              <Plus className="h-3.5 w-3.5" /> {views.dirty ? "Salvar como nova" : "Salvar visão"}
            </>
          }
        >
          <form
            className="p-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return;
              views.saveAs(name.trim());
              setNaming(false);
              setName("");
            }}
          >
            <label className="block text-[12px] text-muted" htmlFor="view-name">
              Nome da visão
            </label>
            <input id="view-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Enterprise sem contato" className={cn(inputCls, "mt-1.5")} />
            <p className="m-0 mt-2 text-[11.5px] leading-relaxed text-muted">Salva a busca e os filtros atuais. Só você vê esta visão.</p>
            <div className="mt-3 flex justify-end">
              <Button type="submit" size="sm" disabled={!name.trim()}>
                Salvar visão
              </Button>
            </div>
          </form>
        </Pop>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Período                                                             */
/* ------------------------------------------------------------------ */

export type DateRangePreset = "today" | "yesterday" | "last7" | "last30" | "last90" | "this_month" | "last_month" | "this_quarter" | "this_year" | "custom";
export type DateRange = { preset: DateRangePreset; from: string; to: string };

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const dateRangePresets: { id: Exclude<DateRangePreset, "custom">; label: string }[] = [
  { id: "today", label: "Hoje" },
  { id: "yesterday", label: "Ontem" },
  { id: "last7", label: "Últimos 7 dias" },
  { id: "last30", label: "Últimos 30 dias" },
  { id: "last90", label: "Últimos 90 dias" },
  { id: "this_month", label: "Este mês" },
  { id: "last_month", label: "Mês passado" },
  { id: "this_quarter", label: "Este trimestre" },
  { id: "this_year", label: "Este ano" },
];

/** Converte um preset em datas ISO (inclusivas). */
export function resolveDateRange(preset: Exclude<DateRangePreset, "custom">, now = new Date()): DateRange {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const minus = (n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - n);
  const r = (a: Date, b: Date) => ({ preset, from: iso(a), to: iso(b) });
  switch (preset) {
    case "today":
      return r(d, d);
    case "yesterday":
      return r(minus(1), minus(1));
    case "last7":
      return r(minus(6), d);
    case "last30":
      return r(minus(29), d);
    case "last90":
      return r(minus(89), d);
    case "this_month":
      return r(new Date(d.getFullYear(), d.getMonth(), 1), d);
    case "last_month":
      return r(new Date(d.getFullYear(), d.getMonth() - 1, 1), new Date(d.getFullYear(), d.getMonth(), 0));
    case "this_quarter":
      return r(new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1), d);
    case "this_year":
      return r(new Date(d.getFullYear(), 0, 1), d);
  }
}

export function describeDateRange(range: DateRange) {
  if (range.preset !== "custom") return dateRangePresets.find((p) => p.id === range.preset)?.label ?? "";
  if (!range.from && !range.to) return "Qualquer data";
  return `${range.from ? formatDate(range.from, { short: true }) : "…"} – ${range.to ? formatDate(range.to, { short: true }) : "…"}`;
}

/**
 * Seletor de período. Em dashboard fica no topo à direita e vale para a
 * tela toda; em lista, vira um filtro de data comum. Presets primeiro,
 * intervalo personalizado por último.
 */
export function DateRangeFilter({
  value,
  onChange,
  presets = dateRangePresets.map((p) => p.id),
  label = "Período",
  now,
  className,
}: {
  value: DateRange;
  onChange: (range: DateRange) => void;
  presets?: Exclude<DateRangePreset, "custom">[];
  label?: string;
  now?: Date;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState({ from: value.from, to: value.to });
  useEffect(() => {
    if (open) setCustom({ from: value.from, to: value.to });
  }, [open, value.from, value.to]);
  return (
    <Pop
      open={open}
      onOpenChange={setOpen}
      align="end"
      width={300}
      triggerLabel={`${label}: ${describeDateRange(value)}`}
      triggerClassName={cn(chipBase, "h-10 bg-surface font-medium text-ink ring-line hover:bg-soft data-popup-open:bg-soft", className)}
      trigger={
        <>
          <CalendarDays className="h-3.5 w-3.5 text-muted" />
          {describeDateRange(value)}
          <ChevronDown className="h-3.5 w-3.5 text-muted" />
        </>
      }
    >
      <div className="grid grid-cols-2 gap-1 p-2">
        {dateRangePresets
          .filter((p) => presets.includes(p.id))
          .map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={value.preset === p.id}
              onClick={() => {
                onChange(resolveDateRange(p.id, now));
                setOpen(false);
              }}
              className={cn("rounded-md px-2.5 py-1.5 text-left text-[12.5px]", value.preset === p.id ? "bg-primary font-medium text-on-primary" : "hover:bg-soft")}
            >
              {p.label}
            </button>
          ))}
      </div>
      <div className="border-t border-line p-3">
        <p className="m-0 mb-2 text-[12px] font-medium text-muted">Personalizado</p>
        <div className="grid grid-cols-2 gap-2">
          <DatePicker label="De" value={custom.from} onValueChange={(v) => setCustom((c) => ({ ...c, from: v }))} placeholder="De" className="w-full" />
          <DatePicker label="Até" value={custom.to} onValueChange={(v) => setCustom((c) => ({ ...c, to: v }))} placeholder="Até" className="w-full" />
        </div>
        <div className="mt-2.5 flex justify-end">
          <Button
            size="sm"
            disabled={!custom.from || !custom.to || custom.from > custom.to}
            onClick={() => {
              onChange({ preset: "custom", ...custom });
              setOpen(false);
            }}
          >
            Aplicar período
          </Button>
        </div>
      </div>
    </Pop>
  );
}

/* ------------------------------------------------------------------ */
/* Resultado vazio                                                     */
/* ------------------------------------------------------------------ */

/**
 * Nenhum resultado com o recorte atual. Diz qual é o recorte e oferece
 * as duas saídas: afrouxar (remover o último filtro) ou recomeçar.
 */
export function EmptyFilterResult<T>({ filters, noun = "resultado", nounPlural, framed = false }: { filters: FiltersApi<T>; noun?: string; nounPlural?: string; framed?: boolean }) {
  const last = filters.active[filters.active.length - 1];
  const plural = nounPlural ?? `${noun}s`;
  return (
    <div className={cn("flex flex-col items-center px-5 py-10 text-center", framed && "rounded-xl border border-dashed border-line")} role="status">
      <span className="mb-3 grid h-9 w-9 place-items-center rounded-xl border border-line bg-soft/60 text-muted">
        <SearchX className="h-4.5 w-4.5" strokeWidth={1.6} />
      </span>
      <p className="m-0 text-[14px] font-medium">Nenhum {noun} com esse recorte</p>
      <p className="m-0 mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted">
        {filters.state.query && (
          <>
            Busca “<span className="text-ink">{filters.state.query}</span>”
            {filters.active.length ? " e " : ". "}
          </>
        )}
        {filters.active.length > 0 && `${filters.active.length} ${filters.active.length === 1 ? "filtro" : "filtros"}. `}
        Há {formatNumber(filters.total)} {filters.total === 1 ? noun : plural} no total.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {last && filters.active.length > 1 && (
          <Button size="sm" variant="ghost" onClick={() => filters.remove(last.id)}>
            <Filter /> Remover “{filters.describe(last).text}”
          </Button>
        )}
        <Button size="sm" variant={filters.active.length > 1 ? "quiet" : "ghost"} onClick={filters.clear}>
          <RotateCcw /> Limpar busca e filtros
        </Button>
      </div>
    </div>
  );
}
