import { BellRing, Copy, Download, FilePlus2, FileUp, RefreshCw, UserRoundCog } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Avatar,
  Button,
  DataGrid,
  Empty,
  EmptyFilterResult,
  EntityMark,
  FilterBar,
  Highlight,
  Menu,
  Page,
  PageHeading,
  SavedViews,
  StatCell,
  StatGrid,
  TableSearch,
  formatCurrency,
  formatDate,
  notify,
  plural,
  useFilters,
  useSavedViews,
  type FilterField,
  type GridColumn,
  type SavedView,
} from "@g4ai/ds";
import {
  addContract,
  annualValue,
  contractStatus,
  contractTypes,
  contracts as seed,
  counterparties,
  counterpartyById,
  daysToEnd,
  endingWithin,
  iso,
  isActive,
  me,
  nextNumber,
  people,
  personById,
  renewalInfo,
  today,
  type Contract,
  type ContractStatus,
  type ContractType,
} from "./data/contracts";
import { go, useFrameParam } from "./shells/frame-route";
import { ClmShell, ContractStatusBadge, EndsIn, LoadError, LoadingRows, useListState } from "./shells/clm-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Contratos",
  description: "Carteira de contratos em DataGrid: visões salvas (vencendo, renovação automática, aguardando assinatura), filtros por tipo, situação, contraparte e valor, vigência com alerta, total no rodapé, ações em massa e os cinco estados.",
  category: "Contratos",
  order: 2,
  height: 940,
  concept: {
    goal: "Achar qualquer contrato da empresa em segundos e enxergar o que vence, o que renova sozinho e o que está parado em alguma etapa.",
    patterns: [
      "Anatomia A · Lista com DataGrid: visões salvas acima, filtros e busca na barra da grade, rolagem interna com total no rodapé",
      "Visões salvas do sistema: Vigentes, Vencendo em 90 dias, Renovação automática, Aguardando assinatura, Meus",
      "Vigência com palavra (“Vence em 12 dias”); só ≤ 30 dias e vencidos pintam",
      "Seleção em massa: atribuir responsável e lembrar responsáveis",
      "Cinco estados: ?estado=carregando|vazio|erro simula; vazio por filtro com Limpar",
      "Linha abre o contrato (?id=); ?visao= abre a visão certa a partir do painel",
    ],
    adapt: [
      "Apólices de seguro, licenças, imóveis, convênios: troque tipos e situações",
    ],
    avoid: [
      "Coluna só com a data de fim: mostre também renovação e aviso prévio",
      "Status editável na linha: a situação do contrato muda por fluxo (aprovação, assinatura), não à mão",
    ],
  },
} as const;

const statusOrder: ContractStatus[] = ["rascunho", "negociacao", "aprovacao", "assinatura", "vigente", "vencido", "encerrado"];
const legal = people.filter((p) => p.area === "Jurídico" && p.id !== "p9");

const fields: FilterField<Contract>[] = [
  { key: "status", label: "Situação", type: "enum", quick: true, accessor: (c) => c.status, options: statusOrder.map((s) => ({ value: s, label: contractStatus[s].label })) },
  { key: "tipo", label: "Tipo", type: "enum", quick: true, accessor: (c) => c.type, options: (Object.keys(contractTypes) as ContractType[]).map((t) => ({ value: t, label: contractTypes[t].label })) },
  { key: "owner", label: "Responsável", type: "person", quick: true, accessor: (c) => c.owner, options: legal.map((p) => ({ value: p.id, label: p.name })) },
  { key: "area", label: "Área solicitante", type: "enum", accessor: (c) => c.area, options: [...new Set(seed.map((c) => c.area))].map((a) => ({ value: a, label: a })) },
  { key: "contraparte", label: "Contraparte", type: "enum", accessor: (c) => c.counterpartyId, options: counterparties.map((k) => ({ value: k.id, label: k.short })) },
  { key: "renovacao", label: "Renovação", type: "enum", accessor: (c) => c.renewal, options: Object.entries(renewalInfo).map(([value, label]) => ({ value, label })) },
  { key: "valor", label: "Valor total", type: "currency", accessor: (c) => c.value },
  { key: "dias", label: "Dias até o fim", type: "number", unit: "dias", accessor: (c) => daysToEnd(c) },
  { key: "fim", label: "Fim da vigência", type: "date", accessor: (c) => c.end },
  { key: "indice", label: "Índice de reajuste", type: "enum", accessor: (c) => c.index, options: ["IPCA", "IGP-M", "INPC", "Sem reajuste"].map((i) => ({ value: i, label: i })) },
];

