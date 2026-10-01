"use client";

import { Check, Eye, EyeOff, FileText, Minus, Pencil, Plus, Star, UploadCloud, X } from "lucide-react";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "../lib/cn";
import { formatNumber } from "../lib/format";
import { normalize } from "../lib/text";

/*
 * Entradas de dados. Mesmas regras de forms.tsx:
 *  - rótulo sempre visível acima (12.5px muted); placeholder é exemplo
 *  - 40px de altura (sm 32px, lg 48px), 14px de texto, raio 8, borda line
 *  - ajuda e erro abaixo (12px); erro troca a ajuda, não soma
 *  - foco: borda escurece + halo 3px (vem de base.css / .focus-field)
 * Todos os campos aceitam `label`, `hint`, `error`, `optional` e ficam
 * ligados por id/aria-describedby automaticamente.
 */

/* ------------------------------------------------------------------ */
/* Moldura comum                                                       */
/* ------------------------------------------------------------------ */

type FrameProps = {
  label?: string;
  hint?: ReactNode;
  error?: ReactNode;
  optional?: boolean;
  /** Canto direito do rótulo (contador, link "Esqueci a senha"). */
  corner?: ReactNode;
  className?: string;
};

function useFieldIds(id?: string) {
  const auto = useId();
  const base = id ?? auto;
  return { id: base, desc: `${base}-desc` };
}

