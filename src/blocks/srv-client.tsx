import { FilePlus2, MessageSquare, Receipt, Send, Wrench } from "lucide-react";
import { useState } from "react";
import {
  ActionMenu,
  Badge,
  Button,
  Callout,
  DataTable,
  Drawer,
  Empty,
  EntityMark,
  LocationTag,
  OperationButton,
  OperationFeedback,
  Page,
  PageHeading,
  PropertyList,
  SplitLayout,
  StatCell,
  StatGrid,
  Switch,
  Tabs,
  TextField,
  TextareaField,
  Timeline,
  formatCurrency,
  formatDate,
  notify,
  useOperation,
  type Column,
  type TimelineItem,
} from "@g4ai/ds";
import {
  charges,
  chargeState,
  clientById,
  clientMrr,
  clientStatus,
  contractStatus,
  contracts,
  invoiceStatus,
  invoices,
  isOpen,
  isOverdue,
  openBalance,
  overdueBalance,
  priorityInfo,
  quoteStatus,
  quoteTotals,
  quotes,
  slaOf,
  techById,
  woStageLabel,
  workOrders,
  type Charge,
  type Client,
  type WorkOrder,
} from "./data/servicos";
import { frameHref, go, useFrameParam } from "./shells/frame-route";
import { ServicosShell } from "./shells/servicos-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Cliente do ERP de serviços",
  description: "Registro do cliente (?id=): receita recorrente, saldo em aberto e vencido, contratos, ordens de serviço, orçamentos, notas e cobranças, anotações da equipe e dados cadastrais (CNPJ, ISS retido, endereço com hora local). Edição em gaveta.",
  category: "Serviços",
  order: 10,
  height: 1050,
  concept: {
    goal: "Antes de ligar para o cliente, saber tudo em um lugar: o que ele paga, o que está aberto, o que deve e o que a equipe combinou.",
    patterns: [
      "Anatomia C · Registro: trilha para Clientes, ação primária Abrir OS, resto no menu ⋯; dados cadastrais fixos na coluna",
      "Faixa de números (StatGrid) com recorrente, em aberto, vencido e OS abertas",
      "Abas: Ordens de serviço, Contratos e orçamentos, Financeiro (notas + cobranças), Anotações (Timeline)",
      "Inadimplente vira Callout com a saída (enviar 2ª via, ver cobranças)",
      "Editar cadastro em Drawer; ISS retido como Switch com explicação",
    ],
    adapt: [
      "Página do condomínio numa administradora, do paciente numa clínica, do aluno numa escola",
    ],
    avoid: [
      "Herdar o cabeçalho da lista (registro tem o próprio)",
      "Saldo devedor escondido numa aba",
    ],
  },
} as const;

export default function SrvClient() {
  const id = useFrameParam("id", "k1");
  return <ClientRecord key={id} initial={clientById(id)} />;
}

const woColumns: Column<WorkOrder>[] = [
  {
    key: "os",
    header: "OS",
    primary: true,
    cell: (w) => (
      <span className="block min-w-0">
        <span className="block truncate font-medium">{w.title}</span>
        <span className="block text-[11.5px] text-muted">
          <span className="font-mono">{w.number}</span> · {w.kind} · {formatDate(w.openedAt, { short: true })}
        </span>
      </span>
    ),
  },
  { key: "tech", header: "Técnico", nowrap: true, mobileHidden: true, cell: (w) => techById(w.techId)?.name ?? <span className="text-amber">Sem técnico</span> },
  { key: "priority", header: "Prioridade", nowrap: true, mobileHidden: true, cell: (w) => <Badge tone={priorityInfo[w.priority].tone}>{priorityInfo[w.priority].label}</Badge> },
  { key: "sla", header: "SLA", nowrap: true, cell: (w) => <span className={slaOf(w).late ? "font-medium text-rose" : "text-muted"}>{slaOf(w).label}</span> },
  { key: "stage", header: "Etapa", nowrap: true, cell: (w) => <Badge>{woStageLabel(w.stage)}</Badge> },
];

const chargeColumns: Column<Charge>[] = [
  { key: "doc", header: "Cobrança", primary: true, cell: (b) => <span className="block min-w-0"><span className="block truncate">{b.description}</span><span className="block font-mono text-[11.5px] text-muted">{b.number} · {b.method}</span></span> },
  { key: "due", header: "Vencimento", nowrap: true, cell: (b) => <span className="tabular-nums">{formatDate(b.due, { short: true })}</span> },
  { key: "value", header: "Valor", align: "right", nowrap: true, cell: (b) => <span className="font-medium tabular-nums">{formatCurrency(b.value)}</span> },
  { key: "state", header: "Situação", nowrap: true, cell: (b) => <Badge tone={chargeState(b).tone}>{chargeState(b).label}</Badge> },
];

