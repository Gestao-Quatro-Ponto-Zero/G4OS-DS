"use client";

import { Ellipsis, Lock, Play, Plus, RotateCcw, Sparkles, Upload, Wand2, X } from "lucide-react";
import { useEffect, useRef, useState, type DragEvent, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { formatNumber } from "../lib/format";
import { Switch } from "./forms";
import { FileCard, formatBytes } from "./media";
import { Menu, type MenuEntry } from "./overlays-extra";
import { Button, IconButton } from "./primitives";
import { RichTextEditor } from "./rich-text";

/*
 * Construtor de agente: a "ficha" do agente ao lado da conversa com ele.
 * Seções fixas e nessa ordem: Gatilhos (quando roda) → Propriedades (com o
 * que trabalha: ferramentas, entrada, saída, verificações) → Instruções (o
 * que faz). Ver docs/padroes/agentes.md.
 */

/** Ícone de app/ferramenta: quadradinho com a inicial na cor da marca do app. */
export function ToolGlyph({ name, color, icon, size = 18, className }: { name: string; color?: string; icon?: ReactNode; size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-grid shrink-0 place-items-center rounded-[5px] font-semibold leading-none [&_svg]:h-[70%] [&_svg]:w-[70%]", className)}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.55),
        background: color ? `color-mix(in oklab, ${color} 16%, transparent)` : "var(--ds-soft)",
        color: color ? `color-mix(in oklab, ${color} 75%, var(--ds-ink))` : "var(--ds-ink-soft)",
      }}
    >
      {icon ?? name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export type AgentStatus = "rascunho" | "publicado" | "alterado";
const statusText: Record<AgentStatus, string> = { rascunho: "Rascunho", publicado: "Publicado", alterado: "Alterações não publicadas" };

/**
 * Ações do construtor: status + Compartilhar · Testar · Publicar · ⋯.
 * "Publicar" é o primário; com alterações pendentes vira "Publicar alterações".
 */
export function PublishBar({
  status,
  onShare,
  onTest,
  onPublish,
  testing = false,
  menu,
  className,
}: {
  status: AgentStatus;
  onShare?: () => void;
  onTest?: () => void;
  onPublish?: () => void;
  testing?: boolean;
  menu?: MenuEntry[];
  className?: string;
}) {
  const dot = status === "publicado" ? "bg-ok" : status === "alterado" ? "bg-amber" : "bg-line-strong";
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span className="mr-1 hidden items-center gap-1.5 text-[12px] text-muted md:inline-flex">
        <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", dot)} />
        {statusText[status]}
      </span>
      {onShare && (
        <button type="button" onClick={onShare} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] text-ink-soft hover:bg-soft hover:text-ink">
          <Lock className="h-3.5 w-3.5" /> <span className="max-sm:sr-only">Compartilhar</span>
        </button>
      )}
      {onTest && (
        <button
          type="button"
          onClick={onTest}
          disabled={testing}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-surface px-2.5 text-[12.5px] font-medium text-ink ring-1 ring-line hover:bg-soft disabled:opacity-60"
        >
          <Play className="h-3.5 w-3.5" /> {testing ? "Testando…" : "Testar"}
        </button>
      )}
      {onPublish && (
        <button
          type="button"
          onClick={onPublish}
          disabled={status === "publicado"}
          className="ui-button ui-button-primary inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-[12.5px] font-medium text-on-primary hover:bg-primary/90 disabled:opacity-50"
        >
          <Upload className="h-3.5 w-3.5" /> {status === "alterado" ? "Publicar alterações" : status === "publicado" ? "Publicado" : "Publicar"}
        </button>
      )}
      {menu && (
        <Menu label="Mais ações" align="end" triggerClassName="!h-8 !w-8 justify-center !px-0 !bg-transparent !ring-0 hover:!bg-soft text-muted" trigger={<Ellipsis />} items={menu} />
      )}
    </div>
  );
}

