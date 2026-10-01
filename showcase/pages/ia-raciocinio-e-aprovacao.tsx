import { useState } from "react";
import { AgentPlan, ApprovalRequest, ReasoningBlock, notify, type ApprovalState } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = { title: "Raciocínio, plano e aprovação", group: "IA e interação", order: 23, description: "ReasoningBlock (pensou por N s), AgentPlan (o que vai fazer e onde está) e ApprovalRequest (humano no controle antes de ações com efeito externo)." };

export default function Page() {
  const [s, setS] = useState<ApprovalState>("pending");
  return (
    <DocPage title={meta.title} kicker="IA e interação" description={meta.description}>
      <DocSection title="ReasoningBlock" rule="Recolhido por padrão depois de pronto; aberto e brilhando enquanto pensa.">
        <Demo className="block space-y-3" code={`<ReasoningBlock durationMs={8200} lines={["Filtrar faturas…", "Separar quem sempre atrasou…"]} />\n<ReasoningBlock streaming lines={["Buscando os 9 maiores valores…"]} />`}>
          <ReasoningBlock durationMs={8200} lines={["Filtrar faturas vencidas há 15+ dias no Nordeste.", "Separar quem sempre atrasou de quem começou agora.", "Aplicar a régua da política de cobrança."]} />
          <ReasoningBlock streaming lines={["Buscando os 9 maiores valores…", "Checando a agenda da Elisa…"]} />
        </Demo>
      </DocSection>
      <DocSection title="AgentPlan" rule="Antes de executar algo longo, mostre o plano; durante, onde está.">
        <Demo className="block" code={`<AgentPlan steps={[{ id: "1", label: "Levantar faturas", status: "done" }, { id: "2", label: "Enviar lembretes", status: "active" }]} />`}>
          <AgentPlan
            steps={[
              { id: "1", label: "Levantar faturas vencidas no ERP", status: "done" },
              { id: "2", label: "Comparar com histórico de pagamento", status: "done" },
              { id: "3", label: "Enviar lembrete para 42 clientes", status: "active", detail: "Aguardando aprovação" },
              { id: "4", label: "Agendar ligações", status: "pending" },
            ]}
          />
        </Demo>
      </DocSection>
      <DocSection title="ApprovalRequest" rule="Toda ação que sai da empresa ou não tem volta: preview do que vai acontecer, impacto, e três saídas.">
        <Demo
          bare
          code={`<ApprovalRequest
  title="Enviar lembrete de pagamento para 42 clientes"
  description="Não dá para desfazer depois de enviado."
  impact="42 clientes · R$ 318,4 mil" risk="high" state={state}
  preview={<Rascunho />}
  onApprove={…} onApproveAlways={…} onEdit={…} onReject={…} />`}
        >
          <div className="max-w-[680px]">
            <ApprovalRequest
              title="Enviar lembrete de pagamento para 42 clientes"
              description="E-mail com a 2ª via do boleto, enviado de financeiro@acme.com.br. Não dá para desfazer depois de enviado."
              impact="42 clientes · R$ 318,4 mil"
              risk="high"
              state={s}
              preview={<p className="m-0">Olá, {"{nome}"}. Identificamos a fatura {"{número}"} vencida em {"{data}"}. Segue a 2ª via atualizada.</p>}
              onApprove={() => (setS("approved"), notify("Aprovado", () => setS("pending")))}
              onApproveAlways={() => (setS("always"), notify("Aprovado para sempre", () => setS("pending")))}
              onEdit={() => notify("Abriria o editor", undefined, "info")}
              onReject={() => (setS("rejected"), notify("Recusado. Nada foi enviado.", () => setS("pending"), "info"))}
            />
          </div>
        </Demo>
        <PropsTable
          rows={[
            ["state", '"pending" | "approved" | "always" | "rejected"', '"pending"', "Depois da decisão, o cartão vira registro (sem botões)."],
            ["risk", '"low" | "medium" | "high"', '"medium"', "high = borda rosa; medium = âmbar."],
            ["impact / preview", "ReactNode", "—", "O que e quanto: “42 clientes”, o rascunho do e-mail."],
            ["onApproveAlways", "() => void", "—", "Mostra “Sempre aprovar este tipo”. Use só para ações reversíveis ou de baixo risco."],
          ]}
        />
      </DocSection>
      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Peça aprovação para: enviar para fora, cobrar, apagar, alterar muitos registros.", dont: "Pedir aprovação para ler dados (vira ruído e a pessoa passa a aprovar sem ler)." },
            { do: "Preview do que vai sair exatamente, com as variáveis visíveis.", dont: "“O agente vai enviar e-mails. Aprovar?”" },
            { do: "Recusar deixa claro que nada foi feito.", dont: "Recusa silenciosa." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
