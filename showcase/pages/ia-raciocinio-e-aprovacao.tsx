import { useState } from "react";
import { BrainCircuit, Code, FileText, Search, Terminal } from "lucide-react";
import { AgentPlan, ApprovalRequest, Button, ReasoningBlock, notify, type ApprovalState } from "@g4ai/ds";
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
        <Demo
          className="block max-w-[680px]"
          title="Recolhível, com detalhe por passo"
          description="`collapsible` vira cartão com status geral no cabeçalho. Passo com `content` abre o detalhe (ferramenta chamada, aviso); `durationMs` mostra quanto levou; `icon` identifica o tipo dos passos pendentes."
          code={`<AgentPlan collapsible title="Planejando a régua de cobrança" steps={[
  { id: "1", label: "Entender o pedido", status: "done", durationMs: 400, content: <Restricoes /> },
  { id: "2", label: "Buscar faturas no ERP", status: "done", durationMs: 1200, content: <ToolCallCard … /> },
  { id: "3", label: "Montar a régua por perfil", status: "active", defaultOpen: true, content: <Rascunho /> },
  { id: "4", label: "Revisar conflito com a política", status: "error", content: <Callout tone="bad" … /> },
  { id: "5", label: "Enviar para aprovação", status: "pending", icon: <Code /> },
]} />`}
        >
          <AgentPlan
            collapsible
            title="Planejando a régua de cobrança"
            steps={[
              {
                id: "1",
                label: "Entender o pedido e extrair restrições",
                status: "done",
                durationMs: 400,
                icon: <Search />,
                content: (
                  <dl className="m-0 grid grid-cols-[96px_1fr] gap-x-3 gap-y-1 rounded-lg border border-line bg-soft/60 p-2.5 text-[12px]">
                    <dt className="text-muted">Região</dt>
                    <dd className="m-0">Nordeste</dd>
                    <dt className="text-muted">Atraso</dt>
                    <dd className="m-0">15 dias ou mais</dd>
                    <dt className="text-muted">Restrição</dt>
                    <dd className="m-0 text-amber">Não contatar clientes em negociação</dd>
                  </dl>
                ),
              },
              { id: "2", label: "Buscar faturas no ERP", status: "done", durationMs: 1240, icon: <FileText />, content: <p className="m-0">Consulta <code className="rounded bg-soft px-1 font-mono text-[11.5px]">contas_receber.vencidas</code> devolveu 42 faturas, R$ 318,4 mil.</p> },
              { id: "3", label: "Montar a régua por perfil de pagador", status: "active", defaultOpen: true, icon: <BrainCircuit />, content: <p className="m-0">Separando quem sempre atrasou (lembrete leve) de quem começou agora (ligação do gerente)…</p> },
              { id: "4", label: "Revisar conflito com a política de cobrança", status: "error", durationMs: 800, content: <p className="m-0 rounded-lg border border-rose/20 bg-rose-soft/50 p-2.5 text-rose">3 clientes estão em negociação jurídica. Removidos da régua antes de continuar.</p> },
              { id: "5", label: "Enviar a régua para aprovação", status: "pending", icon: <Code /> },
            ]}
          />
        </Demo>
        <PropsTable
          rows={[
            ["steps[].status", '"pending" | "active" | "done" | "error" | "skipped"', "—", "Onde o passo está. Ícone + texto para leitor de tela."],
            ["steps[].content", "ReactNode", "—", "Detalhe expansível do passo (ferramenta, trecho, aviso)."],
            ["steps[].durationMs", "number", "—", "Quanto o passo levou (formatDuration)."],
            ["steps[].icon", "ReactNode", "—", "Tipo do passo, mostrado enquanto pendente."],
            ["steps[].defaultOpen", "boolean", "false", "Abre o detalhe de início (passo atual ou que falhou)."],
            ["collapsible", "boolean", "false", "Cabeçalho clicável com status geral; recolhe o plano."],
            ["defaultOpen", "boolean", "true", "Plano aberto de início (com collapsible)."],
          ]}
        />
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
        <Demo
          bare
          title="Tons"
          description="Sem `tone`, a aparência vem do `risk`: low = info, medium = warn, high = bad. `tone` sobrepõe quando o risco não diz tudo (neutral para pedidos rotineiros)."
          code={`<ApprovalRequest risk="low" title="Criar rascunho no CRM" />          // info
<ApprovalRequest risk="medium" title="Atualizar 12 negócios" />      // warn
<ApprovalRequest risk="high" title="Cobrar 42 clientes" />           // bad
<ApprovalRequest tone="neutral" title="Ler a planilha de metas" />`}
        >
          <div className="grid max-w-[680px] gap-3">
            <ApprovalRequest risk="low" title="Criar rascunho de proposta no CRM" description="Fica como rascunho; ninguém recebe nada." impact="1 negócio" onApprove={() => notify("Aprovado")} onReject={() => notify("Recusado", undefined, "info")} />
            <ApprovalRequest risk="medium" title="Atualizar a etapa de 12 negócios" description="Move de Proposta para Negociação." impact="12 negócios" onApprove={() => notify("Aprovado")} onReject={() => notify("Recusado", undefined, "info")} />
            <ApprovalRequest risk="high" title="Cobrar 42 clientes no cartão" description="Não dá para desfazer depois de cobrado." impact="R$ 318,4 mil" onApprove={() => notify("Aprovado")} onReject={() => notify("Recusado", undefined, "info")} />
            <ApprovalRequest tone="neutral" title="Ler a planilha de metas do trimestre" description="Só leitura, dentro da empresa." onApprove={() => notify("Aprovado")} onReject={() => notify("Recusado", undefined, "info")} />
          </div>
        </Demo>
        <Demo
          bare
          title="Sobrelinha, ícone, corpo e ações próprios"
          description="`eyebrow` e `icon` dizem que tipo de pedido é; `children` entra entre o preview e o rodapé; `actions` substitui os botões padrão."
          code={`<ApprovalRequest tone="warn" eyebrow="Comando no terminal" icon={<Terminal />}
  title="Rodar a migração do banco" preview={<code>npm run db:migrate</code>}
  actions={<><Button size="sm">Rodar</Button><Button size="sm" variant="ghost">Agora não</Button></>}>
  <p>Afeta 3 tabelas em produção.</p>
</ApprovalRequest>`}
        >
          <div className="max-w-[680px]">
            <ApprovalRequest
              tone="warn"
              eyebrow="Comando no terminal"
              icon={<Terminal />}
              title="Rodar a migração do banco"
              preview={<code className="font-mono text-[12px]">npm run db:migrate -- --env produção</code>}
              actions={
                <>
                  <Button size="sm" onClick={() => notify("Migração iniciada")}>Rodar</Button>
                  <Button size="sm" variant="ghost" onClick={() => notify("Nada foi executado", undefined, "info")}>Agora não</Button>
                </>
              }
            >
              <p className="m-0">Afeta 3 tabelas em produção: pedidos, faturas e clientes.</p>
            </ApprovalRequest>
          </div>
        </Demo>
        <Demo
          bare
          title="Depois da decisão"
          description="Aprovado, sempre aprovado, recusado, expirado (venceu sem resposta) e substituído (um pedido mais novo tomou o lugar). Sem botões; o cartão vira registro."
          code={`<ApprovalRequest state="approved" … />
<ApprovalRequest state="always" … />
<ApprovalRequest state="rejected" … />
<ApprovalRequest state="expired" … />
<ApprovalRequest state="superseded" … />`}
        >
          <div className="grid max-w-[680px] gap-3">
            {(["approved", "always", "rejected", "expired", "superseded"] as const).map((st) => (
              <ApprovalRequest key={st} state={st} risk="high" title="Enviar lembrete de pagamento para 42 clientes" impact="42 clientes" />
            ))}
          </div>
        </Demo>
        <Demo
          bare
          title="Compacto"
          description="`compact` reduz um pedido decidido a uma linha (ícone, estado, título, impacto). Bom para o histórico da conversa. Pedido pendente ignora `compact`."
          code={`<ApprovalRequest compact state="approved" title="Enviar lembrete para 42 clientes" impact="42 clientes" />`}
        >
          <div className="grid max-w-[680px] gap-2">
            {(["approved", "always", "rejected", "expired", "superseded"] as const).map((st) => (
              <ApprovalRequest key={st} compact state={st} title="Enviar lembrete de pagamento para 42 clientes" impact="42 clientes" />
            ))}
          </div>
        </Demo>
        <PropsTable
          rows={[
            ["state", '"pending" | "approved" | "always" | "rejected" | "expired" | "superseded"', '"pending"', "Depois da decisão, o cartão vira registro (sem botões). expired = venceu sem resposta; superseded = outro pedido tomou o lugar."],
            ["risk", '"low" | "medium" | "high"', '"medium"', "Define o tom quando `tone` não vem: low = info, medium = warn, high = bad."],
            ["tone", '"neutral" | "info" | "warn" | "bad"', "do risk", "Aparência do pedido pendente (borda e ícone). Sobrepõe a derivada do risk."],
            ["eyebrow / icon", "ReactNode", "labels.eyebrow / escudo", "Sobrelinha e ícone do pedido pendente (“Comando no terminal”). Decidido, mostra o estado."],
            ["impact / preview", "ReactNode", "—", "O que e quanto: “42 clientes”, o rascunho do e-mail."],
            ["children", "ReactNode", "—", "Corpo extra entre o preview e o rodapé (detalhes, avisos, campos)."],
            ["actions", "ReactNode", "botões padrão", "Substitui aprovar/sempre/editar/recusar enquanto pende. Mantenha um primário."],
            ["compact", "boolean", "false", "Estado decidido vira uma linha: ícone, estado, título e impacto."],
            ["onApproveAlways", "() => void", "—", "Mostra “Sempre aprovar este tipo”. Use só para ações reversíveis ou de baixo risco."],
            ["labels", "Partial<ApprovalRequestLabels>", "pt-BR", "Textos da sobrelinha, dos botões, dos estados (inclusive expired e superseded) e do nome acessível (ariaLabel recebe o título). Passe só o que muda; o resto fica em pt-BR (approvalRequestLabels)."],
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
