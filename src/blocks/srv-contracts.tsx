import { FilePlus2, Pause, Play, RefreshCw, Wrench } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Callout,
  ConfirmDialog,
  DataTable,
  Drawer,
  Empty,
  EmptyFilterResult,
  EntityMark,
  FilterBar,
  Highlight,
  Meter,
  OperationButton,
  OperationFeedback,
  Page,
  PageHeading,
  PageToolbar,
  ProjectProgressCard,
  PropertyList,
  StatCell,
  StatGrid,
  TableSearch,
  Tabs,
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
  notify,
  useFilters,
  useOperation,
  type Column,
  type FilterField,
} from "@g4ai/ds";
import { charges, chargeState, clientById, contractFromQuote, contractStatus, contracts as seed, daysFrom, indexRate, invoices, invoiceStatus, mrr, onboardingOf, quoteById, quotes, type Contract, type ContractStatus } from "./data/servicos";
import { frameHref, go, setFrameQuery, useFrameParam } from "./shells/frame-route";
import { LoadError, LoadingTable, ServicosShell, useListState } from "./shells/servicos-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Contratos recorrentes",
  description: "Mensalidades por cliente: plano, valor mensal, reajuste anual (IPCA/IGP-M), próxima cobrança, horas do pacote e situação. Contrato abre em gaveta (?id=) com simulação de reajuste, consumo e, quando novo, o progresso da implantação.",
  category: "Serviços",
  order: 5,
  height: 960,
  concept: {
    goal: "Proteger a receita recorrente: renovar e reajustar no prazo, ver quem consome acima do pacote e acompanhar a implantação de quem acabou de fechar.",
    patterns: [
      "Anatomia A · Lista: cabeçalho fixo + PageToolbar colada (abas por situação, filtros, busca)",
      "Abas com contador só onde pede ação (Renovação próxima)",
      "Horas do pacote com barra; consumo acima pinta só o número",
      "Detalhe em Drawer (?id=): reajuste simulado pelo índice acumulado, últimas notas e cobranças",
      "Contrato novo mostra ProjectProgressCard da implantação com um único próximo passo",
      "Cinco estados: ?estado=carregando|vazio|erro simula; vazio por filtro com Limpar",
    ],
    adapt: [
      "Assinaturas de SaaS, mensalidades de escola, planos de manutenção de frota",
    ],
    avoid: [
      "Reajuste aplicado sem mostrar o valor novo ao cliente",
      "Contador total na aba “Ativos” (não pede ação)",
    ],
  },
} as const;

type Tab = "todos" | ContractStatus;
const nextBilling = (k: Contract) => `2026-10-${String(k.billingDay).padStart(2, "0")}`;

const fields: FilterField<Contract>[] = [
  { key: "index", label: "Índice", type: "enum", quick: true, accessor: (k) => k.index, options: ["IPCA", "IGP-M"].map((v) => ({ value: v, label: v })) },
  { key: "method", label: "Cobrança", type: "enum", quick: true, accessor: (k) => k.method, options: ["Boleto", "Pix"].map((v) => ({ value: v, label: v })) },
  { key: "monthly", label: "Valor mensal", type: "currency", accessor: (k) => k.monthly },
  { key: "renewal", label: "Renovação", type: "date", accessor: (k) => k.renewal },
  { key: "plan", label: "Plano", type: "text", accessor: (k) => k.plan },
];
const searchText = (k: Contract) => [k.number, k.plan, clientById(k.clientId).name, clientById(k.clientId).cnpj.replace(/\D/g, "")];