function ClientRecord({ initial }: { initial: Client }) {
  const [k, setK] = useState(initial);
  const [tab, setTab] = useState("os");
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState<TimelineItem[]>(() => [
    { id: "n1", title: "Síndico pediu relatório mensal de preventivas por e-mail, não pelo portal", meta: "12/09 · Renata Albuquerque" },
    { id: "n2", title: "Acesso pela portaria de serviço; técnico precisa de crachá com foto", meta: "28/08 · Diego Ramos", body: "Avisar a portaria com 1 dia de antecedência (nome e RG)." },
    { id: "n3", title: `Cliente desde ${formatDate(initial.since)}`, meta: "Cadastro", tone: "ok" },
  ]);
  const second = useOperation({ busyLabel: "Enviando…" });
  const wos = workOrders.filter((w) => w.clientId === k.id);
  const ks = contracts.filter((c) => c.clientId === k.id);
  const qs = quotes.filter((q) => q.clientId === k.id);
  const ns = invoices.filter((n) => n.clientId === k.id);
  const bs = charges.filter((b) => b.clientId === k.id).sort((a, b) => b.due.localeCompare(a.due));
  const overdue = bs.filter(isOverdue);
  const openWos = wos.filter(isOpen);
  const next = bs.filter((b) => b.status === "aberta" && !isOverdue(b)).slice(-1)[0];

  return (
    <ServicosShell section="clientes">
      <Page>
        <PageHeading
          crumbs={[{ label: "Clientes", href: frameHref("srv-clients") }]}
          title={k.name}
          description={`${k.cnpj} · ${k.segment} · ${k.district} · cliente desde ${formatDate(k.since)}`}
          actions={
            <>
              <Button onClick={() => go("srv-work-orders", { nova: "1" })}>
                <Wrench /> Abrir OS
              </Button>
              <ActionMenu
                actions={[
                  { label: "Criar orçamento", icon: <FilePlus2 />, onSelect: () => go("srv-quotes", { novo: "1" }) },
                  { label: "Editar cadastro", onSelect: () => setEditing(true) },
                  { label: "Enviar extrato de débitos", icon: <Send />, onSelect: () => notify(`Extrato enviado para ${k.email}`) },
                ]}
              />
            </>
          }
        />
        <div className="space-y-6">
          {k.status === "inadimplente" && (
            <Callout
              tone="bad"
              title={`${formatCurrency(overdueBalance(k.id))} vencidos · contrato suspenso`}
              action={
                <OperationButton operation={second} size="sm" variant="ghost" onClick={() => void second.run(() => new Promise((r) => setTimeout(r, 600)), `2ª via das ${overdue.length} cobranças enviada para ${k.contact}`)}>
                  <Send /> Enviar 2ª via
                </OperationButton>
              }
            >
              Atendimentos só em emergência, com cobrança avulsa. A régua já enviou os avisos D+1 e D+7.
            </Callout>
          )}
          <OperationFeedback operation={second} />
          <StatGrid cols={4}>
            <StatCell label="Receita recorrente" value={clientMrr(k.id) ? formatCurrency(clientMrr(k.id)) : "—"} hint={`${ks.filter((c) => c.status !== "encerrado").length} contrato(s)`} />
            <StatCell label="Em aberto" value={formatCurrency(openBalance(k.id), { cents: false })} hint={`${bs.filter((b) => b.status === "aberta").length} cobranças`} />
            <StatCell label="Vencido" value={formatCurrency(overdueBalance(k.id), { cents: false })} hint={overdue.length ? `${overdue.length} cobrança(s)` : "em dia"} tone={overdue.length ? "bad" : undefined} />
            <StatCell label="OS abertas" value={openWos.length} hint={`${wos.filter((w) => slaOf(w).late).length} com SLA estourado`} tone={wos.some((w) => slaOf(w).late) ? "warn" : undefined} />
          </StatGrid>

          <SplitLayout
            asideWidth={320}
            main={
              <>
                <Tabs
                  label="Seções do cliente"
                  value={tab}
                  onChange={setTab}
                  items={[
                    { id: "os", label: "Ordens de serviço" },
                    { id: "comercial", label: "Contratos e orçamentos" },
                    { id: "financeiro", label: "Notas e cobranças", count: overdue.length || undefined },
                    { id: "anotacoes", label: "Anotações" },
                  ]}
                />
                <div className="mt-5 space-y-6">
                  {tab === "os" && (
                    <DataTable
                      label="Ordens de serviço do cliente"
                      rows={wos}
                      columns={woColumns}
                      rowKey={(w) => w.id}
                      rowLabel={(w) => `Abrir ${w.number}`}
                      onRowClick={(w) => go("srv-work-order", w.id)}
                      rowTone={(w) => (slaOf(w).late ? "bad" : undefined)}
                      empty={<Empty framed={false} title="Nenhuma OS para este cliente" hint="Abra uma OS quando o cliente pedir atendimento." action={<Button size="sm" variant="ghost" onClick={() => go("srv-work-orders", { nova: "1" })}><Wrench /> Abrir OS</Button>} />}
                    />
                  )}
                  {tab === "comercial" && (
                    <>
                      <section>
                        <h2 className="m-0 mb-2 text-[13.5px] font-medium">Contratos</h2>
                        {ks.length ? (
                          <ul className="m-0 list-none divide-y divide-line rounded-xl border border-line bg-surface p-0">
                            {ks.map((c) => (
                              <li key={c.id}>
                                <a href={frameHref("srv-contracts", c.id)} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-soft">
                                  <span className="min-w-0 flex-1">
                                    <span className="block text-[13.5px] font-medium">{c.plan}</span>
                                    <span className="block text-[12px] text-muted">
                                      <span className="font-mono">{c.number}</span> · reajuste {c.index} em {formatDate(c.renewal, { short: true })} · SLA {c.sla}
                                    </span>
                                  </span>
                                  <span className="tabular-nums">{formatCurrency(c.monthly)}/mês</span>
                                  <Badge tone={contractStatus[c.status].tone}>{contractStatus[c.status].label}</Badge>
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <Empty title="Sem contrato recorrente" hint="Cliente avulso. Um contrato de manutenção preventiva garante receita e reduz corretivas." action={<Button size="sm" variant="ghost" href={frameHref("srv-quotes", { novo: "1" })}><FilePlus2 /> Propor contrato</Button>} />
                        )}
                      </section>
                      <section>
                        <h2 className="m-0 mb-2 text-[13.5px] font-medium">Orçamentos</h2>
                        {qs.length ? (
                          <ul className="m-0 list-none divide-y divide-line rounded-xl border border-line bg-surface p-0">
                            {qs.map((q) => (
                              <li key={q.id}>
                                <a href={frameHref("srv-quotes", q.id)} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-soft">
                                  <span className="min-w-0 flex-1">
                                    <span className="block text-[13.5px]">{q.title}</span>
                                    <span className="block font-mono text-[11.5px] text-muted">{q.number}</span>
                                  </span>
                                  <span className="tabular-nums">{formatCurrency(quoteTotals(q).total)}</span>
                                  <Badge tone={quoteStatus[q.status].tone}>{quoteStatus[q.status].label}</Badge>
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="m-0 text-[13px] text-muted">Nenhum orçamento para este cliente.</p>
                        )}
                      </section>
                    </>
                  )}
                  {tab === "financeiro" && (
                    <>
                      <DataTable label="Cobranças do cliente" rows={bs} columns={chargeColumns} rowKey={(b) => b.id} rowLabel={(b) => `Abrir ${b.number}`} onRowClick={(b) => go("srv-billing", b.id)} rowTone={(b) => (isOverdue(b) ? "bad" : undefined)} empty={<Empty framed={false} title="Nenhuma cobrança" hint="As cobranças aparecem quando uma OS é faturada ou a mensalidade é gerada." />} />
                      <section>
                        <h2 className="m-0 mb-2 text-[13.5px] font-medium">Notas fiscais (NFS-e)</h2>
                        {ns.length ? (
                          <ul className="m-0 list-none divide-y divide-line rounded-xl border border-line bg-surface p-0 text-[13px]">
                            {ns.map((n) => (
                              <li key={n.id}>
                                <a href={frameHref("srv-invoices", n.id)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-soft">
                                  <span className="min-w-0 flex-1 truncate">
                                    {n.number ? `NFS-e ${n.number}` : n.rps} · {n.origin.label}
                                  </span>
                                  <Badge tone={invoiceStatus[n.status].tone}>{invoiceStatus[n.status].label}</Badge>
                                  <span className="w-24 text-right tabular-nums">{formatCurrency(n.value)}</span>
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="m-0 text-[13px] text-muted">Nenhuma nota emitida para este cliente.</p>
                        )}
                      </section>
                    </>
                  )}
                  {tab === "anotacoes" && (
                    <>
                      <form
                        className="space-y-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!note.trim()) return;
                          setNotes((all) => [{ id: `n${Date.now()}`, title: note.trim(), meta: "Agora · Renata Albuquerque" }, ...all]);
                          setNote("");
                          notify("Anotação salva");
                        }}
                      >
                        <TextareaField label="Nova anotação" value={note} onChange={setNote} autosize minRows={2} placeholder="Combinados, acesso ao local, preferências de contato…" />
                        <div className="flex justify-end">
                          <Button type="submit" size="sm" variant="ghost" disabled={!note.trim()}>
                            <MessageSquare /> Salvar anotação
                          </Button>
                        </div>
                      </form>
                      <section className="rounded-xl border border-line bg-surface px-4 py-4">
                        <Timeline items={notes} />
                      </section>
                    </>
                  )}
                </div>
              </>
            }
            aside={
              <>
                <section className="rounded-xl border border-line bg-surface p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <EntityMark name={k.name} tint={k.tint} className="h-10 w-10 text-[12px]" />
                    <div className="min-w-0">
                      <div className="truncate text-[13.5px] font-medium">{k.name}</div>
                      <Badge tone={clientStatus[k.status].tone}>{clientStatus[k.status].label}</Badge>
                    </div>
                  </div>
                  <LocationTag place={`${k.district}, São Paulo`} timeZone="America/Sao_Paulo" />
                  <PropertyList
                    className="mt-3"
                    items={[
                      { label: "Endereço", value: k.address },
                      { label: "Contato", value: k.contact, hint: k.phone },
                      { label: "E-mail", value: <span className="break-all">{k.email}</span> },
                      { label: "ISS", value: k.issWithheld ? "Retém na fonte" : "Não retém", hint: k.issWithheld ? "notas saem com ISS retido" : undefined },
                    ]}
                  />
                  <Button size="sm" variant="ghost" className="mt-3" onClick={() => setEditing(true)}>
                    Editar cadastro
                  </Button>
                </section>
                <section className="rounded-xl border border-line bg-surface p-4">
                  <h2 className="m-0 mb-2 flex items-center gap-2 text-[13px] font-medium">
                    <Receipt className="h-4 w-4 text-muted" aria-hidden /> Próximo vencimento
                  </h2>
                  {next ? (
                    <p className="m-0 text-[13px]">
                      {formatCurrency(next.value)} em {formatDate(next.due)}
                      <span className="block text-[12px] text-muted">{next.description}</span>
                    </p>
                  ) : (
                    <p className="m-0 text-[12.5px] text-muted">Nada a vencer.</p>
                  )}
                </section>
              </>
            }
          />
        </div>
      </Page>
      <EditClient open={editing} k={k} onClose={() => setEditing(false)} onSave={setK} />
    </ServicosShell>
  );
}

function EditClient({ open, k, onClose, onSave }: { open: boolean; k: Client; onClose: () => void; onSave: (k: Client) => void }) {
  const [draft, setDraft] = useState(k);
  const op = useOperation({ busyLabel: "Salvando…" });
  const set = (p: Partial<Client>) => setDraft((d) => ({ ...d, ...p }));
  return (
    <Drawer
      open={open}
      onClose={onClose}
      kicker={k.cnpj}
      title="Editar cadastro"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={op.busy}>
            Cancelar
          </Button>
          <OperationButton
            operation={op}
            onClick={() => {
              const before = k;
              void op.run(() => new Promise((r) => setTimeout(r, 600)), { message: "Cadastro atualizado", undo: () => onSave(before) }, { apply: () => onSave(draft), revert: () => onSave(before) }).then((err) => !err && onClose());
            }}
          >
            Salvar alterações
          </OperationButton>
        </>
      }
    >
      <div className="space-y-4">
        <OperationFeedback operation={op} />
        <TextField label="Razão social" value={draft.name} onChange={(v) => set({ name: v })} />
        <TextField label="Endereço" value={draft.address} onChange={(v) => set({ address: v })} />
        <TextField label="Bairro" value={draft.district} onChange={(v) => set({ district: v })} />
        <TextField label="Contato principal" value={draft.contact} onChange={(v) => set({ contact: v })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="E-mail" type="email" value={draft.email} onChange={(v) => set({ email: v })} />
          <TextField label="Telefone" value={draft.phone} onChange={(v) => set({ phone: v })} />
        </div>
        <Switch label="Cliente retém ISS na fonte" checked={draft.issWithheld} onCheckedChange={(v) => set({ issWithheld: v })} />
        <p className="m-0 text-[12px] text-muted">Vale para as próximas NFS-e. Notas já emitidas não mudam.</p>
      </div>
    </Drawer>
  );
}
