import { useRef, useState, type ReactNode } from "react";
import { AlarmClock, Bot, Check, Hand, LineChart, Search, X } from "lucide-react";

import {
  Button,
  Chapter,
  CtaButton,
  FloatingFigure,
  Glass,
  Kicker,
  ProductMark,
  SiteHeader,
  SpeechBubble,
  Stage,
  StageSky,
  chapterTitleClass,
  cn,
  formatCurrency,
  useBeat,
  useGlide,
  useInView,
  useOutgoing,
  useScrolled,
} from "@g4ai/ds";
import { org } from "./data/workspace";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Landing com palcos",
  description: "Página pública na camada expressiva: cabeçalho que vira pílula, céu no hero com agentes que conversam, capítulos com o produto real em palcos de tokens, uma demonstração que a pessoa conduz e a chamada final.",
  category: "Marketing",
  order: 3,
  height: 1200,
  concept: {
    goal: "Mostrar o produto trabalhando, em cena, e levar a pessoa a entrar: cada capítulo é uma ideia com uma peça real para tocar.",
    patterns: [
      "Anatomia I · Público: a página rola, o SiteHeader fica e vira pílula de vidro ao rolar (useScrolled)",
      "StageSky no hero; Chapter com Kicker numerado e um Stage por capítulo, alternando o lado (flip)",
      "Peças reais do produto em Glass sobre o palco; a aprovação responde ao toque",
      "Cenas com useBeat (só com a aba visível), começam quando vistas (useInView); movimento reduzido mostra o fim da cena",
      "Uma CtaButton por dobra; a secundária é Button quiet em pílula",
    ],
    adapt: [
      "Página de produto, de módulo, de evento ou de parceiro: troque o elenco e as falas",
      "Boas-vindas de um app (primeiro acesso): um Stage com o primeiro passo, sem o cabeçalho de site",
    ],
    avoid: [
      "Palco atrás de dados de trabalho (lista, tabela, formulário)",
      "Mais de uma cena se movendo na mesma dobra",
      "Vidro (backdrop-filter) dentro de algo que anima a cada quadro: use Glass solid",
      "Ilustração genérica no lugar de uma peça real do produto",
    ],
  },
} as const;

/* ------------------------------------------------------------------ */
/* Dados de exemplo                                                    */
/* ------------------------------------------------------------------ */

const SECTIONS = [
  { id: "na-pratica", label: "Na prática" },
  { id: "aprovacoes", label: "Aprovações" },
  { id: "planos", label: "Planos" },
];

const CAST = [
  { id: "vendas", name: "Vendas", icon: <LineChart />, side: "left" as const },
  { id: "chefe", name: "Chefe de gabinete", icon: <Bot />, side: "center" as const },
  { id: "pesquisa", name: "Pesquisa", icon: <Search />, side: "right" as const },
];

/** Uma manhã com os agentes: uma fala por vez, de um dos três. */
const LINES = [
  { who: 1, text: "Bom dia! O seu resumo está pronto." },
  { who: 0, text: "Três negócios esfriaram. Cobro os responsáveis?" },
  { who: 2, text: "Lendo os preços dos concorrentes…" },
  { who: 0, text: "Postei o resumo no #comercial." },
  { who: 2, text: "A planilha está na sua conversa." },
];

/** O que o agente faz, passo a passo, quando a pessoa chega ao capítulo. */
const STEPS = [
  "Li 42 negócios abertos no pipeline",
  "Achei 3 sem contato há mais de 14 dias",
  `Somei ${formatCurrency(184000)} em risco`,
  "Rascunhei um lembrete para cada responsável",
];

/* ------------------------------------------------------------------ */
/* Peças                                                               */
/* ------------------------------------------------------------------ */

/** Rosto de um agente: um ícone numa peça clara. No celular os três têm a mesma altura, para o balão de quem fala nunca cobrir um vizinho. */
function Face({ icon, large }: { icon: ReactNode; large?: boolean }) {
  return (
    <span className={cn("grid place-items-center rounded-3xl bg-surface text-ink shadow-overlay", large ? "h-14 w-14 sm:h-28 sm:w-28 [&_svg]:h-6 sm:[&_svg]:h-10 [&_svg]:w-6 sm:[&_svg]:w-10" : "h-14 w-14 sm:h-20 sm:w-20 [&_svg]:h-6 sm:[&_svg]:h-7 [&_svg]:w-6 sm:[&_svg]:w-7")}>
      {icon}
    </span>
  );
}

