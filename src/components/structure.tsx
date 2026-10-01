"use client";

import { ScrollArea as BaseScrollArea } from "@base-ui/react/scroll-area";
import { Separator as BaseSeparator } from "@base-ui/react/separator";
import { createContext, useContext, type CSSProperties, type HTMLAttributes, type ReactNode, type TdHTMLAttributes, type ThHTMLAttributes } from "react";
import { cn } from "../lib/cn";
import { DsLink } from "./primitives";

/*
 * Peças estruturais (equivalentes ao Separator, Scroll Area, Label, Field,
 * Item, Table e Typography do shadcn/ui), no tema do DS:
 *   Separator      divisória de 1 px, com rótulo opcional ("ou", data)
 *   ScrollArea     área com rolagem própria, barra fina e esmaecimento nas bordas
 *   Label          rótulo solto (quando FieldBlock não serve)
 *   FieldSet       grupo de campos com legenda (fieldset + legend nativos)
 *   Item           linha genérica: mídia · título/descrição · ações
 *   Table          tabela estática simples (sem ordenação/seleção: use DataTable)
 *   Prose          texto longo formatado (markdown renderizado, termos, ajuda)
 */

/* ------------------------------------------------------------------ */
/* Separator                                                           */
/* ------------------------------------------------------------------ */

/**
 * Divisória de 1 px em `line`. Com `label`, vira divisória rotulada
 * ("ou continue com", "Hoje"). Vertical: dê altura pelo pai (flex) ou `className`.
 */
export function Separator({
  orientation = "horizontal",
  label,
  className,
}: {
  orientation?: "horizontal" | "vertical";
  /** Texto curto no meio da linha. Só horizontal. */
  label?: ReactNode;
  className?: string;
}) {
  if (label && orientation === "horizontal")
    return (
      <div className={cn("flex items-center gap-3 text-[12px] text-muted", className)}>
        <BaseSeparator orientation="horizontal" className="h-px flex-1 bg-line" />
        <span className="shrink-0">{label}</span>
        <BaseSeparator orientation="horizontal" className="h-px flex-1 bg-line" />
      </div>
    );
  return (
    <BaseSeparator
      orientation={orientation}
      className={cn("shrink-0 bg-line", orientation === "horizontal" ? "h-px w-full" : "w-px self-stretch", className)}
    />
  );
}

/* ------------------------------------------------------------------ */
/* ScrollArea                                                          */
/* ------------------------------------------------------------------ */

const fadeY =
  "linear-gradient(to bottom, transparent 0, black min(20px, var(--scroll-area-overflow-y-start, 0px)), black calc(100% - min(20px, var(--scroll-area-overflow-y-end, 0px))), transparent 100%)";
const fadeX =
  "linear-gradient(to right, transparent 0, black min(20px, var(--scroll-area-overflow-x-start, 0px)), black calc(100% - min(20px, var(--scroll-area-overflow-x-end, 0px))), transparent 100%)";

/**
 * Área com rolagem própria: barra fina que aparece ao passar o mouse ou rolar,
 * esmaecimento nas bordas quando há mais conteúdo e foco por teclado.
 * Dê a altura (ou largura) pelo `className`/`maxHeight`. Use dentro de cards,
 * popovers e painéis; a página já rola sozinha (Page).
 */
