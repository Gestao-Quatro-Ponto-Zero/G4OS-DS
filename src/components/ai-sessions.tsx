"use client";

import {
  Archive,
  AudioLines,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  CircleAlert,
  Clock,
  Copy,
  Ellipsis,
  FileText,
  Folder,
  FolderOpen,
  List as ListIcon,
  GitBranch,
  Globe,
  Info,
  ListFilter,
  Loader2,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Eye,
  Zap,
  Mic,
  MicOff,
  Minus,
  PanelRight,
  Paperclip,
  Plus,
  RefreshCw,
  RotateCw,
  Search,
  Settings2,
  Share,
  SquarePen,
  Star,
  Tag,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { cn } from "../lib/cn";
import { tintFill } from "../lib/color";
import { AgentComposer, Waveform, type SlashCommand } from "./ai-workspace";
import { notify } from "./feedback";
import { FileCard } from "./media";
import { Menu as BaseMenu } from "@base-ui/react/menu";
import { ConfirmDialog, Popover, popupClass } from "./overlays";
import { Menu, Tooltip, type MenuEntry } from "./overlays-extra";

/*
 * Interface agêntica de sessões (app de trabalho com agente: G4 OS desktop,
 * Codex, T3). Lista de sessões com status ao vivo, conversa com grupos de
 * passos recolhíveis, respostas copiáveis e ramificáveis, campo com
 * ferramentas conectadas, painel de informações e modo voz.
 * Regras (docs: IA e interação › Sessões):
 *   · status sempre visível na lista (Trabalhando / Resposta pronta / Falhou)
 *   · passos recolhidos, nunca escondidos: o resumo diz o que o agente fez
 *   · toda resposta pode ser copiada, copiada em Markdown e ramificada
 *   · o campo mostra quais ferramentas e qual agente vão agir
 *   · aviso de que IA erra, sempre abaixo do campo
 */

/* ================================================================== */
/* Status e item de sessão                                             */
/* ================================================================== */

export type SessionStatus = "idle" | "working" | "ready" | "error";

export type SessionSummary = {
  id: string;
  title: string;
  /** Tempo relativo curto: "2m", "1h", "ontem". */
  time: string;
  status?: SessionStatus;
  tags?: string[];
  starred?: boolean;
  archived?: boolean;
  /** Sessão ramificada de outra (mostra ícone de ramo). */
  parentId?: string;
  /** Rótulo do grupo de data ("Hoje", "Ontem", "Esta semana"). */
  day?: string;
  /** Rotina agendada (Morning Brief): ícone de relógio. */
  scheduled?: boolean;
  /** Projeto (pasta) da sessão: usado no modo de lista "projects". */
  projectId?: string;
};

/** Projeto que agrupa sessões (repositório, cliente, iniciativa). */
export type SessionProject = { id: string; name: string; /** Ícone próprio (padrão: pasta). */ icon?: ReactNode };
export type SessionListMode = "recent" | "projects";

/** Chip de status de uma sessão. "Trabalhando" tem reticências animadas. */
export function SessionStatusChip({ status, className }: { status: SessionStatus; className?: string }) {
  if (status === "idle") return null;
  const map = {
    working: { label: "Trabalhando", cls: "bg-ink/[0.06] text-ink-soft" },
    ready: { label: "Resposta pronta", cls: "bg-ok-soft text-ok" },
    error: { label: "Falhou", cls: "bg-rose-soft text-rose" },
  }[status];
  return (
    <span className={cn("inline-flex h-5 shrink-0 items-center gap-1 rounded-md px-1.5 text-[11px] font-medium leading-none", map.cls, className)} role="status">
      {status === "working" && (
        <span aria-hidden className="inline-flex items-center gap-[2px]">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-[3px] w-[3px] rounded-full bg-accent motion-safe:animate-pulse" style={{ animationDelay: `${i * 160}ms` }} />
          ))}
        </span>
      )}
      {status === "error" && <CircleAlert className="h-3 w-3" aria-hidden />}
      {map.label}
    </span>
  );
}

/**
 * Status de sessão em versão mínima (lista "clean"): ponto pulsante dourado
 * = trabalhando, ponto verde = resposta pronta, alerta rose = falhou,
 * relógio = rotina agendada. Sempre com rótulo para leitor de tela.
 */
export function SessionStatusGlyph({ status = "idle", scheduled, className }: { status?: SessionStatus; scheduled?: boolean; className?: string }) {
  const label = status === "working" ? "Trabalhando" : status === "ready" ? "Resposta pronta" : status === "error" ? "Falhou" : scheduled ? "Rotina agendada" : "";
  if (!label) return null;
  return (
    <span className={cn("inline-grid h-3.5 w-3.5 shrink-0 place-items-center", className)} role="img" aria-label={label} title={label}>
      {status === "working" ? (
        <span className="relative grid h-2 w-2 place-items-center">
          <span aria-hidden className="absolute inset-0 rounded-full bg-accent/40 motion-safe:animate-ping" />
          <span aria-hidden className="h-2 w-2 rounded-full bg-accent" />
        </span>
      ) : status === "ready" ? (
        <span aria-hidden className="h-2 w-2 rounded-full bg-ok" />
      ) : status === "error" ? (
        <CircleAlert aria-hidden className="h-3.5 w-3.5 text-rose" />
      ) : (
        <Clock aria-hidden className="h-3 w-3 text-muted" />
      )}
    </span>
  );
}

/**
 * Linha da lista de sessões: título, tempo, status e etiquetas. Ativa = fundo tingido + marcador.
 * `density="clean"`: uma linha (título · glifo de status · tempo) e etiquetas como texto discreto.
 */
export function SessionItem({
  session,
  active,
  onSelect,
  actions,
  density = "rich",
}: {
  session: SessionSummary;
  active?: boolean;
  onSelect: (id: string) => void;
  /** Itens do menu ⋯ (favoritar, renomear, arquivar). */
  actions?: MenuEntry[];
  /** "rich" (padrão): chips de status e etiquetas. "clean": uma linha com glifo de status. */
  density?: "rich" | "clean";
}) {
  if (density === "clean") {
    const unread = session.status === "ready";
    return (
      <li className="group relative">
        {active && <span aria-hidden className="absolute -left-2 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-nav-marker" />}
        <button
          type="button"
          onClick={() => onSelect(session.id)}
          aria-current={active ? "true" : undefined}
          title={session.tags?.length ? `${session.title} · ${session.tags.join(" · ")}` : undefined}
          className={cn("flex h-8 w-full items-center rounded-lg px-2.5 text-left transition-colors", active ? "bg-ink/[0.07]" : "hover:bg-ink/[0.04]")}
        >
          <span className="flex w-full min-w-0 items-center gap-1.5">
            {session.parentId && <GitBranch className="h-3.5 w-3.5 shrink-0 text-muted" aria-label="Ramificação" />}
            <span className={cn("min-w-0 flex-1 truncate text-[13.5px]", active || unread ? "font-medium text-ink" : "text-ink-soft")}>{session.title}</span>
            {session.starred && <Star className="h-3 w-3 shrink-0 fill-accent text-accent" aria-label="Favorita" />}
            <span className={cn("flex shrink-0 items-center gap-1.5", actions && "group-focus-within:opacity-0 group-hover:opacity-0")}>
              <SessionStatusGlyph status={session.status} scheduled={session.scheduled} />
              <span className="text-[11.5px] tabular-nums text-muted">{session.time}</span>
            </span>
          </span>
        </button>
        {actions && (
          <span className="absolute right-1.5 top-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
            <Menu
              label={`Ações de ${session.title}`}
              align="end"
              triggerClassName="!h-6 !w-6 justify-center !gap-0 !rounded-md !bg-transparent !px-0 !text-muted !ring-0 hover:!bg-ink/[0.06] hover:!text-ink"
              trigger={<Ellipsis className="h-3.5 w-3.5" />}
              items={actions}
            />
          </span>
        )}
      </li>
    );
  }
  const hasChips = (session.status && session.status !== "idle") || !!session.tags?.length;
  return (
    <li className="group relative">
      {active && <span aria-hidden className="absolute -left-2 top-2.5 bottom-2.5 w-[3px] rounded-r-full bg-nav-marker" />}
      <button
        type="button"
        onClick={() => onSelect(session.id)}
        aria-current={active ? "true" : undefined}
        className={cn(
          "flex w-full flex-col gap-1.5 rounded-xl px-2.5 py-2 text-left transition-colors",
          active ? "bg-ink/[0.07]" : "hover:bg-ink/[0.04]",
        )}
      >
        <span className="flex w-full items-center gap-1.5">
          {session.parentId && <GitBranch className="h-3.5 w-3.5 shrink-0 text-muted" aria-label="Ramificação" />}
          {session.scheduled && <Clock className="h-3.5 w-3.5 shrink-0 text-muted" aria-label="Rotina agendada" />}
          <span className={cn("min-w-0 flex-1 truncate text-[13.5px]", active ? "font-medium text-ink" : "text-ink")}>{session.title}</span>
          {session.starred && <Star className="h-3 w-3 shrink-0 fill-accent text-accent" aria-label="Favorita" />}
          <span className={cn("shrink-0 text-[11.5px] tabular-nums text-muted", actions && "group-focus-within:opacity-0 group-hover:opacity-0")}>{session.time}</span>
        </span>
        {hasChips && (
          <span className="flex min-w-0 items-center gap-1 overflow-hidden">
            {session.status && <SessionStatusChip status={session.status} />}
            {session.tags?.map((t) => (
              <span key={t} className="inline-flex h-5 min-w-0 max-w-[150px] items-center rounded-md bg-accent-soft px-1.5 text-[11px] font-medium text-accent-deep">
                <span className="truncate">{t}</span>
              </span>
            ))}
          </span>
        )}
      </button>
      {actions && (
        <span className="absolute right-1.5 top-1.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
          <Menu
            label={`Ações de ${session.title}`}
            align="end"
            triggerClassName="!h-6 !w-6 justify-center !gap-0 !rounded-md !bg-transparent !px-0 !text-muted !ring-0 hover:!bg-ink/[0.06] hover:!text-ink"
            trigger={<Ellipsis className="h-3.5 w-3.5" />}
            items={actions}
          />
        </span>
      )}
    </li>
  );
}

