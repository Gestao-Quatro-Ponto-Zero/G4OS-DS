import { ArrowLeft, Building2, Inbox, MessageSquareQuote, Phone, Sparkles, UserX } from "lucide-react";
import { useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  CurrencyField,
  Drawer,
  Empty,
  EntityMark,
  ErrorState,
  FieldBlock,
  FieldGrid,
  Modal,
  OperationButton,
  OperationFeedback,
  Page,
  PageHeading,
  PropertyList,
  Select,
  Skeleton,
  Tabs,
  TextField,
  cn,
  formatCurrency,
  formatDate,
  notify,
  useOperation,
} from "@g4ai/ds";
import {
  addCompany,
  addContact,
  addDeal,
  companies,
  companyById,
  daysFromToday,
  disqualifyReasons,
  go,
  iso,
  leads as seed,
  me,
  reps,
  stages,
  useFrameParam,
  type Lead,
  type LeadStatus,
  type StageId,
} from "./data/crm";
import { setFrameQuery } from "./shells/frame-route";
import { CrmShell } from "./shells/crm-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Caixa de leads",
  description: "Leads do site, de eventos e de indicação para qualificar: pontuação com os sinais que a explicam, mensagem original e decisão em um clique (qualificar vira negócio no pipeline; desqualificar pede motivo).",
  category: "CRM",
  order: 11,
  height: 900,
  concept: {
    goal: "Decidir rápido quais leads viram negócio e quais saem da fila, sem perder o motivo.",
    patterns: [
      "Anatomia F · Mestre-detalhe: fila à esquerda, lead à direita; seleção no endereço (?id=); no celular o detalhe ocupa a tela com voltar",
      "Pontuação explicada pelos sinais (cor sempre com palavra: Quente, Morno, Frio)",
      "Qualificar abre gaveta com o negócio pré-preenchido e leva ao registro criado",
      "Desqualificar exige motivo (alimenta o relatório de origem)",
      "Cinco estados: ?estado=carregando|vazio|erro simula; aba vazia com próxima ação",
    ],
    adapt: ["Triagem de candidatos (ATS), chamados novos (suporte), pedidos de cotação (ERP)"],
    avoid: ["Pontuação sem explicação", "Qualificar sem criar o negócio (o lead some e ninguém acompanha)"],
  },
} as const;

const here = "#/frame/crm-leads";
const save = () => new Promise<void>((r) => setTimeout(r, 700));
const tabs: { id: LeadStatus; label: string; empty: { title: string; hint: string } }[] = [
  { id: "novo", label: "Novos", empty: { title: "Caixa zerada", hint: "Nenhum lead novo esperando. Os do site e de eventos chegam aqui assim que entram." } },
  { id: "em-contato", label: "Em contato", empty: { title: "Ninguém em contato", hint: "Marque um lead novo como “em contato” depois da primeira conversa." } },
  { id: "desqualificado", label: "Desqualificados", empty: { title: "Nenhum lead desqualificado", hint: "Leads fora do perfil ficam aqui com o motivo, para revisar a origem." } },
];
const heat = (score: number) => (score >= 70 ? { label: "Quente", tone: "ok" as const } : score >= 40 ? { label: "Morno", tone: "warn" as const } : { label: "Frio", tone: "neutral" as const });
const received = (l: Lead) => {
  const d = -daysFromToday(l.received);
  return d === 0 ? `hoje, ${l.receivedTime}` : d === 1 ? `ontem, ${l.receivedTime}` : formatDate(l.received, { short: true });
};

