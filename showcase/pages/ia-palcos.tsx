import { useState, type ReactNode } from "react";
import { AlarmClock, Bot, LineChart, Search } from "lucide-react";
import { Button, Chapter, CtaButton, FloatingFigure, Glass, Kicker, SiteHeader, SpeechBubble, Stage, StageSky, useBeat, type StageTone } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Palcos e movimento expressivo",
  group: "IA e interação",
  order: 61,
  description: "A camada expressiva para páginas públicas, boas-vindas e onboarding: Stage, StageSky, Glass, Chapter, Kicker, CtaButton, SiteHeader, FloatingFigure, SpeechBubble e os hooks de movimento com contrato (useBeat, useInView, everyVisible).",
  shadcn: false,
};

const tones: StageTone[] = ["dawn", "sea", "dusk", "brand"];

function Face({ children }: { children: ReactNode }) {
  return <span className="grid h-16 w-16 place-items-center rounded-3xl bg-surface text-ink shadow-overlay [&_svg]:h-7 [&_svg]:w-7">{children}</span>;
}

const LINES = ["Bom dia! O seu resumo está pronto.", "Três negócios esfriaram. Cobro os responsáveis?", "A planilha está na sua conversa."];

function BeatDemo() {
  const beat = useBeat(LINES.length, 2600);
  return (
    <Stage tone="sea" className="grid place-items-center px-4 pt-24 pb-8">
      <div className="relative flex flex-col items-center">
        <SpeechBubble key={beat} live className="absolute bottom-full mb-4">
          {LINES[beat]}
        </SpeechBubble>
        <FloatingFigure>
          <Face>
            <Bot />
          </Face>
        </FloatingFigure>
      </div>
    </Stage>
  );
}

