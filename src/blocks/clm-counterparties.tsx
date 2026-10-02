import { Building2, FilePlus2, RefreshCw } from "lucide-react";
import { useState } from "react";
import {
  Badge,
  Button,
  DataGrid,
  Drawer,
  Empty,
  EmptyFilterResult,
  EntityMark,
  FilterBar,
  Highlight,
  LocationTag,
  MaskedField,
  OperationButton,
  OperationFeedback,
  Page,
  PageHeading,
  PropertyList,
  TableSearch,
  TextField,
  formatCurrency,
  formatDate,
  masks,
  plural,
  useFilters,
  useOperation,
  type FilterField,
  type GridColumn,
} from "@g4ai/ds";
import {
  checkStatus,
  contracts,
  counterparties as seed,
  daysFromToday,
  diligenceOf,
  iso,
  isActive,
  riskInfo,
  type Counterparty,
  type DiligenceCheck,
  type Risk,
} from "./data/contracts";
import { frameHref, go, setFrameQuery, useFrameParam } from "./shells/frame-route";
import { ClmShell, ContractStatusBadge, LoadError, useListState } from "./shells/clm-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Contrapartes",
  description: "Fornecedores, clientes e parceiros com CNPJ, sede (com hora local), contratos ativos, valor sob contrato e due diligence: certidões (Federal, FGTS, CNDT, estadual, municipal) e compliance (CEIS/CNEP, sanções, LGPD, beneficiário final). Detalhe em gaveta por ?id=.",
  category: "Contratos",
  order: 8,
  height: 920,
  concept: {
    goal: "Saber com quem a empresa tem contrato, quanto está em jogo com cada um e se a contraparte está regular antes de assinar ou renovar.",
    patterns: [
      "Anatomia A · Lista com DataGrid; detalhe em Drawer (?id=) para não perder a lista",
      "Due diligence resumida em palavra (Em dia, Certidão vencida, Pendências) e aberta por verificação na gaveta",
      "LocationTag com a hora local da sede (contraparte em Manaus, Recife ou Lisboa)",
      "Atualizar certidões e cadastrar contraparte com operação e aviso ao terminar",
      "Cinco estados: ?estado=carregando|vazio|erro; vazio por filtro com Limpar",
    ],
    adapt: [
      "Cadastro de fornecedores (ERP), parceiros de canal, prestadores PJ",
    ],
    avoid: [
      "Mostrar só “risco alto” sem dizer qual certidão está vencida",
      "Assinar com certidão vencida sem registro de exceção",
    ],
  },
} as const;

const wait = (ms = 800) => new Promise((r) => setTimeout(r, ms));
const activeOf = (k: Counterparty) => contracts.filter((c) => c.counterpartyId === k.id && isActive(c));
const valueOf = (k: Counterparty) => activeOf(k).reduce((s, c) => s + c.value, 0);

const fields: FilterField<Counterparty>[] = [
  { key: "dd", label: "Due diligence", type: "enum", quick: true, accessor: (k) => diligenceOf(k).tone, options: [{ value: "ok", label: "Em dia" }, { value: "warn", label: "Com pendências" }, { value: "bad", label: "Certidão vencida" }] },
  { key: "risk", label: "Risco", type: "enum", quick: true, accessor: (k) => k.risk, options: (Object.keys(riskInfo) as Risk[]).map((r) => ({ value: r, label: riskInfo[r].label })) },
  { key: "segment", label: "Segmento", type: "enum", accessor: (k) => k.segment, options: [...new Set(seed.map((k) => k.segment))].map((s) => ({ value: s, label: s })) },
  { key: "uf", label: "Sede", type: "enum", accessor: (k) => k.place.split(", ")[1], options: [...new Set(seed.map((k) => k.place.split(", ")[1]))].sort().map((u) => ({ value: u, label: u })) },
  { key: "active", label: "Contratos ativos", type: "number", accessor: (k) => activeOf(k).length },
  { key: "value", label: "Valor sob contrato", type: "currency", accessor: valueOf },
];

