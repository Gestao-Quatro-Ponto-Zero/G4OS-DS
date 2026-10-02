import { ArrowLeft, Check, CheckCircle2, ExternalLink, X } from "lucide-react";
import { useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  Callout,
  EntityMark,
  Empty,
  FactLine,
  OperationButton,
  OperationFeedback,
  Page,
  PageHeading,
  Stepper,
  Tabs,
  TextareaField,
  cn,
  formatCurrency,
  formatDate,
  plural,
  useOperation,
} from "@g4ai/ds";
import {
  approvals as seed,
  awaitingMe,
  clauseCategories,
  contractById,
  contractTypes,
  counterpartyById,
  daysFromToday,
  iso,
  me,
  personById,
  renewalInfo,
  riskInfo,
  templateById,
  type Approval,
  type ApprovalStatus,
} from "./data/contracts";
import { frameHref, setFrameQuery, useFrameParam } from "./shells/frame-route";
import { ClmShell, LoadError, LoadingRows, useListState } from "./shells/clm-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Fila de aprovação",
  description: "Mestre-detalhe (?id=): contratos esperando você, cadeia de aprovadores, o que muda em relação ao modelo padrão (cláusulas fora do padrão lado a lado, com risco e justificativa) e aprovar ou recusar com comentário.",
  category: "Contratos",
  order: 5,
  height: 1040,
  concept: {
    goal: "Aprovar ou recusar um contrato olhando só o que foge do modelo padrão, sem reler a minuta inteira.",
    patterns: [
      "Anatomia F · Mestre-detalhe: fila à esquerda, aprovação à direita; seleção no endereço (?id=); no celular o detalhe abre em tela cheia com Voltar",
      "Diferenças contra o modelo: padrão × proposto lado a lado, risco em palavra e “alternativa já aprovada” quando existe na biblioteca",
      "Cadeia de aprovação (Stepper) com o comentário de quem já aprovou",
      "Recusar exige comentário; aprovar passa para o próximo da cadeia",
      "Cinco estados na fila: ?estado=carregando|vazio|erro",
    ],
    adapt: [
      "Aprovação de pedidos de compra, propostas comerciais com desconto, políticas internas",
    ],
    avoid: [
      "Mostrar a minuta inteira para aprovar: o aprovador precisa do que mudou",
      "Recusar sem dizer o que precisa mudar",
    ],
  },
} as const;

const statusBadge: Record<ApprovalStatus, { label: string; tone: "warn" | "ok" | "bad" }> = {
  pendente: { label: "Aguardando", tone: "warn" },
  aprovada: { label: "Aprovada", tone: "ok" },
  recusada: { label: "Recusada", tone: "bad" },
};
const wait = (ms = 700) => new Promise((r) => setTimeout(r, ms));

