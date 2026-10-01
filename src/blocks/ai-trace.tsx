import { ArrowLeft, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import {
  AgentPlan,
  AgentTrace,
  Badge,
  Button,
  JsonView,
  Page,
  PageHeading,
  PropertyList,
  ReportSection,
  ResizableSplit,
  StatCell,
  StatGrid,
  SystemMessage,
  formatCurrency,
  formatDuration,
  formatNumber,
  notify,
  type TraceStep,
} from "@g4ai/ds";
import { AgentShell, agentRoutes } from "./shells/agent-shell";
import { frameHref, useFrameParam } from "./shells/frame-route";
import { ownerOf, projectById, statusLabel, statusTone, stepIO, traceFor } from "./data/agent";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Inspetor de execução",
  description: "Trace completo de uma execução em cascata com o passo selecionado ao lado: entrada e saída em JSON, latência, tokens, custo, erro com nova tentativa só daquele passo.",
  category: "IA",
  order: 3,
  height: 900,
  concept: {
    goal: "Investigar uma execução que falhou ou demorou: onde, por quê e quanto custou, para quem mantém agentes.",
    patterns: [
      "Anatomia C · Registro: cabeçalho fixo com trilha; trace + detalhe lado a lado (ResizableSplit)",
      "Cascata com latência por passo; passo com erro em destaque",
      "Entrada/saída em JSON, tokens e custo do passo",
      "Tentar de novo só o passo que falhou",
    ],
    adapt: [
      "Monitor de integrações, filas de processamento, ETL",
    ],
    avoid: [
      "Logs em texto corrido sem estrutura por passo",
    ],
  },
} as const;

function flat(steps: TraceStep[], out: TraceStep[] = []) {
  steps.forEach((s) => {
    out.push(s);
    if (s.children) flat(s.children, out);
  });
  return out;
}

export default function AiTrace() {
  const id = useFrameParam("id", "p1");
  const project = projectById(id);
  const steps = useMemo(() => traceFor(project), [project]);
  const all = useMemo(() => flat(steps), [steps]);
  const firstError = all.find((s) => s.status === "error");
  // No celular começa no trace; o detalhe abre por cima ao tocar num passo.
  const [sel, setSel] = useState<string>(() => (typeof window !== "undefined" && window.matchMedia("(max-width: 767.98px)").matches ? "" : firstError?.id ?? "funnel"));
  const [retried, setRetried] = useState<Set<string>>(new Set());
  const step = all.find((s) => s.id === sel) ?? all.find((s) => s.id === "funnel") ?? all[0];
  const io = stepIO[step.id];
  const failed = step.status === "error" && !retried.has(step.id);
  const errors = all.filter((s) => s.status === "error" && !retried.has(s.id)).length;
  const owner = ownerOf(project);
  const tools = all.filter((s) => s.kind === "tool" || s.kind === "search").length;

  const left = (
    <Page className="!pb-10">
      <PageHeading
        compact
        crumbs={[{ label: "Projetos", href: agentRoutes.projects }, { label: project.title, href: frameHref("ai-workspace", project.id) }, { label: "Execução" }]}
        title={`Execução de ${project.lastRun}`}
        description={`${project.agent} · pedida por ${owner.name}`}
        actions={
          <>
            <Badge tone={statusTone[project.status]}>{statusLabel[project.status]}</Badge>
            <Button size="sm" variant="ghost" href={frameHref("ai-workspace", project.id)}>
              <ArrowLeft /> Workspace
            </Button>
          </>
        }
      />
      <div className="mt-5">
        <StatGrid cols={4}>
          <StatCell label="Duração" value={formatDuration(project.durationMs)} />
          <StatCell label="Passos" value={formatNumber(all.length)} hint={`${tools} ferramentas`} />
          <StatCell label="Tokens" value={formatNumber(project.tokens)} hint={formatCurrency(project.cost)} />
          <StatCell label="Erros" value={formatNumber(errors)} tone={errors ? "bad" : "ok"} />
        </StatGrid>
      </div>
      <div className="mt-6">
        <AgentTrace steps={steps} onSelect={(s) => setSel(s.id)} selectedId={step.id} label="Execução" />
      </div>
      <div className="mt-6">
        <AgentPlan
          title="Plano que o agente seguiu"
          steps={[
            { id: "a", label: "Comparar o funil de PMEs e Mid-market", status: "done" },
            { id: "b", label: "Ouvir as ligações de negócios perdidos", status: "done" },
            { id: "c", label: "Checar a página de preços pública", status: project.status === "falhou" ? "error" : "done", detail: project.status === "falhou" ? "Site fora do ar durante a leitura" : undefined },
            { id: "d", label: "Escrever relatório e planilha", status: project.status === "executando" ? "active" : project.status === "falhou" ? "skipped" : "done" },
          ]}
        />
      </div>
    </Page>
  );

  const right = (
    <section aria-label="Passo selecionado" className="flex min-h-0 flex-1 flex-col bg-page">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-line px-4">
        <button type="button" onClick={() => setSel("")} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-soft md:hidden" aria-label="Voltar ao trace">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">Passo</span>
        <span className="min-w-0 flex-1 truncate font-mono text-[12.5px]">{step.title}</span>
        {failed ? <Badge tone="bad">Erro</Badge> : <Badge tone="ok">Ok</Badge>}
      </header>
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5">
        {failed && (
          <SystemMessage tone="error" title="Este passo falhou">
            {io?.error ?? "A página demorou mais de 10 s para responder e a leitura foi abortada. O agente seguiu sem ela."}
            <div className="mt-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setRetried((r) => new Set(r).add(step.id));
                  notify("Passo executado de novo com sucesso", undefined, "ok");
                }}
              >
                <RotateCcw /> Tentar só este passo
              </Button>
            </div>
          </SystemMessage>
        )}
        <PropertyList
          items={[
            { label: "Tipo", value: { agent: "Agente", thinking: "Raciocínio", tool: "Ferramenta", search: "Busca", output: "Saída", error: "Erro" }[step.kind] },
            { label: "Início", value: `+${formatDuration(step.startMs)}` },
            { label: "Duração", value: formatDuration(step.durationMs) },
            { label: "Latência da ferramenta", value: io?.latencyMs != null ? formatDuration(io.latencyMs) : undefined },
            { label: "Tokens", value: step.tokens != null ? formatNumber(step.tokens) : undefined },
            { label: "Custo estimado", value: step.tokens != null ? formatCurrency((step.tokens / project.tokens) * project.cost) : undefined },
          ]}
        />
        <ReportSection title="Entrada">
          <JsonView value={io?.input ?? { observacao: "Passo interno sem entrada estruturada" }} maxHeight={220} />
        </ReportSection>
        <ReportSection title="Saída">
          {failed ? <p className="text-rose">Sem saída: o passo falhou.</p> : <JsonView value={io?.output ?? { observacao: "Veja os passos filhos" }} maxHeight={260} />}
        </ReportSection>
      </div>
    </section>
  );

  return (
    <AgentShell current={agentRoutes.trace}>
      <ResizableSplit left={left} right={right} rightOpen={!!sel} storageKey="ai-trace" defaultSize={0.58} min={0.4} max={0.75} />
    </AgentShell>
  );
}