const views: SavedView[] = [
  { id: "todos", label: "Todos", system: true, state: { query: "", conditions: [] } },
  { id: "vigentes", label: "Vigentes", system: true, state: { query: "", conditions: [{ id: "v1", field: "status", op: "is", value: ["vigente"] }] } },
  { id: "vencendo", label: "Vencendo em 90 dias", system: true, state: { query: "", conditions: [{ id: "v2", field: "status", op: "is", value: ["vigente"] }, { id: "v3", field: "dias", op: "between", value: [0, 90] }] } },
  { id: "renovacao", label: "Renovação automática", system: true, state: { query: "", conditions: [{ id: "v4", field: "status", op: "is", value: ["vigente"] }, { id: "v5", field: "renovacao", op: "is", value: ["automatica"] }, { id: "v6", field: "dias", op: "between", value: [0, 120] }] } },
  { id: "andamento", label: "Em andamento", system: true, state: { query: "", conditions: [{ id: "v7", field: "status", op: "is", value: ["rascunho", "negociacao", "aprovacao"] }] } },
  { id: "assinatura", label: "Aguardando assinatura", system: true, state: { query: "", conditions: [{ id: "v8", field: "status", op: "is", value: ["assinatura"] }] } },
  { id: "meus", label: "Meus", system: true, state: { query: "", conditions: [{ id: "v9", field: "owner", op: "is", value: [me.id] }] } },
];

// CNPJ sem pontuação também acha: "14223871" encontra "14.223.871/0001-05".
const searchText = (c: Contract) => {
  const k = counterpartyById(c.counterpartyId);
  return [c.number, c.title, k.name, k.short, k.taxId, k.taxId.replace(/\D/g, ""), c.number.replace(/\D/g, "")];
};

