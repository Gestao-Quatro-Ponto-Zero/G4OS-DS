"use client";

import { AlertCircle, Check, CheckCheck, CircleAlert, ExternalLink, Gavel, Info, PackageCheck } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { prefersReducedMotion } from "../lib/motion";
import { AvatarGroup, IconButton } from "./primitives";
import { Skeleton } from "./feedback";
import { Spinner } from "./states";

/*
 * Resumo do que aconteceu enquanto a pessoa esteve fora ("catch up"). A IA lê
 * as fontes de um período e devolve linhas curtas em quatro seções, nesta
 * ordem: Precisa de você, Decisões tomadas, Entregue, Para saber. Uma linha de
 * "Precisa de você" pode trazer uma oferta da IA ("Posso responder à Ana")
 * com a ação no próprio item. Ver docs/padroes/agentes.md › Resumo do período.
 */

export type CatchUpSectionId = "needs-you" | "decisions" | "shipped" | "fyi";

/** As quatro seções, na ordem em que aparecem. Seção vazia não aparece. */
export const catchUpSections: readonly { id: CatchUpSectionId; label: string; icon: ReactNode }[] = [
  { id: "needs-you", label: "Precisa de você", icon: <CircleAlert /> },
  { id: "decisions", label: "Decisões tomadas", icon: <Gavel /> },
  { id: "shipped", label: "Entregue", icon: <PackageCheck /> },
  { id: "fyi", label: "Para saber", icon: <Info /> },
];

export type CatchUpPerson = { name: string; initials?: string; tint?: string; src?: string };

export type CatchUpItem = {
  id: string;
  section: CatchUpSectionId;
  /** Nome da fonte ("Slack"). O leitor de tela ouve a fonte antes da frase. */
  source: string;
  /** Marca da fonte, 16–18 px (`ToolGlyph` ou logo). */
  sourceIcon?: ReactNode;
  /** Uma frase: o que aconteceu ou o que falta. */
  text: ReactNode;
  /** Onde: canal, issue, PR, thread. */
  context?: string;
  /** Quando, já formatado ("dom., 13:10"). */
  when?: string;
  /** Até três pessoas; o resto vira "+N". */
  people?: CatchUpPerson[];
  /** Destino de "Abrir". Sem ele, o botão não aparece. */
  href?: string;
};

export type CatchUpSourceState = "idle" | "reading" | "done" | "error";
export type CatchUpSource = {
  id: string;
  label: string;
  icon?: ReactNode;
  /** Quantas novidades a fonte tem no período. */
  count?: number;
  /** Unidade no plural ("mensagens", "PRs"). */
  unit?: string;
  state?: CatchUpSourceState;
};

/**
 * Fontes lidas para o resumo, com a contagem do período. Durante a leitura,
 * cada fonte mostra um indicador e depois o resultado (lida ou com erro).
 * Status sempre com palavra: o ícone nunca vem sozinho.
 */
export function CatchUpSources({ sources, className }: { sources: CatchUpSource[]; className?: string }) {
  return (
    <ul className={cn("m-0 grid list-none grid-cols-1 gap-x-6 gap-y-1 p-0 min-[440px]:grid-cols-2", className)} aria-label="Fontes">
      {sources.map((s) => (
        <li key={s.id} className="flex min-h-9 min-w-0 items-center gap-2.5 text-[13px]">
          <span className="grid h-[18px] w-[18px] shrink-0 place-items-center [&_svg]:h-4 [&_svg]:w-4" aria-hidden>
            {s.icon}
          </span>
          <span className="min-w-0 flex-1 truncate text-ink">{s.label}</span>
          {s.count !== undefined && (
            <span className="shrink-0 tabular-nums text-muted">
              {s.count}
              {s.unit ? ` ${s.unit}` : ""}
            </span>
          )}
          <SourceState state={s.state ?? "idle"} label={s.label} />
        </li>
      ))}
    </ul>
  );
}

function SourceState({ state, label }: { state: CatchUpSourceState; label: string }) {
  if (state === "reading") return <Spinner size="xs" label={`Lendo ${label}`} />;
  if (state === "done")
    return (
      <span className="inline-flex shrink-0 items-center text-ok" role="img" aria-label={`${label} lido`}>
        <Check className="h-3.5 w-3.5" aria-hidden />
      </span>
    );
  if (state === "error")
    return (
      <span className="inline-flex shrink-0 items-center gap-1 text-[12px] text-rose">
        <AlertCircle className="h-3.5 w-3.5" aria-hidden />
        Falhou
      </span>
    );
  return null;
}

/**
 * Uma seção do resumo: ícone, título e contagem, e as linhas. Região
 * rotulada. Não renderize a seção quando ela não tiver linhas.
 */
