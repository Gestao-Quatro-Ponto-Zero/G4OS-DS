import { useEffect, useRef, useState } from "react";
import {
  AgentComposer,
  AgentMessage,
  AgentPlan,
  ApprovalRequest,
  ArtifactCard,
  CitationChip,
  ReasoningBlock,
  RunSummary,
  SourceList,
  SystemMessage,
  ToolCallsSection,
  formatCurrency,
  notify,
  type AiSource,
  type ApprovalState,
  type ToolCall,
} from "@g4os/ds";
import { AgentShell, agentRoutes } from "./shells/agent-shell";
import { frameHref, go } from "./shells/frame-route";
import { slashCommands } from "./data/agent";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Conversa com aprovação",
  description: "Conversa longa com raciocínio recolhível, plano, ferramentas, fontes citadas, artefato e um pedido de aprovação antes de enviar e-mails (humano no controle).",
  category: "IA",
  order: 4,
  height: 900,
  concept: {
    goal: "Mostrar uma conversa longa em que o agente pensa, planeja, usa ferramentas e pede aprovação antes de uma ação irreversível.",
    patterns: [
      "Anatomia G · App de altura total: só a thread rola, composer fixo",
      "Raciocínio e plano recolhíveis: visíveis, mas sem poluir",
      "Pedido de aprovação humana antes de agir (enviar e-mails)",
      "Fontes citadas e artefato inline",
    ],
    adapt: [
      "Qualquer agente que mexe em dados de clientes (cobrança, CRM, RH)",
    ],
    avoid: [
      "Esconder o que o agente fez; executar ação externa sem aprovação",
    ],
  },
} as const;

/* ------------------------------------------------------------------ */
/* Dados de exemplo                                                    */
/* ------------------------------------------------------------------ */

const sources: AiSource[] = [
  { id: "s1", title: "Faturas vencidas · Nordeste", kind: "data", domain: "Nexo ERP" },
  { id: "s2", title: "Histórico de pagamentos 2025–2026", kind: "record", domain: "Nexo ERP" },
  { id: "s3", title: "Política de cobrança v4", kind: "doc", domain: "Drive · Financeiro" },
];

const calls: ToolCall[] = [
  { id: "t1", name: "erp.faturas_vencidas", label: "Buscou faturas vencidas no ERP", status: "success", durationMs: 1240, input: { regiao: "Nordeste", dias_min: 15 }, output: { faturas: 58, clientes: 42, valor: 318400 } },
  { id: "t2", name: "erp.historico_pagamentos", label: "Leu histórico de pagamento dos 42 clientes", status: "success", durationMs: 3480, input: { clientes: 42, meses: 18 }, output: { atrasavam_antes: 11, novos_atrasos: 31 } },
  { id: "t3", name: "drive.ler", label: "Leu a política de cobrança", status: "success", durationMs: 620, input: { arquivo: "Política de cobrança v4.pdf" }, output: { regua: ["D+3 lembrete", "D+15 contato", "D+30 negociação"] } },
];

/* ------------------------------------------------------------------ */