function Frame({
  label,
  hint,
  error,
  optional,
  corner,
  className,
  htmlFor,
  descId,
  group,
  children,
}: FrameProps & { htmlFor?: string; descId: string; group?: boolean; children: ReactNode }) {
  const labelText = label && (
    <>
      {label}
      {optional && <span className="ml-1 text-muted/80">(opcional)</span>}
    </>
  );
  return (
    <div className={cn("mb-5 min-w-0", className)} role={group ? "group" : undefined} aria-labelledby={group && label ? `${descId}-lbl` : undefined}>
      {(label || corner) && (
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          {label &&
            (group ? (
              <span id={`${descId}-lbl`} className="text-[12.5px] text-muted">
                {labelText}
              </span>
            ) : (
              <label htmlFor={htmlFor} className="text-[12.5px] text-muted">
                {labelText}
              </label>
            ))}
          {corner && <span className="shrink-0 text-[12px] text-muted">{corner}</span>}
        </div>
      )}
      {children}
      {(error || hint) && (
        <p id={descId} className={cn("m-0 mt-1.5 text-[12px] leading-5", error ? "text-rose" : "text-muted")}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

const shellSizes = { sm: "h-8 text-[13px]", md: "h-10 text-[14px]", lg: "h-12 text-[15px]" } as const;
const shellBase =
  "focus-field flex w-full items-center rounded-lg border bg-surface text-ink transition-[border-color,box-shadow] has-[input:disabled]:cursor-not-allowed has-[input:disabled]:bg-soft/60 has-[input:disabled]:text-muted";
const shellTone = (error?: ReactNode, readOnly?: boolean) =>
  cn(error ? "border-rose/50 focus-within:border-rose" : "border-line", readOnly && "bg-soft/50");
const bareInput = "h-full min-w-0 flex-1 bg-transparent px-3 outline-none placeholder:text-muted disabled:cursor-not-allowed";

/* ------------------------------------------------------------------ */
/* TextField                                                           */
/* ------------------------------------------------------------------ */

type NativeInput = Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "prefix" | "onChange" | "value">;

/**
 * Campo de texto completo. `prefix`/`suffix` = texto fixo ("https://",
 * "kg"); `icon` = ícone à esquerda; `clearable` = botão × quando há valor;
 * `maxLength` + `counter` = contador "12/80" no canto do rótulo.
 */
export function TextField({
  label,
  hint,
  error,
  optional,
  value,
  onChange,
  prefix,
  suffix,
  icon,
  clearable,
  counter,
  size = "md",
  loading,
  className,
  id,
  maxLength,
  readOnly,
  corner,
  ...rest
}: FrameProps &
  NativeInput & {
    value: string;
    onChange: (value: string) => void;
    prefix?: ReactNode;
    suffix?: ReactNode;
    icon?: ReactNode;
    clearable?: boolean;
    counter?: boolean;
    size?: keyof typeof shellSizes;
    /** Validação assíncrona em andamento (ex.: e-mail já existe?). */
    loading?: boolean;
  }) {
  const ids = useFieldIds(id);
  const ref = useRef<HTMLInputElement>(null);
  const showCounter = counter && maxLength != null;
  return (
    <Frame
      label={label}
      hint={hint}
      error={error}
      optional={optional}
      className={className}
      htmlFor={ids.id}
      descId={ids.desc}
      corner={
        corner ??
        (showCounter ? (
          <span className={cn("tabular-nums", value.length >= maxLength! && "text-amber")}>
            {value.length}/{maxLength}
          </span>
        ) : undefined)
      }
    >
      <div className={cn(shellBase, shellSizes[size], shellTone(error, readOnly))}>
        {icon && <span className="pointer-events-none flex shrink-0 pl-3 text-muted [&_svg]:h-4 [&_svg]:w-4">{icon}</span>}
        {prefix && <span className="shrink-0 border-r border-line pl-3 pr-2.5 text-muted">{prefix}</span>}
        <input
          ref={ref}
          id={ids.id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? ids.desc : undefined}
          aria-busy={loading || undefined}
          maxLength={maxLength}
          readOnly={readOnly}
          className={cn(bareInput, icon ? "pl-2" : undefined)}
          {...rest}
        />
        {loading && <Spinner />}
        {clearable && value && !readOnly && !rest.disabled && (
          <button
            type="button"
            aria-label="Limpar"
            onClick={() => {
              onChange("");
              ref.current?.focus();
            }}
            className="mr-1.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted hover:bg-soft hover:text-ink"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        {suffix && <span className="shrink-0 border-l border-line pl-2.5 pr-3 text-muted">{suffix}</span>}
      </div>
    </Frame>
  );
}

function Spinner() {
  return (
    <span aria-hidden className="mr-2.5 inline-block h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-[1.5px] border-line-strong border-t-ink" />
  );
}

/* ------------------------------------------------------------------ */
/* TextareaField                                                       */
/* ------------------------------------------------------------------ */

/** Texto longo. `autosize` cresce até `maxRows`; contador com maxLength. */
export function TextareaField({
  label,
  hint,
  error,
  optional,
  value,
  onChange,
  autosize = true,
  minRows = 3,
  maxRows = 10,
  counter,
  maxLength,
  className,
  id,
  ...rest
}: FrameProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange" | "value"> & {
    value: string;
    onChange: (value: string) => void;
    autosize?: boolean;
    minRows?: number;
    maxRows?: number;
    counter?: boolean;
  }) {
  const ids = useFieldIds(id);
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !autosize) return;
    const line = parseFloat(getComputedStyle(el).lineHeight) || 22;
    el.style.height = "auto";
    const pad = 16;
    el.style.height = `${Math.min(Math.max(el.scrollHeight, minRows * line + pad), maxRows * line + pad)}px`;
  }, [value, autosize, minRows, maxRows]);
  return (
    <Frame
      label={label}
      hint={hint}
      error={error}
      optional={optional}
      className={className}
      htmlFor={ids.id}
      descId={ids.desc}
      corner={
        counter && maxLength != null ? (
          <span className={cn("tabular-nums", value.length >= maxLength && "text-amber")}>
            {value.length}/{maxLength}
          </span>
        ) : undefined
      }
    >
      <textarea
        ref={ref}
        id={ids.id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={minRows}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? ids.desc : undefined}
        className={cn(
          "block w-full resize-none rounded-lg border bg-surface px-3 py-2 text-[14px] leading-relaxed text-ink outline-none placeholder:text-muted disabled:cursor-not-allowed disabled:bg-soft/60",
          error ? "border-rose/50" : "border-line",
          !autosize && "resize-y",
        )}
        {...rest}
      />
    </Frame>
  );
}

/* ------------------------------------------------------------------ */
/* PasswordField                                                       */
/* ------------------------------------------------------------------ */

/** Força 0–4 por comprimento e variedade. Heurística de UI, não segurança. */
export function passwordStrength(pw: string) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(4, Math.max(1, s));
}
const strengthLabel = ["", "Fraca", "Razoável", "Boa", "Forte"];

/** Senha com mostrar/ocultar. `strength` mostra régua de força e requisitos. */
export function PasswordField({
  label = "Senha",
  hint,
  error,
  value,
  onChange,
  strength = false,
  corner,
  className,
  id,
  autoComplete = "current-password",
  ...rest
}: FrameProps &
  NativeInput & {
    value: string;
    onChange: (value: string) => void;
    strength?: boolean;
  }) {
  const ids = useFieldIds(id);
  const [show, setShow] = useState(false);
  const level = passwordStrength(value);
  const reqs = [
    ["8+ caracteres", value.length >= 8],
    ["Maiúscula e minúscula", /[a-z]/.test(value) && /[A-Z]/.test(value)],
    ["Número", /\d/.test(value)],
    ["Símbolo", /[^A-Za-z0-9]/.test(value)],
  ] as const;
  return (
    <Frame label={label} hint={strength ? undefined : hint} error={error} className={className} htmlFor={ids.id} descId={ids.desc} corner={corner}>
      <div className={cn(shellBase, shellSizes.md, shellTone(error))}>
        <input
          id={ids.id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? ids.desc : undefined}
          className={bareInput}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={show}
          className="mr-1.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted hover:bg-soft hover:text-ink"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {strength && (
        <div className="mt-2">
          <div className="flex items-center gap-2">
            <div className="flex flex-1 gap-1" aria-hidden>
              {[1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    i <= level ? (level <= 1 ? "bg-rose" : level === 2 ? "bg-amber" : "bg-ok") : "bg-line",
                  )}
                />
              ))}
            </div>
            <span className="w-16 text-right text-[11.5px] text-muted" aria-live="polite">
              {value ? strengthLabel[level] : ""}
            </span>
          </div>
          <ul className="mt-2 grid list-none grid-cols-2 gap-x-3 gap-y-1 p-0 text-[12px]">
            {reqs.map(([t, ok]) => (
              <li key={t} className={cn("flex items-center gap-1.5", ok ? "text-ok" : "text-muted")}>
                {ok ? <Check className="h-3 w-3" strokeWidth={2.5} /> : <span className="mx-[3px] h-1.5 w-1.5 rounded-full bg-line-strong" />}
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Frame>
  );
}

/* ------------------------------------------------------------------ */
/* NumberField                                                         */
/* ------------------------------------------------------------------ */

/** Número com −/+. Setas ↑↓ mudam `step`; Shift multiplica por 10. Vazio = null. */
export function NumberField({
  label,
  hint,
  error,
  optional,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  digits = 0,
  className,
  id,
  disabled,
}: FrameProps & {
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: ReactNode;
  digits?: number;
  id?: string;
  disabled?: boolean;
}) {
  const ids = useFieldIds(id);
  const [draft, setDraft] = useState(value == null ? "" : formatNumber(value, digits));
  useEffect(() => setDraft(value == null ? "" : formatNumber(value, digits)), [value, digits]);
  const clamp = (n: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n));
  const bump = (dir: 1 | -1, mult = 1) => onChange(clamp(Number(((value ?? 0) + dir * step * mult).toFixed(digits))));
  const commit = () => {
    const n = parseFloat(draft.replace(/\./g, "").replace(",", "."));
    if (draft.trim() === "") onChange(null);
    else if (Number.isFinite(n)) onChange(clamp(n));
    else setDraft(value == null ? "" : formatNumber(value, digits));
  };
  const btn = "inline-flex h-full w-9 shrink-0 items-center justify-center text-muted hover:bg-soft hover:text-ink disabled:opacity-40 disabled:hover:bg-transparent";
  return (
    <Frame label={label} hint={hint} error={error} optional={optional} className={className} htmlFor={ids.id} descId={ids.desc}>
      <div className={cn(shellBase, shellSizes.md, shellTone(error), "overflow-hidden")}>
        <button type="button" tabIndex={-1} aria-label="Diminuir" className={cn(btn, "border-r border-line")} disabled={disabled || (min != null && (value ?? 0) <= min)} onClick={() => bump(-1)}>
          <Minus className="h-3.5 w-3.5" />
        </button>
        <input
          id={ids.id}
          inputMode="decimal"
          role="spinbutton"
          aria-valuenow={value ?? undefined}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? ids.desc : undefined}
          value={draft}
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
              e.preventDefault();
              bump(e.key === "ArrowUp" ? 1 : -1, e.shiftKey ? 10 : 1);
            } else if (e.key === "Enter") commit();
          }}
          className={cn(bareInput, "text-center tabular-nums")}
        />
        {suffix && <span className="shrink-0 pr-2 text-[13px] text-muted">{suffix}</span>}
        <button type="button" tabIndex={-1} aria-label="Aumentar" className={cn(btn, "border-l border-line")} disabled={disabled || (max != null && (value ?? 0) >= max)} onClick={() => bump(1)}>
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </Frame>
  );
}

