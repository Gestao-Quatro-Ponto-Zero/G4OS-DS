import { Banknote, Check, Copy, Handshake, Link2, QrCode, Send } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Badge,
  BulkBar,
  Button,
  Callout,
  CurrencyField,
  DataTable,
  DatePicker,
  Drawer,
  Empty,
  EmptyFilterResult,
  FilterBar,
  Highlight,
  Modal,
  OperationButton,
  OperationFeedback,
  Page,
  PageHeading,
  PageToolbar,
  PropertyList,
  Select,
  StatCell,
  StatGrid,
  Switch,
  TableSearch,
  Tabs,
  Timeline,
  formatCurrency,
  formatDate,
  notify,
  selectionColumn,
  useFilters,
  useOperation,
  useSelection,
  type Column,
  type FilterField,
  type TimelineItem,
} from "@g4ai/ds";
import { bankLines, chargeById, chargeState, charges as seed, clientById, clients, daysFrom, dm, dunningSteps, iso, isOverdue, todayIso, type Charge } from "./data/servicos";
import { frameHref, setFrameQuery, useFrameParam } from "./shells/frame-route";
import { LoadError, LoadingTable, ServicosShell, useListState } from "./shells/servicos-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Cobranças (boleto e Pix)",
  description: "Boletos e Pix gerados por mensalidades e OS: a vencer, vencidos e pagos, com régua de cobrança automática (D-3, D0, D+1, D+7, D+15), envio de 2ª via em lote, registro de pagamento e conciliação simples do extrato. Cobrança abre em gaveta (?id=).",
  category: "Serviços",
  order: 7,
  height: 960,
  concept: {
    goal: "Receber no prazo sem cobrar na mão: a régua faz os lembretes, a pessoa só age nas exceções (vencidas, acordo, extrato sem dono).",
    patterns: [
      "Anatomia A · Lista: cabeçalho fixo + PageToolbar colada (abas, filtros, busca)",
      "Vencida em palavra com dias de atraso; seleção em massa com BulkBar para “Enviar 2ª via”",
      "Cobrança em Drawer (?id=): Pix copia e cola, linha digitável e a régua em Timeline (enviado, próximo, pendente)",
      "Régua de cobrança configurável por passo (Switch); D+15 vira tarefa, nunca suspensão automática",
      "Conciliação simples: crédito do extrato com a cobrança provável; confirmar baixa o título",
      "Cinco estados: ?estado=carregando|vazio|erro simula; vazio por filtro com Limpar",
    ],
    adapt: [
      "Contas a receber de escola, condomínio, academia; cobrança de assinatura",
    ],
    avoid: [
      "Lembrete agressivo antes do vencimento",
      "Baixa manual sem registrar data e valor recebido",
    ],
  },
} as const;

type Tab = "abertas" | "vencidas" | "pagas" | "todas" | "conciliacao" | "regua";

const fields: FilterField<Charge>[] = [
  { key: "method", label: "Forma", type: "enum", quick: true, accessor: (b) => b.method, options: ["Boleto", "Pix"].map((v) => ({ value: v, label: v })) },
  { key: "client", label: "Cliente", type: "enum", quick: true, accessor: (b) => b.clientId, options: clients.map((k) => ({ value: k.id, label: k.name })) },
  { key: "value", label: "Valor", type: "currency", accessor: (b) => b.value },
  { key: "due", label: "Vencimento", type: "date", accessor: (b) => b.due },
];
const searchText = (b: Charge) => [b.number, b.description, clientById(b.clientId).name, clientById(b.clientId).cnpj.replace(/\D/g, "")];
const digitavel = (b: Charge) => `34191.79001 01043.510047 91020.150008 ${b.number.slice(-1)} ${String(Math.round(b.value * 100)).padStart(10, "0")}`;
const pixCode = (b: Charge) => `00020126580014br.gov.bcb.pix0136vertice-${b.number.toLowerCase()}5204000053039865406${Math.floor(b.value)}.${String(Math.round((b.value % 1) * 100)).padStart(2, "0")}5802BR`;

