import { Check, Clock, Database, FileText, Mail, PencilLine, Play, RotateCcw, Search } from "lucide-react";
import { useMemo, useState } from "react";
import {
  AgentTrace,
  AiBadge,
  Badge,
  Button,
  JsonView,
  Page,
  PageHeading,
  PropertyList,
  StatCell,
  StatGrid,
  SystemMessage,
  Tabs,
  TokenUsageMeter,
  ToolCallsSection,
  formatCurrency,
  formatDuration,
  formatNumber,
  notify,
  type ToolCall,
  type TraceStep,
} from "@g4os/ds";
import { AssistantShell, assistantRoutes } from "./shells/assistant-shell";
import { frameHref } from "./shells/frame-route";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Execução de agente",
  description: "Detalhe de uma execução: trace em cascata com replay, passo selecionado com entrada e saída, ferramentas usadas, custo e tokens, saída para aprovar e tentar de novo.",
  category: "IA",
  order: 2,
  height: 1040,
  concept: {
    goal: "Explicar uma execução do agente passo a passo para quem precisa auditar ou aprovar o resultado antes de usar.",
    patterns: [
      "Anatomia C · Registro: trilha + título fixos, trace em cascata no conteúdo",
      "Passo selecionado mostra entrada e saída lado a lado",
      "Custo, tokens e tempo sempre visíveis",
      "Saída que pede aprovação humana antes de agir; tentar de novo por passo",
    ],
    adapt: [
      "Logs de automação, jobs de integração, pipelines de dados",
      "Troque 'tokens' por 'registros processados' fora de IA",
    ],
    avoid: [
      "Mostrar só o resultado final sem como chegou nele",
    ],
  },
} as const;

/* ------------------------------------------------------------------ */
/* Dados de exemplo                                                    */
/* ------------------------------------------------------------------ */

const trace: TraceStep[] = [
  {
    id: "run",
    kind: "agent",
    title: "Agente de follow-up",
    startMs: 0,
    durationMs: 9400,
    tokens: 8420,
    children: [
      { id: "plan", kind: "thinking", title: "Planejar os passos", startMs: 0, durationMs: 1100, tokens: 640 },
      { id: "crm", kind: "tool", title: "crm.buscar_negocio", startMs: 1100, durationMs: 420, tokens: 180 },
      { id: "doc", kind: "tool", title: "arquivos.ler · Proposta v3.pdf", startMs: 1550, durationMs: 1300, tokens: 2600 },
      {
        id: "sub",
        kind: "agent",
        title: "Subagente de pesquisa",
        startMs: 1550,
        durationMs: 3900,
        tokens: 2100,
        children: [
          { id: "web", kind: "search", title: "web.buscar · notícias", startMs: 1600, durationMs: 1200, tokens: 400 },
          { id: "erp1", kind: "tool", title: "erp.consultar_faturas", startMs: 2850, durationMs: 1400, tokens: 120, status: "error" },
          { id: "erp2", kind: "tool", title: "erp.consultar_faturas (nova tentativa)", startMs: 4300, durationMs: 1100, tokens: 260 },
        ],
      },
      { id: "cross", kind: "thinking", title: "Cruzar proposta com histórico", startMs: 5500, durationMs: 1300, tokens: 1100 },
      { id: "out", kind: "output", title: "Redigir e-mail de follow-up", startMs: 6800, durationMs: 2600, tokens: 1300 },
    ],
  },
];

const details: Record<string, { input?: unknown; output?: unknown; error?: string; model?: string }> = {
  plan: { model: "g4-pro", output: { passos: ["buscar negócio", "ler proposta", "pesquisar empresa", "consultar faturas", "redigir e-mail"] } },
  crm: { input: { empresa: "Grupo Aurora Alimentos" }, output: { id: "NEG-2291", etapa: "Negociação", valor: 460800 } },
  doc: { input: { arquivo: "Proposta v3.pdf" }, output: { preco_usuario_mes: 160, prazo_meses: 12, implantacao_dias: 60 } },
  web: { input: { q: "Grupo Aurora Alimentos 2026" }, output: { resultados: 6, relevantes: 2 } },
  erp1: { input: { cliente: "AURORA-01" }, error: "Tempo esgotado após 1,4 s (limite do conector). Repetido automaticamente." },
  erp2: { input: { cliente: "AURORA-01" }, output: { faturas_abertas: 0, inadimplencia: false } },
  cross: { model: "g4-pro", output: { riscos: ["SLA 99,9 %", "prazo de implantação"], argumento: "case Santa Clara" } },
  out: { model: "g4-pro", output: { assunto: "Próximos passos · licenças Aurora", palavras: 142 } },
};

