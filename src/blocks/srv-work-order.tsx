import { CalendarClock, Camera, CheckCircle2, ClipboardCheck, Clock, Eraser, FileText, Keyboard, Package, PenLine, Play, Plus, Printer, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import {
  ActionMenu,
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  Avatar,
  Badge,
  Button,
  Callout,
  Checkbox,
  Combobox,
  ConfirmDialog,
  EntityMark,
  FileDropzone,
  IconButton,
  LocationTag,
  Meter,
  Modal,
  NumberField,
  OperationButton,
  OperationFeedback,
  Page,
  PageHeading,
  PropertyList,
  SegmentedControl,
  Select,
  SplitLayout,
  StagePath,
  Tabs,
  TextField,
  Timeline,
  formatCurrency,
  formatDate,
  formatNumber,
  notify,
  useOperation,
  type TimelineItem,
  Table,
} from "@g4ai/ds";
import { clientById, contractById, dm, materialById, materials, priorityInfo, quoteById, quotes, slaOf, techById, technicians, woById, woFromQuote, woLabor, woMaterials, woStages, woValue, workOrders, type WoStage, type WorkOrder } from "./data/servicos";
import { frameHref, go, useFrameParam } from "./shells/frame-route";
import { ScheduleDialog, ServicosShell } from "./shells/servicos-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Ordem de serviço",
  description: "Registro da OS (?id=): etapas, checklist de execução, apontamento de horas por técnico, materiais, fotos e anexos, assinatura do cliente, local do atendimento com hora local, histórico e ações por estado (Agendar, Iniciar, Concluir, Faturar → NFS-e).",
  category: "Serviços",
  order: 4,
  height: 1100,
  concept: {
    goal: "Levar um atendimento do chamado à nota fiscal com prova do que foi feito: checklist, horas, materiais, fotos e assinatura.",
    patterns: [
      "Anatomia C · Registro: trilha, título, ação do estado à direita; propriedades fixas na coluna",
      "Uma ação primária por estado: Agendar → Iniciar → Concluir → Faturar; Concluir exige checklist e assinatura (disabledReason diz o que falta)",
      "Abas: Execução (checklist + assinatura), Horas e materiais, Fotos e anexos, Histórico (Timeline)",
      "LocationTag mostra o local e a hora local do atendimento; SLA em palavra",
      "Valor a faturar separa mão de obra coberta pelo contrato de materiais",
      "Orçamento aprovado abre aqui como OS nova (?id=orc-<orçamento>)",
    ],
    adapt: [
      "Chamado de assistência técnica, visita de vistoria, entrega com comprovante",
    ],
    avoid: [
      "Concluir sem assinatura (o cliente contesta a cobrança)",
      "Todas as ações visíveis em todos os estados",
    ],
  },
} as const;

export default function SrvWorkOrder() {
  const id = useFrameParam("id", "w4");
  const fromQuote = id.startsWith("orc-") ? woFromQuote(quoteById(id.slice(4)) ?? quotes[0]) : null;
  const wo = fromQuote ?? woById(id) ?? workOrders[0];
  return <WorkOrderRecord key={id} initial={wo} fresh={!!fromQuote} />;
}

const nowTime = "11:42";

