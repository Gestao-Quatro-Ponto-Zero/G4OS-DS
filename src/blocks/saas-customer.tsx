import { LogIn, MessageSquare } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  ActionMenu,
  AreaChart,
  Badge,
  Banner,
  Button,
  ChartCard,
  ConfirmDialog,
  DataTable,
  Drawer,
  EntityMark,
  FieldBlock,
  KpiCard,
  KpiGrid,
  Modal,
  NumberField,
  OperationButton,
  OperationFeedback,
  Page,
  PageHeading,
  PropertyList,
  RadialBars,
  Select,
  SplitLayout,
  Tabs,
  TextareaField,
  formatCurrency,
  formatDate,
  formatNumber,
  notify,
  useOperation,
  type Column,
} from "@g4ai/ds";
import { customerById, go, healthLabel, healthTone, invoiceLabel, invoices, invoiceTone, personById, planPrice, plans, priorityLabel, priorityTone, ticketLabel, tickets, useFrameParam, type Invoice, type Plan, type Ticket } from "./data/saas";
import { SaasShell } from "./shells/saas-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Página da conta",
  description: "Conta de cliente (?id=): saúde, uso diário, adoção por recurso, faturas, chamados, ajuste de plano com prévia de MRR e cancelamento com confirmação.",
  category: "SaaS",
  order: 4,
  height: 1180,
  concept: {
    goal: "Decidir o que fazer com uma conta: saúde, uso, cobrança e suporte em um lugar.",
    patterns: [
      "Anatomia C · Registro: KPIs da conta no topo; propriedades fixas à direita",
      "Saúde e adoção por recurso",
      "Ajuste de plano com prévia de MRR; cancelamento com confirmação",
    ],
    adapt: [
      "Empresa (CRM), cliente B2B (ERP)",
    ],
    avoid: [
      "Cancelar sem mostrar o impacto",
    ],
  },
} as const;

const here = "#/frame/saas-customers";
const contactKinds = ["Reunião", "Ligação", "E-mail", "Visita"];
type Contact = { kind: string; note: string; when: string };

