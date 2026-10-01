import { CalendarDays, Check, ChevronDown, Database, Filter, Kanban, Plus, Redo2, Table2, Tag, Undo2, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  ActivitySection,
  Avatar,
  Checkbox,
  DataGrid,
  FilesList,
  KanbanBoard,
  KanbanColumn,
  NotesTable,
  PriorityIcon,
  PriorityPill,
  PropertyPill,
  PropertyPills,
  RecordCard,
  RecordPanel,
  RecordSection,
  SectionAddButton,
  SegmentedControl,
  StatusPill,
  TableSearch,
  TagPill,
  cn,
  notify,
  priorityLabel,
  taskStatusLabel,
  useTableSearch,
  type GridColumn,
  type Priority,
  type RecordFile,
  type TaskStatus,
} from "@g4ai/ds";
import { AtlasShell, atlasRoutes } from "./shells/atlas-shell";
import { setFrameQuery, useFrameParam } from "./shells/frame-route";
import { cases as initial, categories, categoryColor, notes, personOf, statuses, type QaCase } from "./data/qa-tracker";
import { people } from "./data/workspace";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Rastreador de registros",
  description: "Banco de registros estilo Notion: tabela com etiquetas coloridas, status e prioridade editáveis, desfazer/refazer, Tabela ou Quadro, e painel lateral com propriedades, arquivos, notas e atividade.",
  category: "Aplicação",
  order: 8,
  height: 900,
  concept: {
    goal: "Gerenciar registros estilo Notion (aqui, casos de QA) com propriedades editáveis e um painel de detalhes ao lado.",
    patterns: [
      "Anatomia A · Lista com DataGrid de altura total (rolagem interna, cabeçalho da grade fixo)",
      "Etiquetas coloridas, status e prioridade editáveis; desfazer/refazer",
      "Tabela ou Quadro (mesmos dados)",
      "RecordPanel lateral com ‹ › entre registros (?id=)",
    ],
    adapt: [
      "Backlog de produto, inventário de ativos, controle de contratos",
    ],
    avoid: [
      "Abrir o registro em outra página e perder a lista",
    ],
  },
} as const;

const statusColorVar: Record<TaskStatus, string> = {
  "nao-iniciado": "var(--ds-tag-red-fg)",
  "em-andamento": "var(--ds-tag-yellow-fg)",
  "em-revisao": "var(--ds-tag-blue-fg)",
  concluido: "var(--ds-tag-green-fg)",
  bloqueado: "var(--ds-tag-red-fg)",
  "sem-status": "var(--ds-tag-gray-fg)",
};

