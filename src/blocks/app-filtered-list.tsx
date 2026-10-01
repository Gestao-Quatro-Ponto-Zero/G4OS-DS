import { AlarmClock, CheckCircle2, Headphones, Mail, MessageCircle, Phone, Plus, Send } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  DataTable,
  DateRangeFilter,
  Drawer,
  FieldBlock,
  FieldGrid,
  Modal,
  PropertyList,
  Select,
  TextField,
  TextareaField,
  Timeline,
  notify,
  EmptyFilterResult,
  FilterBar,
  Highlight,
  Page,
  PageHeading,
  Pagination,
  SavedViews,
  SortHeader,
  TableSearch,
  resolveDateRange,
  useFilters,
  usePagination,
  useSavedViews,
  useSort,
  type Column,
  type DateRange,
  type FilterField,
  type SavedView,
  type Tone,
} from "@g4os/ds";
import { me as workspaceMe, people } from "./data/workspace";
import { AtlasShell, atlasRoutes } from "./shells/atlas-shell";
import { setFrameQuery, useFrameQuery } from "./shells/frame-route";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Lista com filtros (desktop e celular)",
  description: "Central de atendimento: período no topo, visões salvas, busca local, atalhos de faceta, filtros por SLA/canal/data. No celular os filtros vão para uma folha com “Aplicar (N)”.",
  category: "Aplicação",
  order: 4,
  height: 860,
} as const;

/* ------------------------------------------------------------------ */
/* Dados de exemplo                                                    */
/* ------------------------------------------------------------------ */

type Status = "novo" | "aberto" | "aguardando" | "resolvido";
type Priority = "baixa" | "media" | "alta" | "urgente";
type Ticket = { id: string; code: string; subject: string; customer: string; status: Status; priority: Priority; channel: "E-mail" | "WhatsApp" | "Telefone" | "Chat"; agent: string | null; created: string; slaHours: number };

const today = new Date(2026, 8, 30);
const me = workspaceMe.id;
// Atendentes = pessoas do workspace com acesso ao suporte.
const agents = ["joana", "eduardo", "carla", "diego"].map((id) => ({ value: id, label: people.find((p) => p.id === id)!.name }));
const statusInfo: Record<Status, { label: string; tone: Tone }> = {
  novo: { label: "Novo", tone: "info" },
  aberto: { label: "Aberto", tone: "neutral" },
  aguardando: { label: "Aguardando cliente", tone: "accent" },
  resolvido: { label: "Resolvido", tone: "ok" },
};
const priorityInfo: Record<Priority, { label: string; tone: Tone }> = {
  baixa: { label: "Baixa", tone: "neutral" },
  media: { label: "Média", tone: "neutral" },
  alta: { label: "Alta", tone: "warn" },
  urgente: { label: "Urgente", tone: "bad" },
};
const subjects = [
  "Nota fiscal não chegou no e-mail",
  "Erro ao importar planilha de produtos",
  "Troca de titular do contrato",
  "Boleto com valor divergente",
  "Não consigo redefinir a senha",
  "Integração com o ERP parou",
  "Pedido de cancelamento",
  "Dúvida sobre o plano Enterprise",
  "Relatório de vendas em branco",
  "Usuário bloqueado após 3 tentativas",
  "Atualizar dados cadastrais (CNPJ)",
  "Lentidão no painel desde ontem",
];
const customers = ["Metalúrgica Santa Clara", "Vértice Logística", "Clínica Bem Viver", "Construtora Pilar", "Agro Cerrado", "Farmácias Vida Plena", "Café Serra Alta"];
const channels: Ticket["channel"][] = ["E-mail", "WhatsApp", "Telefone", "Chat"];
const statuses: Status[] = ["novo", "aberto", "aberto", "aguardando", "resolvido", "aberto", "novo"];
const priorities: Priority[] = ["media", "alta", "baixa", "urgente", "media", "baixa", "alta"];