export default function SrvContracts() {
  const estado = useListState();
  const id = useFrameParam("id");
  const aba = useFrameParam("aba");
  const [list, setList] = useState<Contract[]>(() => {
    if (estado === "vazio") return [];
    // Vindo de um orçamento recorrente aprovado: o contrato novo entra no topo.
    if (id?.startsWith("orc-")) return [contractFromQuote(quoteById(id.slice(4)) ?? quotes[1]), ...seed];
    return seed;
  });
  const [tab, setTab] = useState<Tab>(aba === "renovar" || aba === "implantacao" ? aba : "todos");
  const tabRows = useMemo(() => (tab === "todos" ? list : list.filter((k) => k.status === tab)), [list, tab]);
  const filters = useFilters(tabRows, { fields, search: searchText });
  const q = filters.state.query;
  const opened = list.find((k) => k.id === id);
  const count = (s: ContractStatus) => list.filter((k) => k.status === s).length;
  const live = list.filter((k) => ["ativo", "renovar", "implantacao"].includes(k.status));
  const over = live.filter((k) => k.hoursUsed > k.hoursIncluded);
  const update = (next: Contract) => setList((all) => all.map((k) => (k.id === next.id ? next : k)));

  const columns: Column<Contract>[] = [
    {
      key: "client",
      header: "Cliente",
      primary: true,
      cell: (k) => {
        const c = clientById(k.clientId);
        return (
          <span className="flex min-w-0 items-center gap-2.5">
            <EntityMark name={c.name} tint={c.tint} className="h-8 w-8 text-[11px]" />
            <span className="min-w-0">
              <span className="block truncate font-medium">
                <Highlight text={c.name} query={q} />
              </span>
              <span className="block font-mono text-[11.5px] text-muted">
                <Highlight text={k.number} query={q} />
              </span>
            </span>
          </span>
        );
      },
    },
    { key: "plan", header: "Plano", mobileHidden: true, cell: (k) => <Highlight text={k.plan} query={q} /> },
    { key: "monthly", header: "Mensal", align: "right", nowrap: true, cell: (k) => <span className="font-medium tabular-nums">{formatCurrency(k.monthly)}</span>, footer: <span className="font-semibold tabular-nums">{formatCurrency(filters.rows.filter((k) => k.status !== "encerrado" && k.status !== "suspenso").reduce((s, k) => s + k.monthly, 0), { cents: false })}</span> },
    {
      key: "readjust",
      header: "Reajuste",
      nowrap: true,
      cell: (k) => (
        <span className="block leading-tight">
          <span className="block">{k.index}</span>
          <span className={k.status === "renovar" ? "block text-[11.5px] font-medium text-amber" : "block text-[11.5px] text-muted"}>{formatDate(k.renewal, { short: true })}{k.status === "renovar" ? ` · em ${daysFrom(k.renewal)} d` : ""}</span>
        </span>
      ),
    },
    { key: "next", header: "Próxima cobrança", nowrap: true, mobileHidden: true, cell: (k) => (k.status === "encerrado" || k.status === "suspenso" ? <span className="text-muted">—</span> : <span className="tabular-nums text-muted">{formatDate(nextBilling(k), { short: true })} · {k.method}</span>) },
    {
      key: "hours",
      header: "Horas do pacote",
      nowrap: true,
      mobileHidden: true,
      cell: (k) => (
        <span className="block w-28">
          <span className={k.hoursUsed > k.hoursIncluded ? "block text-[12px] font-medium tabular-nums text-rose" : "block text-[12px] tabular-nums text-muted"}>
            {formatNumber(k.hoursUsed, 1)} de {k.hoursIncluded} h
          </span>
          <Meter value={(k.hoursUsed / Math.max(1, k.hoursIncluded)) * 100} tone={k.hoursUsed > k.hoursIncluded ? "bad" : "ink"} label={`Horas usadas de ${k.number}`} />
        </span>
      ),
    },
    { key: "status", header: "Situação", nowrap: true, cell: (k) => <Badge tone={contractStatus[k.status].tone}>{contractStatus[k.status].label}</Badge> },
  ];

  return (
    <ServicosShell section="contratos">
      <Page>
        <PageHeading
          title="Contratos"
          description="Mensalidades recorrentes com reajuste anual pelo índice do contrato. Contrato novo nasce de um orçamento recorrente aprovado."
          actions={
            <Button href={frameHref("srv-quotes", { novo: "1" })}>
              <FilePlus2 /> Criar proposta de contrato
            </Button>
          }
        />
        {estado !== "carregando" && estado !== "erro" && list.length > 0 && (
          <StatGrid cols={4}>
            <StatCell label="Receita recorrente (MRR)" value={formatCurrency(mrr, { cents: false })} hint={`${live.length} contratos faturando`} />
            <StatCell label="Renovam em 60 dias" value={count("renovar")} hint={formatCurrency(list.filter((k) => k.status === "renovar").reduce((s, k) => s + k.monthly, 0), { cents: false }) + "/mês em jogo"} tone={count("renovar") ? "warn" : undefined} />
            <StatCell label="Acima do pacote de horas" value={over.length} hint="ofereça upgrade de plano" tone={over.length ? "warn" : undefined} />
            <StatCell label="Em implantação" value={count("implantacao")} hint="primeira mensalidade em outubro" />
          </StatGrid>
        )}
        <PageToolbar className="mt-6">
          <Tabs
            label="Situação"
            value={tab}
            onChange={(v) => setTab(v as Tab)}
            items={[
              { id: "todos", label: "Todos" },
              { id: "ativo", label: "Ativos" },
              { id: "renovar", label: "Renovação próxima", count: count("renovar") || undefined },
              { id: "implantacao", label: "Em implantação" },
              { id: "suspenso", label: "Suspensos", count: count("suspenso") || undefined },
              { id: "encerrado", label: "Encerrados" },
            ]}
          />
          {estado !== "carregando" && estado !== "erro" && list.length > 0 && <FilterBar className="mt-3" filters={filters} noun="contrato" search={<TableSearch value={q} onChange={filters.setQuery} total={tabRows.length} noun="contrato" searchIn="número, plano, cliente e CNPJ" />} />}
        </PageToolbar>
        <div className="mt-4">
          {estado === "carregando" ? (
            <LoadingTable label="Carregando contratos" />
          ) : estado === "erro" ? (
            <LoadError what="os contratos" />
          ) : !list.length ? (
            <Empty
              title="Nenhum contrato recorrente"
              hint="Contratos garantem receita todo mês. Monte um orçamento recorrente; aprovado, ele vira contrato com mensalidade e reajuste."
              action={
                <Button href={frameHref("srv-quotes", { novo: "1" })}>
                  <FilePlus2 /> Criar proposta de contrato
                </Button>
              }
            />
          ) : (
            <DataTable
              label="Contratos"
              rows={filters.rows}
              columns={columns}
              rowKey={(k) => k.id}
              rowLabel={(k) => `Abrir contrato ${k.number}`}
              onRowClick={(k) => setFrameQuery({ id: k.id })}
              rowSelected={(k) => k.id === id}
              rowTone={(k) => (k.status === "suspenso" ? "bad" : undefined)}
              footerLabel="Total mensal (sem suspensos e encerrados)"
              empty={<EmptyFilterResult filters={filters} noun="contrato" />}
            />
          )}
        </div>
      </Page>
      {opened && <ContractDrawer key={opened.id} k={opened} onChange={update} />}
    </ServicosShell>
  );
}