export default function SaasCustomer() {
  const id = useFrameParam("id");
  const base = customerById(id);
  const [customer, setCustomer] = useState(base);
  const [tab, setTab] = useState("faturas");
  const [planOpen, setPlanOpen] = useState(false);
  const [plan, setPlan] = useState<Plan>(base.plan);
  const [seats, setSeats] = useState<number | null>(base.seats);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactKind, setContactKind] = useState(contactKinds[0]);
  const [contactNote, setContactNote] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [asAdmin, setAsAdmin] = useState(false);
  const [paused, setPaused] = useState(false);
  const op = useOperation({ busyLabel: "Registrando…" });
  const saveContact = () =>
    op.run(
      () => new Promise((r) => setTimeout(r, 500)),
      { message: `Contato registrado: ${contactKind.toLowerCase()} com ${customer.contact}`, undo: () => setContacts((all) => all.slice(1)) },
      { apply: () => setContacts((all) => [{ kind: contactKind, note: contactNote.trim(), when: "agora" }, ...all]), revert: () => setContacts((all) => all.slice(1)) },
    ).then((err) => {
      if (!err) {
        setContactOpen(false);
        setContactNote("");
      }
    });
  useEffect(() => {
    setCustomer(base);
    setPlan(base.plan);
    setSeats(base.seats);
  }, [base]);

  const own = invoices.filter((i) => i.customerId === customer.id);
  const calls = tickets.filter((t) => t.customerId === customer.id);
  const usage30 = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => {
        const d = new Date(2026, 8, 1 + i);
        const weekend = d.getDay() === 0 || d.getDay() === 6;
        // sessões por dia: usuários ativos × sessões por pessoa (não fica fracionado em contas pequenas)
        const base = Math.max(4, customer.seats * (customer.usage / 100 + 0.15) * 3.2);
        return { dia: `${String(d.getDate()).padStart(2, "0")}/09`, sessoes: Math.round((weekend ? base * 0.3 : base) * (0.82 + Math.sin(i / 2.6) * 0.18)) };
      }),
    [customer],
  );
  const features = [
    { label: "Painéis", value: Math.min(100, customer.usage + 18) },
    { label: "Relatórios agendados", value: Math.max(4, customer.usage - 12) },
    { label: "Alertas", value: Math.max(2, Math.round(customer.usage / 2)) },
    { label: "API", value: customer.plan === "Enterprise" ? 64 : 0 },
  ];
  const newMrr = (seats ?? 0) * planPrice[plan];

  const invoiceCols: Column<Invoice>[] = [
    { key: "number", header: "Fatura", primary: true, cell: (i) => i.number },
    { key: "issued", header: "Emissão", nowrap: true, cell: (i) => formatDate(i.issued) },
    { key: "method", header: "Forma", mobileHidden: true, cell: (i) => i.method },
    { key: "status", header: "Situação", cell: (i) => <Badge tone={invoiceTone[i.status]}>{invoiceLabel[i.status]}</Badge> },
    { key: "amount", header: "Valor", align: "right", nowrap: true, cell: (i) => <span className="font-medium tabular-nums">{formatCurrency(i.amount)}</span> },
  ];
  const ticketCols: Column<Ticket>[] = [
    { key: "subject", header: "Chamado", primary: true, cell: (t) => t.subject },
    { key: "priority", header: "Prioridade", cell: (t) => <Badge tone={priorityTone[t.priority]}>{priorityLabel[t.priority]}</Badge> },
    { key: "status", header: "Situação", cell: (t) => ticketLabel[t.status] },
    { key: "opened", header: "Aberto", nowrap: true, align: "right", cell: (t) => <span className="tabular-nums text-muted">há {t.opened} h</span> },
  ];

  return (
    <SaasShell current={here}>
      <Page>
        <PageHeading
          crumbs={[{ label: "Clientes", href: "#/frame/saas-customers" }, { label: customer.name }]}
          title={customer.name}
          description={`${customer.plan} · ${formatNumber(customer.seats)} usuários · cliente desde ${formatDate(customer.since)}`}
          actions={
            <>
              <Button variant="ghost" onClick={() => setContactOpen(true)}>
                <MessageSquare /> Registrar contato
              </Button>
              <Button onClick={() => setPlanOpen(true)}>Ajustar plano</Button>
              <ActionMenu
                actions={[
                  { label: "Entrar como administrador", icon: <LogIn className="h-4 w-4" />, onSelect: () => setAsAdmin(true) },
                  paused
                    ? { label: "Retomar cobrança", onSelect: () => (setPaused(false), notify(`Cobrança de ${customer.name} retomada`)) }
                    : { label: "Pausar cobrança por 30 dias", onSelect: () => (setPaused(true), notify(`Cobrança de ${customer.name} pausada por 30 dias`, () => setPaused(false))) },
                  { label: "Cancelar assinatura", tone: "danger", separator: true, onSelect: () => setCancelOpen(true) },
                ]}
              />
            </>
          }
        />
        {asAdmin && (
          <Banner
            tone="warn"
            className="mt-4 rounded-xl border"
            title={`Você está vendo o Pulso como ${customer.contact}`}
            action={
              <Button size="sm" variant="ghost" onClick={() => (setAsAdmin(false), notify("Sessão de administrador encerrada"))}>
                Sair do modo administrador
              </Button>
            }
          >
            Tudo o que você fizer fica registrado na auditoria da conta. A sessão expira em 30 minutos.
          </Banner>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone={healthTone[customer.health]}>{healthLabel[customer.health]}</Badge>
          {paused && <Badge tone="warn">Cobrança pausada até {formatDate(new Date(2026, 9, 30))}</Badge>}
          {customer.status === "trial" && <Badge tone="info">Trial</Badge>}
          {customer.status === "atraso" && <Badge tone="warn">Pagamento em atraso</Badge>}
        </div>

        <KpiGrid className="mt-6">
          <KpiCard label="MRR" value={formatCurrency(customer.mrr, { cents: false })} hint={`${formatCurrency(planPrice[customer.plan], { cents: false })} por usuário`} />
          <KpiCard label="Uso nos últimos 30 dias" value={`${customer.usage}%`} spark={customer.trend} delta={customer.usage > 50 ? 0.08 : -0.12} period="dos usuários ativos" />
          <KpiCard label="NPS da conta" value={String(customer.nps)} hint={customer.nps >= 9 ? "promotor" : customer.nps >= 7 ? "neutro" : "detrator"} />
          <KpiCard label="Chamados abertos" value={String(calls.filter((t) => t.status !== "resolvido").length)} hint={`${calls.length} no trimestre`} />
        </KpiGrid>

        <div className="mt-6 grid gap-6 lg:grid-cols-5">
          <ChartCard className="lg:col-span-3" title="Quanto usam por dia?" description="Sessões por dia em setembro">
            <AreaChart label="Sessões por dia em setembro" data={usage30} index="dia" series={[{ key: "sessoes", label: "Sessões" }]} height={200} />
          </ChartCard>
          <ChartCard className="lg:col-span-2" title="O que eles usam?" description="% dos usuários que usaram cada recurso">
            <RadialBars items={features} size={170} />
          </ChartCard>
        </div>

        <div className="mt-8">
          <SplitLayout
            asideWidth={320}
            main={
              <>
                <Tabs
                  label="Seções da conta"
                  value={tab}
                  onChange={setTab}
                  items={[
                    { id: "faturas", label: `Faturas · ${own.length}` },
                    { id: "chamados", label: `Chamados · ${calls.length}` },
                  ]}
                />
                <div className="mt-5">
                  {tab === "faturas" ? (
                    <DataTable rows={own} columns={invoiceCols} rowKey={(i) => i.id} onRowClick={(i) => go("saas-billing", i.id)} rowLabel={(i) => `Abrir ${i.number}`} empty={<p className="py-6 text-center text-[13px] text-muted">Conta em trial: nenhuma fatura ainda.</p>} />
                  ) : (
                    <DataTable rows={calls} columns={ticketCols} rowKey={(t) => t.id} onRowClick={(t) => go("saas-support", t.id)} rowLabel={(t) => `Abrir ${t.subject}`} empty={<p className="py-6 text-center text-[13px] text-muted">Nenhum chamado desta conta.</p>} />
                  )}
                </div>
              </>
            }
            aside={
              <section className="rounded-xl border border-line bg-surface px-4 py-4">
                <div className="mb-4 flex items-center gap-3">
                  <EntityMark name={customer.name} tint={customer.tint} className="h-10 w-10 text-[13px]" />
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-medium">{customer.name}</div>
                    <div className="text-[12px] text-muted">{customer.segment}</div>
                  </div>
                </div>
                <PropertyList
                  items={[
                    { label: "Administrador", value: customer.contact, hint: customer.email },
                    { label: "CNPJ", value: <span className="tabular-nums">{customer.cnpj}</span> },
                    { label: "Cidade", value: customer.city },
                    { label: "Customer Success", value: personById(customer.owner).name },
                    { label: "Renovação", value: formatDate(new Date(2027, 2, 12)) },
                    { label: "Último contato", value: contacts[0] ? `${contacts[0].kind} · ${contacts[0].when}` : "Sem registro neste mês" },
                  ]}
                />
                <Button size="sm" variant="ghost" className="mt-4" href={`#/frame/saas-usage?id=${customer.id}`}>
                  Ver uso e limites do plano
                </Button>
              </section>
            }
          />
        </div>
      </Page>

      <Modal
        open={planOpen}
        onClose={() => setPlanOpen(false)}
        title="Ajustar plano"
        description="A diferença é cobrada pró-rata na próxima fatura."
        footer={
          <>
            <Button variant="ghost" onClick={() => setPlanOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!seats}
              onClick={() => {
                const prev = customer;
                setCustomer((c) => ({ ...c, plan, seats: seats!, mrr: newMrr }));
                setPlanOpen(false);
                notify(`Plano ${plan} com ${seats} usuários · MRR ${formatCurrency(newMrr, { cents: false })}`, () => setCustomer(prev));
              }}
            >
              Aplicar mudança
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FieldBlock label="Plano">
            <Select label="Plano" value={plan} onValueChange={(v) => setPlan(v as Plan)} options={plans.map((p) => ({ value: p, label: p, description: `${formatCurrency(planPrice[p], { cents: false })} por usuário/mês` }))} />
          </FieldBlock>
          <NumberField label="Usuários" value={seats} onChange={setSeats} min={1} max={5000} />
          <div className="rounded-xl border border-line bg-soft/60 px-4 py-3 text-[13px]">
            <div className="flex justify-between">
              <span className="text-muted">MRR atual</span>
              <span className="tabular-nums">{formatCurrency(customer.mrr)}</span>
            </div>
            <div className="mt-1 flex justify-between font-medium">
              <span>Novo MRR</span>
              <span className="tabular-nums">{formatCurrency(newMrr)}</span>
            </div>
            <div className={newMrr >= customer.mrr ? "mt-1 text-right text-[12px] text-ok" : "mt-1 text-right text-[12px] text-rose"}>
              {newMrr >= customer.mrr ? "+" : "−"}
              {formatCurrency(Math.abs(newMrr - customer.mrr))} por mês
            </div>
          </div>
        </div>
      </Modal>
      <Drawer
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        kicker={customer.name}
        title="Registrar contato"
        footer={
          <>
            <Button variant="ghost" onClick={() => setContactOpen(false)}>
              Cancelar
            </Button>
            <OperationButton operation={op} disabled={!contactNote.trim()} disabledReason="Escreva o que foi conversado" onClick={saveContact}>
              Registrar contato
            </OperationButton>
          </>
        }
      >
        <div className="space-y-4">
          <OperationFeedback operation={op} />
          <FieldBlock label="Tipo">
            <Select label="Tipo" value={contactKind} onValueChange={setContactKind} options={contactKinds.map((k) => ({ value: k, label: k }))} />
          </FieldBlock>
          <TextareaField label="O que foi conversado" value={contactNote} onChange={setContactNote} rows={5} placeholder="Ex.: revisão trimestral; pediram treinamento para o time de vendas." />
          {contacts.length > 0 && (
            <div>
              <h3 className="m-0 mb-2 text-[12.5px] font-medium text-muted">Registrados nesta sessão</h3>
              <ul className="m-0 list-none space-y-2 p-0 text-[13px]">
                {contacts.map((c, i) => (
                  <li key={i} className="rounded-lg border border-line px-3 py-2">
                    <span className="font-medium">{c.kind}</span> · <span className="text-muted">{c.when}</span>
                    <p className="m-0 mt-0.5 text-ink-soft">{c.note}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Drawer>
      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={() => {
          notify(`Assinatura de ${customer.name} cancelada ao fim do ciclo`);
          go("saas-customers");
        }}
        title={`Cancelar a assinatura de ${customer.name}?`}
        description={`A conta perde acesso em ${formatDate(new Date(2026, 9, 12))}. O MRR de ${formatCurrency(customer.mrr, { cents: false })} entra como churn de outubro.`}
        confirmLabel="Cancelar assinatura"
        cancelLabel="Manter assinatura"
        tone="danger"
      />
    </SaasShell>
  );
}