export default function CrmLeads() {
  const id = useFrameParam("id");
  const estado = useFrameParam("estado");
  const [list, setList] = useState<Lead[]>(seed);
  const [tab, setTab] = useState<LeadStatus>(() => seed.find((l) => l.id === id)?.status ?? "novo");
  const [qualifying, setQualifying] = useState<Lead | null>(null);
  const [disqualifying, setDisqualifying] = useState<Lead | null>(null);
  const [reason, setReason] = useState(disqualifyReasons[0]);

  const base = estado === "vazio" ? [] : list;
  const visible = base.filter((l) => l.status === tab).sort((a, b) => b.score - a.score);
  const selected = visible.find((l) => l.id === id);
  const current = selected ?? visible[0];
  const tabInfo = tabs.find((t) => t.id === tab)!;
  const newCount = base.filter((l) => l.status === "novo").length;

  const setStatus = (l: Lead, status: LeadStatus, message: string) => {
    setList((all) => all.map((x) => (x.id === l.id ? { ...x, status } : x)));
    notify(message, () => setList((all) => all.map((x) => (x.id === l.id ? { ...x, status: l.status } : x))));
  };

  return (
    <CrmShell current={here}>
      <Page>
        <PageHeading title="Leads" description="Contatos que chegaram pelo site, eventos e indicações. Qualifique para virar negócio ou desqualifique com motivo." />
        <Tabs
          className="mt-4"
          label="Situação do lead"
          value={tab}
          onChange={(t) => {
            setTab(t as LeadStatus);
            setFrameQuery({ id: undefined });
          }}
          items={tabs.map((t) => ({ id: t.id, label: t.label, count: t.id === "novo" ? newCount : undefined }))}
        />

        {estado === "carregando" ? (
          <div className="mt-5 grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]" aria-busy="true" aria-label="Carregando leads">
            <div className="space-y-2">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-[76px] w-full rounded-xl" />
              ))}
            </div>
            <Skeleton className="hidden h-[420px] w-full rounded-2xl lg:block" />
          </div>
        ) : estado === "erro" ? (
          <div className="mt-5">
            <ErrorState size="md" title="Não foi possível carregar os leads" description="Os formulários continuam chegando; nada se perde. Tente de novo em alguns segundos." onRetry={() => setFrameQuery({ estado: undefined })} />
          </div>
        ) : !base.length ? (
          <div className="mt-5">
            <Empty
              icon={<Inbox />}
              title="Nenhum lead ainda"
              hint="Conecte o formulário do site ou importe a lista de um evento. Cada lead chega aqui com pontuação."
              action={
                <Button variant="ghost" href="#/frame/crm-settings">
                  Conectar formulário
                </Button>
              }
            />
          </div>
        ) : !visible.length ? (
          <div className="mt-5">
            <Empty icon={<Inbox />} title={tabInfo.empty.title} hint={tabInfo.empty.hint} action={tab !== "novo" ? <Button variant="ghost" onClick={() => setTab("novo")}>Ver leads novos</Button> : <Button variant="ghost" href="#/frame/crm-pipeline">Abrir pipeline</Button>} />
          </div>
        ) : (
          <div className="mt-5 grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
            {/* Fila */}
            <ul className={cn("m-0 list-none space-y-2 p-0", selected && "hidden lg:block")} aria-label="Leads">
              {visible.map((l) => {
                const on = l.id === current?.id;
                const h = heat(l.score);
                return (
                  <li key={l.id}>
                    <button
                      type="button"
                      aria-current={on ? "true" : undefined}
                      onClick={() => setFrameQuery({ id: l.id })}
                      className={cn("w-full rounded-xl border bg-surface px-4 py-3 text-left transition-colors", on ? "border-line-strong shadow-raised" : "border-line hover:border-line-strong")}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[13.5px] font-medium">{l.name}</span>
                        <Badge tone={h.tone}>
                          {h.label} · {l.score}
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2 text-[12px] text-muted">
                        <span className="truncate">
                          {l.company} · {l.source}
                        </span>
                        <span className="shrink-0">{received(l)}</span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Detalhe */}
            {current && (
              <section className={cn("min-w-0 rounded-2xl border border-line bg-surface", !selected && "hidden lg:block")} aria-label={`Lead ${current.name}`}>
                <header className="flex flex-wrap items-start gap-3 border-b border-line px-5 py-4 sm:px-6">
                  <Button variant="quiet" size="sm" className="-ml-2 w-full justify-start lg:hidden" onClick={() => setFrameQuery({ id: undefined })}>
                    <ArrowLeft /> Voltar aos leads
                  </Button>
                  <Avatar initials={current.initials} tint={current.tint} name={current.name} size="lg" />
                  <div className="min-w-0 flex-1">
                    <h2 className="m-0 text-[18px] font-semibold tracking-tight">{current.name}</h2>
                    <div className="mt-0.5 text-[13px] text-muted">
                      {current.role} · {current.company}
                    </div>
                  </div>
                  <Badge tone={heat(current.score).tone}>
                    {heat(current.score).label} · {current.score} pontos
                  </Badge>
                </header>

                <div className="space-y-6 px-5 py-5 sm:px-6">
                  <figure className="m-0 rounded-xl bg-soft px-4 py-3">
                    <figcaption className="mb-1 flex items-center gap-1.5 text-[12px] text-muted">
                      <MessageSquareQuote className="h-3.5 w-3.5" /> Mensagem · {current.source} · {received(current)}
                    </figcaption>
                    <blockquote className="m-0 text-[13.5px] leading-relaxed text-ink">{current.message}</blockquote>
                  </figure>

                  <div className="grid gap-6 md:grid-cols-2">
                    <section aria-label="Por que essa pontuação">
                      <h3 className="m-0 mb-2 flex items-center gap-1.5 text-[13px] font-medium">
                        <Sparkles className="h-4 w-4 text-muted" /> Por que {current.score} pontos
                      </h3>
                      <ul className="m-0 list-none divide-y divide-line rounded-xl border border-line p-0 text-[13px]">
                        {current.signals.map((s) => (
                          <li key={s.label} className="flex items-center justify-between gap-3 px-3 py-2">
                            <span className="min-w-0">{s.label}</span>
                            <span className={cn("shrink-0 font-medium tabular-nums", s.points < 0 ? "text-rose" : "text-ink-soft")}>{s.points > 0 ? `+${s.points}` : `−${Math.abs(s.points)}`}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                    <PropertyList
                      items={[
                        { label: "E-mail", value: <a className="break-all hover:underline" href={`mailto:${current.email}`}>{current.email}</a> },
                        { label: "Telefone", value: <a className="tabular-nums hover:underline" href={`tel:${current.phone.replace(/\D/g, "")}`}>{current.phone}</a> },
                        {
                          label: "Empresa",
                          value: current.companyId ? (
                            <a className="inline-flex items-center gap-1.5 font-medium hover:underline" href={`#/frame/crm-company?id=${current.companyId}`}>
                              <EntityMark name={companyById(current.companyId).name} tint={companyById(current.companyId).tint} className="h-5 w-5 text-[10px]" />
                              {companyById(current.companyId).name}
                            </a>
                          ) : (
                            current.company
                          ),
                          hint: current.companyId ? "já está na base" : current.company !== "—" ? "empresa nova" : undefined,
                        },
                        { label: "Porte", value: current.size !== "—" ? `${current.size} func.` : undefined },
                        { label: "Cidade", value: current.city },
                        { label: "Interesse", value: current.interest },
                        { label: "Estimativa", value: current.estimate ? formatCurrency(current.estimate, { cents: false }) : undefined },
                      ]}
                    />
                  </div>
                </div>

                <footer className="flex flex-wrap justify-end gap-2 border-t border-line bg-soft/40 px-5 py-3 sm:px-6">
                  {current.status !== "desqualificado" ? (
                    <>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setReason(disqualifyReasons[0]);
                          setDisqualifying(current);
                        }}
                      >
                        <UserX /> Desqualificar
                      </Button>
                      {current.status === "novo" && (
                        <Button variant="ghost" onClick={() => setStatus(current, "em-contato", `${current.name.split(" ")[0]} marcado como em contato`)}>
                          <Phone /> Marcar em contato
                        </Button>
                      )}
                      <Button onClick={() => setQualifying(current)}>Qualificar e criar negócio</Button>
                    </>
                  ) : (
                    <Button variant="ghost" onClick={() => setStatus(current, "novo", `${current.name.split(" ")[0]} voltou para a fila`)}>
                      Devolver para a fila
                    </Button>
                  )}
                </footer>
              </section>
            )}
          </div>
        )}
      </Page>

      {qualifying && (
        <QualifyDrawer
          key={qualifying.id}
          lead={qualifying}
          onClose={() => setQualifying(null)}
          onDone={(dealId) => {
            setList((all) => all.filter((x) => x.id !== qualifying.id));
            setQualifying(null);
            go("crm-deal", dealId);
          }}
        />
      )}

      <Modal
        open={!!disqualifying}
        onClose={() => setDisqualifying(null)}
        size="sm"
        title={disqualifying ? `Desqualificar ${disqualifying.name}` : "Desqualificar lead"}
        description="O motivo ajuda a ajustar a origem e a pontuação dos próximos leads."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDisqualifying(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!disqualifying) return;
                setStatus(disqualifying, "desqualificado", `${disqualifying.name.split(" ")[0]} desqualificado · ${reason}`);
                setDisqualifying(null);
                setFrameQuery({ id: undefined });
              }}
            >
              Desqualificar lead
            </Button>
          </>
        }
      >
        <FieldBlock label="Motivo">
          <Select label="Motivo" value={reason} onValueChange={setReason} options={disqualifyReasons.map((r) => ({ value: r, label: r }))} />
        </FieldBlock>
      </Modal>
    </CrmShell>
  );
}