const calls: ToolCall[] = [
  { id: "c1", name: "crm.buscar_negocio", label: "Buscou o negócio no CRM", icon: <Database />, status: "success", durationMs: 420, input: details.crm.input, output: details.crm.output },
  { id: "c2", name: "arquivos.ler", label: "Leu a proposta v3", icon: <FileText />, status: "success", durationMs: 1300, input: details.doc.input, output: details.doc.output },
  { id: "c3", name: "web.buscar", label: "Pesquisou notícias da empresa", icon: <Search />, status: "success", durationMs: 1200, input: details.web.input, output: details.web.output },
  { id: "c4", name: "erp.consultar_faturas", label: "Consultou faturas no ERP (2 tentativas)", icon: <Database />, status: "success", durationMs: 2500, input: details.erp2.input, output: details.erp2.output },
];

const email = `Olá, Renata,

Obrigado pela conversa de ontem. Ajustamos a proposta com o SLA de 99,9 % e multa por indisponibilidade, como o jurídico pediu, mantendo a implantação em 60 dias.

Para seguirmos, preciso só da confirmação do número de usuários (240) até sexta. Com isso, envio a minuta final na segunda.

Um abraço,
Ana Lopes`;

/* ------------------------------------------------------------------ */

function findStep(steps: TraceStep[], id: string): TraceStep | undefined {
  for (const s of steps) {
    if (s.id === id) return s;
    const c = s.children && findStep(s.children, id);
    if (c) return c;
  }
}

