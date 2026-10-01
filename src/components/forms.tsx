"use client";

import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { Select as BaseSelect } from "@base-ui/react/select";
import { Check, ChevronDown, ChevronsUpDown, Minus, Search, X } from "lucide-react";
import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useId,
  useMemo,
  useRef,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { cn } from "../lib/cn";
import { usePortalContainer } from "../lib/portal";
import { normalize } from "../lib/text";
import { popupClass } from "./overlays";

/*
 * Formulários. Regras (docs/componentes/formularios.md):
 *  - Nenhum <select> cru: lista curta fixa → Select; lista de entidades → Combobox;
 *    vários valores → MultiSelect (lista) ou CheckboxGroup (≤ 8 sempre visíveis);
 *    lista longa/simples em que o seletor do sistema é melhor (celular) → NativeSelect.
 *  - Rótulo sempre visível acima do campo (12.5px muted). Placeholder é exemplo, não rótulo.
 *  - Campo 40px de altura, 14px de texto, raio 8, borda line.
 *  - Ajuda e erro abaixo do campo, 12px.
 *
 * Regra do `label` (igual em todos os campos do DS):
 *  - `label` vira o rótulo VISÍVEL acima do campo e o nome acessível.
 *  - Dentro de <FieldBlock label=…> o rótulo é do FieldBlock: o campo não repete.
 *  - `hideLabel` = só nome acessível (toolbar, célula de tabela, filtro).
 *  - Controles de barra (Select size="compact", ToggleGroup, SegmentedControl)
 *    escondem o rótulo por padrão.
 */

export const fieldClass =
  "h-10 w-full rounded-lg border border-line bg-surface px-3 text-[14px] text-ink placeholder:text-muted";
export const areaClass =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-[14px] leading-relaxed text-ink placeholder:text-muted";

/* ------------------------------------------------------------------ */
/* Contexto de campo (FieldBlock → controle)                          */
/* ------------------------------------------------------------------ */

type FieldContextValue = { id: string; describedBy?: string; invalid?: boolean };
const FieldContext = createContext<FieldContextValue | null>(null);

/** Dentro de um FieldBlock? Devolve id/aria do campo (para controles próprios). */
export function useFieldContext() {
  return useContext(FieldContext);
}

/**
 * Rótulo + controle + ajuda/erro. Se o filho é input/textarea nativo, liga
 * `htmlFor` automaticamente; os controles do DS (Select, Combobox,
 * MultiSelect, NativeSelect, DatePicker…) leem o contexto e não repetem o
 * rótulo. Qualquer outro filho vira um `role=group` rotulado.
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
  const ctx = useMemo(() => ({ id, describedBy, invalid: Boolean(error) }), [id, describedBy, error]);
  const labelText = (
    <>
      {label}
      {optional && <span className="ml-1 text-muted">(opcional)</span>}
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
      {control ? (
        cloneElement(control, {
          id,
          "aria-invalid": error ? true : undefined,
          "aria-describedby": describedBy,
        })
      ) : (
        <FieldContext.Provider value={ctx}>{children}</FieldContext.Provider>
      )}
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

/** Props de rótulo comuns a Select, Combobox, MultiSelect, NativeSelect, DatePicker. */
export type ControlLabelProps = {
  /** Rótulo visível acima do campo e nome acessível. */
  label: string;
  /** Só nome acessível, sem rótulo visível (toolbar, tabela, filtro). */
  hideLabel?: boolean;
  /** Texto de ajuda abaixo do campo. */
  hint?: ReactNode;
  /** Erro abaixo do campo (substitui a ajuda) e borda rose. */
  error?: ReactNode;
  /** Acrescenta "(opcional)" ao rótulo. */
  optional?: boolean;
};

/**
 * Liga um controle ao rótulo: dentro de FieldBlock usa o contexto; fora,
 * desenha rótulo/ajuda/erro (a menos que `hideLabel`). Uso interno do DS
 * e de controles próprios que queiram a mesma regra.
 */