export default function SrvBilling() {
  const estado = useListState();
  const id = useFrameParam("id");
  const aba = useFrameParam("aba");
  const [list, setList] = useState<Charge[]>(() => (estado === "vazio" ? [] : seed));
  const [tab, setTab] = useState<Tab>(aba === "vencidas" || aba === "conciliacao" || aba === "regua" || aba === "pagas" ? aba : chargeById(id)?.status === "paga" ? "todas" : "abertas");
  const tabRows = useMemo(() => {
    if (tab === "abertas") return list.filter((b) => b.status === "aberta" && !isOverdue(b));
    if (tab === "vencidas") return list.filter(isOverdue);
    if (tab === "pagas") return list.filter((b) => b.status === "paga");
    return list;
  }, [list, tab]);
  const filters = useFilters(tabRows, { fields, search: searchText });
  const q = filters.state.query;
  const sel = useSelection(filters.rows.map((b) => b.id));
  const send = useOperation({ busyLabel: "Enviando…" });
  const opened = list.find((b) => b.id === id);

  const overdue = list.filter(isOverdue);
  const open = list.filter((b) => b.status === "aberta" && !isOverdue(b));
  const paid = list.filter((b) => b.status === "paga");
  const paidOnTime = paid.filter((b) => b.paidAt && b.paidAt <= b.due).length;
  const update = (next: Charge) => setList((all) => all.map((b) => (b.id === next.id ? next : b)));
  const isList = tab !== "conciliacao" && tab !== "regua";

  const sendSecond = (rows: Charge[]) => {
    const targets = rows.filter((b) => b.status === "aberta");
    if (!targets.length) return notify("Só cobranças em aberto recebem 2ª via", undefined, "info");
    void send.run(() => new Promise((r) => setTimeout(r, 700)), `2ª via enviada para ${targets.length === 1 ? clientById(targets[0].clientId).name : `${targets.length} clientes`} por e-mail e WhatsApp`).then((err) => !err && sel.clear());
  };

  const columns: Column<Charge>[] = [
    selectionColumn<Charge>(sel, (b) => b.id, (b) => b.number),
    {
      key: "client",
      header: "Cliente",
      primary: true,
      cell: (b) => (
        <span className="block min-w-0">
          <span className="block truncate font-medium">
            <Highlight text={clientById(b.clientId).name} query={q} />
          </span>
          <span className="block truncate text-[11.5px] text-muted">
            <span className="font-mono">
              <Highlight text={b.number} query={q} />
            </span>{" "}
            · <Highlight text={b.description} query={q} />
          </span>
        </span>
      ),
    },
    { key: "method", header: "Forma", nowrap: true, mobileHidden: true, cell: (b) => <span className="text-muted">{b.method}</span> },
    { key: "due", header: "Vencimento", nowrap: true, cell: (b) => <span className="tabular-nums">{formatDate(b.due, { short: true })}</span> },
    { key: "value", header: "Valor", align: "right", nowrap: true, cell: (b) => <span className="font-medium tabular-nums">{formatCurrency(b.value)}</span>, footer: <span className="font-semibold tabular-nums">{formatCurrency(filters.rows.reduce((s, b) => s + b.value, 0), { cents: false })}</span> },
    { key: "state", header: "Situação", nowrap: true, cell: (b) => <Badge tone={chargeState(b).tone}>{chargeState(b).label}</Badge> },
  ];

  return (
    <ServicosShell section="cobrancas">
      <Page>
        <PageHeading
          title="Cobranças"
          description="Boletos e Pix registrados no Itaú. A régua envia os lembretes sozinha; aqui ficam as exceções."
          actions={
            <OperationButton operation={send} variant="ghost" onClick={() => sendSecond(overdue)} disabled={!overdue.length} disabledReason="Nenhuma cobrança vencida.">
              <Send /> Enviar 2ª via das vencidas
            </OperationButton>
          }
        />
        <OperationFeedback operation={send} />
        {estado !== "carregando" && estado !== "erro" && list.length > 0 && (
          <StatGrid cols={4}>
            <StatCell label="A vencer em 30 dias" value={formatCurrency(open.reduce((s, b) => s + b.value, 0), { cents: false })} hint={`${open.length} cobranças`} />
            <StatCell label="Vencido" value={formatCurrency(overdue.reduce((s, b) => s + b.value, 0), { cents: false })} hint={`${overdue.length} cobranças · ${new Set(overdue.map((b) => b.clientId)).size} clientes`} tone={overdue.length ? "bad" : undefined} />
            <StatCell label="Recebido em setembro" value={formatCurrency(paid.reduce((s, b) => s + b.value, 0), { cents: false })} hint={`${paidOnTime} de ${paid.length} no prazo`} />
            <StatCell label="Extrato a conciliar" value={bankLines.length} hint="créditos de hoje e ontem" tone={bankLines.length ? "warn" : undefined} />
          </StatGrid>
        )}
        <PageToolbar className="mt-6">
          <Tabs
            label="Cobranças"
            value={tab}
            onChange={(v) => {
              setTab(v as Tab);
              sel.clear();
            }}
            items={[
              { id: "abertas", label: "A vencer" },
              { id: "vencidas", label: "Vencidas", count: overdue.length || undefined },
              { id: "pagas", label: "Pagas" },
              { id: "todas", label: "Todas" },
              { id: "conciliacao", label: "Conciliação", count: bankLines.length || undefined },
              { id: "regua", label: "Régua de cobrança" },
            ]}
          />
          {isList && estado !== "carregando" && estado !== "erro" && list.length > 0 && <FilterBar className="mt-3" filters={filters} noun="cobrança" search={<TableSearch value={q} onChange={filters.setQuery} total={tabRows.length} noun="cobrança" searchIn="número, cliente, CNPJ e descrição" />} />}
        </PageToolbar>
        <div className="mt-4">
          {estado === "carregando" ? (
            <LoadingTable label="Carregando cobranças" />
          ) : estado === "erro" ? (
            <LoadError what="as cobranças" />
          ) : tab === "regua" ? (
            <Dunning />
          ) : tab === "conciliacao" ? (
            <Reconciliation charges={list} onMatch={(b) => update({ ...b, status: "paga", paidAt: todayIso })} />
          ) : !list.length ? (
            <Empty title="Nenhuma cobrança gerada" hint="As cobranças nascem das mensalidades dos contratos e das OS faturadas. Fature uma OS concluída para gerar a primeira." action={<Button href={frameHref("srv-invoices")}>Ver notas a emitir</Button>} />
          ) : (
            <>
              <DataTable
                label="Cobranças"
                rows={filters.rows}
                columns={columns}
                rowKey={(b) => b.id}
                rowLabel={(b) => `Abrir cobrança ${b.number}`}
                onRowClick={(b) => setFrameQuery({ id: b.id })}
                rowSelected={(b) => sel.has(b.id) || b.id === id}
                rowTone={(b) => (isOverdue(b) && -daysFrom(b.due) > 15 ? "bad" : isOverdue(b) ? "warn" : undefined)}
                footerLabel="Total"
                empty={tab === "vencidas" && !filters.active.length && !q ? <Empty framed={false} title="Nenhuma cobrança vencida" hint="Todos os clientes estão em dia. A régua continua acompanhando os próximos vencimentos." /> : <EmptyFilterResult filters={filters} noun="cobrança" gender="f" />}
              />
              <BulkBar count={sel.count} noun="cobrança" gender="f" onClear={sel.clear}>
                <button type="button" onClick={() => sendSecond(list.filter((b) => sel.has(b.id)))}>
                  <Send /> Enviar 2ª via
                </button>
              </BulkBar>
            </>
          )}
        </div>
      </Page>
      {opened && <ChargeDrawer key={opened.id} b={opened} onChange={update} />}
    </ServicosShell>
  );
}