export default function AiAgentRun() {
  const [tab, setTab] = useState("execucao");
  const [sel, setSel] = useState("erp1");
  const [approved, setApproved] = useState(false);
  const step = useMemo(() => findStep(trace, sel), [sel]);
  const d = details[sel];
  return (
    <AssistantShell current={assistantRoutes.runs}>
      <Page>
        <PageHeading
          crumbs={[{ label: "Execuções", href: assistantRoutes.runs }, { label: "RUN-4821" }]}
          title="Follow-up · Grupo Aurora"
          description="Agente de follow-up · disparado por Ana Lopes hoje às 09:41 · 9,4 s"
          actions={
            <>
              <Button variant="ghost" href={frameHref("crm-deal", { id: "d1" })}>
                Abrir negócio
              </Button>
              <Button variant="ghost" onClick={() => notify("Execução reiniciada", undefined, "info")}>
                <RotateCcw /> Executar de novo
              </Button>
              <Button onClick={() => setTab("saida")}>
                <Mail /> Ver e-mail gerado
              </Button>
            </>
          }
        />
        <div className="mt-6 space-y-6">
          <StatGrid cols={4}>
            <StatCell label="Status" value={<span className="inline-flex items-center gap-1.5 text-ok"><Check className="h-4 w-4" /> Concluída</span>} hint="1 falha recuperada" />
            <StatCell label="Duração" value={formatDuration(9400)} hint="p50 do agente: 11,2 s" />
            <StatCell label="Tokens" value={formatNumber(8420)} hint="entrada 6.910 · saída 1.510" />
            <StatCell label="Custo" value={formatCurrency(0.42)} hint="4 ferramentas · 3 chamadas de modelo" />
          </StatGrid>

          <SystemMessage tone="warn" title="Uma ferramenta falhou e foi repetida">
            <span>erp.consultar_faturas estourou o tempo do conector na 1ª tentativa. A 2ª tentativa respondeu em 1,1 s.</span>
          </SystemMessage>

          <Tabs
            label="Seções da execução"
            value={tab}
            onChange={setTab}
            items={[
              { id: "execucao", label: "Execução" },
              { id: "saida", label: "Saída" },
              { id: "ferramentas", label: "Ferramentas" },
            ]}
          />

          {tab === "execucao" && (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
              <AgentTrace steps={trace} selectedId={sel} onSelect={(s) => setSel(s.id)} label="Trace da execução RUN-4821" />
              <section className="min-w-0 rounded-xl border border-line bg-surface">
                <header className="border-b border-line px-4 py-3">
                  <p className="m-0 text-[11px] font-medium uppercase tracking-[0.08em] text-muted">Passo selecionado</p>
                  <h2 className="m-0 mt-1 truncate text-[14px] font-semibold">{step?.title}</h2>
                </header>
                <div className="space-y-4 px-4 py-4">
                  <PropertyList
                    items={[
                      { label: "Tipo", value: step && { agent: "Agente", thinking: "Raciocínio", tool: "Ferramenta", search: "Busca", output: "Saída", error: "Erro" }[step.kind] },
                      { label: "Início", value: step && `+${formatDuration(step.startMs)}` },
                      { label: "Duração", value: step && formatDuration(step.durationMs) },
                      { label: "Tokens", value: step?.tokens != null ? formatNumber(step.tokens) : undefined },
                      { label: "Modelo", value: d?.model },
                    ]}
                  />
                  {d?.error && (
                    <SystemMessage tone="error" title="Erro">
                      {d.error}
                    </SystemMessage>
                  )}
                  {d?.input !== undefined && (
                    <div>
                      <p className="m-0 mb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-muted">Entrada</p>
                      <JsonView value={d.input} maxHeight={160} />
                    </div>
                  )}
                  {d?.output !== undefined && (
                    <div>
                      <p className="m-0 mb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-muted">Saída</p>
                      <JsonView value={d.output} maxHeight={200} />
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}

          {tab === "saida" && (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
              <section className="min-w-0 rounded-xl border border-line bg-surface">
                <header className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-3">
                  <h2 className="m-0 text-[14px] font-semibold">Próximos passos · licenças Aurora</h2>
                  <AiBadge label="Rascunho da IA" />
                  {approved && <Badge tone="ok">Aprovado</Badge>}
                  <span className="ml-auto text-[12px] text-muted">para renata.farias@aurora.com.br</span>
                </header>
                <pre className="m-0 whitespace-pre-wrap px-5 py-4 font-sans text-[14px] leading-relaxed text-ink">{email}</pre>
                <footer className="flex flex-wrap justify-end gap-2 border-t border-line bg-soft/40 px-5 py-3">
                  <Button variant="ghost" size="sm">
                    <PencilLine /> Editar
                  </Button>
                  <Button
                    size="sm"
                    disabled={approved}
                    onClick={() => {
                      setApproved(true);
                      notify("E-mail enviado e registrado no negócio", () => setApproved(false));
                    }}
                  >
                    <Play /> Aprovar e enviar
                  </Button>
                </footer>
              </section>
              <aside className="space-y-4">
                <div className="rounded-xl border border-line bg-surface p-4">
                  <TokenUsageMeter used={62480} limit={100000} label="Créditos do time neste mês" unit="tokens" resetsIn="em 1º de outubro" />
                </div>
                <div className="rounded-xl border border-line bg-surface p-4 text-[12.5px] leading-relaxed text-muted">
                  <p className="m-0 flex items-center gap-1.5 font-medium text-ink">
                    <Clock className="h-3.5 w-3.5" /> Aprovação humana obrigatória
                  </p>
                  <p className="m-0 mt-1">Este agente só envia e-mails depois que alguém do time aprova. Configure em Agentes › Follow-up › Permissões.</p>
                </div>
              </aside>
            </div>
          )}

          {tab === "ferramentas" && (
            <div className="max-w-[760px] rounded-xl border border-line bg-surface p-4">
              <ToolCallsSection calls={calls} defaultOpen />
            </div>
          )}
        </div>
      </Page>
    </AssistantShell>
  );
}