export function useControlLabel({ id, label, hideLabel, hint, error, optional }: ControlLabelProps & { id?: string }) {
  const ctx = useContext(FieldContext);
  const auto = useId();
  const controlId = id ?? ctx?.id ?? auto;
  const ownDesc = !ctx && (hint || error) ? `${controlId}-desc` : undefined;
  const describedBy = ctx?.describedBy ?? ownDesc;
  const invalid = Boolean(error) || Boolean(ctx?.invalid);
  const showLabel = !ctx && !hideLabel;
  const wrap = (control: ReactNode) => {
    if (ctx || (!showLabel && !ownDesc)) return control;
    return (
      <div className="min-w-0">
        {showLabel && (
          <label htmlFor={controlId} className="mb-1.5 block text-[12.5px] text-muted">
            {label}
            {optional && <span className="ml-1 text-muted">(opcional)</span>}
          </label>
        )}
        {control}
        {ownDesc && (
          <p id={ownDesc} className={cn("m-0 mt-1.5 text-[12px] leading-5", error ? "text-rose" : "text-muted")}>
            {error ?? hint}
          </p>
        )}
      </div>
    );
  };
  return { id: controlId, describedBy, invalid, wrap };
}

/*
 * Popups de seleção no celular (< 640px): Select e DatePicker viram folha
 * inferior com fundo escurecido (classe ds-sheet-sm em components.css);
 * Combobox/MultiSelect (têm busca → teclado) ocupam a largura toda, ancorados
 * ao campo. `presentation="popover"` mantém o popover em qualquer largura.
 */
