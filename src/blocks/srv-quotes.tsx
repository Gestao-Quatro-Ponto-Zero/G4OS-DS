import { Check, Copy, FilePlus2, Package, Plus, Send, Trash2, Wrench, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Callout,
  Combobox,
  DataTable,
  DatePicker,
  Drawer,
  Empty,
  EmptyFilterResult,
  FilterBar,
  Highlight,
  IconButton,
  Modal,
  NumberField,
  OperationButton,
  OperationFeedback,
  Page,
  PageHeading,
  PageToolbar,
  PropertyList,
  Select,
  StatCell,
  StatGrid,
  TableSearch,
  Tabs,
  TextField,
  formatCurrency,
  formatDate,
  formatPercent,
  notify,
  useFilters,
  useOperation,
  type Column,
  type FilterField,
  Table,
} from "@g4ai/ds";
import { clientById, clients, daysFrom, iso, materials, quoteStatus, quoteTotals, quotes as seed, serviceById, services, staff, staffById, type Quote, type QuoteItem, type QuoteStatus } from "./data/servicos";
import { frameHref, go, setFrameQuery, useFrameParam } from "./shells/frame-route";
import { LoadError, LoadingTable, ServicosShell, useListState } from "./shells/servicos-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Orçamentos de serviço",
  description: "Orçamentos por situação (rascunho, enviado, aprovado, recusado, expirado) com validade e valor. Criar em gaveta com horas, valor/hora, materiais, desconto e ISS; aprovar vira OS (avulso) ou contrato (recorrente). ?id= abre o orçamento, ?novo=1 abre o cadastro.",
  category: "Serviços",
  order: 2,
  height: 960,
  concept: {
    goal: "Transformar pedido do cliente em orçamento rápido e, aprovado, em trabalho agendado ou receita recorrente sem redigitar nada.",
    patterns: [
      "Anatomia A · Lista: cabeçalho fixo + PageToolbar colada (abas por situação, filtros, busca)",
      "Criar e ver orçamento em Drawer, sem perder a lista; ?id= e ?novo=1 no endereço",
      "Itens de serviço (horas × valor/hora) e materiais separados; desconto e ISS destacado",
      "Aprovar pergunta o destino: avulso → OS, recorrente → contrato; o orçamento guarda o vínculo",
      "Validade vencendo em até 3 dias pinta só a data; expirado oferece renovar",
      "Cinco estados: ?estado=carregando|vazio|erro simula; vazio por filtro com Limpar",
    ],
    adapt: [
      "Proposta comercial (CRM), orçamento de obra, cotação de frete",
    ],
    avoid: [
      "Aprovar orçamento e redigitar tudo na OS",
      "Desconto escondido no preço unitário (o cliente não vê o que ganhou)",
    ],
  },
} as const;

type Tab = "todos" | "abertos" | QuoteStatus;

const fields: FilterField<Quote>[] = [
  { key: "owner", label: "Responsável", type: "person", quick: true, accessor: (q) => q.owner, options: staff.map((p) => ({ value: p.id, label: p.name })) },
  { key: "kind", label: "Tipo", type: "enum", quick: true, accessor: (q) => q.kind, options: ["Avulso", "Recorrente"].map((v) => ({ value: v, label: v })) },
  { key: "total", label: "Valor", type: "currency", accessor: (q) => quoteTotals(q).total },
  { key: "valid", label: "Validade", type: "date", accessor: (q) => q.validUntil },
  { key: "client", label: "Cliente", type: "text", accessor: (q) => clientById(q.clientId).name },
];
const searchText = (q: Quote) => [q.number, q.title, clientById(q.clientId).name, clientById(q.clientId).cnpj.replace(/\D/g, "")];

function Validity({ q }: { q: Quote }) {
  const d = daysFrom(q.validUntil);
  if (q.status === "aprovado" || q.status === "recusado") return <span className="text-muted">—</span>;
  if (q.status === "expirado" || d < 0) return <span className="tabular-nums text-muted">venceu {formatDate(q.validUntil, { short: true })}</span>;
  return <span className={d <= 3 ? "font-medium tabular-nums text-amber" : "tabular-nums text-muted"}>{d === 0 ? "vence hoje" : d <= 3 ? `em ${d} dias` : formatDate(q.validUntil, { short: true })}</span>;
}

