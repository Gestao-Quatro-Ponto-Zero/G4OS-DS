import { ArrowRight, BarChart3, Bot, Lock, Rocket, Workflow, Zap } from "lucide-react";
import { Button, FeatureGrid, HeroSection, LogoCloud, ScreenFrame, StatsBand, Testimonial, formatCurrency } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";
import { art } from "./_media-data";

export const meta: PageMeta = {
  title: "Hero e seções de landing",
  group: "IA e interação",
  order: 60,
  description: "HeroSection (centralizado, dividido, com imagem de fundo), LogoCloud/Marquee, FeatureGrid, StatsBand, Testimonial e ScreenFrame — para páginas públicas no mesmo idioma visual do produto.",
};

const logos = ["Aurora", "Vértice", "Nortesul", "Pátria", "Horizonte", "TecnoAgro", "Farmácias Sol", "Studio Norte"].map((name) => ({ name }));

export default function Page() {
  return (
    <DocPage title={meta.title} kicker={meta.group} description={meta.description}>
      <DocSection title="HeroSection · centered" rule="Selo, título de até 2 linhas, uma frase de apoio, no máximo 2 CTAs, print do produto numa ScreenFrame.">
        <Demo
          bare
          code={`<HeroSection
  badge={<><Rocket className="h-3.5 w-3.5" /> Novo: agentes de vendas</>}
  title="O CRM que trabalha enquanto você vende"
  description="Pipeline, follow-ups e previsões com IA."
  actions={<><Button>Começar grátis <ArrowRight /></Button><Button variant="ghost">Ver demonstração</Button></>}
  media={<ScreenFrame url="app.acme.com.br"><img src={print} alt="Pipeline" /></ScreenFrame>}
/>`}
        >
          <div className="overflow-hidden rounded-xl border border-line bg-page">
            <HeroSection
              badge={
                <>
                  <Rocket className="h-3.5 w-3.5" /> Novo: agentes de vendas
                </>
              }
              title="O CRM que trabalha enquanto você vende"
              description="Pipeline, follow-ups e previsões com IA, no mesmo lugar onde seu time já trabalha."
              actions={
                <>
                  <Button>
                    Começar grátis <ArrowRight />
                  </Button>
                  <Button variant="ghost">Ver demonstração</Button>
                </>
              }
              footnote="14 dias grátis · sem cartão"
              media={
                <ScreenFrame url="app.acmecrm.com.br/pipeline">
                  <img src={art(7, "Pipeline")} alt="Tela do pipeline" className="block aspect-[16/8] w-full object-cover" />
                </ScreenFrame>
              }
            />
          </div>
        </Demo>
      </DocSection>
      <DocSection title="HeroSection · image e split">
        <Demo bare title="image (fundo desfocado, texto claro)" code={`<HeroSection variant="image" image={foto} badge={…} title="…" actions={…} />`}>
          <div className="overflow-hidden rounded-xl border border-line">
            <HeroSection
              variant="image"
              image={art(0)}
              badge={
                <>
                  <Zap className="h-3.5 w-3.5" /> Encontro G4 · 2026
                </>
              }
              title="Gestão que acompanha o seu crescimento"
              description="Três dias de conteúdo prático com quem opera empresas de verdade."
              actions={
                <>
                  <button type="button" className="inline-flex h-10 items-center rounded-lg bg-white px-4 text-[13.5px] font-medium text-navy">
                    Garantir vaga
                  </button>
                  <button type="button" className="inline-flex h-10 items-center rounded-lg px-4 text-[13.5px] font-medium text-white ring-1 ring-white/30 hover:bg-white/10">
                    Programação
                  </button>
                </>
              }
            />
          </div>
        </Demo>
        <Demo bare title="split" code={`<HeroSection variant="split" title="…" media={<ScreenFrame>…</ScreenFrame>} />`}>
          <div className="overflow-hidden rounded-xl border border-line bg-page">
            <HeroSection
              variant="split"
              badge={<>Nexo ERP</>}
              title="Nota fiscal em 30 segundos"
              description="Emissão, estoque e financeiro conectados, com a regra fiscal certa para cada estado."
              actions={<Button>Testar agora</Button>}
              media={
                <ScreenFrame>
                  <img src={art(2, "NF-e")} alt="Tela de nota fiscal" className="block aspect-[4/3] w-full object-cover" />
                </ScreenFrame>
              }
            />
          </div>
        </Demo>
        <PropsTable
          rows={[
            ["variant", '"centered" | "split" | "image"', '"centered"', "Composição."],
            ["badge · title · description", "ReactNode", "—", "Título curto e concreto."],
            ["actions · footnote", "ReactNode", "—", "No máximo 2 CTAs."],
            ["media · image", "ReactNode · string", "—", "Print (ScreenFrame) ou imagem de fundo."],
          ]}
        />
      </DocSection>
      <DocSection title="Logos, números, recursos e depoimentos">
        <Demo bare code={`<LogoCloud title="Empresas que já usam" logos={[{ name: "Aurora" }, …]} scrolling />`}>
          <div className="rounded-xl border border-line bg-surface py-8">
            <LogoCloud title="Mais de 2.000 empresas operam com a G4" logos={logos} scrolling />
          </div>
        </Demo>
        <Demo bare code={`<StatsBand stats={[{ value: 2140, label: "Empresas" }, { value: 4.2e9, label: "Transacionado", format: … }]} />`}>
          <StatsBand
            className="!px-0"
            stats={[
              { value: 2140, label: "Empresas ativas" },
              { value: 4200000000, label: "Faturado pelos clientes", format: (n) => formatCurrency(n, { compact: true }) },
              { value: 98, label: "Satisfação", suffix: "%" },
              { value: 38, label: "Horas economizadas por mês" },
            ]}
          />
        </Demo>
        <Demo bare code={`<FeatureGrid kicker="Por que" title="…" items={[{ icon, title, description }]} />`}>
          <FeatureGrid
            className="!px-0"
            kicker="Por que a G4"
            title="Tudo o que a operação precisa"
            items={[
              { icon: <Workflow />, title: "Processos prontos", description: "Fluxos de venda, compra e contratação configurados com as melhores práticas." },
              { icon: <Bot />, title: "Agentes de IA", description: "Follow-ups, conciliação e triagem feitos por agentes que mostram o que fizeram." },
              { icon: <BarChart3 />, title: "Números confiáveis", description: "Um só lugar para receita, caixa e metas, atualizado em tempo real." },
              { icon: <Lock />, title: "Seguro por padrão", description: "LGPD, SSO e trilha de auditoria em todos os planos." },
            ]}
            cols={4}
          />
        </Demo>
        <div className="grid gap-4 md:grid-cols-2">
          <Testimonial quote="Fechamos o trimestre com 18 % a mais de receita e o mesmo time. O pipeline finalmente reflete a realidade." name="Renata Farias" role="Diretora de Operações · Grupo Aurora" avatar={art(3)} />
          <Testimonial quote="A emissão de notas que levava uma tarde agora leva minutos, e o fiscal parou de voltar notas." name="Paulo Menezes" role="Controller · Vértice Logística" />
        </div>
        <Testimonial variant="large" quote="É o primeiro sistema que o time comercial abre sem alguém pedir." name="Ana Lopes" role="Head de Vendas · Pátria Seguros" avatar={art(4)} />
      </DocSection>
      <DocSection title="Regras">
        <Rules items={[{ do: "Mesma fonte, cores e raios do produto: a landing é a primeira tela do app.", dont: "Gradientes neon, glassmorphism pesado e fontes de outra família." }, { do: "Números com fonte e data.", dont: "“+10.000 clientes felizes” sem base." }]} />
      </DocSection>
    </DocPage>
  );
}
