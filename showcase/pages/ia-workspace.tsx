import { useState } from "react";
import { ArtifactCard, InsightCard, KpiPair, MetricBar, RankedList, ReportSection, RunSummary, AgentTrace, type TraceStep } from "@g4os/ds";
import { CodeBlock, Demo, DocPage, DocSection, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Workspace de agente",
  group: "IA e interação",
  order: 20,
  description: "Anatomia de uma tela onde a pessoa pede uma análise e o agente devolve resposta + artefatos: conversa à esquerda, artefatos em abas à direita, tudo explicável.",
};

const steps: TraceStep[] = [
  {
    id: "r",
    kind: "agent",
    title: "Analista de receita",
    startMs: 0,
    durationMs: 40200,
    tokens: 48210,
    children: [
      { id: "a", kind: "thinking", title: "Planejar a análise", startMs: 0, durationMs: 2400, tokens: 1100 },
      { id: "b", kind: "tool", title: "crm.listar_negocios", startMs: 2400, durationMs: 3100, tokens: 4200 },
      { id: "c", kind: "tool", title: "gravacoes.transcrever", startMs: 5800, durationMs: 9400, tokens: 12600 },
      { id: "d", kind: "output", title: "Escrever relatório", startMs: 32600, durationMs: 7600, tokens: 7200 },
    ],
  },
];

