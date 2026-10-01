import { useState } from "react";
import { AgentTrace, JsonView, ToolCallCard, ToolCallsSection, type TraceStep } from "@g4os/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";
import { toolCalls, toolCallsFailing, trace } from "./_ia-data";

export const meta: PageMeta = {
  title: "Agentes e ferramentas",
  group: "IA e interação",
  order: 20,
  description: "AgentTrace mostra a execução em cascata (pensar, ferramenta, subagente) com replay; ToolCallsSection resume as ferramentas usadas numa resposta, com entrada e saída.",
};

export default function Page() {
  const [sel, setSel] = useState<TraceStep | null>(null);
  return (
    <DocPage title={meta.title} kicker={meta.group} description={meta.description}>
      <DocSection title="AgentTrace" rule="Cascata de passos com barra proporcional ao tempo, tokens e status. O cursor de replay revê a execução: passos mudam de na fila → executando → concluído. Subagentes e novas tentativas ficam aninhados.">
        <Demo
          bare
          code={`<AgentTrace
  steps={[{ id: "a", kind: "agent", title: "Agente de vendas", startMs: 0, durationMs: 9400, tokens: 8420,
    children: [
      { id: "a1", kind: "thinking", title: "Planejar", startMs: 0, durationMs: 1100 },
      { id: "a2", kind: "tool", title: "crm.buscar_negocio", startMs: 1100, durationMs: 420 },
      { id: "a3", kind: "tool", title: "erp.consultar_faturas", startMs: 2850, durationMs: 1400, status: "error" },
    ] }]}
  onSelect={(passo) => abrirDetalhe(passo)}
/>`}
        >
          <AgentTrace steps={trace} onSelect={setSel} selectedId={sel?.id} />
          {sel && <p className="mt-2 text-[12.5px] text-muted">Selecionado: {sel.title} — abra o detalhe do passo num painel ao lado.</p>}
        </Demo>
        <PropsTable
          rows={[
            ["steps", "TraceStep[]", "—", "{ id, kind, title, startMs, durationMs, tokens?, status?, children? }"],
            ["kind", '"agent" | "thinking" | "tool" | "search" | "output" | "error"', "—", "Define ícone e cor da barra."],
            ["status", '"queued" | "running" | "done" | "error" | "skipped"', "pelo tempo", "Force error/skipped; o resto vem do cursor."],
            ["replay", "boolean", "true", "Barra de replay com play/pausa e cursor."],
            ["onSelect · selectedId", "fn · string", "—", "Clique no título para ver detalhes do passo."],
          ]}
        />
      </DocSection>
      <DocSection title="ToolCallsSection" rule="Fecha por padrão quando tudo deu certo e abre sozinha se algo falhou. Ícones empilhados mostram as categorias usadas.">
        <div className="grid gap-4 lg:grid-cols-2">
          <Demo bare title="Tudo certo" code={`<ToolCallsSection calls={chamadas} />`}>
            <div className="rounded-xl border border-line bg-surface p-4">
              <ToolCallsSection calls={toolCalls} />
            </div>
          </Demo>
          <Demo bare title="Com falha e em execução">
            <div className="rounded-xl border border-line bg-surface p-4">
              <ToolCallsSection calls={toolCallsFailing} />
            </div>
          </Demo>
        </div>
        <Demo bare title="ToolCallCard aberto" code={`<ToolCallCard call={{ id, name: "crm.buscar_negocio", label: "Buscou o negócio", status: "success", durationMs: 412, input, output }} defaultOpen />`}>
          <ToolCallCard call={toolCalls[0]} defaultOpen />
        </Demo>
        <Demo bare title="JsonView" code={`<JsonView value={{ id: "NEG-2291", valor: 460800, ativo: true }} />`}>
          <JsonView value={{ id: "NEG-2291", etapa: "Negociação", valor: 460800, probabilidade: 0.75, ativo: true, concorrente: null }} />
        </Demo>
      </DocSection>
      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Rótulo humano (“Buscou o negócio no CRM”) com o nome técnico embaixo.", dont: "Só `crm.buscar_negocio` — ninguém fora do time técnico entende." },
            { do: "Erro de ferramenta com causa e saída (tentar de novo, verificar integração).", dont: "Esconder a falha e responder como se tivesse os dados." },
            { do: "Dados sensíveis mascarados na entrada/saída exibida.", dont: "Mostrar CPF, token ou senha no JSON." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
