import { Download, Share2 } from "lucide-react";
import {
  Button,
  PageHeading,
  SlideBullets,
  SlideDeck,
  SlideQuote,
  SlideSplit,
  SlideStat,
  SlideTitle,
  notify,
  type DeckSlide } from "@g4ai/ds";
import { AtlasShell, atlasRoutes } from "./shells/atlas-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Apresentação (QBR)",
  description: "Revisão trimestral de negócio montada com os layouts de slide do DS: capa, números, tendência, riscos, cliente e plano. Miniaturas, teclado, tela cheia e notas.",
  category: "Aplicação",
  order: 4,
  height: 820,
  concept: {
    goal: "Apresentar uma revisão de negócio (QBR) direto do app, com slides montados nos layouts do DS.",
    patterns: [
      "Anatomia G · App de altura total: palco 16:9, miniaturas, notas",
      "Teclado (← →, F para tela cheia) e progresso",
      "Layouts de slide do DS: capa, números, tendência, citação",
    ],
    adapt: [
      "Relatório mensal ao cliente, board meeting, onboarding de time",
    ],
    avoid: [
      "Slides com cores e fontes fora dos tokens",
    ],
  },
} as const;

/* ------------------------------------------------------------------ */
/* Dados de exemplo                                                    */
/* ------------------------------------------------------------------ */

const receitaMensal = [
  { mes: "abr", valor: 1.1 },
  { mes: "mai", valor: 1.24 },
  { mes: "jun", valor: 1.31 },
  { mes: "jul", valor: 1.28 },
  { mes: "ago", valor: 1.42 },
  { mes: "set", valor: 1.5 },
];
const max = Math.max(...receitaMensal.map((r) => r.valor));
const rodape = (n: number) => (
  <>
    <span>Revisão trimestral · Q3 2026 · Confidencial</span>
    <span className="tabular-nums">{n}</span>
  </>
);

const slides: DeckSlide[] = [
  {
    id: "capa",
    title: "Capa",
    content: <SlideTitle kicker="Revisão trimestral · Q3 2026" title="Crescemos 18 % com o mesmo time" subtitle="Resultados de julho a setembro, o que travou e as três apostas do Q4." footer={<><span>Diretoria Comercial · Atlas</span><span>07/10/2026</span></>} />,
    notes: "Abrir com o número principal e a pergunta do Q4: como manter o ritmo sem aumentar o time comercial.",
  },
  {
    id: "numeros",
    title: "Resultados",
    content: (
      <SlideStat
        kicker="Resultados"
        title="Três números resumem o trimestre"
        stats={[
          { label: "Receita nova", value: "R$ 4,2 mi", delta: "+18 % vs. Q2", good: true },
          { label: "Taxa de conversão", value: "27 %", delta: "+4 p.p. vs. Q2", good: true },
          { label: "Ciclo médio de venda", value: "41 dias", delta: "+6 dias vs. Q2", good: false },
        ]}
        footer={rodape(2)}
      />
    ),
    notes: "O ciclo mais longo é o único número ruim, e é o assunto do slide 4.",
  },
  {
    id: "tendencia",
    title: "Receita por mês",
    content: (
      <SlideSplit
        kicker="Tendência"
        title="Setembro foi o melhor mês do ano"
        left={
          <>
            <p className="m-0">A virada veio das contas médias (50 a 200 funcionários), que fecharam 2× mais rápido que as grandes.</p>
            <p className="m-0 mt-5"><strong className="text-ink">Indicação</strong> virou o maior canal: 38 % da receita nova.</p>
          </>
        }
        right={
          <div className="flex h-full items-end gap-5 border-b-2 border-line pb-3">
            {receitaMensal.map((r, i) => (
              <div key={r.mes} className="flex flex-1 flex-col items-center gap-3">
                <span className="text-[18px] font-semibold tabular-nums">{r.valor.toLocaleString("pt-BR")}</span>
                <div className="w-full rounded-t-md" style={{ height: (r.valor / max) * 300, background: i === receitaMensal.length - 1 ? "var(--ds-ink)" : "var(--ds-line-strong)" }} />
                <span className="text-[16px] text-muted">{r.mes}</span>
              </div>
            ))}
          </div>
        }
        footer={<><span>Receita nova em R$ milhões · Fonte: CRM</span><span>3</span></>}
      />
    ),
  },
  {
    id: "riscos",
    title: "O que travou",
    content: <SlideBullets kicker="Atenção" title="O ciclo ficou mais longo nas contas grandes" items={["Jurídico do cliente entra tarde: +9 dias em média", "Proposta sem caso de ROI volta para revisão 2 vezes", "Só um executivo com experiência em vendas enterprise"]} footer={rodape(4)} />,
    notes: "Não é problema de volume de leads: é de processo nas contas acima de R$ 100 mil.",
  },
  {
    id: "cliente",
    title: "Voz do cliente",
    content: <SlideQuote quote="Fechamos em três semanas porque a proposta já chegou com o nosso caso de ROI pronto." author="Mariana Couto" role="Head de Vendas, Acme Logística" footer={rodape(5)} />,
  },
  {
    id: "plano",
    title: "Plano Q4",
    content: <SlideBullets theme="navy" kicker="Plano Q4" title="Três apostas para o próximo trimestre" items={["Jurídico no kick-off de toda conta acima de R$ 100 mil", "Modelo de ROI obrigatório em toda proposta", "Contratar um executivo enterprise até novembro"]} footer={rodape(6)} />,
    notes: "Pedir aprovação da vaga enterprise nesta reunião.",
  },
];

/* ------------------------------------------------------------------ */

export default function PresentationBlock() {
  return (
    <AtlasShell current={atlasRoutes.presentations}>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pb-5 pt-6 sm:px-7 lg:px-10" data-ds-content="">
        <PageHeading
          sticky={false}
          crumbs={[{ label: "Apresentações", href: atlasRoutes.presentations }]}
          title="Revisão trimestral · Q3 2026"
          description="Editada por Joana Ribeiro há 2 horas · 6 slides"
          actions={
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  void navigator.clipboard?.writeText(location.href).catch(() => undefined);
                  notify("Link da apresentação copiado");
                }}
              >
                <Share2 /> Compartilhar
              </Button>
              <Button size="sm" onClick={() => window.print()}>
                <Download /> Baixar PDF
              </Button>
            </>
          }
        />
        <SlideDeck title="Revisão trimestral · Q3 2026" slides={slides} className="min-h-[560px] flex-1" />
      </div>
    </AtlasShell>
  );
}