function ContractDrawer({ k, onChange }: { k: Contract; onChange: (k: Contract) => void }) {
  const c = clientById(k.clientId);
  const renew = useOperation({ busyLabel: "Renovando…" });
  const [suspending, setSuspending] = useState(false);
  const rate = indexRate[k.index];
  const newValue = Math.round(k.monthly * (1 + rate) * 100) / 100;
  const close = () => setFrameQuery({ id: undefined });
  const lastInvoices = invoices.filter((n) => n.origin.id === k.id).slice(0, 3);
  const lastCharges = charges.filter((b) => b.contractId === k.id).slice(0, 4);

  const footer =
    k.status === "renovar" ? (
      <OperationButton
        operation={renew}
        onClick={() => {
          const before = k;
          void renew.run(() => new Promise((r) => setTimeout(r, 700)), { message: `${k.number} renovado · nova mensalidade ${formatCurrency(newValue)} a partir de ${formatDate(k.renewal, { short: true })}`, undo: () => onChange(before) }, { apply: () => onChange({ ...k, status: "ativo", monthly: newValue, renewal: k.renewal.replace(/^(\d{4})/, (y) => String(Number(y) + 1)) }), revert: () => onChange(before) });
        }}
      >
        <RefreshCw /> Aplicar reajuste e renovar
      </OperationButton>
    ) : k.status === "suspenso" ? (
      <Button
        onClick={() => {
          onChange({ ...k, status: "ativo" });
          notify(`${k.number} reativado · atendimentos liberados`, () => onChange(k));
        }}
      >
        <Play /> Reativar contrato
      </Button>
    ) : k.status === "ativo" ? (
      <>
        <Button variant="ghost" onClick={() => setSuspending(true)}>
          <Pause /> Suspender
        </Button>
        <Button onClick={() => go("srv-work-orders", { nova: "1" })}>
          <Wrench /> Abrir OS
        </Button>
      </>
    ) : (
      <Button variant="ghost" href={frameHref("srv-client", c.id)}>
        Ver cliente
      </Button>
    );

  return (
    <Drawer open onClose={close} kicker={k.number} title={c.name} width={560} footer={footer}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={contractStatus[k.status].tone}>{contractStatus[k.status].label}</Badge>
          <span className="text-[12.5px] text-muted">desde {formatDate(k.start)}</span>
        </div>
        <OperationFeedback operation={renew} />
        {k.status === "implantacao" && (
          <ProjectProgressCard
            title="Implantação do contrato"
            subtitle={k.plan}
            owner="Renata Albuquerque"
            due={onboardingOf(k)[onboardingOf(k).length - 1].date}
            milestones={onboardingOf(k)}
            action={
              <Button size="sm" onClick={() => go("srv-schedule")}>
                Agendar primeira preventiva
              </Button>
            }
          />
        )}
        {k.status === "renovar" && (
          <Callout tone="warn" title={`Renova em ${formatDate(k.renewal)} · reajuste pelo ${k.index}`}>
            {k.index} acumulado em 12 meses: {formatPercent(rate, 2)}. A mensalidade passa de {formatCurrency(k.monthly)} para <strong className="font-semibold">{formatCurrency(newValue)}</strong>. O cliente recebe o aviso com 30 dias de antecedência.
          </Callout>
        )}
        {k.status === "suspenso" && (
          <Callout tone="bad" title="Contrato suspenso por inadimplência">
            Atendimentos só em emergência, com cobrança avulsa. {formatCurrency(charges.filter((b) => b.contractId === k.id && b.status === "aberta").reduce((s, b) => s + b.value, 0))} em aberto.
          </Callout>
        )}
        <PropertyList
          items={[
            { label: "Plano", value: k.plan, hint: k.scope },
            { label: "Mensalidade", value: <span className="font-semibold tabular-nums">{formatCurrency(k.monthly)}</span>, hint: `${k.method} · todo dia ${k.billingDay}` },
            { label: "Reajuste", value: `${k.index} · anual`, hint: `aniversário em ${formatDate(k.renewal)}` },
            { label: "SLA", value: k.sla },
            { label: "ISS", value: c.issWithheld ? "Retido pelo tomador" : "Recolhido pela Vértice" },
          ]}
        />
        <section>
          <div className="mb-1.5 flex items-baseline justify-between text-[12.5px]">
            <span className="font-medium">Horas do pacote em setembro</span>
            <span className={k.hoursUsed > k.hoursIncluded ? "font-medium tabular-nums text-rose" : "tabular-nums text-muted"}>
              {formatNumber(k.hoursUsed, 1)} de {k.hoursIncluded} h
            </span>
          </div>
          <Meter value={(k.hoursUsed / Math.max(1, k.hoursIncluded)) * 100} tone={k.hoursUsed > k.hoursIncluded ? "bad" : "ink"} thick label="Horas usadas do pacote" />
          {k.hoursUsed > k.hoursIncluded && <p className="m-0 mt-1.5 text-[12px] text-muted">Excedente de {formatNumber(k.hoursUsed - k.hoursIncluded, 1)} h entra na próxima fatura a {formatCurrency(145)}/h.</p>}
        </section>
        {(lastInvoices.length > 0 || lastCharges.length > 0) && (
          <section>
            <h3 className="m-0 mb-2 text-[13px] font-medium">Notas e cobranças</h3>
            <ul className="m-0 list-none divide-y divide-line rounded-xl border border-line p-0 text-[13px]">
              {lastInvoices.map((n) => (
                <li key={n.id}>
                  <a href={frameHref("srv-invoices", n.id)} className="flex items-center gap-3 px-3 py-2.5 hover:bg-soft">
                    <span className="min-w-0 flex-1 truncate">{n.number ? `NFS-e ${n.number}` : n.rps}</span>
                    <Badge tone={invoiceStatus[n.status].tone}>{invoiceStatus[n.status].label}</Badge>
                    <span className="w-24 text-right tabular-nums">{formatCurrency(n.value)}</span>
                  </a>
                </li>
              ))}
              {lastCharges.map((b) => (
                <li key={b.id}>
                  <a href={frameHref("srv-billing", b.id)} className="flex items-center gap-3 px-3 py-2.5 hover:bg-soft">
                    <span className="min-w-0 flex-1 truncate">
                      {b.number} · vence {formatDate(b.due, { short: true })}
                    </span>
                    <Badge tone={chargeState(b).tone}>{chargeState(b).label}</Badge>
                    <span className="w-24 text-right tabular-nums">{formatCurrency(b.value)}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
      <ConfirmDialog
        open={suspending}
        onClose={() => setSuspending(false)}
        title={`Suspender ${k.number}?`}
        description="As mensalidades param de ser geradas e os técnicos só atendem emergências com cobrança avulsa. O cliente é avisado por e-mail."
        confirmLabel="Suspender contrato"
        cancelLabel="Manter ativo"
        tone="danger"
        onConfirm={() => {
          setSuspending(false);
          onChange({ ...k, status: "suspenso" });
          notify(`${k.number} suspenso`, () => onChange(k));
        }}
      />
    </Drawer>
  );
}