function WorkOrderRecord({ initial, fresh }: { initial: WorkOrder; fresh: boolean }) {
  const [w, setW] = useState(initial);
  const [tab, setTab] = useState("execucao");
  const [scheduling, setScheduling] = useState(false);
  const [billing, setBilling] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signature, setSignature] = useState<Signature | null>(null);
  const [cancel, setCancel] = useState(false);
  const [addingHours, setAddingHours] = useState(false);
  const [history, setHistory] = useState<TimelineItem[]>(() => historyOf(initial));
  const bill = useOperation({ busyLabel: "Emitindo NFS-e…" });
  const finish = useOperation({ busyLabel: "Concluindo…" });
  useEffect(() => {
    if (fresh) notify(`${initial.number} criada do orçamento ${quoteById(initial.quoteId)?.number}`, undefined, "info");
  }, [fresh, initial]);

  const k = clientById(w.clientId);
  const tech = techById(w.techId);
  const contract = contractById(w.contractId);
  const sla = slaOf(w);
  const done = w.checklist.filter((c) => c.done).length;
  const log = (title: string, tone?: TimelineItem["tone"]) => setHistory((h) => [{ id: `h${Date.now()}`, title, meta: `Hoje, ${nowTime} · Renata Albuquerque`, tone }, ...h]);
  const setStage = (stage: WoStage, message: string, extra?: Partial<WorkOrder>) => {
    const before = w;
    setW((x) => ({ ...x, stage, ...extra }));
    log(message);
    notify(message, () => setW(before));
  };

  const missing = [done < w.checklist.length && `${w.checklist.length - done} itens do checklist`, !w.signedBy && "assinatura do cliente"].filter(Boolean).join(" e ");

  const primary = () => {
    switch (w.stage) {
      case "aberta":
        return (
          <Button onClick={() => setScheduling(true)}>
            <CalendarClock /> Agendar
          </Button>
        );
      case "agendada":
        return (
          <Button onClick={() => setStage("execucao", `${w.number} iniciada por ${tech?.name ?? "técnico"}`, { hours: [...w.hours, { id: `hh${Date.now()}`, techId: w.techId ?? "diego", date: "2026-09-30", start: nowTime, end: "agora", hours: 0.5, note: "Check-in no local" }] })}>
            <Play /> Iniciar atendimento
          </Button>
        );
      case "execucao":
        return (
          <OperationButton
            operation={finish}
            disabled={!!missing}
            disabledReason={missing ? `Falta ${missing}.` : undefined}
            onClick={() => {
              const before = w;
              void finish.run(() => new Promise((r) => setTimeout(r, 600)), { message: `${w.number} concluída · relatório enviado a ${k.contact}`, undo: () => setW(before) }, { apply: () => (setW((x) => ({ ...x, stage: "concluida", hours: x.hours.map((h) => (h.end === "agora" ? { ...h, end: nowTime } : h)) })), log("Concluiu a OS e enviou o relatório ao cliente", "ok")), revert: () => setW(before) });
            }}
          >
            <CheckCircle2 /> Concluir OS
          </OperationButton>
        );
      case "concluida":
        return (
          <Button onClick={() => setBilling(true)}>
            <FileText /> Faturar
          </Button>
        );
      default:
        return (
          <Button variant="ghost" href={frameHref("srv-invoices", w.invoiceId ?? "n3")}>
            <FileText /> Ver NFS-e
          </Button>
        );
    }
  };

  return (
    <ServicosShell section="os">
      {/* Impressão: o registro da OS vira o relatório (sem navegação nem botões). */}
      <style>{`@media print { aside[aria-label="Menu principal"], nav[aria-label="Navegação principal"], [role="tablist"], button { display: none !important; } }`}</style>
      <Page>
        <PageHeading
          crumbs={[{ label: "Ordens de serviço", href: frameHref("srv-work-orders") }]}
          title={`${w.number} · ${w.title}`}
          description={`${k.name} · ${w.kind} · aberta em ${formatDate(w.openedAt)}${w.quoteId ? ` · do orçamento ${quoteById(w.quoteId)?.number}` : ""}`}
          actions={
            <>
              {primary()}
              <ActionMenu
                actions={[
                  ...(w.stage === "agendada" ? [{ label: "Reagendar", icon: <CalendarClock />, onSelect: () => setScheduling(true) }] : []),
                  { label: "Imprimir relatório da OS", icon: <Printer />, onSelect: () => setTimeout(() => window.print(), 50) },
                  { label: "Cancelar OS", tone: "danger", separator: true, disabled: w.stage === "faturada", onSelect: () => setCancel(true) },
                ]}
              />
            </>
          }
        />
        <StagePath stages={woStages} current={w.stage} label="Etapa da OS" />
        {sla.late && (
          <div className="mt-5">
          <Callout tone="bad" title={`SLA estourado · prazo era ${dm(w.due)} às ${w.dueTime}`}>
            {contract ? `O contrato ${contract.number} prevê atendimento em ${contract.sla}. Registre o motivo no histórico para o relatório mensal do cliente.` : "Avise o cliente do novo prazo antes de reagendar."}
          </Callout>
          </div>
        )}

        <div className="mt-6">
          <SplitLayout
            asideWidth={330}
            main={
              <>
                <Tabs
                  label="Seções da OS"
                  value={tab}
                  onChange={setTab}
                  items={[
                    { id: "execucao", label: "Execução" },
                    { id: "horas", label: "Horas e materiais" },
                    { id: "fotos", label: "Fotos e anexos" },
                    { id: "historico", label: "Histórico" },
                  ]}
                />
                <div className="mt-5 space-y-6">
                  {tab === "execucao" && (
                    <>
                      <section className="rounded-xl border border-line bg-surface">
                        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
                          <h2 className="m-0 flex items-center gap-2 text-[13.5px] font-medium">
                            <ClipboardCheck className="h-4 w-4 text-muted" aria-hidden /> Checklist de execução
                          </h2>
                          <span className="text-[12px] tabular-nums text-muted">
                            {done} de {w.checklist.length}
                          </span>
                        </header>
                        <div className="px-4 pt-3">
                          <Meter value={(done / Math.max(1, w.checklist.length)) * 100} tone={done === w.checklist.length ? "ok" : "ink"} thick label="Checklist concluído" />
                        </div>
                        <ul className="m-0 list-none divide-y divide-line p-0">
                          {w.checklist.map((c) => (
                            <li key={c.id} className="px-4 py-2.5">
                              <Checkbox
                                label={c.label}
                                checked={c.done}
                                disabled={w.stage !== "execucao"}
                                onCheckedChange={(v) => setW((x) => ({ ...x, checklist: x.checklist.map((y) => (y.id === c.id ? { ...y, done: v } : y)) }))}
                              />
                            </li>
                          ))}
                        </ul>
                        {w.stage !== "execucao" && w.stage !== "concluida" && w.stage !== "faturada" && <p className="m-0 border-t border-line px-4 py-2.5 text-[12px] text-muted">O checklist libera quando o técnico inicia o atendimento.</p>}
                      </section>

                      <section className="rounded-xl border border-line bg-surface px-4 py-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h2 className="m-0 flex items-center gap-2 text-[13.5px] font-medium">
                            <PenLine className="h-4 w-4 text-muted" aria-hidden /> Assinatura do cliente
                          </h2>
                          {!w.signedBy && w.stage === "execucao" && (
                            <Button size="sm" variant="ghost" onClick={() => setSigning(true)}>
                              Coletar assinatura
                            </Button>
                          )}
                        </div>
                        {w.signedBy ? (
                          <div className="mt-3 rounded-lg border border-line bg-soft px-4 py-3">
                            {signature?.image ? (
                              <img src={signature.image} alt={`Assinatura de ${w.signedBy}`} className="h-20 w-auto max-w-full" />
                            ) : (
                              <p className="m-0 text-[20px] italic leading-tight text-ink" style={{ fontFamily: "cursive" }}>
                                {w.signedBy}
                              </p>
                            )}
                            <p className="m-0 mt-1 text-[12px] text-muted">
                              {signature ? `${w.signedBy} · ${signature.image ? "desenhada" : "digitada"} hoje às ${signature.at}` : `Assinado no app do técnico · ${w.schedule ? `${dm(w.schedule.date)} às ${w.schedule.end}` : "hoje"}`} · confirmou o serviço executado
                            </p>
                          </div>
                        ) : (
                          <p className="m-0 mt-2 text-[12.5px] text-muted">Sem assinatura. O responsável no local assina no celular do técnico ao fim do atendimento.</p>
                        )}
                      </section>

                      <section className="rounded-xl border border-line bg-surface px-4 py-4">
                        <h2 className="m-0 text-[13.5px] font-medium">Descrição do chamado</h2>
                        <p className="m-0 mt-2 text-[13.5px] leading-relaxed text-ink-soft">{w.description}</p>
                      </section>
                    </>
                  )}

                  {tab === "horas" && <HoursAndMaterials w={w} setW={setW} onAddHours={() => setAddingHours(true)} />}

                  {tab === "fotos" && <Photos w={w} />}

                  {tab === "historico" && (
                    <section className="rounded-xl border border-line bg-surface px-4 py-4">
                      <Timeline items={history} />
                    </section>
                  )}
                </div>
              </>
            }
            aside={
              <>
                <section className="rounded-xl border border-line bg-surface p-4">
                  <a href={frameHref("srv-client", k.id)} className="mb-3 flex items-center gap-3 rounded-lg hover:bg-soft">
                    <EntityMark name={k.name} tint={k.tint} className="h-9 w-9 text-[12px]" />
                    <span className="min-w-0">
                      <span className="block truncate text-[13.5px] font-medium">{k.name}</span>
                      <span className="block text-[12px] tabular-nums text-muted">{k.cnpj}</span>
                    </span>
                  </a>
                  <LocationTag place={`${k.district}, São Paulo`} timeZone="America/Sao_Paulo" status={w.stage === "execucao" ? { label: "Técnico no local", tone: "ok" } : undefined} />
                  <p className="m-0 mt-2 text-[12.5px]">{w.site}</p>
                  <p className="m-0 text-[12px] text-muted">{k.address}</p>
                  <PropertyList className="mt-3" items={[{ label: "Contato no local", value: k.contact, hint: k.phone }]} />
                </section>
                <section className="rounded-xl border border-line bg-surface p-4">
                  <PropertyList
                    items={[
                      {
                        label: "Técnico",
                        value: tech ? (
                          <span className="inline-flex items-center gap-2">
                            <Avatar initials={tech.initials} tint={tech.tint} name={tech.name} size="sm" status={tech.status} /> {tech.name}
                          </span>
                        ) : (
                          <span className="text-amber">Sem técnico</span>
                        ),
                        hint: tech?.skill,
                      },
                      { label: "Agendado", value: w.schedule ? `${dm(w.schedule.date)} · ${w.schedule.start}–${w.schedule.end}` : undefined },
                      { label: "Prioridade", value: <Badge tone={priorityInfo[w.priority].tone}>{priorityInfo[w.priority].label}</Badge> },
                      { label: "SLA", value: <span className={sla.late ? "font-medium text-rose" : sla.tone === "warn" ? "text-amber" : undefined}>{sla.label}</span>, hint: `prazo ${dm(w.due)} às ${w.dueTime}` },
                      { label: "Contrato", value: contract ? <a className="hover:underline" href={frameHref("srv-contracts", contract.id)}>{contract.number}</a> : "Avulsa", hint: contract?.plan },
                    ]}
                  />
                </section>
                <section className="rounded-xl border border-line bg-surface p-4">
                  <h2 className="m-0 mb-3 text-[13px] font-medium">A faturar</h2>
                  <PropertyList
                    items={[
                      { label: "Mão de obra", value: <span className="tabular-nums">{formatCurrency(woLabor(w))}</span>, hint: w.covered ? "coberta pelo contrato" : `${formatNumber(w.hours.reduce((s, h) => s + h.hours, 0), 1)} h apontadas` },
                      { label: "Materiais", value: <span className="tabular-nums">{formatCurrency(woMaterials(w))}</span> },
                      { label: "Total da NFS-e", value: <span className="text-[15px] font-semibold tabular-nums">{formatCurrency(woValue(w))}</span>, hint: w.covered ? "só materiais e deslocamento extra" : "inclui visita técnica" },
                    ]}
                  />
                </section>
              </>
            }
          />
        </div>
      </Page>

      <ScheduleDialog
        wo={w}
        open={scheduling}
        onClose={() => setScheduling(false)}
        onConfirm={(c) => {
          setW((x) => ({ ...x, stage: "agendada", techId: c.techId, schedule: { date: c.date, start: c.start, end: c.end } }));
          log(`Agendou com ${techById(c.techId)?.name} em ${dm(c.date)} às ${c.start}`);
        }}
      />
      <Modal
        open={billing}
        onClose={() => setBilling(false)}
        size="sm"
        title={`Faturar ${w.number}?`}
        description={`Emite a NFS-e na Prefeitura de São Paulo e gera a cobrança para ${k.name}.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setBilling(false)} disabled={bill.busy}>
              Cancelar
            </Button>
            <OperationButton
              operation={bill}
              onClick={() => {
                const before = w;
                void bill.run(() => new Promise((r) => setTimeout(r, 900)), { message: `${w.number} faturada · NFS-e enviada à prefeitura`, undo: () => setW(before) }, { apply: () => (setW((x) => ({ ...x, stage: "faturada", invoiceId: "n1" })), log("Faturou e enviou a NFS-e à prefeitura", "ok")), revert: () => setW(before) }).then((err) => !err && setBilling(false));
              }}
            >
              <FileText /> Faturar e emitir NFS-e
            </OperationButton>
          </>
        }
      >
        <OperationFeedback operation={bill} />
        <PropertyList
          items={[
            { label: "Valor da nota", value: <span className="font-semibold tabular-nums">{formatCurrency(woValue(w))}</span> },
            { label: "ISS", value: k.issWithheld ? "Retido pelo tomador" : "Recolhido pela Vértice no DAS" },
            { label: "Cobrança", value: contract ? `${contract.method}, vencimento dia ${contract.billingDay}` : "Boleto em 10 dias" },
          ]}
        />
      </Modal>
      {signing && (
        <SignatureModal
          onClose={() => setSigning(false)}
          contact={k.contact}
          onSign={(sig) => {
            setW((x) => ({ ...x, signedBy: sig.name }));
            setSignature(sig);
            log(`${sig.name} assinou a OS no local${sig.image ? "" : " (assinatura digitada)"}`, "ok");
            notify(`Assinatura de ${sig.name} registrada`, () => {
              setW((x) => ({ ...x, signedBy: undefined }));
              setSignature(null);
            });
          }}
        />
      )}
      {addingHours && (
        <HoursModal
          onClose={() => setAddingHours(false)}
          defaultTech={w.techId}
          onAdd={(entry) => {
            setW((x) => ({ ...x, hours: [...x.hours, entry] }));
            log(`Apontou ${formatNumber(entry.hours, 1)} h de ${techById(entry.techId)?.name}`);
            notify("Horas apontadas");
          }}
        />
      )}
      <ConfirmDialog
        open={cancel}
        onClose={() => setCancel(false)}
        title={`Cancelar a ${w.number}?`}
        description="O técnico perde o agendamento e o cliente recebe um aviso. Horas e materiais apontados não serão faturados. Isso não pode ser desfeito."
        confirmLabel="Cancelar OS"
        cancelLabel="Manter OS"
        tone="danger"
        onConfirm={() => {
          setCancel(false);
          notify(`${w.number} cancelada`);
          go("srv-work-orders");
        }}
      />
    </ServicosShell>
  );
}

function historyOf(w: WorkOrder): TimelineItem[] {
  const tech = techById(w.techId);
  const k = clientById(w.clientId);
  const items: TimelineItem[] = [];
  if (w.stage === "faturada") items.push({ id: "t5", title: "NFS-e emitida e cobrança gerada", meta: `${dm(w.due)} · Marcelo Faria`, tone: "ok" });
  if (w.signedBy) items.push({ id: "t4", title: `${w.signedBy} assinou a OS no local`, meta: w.schedule ? `${dm(w.schedule.date)} às ${w.schedule.end}` : undefined, tone: "ok" });
  if (w.stage === "execucao" || w.stage === "concluida" || w.stage === "faturada") items.push({ id: "t3", title: `${tech?.name ?? "Técnico"} fez check-in no local`, meta: w.schedule ? `${dm(w.schedule.date)} às ${w.schedule.start} · pelo app` : undefined, body: `${w.photos} fotos anexadas durante o atendimento.` });
  if (w.schedule && tech) items.push({ id: "t2", title: `Agendada com ${tech.name}`, meta: `${dm(w.openedAt)} · Renata Albuquerque`, body: `${dm(w.schedule.date)}, das ${w.schedule.start} às ${w.schedule.end}` });
  items.push({ id: "t1", title: w.quoteId ? `Criada do orçamento ${quoteById(w.quoteId)?.number}` : `Chamado aberto por ${k.contact}`, meta: `${dm(w.openedAt)} · ${w.quoteId ? "Bianca Souto" : "portal do cliente"}`, current: w.stage === "aberta" });
  return items;
}

function HoursAndMaterials({ w, setW, onAddHours }: { w: WorkOrder; setW: (fn: (x: WorkOrder) => WorkOrder) => void; onAddHours: () => void }) {
  const [mat, setMat] = useState("");
  const [qty, setQty] = useState<number | null>(1);
  const editable = w.stage === "execucao" || w.stage === "concluida";
  const totalHours = w.hours.reduce((s, h) => s + h.hours, 0);
  return (
    <>
      <section className="overflow-hidden rounded-xl border border-line bg-surface">
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <h2 className="m-0 flex items-center gap-2 text-[13.5px] font-medium">
            <Clock className="h-4 w-4 text-muted" aria-hidden /> Apontamento de horas
          </h2>
          {editable && (
            <Button size="sm" variant="ghost" onClick={onAddHours}>
              <Plus /> Apontar horas
            </Button>
          )}
        </header>
        {w.hours.length ? (
          <Table label="Horas apontadas" className="rounded-none border-0">
              <thead className="bg-soft text-[12px] text-muted">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Técnico</th>
                  <th className="px-4 py-2 text-left font-medium">Dia</th>
                  <th className="px-4 py-2 text-left font-medium">Período</th>
                  <th className="px-4 py-2 text-right font-medium">Horas</th>
                  <th className="px-4 py-2 text-right font-medium">Custo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {w.hours.map((h) => {
                  const t = techById(h.techId);
                  return (
                    <tr key={h.id}>
                      <td className="px-4 py-2">
                        <span className="flex items-center gap-2">
                          <Avatar initials={t?.initials ?? "?"} tint={t?.tint} name={t?.name ?? ""} size="sm" />
                          <span className="min-w-0">
                            <span className="block">{t?.name}</span>
                            <span className="block text-[11.5px] text-muted">{h.note}</span>
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-2 tabular-nums text-muted">{dm(h.date)}</td>
                      <td className="px-4 py-2 tabular-nums text-muted">
                        {h.start}–{h.end}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">{formatNumber(h.hours, 1)} h</td>
                      <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(h.hours * (t?.rate ?? 140))}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t border-line text-[13px]">
                <tr>
                  <td className="px-4 py-2 font-medium" colSpan={3}>
                    Total
                  </td>
                  <td className="px-4 py-2 text-right font-medium tabular-nums">{formatNumber(totalHours, 1)} h</td>
                  <td className="px-4 py-2 text-right font-medium tabular-nums">{formatCurrency(woLabor(w))}</td>
                </tr>
              </tfoot>
          </Table>
        ) : (
          <p className="m-0 px-4 py-6 text-center text-[13px] text-muted">Nenhuma hora apontada. As horas entram pelo check-in e check-out do técnico no app.</p>
        )}
      </section>

      <section className="overflow-hidden rounded-xl border border-line bg-surface">
        <header className="border-b border-line px-4 py-3">
          <h2 className="m-0 flex items-center gap-2 text-[13.5px] font-medium">
            <Package className="h-4 w-4 text-muted" aria-hidden /> Materiais usados
          </h2>
        </header>
        {w.materials.length ? (
          <ul className="m-0 list-none divide-y divide-line p-0 text-[13px]">
            {w.materials.map((m) => {
              const ref = materialById(m.materialId);
              return (
                <li key={m.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="min-w-0 flex-1">{ref.name}</span>
                  <span className="tabular-nums text-muted">
                    {formatNumber(m.qty)} {ref.unit} × {formatCurrency(ref.price)}
                  </span>
                  <span className="w-24 text-right tabular-nums">{formatCurrency(m.qty * ref.price)}</span>
                  {editable && (
                    <IconButton size="sm" label={`Remover ${ref.name}`} onClick={() => setW((x) => ({ ...x, materials: x.materials.filter((y) => y.id !== m.id) }))}>
                      <Trash2 />
                    </IconButton>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="m-0 px-4 py-4 text-[13px] text-muted">Nenhum material lançado.</p>
        )}
        {editable && (
          <div className="grid items-end gap-3 border-t border-line bg-soft px-4 py-3 sm:grid-cols-[2fr_1fr_auto]">
            <Combobox label="Material" placeholder="Busque no almoxarifado" value={mat} onValueChange={setMat} options={materials.map((m) => ({ value: m.id, label: m.name, description: `${formatCurrency(m.price)}/${m.unit}` }))} />
            <NumberField label="Quantidade" value={qty} onChange={setQty} min={1} />
            <Button
              variant="ghost"
              disabled={!mat || !qty}
              disabledReason="Escolha o material e a quantidade."
              onClick={() => {
                setW((x) => ({ ...x, materials: [...x.materials, { id: `m${Date.now()}`, materialId: mat, qty: qty ?? 1 }] }));
                notify(`${materialById(mat).name} lançado na OS`);
                setMat("");
              }}
            >
              <Plus /> Lançar
            </Button>
          </div>
        )}
      </section>
    </>
  );
}

function Photos({ w }: { w: WorkOrder }) {
  const [extra, setExtra] = useState<{ id: string; name: string; size: number; progress?: number }[]>([]);
  const labels = ["Antes · quadro aberto", "Diagnóstico", "Peça substituída", "Depois · teste", "Local limpo", "Etiqueta do equipamento"];
  return (
    <section className="space-y-4">
      {w.photos ? (
        <AttachmentGroup layout="grid" label="Fotos do atendimento">
          {Array.from({ length: w.photos }, (_, i) => (
            <Attachment key={i} orientation="vertical">
              <AttachmentMedia>
                <Camera />
              </AttachmentMedia>
              <AttachmentContent>
                <AttachmentTitle>{labels[i % labels.length]}</AttachmentTitle>
                <AttachmentDescription>{w.schedule ? `${dm(w.schedule.date)} · ${techById(w.techId)?.name.split(" ")[0]}` : "—"}</AttachmentDescription>
              </AttachmentContent>
            </Attachment>
          ))}
        </AttachmentGroup>
      ) : (
        <p className="m-0 rounded-xl border border-dashed border-line px-4 py-6 text-center text-[13px] text-muted">Nenhuma foto ainda. O técnico tira antes e depois pelo app.</p>
      )}
      <FileDropzone
        label="Anexar fotos ou laudos"
        hint="JPG, PNG ou PDF até 10 MB. Laudos de PMOC e ART também vão para o portal do cliente."
        accept="image/*,.pdf"
        maxSize={10 * 1024 * 1024}
        items={extra}
        onRemove={(rid) => setExtra((all) => all.filter((f) => f.id !== rid))}
        onFiles={(files) => {
          setExtra((all) => [...all, ...files.map((f) => ({ id: `${f.name}-${f.size}`, name: f.name, size: f.size }))]);
          notify(`${files.length === 1 ? "1 arquivo anexado" : `${files.length} arquivos anexados`} à OS`);
        }}
      />
    </section>
  );
}

type Signature = { name: string; image?: string; at: string };

/**
 * Área de assinatura em <canvas>: pointer events (mouse, toque e caneta, com
 * pressão quando houver), traço na cor do token --ds-ink (segue o tema).
 * Quem não usa ponteiro assina pela aba "Digitar nome" (assinatura tipográfica).
 */
function SignaturePad({ onChange, label }: { onChange: (image: string | null) => void; label: string }) {
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [inked, setInked] = useState(false);

  // Ajusta a resolução ao tamanho exibido (nítido em telas de alta densidade).
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const fit = () => {
      const dpr = window.devicePixelRatio || 1;
      el.width = Math.round(el.clientWidth * dpr);
      el.height = Math.round(el.clientHeight * dpr);
      setInked(false);
      onChange(null);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [onChange]);

  const point = (e: PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const dpr = e.currentTarget.width / r.width;
    return { x: (e.clientX - r.left) * dpr, y: (e.clientY - r.top) * dpr, dpr };
  };
  const stroke = (e: PointerEvent<HTMLCanvasElement>) => {
    const g = e.currentTarget.getContext("2d");
    const p = point(e);
    if (!g || !last.current) return;
    g.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--ds-ink").trim() || getComputedStyle(e.currentTarget).color;
    g.lineCap = "round";
    g.lineJoin = "round";
    // Caneta: espessura pela pressão; mouse e dedo: traço uniforme.
    g.lineWidth = (e.pointerType === "pen" && e.pressure ? 1.2 + e.pressure * 2.6 : 2.4) * p.dpr;
    g.beginPath();
    g.moveTo(last.current.x, last.current.y);
    g.lineTo(p.x, p.y);
    g.stroke();
    last.current = p;
  };
  const clear = () => {
    const el = canvas.current;
    el?.getContext("2d")?.clearRect(0, 0, el.width, el.height);
    setInked(false);
    onChange(null);
  };

  return (
    <div>
      <div className="relative">
        <canvas
          ref={canvas}
          role="img"
          aria-label={label}
          className="block h-36 w-full cursor-crosshair touch-none rounded-lg border border-line-strong bg-surface text-ink"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            drawing.current = true;
            last.current = point(e);
          }}
          onPointerMove={(e) => drawing.current && stroke(e)}
          onPointerUp={(e) => {
            if (!drawing.current) return;
            stroke(e);
            drawing.current = false;
            last.current = null;
            setInked(true);
            onChange(e.currentTarget.toDataURL("image/png"));
          }}
          onPointerCancel={() => {
            drawing.current = false;
            last.current = null;
          }}
        />
        {!inked && (
          <span aria-hidden className="pointer-events-none absolute inset-x-6 bottom-6 border-t border-dashed border-line-strong pt-1 text-center text-[12px] text-muted">
            Assine aqui com o dedo, a caneta ou o mouse
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[12px] text-muted">{inked ? "Assinatura desenhada" : "Nenhum traço ainda"}</span>
        <Button size="sm" variant="quiet" onClick={clear} disabled={!inked} disabledReason="Nada para limpar.">
          <Eraser /> Limpar
        </Button>
      </div>
    </div>
  );
}

function SignatureModal({ onClose, contact, onSign }: { onClose: () => void; contact: string; onSign: (s: Signature) => void }) {
  const [name, setName] = useState(contact);
  const [mode, setMode] = useState<"desenhar" | "digitar">("desenhar");
  const [image, setImage] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const signed = mode === "desenhar" ? !!image : !!name.trim();
  const reason = !name.trim() ? "Preencha o nome de quem assina." : !signed ? "Desenhe a assinatura ou use “Digitar nome”." : !ok ? "Confirme o serviço executado." : undefined;
  return (
    <Modal
      open
      onClose={onClose}
      size="md"
      title="Coletar assinatura"
      description="Entregue o celular ao responsável no local. A assinatura vai no relatório da OS e na NFS-e."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={!!reason}
            disabledReason={reason}
            onClick={() => {
              onSign({ name: name.trim(), image: mode === "desenhar" ? (image ?? undefined) : undefined, at: nowTime });
              onClose();
            }}
          >
            <PenLine /> Registrar assinatura
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <TextField label="Nome de quem assina" value={name} onChange={setName} />
        <SegmentedControl
          label="Forma de assinar"
          value={mode}
          onChange={setMode}
          options={[
            { value: "desenhar", label: "Desenhar", icon: <PenLine /> },
            { value: "digitar", label: "Digitar nome", icon: <Keyboard /> },
          ]}
        />
        {mode === "desenhar" ? (
          <SignaturePad onChange={setImage} label={`Área de assinatura de ${name.trim() || "quem assina"}. Sem mouse ou toque, use “Digitar nome”.`} />
        ) : (
          <div className="rounded-lg border border-line bg-soft px-4 py-4">
            <p className="m-0 text-[12px] text-muted">Assinatura tipográfica: o nome digitado acima vale como assinatura, com data, hora e o aparelho registrados.</p>
            <p className="m-0 mt-2 min-h-8 text-[24px] italic leading-tight text-ink" style={{ fontFamily: "cursive" }} aria-live="polite">
              {name.trim() || "Seu nome aparece aqui"}
            </p>
          </div>
        )}
        <Checkbox label="Confirmo que o serviço foi executado conforme o checklist" checked={ok} onCheckedChange={setOk} />
      </div>
    </Modal>
  );
}

function HoursModal({ onClose, onAdd, defaultTech }: { onClose: () => void; onAdd: (h: WorkOrder["hours"][number]) => void; defaultTech?: string }) {
  const [techId, setTechId] = useState(defaultTech ?? technicians[0].id);
  const [hours, setHours] = useState<number | null>(1);
  const [note, setNote] = useState("");
  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title="Apontar horas"
      description="Use quando o check-in do app falhou ou para registrar apoio de outro técnico."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={!hours}
            disabledReason="Informe as horas."
            onClick={() => {
              onAdd({ id: `h${Date.now()}`, techId, date: "2026-09-30", start: "—", end: "—", hours: hours ?? 0, note: note.trim() || "Apontamento manual" });
              onClose();
            }}
          >
            Apontar horas
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Select label="Técnico" value={techId} onValueChange={setTechId} options={technicians.map((t) => ({ value: t.id, label: t.name, description: `${t.skill} · ${formatCurrency(t.rate)}/h` }))} />
        <NumberField label="Horas" value={hours} onChange={setHours} min={0.5} step={0.5} digits={1} suffix="h" />
        <TextField label="Observação" optional value={note} onChange={setNote} placeholder="Ex.: apoio para içar a condensadora" />
      </div>
    </Modal>
  );
}
