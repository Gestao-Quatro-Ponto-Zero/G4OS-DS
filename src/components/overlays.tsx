"use client";

import { AlertDialog } from "@base-ui/react/alert-dialog";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { Popover as BasePopover } from "@base-ui/react/popover";
import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/cn";
import { Button } from "./primitives";

/*
 * Superfícies sobrepostas. Regra de escolha (docs/padroes/superficies.md):
 *   Drawer  → edição contextual ou formulário longo, sem perder a lista de origem
 *   Modal   → decisão curta, poucos campos, prévia
 *   ConfirmDialog → ação destrutiva/irreversível (substitui window.confirm)
 *   Popover → explicação sob demanda (ex.: por que esta cor)
 * Um drawer nunca abre outro drawer. A partir de um drawer, use modal ou navegue.
 */

/** Quando um Drawer (<dialog> nativo) está aberto, portais vão para dentro dele. */
function useTopLayer(open: boolean) {
  if (!open || typeof document === "undefined") return undefined;
  return document.querySelector<HTMLElement>("dialog[open].app-dialog") ?? document.body;
}

const backdropClass =
  "fixed inset-0 z-[90] min-h-dvh bg-black/20 backdrop-blur-[1px] transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0";
const popupBase =
  "fixed left-1/2 top-1/2 z-[95] flex max-h-[calc(100dvh-32px)] w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-line bg-popover text-ink shadow-2xl shadow-black/15 outline-none transition-[opacity,scale] duration-150 data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0";
const sizes = { sm: "max-w-[420px]", md: "max-w-[560px]", lg: "max-w-[760px]" };

/** Classe compartilhada dos popups flutuantes (menu, select, popover). */
export const popupClass =
  "ui-popup origin-[var(--transform-origin)] rounded-xl border border-line bg-popover text-ink shadow-xl shadow-black/10 outline-none transition-[opacity,scale] duration-100 data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0";

export function Modal({
  open,
  onClose,
  title,
  description,
  kicker,
  children,
  footer,
  size = "md",
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  kicker?: string;
  children?: ReactNode;
  /** Botões alinhados à direita: secundário (ghost) antes, primário por último. */
  footer?: ReactNode;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const container = useTopLayer(open);
  return (
    <BaseDialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <BaseDialog.Portal container={container}>
        <BaseDialog.Backdrop className={backdropClass} />
        <BaseDialog.Popup className={cn(popupBase, sizes[size], className)}>
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-6 py-5">
            <div className="min-w-0">
              {kicker && <p className="m-0 text-[12px] text-muted">{kicker}</p>}
              <BaseDialog.Title className="m-0 mt-0.5 text-[18px] font-semibold leading-snug tracking-tight">{title}</BaseDialog.Title>
              {description && (
                <BaseDialog.Description className="m-0 mt-1.5 text-[13px] leading-relaxed text-muted">{description}</BaseDialog.Description>
              )}
            </div>
            <BaseDialog.Close aria-label="Fechar" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-soft hover:text-ink">
              <X className="h-4 w-4" />
            </BaseDialog.Close>
          </header>
          {children && <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>}
          {footer && (
            <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-line bg-soft/35 px-6 py-4">{footer}</footer>
          )}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}

/**
 * Confirmação que exige resposta. Título = pergunta com o objeto
 * ("Excluir o ciclo 02?"), descrição = consequência, botão = verbo
 * ("Excluir ciclo"), nunca "OK"/"Sim".
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "neutral",
  children,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "neutral" | "danger";
  children?: ReactNode;
}) {
  const container = useTopLayer(open);
  return (
    <AlertDialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <AlertDialog.Portal container={container}>
        <AlertDialog.Backdrop className={backdropClass} />
        <AlertDialog.Popup className={cn(popupBase, sizes.sm, "px-6 py-5")}>
          <AlertDialog.Title className="m-0 text-[17px] font-semibold leading-snug tracking-tight">{title}</AlertDialog.Title>
          {description && (
            <AlertDialog.Description className="m-0 mt-2 text-[13.5px] leading-relaxed text-muted">{description}</AlertDialog.Description>
          )}
          {children && <div className="mt-4">{children}</div>}
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              {cancelLabel}
            </Button>
            <Button
              size="sm"
              variant={tone === "danger" ? "danger" : "primary"}
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

/**
 * Painel lateral direito (500px). Usa <dialog> nativo: foco preso, Esc fecha,
 * fundo inerte. Arrastar do conteúdo para o backdrop NÃO fecha (evita perder
 * formulário ao selecionar texto). Clique no backdrop com um popup aberto
 * dentro do drawer também não fecha.
 */
export function Drawer({
  open,
  onClose,
  title,
  kicker,
  children,
  footer,
  width = 500,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  kicker?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const pressedBackdrop = useRef(false);
  useEffect(() => {
    const dialog = ref.current;
    if (open && dialog && !dialog.open) dialog.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, [open]);
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onPointerDown={(event) => {
        pressedBackdrop.current = event.target === event.currentTarget;
      }}
      onClick={(event) => {
        const dialog = event.currentTarget;
        const backdrop = event.target === dialog && pressedBackdrop.current;
        pressedBackdrop.current = false;
        if (!backdrop) return;
        if (dialog.querySelector('[role="listbox"], [role="menu"], [data-open]')) return;
        onClose();
      }}
      className="app-dialog fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 text-ink backdrop:bg-black/15 backdrop:backdrop-blur-[2px]"
    >
      <aside
        className="drawer-surface absolute right-0 top-0 flex h-full w-full flex-col border-l border-line bg-surface shadow-2xl shadow-black/10"
        style={{ maxWidth: width }}
      >
        <header className="shrink-0 border-b border-line px-5 py-6 sm:px-7">
          {kicker && <div className="text-[12.5px] text-muted">{kicker}</div>}
          <div className="mt-2 flex items-start justify-between gap-4">
            <h2 id={titleId} className="m-0 min-w-0 break-words text-[20px] font-semibold leading-snug tracking-tight">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-soft hover:text-ink"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-7 sm:px-7">{children}</div>
        {footer && (
          <footer className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-line bg-soft/35 px-5 py-5 sm:px-7">{footer}</footer>
        )}
      </aside>
    </dialog>,
    document.body,
  );
}

/** Popover genérico: gatilho + painel com título e conteúdo. */
export function Popover({
  trigger,
  triggerLabel,
  triggerClassName,
  title,
  children,
  width = 300,
  align = "center",
  side = "bottom",
}: {
  trigger: ReactNode;
  triggerLabel: string;
  triggerClassName?: string;
  title?: ReactNode;
  children: ReactNode;
  width?: number;
  /** Alinhamento em relação ao gatilho. Use "end" para gatilhos no canto direito. */
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
}) {
  return (
    <BasePopover.Root>
      <BasePopover.Trigger
        aria-label={triggerLabel}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[13px] text-muted outline-none hover:bg-soft focus-visible:ring-2 focus-visible:ring-accent/40 data-popup-open:bg-soft",
          triggerClassName,
        )}
      >
        {trigger}
      </BasePopover.Trigger>
      <BasePopover.Portal>
        <BasePopover.Positioner side={side} align={align} sideOffset={6} collisionPadding={12} className="z-[100]">
          <BasePopover.Popup className={cn(popupClass, "max-w-[calc(100vw-16px)] p-4")} style={{ width }}>
            {title && <BasePopover.Title className="m-0 text-[13px] font-semibold">{title}</BasePopover.Title>}
            <div className={title ? "mt-2" : undefined}>{children}</div>
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </BasePopover.Root>
  );
}
