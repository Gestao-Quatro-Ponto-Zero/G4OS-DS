import { Download, History } from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  DataTable,
  Drawer,
  EmptyFilterResult,
  FilterBar,
  Highlight,
  Pagination,
  PropertyList,
  TableSearch,
  notify,
  useFilters,
  usePagination,
  type Column,
  type FilterField, PageToolbar
} from "@g4ai/ds";
import { me, people } from "./data/workspace";
import { setFrameQuery, useFrameQuery } from "./shells/frame-route";
import { SettingsShell } from "./shells/settings-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Log de auditoria",
  description: "Quem fez o quê e quando: busca, filtros por pessoa, área e risco, período, exportação e detalhe do evento (antes/depois, IP) em drawer por ?id=.",
  category: "Configurações",
  order: 8,
  height: 900,
  concept: {
    goal: "Responder quem fez o quê e quando, para segurança e compliance.",
    patterns: [
      "Anatomia D · Configurações: título 'Configurações' fixo e subnavegação colada abaixo (SettingsLayout)",
      "PageToolbar com busca e filtros por pessoa, área e risco",
      "Detalhe do evento (antes/depois, IP) em gaveta por ?id=",
      "Exportação do recorte",
    ],
    adapt: [
      "Histórico de alterações de pedidos, de contratos",
    ],
    avoid: [
      "Log sem o antes/depois",
    ],
  },
} as const;

/* ------------------------------------------------------------------ */
/* Dados de exemplo                                                    */
/* ------------------------------------------------------------------ */

type Area = "Acesso" | "Equipe" | "Cobrança" | "Integrações" | "Dados";
type Event = { id: string; who: string; action: string; target: string; area: Area; risk: "baixo" | "médio" | "alto"; at: string; ip: string; before?: string; after?: string };

const today = new Date(2026, 8, 30, 12);
const at = (daysAgo: number, h: number, m: number) => new Date(2026, 8, 30 - daysAgo, h, m).toISOString();

const events: Event[] = [
  { id: "e1", who: "joana", action: "alterou o papel de", target: "Diego Araújo", area: "Equipe", risk: "alto", at: at(0, 10, 42), ip: "177.92.14.8", before: "Membro", after: "Administrador" },
  { id: "e2", who: "rafael", action: "entrou pelo", target: "Chrome · macOS", area: "Acesso", risk: "baixo", at: at(0, 9, 3), ip: "189.40.2.110" },
  { id: "e3", who: "elisa", action: "trocou o cartão de", target: "Plano Pro", area: "Cobrança", risk: "médio", at: at(0, 8, 15), ip: "200.155.7.21", before: "Visa •••• 1190", after: "Visa •••• 4821" },
  { id: "e4", who: "joana", action: "conectou", target: "Claude (Anthropic)", area: "Integrações", risk: "médio", at: at(1, 17, 50), ip: "177.92.14.8" },
  { id: "e5", who: "diego", action: "criou a chave de API", target: "Painel do BI", area: "Integrações", risk: "alto", at: at(1, 15, 12), ip: "187.11.90.3" },
  { id: "e6", who: "carla", action: "exportou", target: "1.240 contatos (CSV)", area: "Dados", risk: "alto", at: at(2, 11, 30), ip: "179.34.8.77" },
  { id: "e7", who: "rafael", action: "falhou ao entrar", target: "3 tentativas", area: "Acesso", risk: "médio", at: at(2, 7, 58), ip: "45.160.12.9" },
  { id: "e8", who: "joana", action: "convidou", target: "beatriz@acme.com.br", area: "Equipe", risk: "baixo", at: at(3, 14, 20), ip: "177.92.14.8" },
  { id: "e9", who: "elisa", action: "baixou a fatura", target: "FAT-2026-09", area: "Cobrança", risk: "baixo", at: at(4, 9, 41), ip: "200.155.7.21" },
  { id: "e10", who: "marina", action: "visualizou", target: "Relatório de comissões", area: "Dados", risk: "baixo", at: at(5, 16, 5), ip: "191.8.44.2" },
  { id: "e11", who: "joana", action: "ativou a verificação em duas etapas de", target: "Joana Ribeiro", area: "Acesso", risk: "baixo", at: at(6, 10, 0), ip: "177.92.14.8" },
  { id: "e12", who: "rafael", action: "removeu", target: "carlos@acme.com.br", area: "Equipe", risk: "médio", at: at(8, 18, 22), ip: "189.40.2.110" },
  { id: "e13", who: "diego", action: "desconectou", target: "Microsoft 365", area: "Integrações", risk: "médio", at: at(10, 13, 47), ip: "187.11.90.3" },
  { id: "e14", who: "carla", action: "importou", target: "380 produtos (planilha)", area: "Dados", risk: "médio", at: at(12, 9, 10), ip: "179.34.8.77" },
];

const areas: Area[] = ["Acesso", "Equipe", "Cobrança", "Integrações", "Dados"];
const nameOf = (id: string) => people.find((p) => p.id === id)?.name ?? id;
const when = (iso: string) => new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