/** Cabeçalho do agente: ícone grande, nome, descrição (ambos editáveis inline se receber os handlers). */
export function AgentHeader({
  icon,
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  onTitleChange?: (v: string) => void;
  onDescriptionChange?: (v: string) => void;
  className?: string;
}) {
  return (
    <header className={cn("min-w-0", className)}>
      <span className="grid h-12 w-12 place-items-center rounded-xl border border-line bg-surface text-blue shadow-surface [&_svg]:h-5 [&_svg]:w-5">
        {icon ?? <Sparkles />}
      </span>
      {onTitleChange ? (
        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          aria-label="Nome do agente"
          className="ds-bare -mx-1.5 mt-4 w-[calc(100%+12px)] rounded-md bg-transparent px-1.5 text-[24px] font-semibold tracking-[-0.02em] text-ink outline-none hover:bg-soft focus-visible:bg-soft focus-visible:ring-2 focus-visible:ring-muted/40"
          style={{ fontFamily: "var(--ds-font-display)" }}
        />
      ) : (
        <h1 className="m-0 mt-4 text-[24px] font-semibold tracking-[-0.02em]" style={{ fontFamily: "var(--ds-font-display)" }}>
          {title}
        </h1>
      )}
      {onDescriptionChange ? (
        // Uma frase, mas sem cortar: cresce com o texto (field-sizing) e não aceita quebra de linha.
        <textarea
          value={description ?? ""}
          onChange={(e) => onDescriptionChange(e.target.value.replace(/\n/g, " "))}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.preventDefault();
          }}
          rows={1}
          aria-label="Descrição do agente"
          placeholder="O que este agente faz, em uma frase"
          className="ds-bare -mx-1.5 mt-1 block w-[calc(100%+12px)] resize-none rounded-md bg-transparent px-1.5 text-[14px] leading-[1.45] text-muted outline-none [field-sizing:content] placeholder:text-muted hover:bg-soft focus-visible:bg-soft focus-visible:ring-2 focus-visible:ring-muted/40"
        />
      ) : (
        description && <p className="m-0 mt-1 text-[14px] text-muted">{description}</p>
      )}
    </header>
  );
}

/** Seção do construtor: título, selo opcional, descrição, ação à direita, conteúdo. */
export function BuilderSection({ title, description, badge, action, children, className }: { title: string; description?: ReactNode; badge?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("border-t border-line pt-6", className)}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="m-0 flex flex-wrap items-center gap-2 text-[14px] font-medium">
            {title}
            {badge}
          </h2>
          {description && <p className="m-0 mt-0.5 text-[12.5px] text-muted">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  );
}

/** Botão "+ Adicionar" com menu (aceita submenus). */
export function AddPropertyMenu({ items, label = "Adicionar" }: { items: MenuEntry[]; label?: string }) {
  return (
    <Menu
      label={label}
      align="end"
      triggerClassName="!h-8 !px-2.5 !text-[12.5px] gap-1.5"
      trigger={
        <>
          <Plus /> {label}
        </>
      }
      items={items}
    />
  );
}

export type TriggerItem = { id: string; icon?: ReactNode; label: ReactNode };

/** Lista de gatilhos (quando o agente roda). Cada linha tem menu ⋯. */
export function TriggerList({ triggers, rowMenu, empty = "Nenhum gatilho: o agente só roda quando alguém pedir." }: { triggers: TriggerItem[]; rowMenu?: (t: TriggerItem) => MenuEntry[]; empty?: ReactNode }) {
  if (!triggers.length) return <p className="m-0 rounded-xl border border-dashed border-line px-4 py-3 text-[12.5px] text-muted">{empty}</p>;
  return (
    <ul className="list-none divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface p-0">
      {triggers.map((t) => (
        <TriggerRow key={t.id} icon={t.icon} menu={rowMenu?.(t)}>
          {t.label}
        </TriggerRow>
      ))}
    </ul>
  );
}

export function TriggerRow({ icon, children, menu }: { icon?: ReactNode; children: ReactNode; menu?: MenuEntry[] }) {
  return (
    <li className="group flex min-h-11 items-center gap-2.5 px-3.5 py-2 text-[13px]">
      {icon}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {menu && (
        <Menu
          label="Ações do gatilho"
          align="end"
          triggerClassName="!h-7 !w-7 justify-center !px-0 !bg-transparent !ring-0 text-muted hover:!bg-soft opacity-70 group-hover:opacity-100"
          trigger={<Ellipsis />}
          items={menu}
        />
      )}
    </li>
  );
}

export type ChipItem = { id: string; label: string; icon?: ReactNode };

