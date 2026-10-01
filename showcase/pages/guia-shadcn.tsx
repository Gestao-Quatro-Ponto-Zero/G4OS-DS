import { Callout } from "@g4ai/ds";
import { CodeBlock, DocPage, DocSection, Rules, type PageMeta } from "../kit";
import { GuideTable } from "./_guia-table";

export const meta: PageMeta = {
  title: "shadcn/ui e 21st.dev",
  group: "Começar",
  order: 3,
  description: "Quando faltar algo no DS, traga do shadcn/ui ou do 21st.dev e ligue a ponte: as variáveis do shadcn passam a apontar para os tokens do G4OS-DS.",
};

export default function Page() {
  return (
    <DocPage title={meta.title} kicker={meta.group} description={meta.description}>
      <DocSection
        title="Ordem de preferência"
        rule={
          <>
            Componente do DS → bloco do DS → composição de componentes do DS → shadcn/21st com a ponte → escrever do zero. Antes de instalar, procure o par em <a href="#/p/guia-shadcn-equivalencias">shadcn/ui ↔ G4OS-DS</a>.
          </>
        }
      >
        <Rules
          items={[
            { do: "Trazer do shadcn só o que falta (editor rico, calendário de agenda, carrossel de marketing).", dont: "Instalar Button, Dialog, Select, Table ou Tabs do shadcn: o DS já tem, com os padrões de acessibilidade e escrita." },
          ]}
        />
      </DocSection>

      <DocSection title="1. Ligar a ponte" rule="Depois dos estilos do DS. Apague o :root, o .dark e o @theme inline que o shadcn init gera.">
        <CodeBlock
          code={`/* globals.css */
@import "tailwindcss";
@import "@g4ai/ds/styles.css";
@import "@g4ai/ds/shadcn.css";`}
        />
        <GuideTable
          head={["Variável do shadcn", "Token do DS", "Valor", "Papel"]}
          rows={[
            ["--background / --card / --popover", "page", "#ffffff", "Superfícies brancas."],
            ["--primary", "ink", "#202124", "Ação principal em tinta, nunca cor de marca."],
            ["--secondary / --muted / --accent", "soft", "#f8f8f9", "Fundos neutros e hover."],
            ["--muted-foreground", "muted", "#6b6e76", "Texto secundário."],
            ["--destructive", "rose", "#b71c1c", "Erro e destruição."],
            ["--border / --input", "line", "#e9eaed", "Toda borda."],
            ["--ring", "muted", "#6b6e76", "Foco neutro (nunca azul)."],
            ["--chart-1…5", "chart-1…5", "ink, blue, gold…", "Mesma ordem de séries dos gráficos do DS."],
            ["--sidebar-*", "rail / page / ink", "—", "Blocos de sidebar do shadcn com o trilho do DS."],
            ["--radius", "—", "0.5rem", "Raio base (8 px)."],
          ]}
        />
      </DocSection>

      {/* g4os-ds-disable shadcn-class -- tabela de/para: as classes do shadcn aparecem de propósito */}
      <DocSection title="2. Colisões: bg-accent e bg-muted" rule="No DS, accent é o dourado de marca e muted é a cor de texto cinza. O DS vence. Ao colar código do shadcn, troque:">
        <GuideTable
          head={["Classe colada", "No shadcn", "No DS", "Troque por"]}
          mono={[0, 3]}
          rows={[
            ["bg-accent", "hover neutro", "dourado de marca", "bg-soft"],
            ["hover:bg-accent", "hover", "dourado de marca", "hover:bg-soft"],
            ["bg-muted", "fundo neutro", "cinza de texto (#6b6e76)", "bg-soft"],
            ["text-muted-foreground", "cinza de texto", "funciona via ponte", "text-muted (opcional)"],
          ]}
          /* g4os-ds-enable */
        />
        <CodeBlock code={`grep -rnE "(hover:|data-\\[[^]]*\\]:)?bg-(accent|muted)\\b" components/ui   # encontre e troque por bg-soft`} />
      </DocSection>

      <DocSection title="3. 21st.dev pelo MCP" rule="A busca é gratuita; o código do componente (get_component) é pago. Prefira componentes que já usam variáveis do shadcn.">
        <CodeBlock
          code={`claude mcp add --transport http 21st https://21st.dev/api/mcp --header "x-api-key: <sua chave>"

# ou pelo site: copie o comando de instalação da página do componente
npx shadcn@latest add "https://21st.dev/r/<autor>/<componente>"`}
        />
      </DocSection>

      <DocSection title="4. Checklist depois de colar" rule="O que a ponte não resolve sozinha.">
        <Rules
          items={[
            { do: "Raio: controles rounded-lg (8 px), cards e popups rounded-xl (12 px), modais rounded-2xl.", dont: "Deixar rounded-md do shadcn em botões e campos." },
            { do: "Texto na escala do DS: corpo 13.5 px, rótulos 12.5 px, metadados 12 px, títulos de card 14/500.", dont: "text-sm em tudo e títulos text-lg font-semibold." },
            { do: "Controles h-10 (padrão) ou h-9 (compacto).", dont: "h-8 em controles principais." },
            { do: "Sombra só no que flutua (shadow-popup, shadow-overlay).", dont: "shadow-sm/shadow-md em cards estáticos." },
            { do: "Neutros por token: bg-soft, border-line, text-muted, text-ink.", dont: "zinc/slate/gray/violet-*, hex e gradientes." },
            { do: "Remover variantes dark: (o DS ainda não tem tema escuro).", dont: "Manter blocos .dark que nunca vão ativar." },
            { do: "Textos em pt-BR com verbo + objeto.", dont: "“Submit”, “OK”, “Sim”." },
          ]}
        />
        <Callout tone="info" title="Promover para o DS">
          Se o mesmo componente colado aparece em dois ou mais apps, reescreva com tokens e padrões e adicione ao DS (docs/guias/contribuir.md).
        </Callout>
      </DocSection>
    </DocPage>
  );
}
