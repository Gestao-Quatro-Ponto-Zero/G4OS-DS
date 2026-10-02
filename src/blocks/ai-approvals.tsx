import { ArrowLeft, Bot, ClipboardCheck, ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";
import {
  ApprovalRequest,
  Badge,
  Button,
  Empty,
  Modal,
  Page,
  PageHeading,
  PropertyList,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TextareaField,
  cn,
  notify,
  type ApprovalState,
} from "@g4ai/ds";
import { agentById, approvals as seed, riskLabel, riskTone, runWhen, type Approval } from "./data/agents";
import { AgentListError, AgentListSkeleton, AgentShell, agentRoutes, useAgentDemoState } from "./shells/agent-shell";
import { frameHref, setFrameQuery, useFrameParam } from "./shells/frame-route";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Aprovações de agentes",
  description: "Fila human-in-the-loop (?id=): o que o agente quer fazer, impacto, risco, dados de apoio e a prévia (e-mail, tabela ou mensagem); aprovar, editar antes, sempre aprovar este tipo ou recusar com motivo.",
  category: "IA",
  order: 13,
  height: 980,
  concept: {
    goal: "Quem aprova decide rápido e com segurança o que os agentes vão fazer em nome da empresa, sem abrir cinco telas.",
    patterns: [
      "Anatomia F · Mestre-detalhe: fila à esquerda, pedido à direita; a seleção fica no endereço (?id=)",
      "ApprovalRequest com impacto, risco e prévia exata do que vai sair",
      "Recusar exige motivo (volta para o agente como instrução)",
      "Por que pediu aprovação: a política aparece junto, com link para mudar",
      "Celular: a fila ocupa a tela e o pedido abre em tela cheia com Voltar",
    ],
    adapt: [
      "Aprovação de despesas, descontos comerciais, publicação de conteúdo",
      "Sem IA: troque 'agente' por 'solicitante' e mantenha a prévia do efeito",
    ],
    avoid: [
      "Aprovar sem ver a prévia do que vai sair",
      "Recusar sem motivo (o agente repete o erro)",
      "Fila sem prazo: pedidos expiram e ninguém sabe",
    ],
  },
} as const;

type Decided = { state: ApprovalState; reason?: string; at: string };

