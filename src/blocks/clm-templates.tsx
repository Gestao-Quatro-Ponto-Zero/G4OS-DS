import { ArrowLeft, BookPlus, FilePlus2, FileText, Plus, ShieldCheck } from "lucide-react";
import { useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  Callout,
  Drawer,
  Empty,
  OperationButton,
  OperationFeedback,
  Page,
  PageHeading,
  PropertyList,
  Select,
  Tabs,
  TextField,
  TextareaField,
  cn,
  formatCurrency,
  formatDate,
  formatNumber,
  plural,
  useOperation,
} from "@g4ai/ds";
import {
  clauseCategories,
  clauseLibrary as clauseSeed,
  contracts,
  contractTypes,
  daysFromToday,
  iso,
  me,
  personById,
  riskInfo,
  templates as seed,
  templateTypeLabel,
  type ClauseAlternative,
  type ContractType,
  type LibraryClause,
  type Risk,
  type Template,
} from "./data/contracts";
import { go, setFrameQuery, useFrameParam } from "./shells/frame-route";
import { ClmShell, LoadError, LoadingRows, useListState } from "./shells/clm-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Modelos e cláusulas",
  description: "Modelos de contrato aprovados pelo Jurídico (versão, última revisão, uso, quem pode usar sem o Jurídico) e a biblioteca de cláusulas com o texto padrão, orientação de uso e alternativas pré-aprovadas por risco e alçada.",
  category: "Contratos",
  order: 6,
  height: 980,
  concept: {
    goal: "Manter os modelos e as cláusulas que o Jurídico aceita num só lugar, para que as áreas peçam contratos sem reinventar texto e a aprovação só olhe o que foge disso.",
    patterns: [
      "Anatomia A · Lista (modelos) com Drawer de detalhe por ?modelo=; Anatomia F · Mestre-detalhe (cláusulas) com ?clausula=",
      "Revisão vencida (mais de 1 ano) aparece com palavra, não só cor",
      "Quem pode usar: áreas com autoatendimento e limite de valor",
      "Alternativas aprovadas com risco, alçada e quantas vezes foram usadas",
      "Propor alternativa e criar modelo em Drawer, com operação e aviso ao terminar",
      "Cinco estados: ?estado=carregando|vazio|erro",
    ],
    adapt: [
      "Políticas internas, modelos de proposta comercial, biblioteca de respostas de RFP",
    ],
    avoid: [
      "Cláusula alternativa sem dizer quem pode aprovar",
      "Editar o modelo publicado direto: nova versão passa por revisão",
    ],
  },
} as const;

const wait = (ms = 700) => new Promise((r) => setTimeout(r, ms));
const statusInfo = { publicado: { label: "Publicado", tone: "ok" as const }, "em-revisao": { label: "Em revisão", tone: "warn" as const } };
const stale = (d: string) => daysFromToday(d) < -365;