function HeaderDemo() {
  const [floating, setFloating] = useState(false);
  return (
    <div className="grid gap-3">
      <div className="overflow-hidden rounded-xl border border-line">
        <StageSky className="pb-10">
          <SiteHeader
            floating={floating}
            brand={<span className="text-[16px] font-semibold tracking-tight">Atlas</span>}
            links={[{ label: "Na prática" }, { label: "Aprovações" }, { label: "Planos" }]}
            actions={
              <Button size="sm" shape="pill">
                Entrar
              </Button>
            }
          />
        </StageSky>
      </div>
      <div>
        <Button size="sm" variant="ghost" onClick={() => setFloating((value) => !value)}>
          {floating ? "Voltar ao topo da página" : "Simular página rolada"}
        </Button>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <DocPage title={meta.title} kicker={meta.group} description={meta.description}>
      <DocSection title="Quando usar" rule="Só fora do trabalho: página pública, boas-vindas, onboarding, estado vazio de destaque. Nunca atrás de lista, tabela, formulário ou painel. Um palco animado por dobra.">
        <Rules
          items={[
            { do: "Pôr peças reais do produto (uma aprovação, uma rotina) em Glass sobre o palco", dont: "Ilustração genérica ou print estático no lugar do produto" },
            { do: "useBeat/everyVisible para cenas com tempo: param em aba oculta", dont: "setInterval cru, que roda com a aba escondida" },
            { do: "Movimento reduzido mostra o fim da cena (useBeat still)", dont: "Cena congelada no meio de uma frase" },
            { do: "Glass solid em peças que se movem", dont: "backdrop-filter dentro de algo que anima a cada quadro" },
          ]}
        />
      </DocSection>

      <DocSection title="Stage" rule="Céu, dois morros e grão, feitos de color-mix sobre tokens: seguem o tema escuro e a marca do cliente sem código extra.">
        <Demo bare code={`<Stage tone="sea" className="px-6 py-10">\n  <Glass className="p-4">…uma peça do produto…</Glass>\n</Stage>`}>
          <div className="grid gap-3 sm:grid-cols-2">
            {tones.map((tone) => (
              <Stage key={tone} tone={tone} className="grid min-h-[180px] place-items-center p-6">
                <Glass className="flex items-center gap-3 p-3.5">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-surface">
                    <AlarmClock className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="grid text-left">
                    <span className="text-[13px] font-medium">tone=&quot;{tone}&quot;</span>
                    <span className="text-[12px] text-muted">Toda segunda, 08:00</span>
                  </span>
                </Glass>
              </Stage>
            ))}
          </div>
        </Demo>
        <PropsTable
          rows={[
            ["tone", `"dawn" | "sea" | "dusk" | "brand"`, `"dawn"`, "brand tinge pelo primary da marca ([data-brand])."],
            ["grain", "boolean", "true", "Grão sutil (SVG inline, sem requisição)."],
            ["as", "ElementType", `"div"`, "Elemento raiz (section, figure…)."],
          ]}
        />
      </DocSection>

      <DocSection title="Chapter, Kicker e CtaButton" rule="Uma ideia por capítulo: sobretítulo numerado, título de uma frase, um parágrafo e a cena ao lado. Uma CtaButton por dobra.">
        <Demo
          bare
          code={`<Chapter id="na-pratica" index="01" kicker="Na prática" title="Peça. Acompanhe. Aprove." description="…" wide>\n  <Stage tone="sea">…cena…</Stage>\n</Chapter>\n\n<CtaButton href="/entrar">Entrar com e-mail da empresa</CtaButton>\n<Button variant="quiet" shape="pill">Ver na prática</Button>`}
        >
          <div className="overflow-hidden rounded-xl border border-line bg-page">
            <Chapter index="01" kicker="Na prática" title="Peça. Acompanhe. Aprove." description="Faça uma pergunta e acompanhe o agente etapa por etapa. O que ele envia espera a sua liberação." className="py-10! lg:py-12!">
              <Stage tone="dusk" className="grid place-items-center gap-4 px-4 py-12">
                <Kicker index="G4">Colegas de trabalho com IA</Kicker>
                <div className="flex flex-wrap justify-center gap-3">
                  <CtaButton>Entrar com e-mail da empresa</CtaButton>
                  <Button variant="quiet" shape="pill">
                    Ver na prática
                  </Button>
                </div>
              </Stage>
            </Chapter>
          </div>
        </Demo>
      </DocSection>

      <DocSection title="SiteHeader" rule="No topo, sem fundo sobre o céu; com floating, recolhe numa pílula de vidro. A linha mantém 64 px: nada abaixo se move. Ligue floating com useScrolled().">
        <Demo bare code={`const { scrolled, onScroll } = useScrolled();\n\n<div className="h-dvh overflow-y-auto" onScroll={onScroll}>\n  <SiteHeader floating={scrolled} brand={<Marca />} links={secoes} actions={<Button size="sm" shape="pill">Entrar</Button>} />\n  …\n</div>`}>
          <HeaderDemo />
        </Demo>
      </DocSection>

      <DocSection title="FloatingFigure, SpeechBubble e useBeat" rule="A cena só anda com a aba visível; com movimento reduzido, mostra o último passo. A fala nova é anunciada (live).">
        <Demo bare code={`const beat = useBeat(falas.length, 2600);\n\n<SpeechBubble key={beat} live>{falas[beat]}</SpeechBubble>\n<FloatingFigure><Rosto /></FloatingFigure>`}>
          <BeatDemo />
        </Demo>
        <Demo bare title="Elenco: figuras vizinhas desencontradas (delay)" code={`<FloatingFigure delay={0}>…</FloatingFigure>\n<FloatingFigure delay={1}>…</FloatingFigure>\n<FloatingFigure delay={2}>…</FloatingFigure>`}>
          <Stage className="flex items-end justify-center gap-8 px-4 pt-10 pb-6">
            {[<LineChart key="a" />, <Bot key="b" />, <Search key="c" />].map((icon, index) => (
              <FloatingFigure key={index} delay={index as 0 | 1 | 2}>
                <Face>{icon}</Face>
              </FloatingFigure>
            ))}
          </Stage>
        </Demo>
        <PropsTable
          rows={[
            ["useBeat(count, ms, opts)", "number", "—", "Passo 0…count-1, um a cada ms com a aba visível. opts.still (movimento reduzido), opts.paused."],
            ["useInView()", "[ref, visto]", "—", "Começa a cena quando a pessoa chega nela (uma vez)."],
            ["everyVisible(fn, ms)", "() => void", "—", "setInterval que para em aba oculta; devolve a função que para."],
            ["whenIdle(fn)", "() => void", "—", "Roda quando o navegador fica ocioso (dados abaixo da dobra)."],
            ["useGlide(ref)", "void", "—", "Itens de lista ancorada no pé deslizam ao novo lugar (translate)."],
            ["useEasedWidth(ref, key)", "void", "—", "Largura de pílula muda suavemente quando o texto troca."],
            ["useScrolled(limite)", "{ scrolled, onScroll }", "24", "Se a área de rolagem passou do limite."],
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
