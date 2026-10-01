"use client";
/* ds-audit-ignore-file hex-color: amostras do ColorPicker são DADOS (valores que a pessoa escolhe), não estilo da interface */

import { Popover as BasePopover } from "@base-ui/react/popover";
import { Toggle as BaseToggle } from "@base-ui/react/toggle";
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { cn } from "../lib/cn";
import { bestOn, contrast } from "../lib/color";
import { formatNumber } from "../lib/format";
import { popupClass } from "./overlays";

/*
 * Controles complementares (equivalentes ao Toggle, Button Group e Input
 * Group do shadcn/ui) e ColorPicker para personalização de marca.
 */

/* ------------------------------------------------------------------ */
/* Toggle                                                              */
/* ------------------------------------------------------------------ */

/**
 * Botão liga/desliga isolado (negrito, fixar, favoritar, mostrar arquivados).
 * Vários relacionados? ToggleGroup. Preferência com efeito imediato e rótulo
 * longo? Switch. Só ícone: passe `label` (vira aria-label + title).
 */
export function Toggle({
  pressed,
  onPressedChange,
  children,
  label,
  variant = "outline",
  size = "md",
  disabled,
  className,
}: {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  children: ReactNode;
  /** Obrigatório quando `children` é só um ícone. */
  label?: string;
  /** "outline" = borda, ligado em `primary` (como ToggleGroup); "quiet" = sem borda, ligado em gelo (barras de ferramenta). */
  variant?: "outline" | "quiet";
  size?: "sm" | "md";
  disabled?: boolean;
  className?: string;
}) {
  return (
    <BaseToggle
      pressed={pressed}
      onPressedChange={(p) => onPressedChange(p)}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:h-4 [&_svg]:w-4",
        size === "sm" ? "h-8 min-w-8 px-2 text-[12.5px]" : "h-9 min-w-9 px-2.5 text-[13px]",
        variant === "outline"
          ? "border border-line bg-surface text-ink-soft hover:bg-soft hover:text-ink data-pressed:border-primary data-pressed:bg-primary data-pressed:text-on-primary"
          : "text-muted hover:bg-soft hover:text-ink data-pressed:bg-soft data-pressed:text-ink data-pressed:ring-1 data-pressed:ring-line-strong",
        className,
      )}
    >
      {children}
    </BaseToggle>
  );
}

/* ------------------------------------------------------------------ */
/* ButtonGroup                                                         */
/* ------------------------------------------------------------------ */

/**
 * Botões colados que formam uma ação composta (Anterior | Próximo, Copiar | ⌄,
 * zoom − 100 % +). Filhos: Button, IconButton, ButtonGroupText. Para escolher
 * um entre vários, use SegmentedControl; para ligar/desligar, ToggleGroup.
 */