export default function ClmTemplates() {
  const estado = useListState();
  const aba = useFrameParam("aba");
  const modelo = useFrameParam("modelo");
  const clausula = useFrameParam("clausula");
  const [list, setList] = useState(seed);
  const [clauses, setClauses] = useState(clauseSeed);
  const tab = aba === "clausulas" || clausula ? "clausulas" : "modelos";
  const open = list.find((t) => t.id === modelo);
  const current = clauses.find((c) => c.id === clausula) ?? clauses[0];

  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<{ name: string; type: ContractType; base: string }>({ name: "", type: "servico", base: "t1" });
  const createOp = useOperation({ busyLabel: "Criando…" });
  const [proposing, setProposing] = useState(false);
  const [alt, setAlt] = useState<{ label: string; text: string; risk: Risk }>({ label: "", text: "", risk: "medio" });
  const altOp = useOperation({ busyLabel: "Enviando…" });

  const contractsFrom = (t: Template) => contracts.filter((c) => c.templateId === t.id).length;

  return (
    <ClmShell section="modelos">
      <Page>
        <PageHeading
          title="Modelos e cláusulas"
          description="O que o Jurídico já aprovou. Contrato que sai de um modelo sem alteração dispensa revisão completa."
          actions={
            tab === "modelos" ? (
              <Button onClick={() => setCreating(true)}>
                <FilePlus2 /> Novo modelo
              </Button>
            ) : (
              <Button onClick={() => setProposing(true)}>
                <BookPlus /> Propor alternativa
              </Button>
            )
          }
        />
        <Tabs
          label="Biblioteca"
          value={tab}
          onChange={(v) => setFrameQuery({ aba: v === "clausulas" ? "clausulas" : undefined, clausula: undefined, modelo: undefined })}
          items={[
            { id: "modelos", label: "Modelos" },
            { id: "clausulas", label: "Cláusulas" },
          ]}
        />
        <div className="mt-5">
          {estado === "carregando" ? (
            <LoadingRows rows={6} label="Carregando modelos" />
          ) : estado === "erro" ? (
            <LoadError what="a biblioteca" />
          ) : estado === "vazio" ? (
            <Empty
              title="Nenhum modelo publicado"
              hint="Comece pelo modelo mais pedido (em geral, prestação de serviços e NDA). As áreas passam a pedir contratos a partir dele."
              action={
                <Button onClick={() => setCreating(true)}>
                  <FilePlus2 /> Novo modelo
                </Button>
              }
            />
          ) : tab === "modelos" ? (
            <div className="overflow-hidden rounded-xl border border-line bg-surface">
              <div className="hidden grid-cols-[minmax(0,1.6fr)_110px_150px_90px_minmax(0,1fr)_110px] gap-4 border-b border-line bg-soft px-4 py-2.5 text-[12px] font-medium text-muted md:grid">
                <span>Modelo</span>
                <span>Versão</span>
                <span>Última revisão</span>
                <span className="text-right">Uso 12 m</span>
                <span>Quem pode usar</span>
                <span>Situação</span>
              </div>
              <ul className="m-0 list-none divide-y divide-line p-0">
                {list.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => setFrameQuery({ modelo: t.id })}
                      className="grid w-full gap-x-4 gap-y-1.5 px-4 py-3 text-left transition-colors hover:bg-soft/60 md:grid-cols-[minmax(0,1.6fr)_110px_150px_90px_minmax(0,1fr)_110px] md:items-center"
                    >
                      <span className="flex min-w-0 items-start gap-3">
                        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-soft text-muted ring-1 ring-line">
                          <FileText className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[13.5px] font-medium">{t.name}</span>
                          <span className="block truncate text-[12px] text-muted">{templateTypeLabel(t)} · {plural(t.clauses.length, "cláusula da biblioteca", "cláusulas da biblioteca")}</span>
                        </span>
                      </span>
                      <span className="font-mono text-[12.5px] text-ink-soft">
                        <span className="text-muted md:hidden">Versão </span>v{t.version}
                      </span>
                      <span className="text-[12.5px] leading-tight">
                        <span className={cn("block tabular-nums", stale(t.lastReview) ? "text-rose" : "text-ink-soft")}>{formatDate(t.lastReview)}{stale(t.lastReview) && " · revisão vencida"}</span>
                        <span className="block text-[11.5px] text-muted">{personById(t.reviewer).name}</span>
                      </span>
                      <span className="text-[12.5px] tabular-nums md:text-right">
                        {formatNumber(t.uses)}
                        <span className="text-muted md:hidden"> contratos em 12 meses</span>
                      </span>
                      <span className="flex min-w-0 flex-wrap gap-1">
                        {t.selfService.length ? t.selfService.slice(0, 3).map((a) => <Badge key={a}>{a}</Badge>) : <span className="text-[12.5px] text-muted">Só o Jurídico</span>}
                        {t.selfService.length > 3 && <Badge>+{t.selfService.length - 3}</Badge>}
                      </span>
                      <span>
                        <Badge tone={statusInfo[t.status].tone}>{statusInfo[t.status].label}</Badge>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="grid items-start gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
              <ul className={cn("m-0 list-none space-y-1 p-0", clausula && "hidden lg:block")} aria-label="Cláusulas">
                {clauses.map((c) => {
                  const on = c.id === current.id;
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        aria-current={on ? "true" : undefined}
                        onClick={() => setFrameQuery({ aba: "clausulas", clausula: c.id })}
                        className={cn("w-full rounded-xl border px-3.5 py-2.5 text-left transition-colors", on ? "border-line-strong bg-surface shadow-raised" : "border-transparent hover:bg-soft/60")}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-[13.5px] font-medium">{c.title}</span>
                          <span className="shrink-0 text-[12px] tabular-nums text-muted">{c.alternatives.length ? plural(c.alternatives.length, "alternativa") : "Fixa"}</span>
                        </span>
                        <span className="block text-[12px] text-muted">{clauseCategories[c.category]}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <ClauseDetail clause={current} hidden={!clausula} onPropose={() => setProposing(true)} />
            </div>
          )}
        </div>
      </Page>

      {/* Detalhe do modelo */}
      <Drawer
        open={!!open}
        onClose={() => setFrameQuery({ modelo: undefined })}
        kicker={open ? `${templateTypeLabel(open)} · v${open.version}` : undefined}
        title={open?.name ?? ""}
        footer={
          <>
            <Button variant="ghost" onClick={() => setFrameQuery({ modelo: undefined })}>
              Fechar
            </Button>
            <Button onClick={() => go("clm-request", { modelo: open?.id })} disabled={open?.status !== "publicado"} disabledReason="Modelo em revisão: ainda não pode ser usado">
              <FilePlus2 /> Usar este modelo
            </Button>
          </>
        }
      >
        {open && (
          <div className="space-y-6">
            <p className="m-0 text-[13.5px] leading-relaxed text-ink-soft">{open.description}</p>
            {stale(open.lastReview) && <Callout tone="warn" title="Revisão vencida">Última revisão há mais de um ano. A política pede revisão anual; contratos gerados agora saem com aviso para o Jurídico.</Callout>}
            <PropertyList
              items={[
                { label: "Situação", value: <Badge tone={statusInfo[open.status].tone}>{statusInfo[open.status].label}</Badge> },
                { label: "Última revisão", value: formatDate(open.lastReview), hint: personById(open.reviewer).name },
                { label: "Uso em 12 meses", value: plural(open.uses, "contrato"), hint: `${contractsFrom(open)} na carteira atual` },
                { label: "Autoatendimento", value: open.selfService.length ? open.selfService.join(", ") : "Só o Jurídico", hint: open.selfServiceLimit ? `até ${formatCurrency(open.selfServiceLimit, { compact: true })}, sem alterar cláusulas` : undefined },
              ]}
            />
            <section>
              <h3 className="m-0 mb-2 text-[13px] font-medium">Cláusulas da biblioteca neste modelo</h3>
              <ul className="m-0 list-none divide-y divide-line rounded-xl border border-line p-0">
                {open.clauses.map((cid) => {
                  const cl = clauses.find((x) => x.id === cid)!;
                  return (
                    <li key={cid}>
                      <a href={`#/frame/clm-templates?aba=clausulas&clausula=${cid}`} className="flex items-center justify-between gap-3 px-3 py-2.5 text-[13px] hover:bg-soft/60">
                        <span className="min-w-0 truncate">{cl.title}</span>
                        <span className="shrink-0 text-[12px] text-muted">{cl.alternatives.length ? plural(cl.alternatives.length, "alternativa") : "Fixa"}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        )}
      </Drawer>

      {/* Novo modelo */}
      <Drawer
        open={creating}
        onClose={() => setCreating(false)}
        title="Novo modelo"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreating(false)}>
              Cancelar
            </Button>
            <OperationButton
              operation={createOp}
              disabled={!draft.name.trim()}
              disabledReason="Dê um nome ao modelo"
              onClick={() =>
                void createOp.run(
                  async () => {
                    await wait();
                    const base = list.find((t) => t.id === draft.base)!;
                    setList((all) => [...all, { ...base, id: `t${Date.now()}`, name: draft.name.trim(), type: draft.type, version: "0.1", lastReview: iso(0), reviewer: me.id, uses: 0, status: "em-revisao", selfService: [] }]);
                    setCreating(false);
                    setDraft({ name: "", type: "servico", base: "t1" });
                  },
                  `Modelo “${draft.name.trim()}” criado em revisão`,
                )
              }
            >
              Criar modelo
            </OperationButton>
          </>
        }
      >
        <div className="space-y-4">
          <OperationFeedback operation={createOp} />
          <TextField label="Nome do modelo" value={draft.name} onChange={(v) => setDraft((d) => ({ ...d, name: v }))} placeholder="Ex.: Representação comercial" autoFocus />
          <Select label="Tipo" value={draft.type} onValueChange={(v) => setDraft((d) => ({ ...d, type: v as ContractType }))} options={(Object.keys(contractTypes) as ContractType[]).map((t) => ({ value: t, label: contractTypes[t].label }))} />
          <Select label="Partir de" value={draft.base} onValueChange={(v) => setDraft((d) => ({ ...d, base: v }))} options={list.filter((t) => t.status === "publicado").map((t) => ({ value: t.id, label: `${t.name} v${t.version}` }))} hint="As cláusulas da biblioteca vêm junto; você ajusta antes de publicar." />
          <p className="m-0 text-[12px] text-muted">O modelo nasce em revisão e só fica disponível para as áreas depois de publicado pelo gerente jurídico.</p>
        </div>
      </Drawer>

      {/* Propor alternativa */}
      <Drawer
        open={proposing}
        onClose={() => setProposing(false)}
        kicker={current.title}
        title="Propor alternativa"
        footer={
          <>
            <Button variant="ghost" onClick={() => setProposing(false)}>
              Cancelar
            </Button>
            <OperationButton
              operation={altOp}
              disabled={!alt.label.trim() || !alt.text.trim()}
              disabledReason="Preencha nome e texto"
              onClick={() =>
                void altOp.run(
                  async () => {
                    await wait();
                    const a: ClauseAlternative = { id: `alt${Date.now()}`, label: alt.label.trim(), text: alt.text.trim(), risk: alt.risk, approval: "Em análise pelo gerente jurídico", uses: 0 };
                    setClauses((all) => all.map((c) => (c.id === current.id ? { ...c, alternatives: [...c.alternatives, a] } : c)));
                    setProposing(false);
                    setAlt({ label: "", text: "", risk: "medio" });
                  },
                  `Alternativa enviada para ${personById(current.owner).name}`,
                )
              }
            >
              Enviar para análise
            </OperationButton>
          </>
        }
      >
        <div className="space-y-4">
          <OperationFeedback operation={altOp} />
          <div className="rounded-xl bg-soft/60 px-3 py-2.5 text-[12.5px] leading-relaxed text-ink-soft">
            <span className="font-medium text-ink">Padrão:</span> {current.text}
          </div>
          <TextField label="Nome curto" value={alt.label} onChange={(v) => setAlt((a) => ({ ...a, label: v }))} placeholder="Ex.: Limite de 9 meses" />
          <TextareaField label="Texto da alternativa" value={alt.text} onChange={(v) => setAlt((a) => ({ ...a, text: v }))} minRows={4} />
          <Select label="Risco para a Vereda" value={alt.risk} onValueChange={(v) => setAlt((a) => ({ ...a, risk: v as Risk }))} options={(Object.keys(riskInfo) as Risk[]).map((r) => ({ value: r, label: riskInfo[r].label }))} />
        </div>
      </Drawer>
    </ClmShell>
  );
}

function ClauseDetail({ clause: c, hidden, onPropose }: { clause: LibraryClause; hidden: boolean; onPropose: () => void }) {
  const owner = personById(c.owner);
  const usedIn = seed.filter((t) => t.clauses.includes(c.id));
  return (
    <section className={cn("min-w-0 rounded-2xl border border-line bg-surface", hidden && "hidden lg:block")} aria-label={c.title}>
      <header className="border-b border-line px-5 py-4 sm:px-6">
        <button type="button" onClick={() => setFrameQuery({ clausula: undefined, aba: "clausulas" })} className="mb-3 inline-flex items-center gap-1 text-[12.5px] text-muted hover:text-ink lg:hidden">
          <ArrowLeft className="h-4 w-4" /> Cláusulas
        </button>
        <div className="text-[12px] text-muted">{clauseCategories[c.category]}</div>
        <h2 className="m-0 mt-0.5 text-[18px] font-semibold tracking-tight">{c.title}</h2>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[12.5px] text-muted">
          <Avatar initials={owner.initials} tint={owner.tint} name={owner.name} size="sm" />
          {owner.name} · revisada em {formatDate(c.lastReview)}
        </div>
      </header>
      <div className="space-y-6 px-5 py-5 sm:px-6">
        <section>
          <h3 className="m-0 mb-2 flex items-center gap-1.5 text-[13px] font-medium">
            <ShieldCheck className="h-4 w-4 text-ok" aria-hidden /> Texto padrão
          </h3>
          <p className="m-0 rounded-xl border border-line px-4 py-3 text-[13.5px] leading-relaxed">{c.text}</p>
          <p className="m-0 mt-2 text-[12.5px] text-muted">Orientação: {c.guidance}</p>
        </section>
        <section>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="m-0 text-[13px] font-medium">Alternativas aprovadas</h3>
            <Button size="sm" variant="quiet" onClick={onPropose}>
              <Plus /> Propor
            </Button>
          </div>
          {c.alternatives.length ? (
            <ul className="m-0 list-none space-y-2 p-0">
              {c.alternatives.map((a) => (
                <li key={a.id} className="rounded-xl border border-line px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[13.5px] font-medium">{a.label}</span>
                    <span className="flex gap-1">
                      <Badge tone={riskInfo[a.risk].tone}>{riskInfo[a.risk].label}</Badge>
                    </span>
                  </div>
                  <p className="m-0 mt-1.5 text-[13px] leading-relaxed text-ink-soft">{a.text}</p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted">
                    <span>Quem aprova: {a.approval}</span>
                    <span>{a.uses ? `Usada em ${plural(a.uses, "contrato")}` : "Ainda não usada"}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 rounded-xl border border-dashed border-line px-4 py-3 text-[12.5px] text-muted">Cláusula fixa: o Jurídico não aceita alternativas.</p>
          )}
        </section>
        <section>
          <h3 className="m-0 mb-2 text-[13px] font-medium">Usada nos modelos</h3>
          <div className="flex flex-wrap gap-1.5">
            {usedIn.map((t) => (
              <a key={t.id} href={`#/frame/clm-templates?modelo=${t.id}`} className="rounded-md bg-soft px-2 py-1 text-[12.5px] hover:bg-soft/60 hover:underline">
                {t.name} v{t.version}
              </a>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
