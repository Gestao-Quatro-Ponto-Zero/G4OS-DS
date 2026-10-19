import { ArrowRight, FileText, Sparkles, Trophy } from "lucide-react";
import { AchievementCard, AiDots, AiGreeting, AiOrb, Badge, BrandBadge, BrandButton, BrandPanel, Button, G4OSLogo, G4OSSymbol, GradientText, cn, useTheme } from "@g4ai/ds";
import { Demo, DocPage, DocSection, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Marca G4 na interface",
  group: "Fundamentos",
  order: 3,
  description: "O tema padrão segue o KV G4 OS: gelo, tinta navy, a esfera da IA e o gradiente dourado → azul nos momentos de marca. A paleta do manual (Navy Blue, Royal Gold, Royal Silver) continua no preset Institucional e no BrandPanel tone=\"navy\".",
};

const palette: { group: string; items: [string, string, string, string][] }[] = [
  {
    group: "Primárias",
    items: [
      ["Navy", "#001F35", "--g4-navy-blue", "Ação principal (--ds-primary), série 1 de gráfico"],
      ["Maua", "#031A26", "--g4-maua-blue", "Texto principal (--ds-ink) e \"G4\" do logotipo"],
      ["Gelo", "#F9F9F9", "--g4-kv-ice", "Fundo de trabalho (--ds-page), o fundo do KV"],
    ],
  },
  {
    group: "Azuis da esfera",
    items: [
      ["Scaling", "#184560", "--g4-scaling-blue", "Texto secundário forte e títulos leves (--ds-ink-soft)"],
      ["Azul profundo", "#005B98", "--g4-kv-deep", "Link, foco, info, \"em andamento\" (--ds-blue)"],
      ["Céu", "#0084DD", "--g4-kv-sky", "Só IA: botão enviar, orb, pontos (--ds-ai-accent). Nunca texto"],
      ["Gelo azul", "#CADFEB", "--g4-kv-sky-soft", "Fundo de selo da IA, halo do orb (--ds-ai-accent-soft)"],
      ["Abismo", "#004777", "--g4-kv-abyss", "Núcleo do orb (--ds-orb-core)"],
      ["Aço", "#3B5766", "--g4-kv-steel", "Meio do gradiente, \"OS\" do logotipo (--ds-mark-steel)"],
    ],
  },
  {
    group: "Dourados do KV",
    items: [
      ["Dourado", "#A38E5A", "--g4-kv-gold", "Marcador da navegação, progresso, destaque (--ds-accent)"],
      ["Dourado claro", "#CAA977", "--g4-kv-gold-light", "Início do gradiente da esfera e do logotipo (--ds-mark-gold)"],
      ["Dourado profundo", "#6E5A2C", "--g4-kv-gold-deep", "Texto dourado com contraste AA (--ds-accent-deep)"],
      ["Dourado suave", "#F4EFE4", "--g4-kv-gold-soft", "Fundo de \"próximo passo\" e selos (--ds-accent-soft)"],
    ],
  },
  {
    group: "Neutros gelo",
    items: [
      ["Gelo azulado", "#F1F4F6", "--g4-kv-ice-blue", "Hover, cabeçalho de tabela, rodapé (--ds-soft)"],
      ["Trilho", "#F3F5F7", "--g4-kv-rail", "Sidebar (--ds-rail)"],
      ["Linha", "#E4E7EA", "--g4-kv-line", "Toda borda e divisória (--ds-line)"],
      ["Linha forte", "#D5DBE0", "--g4-kv-line-strong", "Hover de card, borda de campo (--ds-line-strong)"],
      ["Ardósia", "#9CA3AF", "--g4-kv-slate", "Ícones inativos, série 6 de gráfico"],
      ["Névoa", "#768086", "--g4-kv-mist", "Fim do gradiente do \"OS\" (--ds-mark-mist)"],
      ["Texto de apoio", "#5B6670", "--g4-kv-muted", "Metadado, rótulo, placeholder: 5,6:1 sobre o gelo (--ds-muted)"],
    ],
  },
];

