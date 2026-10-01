"use client";

import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { Select as BaseSelect } from "@base-ui/react/select";
import { Check, ChevronsUpDown, Minus, Search, X } from "lucide-react";
import {
  cloneElement,
  isValidElement,
  useId,
  useRef,
  type ReactNode,
} from "react";
import { cn } from "../lib/cn";
import { usePortalContainer } from "../lib/portal";
import { normalize } from "../lib/text";
import { popupClass } from "./overlays";

/*
 * Formulários. Regras (docs/componentes/formularios.md):
 *  - Nenhum <select> nativo: lista curta fixa → Select; lista de entidades → Combobox.
 *  - Rótulo sempre visível acima do campo (12.5px muted). Placeholder é exemplo, não rótulo.
 *  - Campo 40px de altura, 14px de texto, raio 8, borda line.
 *  - Ajuda e erro abaixo do campo, 12px.
 */

export const fieldClass =
  "h-10 w-full rounded-lg border border-line bg-surface px-3 text-[14px] text-ink placeholder:text-muted";
export const areaClass =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-[14px] leading-relaxed text-ink placeholder:text-muted";

/**
 * Rótulo + controle + ajuda/erro. Se o filho é input/textarea nativo, liga
 * `htmlFor` automaticamente; senão vira um `role=group` rotulado.
 */
