import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn, notify } from "@g4os/ds";
import { CodeBlock, DocPage, DocSection, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Tokens",
  group: "Fundamentos",
  order: 1,
  description: "Três camadas: primitivos (--g4-*), semânticos (--ds-*, trocam por tema e marca) e a ponte Tailwind (bg-surface, text-muted…). Componente só conhece semânticos.",
};

type Row = { token: string; utility: string; role: string };
const groupsOfTokens: { title: string; rule: string; rows: Row[] }[] = [
  {
    title: "Superfícies",
    rule: "90 % da interface. No escuro, superfícies sobem de luminância com a elevação (página < superfície < popover).",
    rows: [
      { token: "page", utility: "bg-page", role: "Fundo da área de trabalho" },
      { token: "surface", utility: "bg-surface", role: "Card, painel, tabela, campo" },
      { token: "popover", utility: "bg-popover", role: "Menu, popover, modal, toast" },
      { token: "soft", utility: "bg-soft", role: "Hover, cabeçalho de tabela, rodapé" },
      { token: "rail", utility: "bg-rail", role: "Sidebar" },
    ],
  },
  {
    title: "Texto e linhas",
    rule: "Hierarquia por tom, não por cor. muted é o mínimo legível (AA).",
    rows: [
      { token: "ink", utility: "text-ink", role: "Texto principal" },
      { token: "ink-soft", utility: "text-ink-soft", role: "Texto secundário forte" },
      { token: "muted", utility: "text-muted", role: "Metadado, rótulo, placeholder" },
      { token: "line", utility: "border-line", role: "Toda borda e divisória" },
      { token: "line-strong", utility: "border-line-strong", role: "Hover de card, borda de checkbox" },
      { token: "on-ink", utility: "text-on-ink", role: "Texto sobre preenchimento forte (ink, rose, ok)" },
    ],
  },
  {
    title: "Ação e marca",
    rule: "primary é a cor de ação (botão principal, seleção). Por padrão = ink; cada cliente troca aqui. Accent só preenche; texto na cor de destaque usa accent-deep.",
    rows: [
      { token: "primary", utility: "bg-primary", role: "Botão principal, item selecionado, passo concluído" },
      { token: "on-primary", utility: "text-on-primary", role: "Texto/ícone sobre primary" },
      { token: "accent", utility: "bg-accent", role: "Progresso, foco, próximo passo (preenchimento)" },
      { token: "accent-deep", utility: "text-accent-deep", role: "Texto na cor de destaque" },
      { token: "accent-soft", utility: "bg-accent-soft", role: "Fundo de destaque suave" },
      { token: "blue", utility: "text-blue", role: "Link, ação textual, “em andamento”" },
      { token: "navy", utility: "bg-navy", role: "Painel escuro de marca (escuro nos dois modos)" },
      { token: "clay", utility: "text-clay", role: "Ênfase editorial / identidade de conta" },
    ],
  },
  {
    title: "Estados",
    rule: "Sempre em par: forte (texto/ícone) + -soft (fundo). Cor nunca aparece sem palavra.",
    rows: [
      { token: "ok", utility: "text-ok · bg-ok-soft", role: "Sucesso, concluído, positivo" },
      { token: "amber", utility: "text-amber · bg-amber-soft", role: "Atenção, prazo próximo" },
      { token: "rose", utility: "text-rose · bg-rose-soft", role: "Erro, bloqueio, negativo, destrutivo" },
      { token: "info", utility: "text-info · bg-info-soft", role: "Informação neutra" },
    ],
  },
  {
    title: "Dados",
    rule: "Série 1 = número principal. Ordem fixa. Grade mais clara que line.",
    rows: [1, 2, 3, 4, 5, 6].map((i) => ({ token: `chart-${i}`, utility: `var(--color-chart-${i})`, role: ["Série principal", "Comparação / anterior", "Destaque de marca", "Quarta série", "Quinta série", "“Outros”, referência"][i - 1] })).concat([{ token: "chart-grid", utility: "var(--ds-chart-grid)", role: "Linhas de grade" }]),
  },
];

function Swatch({ token, theme }: { token: string; theme: "light" | "dark" }) {
  const soft = token === "ok" || token === "amber" || token === "rose" || token === "info";
  return (
    <div data-theme={theme} className="flex h-full items-center gap-2 bg-page px-3 py-2">
      <span className="h-7 w-7 shrink-0 rounded-md ring-1 ring-line" style={{ background: `var(--ds-${token})` }} />
      {soft && <span className="h-7 w-7 shrink-0 rounded-md ring-1 ring-line" style={{ background: `var(--ds-${token}-soft)` }} />}
      <code className="truncate font-mono text-[11px] text-muted">{theme === "light" ? "claro" : "escuro"}</code>
    </div>
  );
}

function CopyName({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(text);
        setOk(true);
        notify(`${text} copiado`, undefined, "info");
        setTimeout(() => setOk(false), 1200);
      }}
      className="group inline-flex items-center gap-1.5 font-mono text-[12px] text-ink hover:text-blue"
      title="Copiar"
    >
      {text}
      {ok ? <Check className="h-3 w-3 text-ok" /> : <Copy className="h-3 w-3 opacity-0 group-hover:opacity-60" />}
    </button>
  );
}