function ChargeDrawer({ b, onChange }: { b: Charge; onChange: (b: Charge) => void }) {
  const k = clientById(b.clientId);
  const second = useOperation({ busyLabel: "Enviando…" });
  const [paying, setPaying] = useState(false);
  const [paidAt, setPaidAt] = useState(todayIso);
  const [paidValue, setPaidValue] = useState<number | null>(b.value);
  const close = () => setFrameQuery({ id: undefined });
  const state = chargeState(b);

  const steps: TimelineItem[] = dunningSteps.map((s) => {
    const when = iso(daysFrom(b.due) + s.offset);
    const sent = b.status === "paga" ? (b.paidAt ?? todayIso) > when && when <= todayIso : when <= todayIso;
    const next = !sent && b.status === "aberta" && dunningSteps.find((x) => iso(daysFrom(b.due) + x.offset) > todayIso)?.id === s.id;
    return {
      id: s.id,
      leading: (
        <span className="block leading-tight">
          <span className="block font-medium">{s.label}</span>
          <span className="block text-[11.5px] text-muted">{dm(when)}</span>
        </span>
      ),
      title: s.title,
      meta: b.status === "paga" && !sent ? "Não enviado · paga antes" : sent ? `Enviado · ${s.channel}` : next ? `Próximo · ${s.channel}` : s.channel,
      tone: sent ? (s.offset > 0 ? "warn" : "neutral") : undefined,
      current: next,
    };
  });

  return (
    <Drawer
      open
      onClose={close}
      kicker={`${b.number} · ${b.method}`}
      title={k.name}
      width={540}
      footer={
        b.status === "aberta" ? (
          <>
            <Button variant="ghost" onClick={() => setPaying(true)}>
              <Banknote /> Registrar pagamento
            </Button>
            <OperationButton operation={second} onClick={() => void second.run(() => new Promise((r) => setTimeout(r, 600)), `2ª via de ${b.number} enviada para ${k.email} e WhatsApp`)}>
              <Send /> Enviar 2ª via
            </OperationButton>
          </>
        ) : undefined
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={state.tone}>{state.label}</Badge>
          <span className="text-[12.5px] text-muted">{b.description}</span>
        </div>
        <OperationFeedback operation={second} />
        {b.agreement && (
          <Callout tone="warn" title="Acordo em negociação" action={<Button size="sm" variant="ghost" onClick={() => notify(`Proposta de acordo enviada para ${k.contact}`)}><Handshake /> Reenviar proposta</Button>}>
            {b.agreement}. Contrato suspenso até a primeira parcela.
          </Callout>
        )}
        <div className="text-[25px] font-semibold tabular-nums tracking-tight">{formatCurrency(b.value)}</div>
        <PropertyList
          items={[
            { label: "Vencimento", value: formatDate(b.due), hint: isOverdue(b) ? `${-daysFrom(b.due)} dias de atraso · multa 2 % + juros 1 % a.m.` : undefined },
            { label: "Pago em", value: b.paidAt ? formatDate(b.paidAt) : undefined },
            { label: "Cliente", value: <a className="hover:underline" href={frameHref("srv-client", k.id)}>{k.name}</a>, hint: `${k.contact} · ${k.phone}` },
            { label: "Origem", value: b.contractId ? <a className="hover:underline" href={frameHref("srv-contracts", b.contractId)}>Contrato</a> : b.invoiceId ? <a className="hover:underline" href={frameHref("srv-invoices", b.invoiceId)}>NFS-e</a> : "Avulsa" },
          ]}
        />
        {b.status === "aberta" && (
          <section className="space-y-2 rounded-xl border border-line p-3">
            <div className="flex items-center gap-2 text-[12.5px] font-medium">
              <QrCode className="h-4 w-4 text-muted" aria-hidden /> {b.method === "Pix" ? "Pix copia e cola" : "Linha digitável"}
            </div>
            <p className="m-0 break-all rounded-lg bg-soft px-3 py-2 font-mono text-[11.5px] text-ink-soft">{b.method === "Pix" ? pixCode(b) : digitavel(b)}</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="ghost" onClick={() => notify("Código copiado", undefined, "info")}>
                <Copy /> Copiar código
              </Button>
              <Button size="sm" variant="ghost" onClick={() => notify(`Link de pagamento copiado: pag.vertice.com.br/${b.number.toLowerCase()}`, undefined, "info")}>
                <Link2 /> Copiar link de pagamento
              </Button>
            </div>
          </section>
        )}
        <section>
          <h3 className="m-0 mb-3 text-[13px] font-medium">Régua de cobrança</h3>
          <Timeline items={steps} leadingWidth={64} />
        </section>
      </div>
      <Modal
        open={paying}
        onClose={() => setPaying(false)}
        size="sm"
        title="Registrar pagamento"
        description="Use quando o cliente pagou fora do boleto/Pix registrado (TED, depósito, dinheiro). A régua para na hora."
        footer={
          <>
            <Button variant="ghost" onClick={() => setPaying(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!paidValue}
              disabledReason="Informe o valor recebido."
              onClick={() => {
                onChange({ ...b, status: "paga", paidAt });
                setPaying(false);
                notify(`${b.number} baixada · ${formatCurrency(paidValue ?? 0)} recebidos`, () => onChange(b));
              }}
            >
              <Check /> Registrar pagamento
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <DatePicker label="Data do pagamento" value={paidAt} onValueChange={setPaidAt} max={todayIso} />
          <CurrencyField label="Valor recebido" value={paidValue} onChange={setPaidValue} hint={paidValue && paidValue < b.value ? `Faltam ${formatCurrency(b.value - paidValue)}: fica um saldo em aberto.` : undefined} />
        </div>
      </Modal>
    </Drawer>
  );
}

function Dunning() {
  const [on, setOn] = useState<Record<string, boolean>>({ "d-3": true, d0: true, "d+1": true, "d+7": true, "d+15": false });
  return (
    <section className="rounded-xl border border-line bg-surface">
      <header className="border-b border-line px-4 py-3">
        <h2 className="m-0 text-[14px] font-medium">Régua de cobrança automática</h2>
        <p className="m-0 mt-1 text-[12.5px] text-muted">Vale para todas as cobranças em aberto. Mudanças salvam na hora.</p>
      </header>
      <ul className="m-0 list-none divide-y divide-line p-0">
        {dunningSteps.map((s) => (
          <li key={s.id} className="flex items-center gap-4 px-4 py-3">
            <span className="w-12 shrink-0 font-mono text-[12.5px] font-medium">{s.label}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13.5px]">{s.title}</span>
              <span className="block text-[12px] text-muted">{s.channel}</span>
            </span>
            <Switch
              label={`${s.label} · ${s.title}`}
              hideLabel
              checked={on[s.id]}
              onCheckedChange={(v) => {
                setOn((x) => ({ ...x, [s.id]: v }));
                notify(`${s.label} ${v ? "ligado" : "desligado"} na régua`, () => setOn((x) => ({ ...x, [s.id]: !v })));
              }}
            />
          </li>
        ))}
      </ul>
      <p className="m-0 border-t border-line px-4 py-3 text-[12px] text-muted">D+15 cria uma tarefa para o financeiro decidir a suspensão; o contrato nunca é suspenso sozinho.</p>
    </section>
  );
}

function Reconciliation({ charges, onMatch }: { charges: Charge[]; onMatch: (b: Charge) => void }) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [manual, setManual] = useState<Record<string, string>>({});
  const openCharges = charges.filter((b) => b.status === "aberta");
  const pending = bankLines.filter((l) => !done[l.id]);
  if (!pending.length) return <Empty title="Extrato conciliado" hint="Todos os créditos de hoje e ontem foram vinculados a uma cobrança." />;
  return (
    <ul className="m-0 list-none space-y-3 p-0" aria-label="Créditos do extrato">
      {pending.map((l) => {
        const guess = charges.find((b) => b.id === (manual[l.id] || l.match));
        const exact = guess && guess.value === l.value;
        return (
          <li key={l.id} className="grid gap-4 rounded-xl border border-line bg-surface p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center">
            <div className="min-w-0">
              <div className="text-[12px] text-muted">Itaú · {formatDate(l.date, { short: true })}</div>
              <div className="truncate font-mono text-[12.5px]">{l.description}</div>
              <div className="text-[15px] font-semibold tabular-nums">{formatCurrency(l.value)}</div>
            </div>
            <div className="min-w-0">
              {l.match && !manual[l.id] && guess ? (
                <>
                  <div className="text-[12px] text-muted">Cobrança provável {exact ? "· valor exato" : ""}</div>
                  <div className="truncate text-[13.5px]">
                    {guess.number} · {clientById(guess.clientId).name}
                  </div>
                  <div className="text-[12px] tabular-nums text-muted">
                    {formatCurrency(guess.value)} · vence {formatDate(guess.due, { short: true })}
                  </div>
                </>
              ) : (
                <Select label="Vincular à cobrança" value={manual[l.id] ?? ""} onValueChange={(v) => setManual((m) => ({ ...m, [l.id]: v }))} placeholder="Nenhuma cobrança com esse valor" options={openCharges.map((b) => ({ value: b.id, label: `${b.number} · ${clientById(b.clientId).name}`, description: `${formatCurrency(b.value)} · vence ${formatDate(b.due, { short: true })}` }))} />
              )}
            </div>
            <Button
              variant="ghost"
              disabled={!guess}
              disabledReason="Escolha a cobrança deste crédito."
              onClick={() => {
                if (!guess) return;
                onMatch(guess);
                setDone((d) => ({ ...d, [l.id]: true }));
                notify(`${guess.number} baixada pelo extrato`, () => setDone((d) => ({ ...d, [l.id]: false })));
              }}
            >
              <Check /> Confirmar baixa
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
