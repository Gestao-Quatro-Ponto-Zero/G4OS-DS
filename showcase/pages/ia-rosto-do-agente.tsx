import { BookOpen, Globe, Search, SquareTerminal } from "lucide-react";
import { useState } from "react";
import { AGENT_ORB_EXPRESSIONS, AGENT_ORB_PALETTE, AGENT_ORB_SHAPES, AgentOrb, AgentOrbStack, Button, SegmentedControl, cn, type AgentOrbExpression, type AgentOrbShape } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Rosto do agente",
  group: "IA e interação",
  order: 12,
  description: "AgentOrb: um avatar gerado a partir do id do agente, com a expressão do que ele está fazendo. Dá identidade a cada agente sem pedir upload de imagem e mostra o estado sem uma palavra.",
  shadcn: false,
};

const team = [
  { seed: "galt:atlas", name: "Atlas", role: "Pesquisa de mercado" },
  { seed: "galt:nina", name: "Nina", role: "Financeiro" },
  { seed: "galt:otto", name: "Otto", role: "Revisão de contratos" },
  { seed: "galt:bia", name: "Bia", role: "Atendimento" },
  { seed: "galt:caio", name: "Caio", role: "Dados" },
  { seed: "galt:lia", name: "Lia", role: "Recrutamento" },
];

const expressionLabel: Record<AgentOrbExpression, string> = {
  idle: "Disponível",
  smile: "Sorriso",
  happy: "Feliz",
  wink: "Piscada",
  flustered: "Sem graça",
  working: "Trabalhando",
  focused: "Concentrado",
  waiting: "Esperando você",
  sad: "Falhou",
  thinking: "Pensando",
  reading: "Lendo",
  talking: "Falando",
  calm: "Tranquilo",
  sleepy: "Dormindo",
  confused: "Confuso",
  proud: "Entregou",
  aha: "Achou",
  alert: "Atenção",
};
const shapeLabel: Record<AgentOrbShape, string> = { circle: "Círculo", "rounded-square": "Quadrado", "rounded-triangle": "Triângulo", "rounded-hexagon": "Hexágono" };

const steps: { expression: AgentOrbExpression; text: string; badge?: React.ReactNode }[] = [
  { expression: "thinking", text: "Entendendo o pedido" },
  { expression: "working", text: "Buscando concorrentes", badge: <Search /> },
  { expression: "reading", text: "Lendo 4 relatórios", badge: <BookOpen /> },
  { expression: "working", text: "Rodando a análise", badge: <SquareTerminal /> },
  { expression: "waiting", text: "Precisa da sua aprovação" },
  { expression: "proud", text: "Entregou o relatório" },
];