export default function SrvQuotes() {
  const estado = useListState();
  const id = useFrameParam("id");
  const novo = useFrameParam("novo");
  const [list, setList] = useState<Quote[]>(() => (estado === "vazio" ? [] : seed));
  const [tab, setTab] = useState<Tab>("todos");
  const tabRows = useMemo(() => (tab === "todos" ? list : tab === "abertos" ? list.filter((q) => q.status === "rascunho" || q.status === "enviado") : list.filter((q) => q.status === tab)), [list, tab]);
  const filters = useFilters(tabRows, { fields, search: searchText, me: "renata" });
  const q = filters.state.query;
  const opened = list.find((x) => x.id === id);

  const sent = list.filter((x) => x.status === "enviado");
  const decided = list.filter((x) => x.status === "aprovado" || x.status === "recusado" || x.status === "expirado");
  const approved = list.filter((x) => x.status === "aprovado");
  const expiring = sent.filter((x) => daysFrom(x.validUntil) >= 0 && daysFrom(x.validUntil) <= 3);
  const count = (s: QuoteStatus) => list.filter((x) => x.status === s).length;

  const update = (next: Quote) => setList((all) => (all.some((x) => x.id === next.id) ? all.map((x) => (x.id === next.id ? next : x)) : [next, ...all]));

  const columns: Column<Quote>[] = [
    {
      key: "title",
      header: "Orçamento",
      primary: true,
      cell: (x) => (
        <span className="block min-w-0">
          <span className="block truncate font-medium">
            <Highlight text={x.title} query={q} />
          </span>
          <span className="block font-mono text-[11.5px] text-muted">
            <Highlight text={x.number} query={q} /> · {formatDate(x.createdAt, { short: true })}
          </span>
        </span>
      ),
    },
    { key: "client", header: "Cliente", cell: (x) => <Highlight text={clientById(x.clientId).name} query={q} /> },
    { key: "kind", header: "Tipo", nowrap: true, mobileHidden: true, cell: (x) => (x.kind === "Recorrente" ? <Badge>Recorrente</Badge> : <span className="text-muted">Avulso</span>) },
    { key: "valid", header: "Validade", nowrap: true, cell: (x) => <Validity q={x} /> },
    { key: "total", header: "Valor", align: "right", nowrap: true, cell: (x) => <span className="font-medium tabular-nums">{formatCurrency(quoteTotals(x).total)}{x.kind === "Recorrente" && <span className="font-normal text-muted">/mês</span>}</span> },
    { key: "status", header: "Situação", nowrap: true, cell: (x) => <Badge tone={quoteStatus[x.status].tone}>{quoteStatus[x.status].label}</Badge> },
  ];

  return (
    <ServicosShell section="orcamentos">
      <Page>
        <PageHeading
          title="Orçamentos"
          description="Aprovado avulso vira ordem de serviço; aprovado recorrente vira contrato com mensalidade."
          actions={
            <Button onClick={() => setFrameQuery({ novo: "1", id: undefined })}>
              <FilePlus2 /> Criar orçamento
            </Button>
          }
        />
        {estado !== "carregando" && estado !== "erro" && list.length > 0 && (
          <StatGrid cols={4}>
            <StatCell label="Enviados aguardando" value={formatCurrency(sent.reduce((s, x) => s + quoteTotals(x).total, 0), { cents: false })} hint={`${sent.length} orçamentos`} />
            <StatCell label="Taxa de aprovação" value={formatPercent(approved.length / Math.max(1, decided.length), 0)} hint="decididos nos últimos 90 dias" />
            <StatCell label="Vencendo em 3 dias" value={expiring.length} hint="ligue antes de expirar" tone={expiring.length ? "warn" : undefined} />
            <StatCell label="Ticket médio aprovado" value={formatCurrency(approved.reduce((s, x) => s + quoteTotals(x).total, 0) / Math.max(1, approved.length), { cents: false })} hint="avulsos e recorrentes" />
          </StatGrid>
        )}
        <PageToolbar className="mt-6">
          <Tabs
            label="Situação"
            value={tab}
            onChange={(v) => setTab(v as Tab)}
            items={[
              { id: "todos", label: "Todos" },
              { id: "abertos", label: "Em aberto" },
              { id: "aprovado", label: "Aprovados" },
              { id: "recusado", label: "Recusados" },
              { id: "expirado", label: "Expirados", count: count("expirado") || undefined },
            ]}
          />
          {estado !== "carregando" && estado !== "erro" && list.length > 0 && (
            <FilterBar className="mt-3" filters={filters} noun="orçamento" search={<TableSearch value={q} onChange={filters.setQuery} total={tabRows.length} noun="orçamento" searchIn="número, título, cliente e CNPJ" />} />
          )}
        </PageToolbar>
        <div className="mt-4">
          {estado === "carregando" ? (
            <LoadingTable label="Carregando orçamentos" />
          ) : estado === "erro" ? (
            <LoadError what="os orçamentos" />
          ) : !list.length ? (
            <Empty
              title="Nenhum orçamento ainda"
              hint="Monte o primeiro com horas técnicas e materiais. Aprovado, ele vira OS ou contrato sem redigitar."
              action={
                <Button onClick={() => setFrameQuery({ novo: "1" })}>
                  <FilePlus2 /> Criar orçamento
                </Button>
              }
            />
          ) : (
            <DataTable
              label="Orçamentos"
              rows={filters.rows}
              columns={columns}
              rowKey={(x) => x.id}
              rowLabel={(x) => `Abrir orçamento ${x.number}`}
              onRowClick={(x) => setFrameQuery({ id: x.id, novo: undefined })}
              rowSelected={(x) => x.id === id}
              rowTone={(x) => (x.status === "enviado" && daysFrom(x.validUntil) <= 0 ? "warn" : undefined)}
              empty={<EmptyFilterResult filters={filters} noun="orçamento" />}
            />
          )}
        </div>
      </Page>

      {opened && <QuoteDrawer key={opened.id} quote={opened} onChange={update} onDuplicate={(copy) => (update(copy), setFrameQuery({ id: copy.id }))} />}
      <NewQuoteDrawer
        open={novo === "1"}
        nextNumber={`ORC-0${419 + list.length - seed.length}`}
        onClose={() => setFrameQuery({ novo: undefined })}
        onSave={(quote) => {
          update(quote);
          setFrameQuery({ novo: undefined, id: quote.id });
        }}
      />
    </ServicosShell>
  );
}

