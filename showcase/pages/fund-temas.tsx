import { Check, Plus, TriangleAlert } from "lucide-react";
import { useMemo, useState, type CSSProperties } from "react";
import {
  AreaChart,
  Badge,
  Button,
  Delta,
  KpiCard,
  SegmentedControl,
  StagePath,
  Switch,
  TextField,
  brandCss,
  brandPresets,
  cn,
  contrast,
  deriveBrand,
  formatNumber,
  useTheme,
  type BrandTokens,
} from "@g4ai/ds";
import { CodeBlock, DocPage, DocSection, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Temas, marca e dark mode",
  group: "Fundamentos",
  order: 2,
  description: "Adapte o DS à identidade de cada cliente trocando meia dúzia de variáveis. O gerador calcula as variantes de claro e escuro com contraste AA e entrega o CSS pronto.",
};

const fonts = [
  { value: "Figtree", label: "Figtree (G4)" },
  { value: "Inter", label: "Inter" },
  { value: "Manrope", label: "Manrope" },
  { value: "IBM Plex Sans", label: "IBM Plex Sans" },
  { value: "system-ui", label: "Fonte do sistema" },
];

const styleFor = (t: BrandTokens, radius: number, font: string): CSSProperties =>
  ({
    "--ds-primary": t.primary,
    "--ds-on-primary": t.onPrimary,
    "--ds-accent": t.accent,
    "--ds-accent-deep": t.accentDeep,
    "--ds-accent-soft": t.accentSoft,
    "--ds-blue": t.blue,
    "--ds-chart-1": t.chart1,
    "--ds-radius-scale": String(radius),
    "--ds-font-sans": font === "system-ui" ? "system-ui, sans-serif" : `"${font}", system-ui, sans-serif`,
    fontFamily: "var(--ds-font-sans)",
  }) as CSSProperties;

const series = ["jan", "fev", "mar", "abr", "mai", "jun", "jul"].map((m, i) => ({ mes: m, valor: 40 + i * 7 + (i % 2) * 9 }));

function Preview({ tokens, theme, radius, font }: { tokens: BrandTokens; theme: "light" | "dark"; radius: number; font: string }) {
  const [seg, setSeg] = useState("mes");
  const [on, setOn] = useState(true);
  const [email, setEmail] = useState("");
  return (
    <div data-theme={theme} style={styleFor(tokens, radius, font)} className="min-w-0 space-y-4 rounded-2xl border border-line bg-page p-5 text-ink">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted">{theme === "light" ? "Claro" : "Escuro"}</span>
        <SegmentedControl label="Período" value={seg} onChange={setSeg} options={[{ value: "mes", label: "Mês" }, { value: "tri", label: "Trimestre" }]} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm">
          <Plus /> Novo pedido
        </Button>
        <Button size="sm" variant="ghost">
          Exportar
        </Button>
        <Badge tone="accent">Premium</Badge>
        <Badge tone="ok">Pago</Badge>
        <Switch label="Avisos" checked={on} onCheckedChange={setOn} />
      </div>
      <KpiCard label="Receita recorrente" value="R$ 412 mil" delta={0.124} spark={[3, 4, 4, 5, 6, 7, 8]} />
      <div className="rounded-xl border border-line bg-surface p-4">
        <div className="mb-2 flex items-center justify-between text-[13px] font-medium">
          Pedidos por mês <Delta value={0.08} />
        </div>
        <AreaChart label="Pedidos por mês" data={series} index="mes" series={[{ key: "valor", label: "Pedidos" }]} height={120} yAxis={false} />
      </div>
      <StagePath stages={[{ id: "a", label: "Lead" }, { id: "b", label: "Proposta" }, { id: "c", label: "Fechado" }]} current="b" />
      <TextField label="E-mail do cliente" placeholder="nome@empresa.com.br" value={email} onChange={setEmail} />
      <p className="m-0 text-[13px] text-ink-soft">
        Texto com <a className="font-medium text-blue underline decoration-blue/40 underline-offset-2 hover:decoration-blue">link de ação</a> e <span className="font-medium text-accent-deep">destaque de marca</span>.
      </p>
    </div>
  );
}

function ContrastRow({ label, fg, bg }: { label: string; fg: string; bg: string }) {
  const c = contrast(fg, bg);
  const ok = c >= 4.5;
  return (
    <li className="flex items-center justify-between gap-3 py-1.5 text-[12.5px]">
      <span className="flex items-center gap-2 text-ink-soft">
        <span className="inline-grid h-5 w-8 place-items-center rounded text-[10px] font-semibold" style={{ background: bg, color: fg }}>
          Aa
        </span>
        {label}
      </span>
      <span className={cn("inline-flex items-center gap-1 font-medium tabular-nums", ok ? "text-ok" : "text-amber")}>
        {ok ? <Check className="h-3.5 w-3.5" /> : <TriangleAlert className="h-3.5 w-3.5" />}
        {c.toFixed(1).replace(".", ",")}:1
      </span>
    </li>
  );
}