const seedTickets: Ticket[] = Array.from({ length: 46 }, (_, i) => {
  const d = new Date(2026, 8, 30 - Math.floor(i * 1.3));
  return {
    id: String(i + 1),
    code: `#${String(8_412 - i)}`,
    subject: subjects[i % subjects.length],
    customer: customers[(i * 3) % customers.length],
    status: statuses[i % statuses.length],
    priority: priorities[(i * 5) % priorities.length],
    channel: channels[(i * 7) % channels.length],
    agent: i % 9 === 4 ? null : agents[(i * 3) % agents.length].value,
    created: d.toISOString().slice(0, 10),
    slaHours: ((i * 13) % 50) - 6,
  };
});
const channelIcon = { "E-mail": Mail, WhatsApp: MessageCircle, Telefone: Phone, Chat: Headphones };

const fields: FilterField<Ticket>[] = [
  { key: "status", label: "Situação", type: "enum", quick: true, accessor: (t) => t.status, options: (Object.keys(statusInfo) as Status[]).map((s) => ({ value: s, label: statusInfo[s].label })) },
  { key: "priority", label: "Prioridade", type: "enum", quick: true, accessor: (t) => t.priority, options: (Object.keys(priorityInfo) as Priority[]).map((p) => ({ value: p, label: priorityInfo[p].label })) },
  { key: "agent", label: "Atendente", type: "person", quick: true, accessor: (t) => t.agent, options: agents },
  { key: "channel", label: "Canal", type: "enum", accessor: (t) => t.channel, options: channels.map((c) => ({ value: c, label: c })) },
  { key: "slaHours", label: "SLA restante", type: "number", unit: "h", accessor: (t) => t.slaHours },
  { key: "created", label: "Aberto em", type: "date", accessor: (t) => t.created },
  { key: "customer", label: "Cliente", type: "text", accessor: (t) => t.customer },
];
const views: SavedView[] = [
  { id: "abertos", label: "Em aberto", system: true, state: { query: "", conditions: [{ id: "a", field: "status", op: "is_not", value: ["resolvido"] }] } },
  { id: "meus", label: "Meus", system: true, state: { query: "", conditions: [{ id: "m", field: "agent", op: "me" }, { id: "m2", field: "status", op: "is_not", value: ["resolvido"] }] } },
  { id: "sla", label: "SLA estourando", system: true, state: { query: "", conditions: [{ id: "s", field: "slaHours", op: "lt", value: 4 }, { id: "s2", field: "status", op: "is_not", value: ["resolvido"] }] } },
  { id: "sem-dono", label: "Sem atendente", system: true, state: { query: "", conditions: [{ id: "n", field: "agent", op: "empty" }] } },
  { id: "todos", label: "Todos", system: true, state: { query: "", conditions: [] } },
];

/* ------------------------------------------------------------------ */


