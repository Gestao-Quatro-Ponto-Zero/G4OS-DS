"use client";

import { ChevronUp, MapPin, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { describeTimeZone } from "../lib/dates";
import { inertProps } from "../lib/inert";
import { normalize } from "../lib/text";
import { SearchInput } from "./forms";
import { Tooltip } from "./overlays-extra";
import { Avatar, AvatarGroup, DsLink, toneDot, type AvatarStatus, type Tone } from "./primitives";

/*
 * Presença: quem está por aqui e onde.
 *   StackedList  · destaque (ex.: quem está online) + diretório completo que abre por cima, no mesmo cartão
 *   LocationTag  · lugar + hora local (fuso), para pessoas, filiais, armazéns e regiões de execução
 */

/* ------------------------------------------------------------------ */
/* StackedList                                                         */
/* ------------------------------------------------------------------ */

export type StackedListItem = {
  id: string;
  name: string;
  initials?: string;
  tint?: string;
  src?: string;
  /** Presença no avatar. "online" entra no destaque por padrão. */
  status?: AvatarStatus;
  /** Linha de apoio: "Online", "há 17 min", cargo. */
  description?: ReactNode;
  /** Lado direito: papel (Badge neutro), contador, ação. */
  meta?: ReactNode;
  href?: string;
  onClick?: () => void;
  /** Texto extra para a busca (e-mail, cargo). */
  keywords?: string;
};

function StackedRow({ item }: { item: StackedListItem }) {
  const body = (
    <>
      <Avatar name={item.name} initials={item.initials} tint={item.tint} src={item.src} status={item.status} size="md" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-medium text-ink">{item.name}</span>
        {item.description && <span className="block truncate text-[12px] text-muted">{item.description}</span>}
      </span>
      {item.meta && <span className="flex shrink-0 items-center gap-1.5">{item.meta}</span>}
    </>
  );
  const cls = "flex w-full min-w-0 items-center gap-3 rounded-lg px-2 py-2 text-left";
  if (item.href)
    return (
      <DsLink href={item.href} className={cn(cls, "hover:bg-soft")}>
        {body}
      </DsLink>
    );
  if (item.onClick)
    return (
      <button type="button" onClick={item.onClick} className={cn(cls, "hover:bg-soft")}>
        {body}
      </button>
    );
  return <div className={cls}>{body}</div>;
}

/**
 * Lista em destaque com o diretório completo empilhado embaixo. O cartão mostra
 * o recorte que importa agora (quem está online, quem está de plantão); a barra
 * no rodapé resume o total e abre a lista inteira, com busca, por cima do
 * próprio cartão — sem sair da tela. Esc fecha.
 * Use em painéis laterais e dashboards. Para gerenciar pessoas, use uma tabela.
 */
export function StackedList({
  title,
  items,
  featured,
  directoryLabel = "Todas as pessoas",
  directoryHint,
  action,
  searchPlaceholder = "Buscar pessoas…",
  emptyFeatured = "Ninguém online agora.",
  height = 420,
  className,
}: {
  title: ReactNode;
  /** Todos os itens (vão para o diretório). */
  items: StackedListItem[];
  /** Quem aparece em destaque. Padrão: `status === "online"`. */
  featured?: (item: StackedListItem) => boolean;
  /** Título da barra/diretório. */
  directoryLabel?: string;
  /** Linha abaixo do título da barra. Padrão: "N no total". */
  directoryHint?: ReactNode;
  /** Ação no cabeçalho (ex.: IconButton "Convidar"). */
  action?: ReactNode;
  searchPlaceholder?: string;
  emptyFeatured?: ReactNode;
  /** Altura do cartão em px (o diretório abre dentro dela). */
  height?: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const panelId = useId();
  const barRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const highlighted = useMemo(() => items.filter(featured ?? ((i) => i.status === "online")), [items, featured]);
  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return items;
    return items.filter((i) => normalize(`${i.name} ${i.keywords ?? ""} ${typeof i.description === "string" ? i.description : ""}`).includes(q));
  }, [items, query]);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLInputElement>("input")?.focus();
  }, [open]);

  const close = () => {
    setOpen(false);
    setQuery("");
    requestAnimationFrame(() => barRef.current?.focus());
  };

  return (
    <section className={cn("surface-card relative flex min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-surface", className)} style={{ height }}>
      <div {...inertProps(open)} className="flex min-h-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-2 px-4 pb-2 pt-3.5">
          <h3 className="m-0 flex items-center gap-2 text-[14px] font-semibold">
            {title}
            <span className="rounded-md bg-soft px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted">{highlighted.length}</span>
          </h3>
          {action}
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-20">
          {highlighted.length ? (
            <ul className="m-0 list-none p-0">
              {highlighted.map((i) => (
                <li key={i.id}>
                  <StackedRow item={i} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 px-2 py-6 text-center text-[13px] text-muted">{emptyFeatured}</p>
          )}
        </div>
      </div>

      {/* Barra/diretório: mesmo elemento, cresce por cima do cartão. */}
      <div
        className={cn(
          "absolute z-10 flex flex-col overflow-hidden border border-line bg-popover transition-[inset,border-radius,box-shadow] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none",
          open ? "inset-2 rounded-xl shadow-raised" : "inset-x-3 bottom-3 top-[calc(100%-68px)] rounded-xl",
        )}
      >
        {open ? (
          <div ref={panelRef} id={panelId} role="dialog" aria-label={directoryLabel} className="flex min-h-0 flex-1 flex-col" onKeyDown={(e) => e.key === "Escape" && (e.stopPropagation(), close())}>
            <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2.5">
              <div className="min-w-0">
                <div className="truncate text-[13.5px] font-medium">{directoryLabel}</div>
                <div className="text-[12px] tabular-nums text-muted">{directoryHint ?? `${items.length} no total`}</div>
              </div>
              <button type="button" onClick={close} aria-label="Fechar" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-soft hover:text-ink [&_svg]:h-4 [&_svg]:w-4">
                <X />
              </button>
            </div>
            <div className="px-3 pt-3">
              <SearchInput value={query} onChange={setQuery} placeholder={searchPlaceholder} />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-1.5 py-2">
              {filtered.length ? (
                <ul className="m-0 list-none p-0">
                  {filtered.map((i) => (
                    <li key={i.id}>
                      <StackedRow item={i} />
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-2 py-6 text-center text-[13px] text-muted">
                  Nada encontrado para “{query}”.{" "}
                  <button type="button" onClick={() => setQuery("")} className="font-medium text-ink underline underline-offset-2">
                    Limpar busca
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <button
            ref={barRef}
            type="button"
            aria-expanded={false}
            onClick={() => setOpen(true)}
            className="flex h-full w-full items-center gap-3 px-3 text-left outline-none hover:bg-soft focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/40"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13.5px] font-medium">{directoryLabel}</span>
              <span className="block text-[12px] tabular-nums text-muted">{directoryHint ?? `${items.length} no total`}</span>
            </span>
            <AvatarGroup stacked max={3} total={items.length} people={items.map((i) => ({ name: i.name, initials: i.initials, tint: i.tint, src: i.src }))} />
            <ChevronUp className="h-4 w-4 shrink-0 text-muted" aria-hidden />
          </button>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* LocationTag                                                         */
/* ------------------------------------------------------------------ */

function useClock(timeZone: string | undefined, enabled: boolean) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    if (!enabled) return;
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, [enabled, timeZone]);
  return now;
}

/**
 * Lugar + hora local. Pílula com o nome do lugar e, ao lado, a hora no fuso
 * dele (atualiza sozinha); o fuso completo aparece no tooltip. `status`
 * acrescenta ponto + palavra ("Operando", "Fechado"): cor nunca sozinha.
 * Para time distribuído, filiais e armazéns, região onde um agente roda.
 */
export function LocationTag({
  place,
  timeZone,
  showTime = true,
  status,
  href,
  className,
}: {
  /** "São Paulo, SP", "Lisboa, Portugal". */
  place: string;
  /** Fuso IANA ("America/Sao_Paulo"). Sem ele, o do navegador. */
  timeZone?: string;
  showTime?: boolean;
  /** Estado do lugar com palavra: `{ label: "Operando", tone: "ok" }`. */
  status?: { label: string; tone?: Tone };
  href?: string;
  className?: string;
}) {
  const now = useClock(timeZone, showTime);
  let time = "--:--";
  if (now) {
    try {
      time = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone });
    } catch {
      time = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    }
  }
  const tz = describeTimeZone(timeZone);
  const body = (
    <>
      {status ? <span aria-hidden className={cn("h-1.5 w-1.5 shrink-0 rounded-full", toneDot[status.tone ?? "neutral"])} /> : <MapPin className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />}
      <span className="truncate font-medium text-ink">{place}</span>
      {status && <span className="whitespace-nowrap text-muted">{status.label}</span>}
      {showTime && (
        <>
          <span aria-hidden className="h-3 w-px shrink-0 bg-line" />
          <span className="whitespace-nowrap tabular-nums text-ink-soft">
            <span className="sr-only">Hora local: </span>
            {time}
          </span>
        </>
      )}
    </>
  );
  const cls = cn("inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[12.5px] leading-5", href && "hover:border-line-strong hover:bg-soft", className);
  const el = href ? (
    <DsLink href={href} className={cls}>
      {body}
    </DsLink>
  ) : (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- foco só para mostrar o fuso no tooltip pelo teclado
    <span tabIndex={showTime ? 0 : undefined} className={cn(cls, "outline-none focus-visible:ring-2 focus-visible:ring-accent/40")}>
      {body}
    </span>
  );
  return showTime ? <Tooltip content={tz}>{el}</Tooltip> : el;
}