export default function Page() {
  const site = useTheme();
  const [name, setName] = useState("cliente");
  const [primary, setPrimary] = useState("#1554d1");
  const [accent, setAccent] = useState("#f0a020");
  const [radius, setRadius] = useState(1);
  const [font, setFont] = useState("Figtree");
  const brand = useMemo(() => deriveBrand(primary, accent), [primary, accent]);
  const css = brandCss(name.trim() || "cliente", brand, { radiusScale: radius, fontSans: font === "Figtree" ? undefined : font === "system-ui" ? "system-ui, sans-serif" : `"${font}", system-ui, sans-serif` });

  return (
    <DocPage title={meta.title} kicker="Fundamentos" description={meta.description}>
      <DocSection title="Gerador de marca" rule="Escolha a cor de ação e a de destaque. O resto (texto sobre a cor, variantes de texto, fundos suaves, versão escura) é derivado com contraste garantido.">
        <div className="grid gap-5 xl:grid-cols-[300px_1fr]">
          <div className="space-y-4 rounded-2xl border border-line bg-surface p-5">
            <TextField label="Nome da marca (data-brand)" value={name} onChange={(v: string) => setName(v.replace(/[^a-z0-9-]/gi, "").toLowerCase())} />
            {(
              [
                ["Cor de ação (primary)", primary, setPrimary, "Botão principal, seleção, passo concluído"],
                ["Destaque (accent)", accent, setAccent, "Progresso, foco, próximo passo"],
              ] as const
            ).map(([label, value, set, hint]) => (
              <label key={label} className="block">
                <span className="text-[12.5px] font-medium">{label}</span>
                <span className="mt-1.5 flex items-center gap-2 rounded-lg border border-line bg-surface p-1.5">
                  <input type="color" value={value} onChange={(e) => set(e.target.value)} className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent p-0" aria-label={label} />
                  <input value={value} onChange={(e) => /^#[0-9a-f]{6}$/i.test(e.target.value) && set(e.target.value)} className="h-8 min-w-0 flex-1 bg-transparent font-mono text-[13px] outline-none" aria-label={`${label} (hex)`} />
                </span>
                <span className="mt-1 block text-[11.5px] text-muted">{hint}</span>
              </label>
            ))}
            <label className="block">
              <span className="flex justify-between text-[12.5px] font-medium">
                Arredondamento <span className="font-mono text-muted">×{formatNumber(radius, 2)}</span>
              </span>
              <input type="range" min={0} max={1.6} step={0.05} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="mt-2 w-full" aria-label="Escala de raio" />
              <span className="mt-1 flex justify-between text-[11px] text-muted">
                <span>quadrado</span>
                <span>G4</span>
                <span>amigável</span>
              </span>
            </label>
            <div>
              <span className="text-[12.5px] font-medium">Fonte</span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {fonts.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setFont(f.value)}
                    aria-pressed={font === f.value}
                    className={cn("rounded-md px-2.5 py-1 text-[12px] ring-1", font === f.value ? "bg-primary text-on-primary ring-primary" : "bg-surface text-ink-soft ring-line hover:bg-soft")}
                    style={{ fontFamily: f.value === "system-ui" ? "system-ui" : `"${f.value}"` }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              {font !== "Figtree" && font !== "system-ui" && <p className="m-0 mt-1.5 text-[11.5px] text-muted">Carregue a fonte no app (next/font ou Google Fonts).</p>}
            </div>
            <div>
              <span className="text-[12.5px] font-medium">Presets</span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {brandPresets.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      setPrimary(b.primary);
                      setAccent(b.accent);
                      setName(b.id === "g4" ? "cliente" : b.id);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-md bg-surface px-2 py-1 text-[12px] text-ink-soft ring-1 ring-line hover:bg-soft"
                  >
                    <span className="h-3 w-3 rounded-full" style={{ background: b.primary }} />
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-line pt-3">
              <span className="text-[12.5px] font-medium">Contraste (WCAG AA ≥ 4,5)</span>
              <ul className="m-0 mt-1 list-none p-0">
                <ContrastRow label="Texto sobre ação · claro" fg={brand.light.onPrimary} bg={brand.light.primary} />
                <ContrastRow label="Texto sobre ação · escuro" fg={brand.dark.onPrimary} bg={brand.dark.primary} />
                <ContrastRow label="Destaque em texto · claro" fg={brand.light.accentDeep} bg="#ffffff" />
                <ContrastRow label="Destaque em texto · escuro" fg={brand.dark.accentDeep} bg="#18181b" />
                <ContrastRow label="Link · claro" fg={brand.light.blue} bg="#ffffff" />
                <ContrastRow label="Link · escuro" fg={brand.dark.blue} bg="#18181b" />
              </ul>
            </div>
          </div>
          <div className="grid min-w-0 gap-4 lg:grid-cols-2">
            <Preview tokens={brand.light} theme="light" radius={radius} font={font} />
            <Preview tokens={brand.dark} theme="dark" radius={radius} font={font} />
          </div>
        </div>
        <CodeBlock code={`/* themes.css (ou globals.css do app) */\n${css}\n/* no <html> */\n<html lang="pt-BR" data-theme="system" data-brand="${name || "cliente"}">`} />
      </DocSection>

      <DocSection title="Dark mode" rule="Três valores em data-theme: light, dark e system (segue o SO). O hook useTheme persiste a escolha e sincroniza abas; themeScript evita o flash do tema errado.">
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface p-4 text-[13px]">
          Tema deste site agora: <code className="font-mono">{site.mode}</code> → <strong>{site.resolved === "dark" ? "escuro" : "claro"}</strong>
          <span className="text-muted">(troque no cabeçalho: ☀︎ ☾ 🖥)</span>
        </div>
        <CodeBlock
          code={`// app/layout.tsx (Next.js)
import { themeScript } from "@g4ai/ds";

<html lang="pt-BR" className="ds-app" data-theme="system" suppressHydrationWarning>
  <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
  …

// em qualquer lugar (sidebar, menu do usuário)
import { ThemeToggle, useTheme } from "@g4ai/ds";
<ThemeToggle />                      // Claro · Escuro · Sistema
const { mode, setMode, brand, setBrand, resolved } = useTheme();

// variante do Tailwind para casos pontuais
<img className="dark:invert" … />`}
        />
        <Rules
          items={[
            { do: "Deixe o componente escuro sozinho: se ele usa só tokens semânticos, já funciona.", dont: <>Espalhar <code>dark:bg-zinc-900</code> em componente. <code>dark:</code> é para exceções (logos, imagens).</> },
            { do: "No escuro, eleve com luminância (page < surface < popover) e bordas; sombras são reforço.", dont: "Inverter as cores ou usar preto puro (#000) como fundo." },
            { do: "Estados ficam mais claros e menos saturados no escuro (já nos tokens).", dont: "Reusar o verde/vermelho do claro sobre fundo escuro (vibra e falha contraste)." },
            { do: "Teste toda tela nova nos dois modos e com uma marca de cor forte (Oceano, Violeta).", dont: "Assumir que “ink” é preto: numa marca, primary pode ser azul." },
          ]}
        />
      </DocSection>

      <DocSection title="O que pode mudar por cliente (e o que não)">
        <div tabIndex={0} role="region" aria-label="Tabela" className="overflow-x-auto rounded-xl border border-line outline-none focus-visible:ring-2 focus-visible:ring-muted/50">
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-line bg-soft/60 text-[12px] text-muted">
              <tr>
                <th className="px-4 py-2.5">Variável</th>
                <th className="px-4 py-2.5">Muda por cliente?</th>
                <th className="px-4 py-2.5">Observação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {[
                ["--ds-primary / --ds-on-primary", "Sim", "A cor da marca vira a cor de ação. Contraste ≥ 4,5."],
                ["--ds-accent / -deep / -soft", "Sim", "Destaque secundário. Pode ser igual ao primary."],
                ["--ds-blue", "Opcional", "Links. Em marcas azuis, alinhe ao primary."],
                ["--ds-chart-1…3", "Opcional", "Série 1 costuma ser a cor da marca."],
                ["--ds-radius-scale", "Sim", "0,4 (industrial) · 1 (G4) · 1,3 (amigável)."],
                ["--ds-font-sans", "Sim", "Carregue a fonte no app. Mantenha pesos 400/500/600."],
                ["--ds-ok / amber / rose", "Não", "Semântica universal: verde = certo, vermelho = erro."],
                ["--ds-surface / line / muted", "Raramente", "Só para marcas com fundo “papel” (bege) — teste contraste."],
                ["Escala de texto, espaçamento", "Não", "Densidade é do produto, não da marca."],
              ].map(([v, m, o]) => (
                <tr key={v}>
                  <td className="px-4 py-2.5 font-mono text-[12px]">{v}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={m === "Sim" ? "ok" : m === "Não" ? "bad" : "neutral"}>{m}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-ink-soft">{o}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DocSection>
    </DocPage>
  );
}
