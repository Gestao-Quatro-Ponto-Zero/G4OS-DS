import { AgentActivityCard, AgentMark, AgentPhaseBadge, agentActivitySample, notify, useAgentActivityDemo, type AgentPhase } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Atividade do agente",
  group: "IA e interação",
  order: 26,
  description:
    "AgentActivityCard: o agente de código trabalhando por fases (lendo, buscando, pensando, escrevendo, revisando), com o plano, o contexto da fase, as ferramentas, o modelo e quanto já custou. Pausar e Parar sempre ao alcance.",
  shadcn: false,
};

const phases: AgentPhase[] = ["lendo", "buscando", "pensando", "escrevendo", "revisando", "concluido", "pausado", "parado", "falhou"];

function LiveDemo() {
  const demo = useAgentActivityDemo({ loop: true });
  return (
    <AgentActivityCard
      {...demo}
      onStop={() => {
        demo.onStop();
        notify("Agente parado", undefined, "info");
      }}
      className="w-full max-w-[460px]"
    />
  );
}

export default function Page() {
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <DocSection title="Em ação" rule="Uma fase por vez, sempre com a palavra. O contexto embaixo do plano mostra a evidência da fase: o arquivo que lê, a busca, as ideias, o texto que escreve e o que revisou.">
        <Demo
          className="flex justify-center p-3 sm:p-8"
          code={`const demo = useAgentActivityDemo();
<AgentActivityCard {...demo} />

// No app: controlado pelo que o agente reporta.
<AgentActivityCard
  phase={run.phase}               // "lendo" | "buscando" | … | "concluido"
  progress={run.done / run.total}
  task="Adicionar alternador de tema escuro"
  plan={run.plan}                 // [{ id, label, status: "pendente" | "atual" | "feito" }]
  context={run.context}           // { kind: "escrita", path, text } …
  tools={run.tools}
  model={{ models, value: model, onChange: setModel }}
  usage={{ tokens: run.tokens, cost: run.cost, elapsedMs: run.elapsedMs }}
  unsavedChanges={run.dirty}
  onPause={pause} onResume={resume} onStop={stop} onRestart={rerun}
/>`}
        >
          <LiveDemo />
        </Demo>
      </DocSection>

      <DocSection title="Cada fase" rule="Fases de trabalho usam a paleta categórica (não são bom ou ruim); concluído é ok, falhou é rose, pausado e parado ficam neutros. Com animate={false} cada painel aparece no estado final.">
        <div className="grid gap-4 lg:grid-cols-2">
          {phases.map((p) => (
            <Demo key={p} title={p} className="p-3" code={`<AgentActivityCard {...props} phase="${p}" animate={false} />`}>
              <AgentActivityCard {...agentActivitySample(p)} animate={false} onPause={() => undefined} onResume={() => undefined} onStop={() => undefined} onRestart={() => undefined} className="w-full" />
            </Demo>
          ))}
        </div>
      </DocSection>

      <DocSection title="Peças" rule="AgentPhaseBadge (ponto + palavra) para listas de execuções; AgentMark como marca do agente. A marca só se mexe enquanto o agente trabalha e com a aba visível.">
        <Demo
          className="flex flex-col items-start gap-3"
          code={`<AgentMark phase="escrevendo" />
<AgentPhaseBadge phase="escrevendo" />`}
        >
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {phases.map((p) => (
              <span key={p} className="inline-flex items-center gap-2">
                <AgentMark phase={p} size={16} />
                <AgentPhaseBadge phase={p} />
              </span>
            ))}
          </div>
        </Demo>
      </DocSection>

      <DocSection title="Props">
        <PropsTable
          rows={[
            ["phase", "AgentPhase", "—", "lendo, buscando, pensando, escrevendo, revisando, concluido, pausado, parado, falhou."],
            ["progress", "number", "—", "Progresso de 0 a 1 (barra fina na cor da fase)."],
            ["task", "string", "—", "Título da tarefa no topo do plano."],
            ["plan", "AgentPlanStep[]", "—", "{ id, label, status: pendente | atual | feito }. Feito fica riscado e esmaecido."],
            ["context", "AgentPhaseContext", "—", "arquivo · busca · ideias · escrita · revisao (diff de palavras) · resultado (com changes) · erro."],
            ["tools", "AgentTool[]", "—", "Ferramentas conectadas; active realça a que está em uso."],
            ["model", "string | { models, value, onChange }", "—", "Chip com o nome do modelo ou o ModelPicker."],
            ["usage", "{ tokens, cost, elapsedMs }", "—", "Tokens (compacto), custo em R$ e tempo m:ss, em mono tabular."],
            ["onPause / onResume / onStop / onRestart", "() => void", "—", "Pausar e Parar enquanto trabalha; Retomar quando pausado; Executar de novo ao terminar."],
            ["unsavedChanges", "boolean", "false", "Parar pede confirmação (ConfirmDialog) antes de descartar."],
            ["phaseLabel", "string", "—", "Troca a palavra da fase (\"Lendo tokens.css\")."],
            ["animate", "boolean", "true", "false mostra cada painel no estado final. Movimento reduzido faz o mesmo."],
            ["agentName", "string", "\"Agente de código\"", "Nome no cabeçalho."],
            ["label", "string", "agente: tarefa", "Nome acessível do card."],
          ]}
        />
        <PropsTable
          rows={[
            ["useAgentActivityDemo", "({ task?, loop?, autoplay? })", "—", "Percorre as fases em ~15 s, só com a aba visível. Devolve as props do card."],
            ["agentActivitySample", "(phase) => props", "—", "Quadro estático de uma fase, para documentação e estados."],
            ["AgentPhaseBadge", "{ phase, label? }", "—", "Ponto + palavra na cor da fase."],
            ["AgentMark", "{ phase?, live?, size? }", "size 20", "Barras de equalizador. Paradas com movimento reduzido."],
          ]}
        />
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Fase sempre com a palavra: ponto + “Escrevendo”. A cor só reforça.", dont: "Mostrar só a barra colorida ou a marca animada como estado." },
            { do: "Custo e tempo visíveis enquanto roda (tokens, R$, m:ss).", dont: "Esconder o consumo até o fim ou num menu." },
            { do: "Pausar sempre ao alcance; Parar pede confirmação só quando há alteração não salva.", dont: "Tirar o Pausar durante fases longas ou confirmar toda parada." },
            { do: "Concluído mostra o que mudou: resumo com passos, tokens, tempo e os arquivos.", dont: "Encerrar só com “Pronto” sem evidência." },
            { do: "Um card por execução, ao lado da conversa ou numa lista de execuções.", dont: "Colocar este card atrás de tabela ou formulário como enfeite." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