/** Grupo de sessões por data ("HOJE", "ONTEM"). */
export function SessionGroup({ label, children, density = "rich" }: { label: string; children: ReactNode; density?: "rich" | "clean" }) {
  return (
    <section aria-label={label} className={density === "clean" ? "pb-2 pt-3 first:pt-0" : "pb-3"}>
      <h3 className={cn("m-0 px-2.5 text-[10.5px] font-medium uppercase text-muted", density === "clean" ? "pb-1.5 tracking-[0.08em]" : "pb-1 pt-1 tracking-[0.1em]")}>{label}</h3>
      <ul className={cn("m-0 flex list-none flex-col p-0", density === "clean" ? "gap-px" : "gap-0.5")}>{children}</ul>
    </section>
  );
}

/* ================================================================== */
/* Coluna de sessões                                                   */
/* ================================================================== */

export type SessionTab = "recentes" | "favoritas" | "pastas" | "arquivadas";

/**
 * Coluna de sessões completa: título com filtro e busca, "Nova sessão",
 * abas (recentes, favoritas, pastas, arquivadas), filtro por etiqueta,
 * grupos por data e seletor de workspace no rodapé. Controle de dados fica
 * no app; a coluna cuida de aba, busca e etiqueta.
 */
export function SessionSidebar<T extends SessionSummary = SessionSummary>({
  sessions,
  activeId,
  onSelect,
  onNew,
  itemActions,
  footer,
  title = "Sessões",
  density = "rich",
  projects,
  listMode: listModeProp,
  defaultListMode = "recent",
  onListModeChange,
  projectActions,
  projectLimit = 5,
  headerExtra,
  className,
}: {
  sessions: T[];
  activeId?: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  itemActions?: (s: T) => MenuEntry[];
  /** Rodapé (seletor de workspace). */
  footer?: ReactNode;
  title?: string;
  /**
   * "rich" (padrão): botão "Nova sessão", abas com ícone, etiquetas e chips.
   * "clean": cabeçalho com ícones (nova, buscar, filtrar), abas em texto
   * discreto, itens de uma linha com glifo de status.
   */
  density?: "rich" | "clean";
  /** Com projetos, um ícone no cabeçalho (e o menu de filtro) alterna o agrupamento por data ou por projeto. */
  projects?: SessionProject[];
  listMode?: SessionListMode;
  defaultListMode?: SessionListMode;
  onListModeChange?: (mode: SessionListMode) => void;
  /** Menu ⋯ de cada projeto (nova sessão no projeto, renomear, arquivar). */
  projectActions?: (p: SessionProject) => MenuEntry[];
  /** Sessões por projeto antes de "Mostrar mais". */
  projectLimit?: number;
  /** Controle extra no cabeçalho, antes do filtro (ex.: ListToggle). */
  headerExtra?: ReactNode;
  className?: string;
}) {
  const clean = density === "clean";
  const [ownMode, setOwnMode] = useState<SessionListMode>(defaultListMode);
  const listMode: SessionListMode = projects?.length ? listModeProp ?? ownMode : "recent";
  const setListMode = (m: SessionListMode) => {
    if (listModeProp === undefined) setOwnMode(m);
    onListModeChange?.(m);
  };
  const [tab, setTab] = useState<SessionTab>("recentes");
  const [searching, setSearching] = useState(false);
  const [q, setQ] = useState("");
  const [tagsOpen, setTagsOpen] = useState(false);
  const [tag, setTag] = useState<string | null>(null);
  const [onlyWorking, setOnlyWorking] = useState(false);
  const allTags = Array.from(new Set(sessions.flatMap((s) => s.tags ?? [])));
  const norm = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const visible = sessions.filter((s) => {
    if (tab === "arquivadas" ? !s.archived : s.archived) return false;
    if (tab === "favoritas" && !s.starred) return false;
    if (tag && !s.tags?.includes(tag)) return false;
    if (onlyWorking && s.status !== "working" && s.status !== "ready") return false;
    if (q && !norm(s.title).includes(norm(q))) return false;
    return true;
  });
  const groups: [string, T[]][] = [];
  if (listMode === "projects" && projects?.length) {
    // Agrupado por projeto na ordem de `projects`; sessões sem projeto por último.
  } else if (tab === "pastas") {
    const byTag = new Map<string, T[]>();
    visible.forEach((s) => (s.tags?.length ? s.tags : ["Sem pasta"]).forEach((t) => byTag.set(t, [...(byTag.get(t) ?? []), s])));
    byTag.forEach((v, k) => groups.push([k, v]));
  } else {
    visible.forEach((s) => {
      const label = s.day ?? "Hoje";
      const g = groups.find(([l]) => l === label);
      if (g) g[1].push(s);
      else groups.push([label, [s]]);
    });
  }
  const tabBtn = (id: SessionTab, label: string, icon: ReactNode, text?: boolean) => (
    <Tooltip content={label} side="bottom" disabled={text}>
      <button
        type="button"
        role="tab"
        aria-selected={tab === id}
        aria-label={label}
        onClick={() => setTab(id)}
        className={cn(
          "-mb-px inline-flex h-9 items-center gap-1.5 border-b-2 px-2 text-[12.5px] transition-colors [&_svg]:h-4 [&_svg]:w-4",
          tab === id ? "border-ink font-medium text-ink" : "border-transparent text-muted hover:text-ink",
          text && "pr-3",
        )}
      >
        {icon}
        {text && label}
      </button>
    </Tooltip>
  );
  return (
    <aside aria-label={title} className={cn("flex h-full min-h-0 w-full flex-col bg-rail", className)}>
      <div className={cn("flex items-center gap-1 px-4 pt-4", clean ? "pb-2" : "pb-3")}>
        <h2 className="m-0 min-w-0 flex-1 truncate text-[15px] font-semibold tracking-tight">{title}</h2>
        {headerExtra}
        {!!projects?.length && (
          <Tooltip content={listMode === "projects" ? "Agrupar por data" : "Agrupar por projeto"} side="bottom">
            <button
              type="button"
              aria-label="Agrupar por projeto"
              aria-pressed={listMode === "projects"}
              onClick={() => setListMode(listMode === "projects" ? "recent" : "projects")}
              className={cn("grid h-8 w-8 place-items-center rounded-lg transition-colors hover:bg-ink/[0.06] hover:text-ink", listMode === "projects" ? "bg-ink/[0.06] text-ink" : "text-muted")}
            >
              {listMode === "projects" ? <Folder className="h-4 w-4" /> : <ListIcon className="h-4 w-4" />}
            </button>
          </Tooltip>
        )}
        <Menu
          label="Filtrar sessões"
          align="end"
          triggerClassName={cn("!h-8 !w-8 justify-center !gap-0 !rounded-lg !bg-transparent !px-0 !ring-0 hover:!bg-ink/[0.06]", onlyWorking || tag ? "!text-ink" : "!text-muted")}
          trigger={<ListFilter className="h-4 w-4" />}
          items={[
            { type: "checkbox", label: "Só com atividade (trabalhando ou pronta)", checked: onlyWorking, onCheckedChange: setOnlyWorking },
            { type: "separator" },
            { type: "label", label: "Etiqueta" },
            { type: "radio", value: tag ?? "", onValueChange: (v) => setTag(v || null), options: [{ value: "", label: "Todas" }, ...allTags.map((t) => ({ value: t, label: t }))] },
            ...(projects?.length
              ? ([
                  { type: "separator" },
                  { type: "label", label: "Agrupar" },
                  { type: "radio", value: listMode, onValueChange: (v: string) => setListMode(v as SessionListMode), options: [{ value: "recent", label: "Por data" }, { value: "projects", label: "Por projeto" }] },
                ] satisfies MenuEntry[])
              : []),
          ]}
        />
        <Tooltip content="Buscar sessões" side="bottom">
          <button
            type="button"
            aria-label="Buscar sessões"
            aria-pressed={searching}
            onClick={() => {
              setSearching((v) => !v);
              setQ("");
            }}
            className={cn("grid h-8 w-8 place-items-center rounded-lg hover:bg-ink/[0.06]", searching ? "bg-ink/[0.06] text-ink" : "text-muted")}
          >
            <Search className="h-4 w-4" />
          </button>
        </Tooltip>
        {clean && (
          <Tooltip content="Nova sessão" side="bottom">
            <button type="button" aria-label="Nova sessão" onClick={onNew} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-ink/[0.06] hover:text-ink">
              <SquarePen className="h-4 w-4" />
            </button>
          </Tooltip>
        )}
      </div>
      <div className={cn("px-3", clean && !searching && "hidden")}>
        {searching ? (
          <label className={cn("focus-field flex items-center gap-2 border border-line bg-surface px-3", clean ? "h-9 rounded-lg" : "h-10 rounded-xl")}>
            <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && (setSearching(false), setQ(""))}
              placeholder="Buscar por título…"
              aria-label="Buscar por título"
              autoComplete="off"
              className="ds-bare h-full min-w-0 flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-muted"
            />
            {q && (
              <button type="button" aria-label="Limpar" onClick={() => setQ("")} className="text-muted hover:text-ink">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </label>
        ) : (
          <button
            type="button"
            onClick={onNew}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-line bg-surface text-[13.5px] font-medium text-ink shadow-surface transition-colors hover:border-line-strong hover:bg-soft"
          >
            <Plus className="h-4 w-4" /> Nova sessão
          </button>
        )}
      </div>
      {clean ? (
        <div role="tablist" aria-label="Visões" className={cn("mx-3 flex min-w-0 items-center gap-0.5 overflow-x-auto [scrollbar-width:none]", searching ? "mt-2" : "mt-0")}>
          {(
            [
              ["recentes", "Recentes"],
              ["favoritas", "Favoritas"],
              ["pastas", "Pastas"],
              ["arquivadas", "Arquivadas"],
            ] as const
          )
            // Com projetos, "Pastas" (por etiqueta) duplicaria o agrupamento por projeto.
            .filter(([id]) => !(id === "pastas" && projects?.length))
            .map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={cn("h-7 shrink-0 rounded-md px-2 text-[12px] transition-colors", tab === id ? "bg-ink/[0.07] font-medium text-ink" : "text-muted hover:bg-ink/[0.04] hover:text-ink")}
            >
              {label}
            </button>
          ))}
        </div>
      ) : (
        <div role="tablist" aria-label="Visões" className="mx-3 mt-3 flex items-center gap-1 border-b border-line">
          {tabBtn("recentes", "Recentes", <Clock />, true)}
          {tabBtn("favoritas", "Favoritas", <Star />)}
          {!projects?.length && tabBtn("pastas", "Pastas", <Folder />)}
          {tabBtn("arquivadas", "Arquivadas", <Archive />)}
        </div>
      )}
      {clean && tag && (
        <div className="mx-3 mt-2 flex items-center gap-1.5 text-[12px] text-muted">
          <Tag className="h-3.5 w-3.5" aria-hidden /> {tag}
          <button type="button" onClick={() => setTag(null)} aria-label="Limpar etiqueta" className="grid h-5 w-5 place-items-center rounded hover:bg-ink/[0.06] hover:text-ink">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
      {!clean && allTags.length > 0 && (
        <div className="px-3 pt-2">
          <button
            type="button"
            onClick={() => setTagsOpen((v) => !v)}
            aria-expanded={tagsOpen}
            className="flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-[11px] font-medium uppercase tracking-[0.1em] text-muted hover:bg-ink/[0.04] hover:text-ink"
          >
            <Tag className="h-3.5 w-3.5" aria-hidden />
            <span className="flex-1 text-left">Etiquetas{tag ? ` · ${tag}` : ""}</span>
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", tagsOpen && "rotate-180")} aria-hidden />
          </button>
          {tagsOpen && (
            <div className="flex flex-wrap gap-1 px-2 pb-1 pt-1.5">
              {allTags.map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={tag === t}
                  onClick={() => setTag((v) => (v === t ? null : t))}
                  className={cn("h-6 rounded-md px-2 text-[11.5px] transition-colors", tag === t ? "bg-primary text-on-primary" : "bg-ink/[0.05] text-ink-soft hover:bg-ink/[0.08]")}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <div className={cn("docs-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-3", clean ? "pt-2" : "pt-3")}>
        {listMode === "projects" && projects?.length ? (
          visible.length ? (
            <>
              {[...projects, { id: "__none", name: "Sem projeto" }].map((p) => {
                const items = visible.filter((s) => (p.id === "__none" ? !s.projectId || !projects.some((x) => x.id === s.projectId) : s.projectId === p.id));
                if (!items.length && p.id === "__none") return null;
                return (
                  <ProjectGroup
                    key={p.id}
                    project={p}
                    count={items.length}
                    active={items.some((s) => s.id === activeId)}
                    actions={p.id !== "__none" ? projectActions?.(p) : undefined}
                    limit={projectLimit}
                    density={density}
                  >
                    {items.map((s) => (
                      <SessionItem key={`p-${s.id}`} session={s} active={s.id === activeId} onSelect={onSelect} actions={itemActions?.(s)} density="clean" />
                    ))}
                  </ProjectGroup>
                );
              })}
            </>
          ) : (
            <div className="px-3 py-10 text-center">
              <p className="m-0 text-[13px] font-medium">Nenhuma sessão</p>
              <p className="m-0 mt-1 text-[12px] text-muted">Tente outro termo ou limpe o filtro.</p>
            </div>
          )
        ) : groups.length ? (
          groups.map(([label, items]) => (
            <SessionGroup key={label} label={label} density={density}>
              {items.map((s) => (
                <SessionItem key={`${label}-${s.id}`} session={s} active={s.id === activeId} onSelect={onSelect} actions={itemActions?.(s)} density={density} />
              ))}
            </SessionGroup>
          ))
        ) : (
          <div className="px-3 py-10 text-center">
            <p className="m-0 text-[13px] font-medium">{tab === "arquivadas" ? "Nada arquivado" : tab === "favoritas" ? "Nenhuma favorita" : "Nenhuma sessão"}</p>
            <p className="m-0 mt-1 text-[12px] text-muted">{q || tag ? "Tente outro termo ou limpe o filtro." : tab === "favoritas" ? "Use ⋯ › Favoritar numa sessão." : "Comece uma nova sessão."}</p>
          </div>
        )}
      </div>
      {footer && <div className="border-t border-line px-3 py-2.5">{footer}</div>}
    </aside>
  );
}

/**
 * Pasta de projeto na lista de sessões: ícone + nome + contagem, recolhível,
 * sessões aninhadas, "Mostrar mais" depois de `limit` e menu ⋯ do projeto.
 * Projeto que contém a sessão ativa abre sozinho.
 */
export function ProjectGroup({
  project,
  count,
  active,
  actions,
  limit = 5,
  density = "rich",
  defaultOpen = true,
  children,
}: {
  project: SessionProject;
  count: number;
  active?: boolean;
  actions?: MenuEntry[];
  limit?: number;
  density?: "rich" | "clean";
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen || !!active);
  const [all, setAll] = useState(false);
  useEffect(() => {
    if (active) setOpen(true);
  }, [active]);
  const items = Array.isArray(children) ? children : [children];
  const shown = all ? items : items.slice(0, limit);
  return (
    <section aria-label={project.name} className={density === "clean" ? "pb-1.5" : "pb-2"}>
      <div className="group/project relative flex items-center">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-lg px-2.5 text-left text-[13px] text-ink-soft transition-colors hover:bg-ink/[0.04] hover:text-ink"
        >
          <span className="shrink-0 text-muted [&_svg]:h-4 [&_svg]:w-4" aria-hidden>
            {project.icon ?? (open ? <FolderOpen /> : <Folder />)}
          </span>
          <span className={cn("min-w-0 flex-1 truncate", active && "font-medium text-ink")}>{project.name}</span>
          <span className={cn("shrink-0 text-[11.5px] tabular-nums text-muted", actions && "group-focus-within/project:opacity-0 group-hover/project:opacity-0")}>{count}</span>
        </button>
        {actions && (
          <span className="absolute right-1.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover/project:opacity-100">
            <Menu
              label={`Ações do projeto ${project.name}`}
              align="end"
              triggerClassName="!h-6 !w-6 justify-center !gap-0 !rounded-md !bg-transparent !px-0 !text-muted !ring-0 hover:!bg-ink/[0.06] hover:!text-ink"
              trigger={<Ellipsis className="h-3.5 w-3.5" />}
              items={actions}
            />
          </span>
        )}
      </div>
      {open && count > 0 && (
        <ul className="m-0 ml-[18px] flex list-none flex-col gap-px border-l border-line p-0 pl-1.5">
          {shown}
          {items.length > limit && (
            <li>
              <button type="button" onClick={() => setAll((v) => !v)} className="h-7 w-full rounded-lg px-2.5 text-left text-[12px] text-muted hover:bg-ink/[0.04] hover:text-ink">
                {all ? "Mostrar menos" : `Mostrar mais ${items.length - limit}`}
              </button>
            </li>
          )}
        </ul>
      )}
      {open && count === 0 && <p className="m-0 ml-[26px] py-1 text-[12px] text-muted">Sem sessões</p>}
    </section>
  );
}

/* ================================================================== */
/* Conversa: grupos de passos, cartão de resposta, ações               */
/* ================================================================== */

export type StepItem = { id: string; label: string; detail?: ReactNode; durationMs?: number; status?: "running" | "done" | "error"; icon?: ReactNode };

/**
 * Grupo de atividade recolhível ("Reunindo contexto"). Recolhido mostra só o
 * resumo; aberto lista os passos (ferramentas, buscas) com duração. Enquanto
 * roda, o título brilha. Nunca esconda os passos: recolha.
 */
export function StepGroup({
  title,
  steps = [],
  running = false,
  defaultOpen = false,
  variant = "group",
  children,
  className,
}: {
  title: string;
  steps?: StepItem[];
  running?: boolean;
  defaultOpen?: boolean;
  /** "group" (padrão): botão com ícone ⇕. "line": linha discreta com chevron, para conversas em fluxo. */
  variant?: "group" | "line";
  /** Conteúdo extra quando aberto (ToolCallsSection, AgentTrace). */
  children?: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const done = steps.filter((s) => s.status !== "running").length;
  const line = variant === "line";
  return (
    <div className={cn("min-w-0", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "inline-flex max-w-full items-center text-left text-muted transition-colors hover:text-ink",
          line ? "gap-1.5 py-0.5 text-[12.5px]" : "-ml-2 gap-2 rounded-lg px-2 py-1 text-[13px] hover:bg-ink/[0.04]",
        )}
      >
        {running ? (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin motion-reduce:animate-none" aria-hidden />
        ) : line ? (
          <ChevronRight className={cn("h-3.5 w-3.5 shrink-0 transition-transform", open && "rotate-90")} aria-hidden />
        ) : (
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
        )}
        <span className={cn("truncate", running && "ds-shimmer")}>{title}</span>
        {steps.length > 0 && (
          <span className="shrink-0 text-[11.5px] tabular-nums text-muted">
            {running ? `${done}/${steps.length}` : `${steps.length} passo${steps.length === 1 ? "" : "s"}`}
          </span>
        )}
      </button>
      {open && (
        <div className={cn("enter mb-1 mt-1 border-l border-line", line ? "ml-[6px] pl-3.5" : "ml-[7px] pl-4")}>
          {steps.length > 0 && (
            <ol className="m-0 flex list-none flex-col gap-1.5 p-0 py-1">
              {steps.map((s) => (
                <li key={s.id} className="flex items-start gap-2 text-[12.5px]">
                  <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center text-muted [&_svg]:h-3.5 [&_svg]:w-3.5">
                    {s.status === "running" ? <Loader2 className="animate-spin motion-reduce:animate-none" /> : s.status === "error" ? <CircleAlert className="text-rose" /> : s.icon ?? <Check className="text-ok" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="text-ink-soft">{s.label}</span>
                    {s.detail && <span className="mt-0.5 block text-[12px] text-muted">{s.detail}</span>}
                  </span>
                  {s.durationMs != null && <span className="shrink-0 tabular-nums text-muted">{s.durationMs < 1000 ? `${s.durationMs} ms` : `${(s.durationMs / 1000).toFixed(1).replace(".", ",")} s`}</span>}
                </li>
              ))}
            </ol>
          )}
          {children}
        </div>
      )}
    </div>
  );
}

const copyText = async (text: string, label: string) => {
  try {
    await navigator.clipboard?.writeText(text);
  } catch {
    /* sem permissão: segue com o aviso */
  }
  notify(label, undefined, "info");
};

/**
 * Ações de uma resposta: Copiar, Markdown, (refazer, avaliar) e ramificar.
 * `text` = versão sem formatação; `markdown` = fonte com formatação.
 */
export function MessageActions({
  text,
  markdown,
  onBranch,
  onRetry,
  onFeedback,
  onShare,
  compact = false,
  size = "md",
  className,
}: {
  text: string;
  markdown?: string;
  onBranch?: () => void;
  onRetry?: () => void;
  onFeedback?: (value: "up" | "down") => void;
  /** Compartilhar a resposta (link ou exportar). */
  onShare?: () => void;
  /** Só ícones, alinhados à esquerda (respostas em fluxo). */
  compact?: boolean;
  /** "xs": ícones mínimos (estilo Codex), implica `compact`. */
  size?: "md" | "xs";
  className?: string;
}) {
  const [fb, setFb] = useState<"up" | "down" | null>(null);
  if (compact || size === "xs") {
    const ic = cn(
      "grid place-items-center rounded-md text-muted transition-colors hover:bg-ink/[0.05] hover:text-ink",
      size === "xs" ? "h-6 w-6 [&_svg]:h-[13px] [&_svg]:w-[13px]" : "h-7 w-7 [&_svg]:h-3.5 [&_svg]:w-3.5",
    );
    return (
      <div className={cn("flex items-center gap-0.5", className)}>
        <Tooltip content="Copiar">
          <button type="button" className={ic} aria-label="Copiar resposta" onClick={() => copyText(text, "Resposta copiada")}>
            <Copy />
          </button>
        </Tooltip>
        {markdown != null && (
          <Tooltip content="Copiar em Markdown">
            <button type="button" className={ic} aria-label="Copiar em Markdown" onClick={() => copyText(markdown, "Markdown copiado")}>
              <FileText />
            </button>
          </Tooltip>
        )}
        {onRetry && (
          <Tooltip content="Refazer">
            <button type="button" className={ic} aria-label="Refazer resposta" onClick={onRetry}>
              <RotateCw />
            </button>
          </Tooltip>
        )}
        {onFeedback &&
          (["up", "down"] as const).map((v) => (
            <Tooltip key={v} content={v === "up" ? "Boa resposta" : "Resposta ruim"}>
              <button
                type="button"
                aria-pressed={fb === v}
                aria-label={v === "up" ? "Boa resposta" : "Resposta ruim"}
                className={cn(ic, fb === v && "bg-ink/[0.06] text-ink")}
                onClick={() => {
                  setFb(v);
                  onFeedback(v);
                }}
              >
                {v === "up" ? <ThumbsUp /> : <ThumbsDown />}
              </button>
            </Tooltip>
          ))}
        {onBranch && (
          <Tooltip content="Ramificar daqui">
            <button type="button" className={ic} aria-label="Ramificar conversa" onClick={onBranch}>
              <GitBranch />
            </button>
          </Tooltip>
        )}
        {onShare && (
          <Tooltip content="Compartilhar">
            <button type="button" className={ic} aria-label="Compartilhar resposta" onClick={onShare}>
              <Share />
            </button>
          </Tooltip>
        )}
      </div>
    );
  }
  const btn = "inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[12.5px] text-muted transition-colors hover:bg-ink/[0.05] hover:text-ink [&_svg]:h-3.5 [&_svg]:w-3.5";
  const icon = "grid h-7 w-7 place-items-center rounded-md text-muted transition-colors hover:bg-ink/[0.05] hover:text-ink [&_svg]:h-3.5 [&_svg]:w-3.5";
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      <button type="button" className={btn} onClick={() => copyText(text, "Resposta copiada")}>
        <Copy /> Copiar
      </button>
      {markdown != null && (
        <button type="button" className={btn} onClick={() => copyText(markdown, "Markdown copiado")}>
          <FileText /> Markdown
        </button>
      )}
      <span className="flex-1" />
      {onRetry && (
        <Tooltip content="Refazer resposta">
          <button type="button" className={icon} onClick={onRetry} aria-label="Refazer resposta">
            <RotateCw />
          </button>
        </Tooltip>
      )}
      {onFeedback &&
        (["up", "down"] as const).map((v) => (
          <Tooltip key={v} content={v === "up" ? "Boa resposta" : "Resposta ruim"}>
            <button
              type="button"
              aria-pressed={fb === v}
              aria-label={v === "up" ? "Boa resposta" : "Resposta ruim"}
              className={cn(icon, fb === v && "bg-ink/[0.06] text-ink")}
              onClick={() => {
                setFb(v);
                onFeedback(v);
              }}
            >
              {v === "up" ? <ThumbsUp /> : <ThumbsDown />}
            </button>
          </Tooltip>
        ))}
      {onBranch && (
        <Tooltip content="Ramificar daqui (nova sessão com este contexto)">
          <button type="button" className={icon} onClick={onBranch} aria-label="Ramificar conversa">
            <GitBranch />
          </button>
        </Tooltip>
      )}
    </div>
  );
}

const richText =
  "[&_a]:font-medium [&_a]:text-ink [&_a]:underline [&_a]:decoration-line-strong [&_a]:underline-offset-[3px] hover:[&_a]:decoration-ink [&_code]:rounded-md [&_code]:border [&_code]:border-line [&_code]:bg-soft [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[12.5px] [&_p]:m-0 [&_strong]:font-semibold";

/**
 * Resposta do agente. Conteúdo rico (negrito, código, links).
 *   variant="card" (padrão): cartão com borda e rodapé de ações — conversa densa, várias respostas curtas.
 *   variant="flow": sem moldura, coluna de leitura (~68ch); status da execução no topo (`run`),
 *   artefatos e continuações embaixo, ações aparecem no hover/foco (sempre visíveis no toque).
 */
export function AnswerCard({
  children,
  actions,
  streaming = false,
  className,
  id,
  variant = "card",
  run,
  artifacts,
  suggestions,
  actionsVisible,
}: {
  children: ReactNode;
  actions?: ReactNode;
  streaming?: boolean;
  className?: string;
  id?: string;
  variant?: "card" | "flow";
  /** (flow) Linha de status da execução: RunSummary. */
  run?: ReactNode;
  /** (flow) Cartões de artefato produzidos nesta resposta. */
  artifacts?: ReactNode;
  /** (flow) Continuações sugeridas (chips). */
  suggestions?: ReactNode;
  /** (flow) "hover" (padrão): ações só no hover/foco. "always": sempre visíveis (ex.: última resposta). */
  actionsVisible?: "hover" | "always";
}) {
  if (variant === "flow") {
    return (
      <article id={id} className={cn("group/answer min-w-0", className)} aria-busy={streaming || undefined}>
        {run && <div className="mb-2.5">{run}</div>}
        <div className={cn("flex max-w-[68ch] flex-col gap-3 text-[15px] leading-[1.7] text-ink", richText)}>
          {children}
          {streaming && <span aria-hidden className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-ink motion-safe:animate-pulse" />}
        </div>
        {artifacts && !streaming && <div className="mt-4 grid max-w-[68ch] grid-cols-[repeat(auto-fill,minmax(min(100%,240px),1fr))] gap-2">{artifacts}</div>}
        {actions && !streaming && (
          <div
            className={cn(
              "-ml-2 mt-2 max-w-[68ch] transition-opacity",
              actionsVisible === "always" ? "opacity-100" : "opacity-0 focus-within:opacity-100 group-hover/answer:opacity-100 [@media(hover:none)]:opacity-100",
            )}
          >
            {actions}
          </div>
        )}
        {suggestions && !streaming && <div className="mt-2 flex max-w-[68ch] flex-wrap gap-1.5">{suggestions}</div>}
      </article>
    );
  }
  return (
    <article id={id} className={cn("overflow-hidden rounded-2xl border border-line bg-surface shadow-surface", className)} aria-busy={streaming || undefined}>
      <div className={cn("flex flex-col gap-3 px-5 py-4 text-[15px] leading-[1.65] text-ink", richText)}>
        {children}
        {streaming && <span aria-hidden className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-ink motion-safe:animate-pulse" />}
      </div>
      {actions && !streaming && <div className="border-t border-line bg-soft/40 px-2.5 py-1.5">{actions}</div>}
    </article>
  );
}

/** Mensagem da pessoa: balão suave alinhado à direita. */
export function UserBubble({ children, id, className }: { children: ReactNode; id?: string; className?: string }) {
  return (
    <div id={id} className={cn("flex justify-end", className)}>
      <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl bg-ink/[0.05] px-4 py-2.5 text-[15px] leading-relaxed text-ink">{children}</div>
    </div>
  );
}

/* ================================================================== */
/* Minimapa da conversa                                                */
/* ================================================================== */

export type MinimapItem = { id: string; role: "user" | "assistant"; preview: string };

/**
 * Trilho de marcas à esquerda da conversa: um traço por mensagem (curto =
 * pessoa, longo = agente). As marcas perto do ponteiro crescem; a atual fica
 * em destaque; hover mostra a prévia; clique rola até a mensagem.
 * `scrollRef` = contêiner que rola; cada mensagem precisa de `id`.
 */
export function ThreadMinimap({ items, scrollRef, className }: { items: MinimapItem[]; scrollRef: RefObject<HTMLElement | null>; className?: string }) {
  const [active, setActive] = useState<string | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  useEffect(() => {
    const box = scrollRef.current;
    if (!box || !items.length) return;
    const on = () => {
      const top = box.getBoundingClientRect().top + box.clientHeight * 0.35;
      let cur = items[0].id;
      for (const it of items) {
        const el = document.getElementById(it.id);
        if (el && el.getBoundingClientRect().top <= top) cur = it.id;
      }
      if (box.scrollTop + box.clientHeight >= box.scrollHeight - 4) cur = items[items.length - 1].id;
      setActive(cur);
    };
    on();
    box.addEventListener("scroll", on, { passive: true });
    return () => box.removeEventListener("scroll", on);
  }, [items, scrollRef]);
  if (items.length < 2) return null;
  // Fica centralizado na calha esquerda da conversa (o pai é o contêiner que NÃO rola),
  // então permanece no meio da tela enquanto o histórico rola. Some abaixo de 1024px.
  return (
    <nav
      aria-label="Mapa da conversa"
      className={cn("absolute left-3 top-1/2 z-[1] hidden max-h-[70%] -translate-y-1/2 flex-col items-start gap-0 overflow-hidden py-1 lg:flex", className)}
      onPointerLeave={() => setHover(null)}
    >
      {items.map((it, i) => {
        const near = hover == null ? 0 : Math.max(0, 1 - Math.abs(hover - i) / 3);
        const on = it.id === active;
        const base = 10;
        return (
          <Tooltip key={it.id} content={<span className="line-clamp-2">{it.preview}</span>} side="right" delay={80}>
            <button
              type="button"
              aria-label={`${it.role === "user" ? "Você" : "Agente"}: ${it.preview}`}
              aria-current={on ? "location" : undefined}
              onPointerEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onClick={() => document.getElementById(it.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="group flex h-[8px] items-center pr-2 outline-none"
            >
              <span
                className={cn("block h-[1.5px] rounded-full transition-[width,background-color] duration-150", on ? "bg-ink" : "bg-line-strong group-hover:bg-ink-soft group-focus-visible:bg-ink")}
                style={{ width: on ? 18 : base + near * 8 }}
              />
            </button>
          </Tooltip>
        );
      })}
    </nav>
  );
}

/* ================================================================== */
/* Ferramentas conectadas, agentes e campo                             */
/* ================================================================== */

export type ConnectedTool = { id: string; name: string; /** Glifo (ícone/logo). Sem ele, inicial sobre `tint`. */ glyph?: ReactNode; tint?: string; status?: "ok" | "error" };

/** "6 ferramentas conectadas" + logos sobrepostos + "+N" + gerenciar. */
export function ToolsBar({ tools, max = 5, onManage, className }: { tools: ConnectedTool[]; max?: number; onManage?: () => void; className?: string }) {
  const shown = tools.slice(0, max);
  const errors = tools.filter((t) => t.status === "error").length;
  return (
    <div className={cn("flex items-center gap-2 text-[12.5px] text-muted", className)}>
      <Settings2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="truncate">
        {tools.length} ferramenta{tools.length === 1 ? "" : "s"} conectada{tools.length === 1 ? "" : "s"}
        {errors > 0 && <span className="ml-1.5 font-medium text-rose">· {errors} com erro</span>}
      </span>
      <span className="flex-1" />
      <span className="flex items-center gap-1.5" role="group" aria-label={tools.map((t) => t.name).join(", ")}>
        {shown.map((t) => (
          <Tooltip key={t.id} content={`${t.name}${t.status === "error" ? " · reconectar" : ""}`}>
            <span className="relative grid h-5 w-5 place-items-center rounded-[5px] text-[10px] font-semibold text-on-ink [&_svg]:h-3 [&_svg]:w-3" style={{ background: t.tint ?? "var(--ds-ink-soft)" }}>
              {t.glyph ?? t.name[0]}
              {t.status === "error" && <span aria-hidden className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-rose ring-2 ring-surface" />}
            </span>
          </Tooltip>
        ))}
        {tools.length > max && <span className="text-[11.5px] tabular-nums">+{tools.length - max}</span>}
      </span>
      {onManage && (
        <Tooltip content="Gerenciar ferramentas">
          <button type="button" onClick={onManage} aria-label="Gerenciar ferramentas" className="ds-hit grid h-6 w-6 shrink-0 place-items-center rounded-md hover:bg-ink/[0.06] hover:text-ink">
            <Settings2 className="h-3.5 w-3.5" />
          </button>
        </Tooltip>
      )}
    </div>
  );
}

/**
 * Versão compacta do ToolsBar para o rodapé de um campo limpo: botão
 * "6 ferramentas" (ponto rose se alguma falhou) que abre a lista com status
 * e "Gerenciar". Use quando a linha de ferramentas pesaria demais.
 */
export function ToolsButton({ tools, onManage, onReconnect, className }: { tools: ConnectedTool[]; onManage?: () => void; onReconnect?: (tool: ConnectedTool) => void; className?: string }) {
  const errors = tools.filter((t) => t.status === "error").length;
  return (
    <Popover
      triggerLabel={`${tools.length} ferramentas conectadas${errors ? `, ${errors} com erro` : ""}`}
      triggerClassName={cn("!h-8 !gap-1.5 !rounded-full !px-2.5 !text-[12px] !text-ink-soft hover:!text-ink", className)}
      align="start"
      side="top"
      width={280}
      title="Ferramentas conectadas"
      trigger={
        <>
          <span className="relative inline-grid">
            <Settings2 className="h-3.5 w-3.5" aria-hidden />
            {errors > 0 && <span aria-hidden className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-rose ring-2 ring-surface" />}
          </span>
          <span className="tabular-nums">{tools.length}</span>
          <span className="hidden sm:inline @max-[600px]:hidden">ferramentas</span>
        </>
      }
    >
      <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
        {tools.map((t) => (
          <li key={t.id} className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-[10.5px] font-semibold text-on-ink [&_svg]:h-3.5 [&_svg]:w-3.5" style={{ background: t.tint ?? "var(--ds-ink-soft)" }}>
              {t.glyph ?? t.name[0]}
            </span>
            <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{t.name}</span>
            {t.status === "error" ? (
              onReconnect ? (
                <button type="button" onClick={() => onReconnect(t)} className="h-6 rounded-md px-2 text-[11.5px] font-medium text-rose hover:bg-rose-soft">
                  Reconectar
                </button>
              ) : (
                <span className="text-[11.5px] font-medium text-rose">Com erro</span>
              )
            ) : (
              <span className="inline-flex items-center gap-1 text-[11.5px] text-muted">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-ok" /> Ativa
              </span>
            )}
          </li>
        ))}
      </ul>
      {onManage && (
        <button type="button" onClick={onManage} className="mt-2 flex h-8 w-full items-center justify-center gap-1.5 rounded-lg text-[12.5px] font-medium text-ink-soft ring-1 ring-line hover:bg-soft hover:text-ink">
          <Settings2 className="h-3.5 w-3.5" /> Gerenciar ferramentas
        </button>
      )}
    </Popover>
  );
}

export type AgentOption = { id: string; name: string; initials: string; tint?: string; description?: string };

/** Avatares dos agentes que vão agir; clique escolhe o principal. */
export function AgentPicker({ agents, value, onChange }: { agents: AgentOption[]; value: string; onChange: (id: string) => void }) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Agente">
      {agents.map((a) => {
        const on = a.id === value;
        return (
          <Tooltip key={a.id} content={a.description ? `${a.name} · ${a.description}` : a.name}>
            <button
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={a.name}
              onClick={() => onChange(a.id)}
              // ds-audit-ignore white-black: iniciais brancas sobre o tint do agente (identidade), escurecido até AA por tintFill
              className={cn("grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold text-white transition-[box-shadow,filter]", on ? "ring-2 ring-ink ring-offset-2 ring-offset-surface" : "saturate-50 hover:saturate-100")}
              style={{ background: tintFill(a.tint, "var(--ds-ink-soft)") }}
            >
              {a.initials}
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
}

/**
 * Campo de sessão no formato do app: anexo (clipe), pasta de contexto,
 * agentes, microfone, enviar, e a linha de ferramentas conectadas.
 * É o AgentComposer com os slots preenchidos.
 */
export function SessionComposer({
  value,
  onChange,
  onSubmit,
  onStop,
  busy,
  tools,
  agents,
  agent,
  onAgentChange,
  onManageTools,
  onContext,
  onAttachFiles,
  commands,
  placeholder = "Peça ou pergunte qualquer coisa para o G4 OS",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (v: string) => void;
  onStop?: () => void;
  busy?: boolean;
  tools: ConnectedTool[];
  agents?: AgentOption[];
  agent?: string;
  onAgentChange?: (id: string) => void;
  onManageTools?: () => void;
  onContext?: () => void;
  /** Arquivos escolhidos no clipe (seletor do sistema). Sem ele, o clipe não aparece. */
  onAttachFiles?: (files: File[]) => void;
  commands?: SlashCommand[];
  placeholder?: string;
  className?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const pick = (accept: string) => {
    const input = fileRef.current;
    if (!input) return;
    input.accept = accept;
    input.click();
  };
  return (
    <>
    <input
      ref={fileRef}
      type="file"
      multiple
      hidden
      aria-hidden
      tabIndex={-1}
      onChange={(e) => {
        const files = [...(e.target.files ?? [])];
        e.target.value = "";
        if (files.length) onAttachFiles?.(files);
      }}
    />
    <AgentComposer
      className={className}
      value={value}
      onChange={onChange}
      onSubmit={onSubmit}
      onStop={onStop}
      busy={busy}
      placeholder={placeholder}
      commands={commands}
      onTranscribe={(ms) => (ms > 600 ? "Resume as pendências da reunião de hoje e manda no canal do time" : "")}
      attachIcon={onAttachFiles ? <Paperclip className="h-4 w-4" /> : undefined}
      attachOptions={
        onAttachFiles
          ? [
              { label: "Arquivo do computador", icon: <Paperclip className="h-4 w-4" />, onSelect: () => pick("") },
              { label: "Imagem ou captura", icon: <FileText className="h-4 w-4" />, onSelect: () => pick("image/*") },
            ]
          : undefined
      }
      leading={
        <Tooltip content="Pasta de contexto">
          <button type="button" onClick={onContext} aria-label="Escolher pasta de contexto" className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-soft hover:text-ink">
            <FolderOpen className="h-4 w-4" />
          </button>
        </Tooltip>
      }
      trailing={agents && agent && onAgentChange ? <AgentPicker agents={agents} value={agent} onChange={onAgentChange} /> : undefined}
      footer={<ToolsBar tools={tools} onManage={onManageTools} />}
    />
    </>
  );
}

/** "G4 OS usa IA e pode cometer erros." Sempre abaixo do campo. */
export function Disclaimer({ children, className }: { children?: ReactNode; className?: string }) {
  return <p className={cn("m-0 text-center text-[11.5px] text-muted", className)}>{children ?? "G4 OS usa IA e pode cometer erros. Por favor, verifique as respostas."}</p>;
}

/* ================================================================== */
/* Cabeçalho da sessão                                                 */
/* ================================================================== */

/**
 * Título da sessão no centro com menu (renomear, mover, arquivar, exportar)
 * e ações à direita: navegador do agente, gravar reunião, buscar,
 * compartilhar, painel de informações. `onBack` aparece no celular.
 */
export function SessionHeader({
  title,
  menu,
  recording,
  onRecordToggle,
  onBrowser,
  onSearch,
  onShare,
  infoOpen,
  onInfoToggle,
  onBack,
  leading,
  className,
}: {
  title: string;
  menu: MenuEntry[];
  recording?: boolean;
  onRecordToggle?: () => void;
  onBrowser?: () => void;
  onSearch?: () => void;
  onShare?: () => void;
  infoOpen?: boolean;
  onInfoToggle?: () => void;
  onBack?: () => void;
  /** Antes do título (desktop): ListToggle, SessionQuickSwitcher. */
  leading?: ReactNode;
  className?: string;
}) {
  const icon = "grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-ink/[0.06] hover:text-ink [&_svg]:h-4 [&_svg]:w-4";
  return (
    <header className={cn("flex h-14 shrink-0 items-center gap-1 border-b border-line px-3", className)}>
      {onBack && (
        <button type="button" onClick={onBack} aria-label="Voltar para sessões" className={cn(icon, "md:hidden")}>
          <ChevronDown className="rotate-90" />
        </button>
      )}
      {leading}
      <div className="flex min-w-0 flex-1 justify-start md:justify-center">
        <Menu
          label={`Sessão: ${title}`}
          align="center"
          triggerClassName="!h-9 min-w-0 max-w-full !gap-1.5 !rounded-lg !bg-transparent !px-2.5 !text-[14px] !font-semibold !text-ink !ring-0 hover:!bg-ink/[0.05]"
          trigger={
            <>
              <span className="truncate">{title}</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
            </>
          }
          items={menu}
        />
      </div>
      {onBrowser && (
        <Tooltip content="Navegador do agente">
          <button type="button" onClick={onBrowser} aria-label="Navegador do agente" className={cn(icon, "hidden sm:grid")}>
            <Globe />
          </button>
        </Tooltip>
      )}
      {onRecordToggle && (
        <button
          type="button"
          onClick={onRecordToggle}
          aria-pressed={recording}
          className={cn(
            "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] font-medium transition-colors [&_svg]:h-4 [&_svg]:w-4",
            recording ? "bg-rose-soft text-rose" : "text-ink-soft hover:bg-ink/[0.06] hover:text-ink",
          )}
        >
          {recording ? <span aria-hidden className="h-2 w-2 rounded-full bg-rose motion-safe:animate-pulse" /> : <Mic />}
          <span className="max-lg:sr-only">{recording ? "Gravando reunião" : "Gravar reunião"}</span>
        </button>
      )}
      {onSearch && (
        <Tooltip content="Buscar na conversa">
          <button type="button" onClick={onSearch} aria-label="Buscar na conversa" className={cn(icon, "hidden sm:grid")}>
            <Search />
          </button>
        </Tooltip>
      )}
      {onShare && (
        <Tooltip content="Compartilhar">
          <button type="button" onClick={onShare} aria-label="Compartilhar" className={icon}>
            <Share />
          </button>
        </Tooltip>
      )}
      {onInfoToggle && (
        <Tooltip content={infoOpen ? "Fechar informações" : "Informações da sessão"}>
          <button type="button" onClick={onInfoToggle} aria-pressed={infoOpen} aria-label="Informações da sessão" className={cn(icon, infoOpen && "bg-ink/[0.06] text-ink")}>
            <PanelRight />
          </button>
        </Tooltip>
      )}
    </header>
  );
}

/* ================================================================== */
/* Painel de informações                                               */
/* ================================================================== */

export type SessionMode = "executar" | "planejar" | "perguntar";
const modeMeta: Record<SessionMode, { label: string; hint: string; icon: ReactNode }> = {
  executar: { label: "Executar", hint: "Age nas ferramentas e pede aprovação no que é irreversível", icon: <RefreshCw className="h-3.5 w-3.5 text-accent-deep" /> },
  planejar: { label: "Planejar", hint: "Monta o plano e espera você aprovar antes de agir", icon: <ListFilter className="h-3.5 w-3.5 text-blue" /> },
  perguntar: { label: "Perguntar", hint: "Só lê e responde; não altera nada", icon: <Lock className="h-3.5 w-3.5 text-muted" /> },
};

export type SessionFile = { id: string; name: string; size?: number; meta?: string };

/**
 * Conteúdo de detalhes da sessão (modo, criador, nome, etiquetas, notas) e
 * arquivos, sem moldura. Use dentro do SessionInfoPanel ou como aba
 * "Detalhes" de um ArtifactPanel. `title={null}` esconde o título.
 */
export function SessionDetails({
  name,
  onNameChange,
  mode,
  onModeChange,
  createdBy,
  tags,
  onTagsChange,
  tagSuggestions = [],
  notes,
  onNotesChange,
  files = [],
  onOpenFile,
  title = "Informações da sessão",
  defaultSection = "detalhes",
  show = "both",
  className,
}: {
  name: string;
  onNameChange: (v: string) => void;
  mode: SessionMode;
  onModeChange: (m: SessionMode) => void;
  createdBy: ReactNode;
  tags: string[];
  onTagsChange: (t: string[]) => void;
  tagSuggestions?: string[];
  notes: string;
  onNotesChange: (v: string) => void;
  files?: SessionFile[];
  /** Abre um arquivo da lista (prévia, download). Sem ele, os cartões não são clicáveis. */
  onOpenFile?: (file: SessionFile) => void;
  title?: ReactNode;
  defaultSection?: "detalhes" | "arquivos";
  /** "both" (padrão) com sub-abas; "detalhes" ou "arquivos" mostra só uma seção, sem sub-abas. */
  show?: "both" | "detalhes" | "arquivos";
  className?: string;
}) {
  const [subState, setSub] = useState<"detalhes" | "arquivos">(defaultSection);
  const sub = show === "both" ? subState : show;
  const [notesOpen, setNotesOpen] = useState(false);
  const [draft, setDraft] = useState(name);
  useEffect(() => setDraft(name), [name]);
  const row = "flex items-center justify-between gap-3 border-b border-line py-3";
  return (
    <div className={cn("min-w-0", className)}>
      {title != null && <h3 className="m-0 pt-4 text-[15px] font-semibold tracking-tight">{title}</h3>}
      <div role="tablist" aria-label="Seções" className={cn("flex gap-4 border-b border-line", title != null && "mt-2", show !== "both" && "hidden")}>
        {(
          [
            ["detalhes", "Detalhes"],
            ["arquivos", `Arquivos${files.length ? ` · ${files.length}` : ""}`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={sub === id}
            onClick={() => setSub(id)}
            className={cn("-mb-px border-b-2 py-2.5 text-[13px] transition-colors", sub === id ? "border-ink font-medium text-ink" : "border-transparent text-muted hover:text-ink")}
          >
            {label}
          </button>
        ))}
      </div>
      {sub === "detalhes" ? (
        <div>
          <div className={row}>
            <span className="shrink-0 text-[13px] text-muted">Modo da sessão</span>
            <Menu
              label="Modo da sessão"
              align="end"
              triggerClassName="!h-8 !gap-1.5 !rounded-lg !px-2.5 !text-[12.5px]"
              trigger={
                <>
                  {modeMeta[mode].icon}
                  {modeMeta[mode].label}
                  <ChevronDown className="!h-3.5 !w-3.5 text-muted" />
                </>
              }
              items={(Object.keys(modeMeta) as SessionMode[]).map((m) => ({
                type: "checkbox" as const,
                label: `${modeMeta[m].label} — ${modeMeta[m].hint}`,
                checked: m === mode,
                onCheckedChange: () => onModeChange(m),
              }))}
            />
          </div>
          <div className={row}>
            <span className="shrink-0 text-[13px] text-muted">Criada por</span>
            <span className="min-w-0 text-right text-[13px] text-ink">{createdBy}</span>
          </div>
          <div className="border-b border-line py-3">
            <label className="block text-[13px] text-muted" htmlFor="session-name">
              Nome
            </label>
            <input
              id="session-name"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => draft.trim() && draft !== name && onNameChange(draft.trim())}
              onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
              className="mt-2 h-10 w-full rounded-xl border border-line bg-surface px-3 text-[14px] text-ink"
            />
          </div>
          <div className="border-b border-line py-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[13px] text-muted">
                <Tag className="h-3.5 w-3.5" aria-hidden /> Etiquetas
              </span>
              <Menu
                label="Adicionar etiqueta"
                align="end"
                triggerClassName="!h-7 !w-7 justify-center !gap-0 !rounded-md !bg-transparent !px-0 !text-muted !ring-0 hover:!bg-ink/[0.06] hover:!text-ink"
                trigger={<Plus className="h-4 w-4" />}
                items={
                  tagSuggestions.filter((t) => !tags.includes(t)).length
                    ? tagSuggestions.filter((t) => !tags.includes(t)).map((t) => ({ label: t, icon: <Tag className="h-4 w-4" />, onSelect: () => onTagsChange([...tags, t]) }))
                    : [{ label: "Todas as etiquetas já aplicadas", disabled: true }]
                }
              />
            </div>
            {tags.length ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span key={t} className="inline-flex h-7 items-center gap-1 rounded-md bg-accent-soft pl-2 pr-1 text-[12px] font-medium text-accent-deep">
                    {t}
                    <button type="button" aria-label={`Remover ${t}`} onClick={() => onTagsChange(tags.filter((x) => x !== t))} className="grid h-5 w-5 place-items-center rounded hover:bg-ink/[0.06]">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="m-0 mt-2 rounded-xl border border-dashed border-line px-3 py-2.5 text-[12.5px] text-muted">Nenhuma etiqueta aplicada</p>
            )}
          </div>
          <div className="py-3">
            <button type="button" onClick={() => setNotesOpen((v) => !v)} aria-expanded={notesOpen} className="flex w-full items-center justify-between text-[13px] text-muted hover:text-ink">
              Notas {notes && !notesOpen && <span className="ml-2 min-w-0 flex-1 truncate text-left text-ink-soft">· {notes}</span>}
              <ChevronDown className={cn("h-4 w-4 transition-transform", notesOpen && "rotate-180")} />
            </button>
            {notesOpen && (
              <textarea
                aria-label="Notas da sessão"
                value={notes}
                onChange={(e) => onNotesChange(e.target.value)}
                rows={4}
                placeholder="Contexto que o agente deve lembrar nesta sessão…"
                className="mt-2 w-full resize-none rounded-xl border border-line bg-surface px-3 py-2 text-[13.5px] leading-relaxed text-ink placeholder:text-muted"
              />
            )}
          </div>
        </div>
      ) : files.length ? (
        <div className="mt-3 flex flex-col gap-2">
          {files.map((f) => (
            <FileCard key={f.id} name={f.name} size={f.size} meta={f.meta} onOpen={onOpenFile ? () => onOpenFile(f) : undefined} />
          ))}
        </div>
      ) : (
        <p className="m-0 mt-4 rounded-xl border border-dashed border-line px-3 py-6 text-center text-[12.5px] text-muted">Arquivos anexados ou gerados pelo agente aparecem aqui.</p>
      )}
    </div>
  );
}

/**
 * Painel lateral da sessão: abas Informações | Navegador. Informações tem
 * Detalhes (modo, criador, nome, etiquetas, notas) e Arquivos. Navegador
 * mostra a página que o agente está usando.
 */
export function SessionInfoPanel({
  name,
  onNameChange,
  mode,
  onModeChange,
  createdBy,
  tags,
  onTagsChange,
  tagSuggestions = [],
  notes,
  onNotesChange,
  files = [],
  onOpenFile,
  browser,
  onMinimize,
  className,
}: {
  name: string;
  onNameChange: (v: string) => void;
  mode: SessionMode;
  onModeChange: (m: SessionMode) => void;
  createdBy: ReactNode;
  tags: string[];
  onTagsChange: (t: string[]) => void;
  tagSuggestions?: string[];
  notes: string;
  onNotesChange: (v: string) => void;
  files?: SessionFile[];
  /** Abre um arquivo da lista (prévia, download). */
  onOpenFile?: (file: SessionFile) => void;
  /** Página aberta pelo agente (aba Navegador). */
  browser?: { url: string; title: string; content?: ReactNode };
  onMinimize?: () => void;
  className?: string;
}) {
  const [top, setTop] = useState<"info" | "browser">("info");
  const pill = (on: boolean) => cn("inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] transition-colors [&_svg]:h-3.5 [&_svg]:w-3.5", on ? "bg-ink/[0.07] font-medium text-ink" : "text-muted hover:bg-ink/[0.04] hover:text-ink");
  return (
    <section aria-label="Informações da sessão" className={cn("flex h-full min-h-0 flex-col bg-page", className)}>
      <div className="flex h-14 shrink-0 items-center gap-1 border-b border-line px-3">
        <button type="button" aria-pressed={top === "info"} onClick={() => setTop("info")} className={pill(top === "info")}>
          <Info /> Informações
        </button>
        <button type="button" aria-pressed={top === "browser"} onClick={() => setTop("browser")} className={pill(top === "browser")}>
          <Globe /> Navegador
        </button>
        <span className="flex-1" />
        {onMinimize && (
          <Tooltip content="Recolher painel">
            <button type="button" onClick={onMinimize} aria-label="Recolher painel" className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-ink/[0.06] hover:text-ink">
              <Minus className="h-4 w-4" />
            </button>
          </Tooltip>
        )}
      </div>
      {top === "info" ? (
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6">
          <SessionDetails
            name={name}
            onNameChange={onNameChange}
            mode={mode}
            onModeChange={onModeChange}
            createdBy={createdBy}
            tags={tags}
            onTagsChange={onTagsChange}
            tagSuggestions={tagSuggestions}
            notes={notes}
            onNotesChange={onNotesChange}
            files={files}
            onOpenFile={onOpenFile}
          />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col p-3">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-line bg-surface">
            <div className="flex items-center gap-2 border-b border-line bg-soft/60 px-3 py-2">
              <span className="flex gap-1" aria-hidden>
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-2 w-2 rounded-full bg-line-strong" />
                ))}
              </span>
              <span className="flex h-7 min-w-0 flex-1 items-center gap-1.5 rounded-md bg-surface px-2 text-[12px] text-muted ring-1 ring-line">
                <Lock className="h-3 w-3 shrink-0" aria-hidden />
                <span className="truncate">{browser?.url ?? "about:blank"}</span>
              </span>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {browser ? (
                <>
                  <p className="m-0 text-[13.5px] font-semibold">{browser.title}</p>
                  <div className="mt-3 text-[12.5px] leading-relaxed text-ink-soft">
                    {browser.content ?? (
                      <div className="space-y-2" aria-hidden>
                        {[90, 75, 82, 60, 88, 45].map((w, i) => (
                          <div key={i} className="h-2.5 rounded bg-line" style={{ width: `${w}%` }} />
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p className="m-0 text-center text-[12.5px] text-muted">O agente ainda não abriu nenhuma página nesta sessão.</p>
              )}
            </div>
          </div>
          <p className="m-0 mt-2 text-center text-[11.5px] text-muted">O agente controla esta janela. Você vê o que ele vê.</p>
        </div>
      )}
    </section>
  );
}

/* ================================================================== */
/* Modo voz                                                            */
/* ================================================================== */

/** Botão redondo flutuante do modo voz (canto inferior direito). */
export function VoiceModeButton({ onClick, className, label = "Conversar por voz" }: { onClick: () => void; className?: string; label?: string }) {
  return (
    <Tooltip content={label} side="left">
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={cn("grid h-12 w-12 place-items-center rounded-full border border-line bg-popover text-ink shadow-raised transition-transform hover:scale-[1.04] motion-reduce:hover:scale-100", className)}
      >
        <AudioLines className="h-5 w-5" />
      </button>
    </Tooltip>
  );
}

/**
 * Sobreposição do modo voz: orbe com forma de onda, estado (ouvindo/falando),
 * transcrição ao vivo, silenciar e encerrar. Sem animação com movimento reduzido.
 */
export function VoiceOverlay({ open, onClose, transcript = [], agentName = "G4 OS" }: { open: boolean; onClose: (transcript: string[]) => void; transcript?: string[]; agentName?: string }) {
  const [muted, setMuted] = useState(false);
  const [phase, setPhase] = useState<"ouvindo" | "falando">("ouvindo");
  const [lines, setLines] = useState<string[]>([]);
  useEffect(() => {
    if (!open) return;
    setLines([]);
    setPhase("ouvindo");
    let i = 0;
    const t = setInterval(() => {
      if (i >= transcript.length) return;
      setLines((l) => [...l, transcript[i]]);
      setPhase(i % 2 === 0 ? "falando" : "ouvindo");
      i += 1;
    }, 1600);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose([]);
    window.addEventListener("keydown", onKey);
    return () => {
      clearInterval(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, transcript, onClose]);
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label="Modo voz" className="animate-fade fixed inset-0 z-[96] flex flex-col items-center justify-between bg-page/95 px-6 py-10 backdrop-blur-md">
      <p className="m-0 text-[13px] font-medium text-muted">Modo voz · {agentName}</p>
      <div className="flex flex-col items-center">
        <div className={cn("relative grid h-44 w-44 place-items-center rounded-full", muted ? "bg-soft" : "bg-ink/[0.06]")}>
          <span aria-hidden className={cn("absolute inset-3 rounded-full border border-line", !muted && phase === "falando" && "motion-safe:animate-pulse")} />
          <Waveform active={!muted} bars={20} className="!h-14 w-28 !flex-none justify-center" barClassName={phase === "falando" ? "bg-primary" : "bg-ink/70"} />
        </div>
        <p className="m-0 mt-6 text-[15px] font-medium" aria-live="polite">
          {muted ? "Microfone silenciado" : phase === "falando" ? `${agentName} está falando…` : "Ouvindo…"}
        </p>
        <div className="mt-4 max-w-[520px] space-y-1.5 text-center text-[13.5px] leading-relaxed text-ink-soft" aria-live="polite">
          {lines.slice(-3).map((l, i) => (
            <p key={i} className="enter m-0">
              {l}
            </p>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          aria-pressed={muted}
          aria-label={muted ? "Ativar microfone" : "Silenciar microfone"}
          className={cn("grid h-12 w-12 place-items-center rounded-full border border-line transition-colors", muted ? "bg-ink text-on-ink" : "bg-surface text-ink hover:bg-soft")}
        >
          {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>
        <button type="button" onClick={() => onClose(lines)} className="inline-flex h-12 items-center gap-2 rounded-full bg-rose px-5 text-[14px] font-medium text-on-ink hover:bg-rose/90">
          <X className="h-4 w-4" /> Encerrar
        </button>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Seletor de workspace                                                */
/* ================================================================== */

/** Rodapé da coluna: workspace atual com troca. */
export function WorkspaceSwitcher({ name, mark, items }: { name: string; mark?: ReactNode; items: MenuEntry[] }) {
  return (
    <Menu
      label={`Workspace: ${name}`}
      align="start"
      side="top"
      triggerClassName="!h-9 w-full !justify-start !gap-2 !rounded-lg !bg-transparent !px-2 !text-[13.5px] !font-semibold !ring-0 hover:!bg-ink/[0.05]"
      trigger={
        <>
          {mark ?? <span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-[10px] font-bold text-on-ink">G4</span>}
          <span className="truncate">{name}</span>
          <ChevronDown className="!h-3.5 !w-3.5 text-muted" />
        </>
      }
      items={items}
    />
  );
}

/* ================================================================== */
/* Permissão e modelo (chips do campo)                                 */
/* ================================================================== */

export type PermissionMode = "ler" | "aprovar" | "total";

const permissionMeta: Record<PermissionMode, { label: string; description: string; Icon: typeof Eye; cls: string }> = {
  ler: { label: "Somente leitura", description: "Lê arquivos e ferramentas; não altera nada.", Icon: Eye, cls: "text-muted" },
  aprovar: { label: "Pedir aprovação", description: "Pergunta antes de cada ação que altera dados ou envia algo.", Icon: ShieldCheck, cls: "text-ink-soft" },
  total: { label: "Acesso total", description: "Age sem perguntar: edita, envia, publica. Use em ambiente controlado.", Icon: ShieldAlert, cls: "text-amber" },
};

/**
 * Chip de permissão do agente, sempre visível no campo. "Acesso total" fica em
 * âmbar e só é ativado depois de confirmação. Menu com descrição de cada nível.
 */
export function PermissionModeChip({ value, onChange, className }: { value: PermissionMode; onChange: (mode: PermissionMode) => void; className?: string }) {
  const [pending, setPending] = useState<PermissionMode | null>(null);
  const cur = permissionMeta[value];
  const choose = (m: PermissionMode) => {
    if (m === value) return;
    if (m === "total") setPending("total");
    else onChange(m);
  };
  return (
    <>
      <BaseMenu.Root>
        <BaseMenu.Trigger
          aria-label={`Permissão do agente: ${cur.label}`}
          className={cn(
            "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium outline-none transition-colors hover:bg-ink/[0.05] focus-visible:ring-2 focus-visible:ring-muted/40 data-popup-open:bg-ink/[0.06] [&_svg]:h-3.5 [&_svg]:w-3.5",
            value === "total" ? "bg-amber-soft text-amber hover:bg-amber-soft" : cur.cls,
            className,
          )}
        >
          <cur.Icon aria-hidden />
          <span className="whitespace-nowrap @max-[440px]:sr-only">{cur.label}</span>
          <ChevronDown className="!h-3 !w-3 opacity-70" aria-hidden />
        </BaseMenu.Trigger>
        <BaseMenu.Portal>
          <BaseMenu.Positioner side="top" align="start" sideOffset={6} collisionPadding={12} className="z-[100]">
            <BaseMenu.Popup className={cn(popupClass, "w-[300px] bg-popover p-1.5")}>
              <BaseMenu.RadioGroup value={value} onValueChange={(v) => choose(v as PermissionMode)}>
                {(Object.keys(permissionMeta) as PermissionMode[]).map((m) => {
                  const it = permissionMeta[m];
                  return (
                    <BaseMenu.RadioItem key={m} value={m} closeOnClick className="flex w-full cursor-default items-start gap-2.5 rounded-lg px-2.5 py-2 text-left outline-none data-highlighted:bg-soft">
                      <it.Icon className={cn("mt-0.5 h-4 w-4 shrink-0", m === "total" ? "text-amber" : "text-muted")} aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className={cn("block text-[13px] font-medium", m === "total" ? "text-amber" : "text-ink")}>{it.label}</span>
                        <span className="block text-[12px] leading-snug text-muted">{it.description}</span>
                      </span>
                      <BaseMenu.RadioItemIndicator className="mt-0.5 shrink-0">
                        <Check className="h-4 w-4" aria-hidden />
                      </BaseMenu.RadioItemIndicator>
                    </BaseMenu.RadioItem>
                  );
                })}
              </BaseMenu.RadioGroup>
            </BaseMenu.Popup>
          </BaseMenu.Positioner>
        </BaseMenu.Portal>
      </BaseMenu.Root>
      <ConfirmDialog
        open={pending === "total"}
        onClose={() => setPending(null)}
        onConfirm={() => {
          onChange("total");
          setPending(null);
        }}
        title="Dar acesso total ao agente?"
        description="Ele vai editar arquivos, enviar mensagens e publicar sem pedir aprovação a cada passo. Você pode voltar para “Pedir aprovação” a qualquer momento."
        confirmLabel="Dar acesso total"
      />
    </>
  );
}

export type ModelOption = { id: string; name: string; group?: string; description?: string; icon?: ReactNode };
export type ModelEffort = "leve" | "padrao" | "profundo";
const effortLabel: Record<ModelEffort, string> = { leve: "Leve", padrao: "Padrão", profundo: "Profundo" };

/**
 * Chip de modelo + esforço ("⚡ Sol · Leve ⌄"). Menu agrupado por família e
 * seletor de esforço (mais esforço = mais lento e caro, mais cuidadoso).
 * Com `agents`, vira o chip único do campo: avatar + "G4 OS · Padrão" e o
 * menu escolhe agente, modelo e esforço. Estreito (< 440px): só o avatar.
 */
export function ModelPicker({
  models,
  value,
  onChange,
  effort,
  onEffortChange,
  agents,
  agent,
  onAgentChange,
  className,
}: {
  models: ModelOption[];
  value: string;
  onChange: (id: string) => void;
  effort?: ModelEffort;
  onEffortChange?: (e: ModelEffort) => void;
  /** Agentes disponíveis: o chip mostra o agente e o menu ganha a seção "Agente". */
  agents?: AgentOption[];
  agent?: string;
  onAgentChange?: (id: string) => void;
  className?: string;
}) {
  const cur = models.find((m) => m.id === value) ?? models[0];
  const groups = Array.from(new Set(models.map((m) => m.group ?? "Modelos")));
  const curAgent = agents?.find((a) => a.id === agent) ?? agents?.[0];
  const avatar = (a: AgentOption, size = "h-5 w-5 text-[10px] tracking-tight") => (
    // ds-audit-ignore white-black: iniciais brancas sobre o tint do agente (identidade), escurecido até AA por tintFill
    <span aria-hidden className={cn("grid shrink-0 place-items-center rounded-full font-bold text-white", size)} style={{ background: tintFill(a.tint, "var(--ds-ink-soft)") }}>
      {a.initials}
    </span>
  );
  return (
    <BaseMenu.Root>
      <BaseMenu.Trigger
        aria-label={`${curAgent ? `Agente: ${curAgent.name}, ` : ""}Modelo: ${cur?.name}${effort ? `, esforço ${effortLabel[effort]}` : ""}`}
        className={cn(
          "inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full text-[12px] text-ink-soft outline-none transition-colors hover:bg-ink/[0.05] hover:text-ink focus-visible:ring-2 focus-visible:ring-muted/40 data-popup-open:bg-ink/[0.06]",
          curAgent ? "pl-1.5 pr-2.5" : "px-2.5",
          className,
        )}
      >
        {curAgent ? (
          <>
            {avatar(curAgent)}
            <span className="whitespace-nowrap @max-[440px]:sr-only">
              <span className="font-medium text-ink">{curAgent.name}</span>
              <span className="text-muted"> · {effort ? effortLabel[effort] : cur?.name}</span>
            </span>
          </>
        ) : (
          <>
            <span className="shrink-0 text-accent-deep [&_svg]:h-3.5 [&_svg]:w-3.5" aria-hidden>
              {cur?.icon ?? <Zap />}
            </span>
            <span className="whitespace-nowrap font-medium text-ink @max-[460px]:sr-only">{cur?.name}</span>
            {effort && <span className="hidden whitespace-nowrap text-muted sm:inline @max-[640px]:hidden">{effortLabel[effort]}</span>}
          </>
        )}
        <ChevronDown className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
      </BaseMenu.Trigger>
      <BaseMenu.Portal>
        <BaseMenu.Positioner side="top" align="end" sideOffset={6} collisionPadding={12} className="z-[100]">
          <BaseMenu.Popup className={cn(popupClass, "max-h-[var(--available-height)] w-[290px] overflow-y-auto bg-popover p-1.5")}>
            {agents && curAgent && (
              <>
                <div className="px-2.5 pb-1 pt-2 text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted">Agente</div>
                <BaseMenu.RadioGroup value={curAgent.id} onValueChange={(v) => onAgentChange?.(v as string)}>
                  {agents.map((a) => (
                    <BaseMenu.RadioItem key={a.id} value={a.id} closeOnClick className="flex w-full cursor-default items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left outline-none data-highlighted:bg-soft">
                      {avatar(a, "h-6 w-6 text-[10px]")}
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-medium text-ink">{a.name}</span>
                        {a.description && <span className="block truncate text-[12px] text-muted">{a.description}</span>}
                      </span>
                      <BaseMenu.RadioItemIndicator className="shrink-0">
                        <Check className="h-4 w-4" aria-hidden />
                      </BaseMenu.RadioItemIndicator>
                    </BaseMenu.RadioItem>
                  ))}
                </BaseMenu.RadioGroup>
                <BaseMenu.Separator className="my-1 h-px bg-line" />
              </>
            )}
            <BaseMenu.RadioGroup value={value} onValueChange={(v) => onChange(v as string)}>
              {groups.map((g) => (
                <div key={g}>
                  <div className="px-2.5 pb-1 pt-2 text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted">{g}</div>
                  {models
                    .filter((m) => (m.group ?? "Modelos") === g)
                    .map((m) => (
                      <BaseMenu.RadioItem key={m.id} value={m.id} closeOnClick className="flex w-full cursor-default items-start gap-2.5 rounded-lg px-2.5 py-2 text-left outline-none data-highlighted:bg-soft">
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] font-medium text-ink">{m.name}</span>
                          {m.description && <span className="block text-[12px] leading-snug text-muted">{m.description}</span>}
                        </span>
                        <BaseMenu.RadioItemIndicator className="mt-0.5 shrink-0">
                          <Check className="h-4 w-4" aria-hidden />
                        </BaseMenu.RadioItemIndicator>
                      </BaseMenu.RadioItem>
                    ))}
                </div>
              ))}
            </BaseMenu.RadioGroup>
            {effort && onEffortChange && (
              <>
                <BaseMenu.Separator className="my-1 h-px bg-line" />
                <div className="px-2.5 pb-1 pt-1.5 text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted">Esforço</div>
                <div role="radiogroup" aria-label="Esforço" className="grid grid-cols-3 gap-0.5 rounded-lg bg-ink/[0.04] p-0.5 mx-1 mb-1">
                  {(Object.keys(effortLabel) as ModelEffort[]).map((e) => (
                    <button
                      key={e}
                      type="button"
                      role="radio"
                      aria-checked={effort === e}
                      onClick={() => onEffortChange(e)}
                      className={cn("h-7 rounded-md text-[12px]", effort === e ? "bg-surface font-medium text-ink shadow-surface ring-1 ring-line-strong" : "text-muted hover:text-ink")}
                    >
                      {effortLabel[e]}
                    </button>
                  ))}
                </div>
              </>
            )}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}