export function ButtonGroup({
  children,
  label,
  orientation = "horizontal",
  className,
}: {
  children: ReactNode;
  /** Nome acessível do grupo ("Navegação entre registros"). */
  label: string;
  orientation?: "horizontal" | "vertical";
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "inline-flex isolate [&>*]:rounded-none [&>*:focus-visible]:z-10 [&>*:hover]:z-[1]",
        orientation === "horizontal"
          ? "flex-row items-stretch [&>*:first-child]:rounded-l-lg [&>*:last-child]:rounded-r-lg [&>*+*]:-ml-px"
          : "flex-col [&>*:first-child]:rounded-t-lg [&>*:last-child]:rounded-b-lg [&>*+*]:-mt-px",
        // IconButton solto não tem borda: dentro do grupo ganha o anel dos botões ghost.
        "[&>button:not(.ui-button)]:bg-surface [&>button:not(.ui-button)]:ring-1 [&>button:not(.ui-button)]:ring-line",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Segmento de texto não clicável dentro de um ButtonGroup ("100 %", "Página 2"). */
export function ButtonGroupText({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center bg-soft px-3 text-[13px] tabular-nums text-ink-soft ring-1 ring-line", className)}>{children}</span>;
}

/* ------------------------------------------------------------------ */
/* InputGroup                                                          */
/* ------------------------------------------------------------------ */

/**
 * Campo com complementos: ícone, prefixo/sufixo de texto, botão, atalho,
 * contador; acima/abaixo do texto (composer com barra de ações). Monte com
 * InputGroupAddon + InputGroupInput (ou InputGroupTextarea) + InputGroupText
 * / InputGroupButton. O contêiner mostra o foco. Para os casos comuns, TextField
 * (`icon`, `prefix`, `suffix`) já basta; dê o nome com Label/FieldBlock ou `aria-label`.
 */
export function InputGroup({
  children,
  invalid,
  size = "md",
  className,
}: {
  children: ReactNode;
  /** Borda de erro (combine com a mensagem do FieldBlock). */
  invalid?: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <div
      role="group"
      className={cn(
        "focus-field flex w-full min-w-0 items-center rounded-lg border bg-surface text-ink",
        size === "sm" ? "min-h-8 text-[13px]" : "min-h-10 text-[14px]",
        "has-[>[data-align^=block]]:flex-col has-[>[data-align^=block]]:items-stretch",
        "has-[:disabled]:cursor-not-allowed has-[:disabled]:bg-soft/60 has-[:disabled]:text-muted",
        invalid ? "border-rose/50 focus-within:border-rose" : "border-line",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Complemento do InputGroup. inline-start/inline-end = na linha do campo;
 * block-start/block-end = faixa acima/abaixo (cabeçalho, barra de ações).
 */
export function InputGroupAddon({ children, align = "inline-start", className }: { children: ReactNode; align?: "inline-start" | "inline-end" | "block-start" | "block-end"; className?: string }) {
  return (
    <div
      data-align={align}
      className={cn(
        "flex items-center gap-1.5 text-muted [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0",
        align === "inline-start" && "order-first min-w-0 max-w-[55%] shrink pl-3",
        align === "inline-end" && "order-last shrink-0 pr-1.5 has-[>span:last-child]:pr-3",
        align === "block-start" && "order-first shrink-0 border-b border-line px-3 py-2",
        align === "block-end" && "order-last shrink-0 px-2 pb-2",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Input sem caixa para dentro do InputGroup. Passe `id` (Label) ou `aria-label`. */
export function InputGroupInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("ds-bare h-full min-h-[inherit] w-0 min-w-0 flex-1 bg-transparent px-3 outline-none placeholder:text-muted disabled:cursor-not-allowed", className)} {...rest} />;
}

/** Textarea sem caixa para dentro do InputGroup (composer, comentário com barra). */
export function InputGroupTextarea({ className, rows = 3, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={rows}
      className={cn("ds-bare w-full min-w-0 flex-1 resize-none bg-transparent px-3 py-2.5 leading-relaxed outline-none placeholder:text-muted disabled:cursor-not-allowed", className)}
      {...rest}
    />
  );
}

/** Texto do complemento: "R$", "https://", ".com.br", "12/280". */
export function InputGroupText({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("min-w-0 truncate whitespace-nowrap text-[13px] tabular-nums text-muted", className)}>{children}</span>;
}

/**
 * Botão compacto dentro do InputGroup (copiar, limpar, enviar, mostrar senha).
 * Só ícone: `label` obrigatório.
 */
export function InputGroupButton({
  children,
  label,
  variant = "quiet",
  className,
  type = "button",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; label?: string; variant?: "quiet" | "ghost" | "primary" }) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-7 min-w-7 shrink-0 items-center justify-center gap-1.5 rounded-md px-2 text-[12.5px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:h-3.5 [&_svg]:w-3.5",
        variant === "quiet" && "text-muted hover:bg-soft hover:text-ink",
        variant === "ghost" && "bg-surface text-ink ring-1 ring-line hover:bg-soft",
        variant === "primary" && "bg-primary text-on-primary hover:bg-primary/90",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* ColorPicker                                                         */
/* ------------------------------------------------------------------ */

/** Amostras padrão: neutros + paleta de marca G4 + tons de apoio. */
export const colorSwatches = [
  "#202124", "#4b5563", "#6b6e76", "#001F35", "#184560", "#B9915B",
  "#842E20", "#441B1B", "#1d4ed8", "#0f766e", "#15803d", "#b45309",
  "#b71c1c", "#be185d", "#6d28d9", "#0e7490",
];

const HEX = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i;
const normHex = (v: string) => {
  const m = v.trim().match(HEX);
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1];
  return `#${h.toUpperCase()}`;
};

/**
 * Escolha de cor para personalização (cor da marca do cliente, etiqueta,
 * calendário, pipeline). Amostras + hex digitável + seletor livre do sistema,
 * com o contraste do texto sobre a cor. Na interface, cor de componente vem de
 * token: use o valor escolhido em `deriveBrand`/`brandCss` ou como `tint`.
 */
export function ColorPicker({
  label,
  value,
  onChange,
  swatches = colorSwatches,
  allowCustom = true,
  showContrast = true,
  hint,
  disabled,
  className,
}: {
  /** Rótulo visível acima do campo. */
  label: string;
  /** Hex (#RRGGBB). */
  value: string;
  onChange: (hex: string) => void;
  swatches?: string[];
  /** Hex digitável e seletor livre. Desligue para paleta fechada (etiquetas). */
  allowCustom?: boolean;
  /** Mostra o contraste do melhor texto (claro/escuro) sobre a cor. */
  showContrast?: boolean;
  hint?: ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  const id = useId();
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const current = normHex(value) ?? value;
  const on = normHex(current) ? bestOn(current) : "#ffffff";
  const ratio = normHex(current) ? contrast(current, on) : 0;
  const commit = (v: string) => {
    const h = normHex(v);
    if (h) onChange(h);
    else setDraft(value);
  };
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <span id={`${id}-label`} className="text-[12.5px] font-medium text-ink">
        {label}
      </span>
      <BasePopover.Root>
        <BasePopover.Trigger
          disabled={disabled}
          aria-labelledby={`${id}-label ${id}-value`}
          className="focus-field flex h-10 w-full items-center gap-2.5 rounded-lg border border-line bg-surface px-2.5 text-left text-[14px] text-ink outline-none hover:border-line-strong focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:bg-soft/60 data-popup-open:border-line-strong"
        >
          <span aria-hidden className="h-6 w-6 shrink-0 rounded-md ring-1 ring-inset ring-line-strong" style={{ background: current }} />
          <span id={`${id}-value`} className="min-w-0 flex-1 truncate font-mono text-[13px] uppercase">
            {current}
          </span>
          <ChevronDown aria-hidden className="h-4 w-4 shrink-0 text-muted" />
        </BasePopover.Trigger>
        <BasePopover.Portal>
          <BasePopover.Positioner side="bottom" align="start" sideOffset={6} collisionPadding={12} className="z-[100]">
            <BasePopover.Popup className={cn(popupClass, "w-[264px] max-w-[calc(100vw-24px)] p-3")}>
              <div role="radiogroup" aria-label={`${label}: amostras`} className="grid grid-cols-8 gap-1.5">
                {swatches.map((s) => {
                  const sel = normHex(s) === normHex(current);
                  return (
                    <button
                      key={s}
                      type="button"
                      role="radio"
                      aria-checked={sel}
                      aria-label={s.toUpperCase()}
                      title={s.toUpperCase()}
                      onClick={() => onChange(normHex(s) ?? s)}
                      className="grid aspect-square place-items-center rounded-md ring-1 ring-inset ring-line-strong transition-transform hover:scale-110 motion-reduce:transition-none"
                      style={{ background: s, color: bestOn(normHex(s) ?? "#000000") }}
                    >
                      {sel && <Check aria-hidden className="h-3.5 w-3.5" strokeWidth={2.5} />}
                    </button>
                  );
                })}
              </div>
              {allowCustom && (
                <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
                  <label className="relative h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-lg ring-1 ring-line-strong" style={{ background: current }}>
                    <span className="sr-only">Escolher cor livre</span>
                    <input
                      type="color"
                      value={normHex(current) ?? "#000000"}
                      onChange={(e) => onChange(e.target.value.toUpperCase())}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                  </label>
                  <div className="focus-field flex h-9 min-w-0 flex-1 items-center rounded-lg border border-line bg-surface">
                    <span className="pl-2.5 text-[13px] text-muted" aria-hidden>
                      Hex
                    </span>
                    <input
                      aria-label={`${label}: código hexadecimal`}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onBlur={(e) => commit(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && commit((e.target as HTMLInputElement).value)}
                      spellCheck={false}
                      maxLength={7}
                      className="ds-bare h-full min-w-0 flex-1 bg-transparent px-2 font-mono text-[13px] uppercase outline-none"
                    />
                  </div>
                </div>
              )}
              {showContrast && normHex(current) && (
                <p className="m-0 mt-2.5 text-[12px] text-muted">
                  Texto {on === "#ffffff" ? "claro" : "escuro"} sobre a cor: <span className="tabular-nums text-ink">{formatNumber(ratio, 1)}:1</span>{" "}
                  {ratio >= 4.5 ? "· passa AA" : ratio >= 3 ? "· só texto grande (AA 3:1)" : "· reprova AA"}
                </p>
              )}
            </BasePopover.Popup>
          </BasePopover.Positioner>
        </BasePopover.Portal>
      </BasePopover.Root>
      {hint && <p className="m-0 text-[12px] text-muted">{hint}</p>}
    </div>
  );
}