export default function AiConversation() {
  const [approval, setApproval] = useState<ApprovalState>("pending");
  const [draft, setDraft] = useState("");
  const [extra, setExtra] = useState<{ id: string; q: string; done: boolean }[]>([]);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [extra.length, approval]);

  const decide = (s: ApprovalState, msg: string) => {
    setApproval(s);
    notify(msg, s === "approved" || s === "always" ? () => setApproval("pending") : undefined, s === "rejected" ? "info" : "ok");
  };

  return (
    <AgentShell current={agentRoutes.conversation}>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex h-12 shrink-0 items-center gap-2 border-b border-line px-4 sm:px-5">
          <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium">Atraso de pagamentos no Nordeste</span>
          <a href={frameHref("ai-trace", "p2")} className="shrink-0 text-[12.5px] text-muted hover:text-ink">
            Ver execução
          </a>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex max-w-[720px] flex-col gap-7 px-4 py-6 sm:px-6">
            <SystemMessage tone="info">Este agente pode ler o ERP e o Drive. Ações que enviam algo para fora da empresa pedem sua aprovação.</SystemMessage>

            <div className="flex justify-end">
              <p className="m-0 max-w-[85%] rounded-2xl rounded-br-md bg-soft px-3.5 py-2.5 text-[14px] leading-relaxed">Quais clientes do Nordeste estão atrasando e o que devemos fazer esta semana?</p>
            </div>

            <AgentMessage
              status={<RunSummary status="done" durationMs={27800} steps={7} tools={3} tokens={31400} cost={formatCurrency(0.41)} />}
              artifacts={
                <>
                  <ArtifactCard kind="sheet" title="42 clientes em atraso" meta="Priorizados por valor e risco" onOpen={() => go("ai-workspace", "p2")} />
                  <ArtifactCard kind="email" title="Lembrete de pagamento" meta="Rascunho · 42 destinatários" onOpen={() => document.getElementById("aprovacao")?.scrollIntoView({ behavior: "smooth" })} />
                </>
              }
              onFeedback={() => notify("Obrigado pelo retorno", undefined, "info")}
              copyText="Resumo do atraso no Nordeste"
            >
              <ReasoningBlock
                durationMs={8200}
                lines={[
                  "Filtrar faturas vencidas há 15+ dias no Nordeste e agrupar por cliente.",
                  "Separar quem sempre atrasou de quem começou agora: a causa costuma ser outra.",
                  "Cruzar com a régua da política de cobrança para sugerir o próximo passo por cliente.",
                ]}
              />
              <AgentPlan
                steps={[
                  { id: "1", label: "Levantar faturas vencidas no ERP", status: "done" },
                  { id: "2", label: "Comparar com o histórico de pagamento", status: "done" },
                  { id: "3", label: "Aplicar a régua de cobrança", status: "done" },
                  { id: "4", label: "Enviar lembrete para os 42 clientes", status: approval === "pending" ? "active" : approval === "rejected" ? "skipped" : "done", detail: approval === "pending" ? "Aguardando sua aprovação" : undefined },
                ]}
              />
              <ToolCallsSection calls={calls} />
              <p>
                São <strong className="font-medium">42 clientes</strong> com <strong className="font-medium">R$ 318,4 mil</strong> vencidos há mais de 15 dias
                <CitationChip index={1} source={sources[0]} />. Só 11 já atrasavam antes; 31 começaram em agosto, quase todos atendidos pela filial de Recife
                <CitationChip index={2} source={sources[1]} />.
              </p>
              <p>
                Pela política, quem está entre 15 e 30 dias recebe contato ativo e quem passou de 30 entra em negociação
                <CitationChip index={3} source={sources[2]} />. Sugiro mandar hoje um lembrete com a 2ª via e agendar ligações para os 9 maiores valores.
              </p>
              <SourceList sources={sources} compact />
            </AgentMessage>

            <div id="aprovacao">
              <ApprovalRequest
                title="Enviar lembrete de pagamento para 42 clientes"
                description="E-mail com a 2ª via do boleto, enviado do endereço financeiro@acme.com.br. Não dá para desfazer depois de enviado."
                impact="42 clientes · R$ 318,4 mil"
                risk="high"
                state={approval}
                preview={
                  <>
                    <p className="m-0 font-medium text-ink">Assunto: Lembrete — fatura em aberto</p>
                    <p className="m-0 mt-1.5">Olá, {"{nome}"}. Identificamos a fatura {"{número}"} de {"{valor}"}, vencida em {"{data}"}. Segue a 2ª via atualizada. Se já pagou, desconsidere este e-mail.</p>
                  </>
                }
                onApprove={() => decide("approved", "Envio aprovado: 42 e-mails na fila")}
                onApproveAlways={() => decide("always", "Aprovado. Próximos lembretes deste tipo saem sem perguntar.")}
                onEdit={() => notify("Exemplo: abriria o editor do e-mail", undefined, "info")}
                onReject={() => decide("rejected", "Envio recusado. Nada foi enviado.")}
              />
            </div>

            {approval !== "pending" && (
              <SystemMessage tone={approval === "rejected" ? "warn" : "success"} title={approval === "rejected" ? "Nada foi enviado" : "Lembretes enviados"}>
                {approval === "rejected" ? "O agente não vai tentar de novo sem um pedido seu." : "42 e-mails enviados às 10:14. Respostas chegam na caixa do financeiro."}
              </SystemMessage>
            )}

            {extra.map((m) => (
              <div key={m.id} className="flex flex-col gap-7">
                <div className="flex justify-end">
                  <p className="m-0 max-w-[85%] rounded-2xl rounded-br-md bg-soft px-3.5 py-2.5 text-[14px] leading-relaxed">{m.q}</p>
                </div>
                <AgentMessage status={<RunSummary status={m.done ? "done" : "running"} startedAt={m.done ? undefined : Number(m.id)} durationMs={m.done ? 5200 : undefined} steps={3} tools={1} />}>
                  {m.done ? (
                    <p>Agendei as 9 ligações com os maiores valores para amanhã, entre 9h e 12h, na agenda da Elisa. Os convites ainda não foram enviados — confirme no painel de atividades.</p>
                  ) : (
                    <ReasoningBlock streaming lines={["Buscar os 9 maiores valores…", "Checar horários livres na agenda da Elisa…"]} />
                  )}
                </AgentMessage>
              </div>
            ))}
            <div ref={end} />
          </div>
        </div>
        <div className="shrink-0 px-3 pb-3 pt-1 sm:px-5 sm:pb-4">
          <div className="mx-auto max-w-[720px]">
            <AgentComposer
              value={draft}
              onChange={setDraft}
              busy={extra.some((m) => !m.done)}
              onStop={() => setExtra((x) => x.map((m) => ({ ...m, done: true })))}
              commands={slashCommands}
              onTranscribe={() => "Agende ligações para os 9 maiores valores"}
              onSubmit={(q) => {
                const id = String(Date.now());
                setDraft("");
                setExtra((x) => [...x, { id, q, done: false }]);
                setTimeout(() => setExtra((x) => x.map((m) => (m.id === id ? { ...m, done: true } : m))), 3200);
              }}
            />
          </div>
        </div>
      </div>
    </AgentShell>
  );
}
