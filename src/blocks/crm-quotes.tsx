import { Check, Copy, FileText, Plus, Send, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  Combobox,
  DataTable,
  DatePicker,
  Drawer,
  Empty,
  EmptyFilterResult,
  EntityMark,
  ErrorState,
  FieldBlock,
  FieldGrid,
  FilterBar,
  IconButton,
  Modal,
  NumberField,
  OperationButton,
  OperationFeedback,
  Page,
  PageHeading,
  PageToolbar,
  PropertyList,
  SavedViews,
  Select,
  Skeleton,
  TableSearch,
  TextField,
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
  notify,
  useFilters,
  useOperation,
  useSavedViews,
  type Column,
  type FilterField,
  type SavedView,
} from "@g4ai/ds";
import {
  companyById,
  contactById,
  daysFromToday,
  dealById,
  deals,
  iso,
  lostReasons,
  me,
  products,
  quoteStatus,
  quoteTotal,
  quotes as seed,
  repById,
  reps,
  today,
  useFrameParam,
  type Quote,
  type QuoteItem,
  type QuoteStatus,
} from "./data/crm";
import { setFrameQuery } from "./shells/frame-route";
import { CrmShell } from "./shells/crm-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Propostas comerciais",
  description: "Cotações do time: rascunho, enviada, aceita e recusada, com valor, validade e visualizações. Linha abre o detalhe em gaveta (?id=) com itens e ações conforme a situação; nova proposta com itens, desconto e validade.",
  category: "CRM",
  order: 10,
  height: 900,
  concept: {
    goal: "Acompanhar as propostas enviadas e agir nas que vencem ou esperam resposta, sem sair da lista.",
    patterns: [
      "Anatomia A · Lista: cabeçalho fixo + PageToolbar colada (visões, filtros, busca)",
      "Situação = ponto + texto (Badge); validade em âmbar perto do vencimento e em rose quando venceu",
      "Detalhe em Drawer pelo endereço (?id=): itens, total, ações que mudam com a situação",
      "Nova proposta em Drawer com itens, desconto e validade (useOperation + OperationButton)",
      "Cinco estados: ?estado=carregando|vazio|erro simula; recorte vazio limpa filtros",
    ],
    adapt: ["Orçamentos (ERP), propostas de contratação (ATS), cotações de compra"],
    avoid: ["Abrir a proposta em outra página só para mudar a situação", "Total sem mostrar desconto e validade"],
  },
} as const;

const here = "#/frame/crm-quotes";
const save = (ms = 700) => new Promise<void>((r) => setTimeout(r, ms));

type Row = Quote & { total: number; company: string };
const toRow = (q: Quote): Row => ({ ...q, total: quoteTotal(q), company: companyById(q.companyId).name });

const fields: FilterField<Row>[] = [
  { key: "status", label: "Situação", type: "enum", quick: true, accessor: (q) => q.status, options: (Object.keys(quoteStatus) as QuoteStatus[]).map((s) => ({ value: s, label: quoteStatus[s].label })) },
  { key: "owner", label: "Responsável", type: "person", quick: true, accessor: (q) => q.owner, options: reps.map((r) => ({ value: r.id, label: r.name })) },
  { key: "total", label: "Valor", type: "currency", accessor: (q) => q.total },
  { key: "validUntil", label: "Validade", type: "date", accessor: (q) => q.validUntil },
];
const systemViews: SavedView[] = [
  { id: "todas", label: "Todas", system: true, state: { query: "", conditions: [] } },
  { id: "minhas", label: "Minhas", system: true, state: { query: "", conditions: [{ id: "v1", field: "owner", op: "is", value: [me] }] } },
  { id: "aguardando", label: "Aguardando resposta", system: true, state: { query: "", conditions: [{ id: "v2", field: "status", op: "is", value: ["enviada"] }] } },
  { id: "rascunhos", label: "Rascunhos", system: true, state: { query: "", conditions: [{ id: "v3", field: "status", op: "is", value: ["rascunho"] }] } },
];