export function ScrollArea({
  children,
  orientation = "vertical",
  maxHeight,
  fade = true,
  label,
  className,
  contentClassName,
}: {
  children: ReactNode;
  orientation?: "vertical" | "horizontal" | "both";
  /** Altura máxima (px ou CSS). Sem ela, use `className` com h-*. */
  maxHeight?: number | string;
  /** Esmaece a borda onde ainda há conteúdo. */
  fade?: boolean;
  /** Nome acessível da região rolável (ex.: "Lista de membros"). */
  label?: string;
  className?: string;
  contentClassName?: string;
}) {
  const y = orientation !== "horizontal";
  const x = orientation !== "vertical";
  const masks = fade ? [y && fadeY, x && fadeX].filter(Boolean).join(", ") : undefined;
  const viewportStyle: CSSProperties = {
    maxHeight,
    ...(masks ? { maskImage: masks, WebkitMaskImage: masks, maskComposite: "intersect", WebkitMaskComposite: "source-in" } : {}),
  };
  const bar =
    "flex touch-none select-none rounded-full p-0.5 opacity-0 transition-opacity duration-150 data-hovering:opacity-100 data-scrolling:opacity-100";
  return (
    <BaseScrollArea.Root className={cn("relative flex min-h-0 overflow-hidden", className)}>
      <BaseScrollArea.Viewport
        aria-label={label}
        role={label ? "region" : undefined}
        className="min-h-0 w-full flex-1 overscroll-contain rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        style={viewportStyle}
      >
        <BaseScrollArea.Content className={cn(x && "min-w-fit", contentClassName)}>{children}</BaseScrollArea.Content>
      </BaseScrollArea.Viewport>
      {y && (
        <BaseScrollArea.Scrollbar orientation="vertical" className={cn(bar, "w-2.5")}>
          <BaseScrollArea.Thumb className="w-full rounded-full bg-line-strong" />
        </BaseScrollArea.Scrollbar>
      )}
      {x && (
        <BaseScrollArea.Scrollbar orientation="horizontal" className={cn(bar, "h-2.5")}>
          <BaseScrollArea.Thumb className="h-full rounded-full bg-line-strong" />
        </BaseScrollArea.Scrollbar>
      )}
      {x && y && <BaseScrollArea.Corner />}
    </BaseScrollArea.Root>
  );
}

/* ------------------------------------------------------------------ */
/* Label e FieldSet                                                    */
/* ------------------------------------------------------------------ */

/**
 * Rótulo visível de um controle. Prefira `FieldBlock` (rótulo + ajuda + erro);
 * use Label quando o controle não é um campo do DS (InputGroup, controle próprio).
 */
export function Label({
  htmlFor,
  children,
  required,
  optional,
  className,
}: {
  /** id do controle. Obrigatório para o clique focar o campo e o leitor de tela ler o nome. */
  htmlFor: string;
  children: ReactNode;
  /** Marca "obrigatório" (asterisco com texto acessível). */
  required?: boolean;
  /** Marca "(opcional)": use quando a maioria do formulário é obrigatória. */
  optional?: boolean;
  className?: string;
}) {
  return (
    <label htmlFor={htmlFor} className={cn("inline-flex items-baseline gap-1 text-[12.5px] font-medium text-ink", className)}>
      {children}
      {required && (
        <span className="text-rose" aria-hidden>
          *
        </span>
      )}
      {required && <span className="sr-only">(obrigatório)</span>}
      {optional && <span className="font-normal text-muted">(opcional)</span>}
    </label>
  );
}

/**
 * Grupo de campos com legenda: endereço, dados de cobrança, permissões.
 * `fieldset` + `legend` nativos (leitores de tela anunciam o grupo).
 * `disabled` desliga todos os campos de dentro.
 */
export function FieldSet({
  legend,
  description,
  children,
  disabled,
  variant = "section",
  className,
}: {
  legend: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  disabled?: boolean;
  /** "section" = título de seção (15 px); "label" = rótulo de grupo (12.5 px), para radios/checkboxes. */
  variant?: "section" | "label";
  className?: string;
}) {
  return (
    <fieldset disabled={disabled} className={cn("m-0 min-w-0 border-0 p-0 disabled:opacity-60", className)}>
      <legend className={cn("m-0 p-0 text-ink", variant === "section" ? "text-[15px] font-semibold tracking-tight" : "text-[12.5px] font-medium")}>{legend}</legend>
      {description && <p className={cn("m-0 text-muted", variant === "section" ? "mt-1 text-[13px]" : "mt-0.5 text-[12px]")}>{description}</p>}
      <div className={variant === "section" ? "mt-4" : "mt-2"}>{children}</div>
    </fieldset>
  );
}

/** Empilha campos ou FieldSets com o espaçamento padrão de formulário. */
export function FieldGroup({ children, className, gap = "md" }: { children: ReactNode; className?: string; gap?: "sm" | "md" | "lg" }) {
  return <div className={cn("flex flex-col", { sm: "gap-3", md: "gap-5", lg: "gap-8" }[gap], className)}>{children}</div>;
}