export default function Page() {
  const t = useTheme("light");
  return (
    <DocPage title={meta.title} kicker="Fundamentos" description={meta.description}>
      <DocSection title="KV G4 OS" rule="A esfera, o logotipo, o gradiente e o orb são a identidade do produto. Gradiente e orb: no máximo um de cada por tela.">
        <Demo>
          <div className="relative isolate grid gap-8 overflow-hidden rounded-2xl border border-line bg-page p-8 md:grid-cols-2">
            <AiOrb size={300} blur={18} live className="absolute -right-44 top-1/2 -z-10 -translate-y-1/2 opacity-40" />
            <div className="flex flex-col gap-6">
              <G4OSLogo height={32} symbol />
              <AiGreeting size="md" level={2} name="João" />
            </div>
            <div className="flex flex-col justify-end gap-4 text-[13px] text-muted">
              <div className="flex items-center gap-3"><G4OSSymbol size={40} live /> <span>G4OSSymbol live: a esfera gira, recalcula, conduz.</span></div>
              <div className="flex items-center gap-3"><AiDots size={8} /> <span>AiDots: a IA pensando.</span></div>
              <div className="text-[28px] font-medium tracking-[-0.03em]"><GradientText>decisões complexas</GradientText></div>
            </div>
          </div>
        </Demo>
      </DocSection>
      <DocSection title="Três níveis de marca" rule="Escolha o nível pelo contexto. Produto de uso diário fica no nível 1; materiais e portais podem subir.">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            ["1 · Toque (padrão G4)", "Interface neutra. A marca aparece no marcador dourado da navegação, no progresso e nos selos. É o tema de todos os produtos."],
            ["2 · Momento", "Um BrandPanel por tela (gelo, orb e título em gradiente do KV; ou tone=\"navy\"), onde há emoção ou abertura: login, fim de onboarding, capa de relatório, saudação da IA, conquista."],
            ["3 · Institucional", "Preset data-brand=\"g4-institucional\": fundo do clássico, Navy na ação, Gold no destaque e nos gráficos. Para apresentações, portais e marketing."],
          ].map(([title, body], i) => (
            <div key={title} className={cn("rounded-xl border p-4", i === 0 ? "border-accent/40 bg-accent-soft/30" : "border-line bg-surface")}>
              <div className="text-[13.5px] font-semibold">{title}</div>
              <p className="m-0 mt-1.5 text-[12.5px] leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection title="Paleta oficial G4 OS" rule="As cores do KV G4 OS viram primitivos --g4-*. Componentes usam os semânticos (--ds-primary, --ds-ink, --ds-blue, --ds-ai-accent, --ds-accent…), nunca o hex. A paleta do manual G4 (Royal Gold, Royal Silver, Founders Red, Ground Clay) segue no preset Institucional.">
        <div>
          <p className="m-0 mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-muted">Gradiente de marca</p>
          <div className="overflow-hidden rounded-xl border border-line bg-surface">
            <div className="h-16" style={{ background: "var(--ds-gradient-brand)" }} />
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
              <div className="text-[13px] font-medium">
                <GradientText>Dourado → aço → azul profundo</GradientText> <span className="font-mono text-[11px] font-normal text-muted">#A38E5A · #3B5766 · #005B98 · #5F87A6</span>
              </div>
              <code className="font-mono text-[11px] text-blue">--ds-gradient-brand</code>
            </div>
          </div>
        </div>
        {palette.map((g) => (
          <div key={g.group}>
            <p className="m-0 mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-muted">{g.group}</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map(([name, hex, token, use]) => (
                <div key={name} className="flex overflow-hidden rounded-xl border border-line bg-surface">
                  <span className="w-16 shrink-0 border-r border-line" style={{ background: `var(${token})` }} />
                  <div className="min-w-0 px-3 py-2.5">
                    <div className="text-[13px] font-medium">
                      {name} <span className="font-mono text-[11px] font-normal text-muted">{hex}</span>
                    </div>
                    <code className="font-mono text-[11px] text-blue">{token}</code>
                    <div className="mt-0.5 text-[11.5px] leading-snug text-muted">{use}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </DocSection>

      <DocSection title="Nível 1 · Toques na interface" rule="Já estão no tema G4 OS: marcador dourado do KV no item ativo da navegação, progresso dourado, selos.">
        <Demo className="flex flex-wrap items-center gap-6" code={`// Já vem nos componentes: Sidebar, IconRail e SessionSidebar usam --ds-nav-marker.
<BrandBadge kind="premium" />  <BrandBadge kind="conquista" />  <BrandBadge kind="founders" />`}>
          <div className="w-56 rounded-xl border border-line bg-rail p-2.5">
            {["Pipeline", "Empresas", "Atividades"].map((l, i) => (
              <div key={l} className={cn("relative mb-1 flex h-9 items-center rounded-lg border px-2.5 text-[12.5px]", i === 0 ? "border-line-strong bg-surface font-medium text-ink shadow-surface" : "border-transparent text-muted")}>
                {i === 0 && <span aria-hidden className="absolute -left-[11px] top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-nav-marker" />}
                {l}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <BrandBadge kind="premium" />
            <BrandBadge kind="conquista" />
            <BrandBadge kind="founders" />
            <Badge tone="accent">Plano Pro</Badge>
          </div>
        </Demo>
      </DocSection>

      <DocSection title="Nível 2 · Momentos de marca" rule="BrandPanel segue o KV por padrão: gelo, névoa, orb da IA e título no gradiente de marca. O tom navy (prop tone) mantém o painel escuro com Royal Gold. Um por tela.">
        <div className="grid gap-4 lg:grid-cols-2">
          <Demo
            bare
            title="Saudação da IA"
            code={`<BrandPanel kicker="G4 OS" title="Bom dia, João" description="3 sessões terminaram durante a noite e 2 pedem sua aprovação."
  actions={<><BrandButton>Ver aprovações <ArrowRight /></BrandButton><BrandButton variant="ghost">Nova sessão</BrandButton></>} />`}
          >
            <BrandPanel
              kicker="G4 OS"
              title="Bom dia, João"
              description="3 sessões terminaram durante a noite e 2 pedem sua aprovação."
              actions={
                <>
                  <BrandButton>
                    Ver aprovações <ArrowRight />
                  </BrandButton>
                  <BrandButton variant="ghost">Nova sessão</BrandButton>
                </>
              }
            />
          </Demo>
          <Demo bare title="Capa de relatório" code={`<BrandPanel glow="bottom-left" kicker="Relatório trimestral · Q3 2026" title="Receita recorrente cresceu 18 %" description="…" />`}>
            <BrandPanel glow="bottom-left" kicker="Relatório trimestral · Q3 2026" title="Receita recorrente cresceu 18 %" description="Expansão em contas Enterprise compensou a queda de conversão em PMEs. Detalhes por segmento a seguir.">
              <div className="flex gap-6 text-[12.5px]">
                {[
                  ["MRR", "R$ 412 mil"],
                  ["NRR", "108 %"],
                  ["NPS", "+72"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div className="text-on-brand/80">{k}</div>
                    <div className="text-[18px] font-semibold tabular-nums">{v}</div>
                  </div>
                ))}
              </div>
            </BrandPanel>
          </Demo>
        </div>
        <Demo bare title="Conquista" code={`<AchievementCard title="Meta do trimestre batida" description="Time Sudeste fechou R$ 1,2 mi (104 % da meta)." meta="hoje" />`}>
          <div className="grid gap-3 md:grid-cols-2">
            <AchievementCard title="Meta do trimestre batida" description="Time Sudeste fechou R$ 1,2 mi — 104 % da meta." meta="hoje" icon={<Trophy />} />
            <AchievementCard title="Onboarding concluído" description="Acme ativou 6 de 6 etapas em 9 dias." meta="ontem" icon={<Sparkles />} />
          </div>
        </Demo>
      </DocSection>

      <DocSection title="Nível 3 · Preset G4 Institucional" rule="Para apresentações, portal do cliente, páginas públicas. Fundo e superfícies iguais ao clássico; o escuro continua neutro (não navy), com Royal Silver na ação e as semânticas do manual.">
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface p-4">
          <span className="text-[13px] text-ink-soft">Ver o site inteiro com o preset:</span>
          <Button size="sm" variant={t.brand === "g4-institucional" ? "primary" : "ghost"} onClick={() => t.setBrand(t.brand === "g4-institucional" ? "g4" : "g4-institucional")}>
            <FileText /> {t.brand === "g4-institucional" ? "Voltar ao G4" : "Aplicar G4 Institucional"}
          </Button>
          <code className="ml-auto font-mono text-[12px] text-muted">{'<html data-brand="g4-institucional">'}</code>
        </div>
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Gelo (#F9F9F9) como fundo e Navy na ação principal. O momento de marca é claro: névoa, orb e título em gradiente, um por tela.", dont: "Navy como fundo de app ou como modo escuro: o escuro do DS é neutro de propósito." },
            { do: "Azul-céu (#0084DD) só na IA: enviar, orb, os três pontos.", dont: "Céu em botões comuns, links ou texto: link é o azul profundo (--ds-blue)." },
            { do: "Gradiente de marca em um título de momento (saudação da IA, capa, login).", dont: "Gradiente em texto de trabalho, botão, número, tabela ou em mais de um título por tela." },
            { do: "Dourado do KV como preenchimento e marcador (progresso, item ativo, selo). Texto dourado usa accent-deep (#6E5A2C).", dont: "Texto em #A38E5A sobre o gelo (reprova AA) ou botões dourados espalhados." },
            { do: "Gráficos: Navy, azul profundo e dourado como séries 1 a 3.", dont: "Céu ou o gradiente como série de gráfico." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
