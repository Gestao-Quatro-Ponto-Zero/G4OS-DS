import { useState } from "react";
import {
  AnswerVersions,
  CitedText,
  MessageActions,
  ModelPicker,
  RelatedQuestions,
  SourceCards,
  SourceStack,
  citedPlainText,
  notify,
  useLinkedHighlight,
  useStreamingText,
  type AiSource,
  type ModelEffort,
  type ModelOption,
} from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Resposta com fontes",
  group: "IA e interação",
  order: 31,
  description:
    "Resposta de IA que dá para conferir: fontes em cartões, texto formatado com citações que acendem a frase que sustentam, versões, refazer com opções e pergunta relacionada. Inclui o seletor de modelo com destaques e resumo de preço.",
};

const sources: AiSource[] = [
  { id: "1", kind: "doc", title: "Política de férias 2026", domain: "Wiki de Pessoas", tint: "var(--color-chart-1)" },
  { id: "2", kind: "data", title: "Saldo de férias por time", domain: "Painel de RH", tint: "var(--color-chart-3)" },
  { id: "3", kind: "web", title: "Férias coletivas: o que diz a lei", domain: "trabalhista.org", href: "#", tint: "var(--color-chart-2)" },
  { id: "4", kind: "doc", title: "Ata do comitê de pessoas · 12/09", domain: "Arquivos", tint: "var(--color-chart-5)" },
  { id: "5", kind: "record", title: "Calendário de fechamento contábil", domain: "Financeiro" },
  { id: "6", kind: "web", title: "Como planejar férias em times pequenos", domain: "gestaodepessoas.app", href: "#", tint: "var(--color-chart-4)" },
];

const resposta = `As férias de dezembro podem ser coletivas para o time inteiro, desde que avisadas com 15 dias de antecedência [3]. Hoje 14 pessoas têm saldo vencendo no 1º trimestre [2].

## Como organizar

1. **Confirme o período.** O comitê sugeriu de 22/12 a 5/1, fora do fechamento contábil [4][5].
2. **Avise com antecedência.** Comunique o time e o sindicato até 7/12 [3].
3. **Cubra os plantões.** Defina quem atende clientes críticos em escala de dois dias [6].

| Time | Pessoas | Saldo médio (dias) |
| --- | ---: | ---: |
| Comercial | 12 | 18 [2] |
| Operações | 9 | 11 [2] |

Use o modelo \`ferias-coletivas.docx\` da wiki para o aviso [1].`;

const modelos: ModelOption[] = [
  { id: "sol", name: "Sol", featured: true, note: "Padrão para análises, textos longos e código.", context: 1_000_000, priceIn: 20, priceOut: 100 },
  { id: "brisa", name: "Brisa", featured: true, note: "Rápido e barato para triagem e resumos curtos.", context: 200_000, priceIn: 4, priceOut: 20 },
  { id: "sol-max", name: "Sol Max", provider: "G4 OS", description: "Tarefas longas e raciocínio profundo", context: 1_000_000, priceIn: 75, priceOut: 375 },
  { id: "aurora", name: "Aurora 3", provider: "Laboratório Aurora", description: "Bom em planilhas e tabelas", context: 400_000, priceIn: 12, priceOut: 48 },
  { id: "aurora-mini", name: "Aurora 3 Mini", provider: "Laboratório Aurora", description: "Classificação em volume", context: 128_000, priceIn: 1, priceOut: 4 },
  { id: "pampa", name: "Pampa 2", provider: "Pampa IA (aberto)", description: "Roda na sua nuvem", context: 128_000, priceIn: 2, priceOut: 6 },
];

function CitedDemo() {
  const hl = useLinkedHighlight<number>();
  return (
    <div className="flex max-w-[680px] flex-col gap-5">
      <SourceCards sources={sources} highlight={hl} />
      <CitedText text={resposta} sources={sources} highlight={hl} />
    </div>
  );
}

function StreamingDemo() {
  const [run, setRun] = useState(0);
  const { text, done } = useStreamingText(resposta, { active: run > 0, charsPerTick: 6 });
  return (
    <div className="flex max-w-[680px] flex-col gap-4">
      <CitedText key={run} text={run ? text : resposta} sources={sources} streaming={run > 0 && !done} size="sm" />
      <button type="button" onClick={() => setRun((r) => r + 1)} className="self-start rounded-md text-[12.5px] font-medium text-ink-soft underline decoration-line-strong underline-offset-4 hover:text-ink">
        Reproduzir streaming
      </button>
    </div>
  );
}