export default function Page() {
  const [expression, setExpression] = useState<AgentOrbExpression>("working");
  const [shape, setShape] = useState<AgentOrbShape>("circle");
  const [palette, setPalette] = useState(0);
  const [step, setStep] = useState(1);
  const current = steps[step];
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <DocSection title="Cada agente, um rosto" rule="O rosto é função pura da semente: o mesmo id dá sempre o mesmo agente, em qualquer tela e em qualquer tamanho. Use o id estável do agente, nunca o nome (que a pessoa pode trocar).">
        <Demo
          className="block"
          code={`<AgentOrb seed={\`galt:\${agent.id}\`} size={40} />`}
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((a) => (
              <div key={a.seed} className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3">
                <AgentOrb seed={a.seed} size={40} />
                <div className="min-w-0">
                  <div className="truncate text-[13.5px] font-medium">{a.name}</div>
                  <div className="truncate text-[12px] text-muted">{a.role}</div>
                </div>
              </div>
            ))}
          </div>
        </Demo>
      </DocSection>

      <DocSection title="A expressão é o estado" rule="Passe em `expression` o que o agente está fazendo. As que se repetem (trabalhando, lendo, pensando, esperando) têm o próprio ciclo; as de uma vez (entregou, achou, atenção) tocam uma vez a cada troca. Com movimento reduzido o rosto fica parado, e a expressão continua legível.">
        <Demo
          className="block"
          code={`<AgentOrb seed="galt:atlas" size={72} expression="working" badge={<Search />} />
<AgentOrb seed="galt:atlas" size={72} expression="waiting" />`}
        >
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:gap-8">
            <div className="flex w-40 shrink-0 flex-col items-center gap-3 text-center">
              <AgentOrb seed="galt:atlas" size={96} expression={expression} name={`Atlas · ${expressionLabel[expression]}`} labelled />
              <div>
                <div className="text-[13.5px] font-medium">Atlas</div>
                <div className="text-[12px] text-muted">{expressionLabel[expression]}</div>
              </div>
            </div>
            <div className="grid flex-1 grid-cols-3 gap-1.5 sm:grid-cols-6">
              {AGENT_ORB_EXPRESSIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  aria-pressed={e === expression}
                  onClick={() => setExpression(e)}
                  className={cn("flex flex-col items-center gap-1.5 rounded-xl px-1 py-2.5 text-[11px] ring-1 ring-inset", e === expression ? "bg-soft font-medium text-ink ring-line-strong" : "text-muted ring-transparent hover:bg-soft")}
                >
                  <AgentOrb seed="galt:atlas" size={36} expression={e} motion="none" />
                  <span className="w-full truncate text-center">{expressionLabel[e]}</span>
                </button>
              ))}
            </div>
          </div>
        </Demo>
      </DocSection>

      <DocSection title="O que ele tem na mão" rule="`badge` mostra a ferramenta em uso num selo no canto: busca, leitura, terminal, ou o logo do app conectado. Junto com a expressão, conta o passo atual sem ocupar uma linha de texto. Abaixo de 24 px o selo some, porque cobriria o rosto.">
        <Demo
          className="block"
          code={`<AgentOrb seed={id} size={56} expression="reading" badge={<BookOpen />} />`}
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <AgentOrb seed="galt:nina" size={56} expression={current.expression} badge={current.badge} />
              <div>
                <div className="text-[14px] font-medium">Nina</div>
                <div className="text-[12.5px] text-muted" aria-live="polite">
                  {current.text}
                </div>
              </div>
            </div>
            <div className="flex gap-2 sm:ml-auto">
              <Button variant="ghost" size="sm" onClick={() => setStep((s) => (s + steps.length - 1) % steps.length)}>
                Passo anterior
              </Button>
              <Button size="sm" onClick={() => setStep((s) => (s + 1) % steps.length)}>
                Próximo passo
              </Button>
            </div>
          </div>
        </Demo>
      </DocSection>

      <DocSection title="Forma e cor escolhidas" rule="Quando a pessoa cria o agente, ela pode escolher silhueta e cor: `shape` e `palette` (índice em AGENT_ORB_PALETTE) substituem o que a semente decidiria; o rosto continua vindo da semente. As cores são identidade do agente, iguais nos dois temas, como o `tint` de Avatar.">
        <Demo
          className="block"
          code={`<AgentOrb seed={id} size={64} shape="rounded-hexagon" palette={4} />`}
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
            <AgentOrb seed="galt:novo" size={88} shape={shape} palette={palette} expression="idle" className="shrink-0 self-center" />
            <div className="min-w-0 flex-1 space-y-4">
              <div>
                <p className="m-0 mb-1.5 text-[12.5px] text-muted">Forma</p>
                <SegmentedControl label="Forma do agente" value={shape} onChange={setShape} options={AGENT_ORB_SHAPES.map((s) => ({ value: s, label: shapeLabel[s] }))} />
              </div>
              <div>
                <p className="m-0 mb-1.5 text-[12.5px] text-muted">Cor</p>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Cor do agente">
                  {AGENT_ORB_PALETTE.map((p, i) => (
                    <button key={i} type="button" aria-pressed={i === palette} aria-label={`Cor ${i + 1}`} onClick={() => setPalette(i)} className={cn("h-8 w-8 rounded-full ring-2 ring-offset-2 ring-offset-surface", i === palette ? "ring-ink" : "ring-transparent hover:ring-line-strong")} style={{ background: p.tint }}>
                      <span className="mx-auto block h-3.5 w-3.5 rounded-full" style={{ background: p.deep }} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Demo>
      </DocSection>

      <DocSection title="Tamanhos e pilha" rule="De 14 a 96 px o traço se ajusta: olhos mais grossos nos pequenos, para um rosto de 16 px numa lista ainda ter olhos. `AgentOrbStack` mostra quem participa de uma conversa ou de um time, até `max` rostos e o resto em +N.">
        <div className="grid gap-4 md:grid-cols-2">
          <Demo title="Tamanhos" code={`<AgentOrb seed={id} size={16} />   // linha de lista
<AgentOrb seed={id} size={24} />   // menção, chip
<AgentOrb seed={id} size={40} />   // cabeçalho, card
<AgentOrb seed={id} size={72} />   // perfil, estado vazio`}>
            <div className="flex flex-wrap items-end gap-4">
              {[16, 20, 24, 32, 40, 56, 72].map((s) => (
                <div key={s} className="flex flex-col items-center gap-2">
                  <AgentOrb seed="galt:otto" size={s} />
                  <span className="text-[11px] tabular-nums text-muted">{s}</span>
                </div>
              ))}
            </div>
          </Demo>
          <Demo title="Quem participa" code={`<AgentOrbStack agents={team} size={28} max={4} />`}>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <AgentOrbStack agents={team} size={28} max={4} />
                <span className="text-[13px] text-ink-soft">6 agentes no time de lançamento</span>
              </div>
              <div className="flex items-center gap-3">
                <AgentOrbStack agents={team.slice(0, 3)} size={20} />
                <span className="text-[12.5px] text-muted">Atlas, Nina e Otto responderam</span>
              </div>
            </div>
          </Demo>
        </div>
      </DocSection>

      <DocSection title="Papel fixo">
        <Demo title="Um ícone no lugar do rosto" description="Para um ajudante que não é um agente com nome (navegador, terminal), `glyph` troca o rosto por um ícone e mantém a cor da semente." code={`<AgentOrb seed="tool:browser" size={40} glyph={<Globe className="h-5 w-5" />} />`}>
          <div className="flex items-center gap-4">
            <AgentOrb seed="tool:browser" size={40} glyph={<Globe className="h-5 w-5" />} />
            <AgentOrb seed="tool:terminal" size={40} glyph={<SquareTerminal className="h-5 w-5" />} />
            <AgentOrb seed="tool:search" size={40} shape="rounded-square" glyph={<Search className="h-5 w-5" />} />
          </div>
        </Demo>
      </DocSection>

      <DocSection title="Props">
        <PropsTable
          rows={[
            ["seed", "string", "—", "Id estável do agente. Decide cor, corpo e rosto."],
            ["size", "number", "20", "Lado em px, de 14 a 96."],
            ["expression", "AgentOrbExpression", "—", "O que o agente está fazendo. Sem ela, o rosto semeado, parado."],
            ["badge", "ReactNode", "—", "Ícone ou logo da ferramenta em uso, num selo no canto (de 24 px para cima)."],
            ["shape", '"circle" | "rounded-square" | "rounded-triangle" | "rounded-hexagon"', '"circle"', "Silhueta escolhida pela pessoa."],
            ["palette", "number", "—", "Índice em AGENT_ORB_PALETTE no lugar da cor semeada."],
            ["motion", '"hover" | "live" | "none"', '"hover"', "Pisca no hover/foco, balança enquanto executa, ou parado."],
            ["name + labelled", "string + boolean", "—", "Nome acessível quando o rosto aparece sozinho. Sem `labelled`, é decorativo."],
            ["glyph", "ReactNode", "—", "Ícone no lugar do rosto, para um ajudante de papel fixo."],
          ]}
        />
      </DocSection>

      <Rules
        items={[
          { do: "Use o rosto onde o agente aparece como alguém: cabeçalho da conversa, lista de agentes, menção, estado vazio.", dont: "Usar como enfeite de página ou ícone de recurso. A marca genérica de IA é o AiMark." },
          { do: "Ponha o nome e o estado em texto ao lado. O rosto reforça, não substitui.", dont: "Depender só da expressão para dizer que o agente falhou ou espera você." },
          { do: "Deixe a expressão seguir o estado real da execução.", dont: "Animar por animar: um rosto \"trabalhando\" num agente parado mente." },
          { do: "Em lista longa, `motion=\"none\"` nos rostos que não estão executando.", dont: "Dezenas de rostos se mexendo ao mesmo tempo." },
        ]}
      />
    </DocPage>
  );
}