/* ------------------------------------------------------------------ */
/* CurrencyField                                                       */
/* ------------------------------------------------------------------ */

/**
 * Valor em reais com máscara "caixa registradora": os dígitos entram pela
 * direita (1 → 0,01 → 0,12 → 1,23). `value` é número em reais (não centavos).
 */
export function CurrencyField({
  label,
  hint,
  error,
  optional,
  value,
  onChange,
  currency = "R$",
  className,
  id,
  placeholder = "0,00",
  ...rest
}: FrameProps &
  Omit<NativeInput, "placeholder"> & {
    value: number | null;
    onChange: (value: number | null) => void;
    currency?: string;
    placeholder?: string;
  }) {
  const ids = useFieldIds(id);
  const text = value == null ? "" : new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  const onInput = (e: ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 15);
    onChange(digits ? Number(digits) / 100 : null);
  };
  return (
    <Frame label={label} hint={hint} error={error} optional={optional} className={className} htmlFor={ids.id} descId={ids.desc}>
      <div className={cn(shellBase, shellSizes.md, shellTone(error))}>
        <span className="shrink-0 pl-3 text-[13px] text-muted">{currency}</span>
        <input
          id={ids.id}
          inputMode="numeric"
          value={text}
          onChange={onInput}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? ids.desc : undefined}
          className={cn(bareInput, "pl-2 text-right tabular-nums")}
          {...rest}
        />
      </div>
    </Frame>
  );
}

/* ------------------------------------------------------------------ */
/* Máscaras BR                                                         */
/* ------------------------------------------------------------------ */

/** Padrão: 9 = dígito. Ex.: "999.999.999-99". Retorna o texto mascarado. */
export function applyMask(pattern: string, raw: string) {
  const digits = raw.replace(/\D/g, "");
  let out = "";
  let di = 0;
  for (const ch of pattern) {
    if (di >= digits.length) break;
    if (ch === "9") out += digits[di++];
    else out += ch;
  }
  return out;
}

export type Mask = { pattern: string | ((digits: string) => string); placeholder: string; inputMode: "numeric" | "tel"; validate?: (digits: string) => boolean };

