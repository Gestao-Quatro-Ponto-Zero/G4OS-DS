import { ArrowRight, FileText, Sparkles, Trophy } from "lucide-react";
import { AchievementCard, Badge, BrandBadge, BrandButton, BrandPanel, Button, cn, useTheme } from "@g4os/ds";
import { Demo, DocPage, DocSection, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Marca G4 na interface",
  group: "Fundamentos",
  order: 3,
  description: "A paleta do manual de marca (Navy Blue, Royal Gold, Royal Silver) aparece em momentos escolhidos — não pinta a interface inteira. O tema G4 continua neutro; o navy não vira modo escuro.",
};

const palette: { group: string; items: [string, string, string, string][] }[] = [
  {
    group: "Primárias",
    items: [
      ["Navy Blue", "#001F35", "--g4-navy-blue", "Momentos de marca (BrandPanel), ação no preset Institucional"],
      ["Royal Gold", "#B9915B", "--g4-royal-gold", "Marcador de navegação, progresso, conquista, selo premium"],
      ["Royal Silver", "#F5F4F3", "--g4-royal-silver", "Texto sobre navy; superfície suave no Institucional"],
    ],
  },
  {
    group: "Secundárias",
    items: [
      ["Maua Blue", "#031A26", "--g4-maua-blue", "Painéis navy profundos (login, slides)"],
      ["Scaling Blue", "#184560", "--g4-scaling-blue", "Links e ações textuais (--ds-blue)"],
      ["Founders Red", "#441B1B", "--g4-founders-red", "Só conteúdo Founders"],
      ["Ground Clay", "#842E20", "--g4-ground-clay", "Ênfase editorial, série 4 de gráfico"],
    ],
  },
  {
    group: "Neutros quentes (preset Institucional)",
    items: [
      ["Warm White", "#FAFAF9", "--g4-warm-white", "Fundo de página"],
      ["Light Gray", "#E8E6E3", "--g4-light-gray", "Bordas e divisórias"],
      ["Mid Gray", "#9A9895", "--g4-mid-gray", "Ícones (como texto, use #6E6B67 para AA)"],
      ["Dark Gray", "#4A4845", "--g4-dark-gray", "Texto secundário"],
      ["Charcoal", "#2A2826", "--g4-charcoal", "Texto principal"],
    ],
  },
];

export default function Page() {
  const t = useTheme("light");
  return (
    <DocPage title={meta.title} kicker="Fundamentos" description={meta.description}>
      <DocSection title="Três níveis de marca" rule="Escolha o nível pelo contexto. Produto de uso diário fica no nível 1; materiais e portais podem subir.">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            ["1 · Toque (padrão G4)", "Interface neutra. A marca aparece no marcador dourado da navegação, no progresso e nos selos. É o tema de todos os produtos."],
            ["2 · Momento", "Um BrandPanel navy por tela, onde há emoção ou abertura: login, fim de onboarding, capa de relatório, saudação da IA, conquista."],
            ["3 · Institucional", "Preset data-brand=\"g4-institucional\": neutros quentes, Navy na ação, Gold no destaque. Para apresentações, portais e marketing."],
          ].map(([title, body], i) => (
            <div key={title} className={cn("rounded-xl border p-4", i === 0 ? "border-accent/40 bg-accent-soft/30" : "border-line bg-surface")}>
              <div className="text-[13.5px] font-semibold">{title}</div>
              <p className="m-0 mt-1.5 text-[12.5px] leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection title="Paleta oficial" rule="Todas viram primitivos --g4-* com o nome do manual. Componentes usam os semânticos (--ds-brand, --ds-on-brand, --ds-brand-accent, --ds-nav-marker), nunca o hex.">
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

      <DocSection title="Nível 1 · Toques na interface" rule="Já estão no tema G4: marcador Royal Gold no item ativo da navegação, progresso dourado, selos.">
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

      <DocSection title="Nível 2 · Momentos de marca" rule="BrandPanel é navy nos dois temas, com brilho Royal Gold e grade técnica sutil. Um por tela.">
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
                    <div className="text-on-brand/60">{k}</div>
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

      <DocSection title="Nível 3 · Preset G4 Institucional" rule="Para apresentações, portal do cliente, páginas públicas. O escuro continua neutro (não navy), com Royal Silver na ação e as semânticas do manual.">
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
            { do: "Navy em momentos (capa, login, conquista, saudação). Um por tela.", dont: "Navy como fundo de app ou como modo escuro: o escuro do DS é neutro de propósito." },
            { do: "Royal Gold como preenchimento e marcador (progresso, item ativo, selo). Texto dourado usa accent-deep.", dont: "Texto em #B9915B sobre branco (2,6:1, reprova AA) ou botões dourados espalhados." },
            { do: "Royal Silver como texto sobre navy e como superfície suave no Institucional.", dont: "Silver como texto sobre branco." },
            { do: "Founders Red só em conteúdo Founders.", dont: "Usar Founders Red como cor de erro (erro é rose)." },
            { do: "Gráficos: Navy e Gold como séries 1 e 2 no Institucional.", dont: "Mais de 3 cores de marca no mesmo gráfico." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