export function CatchUpSection({
  section,
  count,
  title,
  children,
  className,
}: {
  section: CatchUpSectionId;
  /** Linhas na seção. Padrão: não mostra contagem. */
  count?: number;
  /** Troca o título padrão da seção. */
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  const id = useId();
  const def = catchUpSections.find((s) => s.id === section)!;
  return (
    <section aria-labelledby={id} className={cn("min-w-0", className)} data-catch-up-section={section}>
      <h3 id={id} className="m-0 flex items-center gap-2 pb-1 text-[12.5px] font-medium text-ink-soft [&_svg]:h-3.5 [&_svg]:w-3.5">
        <span aria-hidden className={cn("inline-flex", section === "needs-you" ? "text-amber" : "text-muted")}>
          {def.icon}
        </span>
        {title ?? def.label}
        {count !== undefined && <span className="font-normal tabular-nums text-muted">{count}</span>}
      </h3>
      <ul className="m-0 list-none divide-y divide-line p-0">{children}</ul>
    </section>
  );
}

/**
 * Uma linha do resumo: marca da fonte, a frase, onde e quando, quem.
 * `action` é a ação da linha (a oferta da IA: "Fazer"). "Abrir" (ícone) aparece
 * com `href` ou `onOpen`; "Marcar como lido" com `onRead`: a linha recolhe (200 ms) e o foco
 * vai para a próxima linha, ou para o elemento com `data-catch-up-fallback`.
 * As ações ficam sempre visíveis, também no celular.
 */
export function CatchUpRow({
  item,
  action,
  onOpen,
  onRead,
  openLabel = "Abrir",
  children,
  className,
}: {
  item: CatchUpItem;
  /** A função preserva o foco e retorna false se a leitura já começou. Execute a ação apenas quando retornar true. */
  action?: ReactNode | ((markAsRead: () => boolean) => ReactNode);
  /** Padrão: abre `href` numa aba nova. */
  onOpen?: (item: CatchUpItem) => void;
  onRead?: (id: string) => void;
  openLabel?: string;
  /** Detalhe abaixo da frase (a oferta da IA, uma citação). */
  children?: ReactNode;
  className?: string;
}) {
  const [leaving, setLeaving] = useState(false);
  const row = useRef<HTMLLIElement>(null);
  const done = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const meta = [item.context, item.when].filter(Boolean).join(" · ");

  useEffect(() => () => {
    if (timer.current !== null) clearTimeout(timer.current);
  }, []);

  function finish() {
    if (done.current) return;
    done.current = true;
    const root = row.current?.closest("[data-catch-up]");
    const buttons = root ? [...root.querySelectorAll<HTMLElement>("[data-catch-up-read]")] : [];
    const own = row.current?.querySelector<HTMLElement>("[data-catch-up-read]");
    const next = buttons[buttons.indexOf(own!) + 1] ?? buttons[buttons.indexOf(own!) - 1];
    onRead?.(item.id);
    requestAnimationFrame(() => {
      if (next?.isConnected) next.focus();
      else root?.querySelector<HTMLElement>("[data-catch-up-fallback]")?.focus();
    });
  }

  function read() {
    if (done.current || timer.current !== null) return false;
    if (prefersReducedMotion()) finish();
    else {
      setLeaving(true);
      timer.current = setTimeout(finish, 220);
    }
    return true;
  }

  return (
    <li
      ref={row}
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none",
        leaving ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100",
        className,
      )}
      aria-hidden={leaving || undefined}
    >
      <div className="min-h-0 overflow-hidden">
        <div className="flex items-start gap-3 py-3">
          <span className="mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center [&_svg]:h-4 [&_svg]:w-4" aria-hidden>
            {item.sourceIcon}
          </span>
          <div className="min-w-0 flex-1">
            <p className="m-0 text-[13.5px] leading-snug text-ink">
              <span className="sr-only">{item.source}: </span>
              {item.text}
            </p>
            {(meta || item.people?.length) && (
              <div className="mt-1 flex min-w-0 items-center gap-2 text-[12px] text-muted">
                {meta && <span className="min-w-0 truncate">{meta}</span>}
                {item.people?.length ? <AvatarGroup people={item.people} max={3} size="xs" stacked /> : null}
              </div>
            )}
            {children && <div className="mt-2">{children}</div>}
            {action && <div className="mt-2 flex flex-wrap items-center gap-1.5">{typeof action === "function" ? action(read) : action}</div>}
          </div>
          <div className="-mr-1 flex shrink-0 items-center">
            {(item.href || onOpen) && (
              <IconButton
                label={`${openLabel}: ${item.context ?? item.source}`}
                size="sm"
                onClick={() => (onOpen ? onOpen(item) : window.open(item.href, "_blank", "noopener,noreferrer"))}
              >
                <ExternalLink />
              </IconButton>
            )}
            {onRead && (
              <IconButton label="Marcar como lido" size="sm" onClick={read} data-catch-up-read="" disabled={leaving}>
                <Check />
              </IconButton>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

/** Reserva a estrutura da linha enquanto o resumo chega, incluindo oferta e ação quando previstas. */
export function CatchUpRowSkeleton({ withAction = false }: { withAction?: boolean }) {
  return (
    <li className="flex items-start gap-3 py-3" aria-hidden>
      <Skeleton className="mt-0.5 h-[18px] w-[18px]" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Skeleton className="h-3.5 w-[85%]" />
        <Skeleton className="h-3 w-[40%]" />
        {withAction && (
          <>
            <Skeleton className="mt-2 h-16 w-full sm:h-10" />
            <Skeleton className="h-8 w-24" />
          </>
        )}
      </div>
    </li>
  );
}

/** "Tudo em dia": o resumo terminou e não sobrou nada para ler. */
export function CatchUpDone({ title = "Tudo em dia", children, action }: { title?: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center" role="status">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-ok-soft text-ok" aria-hidden>
        <CheckCheck className="h-4 w-4" />
      </span>
      <p className="m-0 text-[13.5px] font-medium text-ink">{title}</p>
      {children && <p className="m-0 max-w-[36ch] text-[12.5px] text-muted">{children}</p>}
      {action}
    </div>
  );
}