function ActionsDemo() {
  const [versions, setVersions] = useState(2);
  const [index, setIndex] = useState(1);
  return (
    <div className="flex max-w-[680px] flex-col gap-4">
      <MessageActions
        text={citedPlainText(resposta)}
        markdown={resposta}
        onFeedback={() => notify("Avaliação enviada")}
        onShare={() => notify("Link da resposta copiado")}
        onRegenerate={() => {
          setVersions((v) => v + 1);
          setIndex(versions);
        }}
        versions={{ index, count: versions, onIndexChange: setIndex }}
      />
      <MessageActions compact text="Resposta" onRegenerate={() => undefined} versions={{ index: 0, count: 3, onIndexChange: () => undefined }} />
    </div>
  );
}

export default function Page() {
  const [open, setOpen] = useState(false);
  const [v, setV] = useState(1);
  const [modelo, setModelo] = useState("sol");
  const [esforco, setEsforco] = useState<ModelEffort>("padrao");
  return (
    <DocPage title={meta.title} description={meta.description}>
      <DocSection
        title="Texto citado"
        rule="Toda afirmação que veio de uma fonte leva [n]. Passar o ponteiro ou focar a citação acende a frase que ela sustenta e o cartão da fonte; passar no cartão acende as frases que o citam. Clique ou Enter fixa, Esc solta."
      >
        <Demo
          code={`const hl = useLinkedHighlight<number>();
<SourceCards sources={fontes} highlight={hl} />
<CitedText text={markdown} sources={fontes} highlight={hl} />
// markdown: parágrafos, ## títulos, 1. listas, **negrito**, \`código\`, \`\`\` blocos, | tabelas e citações [1] ou [2, 3]`}
        >
          <CitedDemo />
        </Demo>
        <Demo
          title="Streaming"
          description="Passe o texto parcial e `streaming`: cursor no fim, citação incompleta escondida. Com movimento reduzido, `useStreamingText` entrega tudo de uma vez."
          code={`const { text, done } = useStreamingText(resposta);
<CitedText text={text} sources={fontes} streaming={!done} size="sm" />`}
        >
          <StreamingDemo />
        </Demo>
      </DocSection>

      <DocSection title="Fontes" rule="No topo da resposta, o resumo (selos + “6 fontes”) abre e fecha os cartões. A grade tem 4 células; com mais fontes, a última vira “+N fontes”. No celular, uma linha rolável.">
        <Demo
          code={`<SourceStack sources={fontes} expanded={aberto} onToggle={() => setAberto(!aberto)} controls="fontes" />
{aberto && <SourceCards id="fontes" sources={fontes} />}`}
        >
          <div className="flex w-full max-w-[680px] flex-col gap-3">
            <SourceStack sources={sources} expanded={open} onToggle={() => setOpen((o) => !o)} controls="demo-fontes" className="self-start" />
            {open && <SourceCards id="demo-fontes" sources={sources} />}
          </div>
        </Demo>
      </DocSection>

      <DocSection title="Ações, versões e refazer" rule="Copiar, avaliar e compartilhar ficam sempre. Refazer abre opções (Tentar de novo, Mais curta, Mais detalhada, Mais simples) e cada refazer vira uma versão navegável.">
        <Demo
          code={`<MessageActions
  text={citedPlainText(markdown)}
  markdown={markdown}
  onFeedback={avaliar}
  onShare={compartilhar}
  onRegenerate={(opcao) => refazer(opcao)}   // "retry" | "shorter" | "longer" | "simpler"
  versions={{ index, count, onChange: setIndex }}
/>
<AnswerVersions index={1} count={3} onIndexChange={setIndex} />`}
        >
          <div className="flex flex-col gap-4">
            <ActionsDemo />
            <AnswerVersions index={v} count={3} onIndexChange={setV} />
          </div>
        </Demo>
      </DocSection>

      <DocSection title="Pergunta relacionada" rule="Depois da resposta, um campo com rótulo visível e até três sugestões. Tocar numa sugestão pergunta direto.">
        <Demo code={`<RelatedQuestions items={sugestoes} onAsk={(pergunta) => perguntar(pergunta)} />`}>
          <RelatedQuestions
            className="w-full max-w-[560px]"
            items={["Quem ainda não tirou férias este ano?", "Posso dividir as férias coletivas em dois períodos?", "Como fica quem entrou há menos de um ano?"]}
            onAsk={(q) => notify(`Pergunta enviada: ${q}`, undefined, "info")}
          />
        </Demo>
      </DocSection>

      <DocSection
        title="Seletor de modelo com destaques"
        rule="Destaques no topo com uma linha sobre quando usar, depois o esforço e “Outros modelos” agrupados por fornecedor. Em configurações, `summary` mostra contexto, preço e esforço do escolhido."
      >
        <Demo
          code={`const modelos: ModelOption[] = [
  { id: "sol", name: "Sol", featured: true, note: "Padrão para análises e código.", context: 1_000_000, priceIn: 20, priceOut: 100 },
  { id: "aurora", name: "Aurora 3", provider: "Laboratório Aurora", context: 400_000, priceIn: 12, priceOut: 48 },
];
<ModelPicker summary side="bottom" models={modelos} value={modelo} onChange={setModelo} effort={esforco} onEffortChange={setEsforco} />`}
        >
          <ModelPicker summary side="bottom" models={modelos} value={modelo} onChange={setModelo} effort={esforco} onEffortChange={setEsforco} />
        </Demo>
        <PropsTable
          rows={[
            ["ModelOption.featured · note", "boolean · string", "—", "Em destaque no topo do menu, com a nota de uma linha."],
            ["ModelOption.context · priceIn · priceOut", "number", "—", "Contexto em tokens; preços por milhão de tokens (na moeda de currency)."],
            ["ModelOption.provider", "string", "group", "Agrupa “Outros modelos” quando há destaques."],
            ["ModelPicker.summary", "boolean", "false", "Nota + células Contexto, Entrada, Saída, Esforço abaixo do chip."],
            ["ModelPicker.currency", "string", '"BRL"', "Moeda dos preços (ISO 4217)."],
            ["ModelPicker.side", '"top" | "bottom"', '"top"', "Lado do menu: top no campo da conversa, bottom numa página."],
          ]}
        />
      </DocSection>

      <DocSection title="Propriedades">
        <PropsTable
          rows={[
            ["CitedText.text", "string", "—", "Marcação simples com citações [n]. Nunca vira HTML."],
            ["CitedText.sources", "AiSource[]", "[]", "[1] = sources[0]."],
            ["CitedText.highlight", "LinkedHighlight<number>", "interno", "O mesmo de SourceCards liga texto e cartões."],
            ["CitedText.streaming", "boolean", "false", "Cursor no fim; esconde citação ou negrito incompleto."],
            ["CitedText.size", '"md" | "sm"', '"md"', "md = artigo (15 px); sm = conversa (13,5 px)."],
            ["CitedText.headingLevel", "2 | 3 | 4", "2", "Nível de # e ##; ### fica um abaixo."],
            ["SourceCards.max", "number", "4", "Cartões antes do “+N fontes”."],
            ["SourceStack.expanded · onToggle · controls", "boolean · () => void · string", "—", "Botão que abre e fecha os cartões."],
            ["AiSource.tint", "string", "—", "Cor de identidade do selo; sem ela, ícone do tipo."],
            ["CitationChip.active · onHighlight", "boolean · (on) => void", "—", "Citação acesa; avisa entrada e saída de ponteiro/foco."],
            ["MessageActions.onRegenerate", "(opção: RegenerateOption) => void", "—", "Refazer vira menu com opções; substitui onRetry."],
            ["MessageActions.versions", "{ index, count, onChange }", "—", "Pager ‹ 2 de 3 › (index começa em 0)."],
            ["RelatedQuestions.items · onAsk", "string[] · (pergunta) => void", "—", "Até três sugestões + campo com rótulo."],
            ["citedPlainText(markdown)", "string", "—", "Texto sem marcação nem citações, para Copiar."],
          ]}
        />
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Toda afirmação que veio de uma fonte leva a citação; a resposta lista só fontes citadas.", dont: "Fonte enfeitando a resposta sem nenhuma frase que a use." },
            { do: "A citação acende a frase que sustenta, para a pessoa conferir sem sair da página.", dont: "Número solto no fim do parágrafo que não diz qual frase cobre." },
            { do: "Sem fontes, diga que não achou e ofereça o próximo passo (ampliar a busca, reformular).", dont: "Responder de memória quando a busca voltou vazia." },
            { do: "Refazer gera uma versão nova e mantém a anterior navegável.", dont: "Substituir a resposta e perder a versão que a pessoa já leu." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