const fields: FilterField<Event>[] = [
  { key: "who", label: "Pessoa", type: "person", quick: true, accessor: (e) => e.who, options: people.filter((p) => p.status === "ativo").map((p) => ({ value: p.id, label: p.name })) },
  { key: "area", label: "Área", type: "enum", quick: true, accessor: (e) => e.area, options: areas.map((a) => ({ value: a, label: a })) },
  { key: "risk", label: "Risco", type: "enum", accessor: (e) => e.risk, options: ["alto", "médio", "baixo"].map((r) => ({ value: r, label: r[0].toUpperCase() + r.slice(1) })) },
  { key: "at", label: "Data", type: "date", accessor: (e) => e.at },
];

/* ------------------------------------------------------------------ */

export default function SettingsAuditLogBlock() {
  const query = useFrameQuery();
  const filters = useFilters(events, { fields, search: (e) => [nameOf(e.who), e.action, e.target, e.ip], me: me.id, now: today });
  const pages = usePagination(filters.rows, 10);
  const q = filters.state.query;
  const open = events.find((e) => e.id === query.get("id")) ?? null;

  const cols: Column<Event>[] = [
    {
      key: "evento",
      header: "Evento",
      primary: true,
      cell: (e) => {
        const p = people.find((x) => x.id === e.who);
        return (
          <span className="flex min-w-0 items-center gap-2.5">
            {p && <Avatar initials={p.initials} tint={p.tint} size="sm" name={p.name} />}
            <span className="min-w-0 truncate font-normal text-ink-soft">
              <Highlight text={nameOf(e.who)} query={q} className="font-medium text-ink" /> {e.action} <Highlight text={e.target} query={q} className="font-medium text-ink" />
            </span>
          </span>
        );
      },
    },
    { key: "area", header: "Área", cell: (e) => e.area, mobileHidden: true },
    { key: "risco", header: "Risco", cell: (e) => <Badge tone={e.risk === "alto" ? "bad" : e.risk === "médio" ? "warn" : "neutral"}>{e.risk[0].toUpperCase() + e.risk.slice(1)}</Badge> },
    { key: "quando", header: "Quando", cell: (e) => when(e.at), nowrap: true },
  ];

  return (
    <SettingsShell
      slug="settings-audit-log"
      title="Log de auditoria"
      description="Tudo o que muda permissões, cobrança, integrações e dados fica registrado por 2 anos."
      actions={
        <Button size="sm" variant="ghost" onClick={() => notify(`${filters.shown} eventos exportados para CSV`)}>
          <Download /> Exportar
        </Button>
      }
    >
      <div className="space-y-4">
        <PageToolbar>
          <FilterBar filters={filters} noun="evento" search={<TableSearch value={q} onChange={filters.setQuery} total={events.length} noun="evento" searchIn="pessoa, ação, alvo e IP" />} />
        </PageToolbar>
        <DataTable
          rows={pages.rows}
          columns={cols}
          rowKey={(e) => e.id}
          onRowClick={(e) => setFrameQuery({ id: e.id })}
          rowLabel={(e) => `Ver evento: ${nameOf(e.who)} ${e.action} ${e.target}`}
          empty={<EmptyFilterResult filters={filters} noun="evento" />}
        />
        <Pagination page={pages.page} pageCount={pages.pageCount} onPage={pages.setPage} total={pages.total} pageSize={pages.pageSize} />
      </div>

      <Drawer open={!!open} onClose={() => setFrameQuery({ id: undefined })} kicker={open ? `${open.area} · ${when(open.at)}` : undefined} title={open ? `${nameOf(open.who)} ${open.action} ${open.target}` : ""}>
        {open && (
          <div className="space-y-6">
            <PropertyList
              items={[
                { label: "Pessoa", value: nameOf(open.who) },
                { label: "Área", value: open.area },
                { label: "Risco", value: <Badge tone={open.risk === "alto" ? "bad" : open.risk === "médio" ? "warn" : "neutral"}>{open.risk}</Badge> },
                { label: "Data e hora", value: new Date(open.at).toLocaleString("pt-BR") },
                { label: "Endereço IP", value: <code className="font-mono text-[12.5px]">{open.ip}</code> },
              ]}
            />
            {(open.before || open.after) && (
              <section>
                <h3 className="m-0 mb-2 text-[13px] font-medium">Alteração</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg border border-rose/20 bg-rose-soft/40 px-3 py-2 text-[13px]">
                    <div className="text-[11px] text-muted">Antes</div>
                    {open.before}
                  </div>
                  <div className="rounded-lg border border-ok/20 bg-ok-soft/50 px-3 py-2 text-[13px]">
                    <div className="text-[11px] text-muted">Depois</div>
                    {open.after}
                  </div>
                </div>
              </section>
            )}
            <p className="m-0 flex items-center gap-2 text-[12px] text-muted">
              <History className="h-3.5 w-3.5" /> Registro imutável: nem administradores podem apagar eventos.
            </p>
          </div>
        )}
      </Drawer>
    </SettingsShell>
  );
}
