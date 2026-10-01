import { AiBadge, SystemMessage, ToolCallsSection } from "@g4os/ds";
import { DocPage, DocSection, Rules, type PageMeta } from "../kit";
import { toolCalls } from "./_ia-data";

export const meta: PageMeta = {
  title: "Princípios de IA",
  group: "IA e interação",
  order: 0,
  description: "Como a IA aparece nos produtos G4 OS: transparente, citável, interrompível e sem prender a tela. Vale para assistente, agentes e qualquer texto gerado.",
};

export default function Page() {
  return (
    <DocPage title={meta.title} kicker={meta.group} description={meta.description}>
      <DocSection title="Seis regras" rule="Se um componente de IA não cumpre uma destas, ele não entra no produto.">
        <ol className="grid list-none gap-3 p-0 md:grid-cols-2">
          {[
            ["Mostre o que o agente fez", "Ferramentas usadas, registros lidos, passos e tempo. Use ToolCallsSection na resposta e AgentTrace na página da execução."],
            ["Cite a origem", "Todo número ou fato que veio de dado do cliente leva um CitationChip que abre a fonte. Sem fonte, diga que é estimativa."],
            ["Deixe parar, refazer e corrigir", "Botão Parar enquanto responde, Gerar de novo depois, avaliação 👍/👎, e o texto sempre editável antes de enviar/salvar."],
            ["Nunca bloqueie a tela", "O assistente vive num painel lateral ou página própria. Modal só para uma pergunta curta (InputModal)."],
            ["Explique limites e falhas", "SystemMessage diz o que aconteceu e o próximo passo. Limite de uso mostra o tempo até liberar (RateLimitNotice, LimitDialog)."],
            ["Marque o que é gerado", "AiBadge ao lado de resumos, rascunhos e campos preenchidos pela IA até alguém revisar."],
          ].map(([t, d], i) => (
            <li key={t} className="rounded-xl border border-line bg-surface p-4">
              <span className="text-[11px] font-semibold tabular-nums text-accent-deep">0{i + 1}</span>
              <p className="m-0 mt-1 text-[14px] font-medium">{t}</p>
              <p className="m-0 mt-1 text-[13px] leading-relaxed text-muted">{d}</p>
            </li>
          ))}
        </ol>
      </DocSection>
      <DocSection title="Na prática">
        <div className="space-y-3 rounded-xl border border-line bg-surface p-5">
          <p className="m-0 flex items-center gap-2 text-[13.5px] font-medium">
            Resumo da conta <AiBadge />
          </p>
          <p className="m-0 text-[13.5px] leading-relaxed text-ink-soft">
            O Grupo Aurora está em negociação há 18 dias, com proposta de R$ 460,8 mil. O jurídico pediu SLA de 99,9 %; a diretoria aprova até R$ 480 mil.
          </p>
          <ToolCallsSection calls={toolCalls} />
          <SystemMessage tone="info">Resumo gerado a partir de 3 registros. Revise antes de enviar ao cliente.</SystemMessage>
        </div>
      </DocSection>
      <DocSection title="Faça e evite">
        <Rules
          items={[
            { do: "Nomeie o assistente pela função (“Assistente de vendas”).", dont: "Personagem com nome e personalidade que promete o que não faz." },
            { do: "Texto da IA em tinta normal; o selo IA indica a origem.", dont: "Texto gerado em cor diferente, gradiente arco-íris ou brilho animado." },
            { do: "Mostre “Pensando…” com tempo decorrido acima de 3 s.", dont: "Spinner infinito sem contexto." },
            { do: "Erros com saída: tentar de novo, verificar integração, falar com admin.", dont: "“Algo deu errado.” e nada mais." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