export default function Page() {
  const [open, setOpen] = useState("report");
  return (
    <DocPage title={meta.title} kicker="IA e interação" description={meta.description}>
      <DocSection title="Anatomia" rule="Bloco pronto: Blocos › IA › Workspace de agente (src/blocks/ai-workspace.tsx).">
        <div className="grid gap-3 md:grid-cols-[56px_1fr_1fr]">
          <div className="rounded-xl border border-dashed border-line-strong p-3 text-center text-[11.5px] text-muted">
            IconRail
            <br />
            navegação
          </div>
          <div className="space-y-2 rounded-xl border border-dashed border-line-strong p-3 text-[12.5px]">
            <p className="m-0 font-medium">Conversa</p>
            <p className="m-0 text-muted">Trilha (Projetos › análise) · RunSummary com o trace · resposta · ArtifactCard · sugestões · AgentComposer</p>
          </div>
          <div className="space-y-2 rounded-xl border border-dashed border-line-strong p-3 text-[12.5px]">
            <p className="m-0 font-medium">ArtifactPanel</p>
            <p className="m-0 text-muted">Abas Relatório · Contexto · Saída · planilhas; copiar, exportar, compartilhar, expandir, fechar. Divisor arrastável (ResizableSplit).</p>
          </div>
        </div>
      </DocSection>

      <DocSection title="Status da execução" rule="Toda resposta diz quanto levou e deixa abrir o que foi feito. Rodando = cronômetro ao vivo e brilho no rótulo.">
        <Demo
          className="block space-y-3"
          code={`<RunSummary status="done" durationMs={40200} steps={9} tools={5} tokens={48210} cost="R$ 0,62">
  <AgentTrace steps={steps} replay={false} />
</RunSummary>
<RunSummary status="running" startedAt={Date.now()} />
<RunSummary status="error" durationMs={8100} />`}
        >
          <RunSummary status="done" durationMs={40200} steps={9} tools={5} tokens={48210} cost="R$ 0,62">
            <AgentTrace steps={steps} replay={false} />
          </RunSummary>
          <RunSummary status="running" startedAt={Date.now() - 4000} />
          <RunSummary status="error" durationMs={8100} />
          <RunSummary status="stopped" durationMs={2300} />
        </Demo>
      </DocSection>

      <DocSection title="Cartões de artefato" rule="O que o agente produziu aparece na resposta como cartão e abre em aba. Aberto = borda na cor de ação.">
        <Demo bare code={`<ArtifactCard kind="report" title="Relatório" meta="3 seções" selected onOpen={…} />\n<ArtifactCard kind="sheet" title="Páginas com preço" meta="9 linhas" onOpen={…} />\n<ArtifactCard kind="deck" title="Apresentação" status="generating" />`}>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <ArtifactCard kind="report" title="Relatório" meta="3 seções · 1 gráfico" selected={open === "report"} onOpen={() => setOpen("report")} />
            <ArtifactCard kind="sheet" title="Páginas com preço" meta="9 linhas · 7 alteradas" selected={open === "sheet"} onOpen={() => setOpen("sheet")} />
            <ArtifactCard kind="deck" title="Apresentação para a diretoria" status="generating" />
            <ArtifactCard kind="email" title="E-mail para marketing" meta="Rascunho" selected={open === "email"} onOpen={() => setOpen("email")} />
            <ArtifactCard kind="chart" title="Comparativo 2025 × 2026" meta="2 séries" selected={open === "chart"} onOpen={() => setOpen("chart")} />
            <ArtifactCard kind="code" title="Consulta SQL usada" status="error" />
          </div>
        </Demo>
      </DocSection>

      <DocSection title="Peças de relatório" rule="Relatório de agente = manchete que conclui + evidência. InsightCard dá o achado; RankedList e MetricBar, a prova.">
        <Demo
          bare
          code={`<InsightCard kicker="Objeções" title="Preço pouco claro virou a objeção nº 1" listLabel="Principais objeções" tone="bad">
  <RankedList items={[{ label: "Preço pouco claro", badge: "Novo" }, { label: "Preço alto", value: "9 menções" }]} />
</InsightCard>
<InsightCard kicker="Conversão" title="Só PMEs caíram" listLabel="Por segmento">
  <MetricBar index={1} label="PME" value={0.61} delta={-0.049} />
</InsightCard>
<KpiPair items={[{ label: "Conversão PME", value: "9,2 %" }, { label: "Negócios afetados", value: "121" }]}>…gráfico…</KpiPair>`}
        >
          <div className="space-y-4">
            <ReportSection title="Relatório">
              <p>A conversão de PMEs caiu 4,9 pontos em setembro; Mid-market ficou estável.</p>
            </ReportSection>
            <div className="grid gap-3 lg:grid-cols-2">
              <InsightCard kicker="Objeções" title="Preço pouco claro virou a objeção nº 1" listLabel="Principais objeções">
                <RankedList items={[{ label: "Preço pouco claro", badge: "Novo" }, { label: "Falta de parcelamento", badge: "Novo" }, { label: "Preço alto", value: "9 menções" }]} />
              </InsightCard>
              <InsightCard kicker="Conversão" title="Só PMEs caíram; Mid-market segue estável" listLabel="Conversão × meta">
                <MetricBar index={1} label="PME" value={0.61} delta={-0.049} />
                <MetricBar index={2} label="Mid-market" value={0.81} delta={0.003} />
              </InsightCard>
            </div>
            <KpiPair items={[{ label: "Conversão PME hoje", value: "9,2 %", hint: "meta 15 %" }, { label: "Negócios afetados", value: "121", hint: "perdidos em setembro" }]} />
          </div>
        </Demo>
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Mostre sempre quanto tempo levou e o que o agente fez (RunSummary → AgentTrace).", dont: "Resposta que “aparece” sem dizer de onde veio." },
            { do: "Artefatos são de primeira classe: abrem em aba, dá para copiar, exportar e compartilhar.", dont: "Relatório inteiro despejado no chat, sem ter onde reabrir." },
            { do: "Ação com efeito fora da empresa só depois de ApprovalRequest.", dont: "Agente que envia e-mail, cobra ou apaga sem perguntar." },
            { do: "Parar, refazer e corrigir sempre disponíveis (composer e ações da resposta).", dont: "Execução longa sem botão de parar." },
            { do: "Todo número que veio de dado do cliente com fonte (CitationChip, ContextView).", dont: "Número sem origem, que ninguém consegue checar." },
          ]}
        />
      </DocSection>

      <DocSection title="Montagem">
        <CodeBlock
          code={`<AgentShell current={routes.workspace}>
  <ResizableSplit
    storageKey="ai-workspace"
    rightOpen={panelOpen}
    left={<Conversa />}                 // mensagens + <AgentComposer />
    right={
      <ArtifactPanel tabs={tabs} active={active} onActiveChange={setActive}
        onCloseTab={fechar} addOptions={opcoes} onClose={() => setPanelOpen(false)}
        onCopy={copiar} onExport={exportar} onShare={compartilhar}>
        {views[active]}
      </ArtifactPanel>
    }
  />
</AgentShell>`}
        />
      </DocSection>
    </DocPage>
  );
}
