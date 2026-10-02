import { BellRing, CheckCircle2, ChevronDown, FileSignature, MessageSquare, PenLine, Plus, RefreshCw, Send, ShieldCheck, Stamp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  ActionMenu,
  ActivityFeed,
  AiBadge,
  Avatar,
  Badge,
  Button,
  Callout,
  Checkbox,
  ConfirmDialog,
  CurrencyField,
  DateBadge,
  DatePicker,
  Drawer,
  Empty,
  EntityMark,
  FileDropzone,
  FilesList,
  LocationTag,
  Meter,
  NextStep,
  NumberField,
  OperationButton,
  OperationFeedback,
  Page,
  PageHeading,
  PropertyList,
  RevisionTimeline,
  Select,
  SplitLayout,
  StagePath,
  StatCell,
  StatGrid,
  Tabs,
  TextField,
  TextareaField,
  Timeline,
  cn,
  formatCurrency,
  formatDate,
  formatPercent,
  notify,
  plural,
  useOperation,
  type ActivityItem,
  type UploadItem,
} from "@g4ai/ds";
import {
  addContract,
  addDays,
  activityFor,
  annualValue,
  approvals,
  clauseCategories,
  company,
  contractById,
  contractFlow,
  contractTypes,
  counterpartyById,
  daysFromToday,
  diligenceOf,
  documentsFor,
  iso,
  keyClauses,
  me,
  nextNumber,
  noticeDeadline,
  obligationKinds,
  obligations as allObligations,
  people,
  personById,
  renewalInfo,
  riskInfo,
  signerStatus,
  signersFor,
  templateById,
  versionsFor,
  type Contract,
  type ObligationKind,
  type Obligation,
  type PriceIndex,
  type Renewal,
  type Signer,
} from "./data/contracts";
import { saveSample } from "./shells/download";
import { frameHref, go, setFrameQuery, useFrameParam } from "./shells/frame-route";
import { ClmShell, ContractStatusBadge, EndsIn } from "./shells/clm-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Contrato",
  description: "Registro do contrato (?id=): caminho até a vigência, cláusulas-chave extraídas com risco, versões da minuta (dial + changelog), assinaturas ICP-Brasil/gov.br por ordem, obrigações com prazo, anexos e atividade. Ações mudam com a situação: enviar para aprovação, lembrar signatários, renovar por aditivo e encerrar.",
  category: "Contratos",
  order: 3,
  height: 1180,
  concept: {
    goal: "Dar ao Jurídico tudo sobre um contrato numa tela: o que foi combinado, o que foge do padrão, quem falta assinar e o que precisa ser cumprido até quando.",
    patterns: [
      "Anatomia C · Registro: trilha, título e ações fixos; propriedades e contraparte fixas à direita (SplitLayout)",
      "StagePath mostra o caminho rascunho → vigente; vencido/encerrado como desfecho",
      "Ações por situação: Enviar para aprovação, Enviar para assinatura (com motivo quando bloqueado), Lembrar signatários, Renovar (Drawer), Encerrar (ConfirmDialog)",
      "Cláusulas-chave extraídas da minuta: fora do padrão com risco em palavra e comparação com o modelo",
      "Versões: RevisionTimeline para navegar por dia + Timeline com versão e data à esquerda (changelog)",
      "Assinaturas em ordem, com método (ICP-Brasil, gov.br) e lembrete individual",
      "?aba= abre a aba certa; ?acao=renovar abre a renovação vinda da lista",
    ],
    adapt: [
      "Apólice (endossos e renovações), pedido de compra com aceite, convênio",
    ],
    avoid: [
      "Encerrar sem mostrar a multa e o aviso prévio",
      "Enviar para assinatura sem a aprovação completa",
      "Editar o contrato vigente direto: mudança em contrato assinado é aditivo",
    ],
  },
} as const;

const wait = (ms = 700) => new Promise((r) => setTimeout(r, ms));
const legal = people.filter((p) => p.area === "Jurídico" && p.id !== "p9");
const indexes: PriceIndex[] = ["IPCA", "IGP-M", "INPC", "Sem reajuste"];
/* Índices acumulados em 12 meses (exemplo; no seu app, venha do BCB/FGV). */
const indexRate: Record<PriceIndex, number> = { IPCA: 0.0442, "IGP-M": 0.0392, INPC: 0.0418, "Sem reajuste": 0 };

const outcomeOf = (c: Contract) => (c.status === "vencido" ? { tone: "bad" as const, label: "Vencido" } : c.status === "encerrado" ? { tone: "ok" as const, label: "Encerrado" } : undefined);

const icons = { create: <Plus />, edit: <PenLine />, approve: <Stamp />, sign: <FileSignature />, comment: <MessageSquare />, send: <Send /> };
const feedFor = (c: Contract): ActivityItem[] =>
  activityFor(c).map((e) => {
    const p = people.find((x) => x.name === e.who);
    return { id: e.id, actor: p ? { name: p.name, initials: p.initials, tint: p.tint } : { name: e.who, initials: e.who.slice(0, 2).toUpperCase() }, action: e.action, target: e.target, time: e.when, quote: e.quote, icon: icons[e.kind] };
  });