export type PopupPresentation = "auto" | "popover";
export const sheetPositionerClass = "ds-sheet-sm";
export const fullWidthPositionerClass = "ds-fullwidth-sm";
export const sheetBackdropClass =
  "fixed inset-0 z-[99] bg-ink/30 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 sm:hidden";

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
  hideLabel,
  hint,
  error,
  optional,
  placeholder = "Selecione…",
  disabled,
  required,
  id,
  name,
  size = "field",
  tone = "neutral",
  className,
  align = "start",
  presentation = "auto",
}: ControlLabelProps & {
  options: SelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
  /** field = formulário (40px, rótulo visível); compact = linha de tabela / toolbar (32px, rótulo só acessível). */
  size?: "field" | "compact";
  tone?: keyof typeof selectTones;
  className?: string;
  align?: "start" | "end";
  /** auto = folha inferior no celular; popover = sempre ancorado ao campo. */
  presentation?: PopupPresentation;
}) {
  const [triggerRef, container] = usePortalContainer();
  const field = useControlLabel({ id, label, hideLabel: hideLabel ?? size === "compact", hint, error, optional });
  const items = options.map((o) => ({ value: o.value, label: o.label }));
  const selected = options.find((o) => o.value === value);
  const sheet = presentation === "auto";
  return field.wrap(
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
        id={field.id}
        aria-label={label}
        aria-describedby={field.describedBy}
        aria-invalid={field.invalid || undefined}
        className={cn(
          "flex min-w-0 items-center justify-between gap-2 rounded-lg border text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 data-disabled:cursor-not-allowed data-disabled:bg-soft/60 data-disabled:text-muted",
          size === "field" ? "h-10 w-full px-3 text-[14px]" : "h-8 px-2.5 text-[12.5px] font-medium",
          selectTones[tone],
          field.invalid && "border-rose/50",
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
        {sheet && <BaseSelect.Backdrop className={sheetBackdropClass} />}
        <BaseSelect.Positioner
          align={align}
          sideOffset={5}
          collisionPadding={12}
          className={cn("z-[100] select-none outline-none", sheet && sheetPositionerClass)}
        >
          <BaseSelect.Popup aria-label={label} className={cn(popupClass, "min-w-[max(180px,var(--anchor-width))] max-w-[calc(100vw-16px)] p-1.5")}>
            {sheet && (
              <div aria-hidden className="ds-sheet-title px-2.5 pb-1 pt-2 text-[12.5px] font-medium text-muted sm:hidden">
                {label}
              </div>
            )}
            <BaseSelect.List className="ds-sheet-list max-h-[min(320px,var(--available-height))] overflow-y-auto overscroll-contain outline-none">
              {options.map((option) => (
                <BaseSelect.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className="flex cursor-default items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] outline-none data-highlighted:bg-soft data-disabled:cursor-not-allowed data-disabled:text-muted max-sm:min-h-11"
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
    </BaseSelect.Root>,
  );
}

/* ------------------------------------------------------------------ */
/* NativeSelect                                                        */
/* ------------------------------------------------------------------ */

export type NativeSelectOption = { value: string; label: string; disabled?: boolean };

/**
 * `<select>` do sistema com a aparência do DS (equivalente ao native-select
 * do shadcn). Use quando o seletor do sistema é MELHOR: formulário no
 * celular (roda de opções do iOS/Android), lista longa e simples sem busca,
 * acessibilidade máxima, formulário sem JS. Para status/prioridade com
 * ícone use Select; para entidades com busca use Combobox.
 * `options` aceita grupos: `{ label: "Sudeste", options: [...] }` → <optgroup>.
 */
export function NativeSelect({
  options,
  value,
  onValueChange,
  label,
  hideLabel,
  hint,
  error,
  optional,
  placeholder,
  size = "md",
  id,
  className,
  ...rest
}: ControlLabelProps &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange" | "size" | "children"> & {
    options: (NativeSelectOption | { label: string; options: NativeSelectOption[] })[];
    value: string;
    onValueChange: (value: string) => void;
    /** Primeira opção vazia ("Selecione…"); o valor dela é "". */
    placeholder?: string;
    size?: "sm" | "md";
  }) {
  const field = useControlLabel({ id, label, hideLabel, hint, error, optional });
  const renderOption = (o: NativeSelectOption) => (
    <option key={o.value} value={o.value} disabled={o.disabled}>
      {o.label}
    </option>
  );
  return field.wrap(
    <div className={cn("relative min-w-0", className)}>
      {/* g4os-ds-disable-next-line native-select: este é o NativeSelect do DS (o <select> estilizado) */}
      <select
        id={field.id}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        aria-label={hideLabel ? label : undefined}
        aria-describedby={field.describedBy}
        aria-invalid={field.invalid || undefined}
        className={cn(
          "focus-field w-full min-w-0 cursor-pointer appearance-none rounded-lg border bg-surface pl-3 pr-9 text-ink outline-none transition-[border-color,box-shadow] disabled:cursor-not-allowed disabled:bg-soft/60 disabled:text-muted",
          size === "sm" ? "h-8 text-[13px]" : "h-10 text-[14px]",
          field.invalid ? "border-rose/50" : "border-line hover:border-line-strong",
          !value && placeholder && "text-muted",
        )}
        {...rest}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) =>
          "options" in o ? (
            <optgroup key={o.label} label={o.label}>
              {o.options.map(renderOption)}
            </optgroup>
          ) : (
            renderOption(o)
          ),
        )}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
    </div>,
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

type ComboboxProps = ControlLabelProps & {
  options: ComboboxOption[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
  className?: string;
  /** auto = no celular o popup ocupa a largura toda; popover = sempre ancorado. */
  presentation?: PopupPresentation;
} & (
    | { multiple?: false; value: string; onValueChange: (value: string) => void }
    | { multiple: true; value: string[]; onValueChange: (value: string[]) => void }
  );

const comboPopupClass =
  "flex max-h-[min(360px,var(--available-height))] w-[max(240px,var(--anchor-width))] max-w-[calc(100vw-16px)] flex-col overflow-hidden rounded-xl border border-line bg-popover text-ink shadow-xl shadow-black/10";

/**
 * Lista de entidades (pessoas, clientes, documentos) com busca sem acento.
 * Múltiplo mostra os escolhidos como chips removíveis abaixo do gatilho
 * (para listas com grupos, "Selecionar todos" e contagem, use MultiSelect).
 */
export function Combobox({ options, label, hideLabel, hint, error, optional, placeholder = "Selecione…", disabled, required, id, name, className, presentation = "auto", ...selection }: ComboboxProps) {
  const trigger = useRef<HTMLButtonElement | null>(null);
  const [portalRef, container] = usePortalContainer();
  const field = useControlLabel({ id, label, hideLabel, hint, error, optional });
  const selectedOptions = selection.multiple ? options.filter((o) => selection.value.includes(o.value)) : [];
  return field.wrap(
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
        id={field.id}
        aria-label={label}
        aria-describedby={field.describedBy}
        aria-invalid={field.invalid || undefined}
        className={cn(
          "flex min-w-0 items-center justify-between gap-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:bg-soft/60 disabled:text-muted",
          className ?? cn("h-10 w-full rounded-lg border bg-surface px-3 text-[14px]", field.invalid ? "border-rose/50" : "border-line hover:border-line-strong"),
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
                className="flex max-w-full items-center gap-1.5 rounded-lg border border-line bg-soft/60 py-1.5 pl-2.5 pr-2 text-[12px] hover:bg-soft disabled:cursor-not-allowed disabled:text-muted"
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
        <BaseCombobox.Positioner
          align="start"
          sideOffset={5}
          collisionPadding={12}
          className={cn("z-[100] max-w-[calc(100vw-16px)]", presentation === "auto" && fullWidthPositionerClass)}
        >
          <BaseCombobox.Popup aria-label={label} className={comboPopupClass}>
            <ComboSearch label={label} />
            <BaseCombobox.Empty>
              <div className="p-5 text-center text-[13px] text-muted">Nenhum resultado encontrado.</div>
            </BaseCombobox.Empty>
            <BaseCombobox.List className="min-h-0 overflow-y-auto overscroll-contain p-1.5 outline-none empty:p-0">
              {(option: ComboboxOption) => (
                <BaseCombobox.Item
                  key={option.value}
                  value={option}
                  disabled={option.disabled}
                  className="flex cursor-default items-center gap-3 rounded-lg px-2.5 py-2 text-[14px] outline-none data-highlighted:bg-soft data-disabled:cursor-not-allowed data-disabled:text-muted max-sm:min-h-11"
                >
                  <div className="min-w-0 flex-1">
                    <div className="break-words">{option.label}</div>
                    {option.description && <div className="mt-0.5 text-[12px] text-muted">{option.description}</div>}
                  </div>
                  <BaseCombobox.ItemIndicator>
                    <Check aria-hidden className="h-4 w-4 shrink-0 text-ink" />
                  </BaseCombobox.ItemIndicator>
                </BaseCombobox.Item>
              )}
            </BaseCombobox.List>
          </BaseCombobox.Popup>
        </BaseCombobox.Positioner>
      </BaseCombobox.Portal>
    </BaseCombobox.Root>,
  );
}

function ComboSearch({ label }: { label: string }) {
  return (
    <div className="focus-field flex shrink-0 items-center gap-2 border-b border-line px-3">
      <Search aria-hidden className="h-4 w-4 shrink-0 text-muted" />
      <BaseCombobox.Input
        aria-label={`Buscar em ${label.toLocaleLowerCase("pt-BR")}`}
        placeholder="Buscar…"
        className="h-11 w-full min-w-0 border-0 bg-transparent text-[14px] outline-none placeholder:text-muted"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* MultiSelect                                                         */
/* ------------------------------------------------------------------ */

export type MultiSelectOption = {
  value: string;
  label: string;
  description?: string;
  /** Cabeçalho do grupo (opções com o mesmo `group` ficam juntas, na ordem em que aparecem). */
  group?: string;
  disabled?: boolean;
  /** Por que está indisponível ("sem pessoas ativas"). Aparece na opção. */
  disabledReason?: string;
};

type MultiGroup = { value: string; items: MultiSelectOption[] };

/**
 * Vários valores de uma lista (cargos, equipes, etiquetas) num popup com
 * busca, caixas de seleção, grupos, "Selecionar todos" e "Limpar". O
 * gatilho mostra os nomes (até 2) ou a contagem; `display="chips"` mostra
 * os escolhidos como chips removíveis abaixo. Até ~8 opções que cabem na
 * tela: prefira CheckboxGroup (tudo visível, sem clique extra).
 */
export function MultiSelect({
  options,
  value,
  onValueChange,
  label,
  hideLabel,
  hint,
  error,
  optional,
  placeholder = "Selecione…",
  display = "summary",
  max,
  searchable,
  selectAll = true,
  disabled,
  id,
  name,
  className,
  presentation = "auto",
}: ControlLabelProps & {
  options: MultiSelectOption[];
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  /** summary = "Ana, Bruno" ou "5 selecionados" no gatilho; chips = chips removíveis abaixo. */
  display?: "summary" | "chips";
  /** Limite de escolhas; as demais ficam desabilitadas ao atingir. */
  max?: number;
  /** Busca no topo. Padrão: ligada a partir de 8 opções. */
  searchable?: boolean;
  /** Ações "Selecionar todos" / "Limpar" no rodapé. */
  selectAll?: boolean;
  disabled?: boolean;
  id?: string;
  name?: string;
  className?: string;
  presentation?: PopupPresentation;
}) {
  const trigger = useRef<HTMLButtonElement | null>(null);
  const [portalRef, container] = usePortalContainer();
  const field = useControlLabel({ id, label, hideLabel, hint, error, optional });
  const showSearch = searchable ?? options.length >= 8;
  const selected = options.filter((o) => value.includes(o.value));
  const full = max != null && value.length >= max;
  const isDisabled = (o: MultiSelectOption) => Boolean(o.disabled || o.disabledReason) || (full && !value.includes(o.value));
  const grouped = options.some((o) => o.group);
  const groups = useMemo<MultiGroup[]>(() => {
    if (!grouped) return [];
    const map = new Map<string, MultiSelectOption[]>();
    for (const o of options) {
      const g = o.group ?? "Outros";
      map.set(g, [...(map.get(g) ?? []), o]);
    }
    return [...map].map(([g, items]) => ({ value: g, items }));
  }, [options, grouped]);
  const enabled = options.filter((o) => !o.disabled && !o.disabledReason);
  const allOn = enabled.length > 0 && enabled.every((o) => value.includes(o.value));
  const summary =
    selected.length === 0 ? null : selected.length <= 2 ? selected.map((o) => o.label).join(", ") : `${selected.length} selecionados`;

  const item = (o: MultiSelectOption) => (
    <BaseCombobox.Item
      key={o.value}
      value={o}
      disabled={isDisabled(o)}
      className="group/item flex cursor-default items-start gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] outline-none data-highlighted:bg-soft data-disabled:cursor-not-allowed max-sm:min-h-11"
    >
      <span
        aria-hidden
        className={cn(
          "mt-px grid size-[18px] shrink-0 place-items-center rounded-[5px] border transition-colors",
          value.includes(o.value) ? "border-primary bg-primary text-on-primary" : "border-line-strong bg-surface",
          "group-data-disabled/item:opacity-50",
        )}
      >
        {value.includes(o.value) && <Check className="size-3" strokeWidth={3} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block break-words text-ink group-data-disabled/item:text-muted">{o.label}</span>
        {(o.disabledReason || o.description) && <span className="mt-0.5 block text-[12px] text-muted">{o.disabledReason ?? o.description}</span>}
      </span>
    </BaseCombobox.Item>
  );

  return field.wrap(
    <div className="min-w-0">
      <BaseCombobox.Root<MultiSelectOption, true>
        items={grouped ? (groups as unknown as MultiSelectOption[]) : options}
        multiple
        value={selected}
        onValueChange={(next) => onValueChange(next.map((o) => o.value))}
        isItemEqualToValue={(a, b) => a.value === b.value}
        itemToStringLabel={(o) => o.label}
        filter={(o, query) => normalize(`${o.label} ${o.description ?? ""} ${o.group ?? ""}`).includes(normalize(query.trim()))}
        disabled={disabled}
        name={name}
        autoHighlight
      >
        <BaseCombobox.Trigger
          ref={(el) => {
            trigger.current = el;
            portalRef(el);
          }}
          id={field.id}
          aria-label={label}
          aria-describedby={field.describedBy}
          aria-invalid={field.invalid || undefined}
          className={cn(
            "flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-lg border bg-surface px-3 text-left text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:bg-soft/60 disabled:text-muted",
            field.invalid ? "border-rose/50" : "border-line hover:border-line-strong",
            className,
          )}
        >
          <span className={cn("truncate", !summary && "text-muted")}>{summary ?? placeholder}</span>
          <span className="flex shrink-0 items-center gap-1.5">
            {selected.length > 2 && display === "summary" && (
              <span className="rounded-md bg-soft px-1.5 text-[11px] font-medium tabular-nums leading-5 text-ink-soft">{selected.length}</span>
            )}
            <ChevronsUpDown aria-hidden className="h-3.5 w-3.5 text-muted" />
          </span>
        </BaseCombobox.Trigger>
        <BaseCombobox.Portal container={container}>
          <BaseCombobox.Positioner
            align="start"
            sideOffset={5}
            collisionPadding={12}
            className={cn("z-[100] max-w-[calc(100vw-16px)]", presentation === "auto" && fullWidthPositionerClass)}
          >
            <BaseCombobox.Popup aria-label={label} className={comboPopupClass}>
              {showSearch ? (
                <ComboSearch label={label} />
              ) : (
                // Sem busca visível: o input continua (Base UI usa para teclado), só fora da vista.
                <BaseCombobox.Input aria-label={`Filtrar ${label.toLocaleLowerCase("pt-BR")}`} className="sr-only" />
              )}
              <BaseCombobox.Empty>
                <div className="p-5 text-center text-[13px] text-muted">Nenhum resultado encontrado.</div>
              </BaseCombobox.Empty>
              <BaseCombobox.List className="min-h-0 overflow-y-auto overscroll-contain p-1.5 outline-none empty:p-0">
                {grouped
                  ? (g: MultiGroup) => (
                      <BaseCombobox.Group key={g.value} items={g.items} className="pb-1 last:pb-0">
                        <BaseCombobox.GroupLabel className="px-2.5 pb-1 pt-2 text-[11px] font-medium uppercase tracking-[0.06em] text-muted">
                          {g.value}
                        </BaseCombobox.GroupLabel>
                        <BaseCombobox.Collection>{(o: MultiSelectOption) => item(o)}</BaseCombobox.Collection>
                      </BaseCombobox.Group>
                    )
                  : (o: MultiSelectOption) => item(o)}
              </BaseCombobox.List>
              {(selectAll || max != null) && (
                <div className="flex shrink-0 items-center justify-between gap-2 border-t border-line px-2 py-1.5">
                  <span className="px-1 text-[12px] tabular-nums text-muted">
                    {max != null ? `${value.length} de ${max}` : `${value.length} ${value.length === 1 ? "selecionado" : "selecionados"}`}
                  </span>
                  {selectAll && (
                    <span className="flex gap-1">
                      {max == null && (
                        <button
                          type="button"
                          disabled={allOn}
                          onClick={() => onValueChange([...new Set([...value, ...enabled.map((o) => o.value)])])}
                          className="rounded-md px-2 py-1 text-[12.5px] text-ink-soft hover:bg-soft hover:text-ink disabled:cursor-not-allowed disabled:text-muted disabled:hover:bg-transparent"
                        >
                          Selecionar todos
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={value.length === 0}
                        onClick={() => onValueChange([])}
                        className="rounded-md px-2 py-1 text-[12.5px] text-ink-soft hover:bg-soft hover:text-ink disabled:cursor-not-allowed disabled:text-muted disabled:hover:bg-transparent"
                      >
                        Limpar
                      </button>
                    </span>
                  )}
                </div>
              )}
            </BaseCombobox.Popup>
          </BaseCombobox.Positioner>
        </BaseCombobox.Portal>
      </BaseCombobox.Root>
      {display === "chips" && selected.length > 0 && (
        <ul aria-label={`${label} selecionados`} className="mt-2 flex list-none flex-wrap gap-1.5 p-0">
          {selected.map((o) => (
            <li key={o.value} className="max-w-full">
              <button
                type="button"
                disabled={disabled}
                aria-label={`Remover ${o.label}`}
                className="flex max-w-full items-center gap-1.5 rounded-lg border border-line bg-soft/60 py-1 pl-2.5 pr-2 text-[12.5px] hover:bg-soft disabled:cursor-not-allowed disabled:text-muted"
                onClick={() => {
                  onValueChange(value.filter((v) => v !== o.value));
                  trigger.current?.focus();
                }}
              >
                <span className="truncate">{o.label}</span>
                <X aria-hidden className="h-3 w-3 shrink-0 text-muted" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>,
  );
}

/* ------------------------------------------------------------------ */
/* Checkbox, CheckboxGroup, Switch                                     */
/* ------------------------------------------------------------------ */

/**
 * Caixa 20px, marcada = primária. `label` aparece ao lado da caixa (como no
 * Switch); `hideLabel` deixa só a caixa com nome acessível (seleção de linha
 * de tabela, tarefa com título ao lado). `children` substitui o texto visível
 * por conteúdo rico ("Aceito os <a>termos</a>").
 */
export function Checkbox({
  checked,
  onCheckedChange,
  label,
  hideLabel,
  description,
  disabled,
  indeterminate,
  id,
  name,
  className,
  children,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  /** Só a caixa, com `label` como nome acessível. */
  hideLabel?: boolean;
  /** Linha de apoio abaixo do rótulo. */
  description?: ReactNode;
  disabled?: boolean;
  indeterminate?: boolean;
  id?: string;
  name?: string;
  /** Na caixa quando `hideLabel`; no rótulo (linha inteira) quando visível. */
  className?: string;
  children?: ReactNode;
}) {
  const visible = !hideLabel || Boolean(children);
  const descId = useId();
  const box = (
    <BaseCheckbox.Root
      id={id}
      name={name}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      indeterminate={indeterminate}
      aria-label={visible ? undefined : label}
      aria-describedby={visible && description ? descId : undefined}
      className={cn(
        "ds-hit inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-[5px] border text-on-primary outline-none focus-visible:ring-2 focus-visible:ring-accent/40 data-disabled:cursor-not-allowed",
        checked || indeterminate
          ? "border-primary bg-primary data-disabled:opacity-55"
          : "border-line-strong bg-surface hover:border-ink data-disabled:bg-soft data-disabled:hover:border-line-strong",
        visible ? "mt-px" : className,
      )}
    >
      <BaseCheckbox.Indicator className="grid place-items-center">
        {indeterminate ? <Minus className="size-3.5" strokeWidth={2.5} /> : <Check className="size-3.5" strokeWidth={2.5} />}
      </BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  );
  if (!visible) return box;
  return (
    <label className={cn("flex w-fit max-w-full items-start gap-2.5 text-[13.5px] leading-5", disabled ? "cursor-not-allowed text-muted" : "cursor-pointer text-ink", className)}>
      {box}
      <span className="min-w-0">
        <span className="block">{children ?? label}</span>
        {description && (
          <span id={descId} className="mt-0.5 block text-[12px] leading-snug text-muted">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}

export type CheckboxGroupOption = {
  value: string;
  label: string;
  description?: ReactNode;
  disabled?: boolean;
  /** Por que está indisponível. Aparece como descrição e desabilita. */
  disabledReason?: string;
};

/**
 * Vários valores com TODAS as opções visíveis (2–8 itens, até ~12 em
 * grade): cargos que recebem um aviso, canais de notificação, permissões.
 * "Selecionar todos" vira caixa tri-estado no topo. Mais que isso ou com
 * busca: MultiSelect.
 */
export function CheckboxGroup({
  label,
  hideLabel,
  hint,
  error,
  optional,
  options,
  value,
  onValueChange,
  columns = 1,
  selectAll,
  max,
  disabled,
  className,
}: ControlLabelProps & {
  options: CheckboxGroupOption[];
  value: string[];
  onValueChange: (value: string[]) => void;
  /** Colunas a partir de 640px (no celular sempre 1). */
  columns?: 1 | 2 | 3;
  /** Caixa "Selecionar todos" (tri-estado) acima das opções. */
  selectAll?: boolean | string;
  max?: number;
  disabled?: boolean;
  className?: string;
}) {
  const ids = useId();
  const ctx = useContext(FieldContext);
  const descId = ctx?.describedBy ?? (hint || error ? `${ids}-desc` : undefined);
  const showLabel = !ctx && !hideLabel;
  const enabled = options.filter((o) => !o.disabled && !o.disabledReason);
  const onCount = enabled.filter((o) => value.includes(o.value)).length;
  const full = max != null && value.length >= max;
  const toggle = (v: string, on: boolean) => onValueChange(on ? [...value, v] : value.filter((x) => x !== v));
  const cols = { 1: "", 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3" }[columns];
  return (
    <div
      role="group"
      aria-labelledby={showLabel ? `${ids}-lbl` : undefined}
      aria-label={showLabel ? undefined : label}
      aria-describedby={descId}
      className={cn("min-w-0", className)}
    >
      {showLabel && (
        <div id={`${ids}-lbl`} className="mb-2 text-[12.5px] text-muted">
          {label}
          {optional && <span className="ml-1 text-muted">(opcional)</span>}
        </div>
      )}
      {selectAll && max == null && enabled.length > 1 && (
        <div className="mb-2 border-b border-line pb-2">
          <Checkbox
            label={typeof selectAll === "string" ? selectAll : "Selecionar todos"}
            checked={onCount === enabled.length}
            indeterminate={onCount > 0 && onCount < enabled.length}
            disabled={disabled}
            onCheckedChange={(on) => onValueChange(on ? [...new Set([...value, ...enabled.map((o) => o.value)])] : value.filter((v) => !enabled.some((o) => o.value === v)))}
          />
        </div>
      )}
      <div className={cn("grid gap-x-6 gap-y-2.5", cols)}>
        {options.map((o) => {
          const on = value.includes(o.value);
          return (
            <Checkbox
              key={o.value}
              label={o.label}
              description={o.disabledReason ?? o.description}
              checked={on}
              disabled={disabled || o.disabled || Boolean(o.disabledReason) || (full && !on)}
              onCheckedChange={(next) => toggle(o.value, next)}
            />
          );
        })}
      </div>
      {!ctx && (error || hint || max != null) && (
        <p id={descId} className={cn("m-0 mt-2 text-[12px] leading-5", error ? "text-rose" : "text-muted")}>
          {error ?? hint ?? `${value.length} de ${max} selecionados.`}
        </p>
      )}
    </div>
  );
}

/** Liga/desliga uma preferência com efeito imediato. Não use para "aceito os termos". */
export function Switch({
  label,
  checked,
  onCheckedChange,
  className,
  hideLabel,
  disabled,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
  hideLabel?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={hideLabel ? label : undefined}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "inline-flex min-h-10 max-w-full items-center gap-2.5 text-left text-[12.5px] text-muted outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed",
        className,
      )}
    >
      <span aria-hidden className={cn("flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors", checked ? "bg-primary" : "bg-line-strong", disabled && "opacity-55")}>
        <span className={cn("h-4 w-4 rounded-full bg-surface shadow-sm transition-transform", checked && "translate-x-4")} />
      </span>
      {!hideLabel && <span className="min-w-0 py-1 leading-snug">{label}</span>}
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