function Validity({ q }: { q: Quote }) {
  const d = daysFromToday(q.validUntil);
  if (q.status !== "enviada" && q.status !== "rascunho") return <span className="tabular-nums text-muted">{formatDate(q.validUntil, { short: true })}</span>;
  if (d < 0) return <span className="font-medium text-rose">Venceu em {formatDate(q.validUntil, { short: true })}</span>;
  if (d <= 3) return <span className="font-medium text-amber">{d === 0 ? "Vence hoje" : `Vence em ${d} ${d === 1 ? "dia" : "dias"}`}</span>;
  return <span className="tabular-nums text-muted">{formatDate(q.validUntil, { short: true })}</span>;
}

export default function CrmQuotes() {
  const id = useFrameParam("id");
  const novo = useFrameParam("novo");
  const negocio = useFrameParam("negocio");
  const estado = useFrameParam("estado");
  const [list, setList] = useState<Row[]>(() => seed.map(toRow));
  const base = estado === "vazio" ? [] : list;
  const filters = useFilters(base, { fields, search: (q) => [q.number, q.company, dealById(q.dealId).title], me, now: today, url: true });
  const views = useSavedViews(filters, systemViews, "crm-propostas-visoes");
  const counts = Object.fromEntries(views.views.map((v) => [v.id, filters.countFor(v.state)]));
  const open = list.find((q) => q.id === id) ?? null;

  const sent = list.filter((q) => q.status === "enviada");
  const answered = list.filter((q) => q.status === "aceita" || q.status === "recusada");
  const expiring = sent.filter((q) => daysFromToday(q.validUntil) <= 3);

  const patch = (qid: string, p: Partial<Quote>) => setList((all) => all.map((q) => (q.id === qid ? toRow({ ...q, ...p }) : q)));

  const columns: Column<Row>[] = [
    {
      key: "company",
      header: "Proposta",
      primary: true,
      cell: (q) => {
        const c = companyById(q.companyId);
        return (
          <span className="flex items-center gap-2.5">
            <EntityMark name={c.name} tint={c.tint} className="h-7 w-7 shrink-0 text-[11px]" />
            <span className="min-w-0">
              <span className="block truncate">{c.name}</span>
              <span className="block truncate font-mono text-[11.5px] font-normal text-muted">{q.number}</span>
            </span>
          </span>
        );
      },
    },
    { key: "deal", header: "Negócio", mobileHidden: true, cell: (q) => <span className="text-ink-soft">{dealById(q.dealId).title}</span> },
    { key: "status", header: "Situação", nowrap: true, cell: (q) => <Badge tone={quoteStatus[q.status].tone}>{quoteStatus[q.status].label}</Badge> },
    { key: "total", header: "Valor", align: "right", nowrap: true, cell: (q) => <span className="font-medium tabular-nums">{formatCurrency(q.total, { cents: false })}</span> },
    { key: "valid", header: "Validade", nowrap: true, cell: (q) => <Validity q={q} /> },
    { key: "views", header: "Aberturas", align: "right", nowrap: true, mobileHidden: true, cell: (q) => (q.status === "rascunho" ? <span className="text-muted">—</span> : <span className="tabular-nums">{formatNumber(q.viewed ?? 0)}</span>) },
    { key: "owner", header: "Responsável", mobileHidden: true, cell: (q) => repById(q.owner).name.split(" ")[0] },
  ];

  return (
    <CrmShell current={here}>
      <Page>
        <PageHeading
          title="Propostas"
          description="Cotações enviadas aos clientes. Proposta aceita move o negócio para Fechamento."
          actions={
            <Button onClick={() => setFrameQuery({ novo: "1" })}>
              <Plus /> Nova proposta
            </Button>
          }
        />
        <PageToolbar>
          <SavedViews views={views} counts={counts} />
          <FilterBar className="mt-3" filters={filters} noun="proposta" search={<TableSearch value={filters.state.query} onChange={filters.setQuery} total={base.length} noun="proposta" searchIn="número, empresa e negócio" />} />
        </PageToolbar>

        <div className="mt-5 space-y-5">
          {estado === "carregando" ? (
            <div className="space-y-2" aria-busy="true" aria-label="Carregando propostas">
              <Skeleton className="h-[76px] w-full rounded-xl" />
              {Array.from({ length: 7 }, (_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg px-2 py-2">
                  <Skeleton className="h-7 w-7 rounded-lg" />
                  <Skeleton className="h-3.5 w-44" />
                  <Skeleton className="ml-auto h-5 w-20 rounded-full" />
                  <Skeleton className="h-3.5 w-24" />
                </div>
              ))}
            </div>
          ) : estado === "erro" ? (
            <ErrorState size="md" title="Não foi possível carregar as propostas" description="Nada foi perdido. Tente de novo em alguns segundos." onRetry={() => setFrameQuery({ estado: undefined })} />
          ) : !base.length ? (
            <Empty
              icon={<FileText />}
              title="Nenhuma proposta ainda"
              hint="Crie a primeira proposta a partir de um negócio em Proposta ou Negociação. Ela fica aqui até o cliente responder."
              action={
                <Button onClick={() => setFrameQuery({ novo: "1" })}>
                  <Plus /> Criar proposta
                </Button>
              }
            />
          ) : (
            <>
              <div className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
                <div className="bg-surface px-4 py-3">
                  <div className="text-[12px] text-muted">Aguardando resposta</div>
                  <div className="mt-0.5 text-[18px] font-semibold tabular-nums tracking-tight">{formatCurrency(sent.reduce((s, q) => s + q.total, 0), { cents: false })}</div>
                  <div className="text-[12px] text-muted">{sent.length} propostas enviadas</div>
                </div>
                <div className="bg-surface px-4 py-3">
                  <div className="text-[12px] text-muted">Taxa de aceite</div>
                  <div className="mt-0.5 text-[18px] font-semibold tabular-nums tracking-tight">{formatPercent(answered.length ? answered.filter((q) => q.status === "aceita").length / answered.length : 0, 0)}</div>
                  <div className="text-[12px] text-muted">das {answered.length} respondidas no trimestre</div>
                </div>
                <div className="bg-surface px-4 py-3">
                  <div className="text-[12px] text-muted">Vencendo em até 3 dias</div>
                  <div className={expiring.length ? "mt-0.5 text-[18px] font-semibold tabular-nums tracking-tight text-amber" : "mt-0.5 text-[18px] font-semibold tabular-nums tracking-tight"}>{expiring.length}</div>
                  <div className="text-[12px] text-muted">renove ou cobre resposta</div>
                </div>
              </div>
              <DataTable
                rows={filters.rows}
                columns={columns}
                rowKey={(q) => q.id}
                onRowClick={(q) => setFrameQuery({ id: q.id })}
                rowLabel={(q) => `Abrir proposta ${q.number}`}
                empty={<EmptyFilterResult filters={filters} noun="proposta" gender="f" />}
              />
            </>
          )}
        </div>
      </Page>

      {open && <QuoteDrawer key={open.id} quote={open} onClose={() => setFrameQuery({ id: undefined })} onPatch={patch} />}
      <NewQuoteDrawer
        open={!!novo}
        dealId={negocio ?? undefined}
        onClose={() => setFrameQuery({ novo: undefined, negocio: undefined })}
        onCreate={(q) => {
          setList((all) => [toRow(q), ...all]);
          setFrameQuery({ novo: undefined, negocio: undefined, id: q.id });
        }}
        nextNumber={`PRP-2026-${String(43 + list.length - seed.length).padStart(3, "0")}`}
      />
    </CrmShell>
  );
}