/* ------------------------------------------------------------------ */
/* Qualificar: cria empresa (se nova), contato e negócio               */
/* ------------------------------------------------------------------ */

function QualifyDrawer({ lead, onClose, onDone }: { lead: Lead; onClose: () => void; onDone: (dealId: string) => void }) {
  const [title, setTitle] = useState(lead.interest);
  const [value, setValue] = useState<number | null>(lead.estimate || null);
  const [stage, setStage] = useState<StageId>("qualificacao");
  const [owner, setOwner] = useState(me);
  const [tried, setTried] = useState(false);
  const op = useOperation({ busyLabel: "Criando…" });
  const existing = lead.companyId ? companyById(lead.companyId) : companies.find((c) => c.domain === lead.domain);

  const submit = async () => {
    setTried(true);
    if (!title.trim() || !value) return;
    const failed = await op.run(save);
    if (failed) return;
    const company = existing ?? addCompany({ id: `c${Date.now()}`, name: lead.company, domain: lead.domain, industry: "—", size: lead.size, city: lead.city, owner, tint: lead.tint, lifecycle: "Oportunidade", lastTouch: 0, cnpj: "—" });
    const contact = addContact({ id: `p${Date.now()}`, name: lead.name, initials: lead.initials, tint: lead.tint, role: lead.role, email: lead.email, phone: lead.phone, companyId: company.id, lastTouch: 0 });
    const deal = addDeal({ id: `d${Date.now()}`, title: title.trim(), companyId: company.id, value, stage, owner, age: 0, source: lead.source, created: iso(0), close: iso(45), contactIds: [contact.id], note: lead.message });
    notify(`Negócio criado para ${company.name} em ${stages.find((s) => s.id === stage)?.label}`);
    onDone(deal.id);
  };

  return (
    <Drawer
      open
      onClose={onClose}
      kicker={`${lead.name} · ${lead.company}`}
      title="Qualificar e criar negócio"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <OperationButton operation={op} onClick={submit}>
            Criar negócio
          </OperationButton>
        </>
      }
    >
      <div className="space-y-4">
        <OperationFeedback operation={op} />
        <div className="flex items-center gap-3 rounded-xl border border-line px-4 py-3 text-[13px]">
          <Building2 className="h-4 w-4 shrink-0 text-muted" />
          <span className="min-w-0 flex-1">
            {existing ? (
              <>
                Vincula a <span className="font-medium">{existing.name}</span>, que já está na base.
              </>
            ) : (
              <>
                Cria a empresa <span className="font-medium">{lead.company}</span> e o contato {lead.name}.
              </>
            )}
          </span>
        </div>
        <TextField label="O que está sendo vendido" value={title} onChange={setTitle} error={tried && !title.trim() ? "Dê um nome ao negócio." : undefined} autoFocus />
        <FieldGrid>
          <CurrencyField label="Valor estimado" value={value} onChange={setValue} error={tried && !value ? "Informe o valor estimado." : undefined} />
          <FieldBlock label="Etapa">
            <Select label="Etapa" value={stage} onValueChange={(v) => setStage(v as StageId)} options={stages.slice(0, 3).map((s) => ({ value: s.id, label: s.label }))} />
          </FieldBlock>
        </FieldGrid>
        <FieldBlock label="Responsável">
          <Select label="Responsável" value={owner} onValueChange={setOwner} options={reps.map((r) => ({ value: r.id, label: r.name, description: r.role }))} />
        </FieldBlock>
        <p className="m-0 text-[12.5px] text-muted">A mensagem do lead fica registrada como nota do negócio.</p>
      </div>
    </Drawer>
  );
}
