import { useState } from "react";
import { IntroCard, MorphIllustration, SegmentedControl, notify, onboardingScenes, type IntroCardStep } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Ilustração de onboarding",
  group: "Feedback e estados",
  order: 60,
  description: "Ilustração em traço que muda de cena a cada etapa (MorphIllustration) e o cartão compacto de primeira execução (IntroCard). Camada expressiva: só em onboarding, boas-vindas e estado vazio de destaque.",
};

const steps: IntroCardStep[] = [
  { title: "Crie seu primeiro espaço", description: "Cada área do trabalho ganha um lugar próprio. Comece pelo Comercial e crie outros quando precisar." },
  { title: "Traga seus arquivos", description: "Importe as planilhas e os contratos que você já usa; cada arquivo vai para o espaço certo." },
  { title: "Convide a equipe", description: "Quem trabalha junto vê o mesmo quadro. Você decide quem edita e quem só acompanha." },
  { title: "Tudo pronto", description: "Deixamos uma lista de primeiros passos na página inicial." },
];

const sceneNames = ["Pasta", "Arquivos", "Equipe", "Selo"] as const;

export default function Page() {
  const [scene, setScene] = useState<(typeof sceneNames)[number]>("Pasta");
  const [shape, setShape] = useState<"a" | "b">("a");
  return (
    <DocPage title={meta.title} kicker="Feedback e estados" description={meta.description}>
      <DocSection title="Cartão de primeira execução" rule="Veja o bloco “Boas-vindas ilustradas” (Onboarding) para a tela inteira. ←/→ trocam de etapa; o texto da etapa é anunciado; com movimento reduzido a cena troca direto.">
        <Demo
          code={`<IntroCard
  steps={[{ title: "Crie seu primeiro espaço", description: "…" }, …]}  // a etapa i usa onboardingScenes[i]
  onSkip={() => fecharIntro()}
  onFinish={() => router.push("/inicio")}
/>`}
        >
          <div className="grid w-full place-items-center rounded-xl bg-page px-4 py-8">
            <IntroCard steps={steps} onSkip={() => notify("Introdução pulada", undefined, "info")} onFinish={() => notify("Introdução concluída")} />
          </div>
        </Demo>
        <PropsTable
          rows={[
            ["steps", "{ title, description, frame? }[]", "—", "3 ou 4 etapas; sem frame, usa onboardingScenes na ordem"],
            ["index / onIndexChange", "number / (i) => void", "—", "Controlado (opcional); defaultIndex no modo livre"],
            ["onFinish / finishLabel", "() => void / string", '"Começar"', "Ação da última etapa"],
            ["onSkip / skipLabel", "() => void / string", '"Pular"', "Sem onSkip, o “Pular” some"],
            ["illustration", "(index) => ReactNode", "—", "Troca a ilustração padrão (ex.: imagem do produto)"],
            ["autoFocus", "boolean", "false", "Foca o cartão ao abrir como diálogo (←/→ funcionam de imediato)"],
          ]}
        />
      </DocSection>
      <DocSection title="Ilustração em traço" rule="`MorphIllustration` recebe quadros `{ label, paths }` (viewBox 200 × 140) e troca de quadro quando `index` muda: cada traço entra com leve deslocamento e escala. A cor é `currentColor`; `{ d, tone: 'soft' }` dá um preenchimento gelo translúcido e `tone: 'accent'` destaca um traço.">
        <Demo
          code={`<div className="text-ink-soft">
  <MorphIllustration frames={onboardingScenes} index={i} />
</div>`}
        >
          <div className="flex w-full flex-col items-center gap-4 rounded-xl bg-soft px-4 py-6">
            <div className="w-full max-w-[260px] text-ink-soft">
              <MorphIllustration frames={onboardingScenes} index={sceneNames.indexOf(scene)} />
            </div>
            <SegmentedControl label="Cena" value={scene} onChange={setScene} options={sceneNames.map((n) => ({ value: n, label: n }))} />
          </div>
        </Demo>
        <Demo
          title="Morph"
          description="Quando todos os quadros têm caminhos com a mesma estrutura (mesmos comandos, mesma quantidade de números), os traços se transformam em vez de trocar."
          code={`const frames = [
  { label: "Caixa fechada", paths: ["M60 60 L100 40 L140 60 L100 80 Z", "M60 60 V100 L100 120 L140 100 V60"] },
  { label: "Caixa aberta", paths: ["M60 50 L100 20 L140 50 L100 70 Z", "M60 60 V100 L100 120 L140 100 V60"] },
];
<MorphIllustration frames={frames} index={aberta ? 1 : 0} />`}
        >
          <div className="flex w-full flex-col items-center gap-4 rounded-xl bg-soft px-4 py-6">
            <div className="w-full max-w-[220px] text-ink-soft">
              <MorphIllustration
                index={shape === "a" ? 0 : 1}
                frames={[
                  { label: "Caixa fechada", paths: [{ d: "M60 60 L100 40 L140 60 L100 80 Z", tone: "soft" }, "M60 60 V100 L100 120 L140 100 V60", "M100 80 V120"] },
                  { label: "Caixa aberta", paths: [{ d: "M56 46 L96 22 L136 40 L100 62 Z", tone: "soft" }, "M60 60 V100 L100 120 L140 100 V60", "M100 80 V120"] },
                ]}
              />
            </div>
            <SegmentedControl
              label="Estado da caixa"
              value={shape}
              onChange={setShape}
              options={[
                { value: "a", label: "Fechada" },
                { value: "b", label: "Aberta" },
              ]}
            />
          </div>
        </Demo>
        <PropsTable
          rows={[
            ["frames", "{ label, paths: (string | { d, tone? })[] }[]", "—", "label vira o nome acessível (role=img)"],
            ["index", "number", "—", "Quadro visível"],
            ["strokeWidth", "number", "2", "Traço constante em qualquer tamanho"],
            ["onboardingScenes", "IllustrationFrame[]", "—", "Pasta, arquivos, equipe e selo, prontos"],
          ]}
        />
      </DocSection>
      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Usar em primeira execução, boas-vindas de módulo e estado vazio de destaque.", dont: "Ilustração atrás de lista, tabela, formulário ou painel." },
            { do: "3 ou 4 etapas, uma frase cada, com “Pular” à vista.", dont: "Etapas que pedem dados (use o assistente de configuração)." },
            { do: "Traço na cor do texto e gelo translúcido: funciona nos dois temas e em qualquer marca.", dont: "Preenchimentos chapados fortes ou cores fixas no SVG." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
