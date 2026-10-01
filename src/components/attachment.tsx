"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { cloneElement, createContext, useContext, type ButtonHTMLAttributes, type ReactElement, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { FileIcon } from "./media";

/*
 * Attachment (equivalente ao Attachment do shadcn/ui): anexo componível para
 * composer de IA, mensagens, formulários e listas de documentos.
 *   <Attachment state="uploading" progress={42}>
 *     <AttachmentMedia name="proposta.pdf" />
 *     <AttachmentContent>
 *       <AttachmentTitle>proposta.pdf</AttachmentTitle>
 *       <AttachmentDescription>PDF · 2,4 MB</AttachmentDescription>
 *     </AttachmentContent>
 *     <AttachmentActions><AttachmentAction label="Remover" onClick={…}><X /></AttachmentAction></AttachmentActions>
 *   </Attachment>
 * Estados: idle (escolhido, ainda não enviado), uploading (com `progress`),
 * processing (lendo/indexando), error (borda e texto rose), done.
 * Para o cartão de arquivo pronto (tipo, tamanho, quem enviou), FileCard basta.
 */

export type AttachmentState = "idle" | "uploading" | "processing" | "error" | "done";
type AttachmentSize = "default" | "sm" | "xs";

const AttachmentCtx = createContext<{ state: AttachmentState; size: AttachmentSize; orientation: "horizontal" | "vertical"; progress?: number }>({
  state: "done",
  size: "default",
  orientation: "horizontal",
});

const sizeCls: Record<AttachmentSize, string> = {
  default: "gap-3 p-2.5",
  sm: "gap-2.5 p-2",
  xs: "gap-2 py-1 pl-1 pr-1.5",
};

/** Raiz do anexo. `orientation="vertical"` para miniatura em cima (grade de imagens). */
export function Attachment({
  children,
  state = "done",
  size = "default",
  orientation = "horizontal",
  progress,
  className,
}: {
  children: ReactNode;
  state?: AttachmentState;
  size?: AttachmentSize;
  orientation?: "horizontal" | "vertical";
  /** 0–100 durante `uploading`. */
  progress?: number;
  className?: string;
}) {
  return (
    <AttachmentCtx.Provider value={{ state, size, orientation, progress }}>
      <div
        data-attachment=""
        data-state={state}
        data-orientation={orientation}
        aria-busy={state === "uploading" || state === "processing" ? true : undefined}
        className={cn(
          "linked-card group/attachment relative flex min-w-0 overflow-hidden rounded-xl border bg-surface text-ink",
          orientation === "vertical" ? "w-40 flex-col" : "items-center",
          orientation === "horizontal" && sizeCls[size],
          size === "xs" && "rounded-lg",
          state === "error" ? "border-rose/35" : "border-line",
          state === "idle" && "border-dashed",
          className,
        )}
      >
        {children}
        {state === "uploading" && progress != null && (
          <div
            role="progressbar"
            aria-label="Enviando"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
            className="absolute inset-x-0 bottom-0 h-0.5 bg-line"
          >
            <div className="h-full bg-primary transition-[width] duration-300" style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
          </div>
        )}
      </div>
    </AttachmentCtx.Provider>
  );
}

/**
 * Mídia do anexo: ícone do tipo (pela extensão em `name`), miniatura
 * (`variant="image"` com `src`) ou um ícone próprio em `children` (link, pasta).
 * Durante upload/processamento mostra o indicador; em erro, o alerta.
 */
export function AttachmentMedia({
  variant = "icon",
  name,
  src,
  alt = "",
  children,
  className,
}: {
  variant?: "icon" | "image";
  /** Nome do arquivo para escolher o ícone do tipo. */
  name?: string;
  src?: string;
  alt?: string;
  children?: ReactNode;
  className?: string;
}) {
  const { state, size, orientation } = useContext(AttachmentCtx);
  const dim = orientation === "vertical" ? "aspect-[4/3] w-full rounded-none border-b border-line" : size === "xs" ? "h-6 w-6 rounded-md" : size === "sm" ? "h-8 w-8 rounded-lg" : "h-10 w-10 rounded-lg";
  const busy = state === "uploading" || state === "processing";
  const inner =
    variant === "image" && src ? (
      <img src={src} alt={alt} className={cn("h-full w-full object-cover", busy && "opacity-60")} />
    ) : children ? (
      <span className="flex h-full w-full items-center justify-center bg-soft text-ink-soft [&_svg]:h-4 [&_svg]:w-4">{children}</span>
    ) : (
      <FileIcon name={name ?? ""} size={size === "default" && orientation === "horizontal" ? "md" : orientation === "vertical" ? "lg" : "sm"} />
    );
  return (
    <div className={cn("relative flex shrink-0 items-center justify-center overflow-hidden bg-soft/60 [&>span]:h-full [&>span]:w-full [&>span]:rounded-none", dim, className)}>
      {inner}
      {busy && (
        <span className="absolute inset-0 flex items-center justify-center bg-surface/40">
          <Loader2 className="h-4 w-4 text-ink motion-safe:animate-spin" aria-hidden />
        </span>
      )}
      {state === "error" && (
        <span className="absolute inset-0 flex items-center justify-center bg-rose-soft/80 text-rose">
          <AlertCircle className="h-4 w-4" aria-hidden />
        </span>
      )}
    </div>
  );
}