/** Divisória entre grupos de um formulário, com rótulo opcional ("ou"). */
export function FieldSeparator({ label, className }: { label?: ReactNode; className?: string }) {
  return <Separator label={label} className={cn("my-1", className)} />;
}

/* ------------------------------------------------------------------ */
/* Item                                                                */
/* ------------------------------------------------------------------ */

/**
 * Linha genérica de conteúdo: mídia (ícone/avatar/imagem) · título e descrição ·
 * ações. Monte com ItemMedia, ItemContent, ItemTitle, ItemDescription e
 * ItemActions; agrupe com ItemGroup. Com `href`, o item inteiro vira link
 * (então não coloque botões em ItemActions). Para listas de registros com
 * contexto/meta/seta, `ListRow` já resolve.
 */
export function Item({
  children,
  variant = "default",
  size = "md",
  href,
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  /** "outline" = borda própria (item solto); "muted" = fundo gelo; "default" = sem moldura (dentro de ItemGroup/Card). */
  variant?: "default" | "outline" | "muted";
  size?: "sm" | "md";
  href?: string;
}) {
  const cls = cn(
    "group/item flex min-w-0 items-center gap-3 rounded-xl text-left text-ink",
    size === "sm" ? "px-3 py-2.5" : "px-4 py-3.5",
    variant === "outline" && "border border-line bg-surface",
    variant === "muted" && "bg-soft",
    href && "no-underline transition-colors hover:bg-soft",
    className,
  );
  const inGroup = useContext(ItemGroupContext);
  if (href) {
    const link = (
      <DsLink href={href} className={cls}>
        {children}
      </DsLink>
    );
    return inGroup ? <div role="listitem">{link}</div> : link;
  }
  return (
    <div role={inGroup ? "listitem" : undefined} className={cls} {...rest}>
      {children}
    </div>
  );
}

const ItemGroupContext = createContext(false);

/** Mídia à esquerda do Item: "icon" = quadrado gelo com ícone 16 px; "image" = miniatura 40 px. */
export function ItemMedia({ children, variant = "default", className }: { children: ReactNode; variant?: "default" | "icon" | "image"; className?: string }) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center self-start",
        variant === "icon" && "h-9 w-9 rounded-lg border border-line bg-soft text-ink-soft [&_svg]:h-4 [&_svg]:w-4",
        variant === "image" && "h-10 w-10 overflow-hidden rounded-lg [&_img]:h-full [&_img]:w-full [&_img]:object-cover",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ItemContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex min-w-0 flex-1 flex-col gap-0.5", className)}>{children}</div>;
}

export function ItemTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex min-w-0 items-center gap-2 text-[13.5px] font-medium leading-snug", className)}>{children}</div>;
}

export function ItemDescription({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("m-0 line-clamp-2 text-[12.5px] leading-relaxed text-muted", className)}>{children}</p>;
}