function cpfValid(d: string) {
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  const calc = (n: number) => {
    let s = 0;
    for (let i = 0; i < n; i++) s += Number(d[i]) * (n + 1 - i);
    const r = (s * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(d[9]) && calc(10) === Number(d[10]);
}
function cnpjValid(d: string) {
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
  const calc = (n: number) => {
    const w = n === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const s = w.reduce((acc, wi, i) => acc + wi * Number(d[i]), 0);
    const r = s % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === Number(d[12]) && calc(13) === Number(d[13]);
}

/** Máscaras brasileiras prontas. `validate` confere dígito verificador quando há. */
export const masks = {
  cpf: { pattern: "999.999.999-99", placeholder: "000.000.000-00", inputMode: "numeric", validate: cpfValid },
  cnpj: { pattern: "99.999.999/9999-99", placeholder: "00.000.000/0000-00", inputMode: "numeric", validate: cnpjValid },
  cep: { pattern: "99999-999", placeholder: "00000-000", inputMode: "numeric", validate: (d) => d.length === 8 },
  phone: {
    pattern: (d) => (d.length > 10 ? "(99) 99999-9999" : "(99) 9999-99999"),
    placeholder: "(11) 91234-5678",
    inputMode: "tel",
    validate: (d) => d.length === 10 || d.length === 11,
  },
  date: {
    pattern: "99/99/9999",
    placeholder: "dd/mm/aaaa",
    inputMode: "numeric",
    validate: (d) => {
      if (d.length !== 8) return false;
      const dt = new Date(Number(d.slice(4)), Number(d.slice(2, 4)) - 1, Number(d.slice(0, 2)));
      return dt.getDate() === Number(d.slice(0, 2)) && dt.getMonth() === Number(d.slice(2, 4)) - 1;
    },
  },
} satisfies Record<string, Mask>;

/**
 * Campo com máscara. `value` = texto mascarado; `onChange(masked, digits)`.
 * Valida no blur com `mask.validate` e mostra `invalidMessage` (a menos que
 * `error` venha de fora).
 */
export function MaskedField({
  mask,
  value,
  onChange,
  label,
  hint,
  error,
  optional,
  invalidMessage = "Confira o número digitado.",
  className,
  id,
  ...rest
}: FrameProps &
  Omit<NativeInput, "inputMode"> & {
    mask: Mask;
    value: string;
    onChange: (masked: string, digits: string) => void;
    invalidMessage?: string;
  }) {
  const ids = useFieldIds(id);
  const [touched, setTouched] = useState(false);
  const digits = value.replace(/\D/g, "");
  const invalid = touched && digits.length > 0 && mask.validate && !mask.validate(digits);
  const shown = error ?? (invalid ? invalidMessage : undefined);
  return (
    <Frame label={label} hint={hint} error={shown} optional={optional} className={className} htmlFor={ids.id} descId={ids.desc}>
      <div className={cn(shellBase, shellSizes.md, shellTone(shown))}>
        <input
          id={ids.id}
          value={value}
          inputMode={mask.inputMode}
          placeholder={mask.placeholder}
          onChange={(e) => {
            const d = e.target.value.replace(/\D/g, "");
            const pattern = typeof mask.pattern === "function" ? mask.pattern(d) : mask.pattern;
            const d2 = d.slice(0, pattern.split("9").length - 1);
            onChange(applyMask(pattern, d2), d2);
          }}
          onBlur={() => setTouched(true)}
          aria-invalid={shown ? true : undefined}
          aria-describedby={shown || hint ? ids.desc : undefined}
          className={cn(bareInput, "tabular-nums")}
          {...rest}
        />
        {mask.validate && digits.length > 0 && mask.validate(digits) && <Check className="mr-3 h-4 w-4 shrink-0 text-ok" aria-label="Válido" />}
      </div>
    </Frame>
  );
}

/* ------------------------------------------------------------------ */
/* OtpInput                                                            */
/* ------------------------------------------------------------------ */

/**
 * Código de verificação. Avança sozinho, aceita colar o código inteiro,
 * Backspace volta e apaga, setas navegam. `onComplete` dispara no último dígito.
 */
export function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  error,
  disabled,
  label = "Código de verificação",
  groupAt,
  autoFocus,
  className,
}: {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  error?: ReactNode;
  disabled?: boolean;
  label?: string;
  /** Separador visual após N dígitos (ex.: 3 → 123-456). */
  groupAt?: number;
  autoFocus?: boolean;
  className?: string;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const errId = useId();
  const chars = Array.from({ length }, (_, i) => value[i] ?? "");
  const set = (next: string) => {
    const clean = next.replace(/\D/g, "").slice(0, length);
    onChange(clean);
    if (clean.length === length) onComplete?.(clean);
  };
  const focus = (i: number) => refs.current[Math.max(0, Math.min(length - 1, i))]?.focus();
  const onKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (chars[i]) set(value.slice(0, i) + value.slice(i + 1));
      else if (i > 0) {
        set(value.slice(0, i - 1) + value.slice(i));
        focus(i - 1);
      }
    } else if (e.key === "ArrowLeft") focus(i - 1);
    else if (e.key === "ArrowRight") focus(i + 1);
  };
  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const d = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!d) return;
    set(d);
    focus(d.length);
  };
  return (
    <div className={cn("min-w-0", className)}>
      <div role="group" aria-label={label} aria-describedby={error ? errId : undefined} className="flex items-center gap-2">
        {chars.map((c, i) => (
          <span key={i} className="contents">
            {groupAt && i === groupAt && <span aria-hidden className="h-px w-3 bg-line-strong" />}
            <input
              ref={(el) => {
                refs.current[i] = el;
              }}
              value={c}
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              aria-label={`Dígito ${i + 1} de ${length}`}
              aria-invalid={error ? true : undefined}
              disabled={disabled}
              autoFocus={autoFocus && i === 0}
              maxLength={1}
              onPaste={onPaste}
              onKeyDown={(e) => onKey(i, e)}
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                const d = e.target.value.replace(/\D/g, "");
                if (!d) return;
                if (d.length > 1) {
                  set(value.slice(0, i) + d);
                  focus(i + d.length);
                  return;
                }
                const next = (value.slice(0, i).padEnd(i, " ") + d + value.slice(i + 1)).replace(/ /g, "");
                set(next);
                focus(i + 1);
              }}
              className={cn(
                "h-12 w-11 rounded-lg border bg-surface text-center text-[20px] font-semibold tabular-nums text-ink outline-none disabled:bg-soft/60 disabled:text-muted",
                error ? "border-rose/50" : c ? "border-line-strong" : "border-line",
              )}
            />
          </span>
        ))}
      </div>
      {error && (
        <p id={errId} role="alert" className="m-0 mt-2 text-[12px] text-rose">
          {error}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* TagInput                                                            */
/* ------------------------------------------------------------------ */

/**
 * Lista livre de etiquetas (skills, tags de lead, e-mails). Enter ou
 * vírgula adiciona; Backspace no campo vazio remove a última. Sugestões
 * filtram sem acento. `validate` recusa item (ex.: e-mail inválido).
 */
export function TagInput({
  label,
  hint,
  error,
  optional,
  value,
  onChange,
  suggestions = [],
  placeholder = "Digite e tecle Enter",
  max,
  validate,
  className,
  id,
}: FrameProps & {
  value: string[];
  onChange: (value: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  max?: number;
  /** Retorna mensagem de erro para recusar, ou null. */
  validate?: (tag: string) => string | null;
  id?: string;
}) {
  const ids = useFieldIds(id);
  const [draft, setDraft] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const has = (t: string) => value.some((v) => normalize(v) === normalize(t));
  const matches = suggestions.filter((s) => !has(s) && (!draft || normalize(s).includes(normalize(draft)))).slice(0, 6);
  const add = (raw: string) => {
    const t = raw.trim().replace(/,$/, "");
    if (!t || has(t)) return setDraft("");
    if (max && value.length >= max) return setLocalError(`Máximo de ${max} itens.`);
    const err = validate?.(t);
    if (err) return setLocalError(err);
    onChange([...value, t]);
    setDraft("");
    setLocalError(null);
    setHi(0);
  };
  const shown = error ?? localError ?? undefined;
  return (
    <Frame label={label} hint={hint} error={shown} optional={optional} className={className} htmlFor={ids.id} descId={ids.desc}>
      <div className="relative">
        <div
          className={cn("focus-field flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-lg border bg-surface px-2 py-1.5", shellTone(shown))}
          onClick={() => inputRef.current?.focus()}
        >
          {value.map((t) => (
            <span key={t} className="inline-flex h-6 items-center gap-1 rounded-md border border-line bg-soft/70 pl-2 pr-1 text-[12.5px] text-ink">
              {t}
              <button
                type="button"
                aria-label={`Remover ${t}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(value.filter((v) => v !== t));
                }}
                className="inline-flex h-4 w-4 items-center justify-center rounded text-muted hover:bg-line hover:text-ink"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            id={ids.id}
            value={draft}
            role="combobox"
            aria-expanded={open && matches.length > 0}
            aria-controls={`${ids.id}-list`}
            aria-autocomplete="list"
            aria-invalid={shown ? true : undefined}
            aria-describedby={shown || hint ? ids.desc : undefined}
            placeholder={value.length ? "" : placeholder}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            onChange={(e) => {
              const v = e.target.value;
              if (v.endsWith(",")) add(v);
              else {
                setDraft(v);
                setLocalError(null);
                setOpen(true);
                setHi(0);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add(open && matches[hi] && draft ? matches[hi] : draft);
              } else if (e.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1));
              else if (e.key === "ArrowDown") {
                e.preventDefault();
                setHi((h) => Math.min(matches.length - 1, h + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setHi((h) => Math.max(0, h - 1));
              } else if (e.key === "Escape") setOpen(false);
            }}
            className="h-6 min-w-[120px] flex-1 bg-transparent px-1 text-[14px] outline-none placeholder:text-muted"
          />
        </div>
        {open && matches.length > 0 && (
          <ul id={`${ids.id}-list`} role="listbox" className="absolute inset-x-0 top-full z-[100] mt-1 list-none rounded-xl border border-line bg-surface p-1 shadow-popup">
            {matches.map((m, i) => (
              <li
                key={m}
                role="option"
                aria-selected={i === hi}
                onMouseDown={(e) => {
                  e.preventDefault();
                  add(m);
                }}
                onMouseEnter={() => setHi(i)}
                className={cn("cursor-pointer rounded-lg px-2.5 py-1.5 text-[13.5px]", i === hi && "bg-soft")}
              >
                {m}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Frame>
  );
}

/* ------------------------------------------------------------------ */
/* Slider                                                              */
/* ------------------------------------------------------------------ */

/**
 * Faixa contínua. Passe `number` para um valor ou `[min, max]` para
 * intervalo (filtro de faixa salarial, preço). Setas mudam `step`,
 * PageUp/PageDown 10×, Home/End vão aos extremos.
 */
export function Slider<V extends number | [number, number]>({
  label,
  hint,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  format = (n) => formatNumber(n),
  showValue = true,
  marks,
  disabled,
  className,
}: {
  label: string;
  hint?: ReactNode;
  value: V;
  onChange: (value: V) => void;
  min?: number;
  max?: number;
  step?: number;
  format?: (n: number) => string;
  showValue?: boolean;
  /** Marcas fixas na régua (ex.: [0, 50, 100]). */
  marks?: number[];
  disabled?: boolean;
  className?: string;
}) {
  const range = Array.isArray(value);
  const vals: number[] = range ? [...(value as [number, number])] : [value as number];
  const trackRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<number | null>(null);
  const pct = (v: number) => ((v - min) / (max - min || 1)) * 100;
  const snap = (v: number) => Math.min(max, Math.max(min, Math.round((v - min) / step) * step + min));
  const emit = (i: number, v: number) => {
    const n = snap(v);
    if (!range) return onChange(n as V);
    const next: [number, number] = [vals[0], vals[1]];
    next[i] = i === 0 ? Math.min(n, next[1]) : Math.max(n, next[0]);
    onChange(next as V);
  };
  const fromPointer = (clientX: number) => {
    const r = trackRef.current!.getBoundingClientRect();
    return min + ((clientX - r.left) / r.width) * (max - min);
  };
  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    const v = fromPointer(e.clientX);
    const i = range ? (Math.abs(v - vals[0]) <= Math.abs(v - vals[1]) ? 0 : 1) : 0;
    setDrag(i);
    emit(i, v);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const lo = range ? pct(vals[0]) : 0;
  const hi = pct(range ? vals[1] : vals[0]);
  return (
    <div className={cn("mb-5 min-w-0", disabled && "opacity-50", className)}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <span className="text-[12.5px] text-muted">{label}</span>
        {showValue && <span className="text-[13px] font-medium tabular-nums">{range ? `${format(vals[0])} – ${format(vals[1])}` : format(vals[0])}</span>}
      </div>
      <div
        ref={trackRef}
        className="relative h-5 touch-none select-none"
        onPointerDown={onDown}
        onPointerMove={(e) => drag != null && emit(drag, fromPointer(e.clientX))}
        onPointerUp={() => setDrag(null)}
        onPointerCancel={() => setDrag(null)}
      >
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-line" />
        <div className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-primary" style={{ left: `${lo}%`, width: `${hi - lo}%` }} />
        {vals.map((v, i) => (
          <span
            key={i}
            role="slider"
            tabIndex={disabled ? -1 : 0}
            aria-label={range ? `${label} (${i === 0 ? "mínimo" : "máximo"})` : label}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={v}
            aria-valuetext={format(v)}
            aria-disabled={disabled || undefined}
            onKeyDown={(e) => {
              const k = e.key;
              const d = k === "ArrowRight" || k === "ArrowUp" ? step : k === "ArrowLeft" || k === "ArrowDown" ? -step : k === "PageUp" ? step * 10 : k === "PageDown" ? -step * 10 : null;
              if (d != null) emit(i, v + d);
              else if (k === "Home") emit(i, min);
              else if (k === "End") emit(i, max);
              else return;
              e.preventDefault();
            }}
            className={cn(
              "absolute top-1/2 h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink bg-surface shadow-surface outline-none transition-shadow focus-visible:ring-4 focus-visible:ring-ink/10",
              drag === i && "ring-4 ring-ink/10",
              disabled ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing",
            )}
            style={{ left: `${pct(v)}%` }}
          />
        ))}
      </div>
      {marks && (
        <div className="relative mt-1 h-4 text-[11px] tabular-nums text-muted">
          {marks.map((m) => (
            <span key={m} className="absolute -translate-x-1/2" style={{ left: `${pct(m)}%` }}>
              {format(m)}
            </span>
          ))}
        </div>
      )}
      {hint && <p className="m-0 mt-1.5 text-[12px] text-muted">{hint}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* RadioGroup, ChoiceCards, ToggleGroup                                */
/* ------------------------------------------------------------------ */

export type ChoiceOption<T extends string = string> = {
  value: T;
  label: string;
  description?: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  /** Canto direito do card (preço, "Recomendado"). */
  aside?: ReactNode;
};

/** Escolha única entre 2–6 opções sempre visíveis. Setas movem a seleção (nativo). */
export function RadioGroup<T extends string>({
  label,
  hint,
  error,
  options,
  value,
  onChange,
  orientation = "vertical",
  name,
  className,
}: FrameProps & {
  options: ChoiceOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  orientation?: "vertical" | "horizontal";
  name?: string;
}) {
  const ids = useFieldIds();
  const groupName = name ?? ids.id;
  return (
    <Frame label={label} hint={hint} error={error} className={className} descId={ids.desc} group>
      <div role="radiogroup" aria-labelledby={label ? `${ids.desc}-lbl` : undefined} className={cn("flex gap-x-5 gap-y-2.5", orientation === "vertical" ? "flex-col" : "flex-wrap")}>
        {options.map((o) => (
          <label key={o.value} className={cn("flex cursor-pointer items-start gap-2.5", o.disabled && "cursor-not-allowed opacity-50")}>
            <input
              type="radio"
              name={groupName}
              value={o.value}
              checked={value === o.value}
              disabled={o.disabled}
              onChange={() => onChange(o.value)}
              className="peer sr-only"
            />
            <span
              aria-hidden
              className={cn(
                "mt-px grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border bg-surface transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-muted/40 peer-focus-visible:ring-offset-2",
                value === o.value ? "border-ink" : "border-line-strong",
              )}
            >
              {value === o.value && <span className="h-2 w-2 rounded-full bg-primary" />}
            </span>
            <span className="min-w-0">
              <span className="block text-[13.5px] leading-snug text-ink">{o.label}</span>
              {o.description && <span className="mt-0.5 block text-[12px] leading-snug text-muted">{o.description}</span>}
            </span>
          </label>
        ))}
      </div>
    </Frame>
  );
}

/**
 * Cards selecionáveis (plano, tipo de conta, modelo de contratação).
 * `multiple` vira checkbox. Selecionado = borda ink + check.
 */
export function ChoiceCards<T extends string>({
  label,
  hint,
  error,
  options,
  value,
  onChange,
  multiple = false,
  columns = 3,
  className,
}: FrameProps & {
  options: ChoiceOption<T>[];
  columns?: 1 | 2 | 3 | 4;
} & (
    | { multiple?: false; value: T | null; onChange: (value: T) => void }
    | { multiple: true; value: T[]; onChange: (value: T[]) => void }
  )) {
  const ids = useFieldIds();
  const isOn = (v: T) => (multiple ? (value as T[]).includes(v) : value === v);
  const toggle = (v: T) => {
    if (multiple) {
      const arr = value as T[];
      (onChange as (v: T[]) => void)(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
    } else (onChange as (v: T) => void)(v);
  };
  const cols = { 1: "", 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" }[columns];
  return (
    <Frame label={label} hint={hint} error={error} className={className} descId={ids.desc} group>
      <div role={multiple ? "group" : "radiogroup"} className={cn("grid gap-2.5", cols)}>
        {options.map((o) => {
          const on = isOn(o.value);
          return (
            <label
              key={o.value}
              className={cn(
                "surface-card relative flex cursor-pointer items-start gap-3 rounded-xl border bg-surface p-3.5 transition-[border-color,box-shadow]",
                on ? "border-ink shadow-[0_0_0_1px_var(--ds-ink)]" : "border-line hover:border-line-strong",
                o.disabled && "cursor-not-allowed opacity-50",
              )}
            >
              <input type={multiple ? "checkbox" : "radio"} name={ids.id} checked={on} disabled={o.disabled} onChange={() => toggle(o.value)} className="peer sr-only" />
              <span aria-hidden className="pointer-events-none absolute inset-0 rounded-xl peer-focus-visible:ring-2 peer-focus-visible:ring-muted/40 peer-focus-visible:ring-offset-2" />
              {o.icon && (
                <span className={cn("inline-grid h-8 w-8 shrink-0 place-items-center rounded-lg [&_svg]:h-4 [&_svg]:w-4", on ? "bg-primary text-on-primary" : "bg-soft text-ink-soft")}>{o.icon}</span>
              )}
              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-2">
                  <span className="text-[13.5px] font-medium leading-snug">{o.label}</span>
                  {o.aside && <span className="shrink-0 text-[12px] text-muted">{o.aside}</span>}
                </span>
                {o.description && <span className="mt-1 block text-[12.5px] leading-snug text-muted">{o.description}</span>}
              </span>
              <span
                aria-hidden
                className={cn(
                  "grid h-[18px] w-[18px] shrink-0 place-items-center border transition-colors",
                  multiple ? "rounded-[5px]" : "rounded-full",
                  on ? "border-primary bg-primary text-on-primary" : "border-line-strong bg-surface",
                )}
              >
                {on && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
            </label>
          );
        })}
      </div>
    </Frame>
  );
}

/**
 * Grupo de botões com estado (negrito/itálico, dias da semana, filtros
 * rápidos). `multiple` permite vários. Para alternar VISUALIZAÇÃO use
 * SegmentedControl. `label` é o nome acessível do grupo (não aparece:
 * o grupo costuma ficar sob um título ou dentro de FieldBlock).
 * Ligado = preenchido primário; desabilitado mantém o estado legível.
 */
export function ToggleGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  multiple,
  size = "md",
  disabled,
  className,
}: {
  label: string;
  options: { value: T; label: string; icon?: ReactNode; hideLabel?: boolean; disabled?: boolean }[];
  size?: "sm" | "md";
  disabled?: boolean;
  className?: string;
} & ({ multiple?: false; value: T | null; onChange: (value: T | null) => void } | { multiple: true; value: T[]; onChange: (value: T[]) => void })) {
  const isOn = (v: T) => (multiple ? (value as T[]).includes(v) : value === v);
  const toggle = (v: T) => {
    if (multiple) {
      const arr = value as T[];
      (onChange as (v: T[]) => void)(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
    } else (onChange as (v: T | null) => void)(value === v ? null : v);
  };
  return (
    <div role="group" aria-label={label} aria-disabled={disabled || undefined} className={cn("inline-flex flex-wrap gap-1", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={isOn(o.value)}
          aria-label={o.hideLabel ? o.label : undefined}
          title={o.hideLabel ? o.label : undefined}
          disabled={disabled || o.disabled}
          onClick={() => toggle(o.value)}
          className={cn(
            "inline-flex items-center justify-center gap-1.5 rounded-lg border font-medium transition-colors disabled:cursor-not-allowed [&_svg]:h-4 [&_svg]:w-4",
            size === "sm" ? "h-8 min-w-9 px-2.5 text-[12.5px]" : "h-9 min-w-10 px-3 text-[13px]",
            isOn(o.value)
              ? "border-primary bg-primary text-on-primary disabled:opacity-55"
              : "border-line bg-surface text-ink-soft hover:bg-soft hover:text-ink disabled:bg-soft/60 disabled:text-muted disabled:hover:bg-soft/60",
          )}
        >
          {o.icon}
          {!o.hideLabel && o.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* FileDropzone                                                        */
/* ------------------------------------------------------------------ */

export type UploadItem = {
  id: string;
  name: string;
  size: number;
  /** 0–100 enquanto envia; undefined quando concluído. */
  progress?: number;
  error?: string;
};

const fmtSize = (b: number) => (b < 1024 ? `${b} B` : b < 1024 ** 2 ? `${formatNumber(b / 1024, 0)} KB` : `${formatNumber(b / 1024 ** 2, 1)} MB`);

/**
 * Área de soltar arquivos + lista com progresso. O componente só valida
 * (tipo, tamanho, quantidade) e entrega os `File` aceitos em `onFiles`;
 * o envio e o progresso são seus (atualize `items`).
 */
export function FileDropzone({
  label,
  hint,
  error,
  accept,
  maxSize,
  maxFiles,
  multiple = true,
  onFiles,
  items = [],
  onRemove,
  disabled,
  className,
}: FrameProps & {
  /** Igual ao atributo HTML: ".pdf,.docx,image/*". */
  accept?: string;
  /** Bytes. */
  maxSize?: number;
  maxFiles?: number;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  items?: UploadItem[];
  onRemove?: (id: string) => void;
  disabled?: boolean;
}) {
  const ids = useFieldIds();
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [rejected, setRejected] = useState<string | null>(null);
  const matches = (f: File) => {
    if (!accept) return true;
    return accept.split(",").some((a) => {
      const t = a.trim().toLowerCase();
      if (t.startsWith(".")) return f.name.toLowerCase().endsWith(t);
      if (t.endsWith("/*")) return f.type.startsWith(t.slice(0, -1));
      return f.type === t;
    });
  };
  const take = (list: FileList | null) => {
    if (!list || disabled) return;
    const files = Array.from(list);
    const ok: File[] = [];
    const bad: string[] = [];
    for (const f of files) {
      if (!matches(f)) bad.push(`${f.name}: tipo não aceito`);
      else if (maxSize && f.size > maxSize) bad.push(`${f.name}: maior que ${fmtSize(maxSize)}`);
      else ok.push(f);
    }
    const room = maxFiles ? Math.max(0, maxFiles - items.length) : Infinity;
    if (ok.length > room) bad.push(`Máximo de ${maxFiles} arquivos`);
    setRejected(bad.length ? bad.join(" · ") : null);
    const accepted = ok.slice(0, room);
    if (accepted.length) onFiles(multiple ? accepted : accepted.slice(0, 1));
  };
  const shown = error ?? rejected ?? undefined;
  const hintText =
    hint ??
    [accept && accept.replace(/\./g, "").toUpperCase().split(",").join(", "), maxSize && `até ${fmtSize(maxSize)}`, maxFiles && `máx. ${maxFiles} arquivos`].filter(Boolean).join(" · ");
  return (
    <Frame label={label} error={shown} className={className} descId={ids.desc} group>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        aria-describedby={shown ? ids.desc : undefined}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          take(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border border-dashed px-5 py-7 text-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-muted/40",
          over ? "border-ink bg-soft" : shown ? "border-rose/40 bg-rose-soft/20" : "border-line-strong bg-soft/40 hover:bg-soft",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        )}
      >
        <span className="mb-2.5 inline-grid h-9 w-9 place-items-center rounded-xl border border-line bg-surface text-muted">
          <UploadCloud className="h-4.5 w-4.5 h-[18px] w-[18px]" strokeWidth={1.6} />
        </span>
        <p className="m-0 text-[13.5px]">
          <span className="font-medium text-ink">Clique para escolher</span> <span className="text-muted">ou arraste aqui</span>
        </p>
        {hintText && <p className="m-0 mt-1 text-[12px] text-muted">{hintText}</p>}
        <input ref={inputRef} type="file" hidden accept={accept} multiple={multiple} onChange={(e) => (take(e.target.files), (e.target.value = ""))} />
      </div>
      {items.length > 0 && (
        <ul className="mt-3 list-none space-y-2 p-0">
          {items.map((it) => (
            <li key={it.id} className={cn("flex items-center gap-3 rounded-lg border bg-surface px-3 py-2.5", it.error ? "border-rose/30" : "border-line")}>
              <span className="inline-grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-soft text-muted">
                <FileText className="h-4 w-4" strokeWidth={1.6} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-[13px] font-medium">{it.name}</span>
                  <span className={cn("shrink-0 text-[11.5px] tabular-nums", it.error ? "text-rose" : "text-muted")}>
                    {it.error ? "Falhou" : it.progress != null ? `${Math.round(it.progress)}%` : fmtSize(it.size)}
                  </span>
                </div>
                {it.error ? (
                  <p className="m-0 mt-0.5 text-[12px] text-rose">{it.error}</p>
                ) : it.progress != null ? (
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={Math.round(it.progress)} aria-valuemin={0} aria-valuemax={100} aria-label={`Enviando ${it.name}`}>
                    <div className="h-full rounded-full bg-ink transition-[width] duration-200" style={{ width: `${it.progress}%` }} />
                  </div>
                ) : (
                  <p className="m-0 mt-0.5 flex items-center gap-1 text-[12px] text-ok">
                    <Check className="h-3 w-3" strokeWidth={2.5} /> Enviado
                  </p>
                )}
              </div>
              {onRemove && (
                <button type="button" aria-label={`Remover ${it.name}`} onClick={() => onRemove(it.id)} className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted hover:bg-soft hover:text-ink">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Frame>
  );
}

/* ------------------------------------------------------------------ */
/* Rating                                                              */
/* ------------------------------------------------------------------ */

const ratingWords = ["", "Muito fraco", "Fraco", "Adequado", "Forte", "Excepcional"];

/**
 * Nota 1–N (scorecard de entrevista, avaliação de fornecedor). `variant`
 * "stars" para público; "scale" (quadrados numerados) para avaliação
 * interna, que lê como critério e não como "gostei". `readOnly` para exibir.
 */
export function Rating({
  value,
  onChange,
  max = 5,
  variant = "stars",
  label = "Nota",
  readOnly,
  showLabel,
  labels = ratingWords,
  size = "md",
  className,
}: {
  value: number | null;
  onChange?: (value: number) => void;
  max?: number;
  variant?: "stars" | "scale";
  label?: string;
  readOnly?: boolean;
  /** Mostra a palavra da nota ao lado ("Forte"). */
  showLabel?: boolean;
  labels?: string[];
  size?: "sm" | "md";
  className?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value ?? 0;
  const interactive = !readOnly && !!onChange;
  const items = Array.from({ length: max }, (_, i) => i + 1);
  const word = showLabel && shown ? labels[shown] : null;
  if (!interactive)
    return (
      <span className={cn("inline-flex items-center gap-2", className)} role="img" aria-label={`${label}: ${value ?? 0} de ${max}`}>
        <span className="inline-flex items-center gap-0.5">
          {items.map((i) =>
            variant === "stars" ? (
              <Star key={i} className={cn(size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4", i <= (value ?? 0) ? "fill-accent text-accent" : "fill-line text-line")} strokeWidth={1.2} />
            ) : (
              <span key={i} className={cn("rounded-[3px]", size === "sm" ? "h-2 w-3" : "h-2.5 w-4", i <= (value ?? 0) ? "bg-ink" : "bg-line")} />
            ),
          )}
        </span>
        {word && <span className="text-[12px] text-muted">{word}</span>}
      </span>
    );
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      {/* radiogroup é composto: o foco fica nos role="radio" (tabindex móvel), não no grupo */}
      {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus */}
      <span role="radiogroup" aria-label={label} className="inline-flex items-center gap-1" onMouseLeave={() => setHover(null)}>
        {items.map((i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={value === i}
            aria-label={`${i} de ${max}${labels[i] ? ` · ${labels[i]}` : ""}`}
            tabIndex={value === i || (!value && i === 1) ? 0 : -1}
            onMouseEnter={() => setHover(i)}
            onClick={() => onChange!(i)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowUp") {
                e.preventDefault();
                onChange!(Math.min(max, (value ?? 0) + 1));
              } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
                e.preventDefault();
                onChange!(Math.max(1, (value ?? 1) - 1));
              }
            }}
            className={cn(
              "inline-flex items-center justify-center rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-muted/40",
              variant === "stars" ? "h-7 w-7 hover:bg-soft" : cn("h-8 w-8 border text-[12.5px] font-medium tabular-nums", i <= shown ? "border-primary bg-primary text-on-primary" : "border-line bg-surface text-muted hover:border-line-strong"),
            )}
          >
            {variant === "stars" ? <Star className={cn("h-5 w-5", i <= shown ? "fill-accent text-accent" : "fill-transparent text-line-strong")} strokeWidth={1.4} /> : i}
          </button>
        ))}
      </span>
      {showLabel && <span className="min-w-[80px] text-[12.5px] text-muted" aria-live="polite">{word ?? "Sem nota"}</span>}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* InlineEdit                                                          */
/* ------------------------------------------------------------------ */

/**
 * Texto que vira campo no clique (nome de negócio, título de vaga, célula
 * de planilha). Enter salva, Esc cancela, blur salva. Vazio volta ao anterior
 * a menos que `allowEmpty`.
 */
export function InlineEdit({
  value,
  onSave,
  label,
  placeholder = "Clique para editar",
  allowEmpty,
  textClassName,
  className,
}: {
  value: string;
  onSave: (value: string) => void;
  label: string;
  placeholder?: string;
  allowEmpty?: boolean;
  /** Classe do texto (ex.: tamanho de título). */
  textClassName?: string;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (editing) {
      setDraft(value);
      requestAnimationFrame(() => ref.current?.select());
    }
  }, [editing, value]);
  const commit = () => {
    const t = draft.trim();
    setEditing(false);
    if ((t || allowEmpty) && t !== value) onSave(t);
  };
  if (editing)
    return (
      <input
        ref={ref}
        aria-label={label}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            setEditing(false);
          }
        }}
        className={cn("-mx-1.5 w-[calc(100%+12px)] rounded-md border border-muted bg-surface px-1.5 py-0.5 text-ink shadow-[0_0_0_3px_color-mix(in_oklab,var(--ds-ink)_6%,transparent)] outline-none", textClassName, className)}
      />
    );
  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      aria-label={`${label}: ${value || "vazio"}. Editar`}
      className={cn("group -mx-1.5 inline-flex max-w-full items-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-left hover:border-line hover:bg-soft/60", className)}
    >
      <span className={cn("truncate", !value && "text-muted", textClassName)}>{value || placeholder}</span>
      <Pencil className="h-3.5 w-3.5 shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden />
    </button>
  );
}
