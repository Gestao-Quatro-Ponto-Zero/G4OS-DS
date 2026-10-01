"use client";

import { GripVertical } from "lucide-react";
import { useId, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { cn } from "../lib/cn";

/*
 * SortableList: reordenar uma lista curta arrastando a alça (mouse/toque) ou
 * por teclado (Espaço pega, ↑/↓ movem, Espaço/Enter soltam, Esc cancela).
 * Sem dependência. Para colunas de quadro use KanbanBoard; para colunas de
 * tabela, DisplayControls.
 */

const move = <T,>(arr: T[], from: number, to: number) => {
  const next = arr.slice();
  const [it] = next.splice(from, 1);
  next.splice(to, 0, it);
  return next;
};

/**
 * Lista reordenável (etapas do pipeline, campos do formulário, prioridade de
 * fila, ordem de colunas). `onReorder` recebe a lista na nova ordem. Anuncia
 * cada movimento para leitores de tela em pt-BR.
 */
export function SortableList<T>({
  items,
  getKey,
  getLabel,
  onReorder,
  renderItem,
  label,
  disabled,
  className,
}: {
  items: T[];
  getKey: (item: T) => string;
  /** Nome do item nos anúncios ("Proposta enviada movida para a posição 2 de 5"). */
  getLabel: (item: T) => string;
  onReorder: (items: T[]) => void;
  /** Conteúdo da linha (a alça já vem à esquerda). */
  renderItem: (item: T, state: { dragging: boolean; index: number }) => ReactNode;
  /** Nome acessível da lista. */
  label: string;
  disabled?: boolean;
  className?: string;
}) {
  const [order, setOrder] = useState<T[] | null>(null); // prévia durante o arraste/teclado
  const [active, setActive] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const listRef = useRef<HTMLUListElement>(null);
  const start = useRef<{ from: number; y: number } | null>(null);
  const helpId = useId();
  const shown = order ?? items;
  const total = items.length;

  const announce = (item: T, index: number) => setMessage(`${getLabel(item)}: posição ${index + 1} de ${total}.`);

  const finish = (commit: boolean) => {
    if (commit && order) {
      const changed = order.some((it, i) => getKey(it) !== getKey(items[i]));
      if (changed) onReorder(order);
    }
    setOrder(null);
    setActive(null);
    start.current = null;
  };

  /* Teclado ------------------------------------------------------------ */
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, item: T) => {
    if (disabled) return;
    const key = getKey(item);
    const grabbed = active === key;
    if (!grabbed && (e.key === " " || e.key === "Enter")) {
      e.preventDefault();
      setActive(key);
      setOrder(items);
      setMessage(`${getLabel(item)} selecionado, posição ${items.indexOf(item) + 1} de ${total}. Use as setas para mover; Espaço para soltar; Esc para cancelar.`);
      return;
    }
    if (!grabbed) return;
    const cur = shown.findIndex((it) => getKey(it) === key);
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const to = Math.min(total - 1, Math.max(0, cur + (e.key === "ArrowUp" ? -1 : 1)));
      if (to !== cur) {
        setOrder(move(shown, cur, to));
        announce(item, to);
      }
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      setMessage(`${getLabel(item)} solto na posição ${cur + 1} de ${total}.`);
      finish(true);
    } else if (e.key === "Escape" || e.key === "Tab") {
      if (e.key === "Escape") e.preventDefault();
      setMessage(`Movimento cancelado. ${getLabel(item)} voltou à posição ${items.indexOf(item) + 1}.`);
      finish(false);
    }
  };

  /* Ponteiro ----------------------------------------------------------- */
  const onPointerDown = (e: PointerEvent<HTMLButtonElement>, item: T, index: number) => {
    if (disabled || e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    start.current = { from: index, y: e.clientY };
    setActive(getKey(item));
    setOrder(items);
  };
  const onPointerMove = (e: PointerEvent<HTMLButtonElement>, item: T) => {
    if (!start.current || !listRef.current || active !== getKey(item)) return;
    const rows = Array.from(listRef.current.children) as HTMLElement[];
    const cur = shown.findIndex((it) => getKey(it) === active);
    // Índice alvo: a linha cujo centro o ponteiro passou.
    let to = cur;
    rows.forEach((row, i) => {
      const r = row.getBoundingClientRect();
      const mid = r.top + r.height / 2;
      if (i < cur && e.clientY < mid) to = Math.min(to, i);
      if (i > cur && e.clientY > mid) to = Math.max(to, i);
    });
    if (to !== cur) setOrder(move(shown, cur, to));
  };
  const onPointerUp = (item: T) => {
    if (!start.current) return;
    const idx = shown.findIndex((it) => getKey(it) === getKey(item));
    announce(item, idx);
    finish(true);
  };

  return (
    <>
      <ul ref={listRef} aria-label={label} className={cn("m-0 flex list-none flex-col gap-1.5 p-0", className)}>
        {shown.map((item, index) => {
          const key = getKey(item);
          const dragging = active === key;
          return (
            <li
              key={key}
              className={cn(
                "flex min-w-0 items-center gap-2 rounded-xl border bg-surface py-2 pl-1.5 pr-3 transition-shadow motion-reduce:transition-none",
                dragging ? "relative z-[1] border-line-strong shadow-lg shadow-black/10" : "border-line",
              )}
            >
              <button
                type="button"
                disabled={disabled}
                aria-label={`Reordenar ${getLabel(item)}`}
                aria-pressed={dragging}
                aria-describedby={helpId}
                onKeyDown={(e) => onKey(e, item)}
                onPointerDown={(e) => onPointerDown(e, item, index)}
                onPointerMove={(e) => onPointerMove(e, item)}
                onPointerUp={() => onPointerUp(item)}
                onPointerCancel={() => finish(false)}
                className={cn(
                  "flex h-8 w-7 shrink-0 touch-none items-center justify-center rounded-md text-muted hover:bg-soft hover:text-ink disabled:cursor-not-allowed disabled:opacity-40",
                  dragging ? "cursor-grabbing bg-soft text-ink" : "cursor-grab",
                )}
              >
                <GripVertical aria-hidden className="h-4 w-4" />
              </button>
              <div className="min-w-0 flex-1">{renderItem(item, { dragging, index })}</div>
            </li>
          );
        })}
      </ul>
      <span id={helpId} className="sr-only">
        Espaço pega o item; setas movem; Espaço solta; Esc cancela.
      </span>
      <span role="status" aria-live="assertive" className="sr-only">
        {message}
      </span>
    </>
  );
}