/** Texto do anexo (título + descrição). */
export function AttachmentContent({ children, className }: { children: ReactNode; className?: string }) {
  const { orientation } = useContext(AttachmentCtx);
  return <div className={cn("min-w-0 flex-1", orientation === "vertical" && "px-2.5 py-2", className)}>{children}</div>;
}

/** Nome do arquivo (truncado). */
export function AttachmentTitle({ children, className }: { children: ReactNode; className?: string }) {
  const { size } = useContext(AttachmentCtx);
  return <div className={cn("truncate font-medium leading-snug", size === "default" ? "text-[13.5px]" : "text-[12.5px]", className)}>{children}</div>;
}

/**
 * Linha de apoio: tipo e tamanho. Durante o envio vira "Enviando… 42%",
 * em processamento "Processando…", em erro fica rose (passe a mensagem).
 */
export function AttachmentDescription({ children, className }: { children?: ReactNode; className?: string }) {
  const { state, size, progress } = useContext(AttachmentCtx);
  if (size === "xs") return null;
  const text =
    state === "uploading" && !children ? (
      <span className="tabular-nums">Enviando…{progress != null ? ` ${Math.round(progress)}%` : ""}</span>
    ) : state === "processing" && !children ? (
      <span className="ds-shimmer">Processando…</span>
    ) : (
      children
    );
  return <div className={cn("mt-0.5 truncate text-[12px] text-muted", state === "error" && "text-rose", className)}>{text}</div>;
}

/** Grupo de ações à direita (ou embaixo, na vertical). */
export function AttachmentActions({ children, className }: { children: ReactNode; className?: string }) {
  const { orientation } = useContext(AttachmentCtx);
  return (
    <div className={cn("z-[1] flex shrink-0 items-center gap-0.5", orientation === "vertical" ? "absolute right-1.5 top-1.5 rounded-lg bg-popover/90 p-0.5 shadow-surface backdrop-blur" : "relative", className)}>
      {children}
    </div>
  );
}

/** Ação de ícone do anexo (remover, baixar, tentar de novo). `label` é obrigatório. */
export function AttachmentAction({ label, children, className, ...rest }: { label: string; children: ReactNode; className?: string } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className">) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...rest}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-md text-muted outline-none hover:bg-soft hover:text-ink focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:text-muted/60 [&_svg]:h-3.5 [&_svg]:w-3.5",
        className,
      )}
    >
      {children}
    </button>
  );
}

/**
 * Torna o anexo inteiro clicável (abrir prévia, baixar) sem aninhar botões:
 * cobre o card e deixa as ações por cima. `render` troca o elemento (um link).
 */
export function AttachmentTrigger({
  label,
  render,
  className,
  ...rest
}: { label: string; render?: ReactElement<{ className?: string; "aria-label"?: string }>; className?: string } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">) {
  const cls = cn("absolute inset-0 z-0 rounded-[inherit] outline-none hover:bg-ink/[0.02] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/40", className);
  if (render) return cloneElement(render, { className: cn(cls, render.props.className), "aria-label": label });
  return <button type="button" aria-label={label} {...rest} className={cls} />;
}

/**
 * Conjunto de anexos. `layout="row"` rola na horizontal (composer),
 * `grid` em grade (galeria, mensagens), `list` empilhado (formulário).
 */
export function AttachmentGroup({ children, layout = "row", label = "Anexos", className }: { children: ReactNode; layout?: "row" | "grid" | "list"; label?: string; className?: string }) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        layout === "row" && "flex w-full min-w-0 gap-2 overflow-x-auto pb-1 [scrollbar-width:thin] [&>[data-attachment]]:w-64 [&>[data-attachment]]:shrink-0 [&>[data-attachment][data-orientation=vertical]]:w-40",
        layout === "grid" && "grid w-full min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 [&>[data-attachment]]:w-auto",
        layout === "list" && "flex w-full min-w-0 flex-col gap-2",
        className,
      )}
    >
      {children}
    </div>
  );
}