export default function ClmContract() {
  const id = useFrameParam("id", "c1");
  const aba = useFrameParam("aba");
  const acao = useFrameParam("acao");
  const base = contractById(id);
  const [contract, setContract] = useState(base);
  const [tab, setTab] = useState(aba ?? "resumo");
  const [signers, setSigners] = useState(() => signersFor(base));
  const [obls, setObls] = useState(() => allObligations.filter((o) => o.contractId === base.id));
  const [feed, setFeed] = useState(() => feedFor(base));
  const [comment, setComment] = useState("");
  const [openClause, setOpenClause] = useState<string | null>(null);
  const [files, setFiles] = useState<UploadItem[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState(base);
  const [renewOpen, setRenewOpen] = useState(acao === "renovar");
  const [renewEnd, setRenewEnd] = useState(addDays(base.end, 365));
  const [renewIndex, setRenewIndex] = useState<PriceIndex>(base.index);
  const [endOpen, setEndOpen] = useState(false);
  const [oblOpen, setOblOpen] = useState(false);
  const [newObl, setNewObl] = useState<{ title: string; kind: ObligationKind; due: string; owner: string }>({ title: "", kind: "entrega", due: iso(30), owner: me.id });

  const op = useOperation({ busyLabel: "Enviando…" });
  const saveOp = useOperation({ busyLabel: "Salvando…" });
  const renewOp = useOperation({ busyLabel: "Gerando aditivo…" });
  const oblOp = useOperation({ busyLabel: "Salvando…" });
  const remindOp = useOperation({ busyLabel: "Enviando lembrete…" });

  // Outro ?id= na mesma tela (busca ⌘K, link de contraparte): recarrega o registro.
  useEffect(() => {
    setContract(base);
    setDraft(base);
    setSigners(signersFor(base));
    setObls(allObligations.filter((o) => o.contractId === base.id));
    setFeed(feedFor(base));
    setRenewEnd(addDays(base.end, 365));
    setRenewIndex(base.index);
  }, [base]);
  useEffect(() => {
    if (aba) setTab(aba);
  }, [aba]);
  useEffect(() => {
    if (acao === "renovar") setRenewOpen(true);
  }, [acao]);

  const c = contract;
  const k = counterpartyById(c.counterpartyId);
  const owner = personById(c.owner);
  const requester = personById(c.requester);
  const clauses = useMemo(() => keyClauses(c), [c]);
  const versions = useMemo(() => versionsFor(c), [c]);
  // Arquivo de exemplo gerado no navegador (no app real, a URL assinada do repositório de contratos).
  const downloadDoc = (file: string, subtitle?: string, extra: string[] = []) => {
    const saved = saveSample(file, [`${c.number} · ${c.title}`, subtitle ?? file, `Contraparte: ${k.name}`, `Vigência: ${formatDate(c.start)} a ${formatDate(c.end)}`, ...extra]);
    notify(`${saved} baixado`);
  };
  const docs = useMemo(() => documentsFor(c), [c]);
  const approval = approvals.find((a) => a.contractId === c.id && a.status === "pendente");
  const pendingApprovers = approval?.chain.filter((s) => s.state !== "done").map((s) => personById(s.who).name.split(" ")[0]) ?? [];
  const off = clauses.filter((x) => x.deviation);
  const signedCount = signers.filter((s) => s.status === "assinou").length;
  const pendingSigner = signers.find((s) => s.status === "pendente");
  const lateObls = obls.filter((o) => !o.done && daysFromToday(o.due) < 0).length;
  const upcoming = obls.filter((o) => !o.done).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 3);
  const deadline = noticeDeadline(c);
  const toDeadline = daysFromToday(deadline);
  const months = Math.max(1, Math.round((daysFromToday(c.end) - daysFromToday(c.start)) / 30.4));
  const remainingAnnual = Math.max(0, Math.min(12, daysFromToday(c.end) / 30.4)) * (c.monthly ?? c.value / months);
  const fine = c.penalty.startsWith("5 %") ? 0.05 : 0.1;
  const newMonthly = (c.monthly ?? 0) * (1 + indexRate[renewIndex]);

  const log = (item: Omit<ActivityItem, "id" | "actor" | "time">) => setFeed((f) => [{ id: `n${Date.now()}`, actor: { name: me.name, initials: me.initials, tint: me.tint }, time: "Agora", ...item }, ...f]);
  const setStatus = (status: Contract["status"]) => setContract((x) => ({ ...x, status, updated: iso(0) }));

  const sendToApproval = () =>
    void op.run(
      async () => {
        await wait();
        setStatus("aprovacao");
        log({ action: "enviou para aprovação de", target: `${requester.name.split(" ")[0]}, Jurídico${c.value > 1_000_000 ? " e Diretoria financeira" : ""}`, icon: <Stamp /> });
      },
      `${c.number} enviado para aprovação`,
    );
  const sendToSign = () =>
    void op.run(
      async () => {
        await wait();
        setStatus("assinatura");
        setSigners((list) => list.map((s, i) => (i === 0 ? { ...s, status: "pendente", sentAt: iso(0) } : s)));
        log({ action: "enviou para assinatura eletrônica de", target: k.rep.name, icon: <FileSignature /> });
        setTab("assinaturas");
      },
      `Envelope enviado · ${k.rep.name} assina primeiro`,
    );
  const remind = (s: Signer) =>
    void remindOp.run(
      async () => {
        await wait(500);
        log({ action: "lembrou", target: s.name, icon: <BellRing /> });
      },
      `Lembrete enviado para ${s.name} (${s.email})`,
    );
  const toggleObl = (o: Obligation, done: boolean) => {
    setObls((all) => all.map((x) => (x.id === o.id ? { ...x, done } : x)));
    if (done) {
      log({ action: "marcou como cumprida", target: o.title, icon: <CheckCircle2 /> });
      notify(`Obrigação cumprida: ${o.title}`, () => setObls((all) => all.map((x) => (x.id === o.id ? { ...x, done: false } : x))));
    }
  };
  const duplicate = () => {
    const copy = addContract({ ...c, id: `n${Date.now()}`, number: nextNumber(), title: `${c.title} (cópia)`, status: "rascunho", start: iso(30), end: iso(395), deviations: [], updated: iso(0), signedAt: undefined, owner: me.id });
    notify(`Rascunho ${copy.number} criado a partir de ${c.number}`);
    go("clm-contract", copy.id);
  };

  /* Ação principal por situação (uma por área). */
  const primary = (() => {
    switch (c.status) {
      case "rascunho":
      case "negociacao":
        return (
          <OperationButton operation={op} onClick={sendToApproval}>
            <Stamp /> Enviar para aprovação
          </OperationButton>
        );
      case "aprovacao":
        return (
          <OperationButton operation={op} onClick={sendToSign} disabled={!!approval} disabledReason={approval ? `Falta a aprovação de ${pendingApprovers.join(" e ")}` : undefined}>
            <FileSignature /> Enviar para assinatura
          </OperationButton>
        );
      case "assinatura":
        return pendingSigner ? (
          <OperationButton operation={remindOp} onClick={() => remind(pendingSigner)}>
            <BellRing /> Lembrar {pendingSigner.name.split(" ")[0]}
          </OperationButton>
        ) : null;
      case "vigente":
      case "vencido":
        return (
          <Button onClick={() => setRenewOpen(true)}>
            <RefreshCw /> Renovar
          </Button>
        );
      default:
        return (
          <Button variant="ghost" onClick={duplicate}>
            Duplicar como rascunho
          </Button>
        );
    }
  })();

  return (
    <ClmShell section="contratos">
      <Page>
        <PageHeading
          crumbs={[{ label: "Contratos", href: frameHref("clm-contracts") }]}
          title={c.title}
          description={`${c.number} · ${k.name} · ${contractTypes[c.type].label}`}
          actions={
            <>
              {c.status === "aprovacao" && approval && (
                <Button variant="ghost" onClick={() => go("clm-approvals", approval.id)}>
                  Ver na fila de aprovação
                </Button>
              )}
              {primary}
              <ActionMenu
                actions={[
                  { label: c.status === "vigente" ? "Editar dados (gera aditivo)" : "Editar dados", disabled: c.status === "encerrado", onSelect: () => setEditOpen(true) },
                  { label: "Baixar PDF da última versão", onSelect: () => downloadDoc(versions[versions.length - 1].file) },
                  { label: "Duplicar como rascunho", onSelect: duplicate },
                  { label: "Encerrar contrato", tone: "danger", separator: true, disabled: !(c.status === "vigente" || c.status === "vencido"), onSelect: () => setEndOpen(true) },
                ]}
              />
            </>
          }
        />

        <OperationFeedback operation={op} />
        <StagePath stages={contractFlow} current={c.status === "vencido" || c.status === "encerrado" ? "vigente" : c.status} outcome={outcomeOf(c)} label="Situação do contrato" />

        <div className="mt-8">
          <SplitLayout
            asideWidth={340}
            main={
              <>
                <Tabs
                  label="Seções do contrato"
                  value={tab}
                  onChange={(v) => {
                    setTab(v);
                    setFrameQuery({ aba: v === "resumo" ? undefined : v, acao: undefined });
                  }}
                  items={[
                    { id: "resumo", label: "Resumo" },
                    { id: "versoes", label: "Versões" },
                    { id: "assinaturas", label: "Assinaturas", count: c.status === "assinatura" ? signers.length - signedCount : undefined },
                    { id: "obrigacoes", label: "Obrigações", count: lateObls || undefined },
                    { id: "documentos", label: "Documentos" },
                    { id: "atividade", label: "Atividade" },
                  ]}
                />
                <div className="mt-5">
                  {tab === "resumo" && (
                    <div className="space-y-7">
                      {c.status === "assinatura" && pendingSigner && (
                        <NextStep
                          title={`Falta a assinatura de ${pendingSigner.name}`}
                          action={
                            <Button size="sm" variant="ghost" onClick={() => setTab("assinaturas")}>
                              Ver assinaturas
                            </Button>
                          }
                        >
                          Envelope enviado {pendingSigner.sentAt ? `há ${-daysFromToday(pendingSigner.sentAt)} dias` : "hoje"}, aberto {plural(pendingSigner.views ?? 0, "vez", "vezes")}. {signedCount} de {signers.length} assinaturas concluídas.
                        </NextStep>
                      )}
                      {c.status === "vigente" && c.renewal === "automatica" && toDeadline <= 90 && (
                        <NextStep
                          title={toDeadline < 0 ? "Prazo de aviso prévio perdido" : `Decida até ${formatDate(deadline)} se o contrato renova`}
                          action={
                            <Button size="sm" variant="ghost" onClick={() => setRenewOpen(true)}>
                              Renovar
                            </Button>
                          }
                        >
                          {toDeadline < 0
                            ? `O contrato renova sozinho em ${formatDate(c.end)} por mais 12 meses. Para sair, negocie o encerramento com ${k.short}.`
                            : `Renova sozinho em ${formatDate(c.end)} por 12 meses, reajustado pelo ${c.index}. Para não renovar, avise ${k.short} por escrito até ${formatDate(deadline)}.`}
                        </NextStep>
                      )}
                      {c.status === "vencido" && (
                        <Callout tone="bad" title={`Venceu em ${formatDate(c.end)}`}>
                          A operação continua usando o serviço sem cobertura contratual. Renove por aditivo ou encerre formalmente.
                        </Callout>
                      )}
                      {c.status === "aprovacao" && approval && (
                        <Callout tone="warn" title={`Aguardando ${pendingApprovers.join(" e ")}`} action={<Button size="sm" variant="ghost" onClick={() => go("clm-approvals", approval.id)}>Abrir aprovação</Button>}>
                          {plural(off.length, "cláusula fora do padrão", "cláusulas fora do padrão")} em análise. Prazo da aprovação: {formatDate(approval.due)}.
                        </Callout>
                      )}

                      <section>
                        <h2 className="m-0 mb-3 text-[15px] font-medium">Partes</h2>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-xl border border-line bg-surface px-4 py-3.5">
                            <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted">Contratante</div>
                            <div className="mt-1.5 text-[13.5px] font-medium">{company.name}</div>
                            <div className="text-[12px] tabular-nums text-muted">CNPJ {company.cnpj}</div>
                            <div className="mt-2 text-[12.5px] text-ink-soft">
                              Representada por Gustavo Prado e Helena Castro · {company.city}
                            </div>
                          </div>
                          <a href={frameHref("clm-counterparties", k.id)} className="block rounded-xl border border-line bg-surface px-4 py-3.5 transition-colors hover:border-line-strong">
                            <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted">{c.type === "fornecimento" && k.segment.includes("cliente") ? "Compradora" : "Contratada"}</div>
                            <div className="mt-1.5 truncate text-[13.5px] font-medium">{k.name}</div>
                            <div className="text-[12px] tabular-nums text-muted">
                              {k.taxLabel} {k.taxId}
                            </div>
                            <div className="mt-2 text-[12.5px] text-ink-soft">
                              Representada por {k.rep.name}, {k.rep.role.toLowerCase()} · {k.place}
                            </div>
                          </a>
                        </div>
                      </section>

                      <section>
                        <h2 className="m-0 mb-3 text-[15px] font-medium">Valores e vigência</h2>
                        <StatGrid cols={3}>
                          <StatCell label="Valor total" value={c.value ? formatCurrency(c.value, { cents: false }) : "Sem valor"} hint={c.monthly ? `${formatCurrency(c.monthly)} por mês` : c.paymentTerms} />
                          <StatCell label="Vigência" value={`${months} meses`} hint={`${formatDate(c.start)} a ${formatDate(c.end)}`} />
                          <StatCell label="Fim" value={formatDate(c.end)} hint={<EndsIn contract={c} />} tone={c.status === "vencido" ? "bad" : daysFromToday(c.end) <= 30 && c.status === "vigente" ? "warn" : undefined} />
                          <StatCell label="Reajuste" value={c.index} hint={c.index === "Sem reajuste" ? "preço fixo" : `anual · 12 meses: ${formatPercent(indexRate[c.index], 2)}`} />
                          <StatCell label="Renovação" value={renewalInfo[c.renewal]} hint={c.renewal === "nenhuma" ? "termina na data final" : `aviso de ${c.noticeDays} dias · até ${formatDate(deadline)}`} tone={c.renewal === "automatica" && c.status === "vigente" && toDeadline < 0 ? "bad" : undefined} />
                          <StatCell label="Multa rescisória" value={c.value ? formatCurrency(remainingAnnual * fine, { compact: true }) : "—"} hint={c.penalty} />
                        </StatGrid>
                      </section>

                      <section>
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <h2 className="m-0 flex items-center gap-2 text-[15px] font-medium">
                            Cláusulas-chave <AiBadge label={`Extraídas da ${versions[versions.length - 1].version}`} />
                          </h2>
                          <span className="text-[12.5px] text-muted">{off.length ? plural(off.length, "fora do padrão", "fora do padrão") : "Todas iguais ao modelo"} · confira antes de assinar</span>
                        </div>
                        <ul className="m-0 list-none divide-y divide-line rounded-xl border border-line bg-surface p-0">
                          {clauses.map((cl) => {
                            const open = openClause === cl.id;
                            return (
                              <li key={cl.id} className={cn("px-4 py-3", cl.deviation && "bg-amber-soft/30")}>
                                <div className="flex flex-wrap items-start gap-x-3 gap-y-1.5">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted">
                                      <span className="font-medium text-ink">{clauseCategories[cl.category]}</span>
                                      <span>{cl.ref}</span>
                                    </div>
                                    <p className="m-0 mt-1 text-[13px] leading-relaxed text-ink-soft">{cl.summary}</p>
                                  </div>
                                  {cl.deviation ? (
                                    <span className="flex shrink-0 items-center gap-1.5">
                                      <Badge tone={riskInfo[cl.risk].tone}>Fora do padrão · {riskInfo[cl.risk].label.toLowerCase()}</Badge>
                                    </span>
                                  ) : (
                                    <Badge>Padrão</Badge>
                                  )}
                                </div>
                                {cl.deviation && (
                                  <>
                                    <button type="button" aria-expanded={open} onClick={() => setOpenClause(open ? null : cl.id)} className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-medium text-blue hover:underline">
                                      Comparar com o modelo
                                      <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} aria-hidden />
                                    </button>
                                    {open && (
                                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                        <div className="rounded-lg border border-line bg-surface px-3 py-2.5">
                                          <div className="text-[11px] font-medium text-muted">Modelo padrão</div>
                                          <p className="m-0 mt-1 text-[12.5px] leading-relaxed text-ink-soft">{cl.deviation.standard}</p>
                                        </div>
                                        <div className="rounded-lg border border-amber/40 bg-surface px-3 py-2.5">
                                          <div className="text-[11px] font-medium text-amber">Neste contrato</div>
                                          <p className="m-0 mt-1 text-[12.5px] leading-relaxed">{cl.deviation.proposed}</p>
                                        </div>
                                        {cl.deviation.note && <p className="m-0 text-[12px] text-muted sm:col-span-2">Justificativa: {cl.deviation.note}</p>}
                                      </div>
                                    )}
                                  </>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </section>
                    </div>
                  )}

                  {tab === "versoes" && (
                    <div className="space-y-7">
                      <RevisionTimeline
                        label="Versões da minuta"
                        today={iso(0)}
                        padDays={5}
                        futureDays={5}
                        height={180}
                        revisions={versions.map((v) => ({
                          id: v.id,
                          date: v.date,
                          time: v.time,
                          author: v.author,
                          kind: v.kind,
                          title: `${v.version} · ${v.title}`,
                          tag: v.tag ? <Badge tone="accent">{v.tag}</Badge> : undefined,
                          content: (
                            <>
                              <ul className="m-0 list-disc space-y-1 pl-4 text-[13px] text-ink-soft">
                                {v.changes.map((ch) => (
                                  <li key={ch}>{ch}</li>
                                ))}
                              </ul>
                              <button type="button" onClick={() => downloadDoc(v.file, `${v.version} · ${v.title}`, v.changes)} className="mt-3 text-[12.5px] font-medium text-blue hover:underline">
                                Baixar {v.file}
                              </button>
                            </>
                          ),
                        }))}
                      />
                      <section>
                        <h2 className="m-0 mb-4 text-[15px] font-medium">Histórico completo</h2>
                        <Timeline
                          leadingWidth={104}
                          items={[...versions].reverse().map((v, i) => ({
                            id: v.id,
                            current: i === 0,
                            tone: v.kind === "major" ? "accent" : "neutral",
                            leading: (
                              <>
                                <div className="font-mono text-[12.5px] font-medium">{v.version}</div>
                                <div className="text-[11.5px] text-muted">{formatDate(v.date, { short: true })}</div>
                              </>
                            ),
                            title: v.title,
                            meta: `${v.author} · ${formatDate(v.date, { short: true })}, ${v.time}`,
                            body: <span className="text-[12.5px] text-ink-soft">{v.changes.join(" · ")}</span>,
                          }))}
                        />
                      </section>
                    </div>
                  )}

                  {tab === "assinaturas" && (
                    <div className="space-y-4">
                      {c.status === "rascunho" || c.status === "negociacao" || c.status === "aprovacao" ? (
                        <Callout tone="info" title="Assinatura depois da aprovação">
                          O envelope é criado quando todas as aprovações terminarem. Ordem prevista abaixo; dá para mudar até o envio.
                        </Callout>
                      ) : (
                        <div className="rounded-xl border border-line bg-surface px-4 py-3.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-[13.5px] font-medium">
                                {signedCount} de {signers.length} assinaturas
                              </div>
                              <div className="text-[12px] text-muted">Envelope ASF-2026-88213 · Assina Fácil · ordem sequencial · expira em {formatDate(iso(26), { short: true })}</div>
                            </div>
                            <Badge tone={signedCount === signers.length ? "ok" : "warn"}>{signedCount === signers.length ? "Concluído" : "Em andamento"}</Badge>
                          </div>
                          <div className="mt-3">
                            <Meter value={(signedCount / signers.length) * 100} tone={signedCount === signers.length ? "ok" : "accent"} label={`${signedCount} de ${signers.length} assinaturas`} />
                          </div>
                        </div>
                      )}
                      <OperationFeedback operation={remindOp} />
                      <ol className="m-0 list-none divide-y divide-line rounded-xl border border-line bg-surface p-0">
                        {signers.map((s) => (
                          <li key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                            <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-medium tabular-nums", s.status === "assinou" ? "bg-primary text-on-primary" : s.status === "pendente" ? "ring-2 ring-accent" : "text-muted ring-1 ring-line-strong")}>
                              {s.order}
                            </span>
                            <Avatar initials={s.name.split(" ").filter((w) => w.length > 2 || w === w.toUpperCase()).slice(0, 2).map((w) => w[0]).join("")} name={s.name} size="sm" />
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-[13.5px] font-medium">{s.name}</div>
                              <div className="truncate text-[12px] text-muted">
                                {s.role} · {s.method}
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <span className="hidden text-right text-[12px] tabular-nums text-muted sm:block">
                                {s.status === "assinou" && s.at ? `em ${formatDate(s.at, { short: true })}` : s.status === "pendente" && s.sentAt ? `enviado há ${Math.max(0, -daysFromToday(s.sentAt))} dias · aberto ${plural(s.views ?? 0, "vez", "vezes")}` : ""}
                              </span>
                              <Badge tone={signerStatus[s.status].tone}>{signerStatus[s.status].label}</Badge>
                              {s.status === "pendente" && (
                                <Button size="sm" variant="ghost" onClick={() => remind(s)} disabled={remindOp.busy}>
                                  <BellRing /> Lembrar
                                </Button>
                              )}
                            </div>
                          </li>
                        ))}
                      </ol>
                      <p className="m-0 flex items-start gap-2 text-[12px] text-muted">
                        <ShieldCheck className="mt-px h-4 w-4 shrink-0" aria-hidden />
                        Assinaturas com certificado ICP-Brasil têm presunção de validade (MP 2.200-2/2001); gov.br vale como assinatura avançada (Lei 14.063/2020). O manifesto com IP, data e hash vai junto do PDF.
                      </p>
                    </div>
                  )}

                  {tab === "obrigacoes" && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="m-0 text-[12.5px] text-muted">Entregas, pagamentos, reajustes e avisos deste contrato. O responsável recebe lembrete 7 dias antes.</p>
                        <Button size="sm" variant="ghost" onClick={() => setOblOpen(true)} disabled={c.status === "encerrado"} disabledReason="Contrato encerrado">
                          <Plus /> Nova obrigação
                        </Button>
                      </div>
                      {obls.length ? (
                        <ul className="m-0 list-none divide-y divide-line rounded-xl border border-line bg-surface p-0">
                          {[...obls].sort((a, b) => a.due.localeCompare(b.due)).map((o) => {
                            const d = daysFromToday(o.due);
                            const lateOne = !o.done && d < 0;
                            return (
                              <li key={o.id} className="flex items-center gap-3 px-4 py-3">
                                <Checkbox hideLabel label={`Marcar como cumprida: ${o.title}`} checked={!!o.done} onCheckedChange={(v) => toggleObl(o, v)} />
                                <DateBadge date={o.due} size="sm" tone={o.done ? "neutral" : lateOne ? "bad" : d <= 7 ? "warn" : "neutral"} />
                                <div className="min-w-0 flex-1">
                                  <div className={cn("text-[13.5px]", o.done && "text-muted line-through")}>{o.title}</div>
                                  <div className="text-[12px] text-muted">
                                    {obligationKinds[o.kind]} · {o.party === "Vereda" ? "Vereda" : k.short} · {personById(o.owner).name}
                                    {o.value ? ` · ${formatCurrency(o.value)}` : ""}
                                  </div>
                                </div>
                                <Badge tone={o.done ? "ok" : lateOne ? "bad" : "neutral"}>{o.done ? "Cumprida" : lateOne ? `Atrasada ${-d} ${-d === 1 ? "dia" : "dias"}` : d === 0 ? "Hoje" : `Em ${d} dias`}</Badge>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <Empty title="Nenhuma obrigação cadastrada" hint="Cadastre entregas, pagamentos e avisos para receber lembretes antes do prazo." action={<Button size="sm" variant="ghost" onClick={() => setOblOpen(true)}><Plus /> Nova obrigação</Button>} />
                      )}
                    </div>
                  )}

                  {tab === "documentos" && (
                    <div className="space-y-4">
                      <FilesList
                        files={docs.map((d) => ({ id: d.id, name: d.name, kind: d.kind, meta: d.meta }))}
                        rowMenu={(f) => [
                          { label: "Baixar", onSelect: () => downloadDoc(f.name) },
                          { label: "Copiar link", onSelect: () => notify("Link copiado", undefined, "info") },
                        ]}
                      />
                      <FileDropzone
                        label="Adicionar anexo"
                        hint="PDF, DOCX ou XLSX até 20 MB · aditivos, certidões, apólices"
                        accept=".pdf,.docx,.xlsx"
                        maxSize={20_000_000}
                        items={files}
                        onFiles={(f) => {
                          setFiles((all) => [...all, ...f.map((x) => ({ id: `${x.name}-${Date.now()}`, name: x.name, size: x.size }))]);
                          log({ action: "anexou", target: f.map((x) => x.name).join(", "), icon: <Plus /> });
                          notify(`${plural(f.length, "anexo adicionado", "anexos adicionados")} a ${c.number}`);
                        }}
                        onRemove={(fid) => setFiles((all) => all.filter((x) => x.id !== fid))}
                      />
                    </div>
                  )}

                  {tab === "atividade" && (
                    <>
                      <TextareaField label="Comentário" hideLabel value={comment} onChange={setComment} minRows={2} placeholder="Comente, mencione alguém com @ ou registre uma negociação…" />
                      <div className="mt-2 flex justify-end">
                        <Button
                          size="sm"
                          disabled={!comment.trim()}
                          onClick={() => {
                            log({ action: "comentou", icon: <MessageSquare />, quote: comment.trim() });
                            setComment("");
                            notify("Comentário publicado");
                          }}
                        >
                          Comentar
                        </Button>
                      </div>
                      <ActivityFeed className="mt-6" items={feed} />
                    </>
                  )}
                </div>
              </>
            }
            aside={
              <>
                <section className="rounded-xl border border-line bg-surface px-4 py-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="m-0 text-[13px] font-medium">Detalhes</h2>
                    <Button size="sm" variant="quiet" onClick={() => setEditOpen(true)} disabled={c.status === "encerrado"}>
                      Editar
                    </Button>
                  </div>
                  <PropertyList
                    items={[
                      { label: "Situação", value: <ContractStatusBadge contract={c} /> },
                      { label: "Número", value: <span className="font-mono text-[12.5px]">{c.number}</span> },
                      { label: "Modelo", value: <a className="text-blue hover:underline" href={frameHref("clm-templates", { modelo: c.templateId })}>{templateById(c.templateId).name} · v{templateById(c.templateId).version}</a> },
                      { label: "Responsável", value: owner.name, hint: owner.role },
                      { label: "Solicitante", value: requester.name, hint: `${c.area} · ${c.costCenter}` },
                      { label: "Pagamento", value: c.paymentTerms },
                      { label: "Aviso prévio", value: c.renewal === "nenhuma" ? "Não se aplica" : `${c.noticeDays} dias`, hint: c.renewal === "nenhuma" ? undefined : `até ${formatDate(deadline)}` },
                      { label: "Foro", value: c.deviations.find((d) => d.category === "foro")?.proposed.replace(/\.$/, "") ?? company.forum },
                      { label: "LGPD", value: c.lgpd === "operador" ? "Contraparte é operadora" : c.lgpd === "controlador conjunto" ? "Controladores conjuntos" : "Sem dados pessoais" },
                      { label: "Assinado em", value: c.signedAt ? formatDate(c.signedAt) : "—" },
                    ]}
                  />
                </section>
                <section className="rounded-xl border border-line bg-surface px-4 py-4">
                  <a href={frameHref("clm-counterparties", k.id)} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-1 hover:bg-soft/60">
                    <EntityMark name={k.short} tint={k.tint} className="h-9 w-9 text-[12px]" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-medium">{k.name}</div>
                      <div className="truncate text-[12px] tabular-nums text-muted">
                        {k.taxLabel} {k.taxId}
                      </div>
                    </div>
                  </a>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <LocationTag place={k.place} timeZone={k.timeZone} />
                    <Badge tone={diligenceOf(k).tone}>{diligenceOf(k).label}</Badge>
                  </div>
                </section>
                <section className="rounded-xl border border-line bg-surface px-4 py-4">
                  <h2 className="m-0 mb-3 text-[13px] font-medium">Próximos prazos</h2>
                  {upcoming.length ? (
                    <ul className="m-0 list-none space-y-2.5 p-0">
                      {upcoming.map((o) => (
                        <li key={o.id} className="flex items-center gap-3">
                          <DateBadge date={o.due} size="sm" tone={daysFromToday(o.due) < 0 ? "bad" : daysFromToday(o.due) <= 7 ? "warn" : "neutral"} />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[13px]">{o.title}</div>
                            <div className="truncate text-[12px] text-muted">{obligationKinds[o.kind]}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="m-0 text-[12.5px] text-muted">Sem prazos em aberto.</p>
                  )}
                </section>
              </>
            }
          />
        </div>
      </Page>

      {/* Editar dados: antes da assinatura edita a minuta; depois, vira aditivo. */}
      <Drawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        kicker={c.number}
        title={c.status === "vigente" ? "Editar dados por aditivo" : "Editar dados do contrato"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <OperationButton
              operation={saveOp}
              onClick={() =>
                void saveOp.run(
                  async () => {
                    await wait();
                    setContract(draft);
                    log({ action: c.status === "vigente" ? "abriu o aditivo de" : "editou os dados de", target: c.number, icon: <PenLine /> });
                    setEditOpen(false);
                  },
                  c.status === "vigente" ? `Aditivo de ${c.number} criado como rascunho` : "Dados do contrato salvos",
                )
              }
            >
              {c.status === "vigente" ? "Criar aditivo" : "Salvar alterações"}
            </OperationButton>
          </>
        }
      >
        <div className="space-y-4">
          <OperationFeedback operation={saveOp} />
          {c.status === "vigente" && <Callout tone="info">Contrato assinado não muda direto: as alterações viram um aditivo (modelo “Aditivo de prazo e reajuste”) que passa por aprovação e assinatura.</Callout>}
          <TextField label="Objeto" value={draft.title} onChange={(v) => setDraft((d) => ({ ...d, title: v }))} />
          <div className="grid gap-4 sm:grid-cols-2">
            <CurrencyField label="Valor total" value={draft.value} onChange={(v) => setDraft((d) => ({ ...d, value: v ?? 0 }))} />
            <CurrencyField label="Valor mensal" optional value={draft.monthly ?? null} onChange={(v) => setDraft((d) => ({ ...d, monthly: v ?? undefined }))} />
            <DatePicker label="Início" value={draft.start} onValueChange={(v) => setDraft((d) => ({ ...d, start: v }))} />
            <DatePicker label="Fim" value={draft.end} onValueChange={(v) => setDraft((d) => ({ ...d, end: v }))} min={draft.start} />
            <Select label="Renovação" value={draft.renewal} onValueChange={(v) => setDraft((d) => ({ ...d, renewal: v as Renewal }))} options={Object.entries(renewalInfo).map(([value, label]) => ({ value, label }))} />
            <NumberField label="Aviso prévio" suffix="dias" value={draft.noticeDays} onChange={(v) => setDraft((d) => ({ ...d, noticeDays: v ?? 0 }))} min={0} />
            <Select label="Índice de reajuste" value={draft.index} onValueChange={(v) => setDraft((d) => ({ ...d, index: v as PriceIndex }))} options={indexes.map((i) => ({ value: i, label: i }))} />
            <Select label="Responsável no Jurídico" value={draft.owner} onValueChange={(v) => setDraft((d) => ({ ...d, owner: v }))} options={legal.map((p) => ({ value: p.id, label: p.name, description: p.role }))} />
          </div>
        </div>
      </Drawer>

      {/* Renovar: gera aditivo de prazo e reajuste. */}
      <Drawer
        open={renewOpen}
        onClose={() => {
          setRenewOpen(false);
          setFrameQuery({ acao: undefined });
        }}
        kicker={`${c.number} · ${k.short}`}
        title="Renovar contrato"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRenewOpen(false)}>
              Cancelar
            </Button>
            <OperationButton
              operation={renewOp}
              onClick={() =>
                void renewOp.run(
                  async () => {
                    await wait(900);
                    setContract((x) => ({ ...x, end: renewEnd, index: renewIndex, monthly: x.monthly ? newMonthly : x.monthly, status: "vigente" }));
                    log({ action: "criou o aditivo de renovação até", target: formatDate(renewEnd), icon: <RefreshCw /> });
                    setRenewOpen(false);
                    setFrameQuery({ acao: undefined });
                  },
                  `Aditivo de renovação de ${c.number} enviado para aprovação`,
                )
              }
            >
              Gerar aditivo
            </OperationButton>
          </>
        }
      >
        <div className="space-y-4">
          <OperationFeedback operation={renewOp} />
          <p className="text-[13px] leading-relaxed text-muted">Gera um aditivo do modelo “Aditivo de prazo e reajuste v1.2”. As demais cláusulas continuam como estão; o aditivo passa por aprovação e assinatura.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <DatePicker label="Novo fim da vigência" value={renewEnd} onValueChange={setRenewEnd} min={c.end} />
            <Select label="Índice de reajuste" value={renewIndex} onValueChange={(v) => setRenewIndex(v as PriceIndex)} options={indexes.map((i) => ({ value: i, label: i, description: i === "Sem reajuste" ? undefined : `12 meses: ${formatPercent(indexRate[i], 2)}` }))} />
          </div>
          {c.monthly ? (
            <StatGrid cols={2}>
              <StatCell label="Mensalidade atual" value={formatCurrency(c.monthly)} />
              <StatCell label="Com reajuste" value={formatCurrency(newMonthly)} hint={`+${formatPercent(indexRate[renewIndex], 2)} · ${formatCurrency(newMonthly * 12, { compact: true })} por ano`} />
            </StatGrid>
          ) : (
            <Callout tone="info">Contrato sem valor mensal: o reajuste vale sobre os preços unitários do anexo.</Callout>
          )}
          {annualValue(c) > 1_000_000 && <Callout tone="warn">Acima de R$ 1 milhão por ano: também precisa da Diretoria financeira.</Callout>}
        </div>
      </Drawer>

      <Drawer
        open={oblOpen}
        onClose={() => setOblOpen(false)}
        kicker={c.number}
        title="Nova obrigação"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOblOpen(false)}>
              Cancelar
            </Button>
            <OperationButton
              operation={oblOp}
              disabled={!newObl.title.trim()}
              disabledReason="Descreva a obrigação"
              onClick={() =>
                void oblOp.run(
                  async () => {
                    await wait(500);
                    setObls((all) => [...all, { id: `o${Date.now()}`, contractId: c.id, party: newObl.kind === "pagamento" || newObl.kind === "aviso" ? "Vereda" : "Contraparte", ...newObl, title: newObl.title.trim() }]);
                    setOblOpen(false);
                    setNewObl((o) => ({ ...o, title: "" }));
                  },
                  `Obrigação cadastrada para ${formatDate(newObl.due)}`,
                )
              }
            >
              Cadastrar obrigação
            </OperationButton>
          </>
        }
      >
        <div className="space-y-4">
          <OperationFeedback operation={oblOp} />
          <TextField label="O que precisa ser feito" value={newObl.title} onChange={(v) => setNewObl((o) => ({ ...o, title: v }))} placeholder="Ex.: Entregar relatório trimestral de SLA" autoFocus />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Tipo" value={newObl.kind} onValueChange={(v) => setNewObl((o) => ({ ...o, kind: v as ObligationKind }))} options={Object.entries(obligationKinds).map(([value, label]) => ({ value, label }))} />
            <DatePicker label="Prazo" value={newObl.due} onValueChange={(v) => setNewObl((o) => ({ ...o, due: v }))} min={iso(0)} />
          </div>
          <Select label="Responsável" value={newObl.owner} onValueChange={(v) => setNewObl((o) => ({ ...o, owner: v }))} options={people.map((p) => ({ value: p.id, label: p.name, description: `${p.role} · ${p.area}` }))} />
        </div>
      </Drawer>

      <ConfirmDialog
        open={endOpen}
        onClose={() => setEndOpen(false)}
        onConfirm={() => {
          const prev = c.status;
          setStatus("encerrado");
          log({ action: "encerrou o contrato", target: c.number, icon: <CheckCircle2 /> });
          setEndOpen(false);
          notify(`${c.number} encerrado · notificação enviada a ${k.short}`, () => setStatus(prev));
        }}
        title={`Encerrar ${c.number}?`}
        description={
          c.status === "vencido"
            ? `O contrato já venceu em ${formatDate(c.end)}. Encerrar registra o fim e envia o termo de encerramento para ${k.short} assinar.`
            : `Encerrar antes de ${formatDate(c.end)} aplica a multa rescisória (${c.penalty}): cerca de ${formatCurrency(remainingAnnual * fine, { cents: false })}. ${k.short} recebe a notificação com ${c.noticeDays || 30} dias de aviso.`
        }
        confirmLabel="Encerrar contrato"
        tone="danger"
      />
    </ClmShell>
  );
}