/** Chips removíveis + "+" com menu para adicionar (ferramentas, saídas, skills). */
export function ChipPicker({ chips, onRemove, addItems, addLabel = "Adicionar", empty }: { chips: ChipItem[]; onRemove?: (id: string) => void; addItems?: MenuEntry[]; addLabel?: string; empty?: string }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
      {chips.map((c) => (
        <span key={c.id} className="group inline-flex h-8 items-center gap-1.5 rounded-lg bg-surface pl-2 pr-1.5 text-[12.5px] font-medium ring-1 ring-line">
          {c.icon}
          {c.label}
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(c.id)}
              aria-label={`Remover ${c.label}`}
              className="ds-hit grid h-5 w-5 place-items-center rounded text-muted opacity-60 hover:bg-soft hover:text-ink group-hover:opacity-100"
            >
              ×
            </button>
          )}
        </span>
      ))}
      {!chips.length && empty && <span className="text-[12.5px] text-muted">{empty}</span>}
      {addItems && (
        <Menu label={addLabel} triggerClassName="!h-8 !w-8 justify-center !px-0 !bg-transparent !ring-0 text-muted hover:!bg-soft" trigger={<Plus />} items={addItems} />
      )}
    </div>
  );
}

/** Linha de propriedade: rótulo à esquerda (fixo) e valor/chips à direita; empilha no celular. */
export function PropertyRow({ label, children, hint }: { label: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="grid gap-1.5 py-2 sm:grid-cols-[140px_minmax(0,1fr)] sm:items-center sm:gap-4">
      <div className="text-[13px] text-ink-soft">
        {label}
        {hint && <div className="text-[11.5px] text-muted">{hint}</div>}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** Texto puro de um HTML (para contar caracteres sem as marcações). */
const plainLength = (html: string) =>
  html
    .replace(/<\/(p|li|h[1-6]|div)>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&[a-z0-9#]+;/gi, "x")
    .replace(/\s+/g, " ")
    .trim().length;

/**
 * Instruções do agente: editor de texto rico com "Melhorar" (IA) no toolbar.
 * Com `maxLength`, mostra o contador "357 / 2.000" (texto sem marcações) e
 * avisa quando passa do limite.
 */
export function AgentInstructions({
  value,
  onChange,
  onEnhance,
  enhancing = false,
  maxLength,
}: {
  value: string;
  onChange: (html: string) => void;
  onEnhance?: () => void;
  enhancing?: boolean;
  /** Limite de caracteres do texto (sem marcações). Mostra o contador abaixo do editor. */
  maxLength?: number;
}) {
  const editor = (
    <RichTextEditor
      label="Instruções do agente"
      value={value}
      onChange={onChange}
      minHeight={220}
      placeholder="Descreva os passos: o que buscar, como decidir, o que entregar…"
      aside={
        onEnhance && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onEnhance}
            disabled={enhancing}
            className={cn("inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] font-medium text-ink-soft hover:bg-soft hover:text-ink disabled:opacity-70", enhancing && "ds-shimmer")}
          >
            <Wand2 className="h-3.5 w-3.5" /> {enhancing ? "Melhorando…" : "Melhorar"}
          </button>
        )
      }
    />
  );
  if (maxLength == null) return editor;
  const used = plainLength(value);
  const over = used > maxLength;
  return (
    <div className="flex flex-col gap-1.5">
      {editor}
      <p className={cn("m-0 flex flex-wrap justify-end gap-x-2 text-[12px] tabular-nums", over ? "text-rose" : "text-muted")}>
        {over && <span>Passou do limite em {formatNumber(used - maxLength)} caracteres ·</span>}
        <span>
          <span className="sr-only">Caracteres usados: </span>
          {formatNumber(used)} / {formatNumber(maxLength)}
        </span>
      </p>
      <span className="sr-only" aria-live="polite">
        {over ? `As instruções passaram do limite de ${formatNumber(maxLength)} caracteres.` : ""}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Ferramentas ligadas, conhecimento e acesso a apps                   */
/* ------------------------------------------------------------------ */

/** Ferramenta do agente: marca do app, nome, o que o agente faz com ela e se está ligada. */
export type ToolToggleItem = {
  id: string;
  name: string;
  /** O que o agente faz com ela, em linguagem simples ("Lê conversas e cria rascunhos"). */
  description: string;
  /** Cor da marca do app (vai para o `ToolGlyph`). */
  color?: string;
  icon?: ReactNode;
  on: boolean;
  disabled?: boolean;
};

/**
 * Ferramentas do agente em grade (2 colunas; 1 em contêiner estreito): marca
 * do app, nome, o que o agente faz com ela e um `Switch` por ferramenta, com
 * o contador "5 de 6 ligadas".
 */
export function ToolToggleList({
  tools,
  onToggle,
  label = "Ferramentas",
  showCount = true,
  className,
}: {
  tools: ToolToggleItem[];
  onToggle: (id: string, on: boolean) => void;
  /** Nome acessível da lista. */
  label?: string;
  /** Mostra "5 de 6 ligadas" acima da grade. */
  showCount?: boolean;
  className?: string;
}) {
  const on = tools.filter((t) => t.on).length;
  return (
    <div className={cn("@container flex w-full flex-col gap-1", className)}>
      {showCount && (
        <p className="m-0 text-[12px] tabular-nums text-muted" aria-live="polite">
          {formatNumber(on)} de {formatNumber(tools.length)} {tools.length === 1 ? "ligada" : "ligadas"}
        </p>
      )}
      <ul aria-label={label} className="m-0 grid list-none grid-cols-1 gap-x-6 p-0 @[34rem]:grid-cols-2">
        {tools.map((t) => (
          <li key={t.id} className="flex min-w-0 items-center gap-3 border-b border-line py-2.5">
            <ToolGlyph name={t.name} color={t.color} icon={t.icon} size={28} className={cn("rounded-lg", !t.on && "opacity-55 grayscale")} />
            <span className="min-w-0 flex-1">
              <span className={cn("block truncate text-[13px] font-medium", t.on ? "text-ink" : "text-ink-soft")}>{t.name}</span>
              <span className="block text-[12px] leading-snug text-muted">{t.description}</span>
            </span>
            <Switch label={`Usar ${t.name}`} hideLabel checked={t.on} disabled={t.disabled} onCheckedChange={(v) => onToggle(t.id, v)} className="shrink-0" />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Arquivo de conhecimento do agente. `status` padrão: "pronto". */
export type KnowledgeFile = {
  id: string;
  name: string;
  /** Bytes. */
  size: number;
  status?: "pronto" | "enviando" | "erro";
  /** 0–100 enquanto envia. */
  progress?: number;
  error?: string;
  /** Texto extra na linha (ex.: "atualizado ontem"). */
  meta?: ReactNode;
};

/**
 * Envio de um arquivo: chame `report(0–100)` durante o envio, resolva no fim,
 * rejeite com `Error(mensagem)` se falhar e pare quando `signal` abortar
 * (o usuário cancelou).
 */
export type KnowledgeUpload = (file: File, report: (progress: number) => void, signal: AbortSignal) => Promise<void>;

type KnowledgeRow = KnowledgeFile & { file?: File; retry?: boolean };

/**
 * Arquivos que o agente consulta: tipo, tamanho, progresso de envio,
 * cancelar, erro com "Tentar de novo" e remover. "Adicionar arquivo" abre o
 * seletor (ou solte arquivos na área). Não controlado: comece com
 * `defaultFiles` e ouça `onChange` (só os prontos).
 */
export function KnowledgeFiles({
  defaultFiles = [],
  onUpload,
  onChange,
  onRemove,
  accept = ".pdf,.docx,.md,.txt,.csv,.xlsx",
  maxSize = 20 * 1024 * 1024,
  hint,
  addLabel = "Adicionar arquivo",
  label = "Arquivos de conhecimento",
  className,
}: {
  defaultFiles?: KnowledgeFile[];
  onUpload: KnowledgeUpload;
  /** Arquivos prontos depois de cada envio ou remoção. */
  onChange?: (files: KnowledgeFile[]) => void;
  onRemove?: (file: KnowledgeFile) => void;
  /** Tipos aceitos (atributo `accept` do input). */
  accept?: string;
  /** Tamanho máximo em bytes; maior que isso vira erro sem enviar. */
  maxSize?: number;
  /** Texto da área de adicionar. Padrão: tipos e tamanho máximo. */
  hint?: ReactNode;
  addLabel?: string;
  label?: string;
  className?: string;
}) {
  const [rows, setRows] = useState<KnowledgeRow[]>(defaultFiles);
  const [said, setSaid] = useState("");
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const controllers = useRef(new Map<string, AbortController>());
  const seq = useRef(0);
  const first = useRef(true);
  const changed = useRef(onChange);
  useEffect(() => {
    changed.current = onChange;
  });
  const ready = rows.filter((r) => (r.status ?? "pronto") === "pronto");
  const readyKey = ready.map((r) => r.id).join("|");

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    changed.current?.(rows.filter((r) => (r.status ?? "pronto") === "pronto").map((r) => ({ id: r.id, name: r.name, size: r.size, meta: r.meta })));
    // Só quando o conjunto de prontos muda (não a cada passo de progresso).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyKey]);
  useEffect(() => {
    const all = controllers.current;
    return () => all.forEach((c) => c.abort());
  }, []);

  const patch = (id: string, p: Partial<KnowledgeRow>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));

  const start = (id: string, file: File) => {
    const ctrl = new AbortController();
    controllers.current.set(id, ctrl);
    patch(id, { status: "enviando", progress: 0, error: undefined });
    onUpload(file, (p) => !ctrl.signal.aborted && patch(id, { progress: Math.max(0, Math.min(100, p)) }), ctrl.signal)
      .then(() => {
        if (ctrl.signal.aborted) return;
        patch(id, { status: "pronto", progress: undefined });
        setSaid(`${file.name} enviado`);
      })
      .catch((e: unknown) => {
        if (ctrl.signal.aborted) return;
        const message = e instanceof Error && e.message ? e.message : "Não foi possível enviar o arquivo.";
        patch(id, { status: "erro", progress: undefined, error: message, retry: true });
        setSaid(`${file.name}: ${message}`);
      })
      .finally(() => controllers.current.delete(id));
  };

  const add = (files: File[]) => {
    const fresh: KnowledgeRow[] = files.map((file) => ({ id: `kf-${Date.now()}-${seq.current++}`, name: file.name, size: file.size, file }));
    setRows((rs) => [
      ...rs,
      ...fresh.map((r) => (r.size > maxSize ? { ...r, status: "erro" as const, error: `Maior que ${formatBytes(maxSize)}`, retry: false } : { ...r, status: "enviando" as const, progress: 0 })),
    ]);
    fresh.filter((r) => r.size <= maxSize).forEach((r) => start(r.id, r.file as File));
  };

  const drop = (id: string, announce: string) => {
    controllers.current.get(id)?.abort();
    const row = rows.find((r) => r.id === id);
    setRows((rs) => rs.filter((r) => r.id !== id));
    setSaid(announce);
    if (row && (row.status ?? "pronto") === "pronto") onRemove?.(row);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    const files = Array.from(e.dataTransfer.files ?? []);
    if (files.length) add(files);
  };

  return (
    <div className={cn("flex w-full flex-col gap-2", className)}>
      {rows.length > 0 && (
        <ul aria-label={label} className="m-0 flex list-none flex-col gap-2 p-0">
          {rows.map((r) => {
            const status = r.status ?? "pronto";
            return (
              <li key={r.id}>
                <FileCard
                  name={r.name}
                  size={r.size}
                  meta={r.meta}
                  progress={status === "enviando" ? (r.progress ?? 0) : undefined}
                  error={status === "erro" ? r.error : undefined}
                  actions={
                    status === "enviando" ? (
                      <Button size="sm" variant="quiet" aria-label={`Cancelar envio de ${r.name}`} onClick={() => drop(r.id, `Envio de ${r.name} cancelado`)}>
                        Cancelar
                      </Button>
                    ) : (
                      <>
                        {status === "erro" && r.retry && r.file && (
                          <Button size="sm" variant="ghost" aria-label={`Tentar de novo: ${r.name}`} onClick={() => start(r.id, r.file as File)}>
                            <RotateCcw /> <span className="max-sm:hidden">Tentar de novo</span>
                          </Button>
                        )}
                        <IconButton size="sm" label={`Remover ${r.name}`} onClick={() => drop(r.id, `${r.name} removido`)}>
                          <X />
                        </IconButton>
                      </>
                    )
                  }
                />
              </li>
            );
          })}
        </ul>
      )}
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={cn(
          "flex min-h-11 w-full items-center gap-2.5 rounded-xl border border-dashed px-3 py-2.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-muted/40",
          over ? "border-ink bg-soft" : "border-line hover:border-line-strong hover:bg-soft/60",
        )}
      >
        <span aria-hidden className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-soft text-ink-soft [&_svg]:h-4 [&_svg]:w-4">
          <Plus />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-medium text-ink">{addLabel}</span>
          <span className="block text-[12px] text-muted">{hint ?? `Solte aqui ou escolha · PDF, DOCX, MD ou CSV até ${formatBytes(maxSize)}`}</span>
        </span>
      </button>
      <input
        ref={input}
        type="file"
        hidden
        multiple
        accept={accept}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (files.length) add(files);
        }}
      />
      <span className="sr-only" aria-live="polite">
        {said}
      </span>
    </div>
  );
}

/** App que o agente pede para acessar: escopo em linguagem simples e estado da conexão. */
export type AppAccessItem = {
  id: string;
  name: string;
  color?: string;
  icon?: ReactNode;
  /** O que o agente poderá fazer, em linguagem simples ("Ler conversas e criar rascunhos"). */
  scope: string;
  /** A conta do app já está conectada ao espaço de trabalho. */
  connected: boolean;
  /** Acesso concedido a este agente. */
  granted: boolean;
  /** Sem ele o agente não funciona (o texto avisa). */
  required?: boolean;
  /** Erro ao conectar (aparece na linha). */
  error?: string;
};

/**
 * Conceder acesso app a app: marca, nome, escopo em linguagem simples e, por
 * app, "Conectar" (se a conta ainda não está ligada) ou um `Switch` de acesso.
 * `onConnect` pode devolver uma Promise: o botão mostra "Conectando…".
 */
export function AppAccessList({
  apps,
  onGrantChange,
  onConnect,
  label = "Acesso aos apps",
  className,
}: {
  apps: AppAccessItem[];
  onGrantChange: (id: string, granted: boolean) => void;
  onConnect?: (id: string) => Promise<unknown> | void;
  label?: string;
  className?: string;
}) {
  const [connecting, setConnecting] = useState<string[]>([]);
  const connect = (id: string) => {
    const out = onConnect?.(id);
    if (!out || typeof (out as Promise<unknown>).then !== "function") return;
    setConnecting((c) => [...c, id]);
    (out as Promise<unknown>).catch(() => undefined).finally(() => setConnecting((c) => c.filter((x) => x !== id)));
  };
  return (
    <ul aria-label={label} className={cn("m-0 flex list-none flex-col divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface p-0", className)}>
      {apps.map((a) => {
        const busy = connecting.includes(a.id);
        return (
          <li key={a.id} className="flex min-w-0 items-start gap-3 px-3.5 py-3">
            <ToolGlyph name={a.name} color={a.color} icon={a.icon} size={28} className="mt-0.5 rounded-lg" />
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] font-medium text-ink">
                {a.name}
                <span className="inline-flex items-center gap-1 text-[11.5px] font-normal text-muted">
                  <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", a.connected ? "bg-ok" : "bg-line-strong")} />
                  {a.connected ? "Conectado" : "Não conectado"}
                </span>
              </span>
              <span className="block text-[12.5px] leading-snug text-ink-soft">{a.scope}</span>
              {a.required && <span className="block text-[11.5px] text-muted">Necessário para o agente funcionar</span>}
              {a.error && (
                <span role="alert" className="mt-0.5 block text-[12px] text-rose">
                  {a.error}
                </span>
              )}
            </span>
            {a.connected ? (
              <Switch label={`Permitir acesso a ${a.name}`} hideLabel checked={a.granted} onCheckedChange={(v) => onGrantChange(a.id, v)} className="-my-1.5 shrink-0" />
            ) : (
              <Button size="sm" variant="ghost" disabled={busy || !onConnect} aria-busy={busy || undefined} onClick={() => connect(a.id)} className="shrink-0">
                {busy ? "Conectando…" : a.error ? "Tentar de novo" : "Conectar"}
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