/** O elenco do hero: cada um fala na sua vez, e o balão anterior sai enquanto o novo chega. */
function Cast() {
  const beat = useBeat(LINES.length, 3200, { still: 0 });
  const line = LINES[beat]!;
  const [leaving, left] = useOutgoing(beat);
  return (
    <div className="flex items-end justify-center gap-3 pt-24 sm:gap-8">
      {CAST.map((member, index) => (
        <div key={member.id} className="ds-rise relative flex flex-col items-center" data-delay={index}>
          {leaving && LINES[leaving.value]!.who === index && (
            <SpeechBubble key={`out-${leaving.value}`} side={member.side} leaving className={bubblePlace[member.side]} onAnimationEnd={left}>
              {LINES[leaving.value]!.text}
            </SpeechBubble>
          )}
          {line.who === index && (
            <SpeechBubble key={beat} side={member.side} live className={bubblePlace[member.side]}>
              {line.text}
            </SpeechBubble>
          )}
          <FloatingFigure delay={index as 0 | 1 | 2}>
            <Face icon={member.icon} large={index === 1} />
          </FloatingFigure>
          <span className="mt-3 max-w-[96px] text-center text-[12px] leading-tight text-muted sm:max-w-none sm:text-[13px]">{member.name}</span>
        </div>
      ))}
    </div>
  );
}
// Nos cantos, o balão abre para dentro da tela: no celular, nunca passa da borda.
const bubblePlace = {
  left: "absolute bottom-full left-0 mb-5 max-w-[180px] sm:max-w-[240px]",
  center: "absolute bottom-full left-1/2 mb-5 -translate-x-1/2 max-w-[200px] sm:max-w-[240px]",
  right: "absolute bottom-full right-0 mb-5 max-w-[180px] sm:max-w-[240px]",
};

/** Uma aprovação real: a pessoa libera ou recusa, e o cartão responde no lugar. `pulse`: o anel que pede o toque (um por tela). */
function ApprovalPiece({ className, pulse }: { className?: string; pulse?: boolean }) {
  const [decision, setDecision] = useState<"done" | "refused">();
  return (
    <Glass className={cn("grid w-full max-w-[300px] gap-3 p-3.5 text-left", className)}>
      <p className="m-0 flex items-center gap-2 text-[13px] font-semibold">
        <Hand className="h-4 w-4 text-amber" aria-hidden /> Aprovação: postar no #comercial
      </p>
      {decision ? (
        <p className={cn("enter m-0 flex min-h-9 items-center gap-1.5 text-[13px]", decision === "done" ? "text-ok" : "text-muted")} aria-live="polite">
          {decision === "done" ? <Check className="h-4 w-4" aria-hidden /> : <X className="h-4 w-4" aria-hidden />}
          {decision === "done" ? "Liberado por você" : "Recusado por você"}
        </p>
      ) : (
        <div className="flex gap-2">
          <Button size="sm" shape="pill" className={pulse ? "ds-pulse" : undefined} onClick={() => setDecision("done")}>
            Liberar
          </Button>
          <Button size="sm" variant="ghost" shape="pill" onClick={() => setDecision("refused")}>
            Recusar
          </Button>
        </div>
      )}
    </Glass>
  );
}