function Preview({ p }: { p: Approval["preview"] }) {
  if (p.kind === "email")
    return (
      <div className="space-y-2">
        <p className="m-0 text-[12px] text-muted">
          Para <span className="text-ink">{p.to}</span> · Assunto <span className="text-ink">{p.subject}</span>
        </p>
        <pre className="m-0 whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-ink">{p.body}</pre>
      </div>
    );
  if (p.kind === "rows")
    return (
      <Table label="Prévia do que muda">
        <TableHeader>
          <TableRow>
            {p.columns.map((c, i) => (
              <TableHead key={c} numeric={i > 0}>
                {c}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {p.rows.map((r) => (
            <TableRow key={r[0]}>
              {r.map((c, i) => (
                <TableCell key={i} numeric={i > 0} className={c.startsWith("+") ? "font-medium text-rose" : undefined}>
                  {c}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  return <p className="m-0 whitespace-pre-wrap text-[13px] leading-relaxed text-ink">{p.body}</p>;
}

export default function AiApprovals() {
  const estado = useAgentDemoState();
  const [items, setItems] = useState<Approval[]>(estado === "vazio" ? [] : seed);
  const [decided, setDecided] = useState<Record<string, Decided>>({});
  const [tab, setTab] = useState<"pendentes" | "decididas">("pendentes");
  const [rejecting, setRejecting] = useState<Approval | null>(null);
  const [reason, setReason] = useState("");
  const [tried, setTried] = useState(false);
  const [editing, setEditing] = useState<Approval | null>(null);
  const [draft, setDraft] = useState("");
  const idParam = useFrameParam("id");

  const pending = items.filter((a) => !decided[a.id]);
  const done = items.filter((a) => decided[a.id]);
  const list = tab === "pendentes" ? pending : done;
  const current = useMemo(() => list.find((a) => a.id === idParam) ?? items.find((a) => a.id === idParam) ?? list[0], [list, items, idParam]);
  const open = (id: string) => setFrameQuery({ id });

  const decide = (a: Approval, state: ApprovalState, msg: string, why?: string) => {
    setDecided((d) => ({ ...d, [a.id]: { state, reason: why, at: "agora" } }));
    const next = pending.find((x) => x.id !== a.id);
    notify(msg, () =>
      setDecided((d) => {
        const copy = { ...d };
        delete copy[a.id];
        return copy;
      }),
    );
    if (next) open(next.id);
  };

  const agentOf = (a: Approval) => agentById(a.agentId);
  const body = (p: Approval["preview"]) => (p.kind === "rows" ? "" : p.body);

  return (
    <AgentShell current={agentRoutes.approvals}>
      <Page>
        <PageHeading
          title="Aprovações"
          description="O que os agentes querem fazer e precisa de uma pessoa. Recusar devolve o motivo para o agente."
          actions={
            <Button variant="ghost" href={frameHref("ai-agent-governance", { secao: "aprovacao" })}>
              <ClipboardCheck /> Políticas de aprovação
            </Button>
          }
        />
        <Tabs
          label="Situação"
          value={tab}
          onChange={(v) => setTab(v as typeof tab)}
          items={[
            { id: "pendentes", label: "Esperando você", count: pending.length || undefined },
            { id: "decididas", label: "Decididas hoje" },
          ]}
        />
        {estado === "carregando" ? (
          <div className="mt-5">
            <AgentListSkeleton rows={5} label="Carregando aprovações" />
          </div>
        ) : estado === "erro" ? (
          <div className="mt-5">
            <AgentListError noun="as aprovações" />
          </div>
        ) : !list.length ? (
          <div className="mt-5">
            <Empty
              icon={<ClipboardCheck />}
              title={tab === "pendentes" ? "Nada esperando você" : "Nenhuma decisão hoje"}
              hint={tab === "pendentes" ? "Quando um agente precisar de aprovação para agir (e-mail para cliente, dinheiro, nota fiscal), o pedido aparece aqui e no Slack." : "Aprovações e recusas de hoje aparecem aqui, com o motivo."}
              action={
                tab === "pendentes" ? (
                  <Button variant="ghost" href={agentRoutes.runs}>
                    Ver execuções
                  </Button>
                ) : (
                  <Button variant="ghost" onClick={() => setTab("pendentes")}>
                    Ver pendentes
                  </Button>
                )
              }
            />
          </div>
        ) : (
          <div className="mt-5 grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
            <ul className={cn("m-0 list-none space-y-2 p-0", idParam ? "hidden lg:block" : "")} aria-label="Pedidos de aprovação">
              {list.map((a) => {
                const on = current?.id === a.id;
                const ag = agentOf(a);
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => open(a.id)}
                      aria-current={on ? "true" : undefined}
                      className={cn(
                        "w-full rounded-xl border bg-surface px-4 py-3 text-left transition-colors",
                        // Sem ?id= no celular nada está aberto: o destaque só vale no desktop.
                        on ? (idParam ? "border-line-strong shadow-raised" : "border-line lg:border-line-strong lg:shadow-raised") : "border-line hover:border-line-strong",
                      )}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-1.5 text-[12px] text-muted">
                          <Bot className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{ag?.name}</span>
                        </span>
                        {decided[a.id] ? (
                          <Badge tone={decided[a.id].state === "rejected" ? "bad" : "ok"}>{decided[a.id].state === "rejected" ? "Recusado" : "Aprovado"}</Badge>
                        ) : (
                          <Badge tone={riskTone[a.risk]}>{riskLabel[a.risk]}</Badge>
                        )}
                      </span>
                      <span className="mt-1.5 block text-[13.5px] font-medium leading-snug">{a.title}</span>
                      <span className="mt-1.5 flex items-center justify-between gap-2 text-[12px] text-muted">
                        <span className="tabular-nums">{runWhen(a.requestedAt)}</span>
                        <span className="shrink-0 font-medium tabular-nums text-ink">{a.impact}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {current && (
              <section className={cn("min-w-0 rounded-2xl border border-line bg-surface", idParam ? "" : "hidden lg:block")} aria-label={`Pedido ${current.id}`}>
                <header className="border-b border-line px-5 py-4 sm:px-6">
                  <button type="button" onClick={() => setFrameQuery({ id: undefined })} className="mb-2 inline-flex items-center gap-1 text-[12.5px] text-muted hover:text-ink lg:hidden">
                    <ArrowLeft className="h-3.5 w-3.5" /> Voltar à fila
                  </button>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted">
                    <span className="font-mono">{current.id}</span>
                    <a href={frameHref("ai-agent", current.agentId)} className="inline-flex items-center gap-1 font-medium text-ink hover:underline">
                      <Bot className="h-3.5 w-3.5" /> {agentOf(current)?.name}
                    </a>
                    <span>pedido {runWhen(current.requestedAt)}</span>
                    {!decided[current.id] && <span>expira em {current.expiresIn}</span>}
                  </div>
                </header>
                <div className="space-y-6 px-5 py-5 sm:px-6">
                  <ApprovalRequest
                    title={current.title}
                    description={current.description}
                    impact={current.impact}
                    risk={current.risk}
                    state={decided[current.id]?.state ?? "pending"}
                    preview={<Preview p={current.preview} />}
                    onApprove={() => decide(current, "approved", `Aprovado: ${agentOf(current)?.name} vai ${current.title.charAt(0).toLowerCase()}${current.title.slice(1)}`)}
                    onApproveAlways={current.risk === "low" ? () => decide(current, "always", "Aprovado. Pedidos iguais deste agente passam a sair sem aprovação") : undefined}
                    onEdit={
                      current.preview.kind === "rows"
                        ? undefined
                        : () => {
                            setDraft(body(current.preview));
                            setEditing(current);
                          }
                    }
                    onReject={() => {
                      setReason("");
                      setTried(false);
                      setRejecting(current);
                    }}
                  />
                  {decided[current.id]?.reason && (
                    <p className="m-0 rounded-lg bg-soft px-3 py-2 text-[12.5px] text-ink-soft">
                      <span className="font-medium text-ink">Motivo da recusa:</span> {decided[current.id].reason}
                    </p>
                  )}
                  <div className="grid gap-6 md:grid-cols-2">
                    <section>
                      <h3 className="m-0 mb-2 text-[13px] font-medium">Dados de apoio</h3>
                      <PropertyList items={current.facts.map((f) => ({ label: f.label, value: f.value }))} />
                    </section>
                    <section>
                      <h3 className="m-0 mb-2 text-[13px] font-medium">Por que pediu aprovação</h3>
                      <p className="m-0 text-[13px] leading-relaxed text-ink-soft">{current.policy}.</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button size="sm" variant="ghost" href={frameHref("ai-agent-run", current.runId)}>
                          <ExternalLink /> Ver execução {current.runId}
                        </Button>
                        <Button size="sm" variant="ghost" href={frameHref("ai-agent-governance", { secao: "aprovacao" })}>
                          Mudar política
                        </Button>
                      </div>
                    </section>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}

        <Modal
          open={!!rejecting}
          onClose={() => setRejecting(null)}
          title="Recusar o pedido?"
          description="O motivo volta para o agente como instrução e fica no histórico da execução."
          footer={
            <>
              <Button variant="ghost" onClick={() => setRejecting(null)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  setTried(true);
                  if (!rejecting || reason.trim().length < 5) return;
                  decide(rejecting, "rejected", `Pedido ${rejecting.id} recusado e devolvido ao agente`, reason.trim());
                  setRejecting(null);
                }}
              >
                Recusar pedido
              </Button>
            </>
          }
        >
          <TextareaField
            label="Motivo"
            value={reason}
            onChange={setReason}
            placeholder="Ex.: o cliente já pediu para não receber e-mails até a renovação."
            error={tried && reason.trim().length < 5 ? "Escreva o motivo em uma frase." : undefined}
          />
        </Modal>

        <Modal
          open={!!editing}
          onClose={() => setEditing(null)}
          title="Editar antes de aprovar"
          description="A mensagem editada sai no lugar da proposta do agente. Suas mudanças viram exemplo para a próxima versão."
          size="lg"
          footer={
            <>
              <Button variant="ghost" onClick={() => setEditing(null)}>
                Cancelar
              </Button>
              <Button
                disabled={!draft.trim()}
                disabledReason="A mensagem não pode ficar vazia"
                onClick={() => {
                  if (!editing) return;
                  const edited: Approval = { ...editing, preview: editing.preview.kind === "rows" ? editing.preview : { ...editing.preview, body: draft } };
                  setItems((all) => all.map((x) => (x.id === editing.id ? edited : x)));
                  setEditing(null);
                  decide(edited, "approved", "Mensagem editada e aprovada");
                }}
              >
                Aprovar com edição
              </Button>
            </>
          }
        >
          <TextareaField label="Mensagem" value={draft} onChange={setDraft} minRows={8} maxRows={16} />
        </Modal>
      </Page>
    </AgentShell>
  );
}
