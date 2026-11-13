import { useState } from "react";
import { IntroCard, ProductMark, onboardingScenes, type IntroStep } from "@g4ai/ds";
import { org } from "./data/workspace";
import { frameHref, go, useFrameParam } from "./shells/frame-route";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Boas-vindas ilustradas",
  description: "Primeira execução em 4 etapas num cartão compacto: a ilustração em traço muda de cena (pasta → arquivos → equipe → selo) a cada etapa, com Voltar/Avançar, Pular e ←/→.",
  category: "Onboarding",
  order: 0.5,
  height: 760,
  concept: {
    goal: "Apresentar a ideia do produto em quatro frases antes do primeiro uso, sem pedir nenhum dado: quem acabou de entrar entende o que vem e pode pular.",
    patterns: [
      "Anatomia H · Fluxo focado: só o cartão, centrado sobre bg-page, como diálogo (camada expressiva permitida no onboarding, regra 22a)",
      "IntroCard: ilustração em traço (MorphIllustration + onboardingScenes) no topo em gelo, 'Etapa 1 de 4', título, texto",
      "Pontos de etapa + Voltar/Avançar; a última vira 'Começar'; 'Pular' sempre à vista até a última",
      "←/→ trocam de etapa; o texto da etapa é anunciado (aria-live); movimento reduzido troca a cena direto",
      "Sem os cinco estados: o conteúdo é fixo e local (nada carrega, nada fica vazio, nada falha); o que pede dado vem depois, no assistente",
    ],
    adapt: [
      "Novidade grande de uma versão (3 etapas), boas-vindas de um módulo novo, primeira vez num portal do cliente",
      "Troque as cenas por `frame` em cada etapa (caminhos SVG em traço, viewBox 200 × 140)",
    ],
    avoid: [
      "Mais de 4 etapas ou etapas que pedem dados (use o Assistente de configuração)",
      "Abrir sozinho a cada visita: mostre uma vez e deixe 'Rever introdução' na ajuda",
      "Ilustração atrás de lista, tabela ou formulário",
    ],
  },
} as const;

/* ------------------------------------------------------------------ */
/* Dados de exemplo                                                    */
/* ------------------------------------------------------------------ */

const steps: IntroStep[] = [
  {
    title: "Crie seu primeiro espaço",
    description: `Cada área do trabalho ganha um lugar próprio no ${org.product}. Comece pelo Comercial e crie outros espaços quando precisar.`,
    frame: onboardingScenes[0],
  },
  {
    title: "Traga seus arquivos",
    description: "Importe as planilhas e os contratos que você já usa. Cada arquivo vai para o espaço certo, com histórico de quem mudou o quê.",
    frame: onboardingScenes[1],
  },
  {
    title: "Convide a equipe",
    description: "Quem trabalha junto vê o mesmo quadro. Você decide quem edita e quem só acompanha.",
    frame: onboardingScenes[2],
  },
  {
    title: "Tudo pronto",
    description: "Seu espaço está pronto para o primeiro registro. Deixamos uma lista de primeiros passos na página inicial.",
    frame: onboardingScenes[3],
  },
];

/* ------------------------------------------------------------------ */
/* Tela                                                                */
/* ------------------------------------------------------------------ */

export default function OnboardingIntro() {
  // ?etapa=2 abre direto numa etapa (útil para revisar a cena e o texto).
  const start = Math.max(0, Math.min(steps.length - 1, Number(useFrameParam("etapa", "1")) - 1 || 0));
  const [index, setIndex] = useState(start);

  return (
    <div className="flex h-dvh flex-col overflow-y-auto bg-page">
      <header className="flex h-14 shrink-0 items-center gap-2.5 px-4 sm:px-6">
        <ProductMark size={26} />
        <span className="text-[14px] font-semibold tracking-tight">{org.product}</span>
        <span className="ml-1 hidden text-[12.5px] text-muted sm:inline">{org.name}</span>
      </header>
      <main className="grid flex-1 place-items-center px-4 pb-14 pt-4">
        <div role="dialog" aria-modal="true" aria-label={`Boas-vindas ao ${org.product}`} className="w-full max-w-[440px]">
          <IntroCard
            steps={steps}
            index={index}
            onIndexChange={setIndex}
            autoFocus
            onSkip={() => go("onboarding-checklist")}
            onFinish={() => go("onboarding-checklist", { bemvindo: 1 })}
          />
          <p className="m-0 mt-4 text-center text-[12px] text-muted">
            Prefere configurar tudo agora?{" "}
            <a href={frameHref("onboarding-wizard")} className="font-medium text-ink-soft underline-offset-2 hover:text-ink hover:underline">
              Abrir o assistente de configuração
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