/* ------------------------------------------------------------------ */
/* Detalhe da proposta (gaveta)                                        */
/* ------------------------------------------------------------------ */

function QuoteDrawer({ quote: q, onClose, onPatch }: { quote: Row; onClose: () => void; onPatch: (id: string, p: Partial<Quote>) => void }) {
  const c = companyById(q.companyId);
  const deal = dealById(q.dealId);
  const contact = q.contactId ? contactById(q.contactId) : null;
  const owner = repById(q.owner);
  const subtotal = q.items.reduce((s, i) => s + i.qty * i.price, 0);
  const op = useOperation({ busyLabel: q.status === "rascunho" ? "Enviando…" : "Registrando…" });
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState(lostReasons[0].label);
  const expired = q.status === "enviada" && daysFromToday(q.validUntil) < 0;

  const send = () => op.run(() => save(), `Proposta ${q.number} enviada para ${contact?.name.split(" ")[0] ?? c.name}`, { apply: () => onPatch(q.id, { status: "enviada", sentAt: iso(0), viewed: 0 }), revert: () => onPatch(q.id, { status: "rascunho" }) });
  const accept = () => op.run(() => save(), { message: `Proposta aceita · ${c.name} foi para Fechamento`, undo: () => onPatch(q.id, { status: "enviada" }) }, { apply: () => onPatch(q.id, { status: "aceita" }), revert: () => onPatch(q.id, { status: "enviada" }) });
  const renew = () => op.run(() => save(), `Validade renovada até ${formatDate(iso(15))}`, { apply: () => onPatch(q.id, { validUntil: iso(15) }), revert: () => onPatch(q.id, { validUntil: q.validUntil }) });

  return (
    <>
      <Drawer
        open
        onClose={onClose}
        width={560}
        kicker={q.number}
        title={c.name}
        footer={
          <>
            {q.status === "rascunho" && (
              <OperationButton operation={op} onClick={send} disabled={!contact} disabledReason="Vincule um contato ao negócio para enviar.">
                <Send /> Enviar proposta
              </OperationButton>
            )}
            {q.status === "enviada" && (
              <>
                <Button variant="ghost" onClick={() => setDeclining(true)}>
                  <X /> Registrar recusa
                </Button>
                {expired ? (
                  <OperationButton operation={op} onClick={renew}>
                    Renovar validade
                  </OperationButton>
                ) : (
                  <OperationButton operation={op} onClick={accept}>
                    <Check /> Registrar aceite
                  </OperationButton>
                )}
              </>
            )}
            {(q.status === "aceita" || q.status === "recusada") && (
              <Button variant={q.status === "aceita" ? "primary" : "ghost"} href={`#/frame/crm-deal?id=${deal.id}`}>
                Abrir negócio
              </Button>
            )}
          </>
        }
      >
        <div className="space-y-6">
          <OperationFeedback operation={op} />
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={quoteStatus[q.status].tone}>{quoteStatus[q.status].label}</Badge>
            <span className="text-[12.5px]">
              <Validity q={q} />
            </span>
            <Button
              size="sm"
              variant="quiet"
              className="ml-auto"
              onClick={() => {
                void navigator.clipboard?.writeText(`https://propostas.acme.com.br/${q.number}`);
                notify("Link da proposta copiado");
              }}
            >
              <Copy /> Copiar link
            </Button>
          </div>
          {q.status === "recusada" && q.lostReason && <p className="m-0 rounded-lg bg-rose-soft px-3 py-2 text-[13px] text-ink-soft">Motivo da recusa: {q.lostReason}</p>}
          <PropertyList
            items={[
              { label: "Negócio", value: <a className="font-medium hover:underline" href={`#/frame/crm-deal?id=${deal.id}`}>{deal.title}</a> },
              {
                label: "Contato",
                value: contact ? (
                  <a className="inline-flex items-center gap-1.5 hover:underline" href={`#/frame/crm-contact?id=${contact.id}`}>
                    <Avatar initials={contact.initials} tint={contact.tint} size="sm" name={contact.name} />
                    {contact.name}
                  </a>
                ) : undefined,
              },
              { label: "Responsável", value: owner.name },
              { label: "Criada em", value: formatDate(q.created) },
              { label: "Enviada em", value: q.sentAt ? formatDate(q.sentAt) : undefined, hint: q.sentAt ? `aberta ${q.viewed ?? 0} ${q.viewed === 1 ? "vez" : "vezes"} pelo cliente` : undefined },
              { label: "Condições", value: q.terms },
            ]}
          />
          <section aria-label="Itens da proposta">
            <h3 className="m-0 mb-2 text-[13px] font-medium">Itens</h3>
            <ul className="m-0 list-none divide-y divide-line rounded-xl border border-line bg-surface p-0 text-[13px]">
              {q.items.map((i) => (
                <li key={i.id} className="flex items-start justify-between gap-3 px-4 py-2.5">
                  <span className="min-w-0">
                    <span className="block">{i.description}</span>
                    <span className="block text-[12px] text-muted">
                      {formatNumber(i.qty)} × {formatCurrency(i.price)}
                    </span>
                  </span>
                  <span className="shrink-0 font-medium tabular-nums">{formatCurrency(i.qty * i.price, { cents: false })}</span>
                </li>
              ))}
              <li className="space-y-1 bg-soft/40 px-4 py-3">
                <div className="flex justify-between text-muted">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{formatCurrency(subtotal, { cents: false })}</span>
                </div>
                {q.discount > 0 && (
                  <div className="flex justify-between text-muted">
                    <span>Desconto ({formatPercent(q.discount, 0)})</span>
                    <span className="tabular-nums">− {formatCurrency(subtotal * q.discount, { cents: false })}</span>
                  </div>
                )}
                <div className="flex justify-between text-[15px] font-semibold">
                  <span>Total</span>
                  <span className="tabular-nums">{formatCurrency(q.total, { cents: false })}</span>
                </div>
              </li>
            </ul>
          </section>
        </div>
      </Drawer>
      <Modal
        open={declining}
        onClose={() => setDeclining(false)}
        size="sm"
        title="Registrar recusa"
        description="O motivo alimenta o relatório “Por que perdemos?” do painel."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeclining(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setDeclining(false);
                onPatch(q.id, { status: "recusada", lostReason: reason });
                notify(`Recusa registrada · ${q.number}`, () => onPatch(q.id, { status: "enviada", lostReason: undefined }));
              }}
            >
              Registrar recusa
            </Button>
          </>
        }
      >
        <FieldBlock label="Motivo">
          <Select label="Motivo" value={reason} onValueChange={setReason} options={lostReasons.map((r) => ({ value: r.label, label: r.label }))} />
        </FieldBlock>
      </Modal>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Nova proposta (gaveta)                                              */