export default function ClmContracts() {
  const estado = useListState();
  const visao = useFrameParam("visao");
  const [rows, setRows] = useState(seed);
  const filters = useFilters(rows, { fields, search: searchText, me: me.id, now: today, url: "c_" });
  const saved = useSavedViews(filters, views, "pacto-contratos-visoes");
  const counts = Object.fromEntries(saved.views.map((v) => [v.id, filters.countFor(v.state)]));
  const q = filters.state.query;
  const { select } = saved;
  // Vindo do painel (?visao=vencendo): abre a visão pedida.
  useEffect(() => {
    if (visao) select(visao);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visao]);

  const active = rows.filter(isActive);
  const inProgress = rows.filter((c) => ["rascunho", "negociacao", "aprovacao", "assinatura"].includes(c.status));
  const soon = active.filter((c) => endingWithin(c, 30));
  const expired = rows.filter((c) => c.status === "vencido");

  const assign = (targets: Contract[], owner: string) => {
    const ids = new Set(targets.map((c) => c.id));
    const before = rows;
    setRows((all) => all.map((c) => (ids.has(c.id) ? { ...c, owner } : c)));
    notify(`${plural(ids.size, "contrato atribuído", "contratos atribuídos")} a ${personById(owner).name}`, () => setRows(before));
  };
  const duplicate = (c: Contract) => {
    const copy = addContract({ ...c, id: `n${Date.now()}`, number: nextNumber(), title: `${c.title} (cópia)`, status: "rascunho", start: iso(30), end: iso(395), deviations: [], updated: iso(0), signedAt: undefined, owner: me.id });
    notify(`Rascunho ${copy.number} criado a partir de ${c.number}`);
    go("clm-contract", copy.id);
  };

  const columns: GridColumn<Contract>[] = [
    {
      key: "title",
      header: "Contrato",
      value: (c) => c.title,
      width: 270,
      pinned: "left",
      hideable: false,
      mobile: "title",
      cell: (c) => (
        <span className="block min-w-0 leading-tight">
          <Highlight text={c.title} query={q} className="block truncate font-medium" />
          <span className="block font-mono text-[11.5px] text-muted">
            <Highlight text={c.number} query={q} /> · {contractTypes[c.type].short}
          </span>
        </span>
      ),
    },
    {
      key: "counterparty",
      header: "Contraparte",
      value: (c) => counterpartyById(c.counterpartyId).short,
      width: 200,
      mobile: "subtitle",
      cell: (c) => {
        const k = counterpartyById(c.counterpartyId);
        return (
          <span className="flex min-w-0 items-center gap-2.5">
            <EntityMark name={k.short} tint={k.tint} className="h-7 w-7 text-[10px]" />
            <span className="min-w-0 leading-tight">
              <Highlight text={k.short} query={q} className="block truncate" />
              <span className="block truncate text-[11.5px] tabular-nums text-muted">
                <Highlight text={k.taxId} query={q} />
              </span>
            </span>
          </span>
        );
      },
    },
    { key: "type", header: "Tipo", value: (c) => contractTypes[c.type].label, width: 170, defaultHidden: true },
    {
      key: "value",
      header: "Valor total",
      tooltip: "Valor do contrato na vigência inteira. Total do filtro no rodapé.",
      value: (c) => c.value,
      width: 140,
      align: "right",
      cell: (c) =>
        c.value ? (
          <span className="block leading-tight">
            <span className="block font-medium tabular-nums">{formatCurrency(c.value, { cents: false })}</span>
            {c.monthly && <span className="block text-[11.5px] tabular-nums text-muted">{formatCurrency(c.monthly, { cents: false })}/mês</span>}
          </span>
        ) : (
          <span className="text-muted">Sem valor</span>
        ),
      footer: (list) => formatCurrency(list.reduce((s, c) => s + c.value, 0), { compact: true }),
    },
    {
      key: "end",
      header: "Vigência",
      // Encerrados vão para o fim da ordenação por vigência.
      value: (c) => (c.status === "encerrado" ? `9${c.end}` : c.end),
      width: 190,
      mobile: "meta",
      cell: (c) => (
        <span className="block leading-tight">
          <span className="block tabular-nums text-ink-soft">
            {formatDate(c.start)} a {formatDate(c.end)}
          </span>
          <span className="block text-[11.5px]">
            <EndsIn contract={c} />
          </span>
        </span>
      ),
    },
    {
      key: "renewal",
      header: "Renovação",
      value: (c) => renewalInfo[c.renewal],
      width: 160,
      cell: (c) => (
        <span className="block leading-tight">
          <span className="block">{renewalInfo[c.renewal]}</span>
          <span className="block text-[11.5px] text-muted">{c.renewal === "nenhuma" ? c.index : `${c.index} · aviso ${c.noticeDays} dias`}</span>
        </span>
      ),
    },
    {
      key: "owner",
      header: "Responsável",
      value: (c) => personById(c.owner).name,
      width: 150,
      cell: (c) => {
        const p = personById(c.owner);
        return (
          <span className="flex items-center gap-2">
            <Avatar initials={p.initials} tint={p.tint} name={p.name} size="sm" />
            <span className="truncate">{p.name.split(" ")[0]}</span>
          </span>
        );
      },
    },
    { key: "area", header: "Área", value: (c) => c.area, width: 120, defaultHidden: true },
    { key: "annual", header: "Valor anual", value: annualValue, width: 130, align: "right", defaultHidden: true, cell: (c) => <span className="tabular-nums">{formatCurrency(annualValue(c), { cents: false })}</span> },
    { key: "status", header: "Situação", value: (c) => statusOrder.indexOf(c.status), width: 180, cell: (c) => <ContractStatusBadge contract={c} /> },
  ];

  return (
    <ClmShell section="contratos">
      <Page>
        <PageHeading
          title="Contratos"
          description="Toda a carteira da Vereda: o que está em negociação, o que vale hoje e o que vence. Clique numa linha para abrir o contrato."
          actions={
            <>
              <Button variant="ghost" onClick={() => notify("Exemplo: abre o importador de PDFs assinados (a IA extrai partes, valores e prazos)", undefined, "info")}>
                <FileUp /> Importar assinados
              </Button>
              <Button onClick={() => go("clm-request")}>
                <FilePlus2 /> Nova solicitação
              </Button>
            </>
          }
        />
        <div className="space-y-5">
          {estado === "carregando" ? (
            <LoadingRows rows={9} label="Carregando contratos" />
          ) : estado === "erro" ? (
            <LoadError what="os contratos" />
          ) : estado === "vazio" ? (
            <Empty
              title="Nenhum contrato ainda"
              hint="Peça o primeiro contrato a partir de um modelo aprovado pelo Jurídico, ou importe os PDFs que já estão assinados."
              action={
                <Button onClick={() => go("clm-request")}>
                  <FilePlus2 /> Nova solicitação
                </Button>
              }
            />
          ) : (
            <>
              <StatGrid cols={4}>
                <StatCell label="Vigentes" value={formatCurrency(active.reduce((s, c) => s + c.value, 0), { compact: true })} hint={plural(active.length, "contrato")} />
                <StatCell label="Em andamento" value={inProgress.length} hint="rascunho até assinatura" />
                <StatCell label="Vencem em 30 dias" value={soon.length} hint={formatCurrency(soon.reduce((s, c) => s + annualValue(c), 0), { compact: true }) + " por ano"} tone={soon.length ? "warn" : undefined} />
                <StatCell label="Vencidos sem renovação" value={expired.length} hint="operando sem cobertura" tone={expired.length ? "bad" : undefined} />
              </StatGrid>
              <SavedViews views={saved} counts={counts} />
              <DataGrid
                label="Contratos"
                rows={filters.rows}
                columns={columns}
                rowKey={(c) => c.id}
                rowLabel={(c) => `${c.number} ${c.title}`}
                maxHeight="max(460px, calc(100dvh - 380px))"
                storageKey="pacto-contratos"
                defaultSort={{ key: "end", dir: "asc" }}
                query={q}
                selectable
                noun="contrato"
                exportFileName="contratos"
                showDensity
                toolbar={
                  <FilterBar
                    filters={filters}
                    noun="contrato"
                    search={<TableSearch value={q} onChange={filters.setQuery} total={rows.length} noun="contrato" searchIn="número, objeto, contraparte e CNPJ" />}
                  />
                }
                rowTone={(c) => (c.status === "vencido" ? "bad" : endingWithin(c, 30) ? "warn" : undefined)}
                onRowOpen={(c) => go("clm-contract", c.id)}
                rowActions={(c) => [
                  { label: "Renovar", icon: <RefreshCw />, inline: c.status === "vigente" || c.status === "vencido", disabled: !(c.status === "vigente" || c.status === "vencido"), onSelect: () => go("clm-contract", { id: c.id, acao: "renovar" }) },
                  { label: "Baixar PDF", icon: <Download />, inline: true, onSelect: () => notify(`${c.number}.pdf baixado`, undefined, "info") },
                  { label: "Duplicar como rascunho", icon: <Copy />, onSelect: () => duplicate(c) },
                  { label: "Lembrar o responsável", icon: <BellRing />, separator: true, onSelect: () => notify(`Lembrete enviado para ${personById(c.owner).name}`) },
                ]}
                bulkActions={(sel, { clear }) => (
                  <>
                    <Menu
                      label="Atribuir responsável"
                      side="top"
                      triggerClassName="h-8 bg-transparent px-2.5 text-[12.5px] font-normal text-on-ink ring-0 hover:bg-on-ink/10 data-popup-open:bg-on-ink/10"
                      trigger={
                        <>
                          <UserRoundCog /> Atribuir
                        </>
                      }
                      items={legal.map((p) => ({ label: p.name, onSelect: () => { assign(sel, p.id); clear(); } }))}
                    />
                    <button type="button" onClick={() => { notify(`Lembrete enviado aos responsáveis de ${plural(sel.length, "contrato")}`); clear(); }}>
                      <BellRing /> Lembrar
                    </button>
                  </>
                )}
                empty={<EmptyFilterResult filters={filters} noun="contrato" />}
                mobile="cards"
              />
            </>
          )}
        </div>
      </Page>
    </ClmShell>
  );
}