/** Ações à direita (Button ghost/quiet, IconButton, Switch, Badge). */
export function ItemActions({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex shrink-0 items-center gap-2", className)}>{children}</div>;
}

/** Lista de Items com borda única e divisórias. */
export function ItemGroup({ children, label, className }: { children: ReactNode; /** Nome acessível da lista. */ label?: string; className?: string }) {
  return (
    <ItemGroupContext.Provider value>
      <div role="list" aria-label={label} className={cn("divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface [&>*]:rounded-none [&>*>a]:rounded-none", className)}>
        {children}
      </div>
    </ItemGroupContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/* Table (estática)                                                    */
/* ------------------------------------------------------------------ */

/**
 * Tabela estática simples (comparativo, especificação, resumo de fatura).
 * Mesmo visual da DataTable, sem ordenação, seleção nem paginação: para
 * coleções de registros use DataTable/DataGrid. Rola na horizontal sozinha.
 */
export function Table({ children, className, label }: { children: ReactNode; className?: string; /** Nome acessível quando não há TableCaption. */ label?: string }) {
  return (
    <div className={cn("w-full overflow-x-auto rounded-xl border border-line bg-surface", className)}>
      <table aria-label={label} className="w-full border-collapse text-[13.5px]">
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <thead className={cn("bg-soft [&_tr]:border-b [&_tr]:border-line", className)}>{children}</thead>;
}

export function TableBody({ children, className }: { children: ReactNode; className?: string }) {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)}>{children}</tbody>;
}

export function TableFooter({ children, className }: { children: ReactNode; className?: string }) {
  return <tfoot className={cn("border-t border-line bg-soft font-medium [&>tr]:last:border-b-0", className)}>{children}</tfoot>;
}

export function TableRow({ children, className, selected }: { children: ReactNode; className?: string; /** Destaca a linha (seleção). */ selected?: boolean }) {
  return (
    <tr data-selected={selected ? "" : undefined} className={cn("border-b border-line transition-colors hover:bg-soft/50 data-selected:bg-soft", className)}>
      {children}
    </tr>
  );
}

/** Cabeçalho de coluna. `numeric` alinha à direita (valores, quantidades). */
export function TableHead({ children, className, numeric, ...rest }: ThHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return (
    <th scope="col" className={cn("h-9 whitespace-nowrap px-3 text-[12px] font-medium text-muted", numeric ? "text-right" : "text-left", className)} {...rest}>
      {children}
    </th>
  );
}

/** Célula. `numeric` = direita + tabular-nums (formate com formatCurrency/formatNumber). */
export function TableCell({ children, className, numeric, ...rest }: TdHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return (
    <td className={cn("px-3 py-2.5 align-middle text-ink", numeric && "text-right tabular-nums", className)} {...rest}>
      {children}
    </td>
  );
}

export function TableCaption({ children, className }: { children: ReactNode; className?: string }) {
  return <caption className={cn("caption-bottom border-t border-line px-3 py-2.5 text-left text-[12px] text-muted", className)}>{children}</caption>;
}

/* ------------------------------------------------------------------ */
/* Prose                                                               */
/* ------------------------------------------------------------------ */

const proseClass = [
  "max-w-[68ch] text-[14px] leading-relaxed text-ink-soft",
  "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
  "[&_h1]:mb-3 [&_h1]:mt-8 [&_h1]:text-[25px] [&_h1]:font-semibold [&_h1]:leading-tight [&_h1]:tracking-tight [&_h1]:text-ink",
  "[&_h2]:mb-2 [&_h2]:mt-8 [&_h2]:text-[18px] [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-ink",
  "[&_h3]:mb-1.5 [&_h3]:mt-6 [&_h3]:text-[15px] [&_h3]:font-semibold [&_h3]:text-ink",
  "[&_p]:my-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_li]:pl-1 [&_li]:marker:text-muted",
  "[&_a]:font-medium [&_a]:text-ink [&_a]:underline [&_a]:decoration-line-strong [&_a]:underline-offset-2 hover:[&_a]:decoration-ink",
  "[&_strong]:font-semibold [&_strong]:text-ink",
  "[&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-line-strong [&_blockquote]:pl-4 [&_blockquote]:text-muted",
  "[&_code]:rounded-md [&_code]:bg-soft [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[12.5px] [&_code]:text-ink",
  "[&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-line [&_pre]:bg-soft [&_pre]:p-4 [&_pre_code]:bg-transparent [&_pre_code]:p-0",
  "[&_hr]:my-6 [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-line",
  "[&_img]:my-4 [&_img]:rounded-xl [&_img]:border [&_img]:border-line",
  "[&_table]:my-4 [&_table]:w-full [&_table]:text-[13px] [&_th]:border-b [&_th]:border-line [&_th]:py-2 [&_th]:pr-3 [&_th]:text-left [&_th]:font-medium [&_th]:text-muted [&_td]:border-b [&_td]:border-line [&_td]:py-2 [&_td]:pr-3",
].join(" ");

/**
 * Tipografia de texto longo (equivalente ao Typography do shadcn): títulos,
 * listas, links, citações, código e tabelas já no tema. Use para markdown
 * renderizado, termos, ajuda e respostas de IA. Largura de leitura de 68
 * caracteres; `wide` remove o limite.
 */
export function Prose({ children, wide, className }: { children: ReactNode; wide?: boolean; className?: string }) {
  return <div className={cn(proseClass, wide && "max-w-none", className)}>{children}</div>;
}