export function FieldBlock({
  label,
  hint,
  error,
  optional,
  children,
  className,
}: {
  label: string;
  hint?: ReactNode;
  error?: ReactNode;
  optional?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const generatedId = useId();
  const control =
    isValidElement<{ id?: string; "aria-invalid"?: boolean; "aria-describedby"?: string }>(children) &&
    typeof children.type === "string" &&
    ["input", "select", "textarea"].includes(children.type)
      ? children
      : null;
  const id = control?.props.id ?? generatedId;
  const describedBy = error || hint ? `${id}-desc` : undefined;
  const labelText = (
    <>
      {label}
      {optional && <span className="ml-1 text-muted/80">(opcional)</span>}
    </>
  );
  return (
    <div className={cn("mb-5 min-w-0", className)} role={control ? undefined : "group"} aria-label={control ? undefined : label}>
      {control ? (
        <label htmlFor={id} className="mb-1.5 block text-[12.5px] text-muted">
          {labelText}
        </label>
      ) : (
        <div className="mb-1.5 text-[12.5px] text-muted">{labelText}</div>
      )}
      {control
        ? cloneElement(control, {
            id,
            "aria-invalid": error ? true : undefined,
            "aria-describedby": describedBy,
          })
        : children}
      {(error || hint) && (
        <p id={describedBy} className={cn("m-0 mt-1.5 text-[12px] leading-5", error ? "text-rose" : "text-muted")}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

/** Grade de campos: 1 coluna no celular, 2 a partir de 640px. */
export function FieldGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-x-4 sm:grid-cols-2">{children}</div>;
}

/* ------------------------------------------------------------------ */
/* Select                                                              */
/* ------------------------------------------------------------------ */

export type SelectOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
  /** Elemento à esquerda, ex.: <Dot tone="ok" />. */
  icon?: ReactNode;
};

const selectTones = {
  neutral: "border-line bg-surface text-ink hover:bg-soft/60",
  ok: "border-ok/30 bg-ok-soft text-ok",
  warn: "border-amber/30 bg-amber-soft/50 text-amber",
  bad: "border-rose/30 bg-rose-soft/50 text-rose",
};

/** Lista curta e fixa (status, prioridade, tipo). Até ~12 opções. */
export function Select({
  options,
  value,
  onValueChange,
  label,
  placeholder = "Selecione…",
  disabled,
  required,
  id,
  name,
  size = "field",
  tone = "neutral",
  className,
  align = "start",
}: {
  options: SelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  label: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
  /** field = formulário (40px); compact = linha de tabela / toolbar (32px). */
  size?: "field" | "compact";
  tone?: keyof typeof selectTones;
  className?: string;
  align?: "start" | "end";
}) {
  const [triggerRef, container] = usePortalContainer();
  const items = options.map((o) => ({ value: o.value, label: o.label }));
  const selected = options.find((o) => o.value === value);
  return (
    <BaseSelect.Root
      items={items}
      value={value || null}
      onValueChange={(next) => onValueChange((next as string | null) ?? "")}
      disabled={disabled}
      required={required}
      name={name}
      modal={false}
    >
      <BaseSelect.Trigger
        ref={triggerRef}
        id={id}
        aria-label={label}
        className={cn(
          "flex min-w-0 items-center justify-between gap-2 rounded-lg border text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 data-disabled:cursor-not-allowed data-disabled:opacity-50",
          size === "field" ? "h-10 w-full px-3 text-[14px]" : "h-8 px-2.5 text-[12.5px] font-medium",
          selectTones[tone],
          className,
        )}
      >
        <span className="flex min-w-0 items-center gap-2 truncate">
          {selected?.icon}
          <BaseSelect.Value placeholder={placeholder} className="truncate data-placeholder:text-muted" />
        </span>
        <BaseSelect.Icon className="shrink-0 opacity-70">
          <ChevronsUpDown aria-hidden className="h-3.5 w-3.5" />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal container={container}>
        <BaseSelect.Positioner align={align} sideOffset={5} collisionPadding={8} className="z-[100] select-none outline-none">
          <BaseSelect.Popup aria-label={label} className={cn(popupClass, "min-w-[max(180px,var(--anchor-width))] max-w-[calc(100vw-16px)] p-1.5")}>
            <BaseSelect.List className="max-h-[min(320px,var(--available-height))] overflow-y-auto overscroll-contain outline-none">
              {options.map((option) => (
                <BaseSelect.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className="flex cursor-default items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] outline-none data-highlighted:bg-soft data-disabled:opacity-40"
                >
                  {option.icon && <span className="flex shrink-0 items-center">{option.icon}</span>}
                  <span className="min-w-0 flex-1">
                    <BaseSelect.ItemText className="block truncate">{option.label}</BaseSelect.ItemText>
                    {option.description && <span className="mt-0.5 block text-[12px] text-muted">{option.description}</span>}
                  </span>
                  <BaseSelect.ItemIndicator className="shrink-0">
                    <Check aria-hidden className="h-4 w-4 text-ink" />
                  </BaseSelect.ItemIndicator>
                </BaseSelect.Item>
              ))}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}

/* ------------------------------------------------------------------ */
/* Combobox                                                            */
/* ------------------------------------------------------------------ */

export type ComboboxOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

type ComboboxProps = {
  options: ComboboxOption[];
  label: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
  className?: string;
} & (
  | { multiple?: false; value: string; onValueChange: (value: string) => void }
  | { multiple: true; value: string[]; onValueChange: (value: string[]) => void }
);

/**
 * Lista de entidades (pessoas, clientes, documentos) com busca sem acento.
 * Múltiplo mostra os escolhidos como chips removíveis abaixo do gatilho.
 */
export function Combobox({ options, label, placeholder = "Selecione…", disabled, required, id, name, className, ...selection }: ComboboxProps) {
  const trigger = useRef<HTMLButtonElement | null>(null);
  const [portalRef, container] = usePortalContainer();
  const selectedOptions = selection.multiple ? options.filter((o) => selection.value.includes(o.value)) : [];
  return (
    <BaseCombobox.Root<ComboboxOption, boolean>
      items={options}
      multiple={selection.multiple}
      value={
        selection.multiple
          ? selectedOptions
          : (options.find((o) => o.value === selection.value) ?? null)
      }
      onValueChange={(next) => {
        if (selection.multiple) {
          if (Array.isArray(next)) selection.onValueChange(next.map((o) => o.value));
        } else if (!Array.isArray(next)) selection.onValueChange(next?.value ?? "");
      }}
      isItemEqualToValue={(a, b) => a.value === b.value}
      filter={(option, query) => normalize(`${option.label} ${option.description ?? ""}`).includes(normalize(query.trim()))}
      disabled={disabled}
      required={required}
      name={name}
      autoHighlight
    >
      <BaseCombobox.Trigger
        ref={(el) => {
          trigger.current = el;
          portalRef(el);
        }}
        id={id}
        aria-label={label}
        className={cn(
          "flex min-w-0 items-center justify-between gap-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-50",
          className ?? "h-10 w-full rounded-lg border border-line bg-surface px-3 text-[14px]",
        )}
      >
        <span className="truncate">
          {selection.multiple ? (
            selectedOptions.length ? (
              `${selectedOptions.length} ${selectedOptions.length === 1 ? "selecionado" : "selecionados"}`
            ) : (
              <span className="text-muted">{placeholder}</span>
            )
          ) : (
            <BaseCombobox.Value placeholder={placeholder} />
          )}
        </span>
        <ChevronsUpDown aria-hidden className="h-3.5 w-3.5 shrink-0 text-muted" />
      </BaseCombobox.Trigger>
      {selection.multiple && selectedOptions.length > 0 && (
        <ul aria-label={`${label} selecionados`} className="mt-2 flex list-none flex-wrap gap-1.5 p-0">
          {selectedOptions.map((option) => (
            <li key={option.value} className="max-w-full">
              <button
                type="button"
                disabled={disabled || option.disabled}
                aria-label={`Remover ${option.label}`}
                className="flex max-w-full items-center gap-1.5 rounded-lg border border-line bg-soft/60 py-1.5 pl-2.5 pr-2 text-[12px] hover:bg-soft disabled:opacity-50"
                onClick={() => {
                  selection.onValueChange(selection.value.filter((v) => v !== option.value));
                  trigger.current?.focus();
                }}
              >
                <span className="truncate">{option.label}</span>
                <X aria-hidden className="h-3 w-3 shrink-0 text-muted" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <BaseCombobox.Portal container={container}>
        <BaseCombobox.Positioner align="start" sideOffset={5} collisionPadding={8} className="z-[100] max-w-[calc(100vw-16px)]">
          <BaseCombobox.Popup
            aria-label={label}
            className="flex max-h-[min(360px,var(--available-height))] w-[max(240px,var(--anchor-width))] max-w-[calc(100vw-16px)] flex-col overflow-hidden rounded-xl border border-line bg-surface text-ink shadow-xl shadow-black/10"
          >
            <div className="focus-field flex shrink-0 items-center gap-2 border-b border-line px-3">
              <Search aria-hidden className="h-4 w-4 shrink-0 text-muted" />
              <BaseCombobox.Input
                aria-label={`Buscar em ${label.toLocaleLowerCase("pt-BR")}`}
                placeholder="Buscar…"
                className="h-11 w-full min-w-0 border-0 bg-transparent text-[14px] outline-none placeholder:text-muted"
              />
            </div>
            <BaseCombobox.Empty>
              <div className="p-5 text-center text-[13px] text-muted">Nenhum resultado encontrado.</div>
            </BaseCombobox.Empty>
            <BaseCombobox.List className="min-h-0 overflow-y-auto overscroll-contain p-1.5 outline-none empty:p-0">
              {(option: ComboboxOption) => (
                <BaseCombobox.Item
                  key={option.value}
                  value={option}
                  disabled={option.disabled}
                  className="flex cursor-default items-center gap-3 rounded-lg px-2.5 py-2 text-[14px] outline-none data-highlighted:bg-soft data-disabled:opacity-40"
                >
                  <div className="min-w-0 flex-1">
                    <div className="break-words">{option.label}</div>
                    {option.description && <div className="mt-0.5 text-[12px] text-muted">{option.description}</div>}
                  </div>
                  <BaseCombobox.ItemIndicator>
                    <Check aria-hidden className="h-4 w-4 shrink-0 text-blue" />
                  </BaseCombobox.ItemIndicator>
                </BaseCombobox.Item>
              )}
            </BaseCombobox.List>
          </BaseCombobox.Popup>
        </BaseCombobox.Positioner>
      </BaseCombobox.Portal>
    </BaseCombobox.Root>
  );
}

/* ------------------------------------------------------------------ */
/* Checkbox, Switch                                                    */
/* ------------------------------------------------------------------ */

/** Caixa 20px, marcada = ink. Para aprovar/concluir. Com `children` vira label clicável. */
export function Checkbox({
  checked,
  onCheckedChange,
  label,
  disabled,
  indeterminate,
  className,
  children,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  indeterminate?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const box = (
    <BaseCheckbox.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      indeterminate={indeterminate}
      aria-label={children ? undefined : label}
      className={cn(
        "inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-[5px] border text-on-primary outline-none focus-visible:ring-2 focus-visible:ring-accent/40 data-disabled:cursor-not-allowed data-disabled:opacity-40",
        checked || indeterminate ? "border-primary bg-primary" : "border-line-strong bg-surface hover:border-ink",
        className,
      )}
    >
      <BaseCheckbox.Indicator className="grid place-items-center">
        {indeterminate ? <Minus className="size-3.5" strokeWidth={2.5} /> : <Check className="size-3.5" strokeWidth={2.5} />}
      </BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  );
  if (!children) return box;
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] text-ink-soft">
      {box}
      {children}
    </label>
  );
}

/** Liga/desliga uma preferência com efeito imediato. Não use para "aceito os termos". */
export function Switch({
  label,
  checked,
  onCheckedChange,
  className,
  hideLabel,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
  hideLabel?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={hideLabel ? label : undefined}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "inline-flex h-10 items-center gap-2.5 whitespace-nowrap text-[12.5px] text-muted outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
        className,
      )}
    >
      <span aria-hidden className={cn("flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors", checked ? "bg-primary" : "bg-line-strong")}>
        <span className={cn("h-4 w-4 rounded-full bg-surface shadow-sm transition-transform", checked && "translate-x-4")} />
      </span>
      {!hideLabel && label}
    </button>
  );
}

/** Campo de busca com lupa. Use em toolbar; em formulário use fieldClass. */
export function SearchInput({
  value,
  onChange,
  placeholder = "Buscar…",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative min-w-0", className)}>
      <Search aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
      <input
        type="search"
        aria-label={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-line bg-surface pl-8 pr-3 text-[13.5px] outline-none placeholder:text-muted"
      />
    </div>
  );
}
