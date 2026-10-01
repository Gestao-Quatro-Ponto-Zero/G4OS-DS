import { ArrowRight, BarChart3, Bot, Check, Lock, Rocket, Workflow } from "lucide-react";

import {
  AreaChart,
  Button,
  FeatureGrid,
  HeroSection,
  ImageSphere,
  KpiCard,
  KpiGrid,
  LogoCloud,
  ScreenFrame,
  StatsBand,
  Testimonial,
  cn,
  formatCompact,
  formatCurrency,
} from "@g4ai/ds";
import { plans } from "./data/plans";
import { authRoutes } from "./shells/auth-shell";
import { SiteShell } from "./shells/site-shell";
import { frameHref } from "./shells/frame-route";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Landing de produto",
  description: "Página pública completa: navegação, hero com o produto real na moldura, logos em movimento, recursos, esfera de clientes, números, depoimentos, planos e chamada final.",
  category: "Marketing",
  order: 1,
  height: 1100,
  concept: {
    goal: "Apresentar o produto e levar a pessoa ao cadastro com prova real (o produto na moldura).",
    patterns: [
      "Anatomia I · Público: rolagem do documento, cabeçalho do site fixo",
      "Hero com o produto real; logos; recursos; números; depoimentos",
      "CTAs levam a cadastro, preços ou vendas",
    ],
    adapt: [
      "Página de módulo, de evento, de parceiro",
    ],
    avoid: [
      "Ilustrações genéricas no lugar do produto real",
    ],
  },
} as const;

/* ------------------------------------------------------------------ */
/* Dados de exemplo                                                    */
/* ------------------------------------------------------------------ */

const logos = ["Aurora", "Vértice", "Nortesul", "Pátria", "Horizonte", "TecnoAgro", "Farmácias Sol", "Studio Norte", "Clínica Viva"].map((name) => ({ name }));