/* ------------------------------------------------------------------ */

function NewQuoteDrawer({ open, dealId, nextNumber, onClose, onCreate }: { open: boolean; dealId?: string; nextNumber: string; onClose: () => void; onCreate: (q: Quote) => void }) {
  const [deal, setDeal] = useState(dealId ?? "");
  const [valid, setValid] = useState(iso(15));
  const [discount, setDiscount] = useState<number | null>(0);
  const [terms, setTerms] = useState("Pagamento mensal · 12 meses");
  const [items, setItems] = useState<QuoteItem[]>([{ id: "n1", description: products[0].label, qty: 10, price: products[0].price }]);
  const [tried, setTried] = useState(false);
  const op = useOperation();
  useEffect(() => {
    if (open) setDeal(dealId ?? "");
  }, [open, dealId]);

  const options = useMemo(() => deals.map((d) => ({ value: d.id, label: d.title, description: companyById(d.companyId).name })), []);
  const total = quoteTotal({ items, discount: (discount ?? 0) / 100 });
  const errors = { deal: !deal ? "Escolha o negócio." : undefined, items: items.some((i) => !i.qty) ? "Informe a quantidade de cada item." : undefined };

  const setItem = (id: string, p: Partial<QuoteItem>) => setItems((all) => all.map((i) => (i.id === id ? { ...i, ...p } : i)));
  const submit = async () => {
    setTried(true);
    if (errors.deal || errors.items) return;
    const d = dealById(deal);
    const q: Quote = { id: `q${Date.now()}`, number: nextNumber, dealId: d.id, companyId: d.companyId, contactId: d.contactIds[0], owner: me, status: "rascunho", created: iso(0), validUntil: valid, discount: (discount ?? 0) / 100, items, terms };
    const failed = await op.run(() => save(), `Proposta ${q.number} salva como rascunho`);
    if (!failed) {
      onCreate(q);
      setTried(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={600}
      kicker={nextNumber}
      title="Nova proposta"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <OperationButton operation={op} onClick={submit}>
            Salvar rascunho
          </OperationButton>
        </>
      }
    >
      <div className="space-y-5">
        <OperationFeedback operation={op} />
        <Combobox label="Negócio" value={deal} onValueChange={(v: string) => setDeal(v)} options={options} placeholder="Buscar negócio ou empresa…" error={tried ? errors.deal : undefined} />
        <section aria-label="Itens">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="m-0 text-[13px] font-medium">Itens</h3>
            <Button size="sm" variant="quiet" onClick={() => setItems((all) => [...all, { id: `n${Date.now()}`, description: products[1].label, qty: 1, price: products[1].price }])}>
              <Plus /> Adicionar item
            </Button>
          </div>
          <ul className="m-0 list-none space-y-2 p-0">
            {items.map((i, idx) => (
              <li key={i.id} className="grid items-end gap-2 rounded-xl border border-line bg-surface p-3 sm:grid-cols-[minmax(0,1fr)_110px_auto]">
                <Select
                  label={`Produto do item ${idx + 1}`}
                  value={products.find((p) => p.label === i.description)?.id ?? products[0].id}
                  onValueChange={(v) => {
                    const p = products.find((x) => x.id === v) ?? products[0];
                    setItem(i.id, { description: p.label, price: p.price });
                  }}
                  options={products.map((p) => ({ value: p.id, label: p.label, description: formatCurrency(p.price, { cents: false }) }))}
                />
                <NumberField label="Quantidade" value={i.qty} onChange={(v) => setItem(i.id, { qty: v ?? 0 })} min={1} />
                <IconButton label={`Remover item ${idx + 1}`} disabled={items.length === 1} onClick={() => setItems((all) => all.filter((x) => x.id !== i.id))}>
                  <Trash2 />
                </IconButton>
              </li>
            ))}
          </ul>
          {tried && errors.items && <p className="m-0 mt-2 text-[12.5px] text-rose">{errors.items}</p>}
        </section>
        <FieldGrid>
          <NumberField label="Desconto" value={discount} onChange={setDiscount} min={0} max={30} step={0.5} digits={1} suffix="%" hint="Acima de 15 % pede aprovação da diretoria." />
          <FieldBlock label="Válida até">
            <DatePicker label="Válida até" value={valid} onValueChange={setValid} min={iso(1)} />
          </FieldBlock>
        </FieldGrid>
        <TextField label="Condições de pagamento" value={terms} onChange={setTerms} />
        <div className="flex items-baseline justify-between rounded-xl bg-soft px-4 py-3">
          <span className="text-[13px] text-muted">Total da proposta</span>
          <span className="text-[18px] font-semibold tabular-nums">{formatCurrency(total, { cents: false })}</span>
        </div>
      </div>
    </Drawer>
  );
}