/** O agente trabalhando: os passos chegam um a um quando a pessoa alcança a cena, e os de cima deslizam. */
function WorkScene() {
  const [ref, seen] = useInView<HTMLDivElement>();
  const beat = useBeat(STEPS.length + 2, 1400, { still: STEPS.length + 1, paused: !seen });
  const done = Math.min(beat, STEPS.length);
  const list = useRef<HTMLOListElement>(null);
  useGlide(list);
  return (
    <div ref={ref} className="mx-auto grid max-w-[460px] gap-3">
      <Glass className="px-4 py-3 text-[14px]">
        <span className="text-muted">Você · </span>Quais negócios estão esfriando?
      </Glass>
      <Glass className="grid gap-2 p-4">
        <span className="flex items-center gap-2 text-[13px] font-medium">
          <LineChart className="h-4 w-4" aria-hidden /> Agente de vendas
        </span>
        <ol ref={list} className="m-0 grid list-none gap-1.5 p-0" aria-live="polite">
          {STEPS.slice(0, done).map((step) => (
            <li key={step} className="enter flex items-center gap-2 text-[13.5px] text-ink-soft">
              <Check className="h-4 w-4 shrink-0 text-ok" aria-hidden /> {step}
            </li>
          ))}
        </ol>
        {done < STEPS.length && <span className="text-[13px] text-muted">Trabalhando…</span>}
      </Glass>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

export default function MarketingStage() {
  const { scrolled, onScroll } = useScrolled();
  const show = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  return (
    <div className="h-dvh overflow-y-auto bg-page text-ink" onScroll={onScroll}>
      <SiteHeader
        floating={scrolled}
        brand={
          <>
            <ProductMark size={26} />
            <span className="text-[16px] font-semibold tracking-tight">{org.product}</span>
          </>
        }
        links={SECTIONS.map((section) => ({ label: section.label, onSelect: () => show(section.id) }))}
        actions={
          <Button size="sm" shape="pill">
            Entrar
          </Button>
        }
      />
      <main>
        <StageSky className="-mt-16 pt-16">
          <div className="mx-auto flex max-w-[1360px] flex-col items-center px-5 pt-12 pb-10 text-center sm:pt-20 lg:pb-16">
            <Kicker index={org.product}>Agentes de vendas</Kicker>
            <h1 className="m-0 mt-5 max-w-[920px] text-balance text-[38px] font-medium leading-[1.02] tracking-[-0.035em] sm:text-[72px] sm:leading-none">
              O pipeline que anda enquanto você vende.
            </h1>
            <p className="m-0 mt-6 max-w-[620px] text-pretty text-[16px] leading-relaxed text-ink-soft sm:text-[18px]">
              Agentes que leem o CRM, cobram os responsáveis e pedem a sua liberação antes de enviar qualquer coisa.
            </p>
            <div className="enter mt-7 flex flex-wrap items-center justify-center gap-3">
              <CtaButton>Começar com o e-mail da empresa</CtaButton>
              <Button variant="quiet" shape="pill" onClick={() => show("na-pratica")}>
                Ver na prática
              </Button>
            </div>
            <div className="relative mt-4 grid w-full max-w-[1100px] justify-items-center gap-3 lg:block">
              <Cast />
              <Glass className="ds-rise flex w-full max-w-[300px] items-center gap-3 p-3.5 text-left lg:absolute lg:bottom-20 lg:left-0 lg:w-[260px]" data-delay="3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-surface">
                  <AlarmClock className="h-4 w-4" aria-hidden />
                </span>
                <span className="grid">
                  <span className="text-[13px] font-medium">Rotina · Resumo do pipeline</span>
                  <span className="text-[12px] text-muted">Toda segunda, 08:00</span>
                </span>
              </Glass>
              <ApprovalPiece className="ds-rise lg:absolute lg:right-0 lg:bottom-20 lg:w-[260px]" />
            </div>
          </div>
        </StageSky>

        <Chapter
          id="na-pratica"
          index="01"
          kicker="Na prática"
          title="Peça. Acompanhe. Aprove."
          description="Faça uma pergunta e acompanhe o agente etapa por etapa. O que ele lê fica com você; o que ele envia espera a sua liberação."
          wide
        >
          <Stage tone="sea" className="px-4 py-8 sm:px-8 sm:py-12">
            <WorkScene />
          </Stage>
        </Chapter>

        <Chapter
          id="aprovacoes"
          index="02"
          kicker="Aprovações"
          title="Nada sai sem você."
          description="Escrever e enviar seguem a regra que você escolher. Toque em Liberar para ver o agente seguir."
          flip
        >
          <Stage tone="dusk" className="grid place-items-center px-4 py-14">
            <ApprovalPiece pulse />
          </Stage>
        </Chapter>

        <section id="planos" className="scroll-mt-20 px-4 pb-6 sm:px-8">
          <Stage className="mx-auto flex max-w-[1200px] flex-col items-center gap-6 px-6 pt-16 pb-12 text-center">
            <Kicker index="03">Planos</Kicker>
            <h2 className={chapterTitleClass}>Seu novo time está esperando.</h2>
            <CtaButton>Começar agora</CtaButton>
            <div className="mt-8 flex items-end justify-center gap-6 sm:gap-10">
              {CAST.map((member, index) => (
                <FloatingFigure key={member.id} delay={index as 0 | 1 | 2}>
                  <Face icon={member.icon} />
                </FloatingFigure>
              ))}
            </div>
          </Stage>
        </section>
      </main>
      <footer className="mx-auto mt-6 flex max-w-[1200px] items-center justify-between gap-2 px-4 py-8 text-[13px] text-muted sm:px-8">
        <span className="flex items-center gap-2 font-medium text-ink">
          <ProductMark size={20} /> {org.product}
        </span>
        <span>© 2026 {org.name}</span>
      </footer>
    </div>
  );
}