// Imagens geradas em SVG (troque por fotos reais de clientes).
const palette = [
  ["#031a26", "#184560"],
  ["#842e20", "#b9915b"],
  ["#184560", "#5f7f6f"],
  ["#202124", "#484a50"],
  ["#5f7f6f", "#1b5e20"],
  ["#b9915b", "#842e20"],
];
const initialsOf = ["AU", "VL", "NS", "PS", "RH", "TA", "FS", "SN", "CV", "MB", "GV", "IL"];
// ds-audit-ignore-start hex-color: foto fictícia gerada como SVG (dado, não UI)
const photo = (i: number) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${palette[i % 6][0]}"/><stop offset="1" stop-color="${palette[i % 6][1]}"/></linearGradient></defs><rect width="120" height="120" fill="url(#g)"/><text x="60" y="72" text-anchor="middle" font-family="Figtree,system-ui,sans-serif" font-size="34" font-weight="600" fill="#fff" opacity=".92">${initialsOf[i % initialsOf.length]}</text></svg>`,
  )}`;
// ds-audit-ignore-end
const sphere = Array.from({ length: 30 }, (_, i) => ({ src: photo(i), alt: `Cliente ${i + 1}` }));

const revenue = ["mai", "jun", "jul", "ago", "set", "out"].map((m, i) => ({ mes: m, receita: 310000 + i * 38000 + (i % 2) * 22000 }));

/* ------------------------------------------------------------------ */

export default function MarketingLanding() {
  return (
    <SiteShell current="landing">
        <HeroSection
          badge={
            <>
              <Rocket className="h-3.5 w-3.5 text-accent-deep" /> Novo: agentes que fazem o follow-up por você
            </>
          }
          title="O CRM que trabalha enquanto seu time vende"
          description="Pipeline, previsão e follow-ups com IA — e cada número com a fonte ao lado. Feito para empresas brasileiras que vendem com processo."
          actions={
            <>
              <Button href={authRoutes.signup}>
                Começar grátis <ArrowRight />
              </Button>
              <Button variant="ghost" href="mailto:vendas@atlas.app?subject=Demonstra%C3%A7%C3%A3o">
                Agendar demonstração
              </Button>
            </>
          }
          footnote="14 dias grátis · sem cartão · migração assistida"
          media={
            <ScreenFrame url="app.atlas.com.br/painel">
              <div className="bg-page p-4 sm:p-6">
                <KpiGrid cols={3}>
                  <KpiCard label="Receita do mês" value={formatCurrency(498000, { compact: true })} delta={0.126} spark={[3, 4, 4, 5, 6, 7, 8]} />
                  <KpiCard label="Negócios ganhos" value="42" delta={0.08} />
                  <KpiCard label="Ciclo médio" value="31 dias" delta={-0.12} goodWhen="down" />
                </KpiGrid>
                <div className="mt-4 hidden rounded-xl border border-line bg-surface p-4 sm:block">
                  <AreaChart label="Receita mensal" data={revenue} index="mes" series={[{ key: "receita", label: "Receita" }]} formatAxis={(n) => formatCurrency(n, { compact: true })} height={180} />
                </div>
              </div>
            </ScreenFrame>
          }
        />

        <section id="clientes" className="py-12">
          <LogoCloud title="Mais de 2.000 empresas vendem com o Atlas" logos={logos} scrolling />
        </section>

        <div id="produto">
          <FeatureGrid
            kicker="Produto"
            title="Tudo o que o time comercial precisa, num lugar só"
            description="Sem planilha paralela, sem copiar e colar entre sistemas."
            cols={4}
            items={[
              { icon: <Workflow />, title: "Pipeline com processo", description: "Etapas, critérios de saída e alertas de negócio parado." },
              { icon: <Bot />, title: "Agentes de follow-up", description: "Rascunham e-mails e tarefas; alguém do time aprova antes de enviar." },
              { icon: <BarChart3 />, title: "Previsão confiável", description: "Receita ponderada por etapa, comparada com a meta, todo dia." },
              { icon: <Lock />, title: "Seguro por padrão", description: "LGPD, SSO e trilha de auditoria em todos os planos." },
            ]}
          />
        </div>

        <section className="mx-auto grid max-w-[1200px] items-center gap-10 px-5 py-12 sm:px-8 lg:grid-cols-2">
          <div>
            <p className="m-0 mb-3 text-[12px] font-medium uppercase tracking-[0.1em] text-accent-deep">Clientes</p>
            <h2 className="m-0 text-balance text-[30px] font-semibold tracking-[-0.03em]">De padarias a hospitais, em todo o Brasil</h2>
            <p className="m-0 mt-3 max-w-[480px] text-[15px] leading-relaxed text-muted">Arraste a esfera para conhecer algumas das empresas que migraram da planilha para o Atlas nos últimos 12 meses.</p>
            <ul className="mt-6 list-none space-y-2 p-0">
              {["Migração em até 7 dias", "Treinamento para o time inteiro", "Suporte em português, de verdade"].map((t) => (
                <li key={t} className="flex items-center gap-2 text-[14px]">
                  <Check className="h-4 w-4 text-ok" aria-hidden /> {t}
                </li>
              ))}
            </ul>
          </div>
          <ImageSphere images={sphere} size={440} itemSize={60} label="Empresas clientes" />
        </section>

        <div className="py-12">
          <StatsBand
            stats={[
              { value: 2140, label: "Empresas ativas" },
              { value: 4200000000, label: "Em negócios ganhos", format: (n) => formatCurrency(n, { compact: true }) },
              { value: 18, label: "Mais receita no 1º ano", suffix: " %" },
              { value: 38000, label: "Follow-ups por semana", format: formatCompact },
            ]}
          />
        </div>

        <section className="mx-auto max-w-[1200px] px-5 py-12 sm:px-8">
          <div className="grid gap-4 md:grid-cols-3">
            <Testimonial quote="Fechamos o trimestre com 18 % a mais de receita e o mesmo time. O pipeline finalmente reflete a realidade." name="Renata Farias" role="Diretora de Operações · Grupo Aurora" avatar={photo(0)} />
            <Testimonial quote="Os agentes fazem o follow-up que ninguém tinha tempo de fazer. E eu vejo exatamente o que enviaram." name="Paulo Menezes" role="Head de Vendas · Vértice Logística" avatar={photo(1)} />
            <Testimonial quote="Saímos de 6 planilhas para uma tela. A reunião de forecast caiu de 2 horas para 20 minutos." name="Luíza Prado" role="COO · Clínica Viva" avatar={photo(8)} />
          </div>
        </section>

        <section id="preços" className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8">
          <header className="mx-auto mb-10 max-w-[560px] text-center">
            <h2 className="m-0 text-[30px] font-semibold tracking-[-0.03em]">Planos simples, por usuário</h2>
            <p className="m-0 mt-3 text-[15px] text-muted">Cobrança mensal em reais. Cancele quando quiser.</p>
          </header>
          <div className="grid gap-4 lg:grid-cols-3">
            {plans.map((p) => (
              <div key={p.name} className={cn("flex flex-col rounded-2xl border bg-surface p-6", p.featured ? "border-primary shadow-raised ring-1 ring-primary" : "border-line")}>
                <div className="flex items-center justify-between">
                  <h3 className="m-0 text-[16px] font-semibold">{p.name}</h3>
                  {p.featured && <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-[11.5px] font-medium text-accent-deep ring-1 ring-accent/30">Mais escolhido</span>}
                </div>
                <p className="m-0 mt-1 text-[13px] text-muted">{p.desc}</p>
                <p className="m-0 mt-5 text-[34px] font-semibold tracking-[-0.03em]">
                  {p.price ? (
                    <>
                      {formatCurrency(p.price, { cents: false })}
                      <span className="text-[14px] font-normal tracking-normal text-muted"> /usuário/mês</span>
                    </>
                  ) : (
                    "Sob consulta"
                  )}
                </p>
                <ul className="mt-5 flex-1 list-none space-y-2 p-0">
                  {p.highlights.map((it) => (
                    <li key={it} className="flex items-center gap-2 text-[13.5px] text-ink-soft">
                      <Check className="h-4 w-4 shrink-0 text-ok" aria-hidden /> {it}
                    </li>
                  ))}
                </ul>
                <Button className="mt-6 w-full" variant={p.featured ? "primary" : "ghost"} href={p.price ? frameHref("auth-signup", { plan: p.id }) : "mailto:vendas@atlas.app?subject=Enterprise"}>
                  {p.price ? "Começar grátis" : "Falar com vendas"}
                </Button>
              </div>
            ))}
          </div>
          <p className="m-0 mt-6 text-center text-[13px] text-muted">
            <a href={authRoutes.pricing} className="inline-flex min-h-6 items-center font-medium text-blue hover:underline">
              Comparar todos os recursos dos planos →
            </a>
          </p>
        </section>
        {/* ds-audit-ignore-end white-black */}

        {/* ds-audit-ignore-start white-black: faixa de CTA em bg-navy (escura nos dois modos) */}
        <section className="px-5 pb-16 sm:px-8">
          <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-3xl bg-navy px-6 py-14 text-center text-white sm:px-12">
            <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(50% 80% at 50% 0%, color-mix(in oklab, var(--color-accent) 30%, transparent), transparent 70%)" }} />
            <div className="relative">
              <h2 className="m-0 text-balance text-[30px] font-semibold tracking-[-0.03em] sm:text-[38px]">Seu próximo trimestre começa hoje</h2>
              <p className="mx-auto mt-3 max-w-[520px] text-[15px] text-white/75">Importe sua planilha em minutos e veja o pipeline real antes da próxima reunião de vendas.</p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <a href={authRoutes.signup} className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-[13.5px] font-medium text-navy hover:bg-white/90">
                  Começar grátis <ArrowRight className="h-4 w-4" />
                </a>
                <a href="mailto:vendas@atlas.app" className="inline-flex h-10 items-center rounded-lg px-4 text-[13.5px] font-medium text-white ring-1 ring-white/30 hover:bg-white/10">
                  Falar com vendas
                </a>
              </div>
            </div>
          </div>
        </section>
    </SiteShell>
  );
}
