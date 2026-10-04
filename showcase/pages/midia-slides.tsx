import { OfficeFileView, SlideBullets, SlideCanvas, SlideDeck, SlideQuote, SlideSplit, SlideStat, SlideTitle, type DeckSlide } from "@g4ai/ds";
import { CodeBlock, Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Slides e apresentações",
  group: "Mídia e conteúdo",
  order: 20,
  description: "Apresentações como código, na linguagem do DS (SlideTitle, SlideBullets, SlideSplit, SlideStat, SlideQuote em 1280×720), ou lidas de um .pptx real; as duas exibidas no SlideDeck (miniaturas, teclado, tela cheia, notas).",
};

const bars = [42, 55, 61, 58, 72, 80];
const deck: DeckSlide[] = [
  { id: "capa", title: "Capa", content: <SlideTitle kicker="Revisão trimestral · Q3 2026" title="Vendas cresceram 18 % com o mesmo time" subtitle="O que funcionou, o que travou e o plano para o Q4." footer={<><span>Diretoria Comercial</span><span>Outubro 2026</span></>} />, notes: "Abrir com o número principal. Não ler o subtítulo." },
  { id: "kpis", title: "Resultados", content: <SlideStat kicker="Resultados" title="Três números do trimestre" stats={[{ label: "Receita nova", value: "R$ 4,2 mi", delta: "+18 % vs. Q2", good: true }, { label: "Win rate", value: "27 %", delta: "+4 p.p.", good: true }, { label: "Ciclo médio", value: "41 dias", delta: "+6 dias", good: false }]} footer={<span>Fonte: CRM, 30/09/2026</span>} /> },
  {
    id: "canal",
    title: "Receita por mês",
    content: (
      <SlideSplit
        kicker="Tendência"
        title="Setembro foi o melhor mês do ano"
        left={<>A virada veio de contas médias (50–200 funcionários). <strong className="text-ink">Indicação</strong> passou a ser o maior canal.</>}
        right={
          <div className="flex h-full items-end gap-5 border-b-2 border-line pb-2">
            {bars.map((b, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-3">
                <span className="text-[18px] font-semibold tabular-nums">{b / 10}</span>
                <div className="w-full rounded-t-md" style={{ height: b * 4, background: i === bars.length - 1 ? "var(--ds-ink)" : "var(--ds-line-strong)" }} />
                <span className="text-[16px] text-muted">{["abr", "mai", "jun", "jul", "ago", "set"][i]}</span>
              </div>
            ))}
          </div>
        }
      />
    ),
  },
  { id: "travou", title: "O que travou", content: <SlideBullets kicker="Atenção" title="O ciclo ficou mais longo nas contas grandes" items={["Jurídico do cliente entra tarde: +9 dias em média", "Proposta sem caso de ROI volta para revisão 2×", "Só 1 executivo com experiência em enterprise"]} /> },
  { id: "quote", title: "Cliente", content: <SlideQuote quote="Fechamos em três semanas porque a proposta já vinha com o nosso caso de ROI." author="Mariana Couto" role="Head de Vendas, Acme Logística" /> },
  { id: "plano", title: "Plano Q4", content: <SlideBullets theme="navy" kicker="Plano Q4" title="Três apostas para o próximo trimestre" items={["Jurídico no kick-off de toda conta acima de R$ 100 mil", "Modelo de ROI obrigatório na proposta", "Contratar 1 executivo enterprise até novembro"]} footer={<><span>Revisão trimestral · Q3 2026</span><span>6</span></>} /> },
];

export default function Page() {
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <DocSection title="SlideDeck" rule="Clique no deck e use ←/→, Home/End, F para tela cheia. Notas do apresentador no botão “Notas”. No celular as miniaturas vão para baixo.">
        <Demo bare code={`const slides: DeckSlide[] = [
  { id: "capa", title: "Capa", content: <SlideTitle kicker="Q3 2026" title="Vendas cresceram 18 %" />, notes: "…" },
  { id: "kpis", title: "Resultados", content: <SlideStat title="Três números" stats={[…]} /> },
];
<SlideDeck title="Revisão trimestral Q3" slides={slides} />`}>
          <SlideDeck title="Revisão trimestral · Q3 2026" slides={deck} className="h-[640px]" />
        </Demo>
      </DocSection>

      <DocSection title="Layouts de slide" rule="Cinco layouts cobrem a maioria das apresentações de negócio. Tema light (padrão), soft (gelo) ou navy (capa, fechamento). Fio dourado marca o rótulo.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["SlideTitle", deck[0].content],
            ["SlideStat", deck[1].content],
            ["SlideSplit", deck[2].content],
            ["SlideBullets", deck[3].content],
            ["SlideQuote", deck[4].content],
            ["SlideBullets · navy", deck[5].content],
          ].map(([name, c]) => (
            <figure key={name as string} className="m-0">
              <div className="overflow-hidden rounded-lg ring-1 ring-line">
                <SlideCanvas>{c}</SlideCanvas>
              </div>
              <figcaption className="mt-2 font-mono text-[11.5px] text-muted">{name}</figcaption>
            </figure>
          ))}
        </div>
        <CodeBlock code={`import { Slide, SlideTitle, SlideBullets, SlideSplit, SlideStat, SlideQuote, SlideCanvas } from "@g4ai/ds";

// Slide livre: 1280×720, margens de 80px
<Slide theme="soft" footer={<span>Fonte: CRM</span>}>…seu conteúdo…</Slide>

// Miniatura ou embed: escala para a largura disponível
<SlideCanvas><SlideTitle title="…" /></SlideCanvas>`} />
        <PropsTable
          rows={[
            ["SlideDeck.slides", "{ id, title, content, notes? }[]", "—", "title nomeia a miniatura para leitor de tela."],
            ["SlideDeck.showNotes", "boolean", "false", "Abre com as notas visíveis."],
            ["Slide*.theme", '"light" | "soft" | "navy"', "varia", "navy para capa e fechamento."],
            ["Slide*.kicker", "ReactNode", "—", "Rótulo com fio dourado acima do título."],
            ["Slide*.footer", "ReactNode", "—", "Fonte do dado, nome do deck, número."],
          ]}
        />
      </DocSection>

      <DocSection title="De um arquivo .pptx" rule="O SlideDeck também mostra apresentações reais: posição e tamanho de cada elemento, cores, fundo, imagens, tabelas e notas do apresentador vêm do arquivo (inclusive o que o slide herda do layout e do mestre). O texto usa a fonte do DS; gráficos nativos, SmartArt, animações e vídeo ficam de fora.">
        <Demo
          bare
          code={`<OfficeFileView source={file} className="h-[640px]" />

// Ou: const file = await readOfficeFile(blob)
//     <SlideDeck title={file.presentation.title} slides={presentationSlides(file.presentation)} />`}
        >
          <OfficeFileView source="samples/revisao-trimestral.pptx" className="h-[640px]" />
        </Demo>
      </DocSection>

      <DocSection title="Regras de apresentação">
        <Rules
          items={[
            { do: "Título do slide é a conclusão (“Setembro foi o melhor mês”).", dont: "Título que é só o tema (“Receita mensal”)." },
            { do: "Um número ou uma ideia por slide; fonte do dado no rodapé.", dont: "Tabela de 12 colunas espremida num slide." },
            { do: "Até 5 bullets, cada um com no máximo uma linha.", dont: "Parágrafo inteiro no slide — vai para as notas." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