export default function ClmApprovals() {
  const estado = useListState();
  const idParam = useFrameParam("id");
  const [list, setList] = useState(seed);
  const [tab, setTab] = useState<"minhas" | "todas">(idParam && !seed.find((a) => a.id === idParam && awaitingMe(a)) ? "todas" : "minhas");
  const [comment, setComment] = useState("");
  const [tried, setTried] = useState(false);
  const op = useOperation({ busyLabel: "Registrando…" });

  const mine = list.filter(awaitingMe);
  const visible = tab === "minhas" ? mine : list;
  const current = list.find((a) => a.id === idParam) ?? visible[0];
  const open = (a: Approval) => {
    setComment("");
    setTried(false);
    op.reset();
    setFrameQuery({ id: a.id });
  };

  const decide = (approve: boolean) => {
    if (!current) return;
    if (!approve && !comment.trim()) {
      setTried(true);
      return;
    }
    const c = contractById(current.contractId);
    const idx = current.chain.findIndex((s) => s.who === me.id && s.state === "current");
    const next = current.chain[idx + 1];
    void op.run(
      async () => {
        await wait();
        setList((all) =>
          all.map((a) =>
            a.id !== current.id
              ? a
              : {
                  ...a,
                  status: !approve ? "recusada" : next ? "pendente" : "aprovada",
                  chain: a.chain.map((s, i) => (i === idx ? { ...s, state: "done", at: iso(0), comment: comment.trim() || undefined } : approve && i === idx + 1 ? { ...s, state: "current" } : s)),
                },
          ),
        );
        setComment("");
        setTried(false);
      },
      !approve ? `${c.number} recusado · ${personById(current.requestedBy).name.split(" ")[0]} recebeu o comentário` : next ? `${c.number} aprovado · seguiu para ${personById(next.who).name}` : `${c.number} aprovado · pronto para assinatura`,
    );
  };

  return (
    <ClmShell section="aprovacoes">
      <Page>
        <PageHeading title="Aprovações" description="Área solicitante → Jurídico → Diretoria financeira acima de R$ 1 milhão → Diretor-presidente acima de R$ 3 milhões." />
        <Tabs
          label="Filtro da fila"
          value={tab}
          onChange={(v) => setTab(v as typeof tab)}
          items={[
            { id: "minhas", label: "Aguardando você", count: mine.length },
            { id: "todas", label: "Todas" },
          ]}
        />
        <div className="mt-5">
          {estado === "carregando" ? (
            <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
              <LoadingRows rows={4} variant="cards" label="Carregando aprovações" />
              <LoadingRows rows={5} label="Carregando detalhe" />
            </div>
          ) : estado === "erro" ? (
            <LoadError what="a fila de aprovação" />
          ) : estado === "vazio" || !visible.length ? (
            <Empty
              icon={<CheckCircle2 />}
              title="Nada esperando você"
              hint="Quando um contrato chegar à etapa do Jurídico, ele aparece aqui. Enquanto isso, veja o que já foi decidido."
              action={
                <Button variant="ghost" onClick={() => (estado ? setFrameQuery({ estado: undefined }) : setTab("todas"))}>
                  Ver todas as aprovações
                </Button>
              }
            />
          ) : (
            <div className="grid items-start gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
              {/* Fila */}
              <ul className={cn("m-0 list-none space-y-2 p-0", idParam && "hidden lg:block")} aria-label="Aprovações">
                {visible.map((a) => {
                  const c = contractById(a.contractId);
                  const k = counterpartyById(c.counterpartyId);
                  const on = a.id === current?.id;
                  const d = daysFromToday(a.due);
                  return (
                    <li key={a.id}>
                      <button
                        type="button"
                        aria-current={on ? "true" : undefined}
                        onClick={() => open(a)}
                        className={cn("w-full rounded-xl border px-4 py-3 text-left transition-colors", on ? "border-line-strong bg-surface shadow-raised" : "border-line bg-surface hover:border-line-strong")}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[11.5px] text-muted">{c.number}</span>
                          <span className="flex gap-1">
                            {a.status === "pendente" && d <= 1 && <Badge tone="warn">{d <= 0 ? "Vence hoje" : "Até amanhã"}</Badge>}
                            <Badge tone={statusBadge[a.status].tone}>{statusBadge[a.status].label}</Badge>
                          </span>
                        </div>
                        <div className="mt-1.5 text-[13.5px] font-medium leading-snug">{c.title}</div>
                        <div className="mt-1.5 flex items-center justify-between gap-2 text-[12px] text-muted">
                          <span className="flex min-w-0 items-center gap-1.5">
                            <EntityMark name={k.short} tint={k.tint} className="h-5 w-5 text-[10px]" />
                            <span className="truncate">{k.short}</span>
                          </span>
                          <span className="shrink-0">{c.deviations.length ? plural(c.deviations.length, "desvio", "desvios") : "Igual ao modelo"}</span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {/* Detalhe */}
              {current && <Detail approval={current} hidden={!idParam} comment={comment} setComment={setComment} tried={tried} op={op} decide={decide} />}
            </div>
          )}
        </div>
      </Page>
    </ClmShell>
  );
}

function Detail({
  approval: a,
  hidden,
  comment,
  setComment,
  tried,
  op,
  decide,
}: {
  approval: Approval;
  hidden: boolean;
  comment: string;
  setComment: (v: string) => void;
  tried: boolean;
  op: ReturnType<typeof useOperation>;
  decide: (approve: boolean) => void;
}) {
  const c = contractById(a.contractId);
  const k = counterpartyById(c.counterpartyId);
  const t = templateById(c.templateId);
  const requester = personById(a.requestedBy);
  const canDecide = awaitingMe(a);
  const high = c.deviations.filter((d) => d.risk === "alto").length;
  const prior = a.chain.filter((s) => s.comment);
  return (
    <section className={cn("min-w-0 rounded-2xl border border-line bg-surface", hidden && "hidden lg:block")} aria-label={`Aprovação de ${c.number}`}>
      <header className="border-b border-line px-5 py-5 sm:px-6">
        <button type="button" onClick={() => setFrameQuery({ id: undefined })} className="mb-3 inline-flex items-center gap-1 text-[12.5px] text-muted hover:text-ink lg:hidden">
          <ArrowLeft className="h-4 w-4" /> Fila
        </button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[12px] text-muted">
              <span className="font-mono">{c.number}</span> · {contractTypes[c.type].label} · pedida em {formatDate(a.requestedAt, { short: true })}
            </div>
            <h2 className="m-0 mt-1 text-[18px] font-semibold tracking-tight">{c.title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-muted">
              <span className="flex items-center gap-1.5">
                <EntityMark name={k.short} tint={k.tint} className="h-5 w-5 text-[10px]" /> {k.name}
              </span>
              <span className="flex items-center gap-1.5">
                <Avatar initials={requester.initials} tint={requester.tint} name={requester.name} size="sm" /> {requester.name} · {requester.area}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <Badge tone={statusBadge[a.status].tone}>{statusBadge[a.status].label}</Badge>
            <a href={frameHref("clm-contract", c.id)} className="inline-flex items-center gap-1 text-[12.5px] font-medium text-blue hover:underline">
              Abrir contrato <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
        <div className="mt-4">
          <FactLine
            facts={[
              { label: "Valor", value: c.value ? formatCurrency(c.value, { cents: false }) : "Sem valor" },
              { label: "Vigência", value: `${formatDate(c.start)} a ${formatDate(c.end)}` },
              { label: "Reajuste", value: c.index },
              { label: "Renovação", value: renewalInfo[c.renewal] },
              { label: "Prazo", value: formatDate(a.due) },
            ]}
          />
        </div>
      </header>

      <div className="space-y-7 px-5 py-6 sm:px-6">
        <blockquote className="border-l-2 border-line-strong pl-3 text-[13px] leading-relaxed text-ink-soft">{a.reason}</blockquote>

        <Stepper label="Cadeia de aprovação" steps={a.chain.map((s, i) => ({ id: String(i), label: s.role, hint: s.who === me.id ? "Você" : `${personById(s.who).name}${s.at ? ` · ${formatDate(s.at, { short: true })}` : ""}`, state: s.state }))} />

        {prior.length > 0 && (
          <ul className="list-none space-y-2 p-0">
            {prior.map((s) => {
              const p = personById(s.who);
              return (
                <li key={s.role} className="flex gap-2.5 rounded-xl bg-soft/60 px-3 py-2.5">
                  <Avatar initials={p.initials} tint={p.tint} name={p.name} size="sm" />
                  <div className="min-w-0 text-[12.5px]">
                    <span className="font-medium">{p.name}</span> <span className="text-muted">· {s.role}</span>
                    <p className="m-0 mt-0.5 leading-relaxed text-ink-soft">{s.comment}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <section>
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="m-0 text-[15px] font-medium">O que muda em relação ao modelo</h3>
            <span className="text-[12.5px] text-muted">
              {t.name} v{t.version} · {plural(a.sameAsTemplate, "cláusula igual", "cláusulas iguais")} ao padrão
            </span>
          </div>
          {high > 0 && (
            <div className="mb-3">
              <Callout tone="warn">{plural(high, "desvio de risco alto", "desvios de risco alto")}: sem alternativa aprovada na biblioteca, precisa da sua decisão expressa.</Callout>
            </div>
          )}
          {c.deviations.length ? (
            <ul className="m-0 list-none space-y-3 p-0">
              {c.deviations.map((d) => (
                <li key={d.title} className="rounded-xl border border-line">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5">
                    <div className="min-w-0">
                      <span className="text-[13.5px] font-medium">{d.title}</span>
                      <span className="ml-2 text-[12px] text-muted">{clauseCategories[d.category]}</span>
                    </div>
                    <span className="flex flex-wrap gap-1">
                      {d.approvedAlternative && <Badge tone="ok">Alternativa aprovada</Badge>}
                      <Badge tone={riskInfo[d.risk].tone}>{riskInfo[d.risk].label}</Badge>
                    </span>
                  </div>
                  <div className="grid sm:grid-cols-2">
                    <div className="border-b border-line px-4 py-3 sm:border-b-0 sm:border-r">
                      <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted">Modelo padrão</div>
                      <p className="m-0 mt-1 text-[12.5px] leading-relaxed text-muted line-through decoration-line-strong">{d.standard}</p>
                    </div>
                    <div className="bg-amber-soft/30 px-4 py-3">
                      <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-amber">Proposto</div>
                      <p className="m-0 mt-1 text-[12.5px] leading-relaxed">{d.proposed}</p>
                    </div>
                  </div>
                  {d.note && <p className="m-0 border-t border-line px-4 py-2.5 text-[12px] leading-relaxed text-muted">Justificativa: {d.note}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <Empty framed title="Igual ao modelo padrão" hint="Nenhuma cláusula foi alterada. Confira os dados comerciais e aprove." />
          )}
        </section>

        {canDecide ? (
          <div className="rounded-xl border border-line bg-soft/40 p-4">
            <OperationFeedback operation={op} />
            <TextareaField
              label="Comentário"
              hint="Obrigatório para recusar. Vai para quem pediu e fica no histórico do contrato."
              value={comment}
              onChange={setComment}
              minRows={2}
              error={tried && !comment.trim() ? "Diga o que precisa mudar para aprovar." : undefined}
              placeholder="Ex.: aprovo com teto de 4 % por trimestre no reajuste; ajustar a cláusula 6ª."
            />
            <div className="mt-3 flex flex-wrap justify-end gap-2">
              <Button variant="ghost" onClick={() => decide(false)} disabled={op.busy}>
                <X /> Recusar
              </Button>
              <OperationButton operation={op} onClick={() => decide(true)}>
                <Check /> {comment.trim() ? "Aprovar com ressalva" : "Aprovar"}
              </OperationButton>
            </div>
          </div>
        ) : (
          a.status === "pendente" && (
            <Callout tone="info">
              Aguardando {a.chain.filter((s) => s.state === "current").map((s) => personById(s.who).name).join(", ")}. Você pode acompanhar, mas a decisão é de quem está na etapa atual.
            </Callout>
          )
        )}
      </div>
    </section>
  );
}

