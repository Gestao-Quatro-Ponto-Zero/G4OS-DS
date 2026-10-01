"use client";

import { ChevronLeft, ChevronRight, Ellipsis, FileText, FolderGit2, Image as ImageIcon, Link2, Plus, Sheet as SheetIcon, Trash2, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { ActivityFeed, type ActivityItem } from "./dashboard";
import { Menu, Sheet, Tooltip, type MenuEntry } from "./overlays-extra";

/*
 * Painel lateral de registro (estilo banco de dados): abre ao clicar numa
 * linha da tabela sem tirar a pessoa da lista. ‹ › navega entre registros,
 * título editável no lugar, propriedades em pílulas, arquivos, notas e
 * atividade. Abaixo de 768px vira folha (Sheet).
 */

/** Pílula de propriedade (botão com menu). Sem valor = rótulo muted + ícone. */
export function PropertyPill({
  icon,
  value,
  placeholder,
  items,
  onClick,
  className,
}: {
  icon?: ReactNode;
  value?: ReactNode;
  placeholder: string;
  items?: MenuEntry[];
  onClick?: () => void;
  className?: string;
}) {
  const body = (
    <>
      {icon}
      {/* Texto trunca; elemento (TagPill, StatusPill) fica inteiro. */}
      <span className={cn(typeof value === "string" || value == null ? "truncate" : "inline-flex shrink-0", !value && "text-muted")}>{value ?? placeholder}</span>
    </>
  );
  const cls = cn("inline-flex h-8 max-w-full items-center gap-1.5 rounded-lg bg-surface px-2.5 text-[12.5px] ring-1 ring-line hover:bg-soft [&_svg]:h-3.5 [&_svg]:w-3.5 [&_svg]:shrink-0", className);
  if (items)
    return <Menu label={placeholder} triggerClassName={cn(cls, "!h-8 !rounded-lg !bg-surface !px-2.5 !text-[12.5px] !font-normal !ring-1 !ring-line gap-1.5")} trigger={body} items={items} />;
  return (
    <button type="button" onClick={onClick} className={cls}>
      {body}
    </button>
  );
}

/** Linha de pílulas de propriedades (quebra em várias linhas). */
export function PropertyPills({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap gap-1.5", className)}>{children}</div>;
}

/** Seção do painel: título, ação à direita ("+ Adicionar", "Ver tudo", "Filtro"). */
export function RecordSection({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("border-t border-line pt-5", className)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="m-0 text-[15px] font-medium">{title}</h3>
        {action && <div className="shrink-0 text-[12.5px] [&_button]:inline-flex [&_button]:items-center [&_button]:gap-1 [&_button]:font-medium [&_button]:text-blue [&_button:hover]:underline">{action}</div>}
      </div>
      {children}
    </section>
  );
}

export type RecordFileKind = "pdf" | "github" | "doc" | "sheet" | "image" | "link";
export type RecordFile = { id: string; name: string; kind: RecordFileKind; meta?: string; href?: string };
const kindInfo: Record<RecordFileKind, { label: string; icon: ReactNode }> = {
  pdf: { label: "PDF", icon: <FileText /> },
  github: { label: "GitHub", icon: <FolderGit2 /> },
  doc: { label: "Doc", icon: <FileText /> },
  sheet: { label: "Planilha", icon: <SheetIcon /> },
  image: { label: "Imagem", icon: <ImageIcon /> },
  link: { label: "Link", icon: <Link2 /> },
};

/** Arquivo anexado: selo do tipo (ícone + rótulo), nome, ⋯. */
export function FileRow({ file, menu }: { file: RecordFile; menu?: MenuEntry[] }) {
  const k = kindInfo[file.kind];
  const name = (
    <span className="min-w-0 flex-1 truncate text-[13px]">
      {file.name}
      {file.meta && <span className="ml-2 text-[11.5px] text-muted">{file.meta}</span>}
    </span>
  );
  return (
    <li className="group flex min-h-12 items-center gap-3 rounded-xl bg-soft/60 px-2 py-2 ring-1 ring-inset ring-line">
      <span className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-surface px-2 text-[12px] font-medium ring-1 ring-line [&_svg]:h-3.5 [&_svg]:w-3.5">
        {k.icon}
        {k.label}
      </span>
      {file.href ? (
        <a href={file.href} className="min-w-0 flex-1 truncate text-[13px] hover:underline">
          {file.name}
        </a>
      ) : (
        name
      )}
      {menu && (
        <Menu label={`Ações de ${file.name}`} align="end" triggerClassName="!h-7 !w-7 justify-center !px-0 !bg-transparent !ring-0 text-muted hover:!bg-surface" trigger={<Ellipsis />} items={menu} />
      )}
    </li>
  );
}

export function FilesList({ files, rowMenu, empty = "Nenhum arquivo ainda." }: { files: RecordFile[]; rowMenu?: (f: RecordFile) => MenuEntry[]; empty?: string }) {
  if (!files.length) return <p className="m-0 rounded-xl border border-dashed border-line px-4 py-3 text-[12.5px] text-muted">{empty}</p>;
  return (
    <ul className="list-none space-y-2 p-0">
      {files.map((f) => (
        <FileRow key={f.id} file={f} menu={rowMenu?.(f)} />
      ))}
    </ul>
  );
}

/** Tabela pequena embutida (notas, critérios). Corta em `maxRows` com degradê. */
export function NotesTable({ columns, rows, maxRows = 3, className }: { columns: string[]; rows: ReactNode[][]; maxRows?: number; className?: string }) {
  const cut = rows.length > maxRows;
  return (
    <div className={cn("relative overflow-hidden rounded-xl border border-line", className)}>
      <table className="w-full border-collapse text-left text-[12.5px]">
        <thead className="bg-soft/60 text-muted">
          <tr>
            {columns.map((c) => (
              <th key={c} scope="col" className="border-b border-line px-3 py-2 font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.slice(0, maxRows + (cut ? 1 : 0)).map((r, i) => (
            <tr key={i} className={cn(cut && i === maxRows && "opacity-40")}>
              {r.map((cell, j) => (
                <td key={j} className="px-3 py-2 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {cut && <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-surface to-transparent" />}
    </div>
  );
}

/** Atividade do registro (usa ActivityFeed). */
export function ActivitySection({ items, action }: { items: ActivityItem[]; action?: ReactNode }) {
  return (
    <RecordSection title="Atividade" action={action}>
      <ActivityFeed items={items} />
    </RecordSection>
  );
}

function useNarrow(query = "(max-width: 767.98px)") {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setNarrow(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return narrow;
}

/**
 * Painel do registro. Desktop: coluna à direita da lista (coloque-o ao lado
 * do DataGrid). Celular: abre como folha. `position` = "3 de 18".
 */
export function RecordPanel({
  open,
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  position,
  onPrev,
  onNext,
  onDelete,
  onClose,
  properties,
  children,
  width = 460,
  className,
}: {
  open: boolean;
  title: string;
  onTitleChange?: (v: string) => void;
  description?: string;
  onDescriptionChange?: (v: string) => void;
  position?: string;
  onPrev?: () => void;
  onNext?: () => void;
  onDelete?: () => void;
  onClose: () => void;
  /** Pílulas de propriedade (PropertyPills). */
  properties?: ReactNode;
  children?: ReactNode;
  width?: number;
  className?: string;
}) {
  const narrow = useNarrow();
  useEffect(() => {
    if (!open || narrow) return;
    const on = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowUp" && e.altKey) onPrev?.();
      if (e.key === "ArrowDown" && e.altKey) onNext?.();
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [open, narrow, onClose, onPrev, onNext]);
  if (!open) return null;

  const icon = "grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-soft hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent [&_svg]:h-4 [&_svg]:w-4";
  const body = (
    <>
      <div className="min-w-0">
        {onTitleChange ? (
          <textarea
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            rows={1}
            aria-label="Título do registro"
            className="ds-bare block w-full min-w-0 resize-none bg-transparent text-[22px] font-semibold leading-tight tracking-[-0.02em] text-ink outline-none [field-sizing:content]"
          />
        ) : (
          <h2 className="m-0 text-[22px] font-semibold leading-tight tracking-[-0.02em]">{title}</h2>
        )}
        {onDescriptionChange ? (
          <textarea
            value={description ?? ""}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={2}
            placeholder="Adicione uma descrição…"
            aria-label="Descrição"
            className="ds-bare mt-2 block w-full resize-none bg-transparent text-[14px] leading-relaxed text-muted outline-none [field-sizing:content] placeholder:text-muted/70"
          />
        ) : (
          description && <p className="m-0 mt-2 text-[14px] leading-relaxed text-muted">{description}</p>
        )}
      </div>
      {properties && <div className="mt-5 pb-5">{properties}</div>}
      <div className="space-y-6">{children}</div>
    </>
  );

  if (narrow)
    return (
      <Sheet open={open} onClose={onClose} title={position ? `Registro · ${position}` : "Registro"} side="bottom">
        {body}
      </Sheet>
    );

  return (
    <aside aria-label={`Registro: ${title}`} className={cn("enter flex min-h-0 shrink-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-raised", className)} style={{ width }}>
      <header className="flex items-center gap-1 px-3 pt-3">
        <Tooltip content="Registro anterior" shortcut={["⌥", "↑"]}>
          <button type="button" onClick={onPrev} disabled={!onPrev} aria-label="Registro anterior" className={icon}>
            <ChevronLeft />
          </button>
        </Tooltip>
        <Tooltip content="Próximo registro" shortcut={["⌥", "↓"]}>
          <button type="button" onClick={onNext} disabled={!onNext} aria-label="Próximo registro" className={icon}>
            <ChevronRight />
          </button>
        </Tooltip>
        {position && <span className="ml-1 text-[12px] tabular-nums text-muted">{position}</span>}
        <span className="flex-1" />
        {onDelete && (
          <Tooltip content="Excluir">
            <button type="button" onClick={onDelete} aria-label="Excluir registro" className={icon}>
              <Trash2 />
            </button>
          </Tooltip>
        )}
        <Tooltip content="Fechar" shortcut={["esc"]}>
          <button type="button" onClick={onClose} aria-label="Fechar painel" className={icon}>
            <X />
          </button>
        </Tooltip>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-8 pt-3">{body}</div>
    </aside>
  );
}

/** "+ Adicionar" no padrão das seções do painel. */
export function SectionAddButton({ onClick, children = "Adicionar" }: { onClick?: () => void; children?: ReactNode }) {
  return (
    <button type="button" onClick={onClick}>
      <Plus className="h-3.5 w-3.5" /> {children}
    </button>
  );
}