export default function Page() {
  return (
    <DocPage title={meta.title} kicker="Fundamentos" description={meta.description}>
      <DocSection title="Arquitetura" rule="Troque o tema mudando só a camada 2. Componentes e blocos nunca mudam.">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            ["1 · Primitivos", "--g4-gray-900, --g4-gold-500…", "A paleta crua da G4. Não use em componente: não troca com tema."],
            ["2 · Semânticos", "--ds-surface, --ds-primary…", "Papéis. Redefinidos em [data-theme=dark] e [data-brand=…]."],
            ["3 · Ponte Tailwind", "bg-surface, text-muted, rounded-card", "@theme inline aponta cada utilitário para o semântico."],
          ].map(([t, c, d], i) => (
            <div key={t} className={cn("rounded-xl border p-4", i === 1 ? "border-accent/40 bg-accent-soft/40" : "border-line bg-surface")}>
              <div className="text-[13.5px] font-semibold">{t}</div>
              <code className="mt-1 block font-mono text-[11.5px] text-blue">{c}</code>
              <p className="m-0 mt-2 text-[12.5px] leading-relaxed text-muted">{d}</p>
            </div>
          ))}
        </div>
        <CodeBlock
          code={`/* Um cliente novo = um bloco de semânticos. Nada mais. */
[data-brand="acme"] {
  --ds-primary: #0b5cff;          /* botão principal, seleção */
  --ds-on-primary: #ffffff;
  --ds-accent: #ffb020;           /* progresso, foco */
  --ds-accent-deep: #8a5a00;      /* texto na cor de destaque (AA) */
  --ds-radius-scale: .75;         /* cantos mais sóbrios */
  --ds-font-sans: "Inter", system-ui, sans-serif;
}
[data-brand="acme"][data-theme="dark"] { --ds-primary: #7aa7ff; --ds-on-primary: #0a1630; }

<html lang="pt-BR" data-theme="system" data-brand="acme">`}
        />
      </DocSection>
      {groupsOfTokens.map((g) => (
        <DocSection key={g.title} title={g.title} rule={g.rule}>
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full min-w-[720px] text-left text-[12.5px]">
              <thead className="border-b border-line bg-soft/60 text-[11.5px] text-muted">
                <tr>
                  <th className="px-3 py-2">Variável</th>
                  <th className="px-3 py-2">Utilitário</th>
                  <th className="px-3 py-2">Papel</th>
                  <th className="w-40 p-0">
                    <span className="block px-3 py-2">Claro</span>
                  </th>
                  <th className="w-40 p-0">
                    <span className="block px-3 py-2">Escuro</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {g.rows.map((r) => (
                  <tr key={r.token}>
                    <td className="px-3 py-2">
                      <CopyName text={`--ds-${r.token}`} />
                    </td>
                    <td className="px-3 py-2 font-mono text-[11.5px] text-blue">{r.utility}</td>
                    <td className="px-3 py-2 text-ink-soft">{r.role}</td>
                    <td className="p-0">
                      <Swatch token={r.token} theme="light" />
                    </td>
                    <td className="p-0">
                      <Swatch token={r.token} theme="dark" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DocSection>
      ))}
      <DocSection title="Forma, tipo e movimento" rule="Também são tokens: --ds-radius-scale multiplica todos os raios (inclusive rounded-lg/xl do Tailwind); --ds-font-sans troca a fonte do app inteiro.">
        <div className="grid gap-3 sm:grid-cols-5">
          {[
            ["chip", 6],
            ["control", 8],
            ["tile", 10],
            ["card", 12],
            ["shell", 16],
          ].map(([k, r]) => (
            <div key={k} className="text-center">
              <div className="mx-auto h-16 w-full border border-line-strong bg-soft" style={{ borderRadius: `var(--radius-${k})` }} />
              <div className="mt-2 font-mono text-[11.5px]">rounded-{k}</div>
              <div className="text-[11px] text-muted">{r}px × escala</div>
            </div>
          ))}
        </div>
      </DocSection>
      <DocSection title="Regras">
        <Rules
          items={[
            { do: <>Use o utilitário semântico: <code>bg-surface</code>, <code>text-muted</code>, <code>bg-primary text-on-primary</code>.</>, dont: <>Cor crua: <code>bg-white</code>, <code>text-gray-500</code>, <code>#202124</code>, <code>--g4-gray-900</code> em componente.</> },
            { do: <>Precisa de uma variação? Misture com o token: <code>bg-ink/[0.06]</code> ou <code>color-mix(in oklab, var(--ds-ink) 6%, transparent)</code>.</>, dont: "Criar um hex “parecido” que não acompanha o tema escuro." },
            { do: "Cliente novo: sobrescreva só semânticos num [data-brand] e teste contraste nos dois modos.", dont: "Forkar componentes para trocar cor ou raio." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