function CheckList({ title, items }: { title: string; items: DiligenceCheck[] }) {
  return (
    <section>
      <h3 className="m-0 mb-2 text-[13px] font-medium">{title}</h3>
      <ul className="m-0 list-none divide-y divide-line rounded-xl border border-line p-0">
        {items.map((x) => (
          <li key={x.id} className="flex items-start gap-3 px-3 py-2.5">
            <div className="min-w-0 flex-1">
              <div className="text-[13px]">{x.label}</div>
              <div className="text-[12px] text-muted">
                {x.source}
                {x.validUntil && x.status !== "pendente" && (daysFromToday(x.validUntil) < 0 ? ` · venceu em ${formatDate(x.validUntil, { short: true })}` : ` · válida até ${formatDate(x.validUntil, { short: true })}`)}
              </div>
              {x.note && <p className="m-0 mt-1 text-[12px] leading-snug text-ink-soft">{x.note}</p>}
            </div>
            <Badge tone={checkStatus[x.status].tone}>{checkStatus[x.status].label}</Badge>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function ClmCounterparties() {
  const estado = useListState();
  const id = useFrameParam("id");
  const [rows, setRows] = useState(seed);
  const filters = useFilters(rows, { fields, search: (k) => [k.name, k.short, k.taxId, k.taxId.replace(/\D/g, ""), k.segment, k.place], url: "k_" });
  const q = filters.state.query;
  const open = rows.find((k) => k.id === id);
  const refresh = useOperation({ busyLabel: "Consultando órgãos…" });
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ cnpj: "", name: "", segment: "", place: "" });
  const createOp = useOperation({ busyLabel: "Cadastrando…" });

  const columns: GridColumn<Counterparty>[] = [
    {
      key: "name",
      header: "Contraparte",
      value: (k) => k.name,
      width: 300,
      pinned: "left",
      hideable: false,
      mobile: "title",
      cell: (k) => (
        <span className="flex min-w-0 items-center gap-2.5">
          <EntityMark name={k.short} tint={k.tint} className="h-8 w-8 text-[11px]" />
          <span className="min-w-0 leading-tight">
            <Highlight text={k.name} query={q} className="block truncate font-medium" />
            <span className="block truncate text-[11.5px] tabular-nums text-muted">
              {k.taxLabel} <Highlight text={k.taxId} query={q} />
            </span>
          </span>
        </span>
      ),
    },
    { key: "segment", header: "Segmento", value: (k) => k.segment, width: 190, mobile: "subtitle", cell: (k) => <Highlight text={k.segment} query={q} className="text-ink-soft" /> },
    { key: "place", header: "Sede", value: (k) => k.place, width: 160, cell: (k) => <Highlight text={k.place} query={q} /> },
    { key: "active", header: "Ativos", tooltip: "Contratos vigentes", value: (k) => activeOf(k).length, width: 80, align: "right", cell: (k) => <span className="tabular-nums">{activeOf(k).length}</span> },
    {
      key: "value",
      header: "Valor sob contrato",
      value: valueOf,
      width: 150,
      align: "right",
      cell: (k) => (valueOf(k) ? <span className="font-medium tabular-nums">{formatCurrency(valueOf(k), { cents: false })}</span> : <span className="text-muted">—</span>),
      footer: (list) => formatCurrency(list.reduce((s, k) => s + valueOf(k), 0), { compact: true }),
    },
    { key: "dd", header: "Due diligence", value: (k) => diligenceOf(k).issues, width: 170, mobile: "meta", cell: (k) => <Badge tone={diligenceOf(k).tone}>{diligenceOf(k).label}</Badge> },
    { key: "risk", header: "Risco", value: (k) => ["baixo", "medio", "alto"].indexOf(k.risk), width: 120, cell: (k) => <Badge tone={k.risk === "baixo" ? "neutral" : riskInfo[k.risk].tone}>{riskInfo[k.risk].label}</Badge> },
    { key: "since", header: "Desde", value: (k) => k.since, width: 110, defaultHidden: true, cell: (k) => <span className="tabular-nums text-muted">{formatDate(k.since, { short: true })}</span> },
  ];

  const flagged = rows.filter((k) => diligenceOf(k).tone === "bad");

  return (
    <ClmShell section="contrapartes">
      <Page>
        <PageHeading
          title="Contrapartes"
          description={`${plural(rows.length, "empresa")} com contrato ou em negociação. Certidões são consultadas a cada 30 dias e antes de cada assinatura.`}
          actions={
            <Button onClick={() => setCreating(true)}>
              <Building2 /> Nova contraparte
            </Button>
          }
        />
        <div className="space-y-4">
          {estado === "erro" ? (
            <LoadError what="as contrapartes" />
          ) : estado === "vazio" ? (
            <Empty
              title="Nenhuma contraparte cadastrada"
              hint="Cadastre pelo CNPJ: buscamos os dados na Receita e pedimos as certidões automaticamente."
              action={
                <Button onClick={() => setCreating(true)}>
                  <Building2 /> Nova contraparte
                </Button>
              }
            />
          ) : (
            <DataGrid
              label="Contrapartes"
              rows={filters.rows}
              loading={estado === "carregando"}
              columns={columns}
              rowKey={(k) => k.id}
              rowLabel={(k) => k.name}
              maxHeight="max(440px, calc(100dvh - 260px))"
              storageKey="pacto-contrapartes"
              defaultSort={{ key: "value", dir: "desc" }}
              query={q}
              noun="contraparte"
              gender="f"
              exportFileName="contrapartes"
              toolbar={<FilterBar filters={filters} noun="contraparte" search={<TableSearch value={q} onChange={filters.setQuery} total={rows.length} noun="contraparte" searchIn="nome, CNPJ, segmento e cidade" />} />}
              rowTone={(k) => (diligenceOf(k).tone === "bad" && activeOf(k).length ? "bad" : undefined)}
              onRowOpen={(k) => setFrameQuery({ id: k.id })}
              rowActions={(k) => [
                { label: "Nova solicitação", icon: <FilePlus2 />, inline: true, onSelect: () => go("clm-request", { contraparte: k.id }) },
                { label: "Atualizar certidões", icon: <RefreshCw />, onSelect: () => setFrameQuery({ id: k.id }) },
              ]}
              empty={<EmptyFilterResult filters={filters} noun="contraparte" />}
              mobile="cards"
            />
          )}
          {!estado && flagged.length > 0 && (
            <p className="m-0 text-[12.5px] text-muted">
              {plural(flagged.length, "contraparte com certidão vencida", "contrapartes com certidão vencida")}: o Pacto bloqueia o envio para assinatura até a regularização.
            </p>
          )}
        </div>
      </Page>

      <Drawer
        open={!!open}
        onClose={() => {
          refresh.reset();
          setFrameQuery({ id: undefined });
        }}
        width={520}
        kicker={open?.segment}
        title={open?.name ?? ""}
        footer={
          open && (
            <>
              <Button variant="ghost" onClick={() => go("clm-request", { contraparte: open.id })}>
                <FilePlus2 /> Nova solicitação
              </Button>
              <OperationButton
                operation={refresh}
                onClick={() =>
                  void refresh.run(
                    async () => {
                      await wait(1200);
                      setRows((all) => all.map((k) => (k.id === open.id ? { ...k, checks: k.checks.map((x) => (x.validUntil && x.status !== "alerta" ? { ...x, status: "ok", validUntil: iso(90) } : x)) } : k)));
                    },
                    `Certidões de ${open.short} atualizadas`,
                  )
                }
              >
                <RefreshCw /> Atualizar certidões
              </OperationButton>
            </>
          )
        }
      >
        {open && (
          <div className="space-y-6">
            <OperationFeedback operation={refresh} />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <LocationTag place={open.place} timeZone={open.timeZone} />
              <span className="flex gap-1">
                <Badge tone={diligenceOf(open).tone}>{diligenceOf(open).label}</Badge>
                <Badge tone={open.risk === "baixo" ? "neutral" : riskInfo[open.risk].tone}>{riskInfo[open.risk].label}</Badge>
              </span>
            </div>
            <PropertyList
              items={[
                { label: open.taxLabel, value: <span className="tabular-nums">{open.taxId}</span> },
                { label: "Representante", value: open.rep.name, hint: `${open.rep.role} · ${open.rep.email}` },
                { label: "Relacionamento desde", value: formatDate(open.since) },
                { label: "Contratos ativos", value: activeOf(open).length },
                { label: "Valor sob contrato", value: valueOf(open) ? formatCurrency(valueOf(open), { cents: false }) : "—" },
              ]}
            />
            <section>
              <h3 className="m-0 mb-2 text-[13px] font-medium">Contratos</h3>
              {contracts.filter((c) => c.counterpartyId === open.id).length ? (
                <ul className="m-0 list-none divide-y divide-line rounded-xl border border-line p-0">
                  {contracts
                    .filter((c) => c.counterpartyId === open.id)
                    .map((c) => (
                      <li key={c.id}>
                        <a href={frameHref("clm-contract", c.id)} className="flex items-center gap-3 px-3 py-2.5 hover:bg-soft/60">
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-medium">{c.title}</span>
                            <span className="block text-[12px] text-muted">
                              <span className="font-mono">{c.number}</span> · até {formatDate(c.end, { short: true })}
                            </span>
                          </span>
                          <ContractStatusBadge contract={c} />
                        </a>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="m-0 rounded-xl border border-dashed border-line px-4 py-3 text-[12.5px] text-muted">Nenhum contrato ainda.</p>
              )}
            </section>
            {open.checks.some((x) => x.validUntil) && <CheckList title="Certidões" items={open.checks.filter((x) => !!x.validUntil)} />}
            <CheckList title="Compliance" items={open.checks.filter((x) => !x.validUntil)} />
          </div>
        )}
      </Drawer>

      <Drawer
        open={creating}
        onClose={() => setCreating(false)}
        title="Nova contraparte"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreating(false)}>
              Cancelar
            </Button>
            <OperationButton
              operation={createOp}
              disabled={draft.cnpj.replace(/\D/g, "").length !== 14 || !draft.name.trim()}
              disabledReason="Informe CNPJ e razão social"
              onClick={() =>
                void createOp.run(
                  async () => {
                    await wait();
                    const k: Counterparty = {
                      ...seed[0],
                      id: `k${Date.now()}`,
                      name: draft.name.trim(),
                      short: draft.name.trim().split(" ").slice(0, 2).join(" "),
                      taxId: draft.cnpj,
                      segment: draft.segment || "A classificar",
                      place: draft.place || "São Paulo, SP",
                      timeZone: "America/Sao_Paulo",
                      since: iso(0),
                      risk: "medio",
                      checks: seed[0].checks.map((x) => ({ ...x, status: "pendente", note: undefined })),
                    };
                    setRows((all) => [k, ...all]);
                    setCreating(false);
                    setDraft({ cnpj: "", name: "", segment: "", place: "" });
                  },
                  `${draft.name.trim()} cadastrada · certidões solicitadas`,
                )
              }
            >
              Cadastrar contraparte
            </OperationButton>
          </>
        }
      >
        <div className="space-y-4">
          <OperationFeedback operation={createOp} />
          <MaskedField label="CNPJ" mask={masks.cnpj} value={draft.cnpj} onChange={(m) => setDraft((d) => ({ ...d, cnpj: m }))} hint="Buscamos razão social e endereço na Receita" />
          <TextField label="Razão social" value={draft.name} onChange={(v) => setDraft((d) => ({ ...d, name: v }))} placeholder="Ex.: Transportes Andrade Ltda" />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Segmento" optional value={draft.segment} onChange={(v) => setDraft((d) => ({ ...d, segment: v }))} placeholder="Ex.: Logística" />
            <TextField label="Cidade da sede" optional value={draft.place} onChange={(v) => setDraft((d) => ({ ...d, place: v }))} placeholder="Ex.: Campinas, SP" />
          </div>
          <p className="m-0 text-[12px] text-muted">Ao cadastrar, pedimos as certidões Federal, FGTS, CNDT, estadual e municipal e consultamos CEIS/CNEP. O questionário de proteção de dados vai por e-mail ao representante.</p>
        </div>
      </Drawer>
    </ClmShell>
  );
}