export default function RecordTracker() {
  const [rows, setRows] = useState<QaCase[]>(initial);
  const [past, setPast] = useState<QaCase[][]>([]);
  const [future, setFuture] = useState<QaCase[][]>([]);
  const [saved, setSaved] = useState(true);
  const [view, setView] = useState<"tabela" | "quadro">("tabela");
  const [statusFilter, setStatusFilter] = useState<TaskStatus[]>([]);
  const openId = useFrameParam("id");
  const { query, setQuery, rows: searched } = useTableSearch(rows, (r) => [r.code, r.title, r.category, taskStatusLabel[r.status]]);
  const visible = useMemo(() => (statusFilter.length ? searched.filter((r) => statusFilter.includes(r.status)) : searched), [searched, statusFilter]);
  const open = rows.find((r) => r.id === openId) ?? null;
  const idx = open ? visible.findIndex((r) => r.id === open.id) : -1;

  // "Salvo ✓" volta depois de cada alteração (simula o autosave).
  useEffect(() => {
    if (saved) return;
    const t = window.setTimeout(() => setSaved(true), 700);
    return () => clearTimeout(t);
  }, [saved, rows]);

  const commit = (next: QaCase[]) => {
    setPast((p) => [...p.slice(-49), rows]);
    setFuture([]);
    setRows(next);
    setSaved(false);
  };
  const patch = (id: string, p: Partial<QaCase>) => commit(rows.map((r) => (r.id === id ? { ...r, ...p, done: p.status ? p.status === "concluido" : p.done ?? r.done } : r)));
  const undo = () => {
    if (!past.length) return;
    setFuture((f) => [rows, ...f]);
    setRows(past[past.length - 1]);
    setPast((p) => p.slice(0, -1));
    setSaved(false);
  };
  const redo = () => {
    if (!future.length) return;
    setPast((p) => [...p, rows]);
    setRows(future[0]);
    setFuture((f) => f.slice(1));
    setSaved(false);
  };
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.isContentEditable || /^(INPUT|TEXTAREA)$/.test(t.tagName)) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  });

  const openRow = (r: QaCase) => setFrameQuery({ id: r.id });
  const close = () => setFrameQuery({ id: undefined });
  const add = () => {
    const n = 99 + rows.length - initial.length;
    const r: QaCase = { id: `qa${n}`, code: String(n).padStart(3, "0"), title: "Novo caso de teste", description: "", done: false, category: "QA", status: "nao-iniciado", priority: "media", owner: "eduardo", due: "30/10/2026", files: [] };
    commit([r, ...rows]);
    openRow(r);
  };

  const columns: GridColumn<QaCase>[] = [
    {
      key: "title",
      header: "Caso de teste",
      pinned: "left",
      width: 300,
      value: (r) => `${r.code} - ${r.title}`,
      // Sem edição inline: clicar no título abre o registro (o título se edita no painel).
      mobile: "title",
    },
    {
      key: "done",
      header: "Concluído",
      width: 108,
      align: "center",
      value: (r) => (r.done ? "Sim" : "Não"),
      sortable: true,
      cell: (r) => (
        <span onClick={(e) => e.stopPropagation()} className="inline-flex">
          <Checkbox hideLabel label={`Concluir ${r.title}`} checked={r.done} onCheckedChange={(c) => patch(r.id, { status: c ? "concluido" : "em-andamento" })} />
        </span>
      ),
      mobile: "hidden",
    },
    {
      key: "category",
      header: "Categoria",
      width: 160,
      value: (r) => r.category,
      cell: (r) => <TagPill color={categoryColor[r.category]}>{r.category}</TagPill>,
      editable: { type: "select", options: categories.map((c) => ({ value: c, label: c })) },
      mobile: "meta",
    },
    {
      key: "status",
      header: "Status",
      width: 150,
      value: (r) => taskStatusLabel[r.status],
      cell: (r) => <StatusPill status={r.status} />,
      editable: { type: "select", options: statuses.map((s) => ({ value: s, label: taskStatusLabel[s] })) },
      mobile: "meta",
    },
    {
      key: "priority",
      header: "Prioridade",
      width: 130,
      value: (r) => priorityLabel[r.priority],
      cell: (r) => <PriorityPill priority={r.priority} />,
      editable: { type: "select", options: (["urgente", "alta", "media", "baixa"] as Priority[]).map((p) => ({ value: p, label: priorityLabel[p] })) },
      mobile: "meta",
    },
    {
      key: "owner",
      header: "Responsável",
      width: 170,
      value: (r) => personOf(r.owner).name,
      cell: (r) => {
        const p = personOf(r.owner);
        return (
          <span className="inline-flex min-w-0 items-center gap-2">
            <Avatar {...p} size="sm" />
            <span className="truncate">{p.name}</span>
          </span>
        );
      },
      mobile: "subtitle",
    },
    { key: "due", header: "Prazo", width: 110, value: (r) => r.due, mobile: "hidden" },
  ];

  const onEdit = (r: QaCase, key: string, value: unknown) => {
    const v = String(value ?? "");
    if (key === "title") patch(r.id, { title: v.replace(/^\d{3}\s*-\s*/, "") });
    else if (key === "status") patch(r.id, { status: (statuses.find((s) => taskStatusLabel[s] === v || s === v) ?? r.status) as TaskStatus });
    else if (key === "priority") patch(r.id, { priority: ((["urgente", "alta", "media", "baixa"] as Priority[]).find((p) => priorityLabel[p] === v || p === v) ?? r.priority) as Priority });
    else if (key === "category") patch(r.id, { category: v });
  };

  const iconBtn = "grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-soft hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent [&_svg]:h-4 [&_svg]:w-4";
  const toolbar = (
    <div className="flex flex-wrap items-center gap-2">
      <TableSearch value={query} onChange={setQuery} total={rows.length} noun="caso" nounPlural="casos" className="w-full sm:w-64" />
      <PropertyPill
        icon={<Filter />}
        value={statusFilter.length ? `Status: ${statusFilter.map((s) => taskStatusLabel[s]).join(", ")}` : undefined}
        placeholder="Status"
        items={statuses.map((s) => ({
          type: "checkbox" as const,
          label: taskStatusLabel[s],
          checked: statusFilter.includes(s),
          onCheckedChange: (c: boolean) => setStatusFilter((f) => (c ? [...f, s] : f.filter((x) => x !== s))),
        }))}
      />
    </div>
  );

  const board = (
    <KanbanBoard className="min-h-0 flex-1 pb-4">
      {statuses.map((s) => {
        const list = visible.filter((r) => r.status === s);
        return (
          <KanbanColumn
            key={s}
            title={taskStatusLabel[s]}
            count={list.length}
            dotColor={statusColorVar[s]}
            onDrop={(e) => {
              const id = e.dataTransfer.getData("text/plain");
              if (id) patch(id, { status: s });
            }}
          >
            {list.map((r) => (
              <RecordCard
                key={r.id}
                title={r.title}
                subtitle={`#${r.code}`}
                tags={
                  <>
                    <TagPill size="sm" color={categoryColor[r.category]}>
                      {r.category}
                    </TagPill>
                    <span className="inline-flex items-center gap-1 text-[11.5px] text-muted">
                      <PriorityIcon priority={r.priority} /> {priorityLabel[r.priority]}
                    </span>
                  </>
                }
                owner={personOf(r.owner)}
                meta={r.due.slice(0, 5)}
                onOpen={() => openRow(r)}
                onDragStart={(e) => e.dataTransfer.setData("text/plain", r.id)}
                className={cn(open?.id === r.id && "ring-2 ring-primary/40")}
              />
            ))}
          </KanbanColumn>
        );
      })}
    </KanbanBoard>
  );

  const owner = open ? personOf(open.owner) : null;
  const panel = open && owner && (
    <RecordPanel
      open
      title={`${open.code} - ${open.title}`}
      onTitleChange={(v) => patch(open.id, { title: v.replace(/^\d{3}\s*-\s*/, "") })}
      description={open.description}
      onDescriptionChange={(v) => patch(open.id, { description: v })}
      position={idx >= 0 ? `${idx + 1} de ${visible.length}` : undefined}
      onPrev={idx > 0 ? () => openRow(visible[idx - 1]) : undefined}
      onNext={idx >= 0 && idx < visible.length - 1 ? () => openRow(visible[idx + 1]) : undefined}
      onClose={close}
      onDelete={() => {
        const before = rows;
        commit(rows.filter((r) => r.id !== open.id));
        close();
        notify(`Caso ${open.code} excluído`, () => setRows(before));
      }}
      properties={
        <PropertyPills>
          <PropertyPill
            value={<TagPill size="sm" color={categoryColor[open.category]} className="-mx-1">{open.category}</TagPill>}
            placeholder="Categoria"
            items={categories.map((c) => ({ label: c, onSelect: () => patch(open.id, { category: c }) }))}
          />
          <PropertyPill value={<StatusPill size="sm" status={open.status} className="-mx-1" />} placeholder="Status" items={statuses.map((s) => ({ label: taskStatusLabel[s], onSelect: () => patch(open.id, { status: s }) }))} />
          <PropertyPill
            icon={<PriorityIcon priority={open.priority} />}
            value={priorityLabel[open.priority]}
            placeholder="Prioridade"
            items={(["urgente", "alta", "media", "baixa"] as Priority[]).map((p) => ({ label: priorityLabel[p], icon: <PriorityIcon priority={p} />, onSelect: () => patch(open.id, { priority: p }) }))}
          />
          <PropertyPill
            icon={<Avatar {...owner} size="sm" />}
            value={owner.name.split(" ")[0]}
            placeholder="Responsável"
            className="pl-1"
            items={people.filter((p) => p.status === "ativo").map((p) => ({ label: p.name, onSelect: () => patch(open.id, { owner: p.id }) }))}
          />
          <PropertyPill icon={<Tag className="text-muted" />} placeholder="Rótulos" onClick={() => notify("Exemplo: abriria o seletor de rótulos", undefined, "info")} />
          <PropertyPill icon={<CalendarDays className="text-muted" />} value={open.due} placeholder="Prazo" onClick={() => notify("Exemplo: abriria o DatePicker", undefined, "info")} />
          <PropertyPill icon={<Users className="text-muted" />} value="Compartilhado" placeholder="Compartilhar" onClick={() => notify("Visível para o time de Produto", undefined, "info")} />
        </PropertyPills>
      }
    >
      <RecordSection
        title="Arquivos"
        action={
          <SectionAddButton
            onClick={() => {
              const f: RecordFile = { id: `f${Date.now()}`, name: `evidencia-${open.code}-${open.files.length + 1}.png`, kind: "image", meta: "agora" };
              patch(open.id, { files: [...open.files, f] });
              notify("Arquivo anexado");
            }}
          />
        }
      >
        <FilesList
          files={open.files}
          empty="Nenhum arquivo. Anexe vídeo ou print da evidência."
          rowMenu={(f) => [
            { label: "Abrir", onSelect: () => notify(`Abrindo ${f.name}`, undefined, "info") },
            { label: "Remover", tone: "danger", onSelect: () => patch(open.id, { files: open.files.filter((x) => x.id !== f.id) }) },
          ]}
        />
      </RecordSection>
      <RecordSection title="Notas do documento" action={<button type="button" onClick={() => notify("Exemplo: abriria o documento completo", undefined, "info")}>Ver tudo</button>}>
        <NotesTable columns={notes.columns} rows={notes.rows} />
      </RecordSection>
      <ActivitySection
        action={
          <button type="button" onClick={() => notify("Filtro: só comentários", undefined, "info")}>
            <Filter className="h-3.5 w-3.5" /> Filtro
          </button>
        }
        items={[
          { id: "a1", actor: owner, action: "mudou o status para", target: taskStatusLabel[open.status], time: "há 2 h" },
          { id: "a2", actor: personOf("carla"), action: "comentou", time: "ontem, 17:20", quote: "Reproduzi no Safari também. Anexei o vídeo." },
          { id: "a3", actor: personOf("joana"), action: "criou o caso", time: "28/09" },
        ]}
      />
    </RecordPanel>
  );

  return (
    <AtlasShell current={atlasRoutes.tracker}>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-page">
        <header className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-line px-4 py-2.5 sm:px-6">
          <nav aria-label="Trilha" className="flex min-w-0 items-center gap-1.5 text-[13px]">
            <span className="hidden text-muted sm:inline">Produto /</span>
            <Database className="h-4 w-4 shrink-0 text-muted" aria-hidden />
            <span className="truncate font-medium">Rastreador de QA do produto</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <span className={cn("mr-1 hidden items-center gap-1 text-[12px] sm:inline-flex", saved ? "text-muted" : "text-ink-soft")} aria-live="polite">
              {saved ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Salvo
                </>
              ) : (
                "Salvando…"
              )}
            </span>
            <button type="button" onClick={undo} disabled={!past.length} aria-label="Desfazer" title="Desfazer (⌘Z)" className={iconBtn}>
              <Undo2 />
            </button>
            <button type="button" onClick={redo} disabled={!future.length} aria-label="Refazer" title="Refazer (⇧⌘Z)" className={iconBtn}>
              <Redo2 />
            </button>
            <span aria-hidden className="mx-1 h-5 w-px bg-line" />
            <SegmentedControl
              label="Visualização"
              value={view}
              onChange={setView}
              options={[
                { value: "tabela", label: "Tabela", icon: <Table2 className="h-3.5 w-3.5" /> },
                { value: "quadro", label: "Quadro", icon: <Kanban className="h-3.5 w-3.5" /> },
              ]}
            />
            <button type="button" onClick={add} className="ui-button ui-button-primary ml-1 inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-[12.5px] font-medium text-on-primary hover:bg-primary/90">
              <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Novo caso</span>
            </button>
          </div>
        </header>
        <div className="flex min-h-0 flex-1 gap-4 p-3 sm:p-5">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
            {view === "tabela" ? (
              <DataGrid
                label="Casos de teste"
                rows={visible}
                columns={columns}
                rowKey={(r) => r.id}
                rowLabel={(r) => `${r.code} ${r.title}`}
                height="100%"
                toolbar={toolbar}
                query={query}
                storageKey="app-record-tracker"
                exportFileName="casos-de-teste"
                onRowOpen={openRow}
                onEdit={onEdit}
                noun="caso"
                nounPlural="casos"
                selectable
                bulkActions={(sel, { clear }) => (
                  <button
                    type="button"
                    onClick={() => {
                      const ids = new Set(sel.map((r) => r.id));
                      commit(rows.map((r) => (ids.has(r.id) ? { ...r, status: "concluido", done: true } : r)));
                      clear();
                      notify(`${sel.length} casos concluídos`);
                    }}
                  >
                    <Check /> Concluir
                  </button>
                )}
                mobile="cards"
                className="min-h-0 flex-1"
              />
            ) : (
              <>
                {toolbar}
                {board}
              </>
            )}
          </div>
          {/* Desktop: coluna ao lado da lista. Celular: o próprio RecordPanel abre como folha. */}
          {panel}
        </div>
      </div>
    </AtlasShell>
  );
}