/* ------------------------------------------------------------------ */
/* Itens e totais                                                      */
/* ------------------------------------------------------------------ */

function ItemsTable({ items, discount, onRemove }: { items: QuoteItem[]; discount: number; onRemove?: (id: string) => void }) {
  const t = quoteTotals({ items, discount });
  return (
    <Table label="Itens do orçamento">
        <thead className="border-b border-line bg-soft text-[12px] text-muted">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Item</th>
            <th className="px-3 py-2 text-right font-medium">Qtd.</th>
            <th className="px-3 py-2 text-right font-medium">Unitário</th>
            <th className="px-3 py-2 text-right font-medium">Subtotal</th>
            {onRemove && <th className="w-9" aria-label="Ações" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {items.map((it) => {
            const unit = it.kind === "servico" ? serviceById(it.refId).unit : materials.find((m) => m.id === it.refId)?.unit;
            return (
              <tr key={it.id}>
                <td className="min-w-[180px] px-3 py-2">
                  <span className="flex items-center gap-2">
                    {it.kind === "servico" ? <Wrench className="h-3.5 w-3.5 shrink-0 text-muted" aria-label="Serviço" /> : <Package className="h-3.5 w-3.5 shrink-0 text-muted" aria-label="Material" />}
                    <span className="min-w-0">{it.description}</span>
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                  {it.qty.toLocaleString("pt-BR")} {unit}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(it.price)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(it.qty * it.price)}</td>
                {onRemove && (
                  <td className="pr-1 text-right">
                    <IconButton size="sm" label={`Remover ${it.description}`} onClick={() => onRemove(it.id)}>
                      <Trash2 />
                    </IconButton>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
        <tfoot className="border-t border-line text-[12.5px]">
          <tr>
            <td className="px-3 pt-2 text-muted" colSpan={3}>
              Serviços · materiais
            </td>
            <td className="px-3 pt-2 text-right tabular-nums">
              {formatCurrency(t.services, { cents: false })} · {formatCurrency(t.materials, { cents: false })}
            </td>
            {onRemove && <td />}
          </tr>
          {discount > 0 && (
            <tr>
              <td className="px-3 text-muted" colSpan={3}>
                Desconto ({formatPercent(discount, 0)})
              </td>
              <td className="px-3 text-right tabular-nums">−{formatCurrency(t.discount)}</td>
              {onRemove && <td />}
            </tr>
          )}
          <tr>
            <td className="px-3 text-muted" colSpan={3}>
              ISS 5 % (incluso, destacado na NFS-e)
            </td>
            <td className="px-3 text-right tabular-nums text-muted">{formatCurrency(t.iss)}</td>
            {onRemove && <td />}
          </tr>
          <tr>
            <td className="px-3 pb-2.5 pt-1 text-[13.5px] font-medium" colSpan={3}>
              Total
            </td>
            <td className="px-3 pb-2.5 pt-1 text-right text-[15px] font-semibold tabular-nums">{formatCurrency(t.total)}</td>
            {onRemove && <td />}
          </tr>
        </tfoot>
    </Table>
  );
}

/* ------------------------------------------------------------------ */
/* Ver orçamento (gaveta) + aprovar                                    */
/* ------------------------------------------------------------------ */

function QuoteDrawer({ quote, onChange, onDuplicate }: { quote: Quote; onChange: (q: Quote) => void; onDuplicate: (q: Quote) => void }) {
  const k = clientById(quote.clientId);
  const send = useOperation({ busyLabel: "Enviando…" });
  const approve = useOperation({ busyLabel: "Gerando…" });
  const [approving, setApproving] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const close = () => setFrameQuery({ id: undefined });
  const toOs = quote.kind === "Avulso";
  const t = quoteTotals(quote);

  const doApprove = () => {
    const before = quote;
    const result = toOs ? { kind: "os" as const, id: `orc-${quote.id}`, number: "OS-3195" } : { kind: "contrato" as const, id: `orc-${quote.id}`, number: "CT-2026-020" };
    void approve.run(() => new Promise((r) => setTimeout(r, 700)), { message: `${quote.number} aprovado · ${result.number} criad${toOs ? "a" : "o"}`, undo: () => onChange(before) }, { apply: () => onChange({ ...quote, status: "aprovado", result }), revert: () => onChange(before) }).then((err) => !err && setApproving(false));
  };
  const doSend = () => {
    const before = quote;
    void send.run(() => new Promise((r) => setTimeout(r, 600)), { message: `${quote.number} enviado para ${k.email}`, undo: () => onChange(before) }, { apply: () => onChange({ ...quote, status: "enviado", validUntil: quote.status === "expirado" ? iso(15) : quote.validUntil }), revert: () => onChange(before) });
  };

  const footer = () => {
    switch (quote.status) {
      case "rascunho":
        return (
          <OperationButton operation={send} onClick={doSend}>
            <Send /> Enviar ao cliente
          </OperationButton>
        );
      case "enviado":
        return (
          <>
            <Button variant="ghost" onClick={() => setDeclining(true)}>
              <X /> Marcar como recusado
            </Button>
            <Button onClick={() => setApproving(true)}>
              <Check /> Aprovar orçamento
            </Button>
          </>
        );
      case "expirado":
        return (
          <OperationButton operation={send} onClick={doSend}>
            <Send /> Renovar validade e reenviar
          </OperationButton>
        );
      case "aprovado":
        return quote.result ? (
          <Button onClick={() => go(quote.result!.kind === "os" ? "srv-work-order" : "srv-contracts", quote.result!.id)}>Abrir {quote.result.number}</Button>
        ) : null;
      default:
        return (
          <Button variant="ghost" onClick={() => onDuplicate({ ...quote, id: `q${Date.now()}`, number: `${quote.number}-R`, status: "rascunho", createdAt: iso(0), validUntil: iso(15), result: undefined })}>
            <Copy /> Duplicar como rascunho
          </Button>
        );
    }
  };

  return (
    <Drawer open onClose={close} kicker={`${quote.number} · ${quote.kind}`} title={quote.title} width={560} footer={footer()}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={quoteStatus[quote.status].tone}>{quoteStatus[quote.status].label}</Badge>
          <span className="text-[12.5px] text-muted">
            criado em {formatDate(quote.createdAt)} por {staffById(quote.owner).name}
          </span>
        </div>
        <OperationFeedback operation={send} />
        {quote.status === "aprovado" && quote.result && (
          <Callout tone="ok" title={`Virou ${quote.result.kind === "os" ? "a ordem de serviço" : "o contrato"} ${quote.result.number}`}>
            {quote.result.kind === "os" ? "Itens, horas e materiais foram copiados para a OS. Agende o técnico na agenda." : "A mensalidade entra na régua de cobrança a partir do próximo vencimento."}
          </Callout>
        )}
        {quote.status === "recusado" && quote.note && <Callout tone="bad" title="Motivo da recusa">{quote.note}</Callout>}
        <PropertyList
          items={[
            { label: "Cliente", value: <a className="hover:underline" href={frameHref("srv-client", k.id)}>{k.name}</a>, hint: `${k.cnpj} · ${k.contact}` },
            { label: "Validade", value: formatDate(quote.validUntil), hint: quote.status === "enviado" && daysFrom(quote.validUntil) <= 3 ? "vence em breve" : undefined },
            { label: "Tipo", value: quote.kind === "Recorrente" ? "Recorrente (mensal)" : "Avulso" },
            { label: "ISS", value: k.issWithheld ? "Retido pelo tomador" : "Recolhido pela Vértice", hint: "Município de São Paulo" },
          ]}
        />
        <div>
          <h3 className="m-0 mb-2 text-[13px] font-medium">Itens</h3>
          <ItemsTable items={quote.items} discount={quote.discount} />
        </div>
        {quote.note && quote.status !== "recusado" && <p className="m-0 text-[12.5px] text-muted">{quote.note}</p>}
      </div>

      <Modal
        open={approving}
        onClose={() => setApproving(false)}
        size="sm"
        title={`Aprovar ${quote.number}?`}
        description={toOs ? "Cria uma ordem de serviço aberta com os itens do orçamento. O técnico é escolhido na agenda." : `Cria um contrato com mensalidade de ${formatCurrency(t.total)} e reajuste anual pelo IPCA.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setApproving(false)} disabled={approve.busy}>
              Cancelar
            </Button>
            <OperationButton operation={approve} onClick={doApprove}>
              <Check /> {toOs ? "Aprovar e abrir OS" : "Aprovar e criar contrato"}
            </OperationButton>
          </>
        }
      >
        <OperationFeedback operation={approve} />
        <PropertyList items={[{ label: "Cliente", value: k.name }, { label: "Valor", value: <span className="font-semibold tabular-nums">{formatCurrency(t.total)}</span> }, { label: "Gera", value: toOs ? "Ordem de serviço" : "Contrato recorrente" }]} />
      </Modal>
      <Modal
        open={declining}
        onClose={() => setDeclining(false)}
        size="sm"
        title="Marcar como recusado"
        description="O motivo aparece no histórico do cliente e ajuda a precificar o próximo."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeclining(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!reason.trim()}
              disabledReason="Escreva o motivo."
              onClick={() => {
                const before = quote;
                onChange({ ...quote, status: "recusado", note: reason.trim() });
                setDeclining(false);
                notify(`${quote.number} marcado como recusado`, () => onChange(before));
              }}
            >
              Marcar como recusado
            </Button>
          </>
        }
      >
        <TextField label="Motivo" value={reason} onChange={setReason} placeholder="Ex.: preço acima do concorrente" />
      </Modal>
    </Drawer>
  );
}

/* ------------------------------------------------------------------ */
/* Criar orçamento (gaveta)                                            */
/* ------------------------------------------------------------------ */

function NewQuoteDrawer({ open, nextNumber, onClose, onSave }: { open: boolean; nextNumber: string; onClose: () => void; onSave: (q: Quote) => void }) {
  const [clientId, setClientId] = useState("");
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<Quote["kind"]>("Avulso");
  const [valid, setValid] = useState(iso(15));
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [svc, setSvc] = useState(services[0].id);
  const [hours, setHours] = useState<number | null>(4);
  const [price, setPrice] = useState<number | null>(services[0].price);
  const [mat, setMat] = useState("");
  const [matQty, setMatQty] = useState<number | null>(1);
  const [discount, setDiscount] = useState<number | null>(0);
  const [tried, setTried] = useState(false);
  const save = useOperation({ busyLabel: "Salvando…" });
  const valid_ = clientId && title.trim() && items.length;

  const reset = () => {
    setClientId("");
    setTitle("");
    setItems([]);
    setDiscount(0);
    setTried(false);
  };
  const submit = (status: QuoteStatus) => {
    setTried(true);
    if (!valid_) return;
    const q: Quote = { id: `q${Date.now()}`, number: nextNumber, clientId, title: title.trim(), kind, owner: "renata", createdAt: iso(0), validUntil: valid, status, items, discount: (discount ?? 0) / 100 };
    void save.run(() => new Promise((r) => setTimeout(r, 600)), status === "rascunho" ? `${nextNumber} salvo como rascunho` : `${nextNumber} enviado para ${clientById(clientId).email}`).then((err) => {
      if (err) return;
      onSave(q);
      reset();
    });
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      kicker={nextNumber}
      title="Criar orçamento"
      width={600}
      footer={
        <>
          <Button variant="ghost" onClick={() => submit("rascunho")} disabled={save.busy}>
            Salvar rascunho
          </Button>
          <OperationButton operation={save} onClick={() => submit("enviado")}>
            <Send /> Salvar e enviar
          </OperationButton>
        </>
      }
    >
      <div className="space-y-5">
        <OperationFeedback operation={save} />
        <Combobox label="Cliente" placeholder="Busque por nome ou CNPJ" value={clientId} onValueChange={setClientId} options={clients.map((k) => ({ value: k.id, label: k.name, description: `${k.cnpj} · ${k.segment}` }))} error={tried && !clientId ? "Escolha o cliente." : undefined} />
        <TextField label="Título" value={title} onChange={setTitle} placeholder="Ex.: Troca do quadro de distribuição do 2º andar" error={tried && !title.trim() ? "Dê um título que o cliente reconheça." : undefined} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Tipo" value={kind} onValueChange={(v) => setKind(v as Quote["kind"])} options={[{ value: "Avulso", label: "Avulso (vira OS)" }, { value: "Recorrente", label: "Recorrente (vira contrato)" }]} />
          <DatePicker label="Válido até" value={valid} onValueChange={setValid} min={iso(1)} />
        </div>

        <section className="space-y-3 rounded-xl border border-line p-4">
          <Select
            label="Serviço"
            value={svc}
            onValueChange={(v) => {
              setSvc(v);
              setPrice(serviceById(v).price);
            }}
            options={services.map((s) => ({ value: s.id, label: s.name, description: `LC 116 item ${s.code} · ${formatCurrency(s.price)}/${s.unit}` }))}
          />
          <div className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <NumberField label={`Quantidade (${serviceById(svc).unit})`} value={hours} onChange={setHours} min={0.5} step={0.5} digits={1} />
            <NumberField label={`Valor por ${serviceById(svc).unit}`} value={price} onChange={setPrice} min={0} digits={2} suffix="R$" />
            <Button
              variant="ghost"
              disabled={!hours || !price}
              disabledReason="Informe quantidade e valor."
              onClick={() => setItems((all) => [...all, { id: `i${Date.now()}`, kind: "servico", refId: svc, description: serviceById(svc).name, qty: hours ?? 0, price: price ?? 0 }])}
            >
              <Plus /> Adicionar
            </Button>
          </div>
          <div className="grid items-end gap-3 border-t border-line pt-3 sm:grid-cols-[2fr_1fr_auto]">
            <Combobox label="Material" placeholder="Busque no estoque" value={mat} onValueChange={setMat} options={materials.map((m) => ({ value: m.id, label: m.name, description: `${formatCurrency(m.price)}/${m.unit}` }))} />
            <NumberField label="Quantidade" value={matQty} onChange={setMatQty} min={1} />
            <Button
              variant="ghost"
              disabled={!mat || !matQty}
              disabledReason="Escolha o material e a quantidade."
              onClick={() => {
                const m = materials.find((x) => x.id === mat)!;
                setItems((all) => [...all, { id: `i${Date.now()}`, kind: "material", refId: m.id, description: m.name, qty: matQty ?? 1, price: m.price }]);
                setMat("");
              }}
            >
              <Plus /> Adicionar
            </Button>
          </div>
        </section>

        {items.length ? (
          <>
            <ItemsTable items={items} discount={(discount ?? 0) / 100} onRemove={(rid) => setItems((all) => all.filter((i) => i.id !== rid))} />
            <NumberField label="Desconto" value={discount} onChange={setDiscount} min={0} max={30} suffix="%" hint="Até 30 %. Acima disso, peça aprovação da gestora." className="sm:max-w-[220px]" />
          </>
        ) : (
          <p className={tried ? "m-0 rounded-lg border border-dashed border-rose/40 px-4 py-6 text-center text-[13px] text-rose" : "m-0 rounded-lg border border-dashed border-line px-4 py-6 text-center text-[13px] text-muted"}>
            Nenhum item ainda. Adicione horas técnicas ou materiais acima.
          </p>
        )}
      </div>
    </Drawer>
  );
}