export default function AppFilteredList() {
  // Período é o recorte da TELA (topo à direita); busca e filtros atuam dentro dele.
  const [range, setRange] = useState<DateRange>(resolveDateRange("last30", today));
  const [tickets, setTickets] = useState(seedTickets);
  const query = useFrameQuery();
  const open = tickets.find((t) => t.id === query.get("id")) ?? null;
  const creating = query.get("novo") === "1";
  const [draft, setDraft] = useState({ subject: "", customer: customers[0], channel: channels[0], priority: "media" as Priority });
  const [reply, setReply] = useState("");
  const update = (id: string, patch: Partial<Ticket>) => setTickets((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const inRange = useMemo(() => tickets.filter((t) => (!range.from || t.created >= range.from) && (!range.to || t.created <= range.to)), [range, tickets]);
  const filters = useFilters(inRange, { fields, search: (t) => [t.code, t.subject, t.customer], me, now: today, url: true, initial: views[0].state });
  const saved = useSavedViews(filters, views, "atendimento-visoes");
  const q = filters.state.query;
  const sort = useSort(filters.rows, { sla: (t) => t.slaHours, criado: (t) => t.created }, { key: "sla", dir: "asc" });
  const pages = usePagination(sort.rows, 12);

  const columns: Column<Ticket>[] = [
    {
      key: "subject",
      header: "Chamado",
      primary: true,
      cell: (t) => {
        const Icon = channelIcon[t.channel];
        return (
          <span className="flex items-start gap-2.5">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-label={t.channel} />
            <span className="min-w-0">
              <Highlight text={t.subject} query={q} className="block truncate" />
              <span className="block truncate text-[12px] font-normal text-muted">
                <Highlight text={t.code} query={q} /> · <Highlight text={t.customer} query={q} />
              </span>
            </span>
          </span>
        );
      },
    },
    { key: "status", header: "Situação", cell: (t) => <Badge tone={statusInfo[t.status].tone}>{statusInfo[t.status].label}</Badge> },
    { key: "priority", header: "Prioridade", nowrap: true, cell: (t) => <span className={priorityInfo[t.priority].tone === "bad" ? "font-medium text-rose" : priorityInfo[t.priority].tone === "warn" ? "text-amber" : "text-ink-soft"}>{priorityInfo[t.priority].label}</span> },
    {
      key: "agent",
      header: "Atendente",
      nowrap: true,
      cell: (t) => {
        const a = agents.find((x) => x.value === t.agent);
        return a ? (
          <span className="inline-flex items-center gap-2">
            <Avatar initials={a.label.split(" ").map((w) => w[0]).join("")} name={a.label} size="sm" />
            <span className="text-ink-soft">{a.label.split(" ")[0]}{t.agent === me && <span className="text-muted"> (eu)</span>}</span>
          </span>
        ) : (
          <span className="text-muted">Sem atendente</span>
        );
      },
    },
    {
      key: "sla",
      header: <SortHeader label="SLA" align="right" {...sort.header("sla")} />,
      align: "right",
      nowrap: true,
      cell: (t) =>
        t.status === "resolvido" ? (
          <span className="text-muted">—</span>
        ) : (
          <span className={t.slaHours < 0 ? "inline-flex items-center gap-1 font-medium text-rose" : t.slaHours < 4 ? "font-medium text-amber" : "tabular-nums text-ink-soft"}>
            {t.slaHours < 0 && <AlarmClock className="h-3.5 w-3.5" />}
            {t.slaHours < 0 ? `vencido há ${-t.slaHours}h` : `${t.slaHours}h`}
          </span>
        ),
    },
    { key: "created", header: <SortHeader label="Aberto em" {...sort.header("criado")} />, nowrap: true, mobileHidden: true, cell: (t) => <span className="tabular-nums text-muted">{t.created.split("-").reverse().slice(0, 2).join("/")}</span> },
  ];

  return (
    <AtlasShell current={atlasRoutes.tickets}>
      <Page>
        <PageHeading
          title="Chamados"
          description="Ordenados pelo SLA mais apertado. Vencidos primeiro."
          actions={
            <>
              <DateRangeFilter value={range} onChange={setRange} now={today} />
              <Button onClick={() => setFrameQuery({ novo: "1" })}>
                <Plus /> Novo chamado
              </Button>
            </>
          }
        />
        <div className="mt-4 space-y-4">
          <SavedViews views={saved} counts={Object.fromEntries(views.map((v) => [v.id, filters.countFor(v.state)]))} />
          <FilterBar
            filters={filters}
            noun="chamado"
            search={<TableSearch value={q} onChange={filters.setQuery} total={inRange.length} noun="chamado" searchIn="assunto, número e cliente" />}
          />
          <DataTable rows={pages.rows} columns={columns} rowKey={(t) => t.id} onRowClick={(t) => setFrameQuery({ id: t.id })} rowLabel={(t) => `Abrir chamado ${t.code}`} empty={<EmptyFilterResult filters={filters} noun="chamado" />} />
          <Pagination page={pages.page} pageCount={pages.pageCount} onPage={pages.setPage} total={pages.total} pageSize={pages.pageSize} />
        </div>
      </Page>

      <Drawer
        open={!!open}
        onClose={() => { setFrameQuery({ id: undefined }); setReply(""); }}
        kicker={open ? `${open.code} · ${open.channel}` : undefined}
        title={open?.subject ?? ""}
        footer={
          open && (
            <>
              <Button variant="ghost" onClick={() => { update(open.id, { agent: me }); notify(`Chamado ${open.code} atribuído a você`); }} disabled={open.agent === me}>
                Assumir
              </Button>
              <Button onClick={() => { update(open.id, { status: "resolvido" }); notify(`Chamado ${open.code} resolvido`, () => update(open.id, { status: open.status })); setFrameQuery({ id: undefined }); }} disabled={open.status === "resolvido"}>
                <CheckCircle2 /> Resolver
              </Button>
            </>
          )
        }
      >
        {open && (
          <div className="space-y-6">
            <PropertyList
              items={[
                { label: "Cliente", value: open.customer },
                { label: "Situação", value: <Badge tone={statusInfo[open.status].tone}>{statusInfo[open.status].label}</Badge> },
                { label: "Prioridade", value: priorityInfo[open.priority].label },
                { label: "Atendente", value: agents.find((a) => a.value === open.agent)?.label },
                { label: "SLA", value: open.status === "resolvido" ? "Cumprido" : open.slaHours < 0 ? <span className="font-medium text-rose">vencido há {-open.slaHours}h</span> : `${open.slaHours}h restantes` },
              ]}
            />
            <Timeline
              items={[
                { id: "c", title: `${open.customer} abriu o chamado`, meta: open.created.split("-").reverse().join("/"), body: `“${open.subject}. Podem verificar, por favor?”` },
                ...(open.agent ? [{ id: "a", title: `Atribuído a ${agents.find((a) => a.value === open.agent)?.label}`, meta: "automático" }] : []),
                ...(open.status === "resolvido" ? [{ id: "r", title: "Resolvido", meta: "hoje", tone: "ok" as const }] : []),
              ]}
            />
            {open.status !== "resolvido" && (
              <div>
                <TextareaField label="Responder ao cliente" value={reply} onChange={setReply} minRows={3} placeholder={`Olá, equipe ${open.customer}…`} />
                <Button size="sm" disabled={!reply.trim()} onClick={() => { update(open.id, { status: "aguardando" }); setReply(""); notify(`Resposta enviada por ${open.channel}`); }}>
                  <Send /> Enviar resposta
                </Button>
              </div>
            )}
          </div>
        )}
      </Drawer>

      <Modal
        open={creating}
        onClose={() => setFrameQuery({ novo: undefined })}
        title="Novo chamado"
        description="Registre um atendimento que chegou por telefone ou presencialmente."
        footer={
          <>
            <Button variant="ghost" onClick={() => setFrameQuery({ novo: undefined })}>
              Cancelar
            </Button>
            <Button
              disabled={!draft.subject.trim()}
              onClick={() => {
                const id = String(Date.now());
                const code = `#${8413 + tickets.length - seedTickets.length}`;
                setTickets((ts) => [{ id, code, subject: draft.subject.trim(), customer: draft.customer, status: "novo", priority: draft.priority, channel: draft.channel, agent: me, created: today.toISOString().slice(0, 10), slaHours: 24 }, ...ts]);
                setDraft((d) => ({ ...d, subject: "" }));
                notify(`Chamado ${code} criado`);
                setFrameQuery({ novo: undefined, id });
              }}
            >
              Criar chamado
            </Button>
          </>
        }
      >
        <TextField label="Assunto" value={draft.subject} onChange={(v) => setDraft((d) => ({ ...d, subject: v }))} placeholder="Ex.: Boleto com valor divergente" autoFocus />
        <FieldGrid>
          <FieldBlock label="Cliente">
            <Select label="Cliente" value={draft.customer} onValueChange={(v) => setDraft((d) => ({ ...d, customer: v }))} options={customers.map((c) => ({ value: c, label: c }))} />
          </FieldBlock>
          <FieldBlock label="Canal">
            <Select label="Canal" value={draft.channel} onValueChange={(v) => setDraft((d) => ({ ...d, channel: v as Ticket["channel"] }))} options={channels.map((c) => ({ value: c, label: c }))} />
          </FieldBlock>
        </FieldGrid>
        <FieldBlock label="Prioridade">
          <Select label="Prioridade" value={draft.priority} onValueChange={(v) => setDraft((d) => ({ ...d, priority: v as Priority }))} options={(Object.keys(priorityInfo) as Priority[]).map((p) => ({ value: p, label: priorityInfo[p].label }))} />
        </FieldBlock>
      </Modal>
    </AtlasShell>
  );
}
