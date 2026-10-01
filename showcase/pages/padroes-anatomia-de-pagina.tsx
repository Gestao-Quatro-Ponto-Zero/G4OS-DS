import type { ReactNode } from "react";
import { cn } from "@g4ai/ds";
import { CodeBlock, DocPage, DocSection, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Anatomia de página",
  group: "Navegação",
  order: 2,
  description: "Nove anatomias decidem o que fica fixo, o que rola e onde fica cada coisa. Escolha a anatomia antes dos componentes — é o que faz CRM, ATS e ERP parecerem o mesmo produto.",
};

/* Mini-diagramas: dourado = fixo; hachurado = rola. */
function Fixed({ children, className }: { children?: ReactNode; className?: string }) {
  return <div className={cn("flex items-center rounded-[4px] border border-accent/50 bg-accent-soft px-1.5 text-[10px] font-medium text-accent-deep", className)}>{children}</div>;
}
function Scroll({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <div
      className={cn("flex items-start rounded-[4px] border border-line-strong px-1.5 pt-1 text-[10px] text-muted", className)}
      style={{ backgroundImage: "repeating-linear-gradient(135deg, color-mix(in oklab, var(--ds-ink) 7%, transparent) 0 1px, transparent 1px 7px)" }}
    >
      {children}
    </div>
  );
}
function Frame({ children, shell = true }: { children: ReactNode; shell?: boolean }) {
  return (
    <div className="flex h-44 gap-1.5 rounded-lg border border-line bg-page p-1.5">
      {shell && <div className="w-7 shrink-0 rounded-[4px] border border-line bg-rail" title="Casca do app" />}
      <div className="flex min-w-0 flex-1 flex-col gap-1">{children}</div>
    </div>
  );
}

const anatomies: { key: string; title: string; fixed: string; scroll: string; examples: string; diagram: ReactNode }[] = [
  {
    key: "A",
    title: "Lista",
    fixed: "Cabeçalho + PageToolbar colada (visões, filtros, busca)",
    scroll: "A página — ou a grade (DataGrid com maxHeight) quando há totais/colunas fixas",
    examples: "saas-customers · erp-invoices · crm-contacts · erp-orders",
    diagram: (
      <Frame>
        <Fixed className="h-6">Título · ação primária</Fixed>
        <Fixed className="h-5">Visões · filtros · busca</Fixed>
        <Scroll className="flex-1">linhas…</Scroll>
      </Frame>
    ),
  },
  {
    key: "B",
    title: "Painel",
    fixed: "Cabeçalho com período à direita",
    scroll: "A página",
    examples: "saas-dashboard · erp-dashboard · crm-sales-dashboard",
    diagram: (
      <Frame>
        <Fixed className="h-6 justify-between">Título <span>período ▾</span></Fixed>
        <Scroll className="flex-1">
          <div className="grid w-full grid-cols-4 gap-1">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="h-4 rounded-[3px] border border-line bg-surface" />
            ))}
            <span className="col-span-3 h-14 rounded-[3px] border border-line bg-surface" />
            <span className="h-14 rounded-[3px] border border-line bg-surface" />
          </div>
        </Scroll>
      </Frame>
    ),
  },
  {
    key: "C",
    title: "Registro",
    fixed: "Trilha + título + estado + ações; coluna de propriedades no desktop",
    scroll: "Conteúdo principal (abas, feed, itens)",
    examples: "crm-deal · saas-customer · ats-candidate · erp-order",
    diagram: (
      <Frame>
        <Fixed className="h-7">Trilha › Título · ações</Fixed>
        <div className="flex min-h-0 flex-1 gap-1">
          <Scroll className="flex-1">abas · feed…</Scroll>
          <Fixed className="w-14 items-start pt-1">props</Fixed>
        </div>
      </Frame>
    ),
  },
  {
    key: "D",
    title: "Configurações",
    fixed: "Título + subnavegação colada abaixo",
    scroll: "Só o conteúdo da seção",
    examples: "settings-* · crm-settings",
    diagram: (
      <Frame>
        <Fixed className="h-6">Configurações</Fixed>
        <div className="flex min-h-0 flex-1 gap-1">
          <Fixed className="w-14 items-start pt-1">seções</Fixed>
          <Scroll className="flex-1">seção…</Scroll>
        </div>
      </Frame>
    ),
  },
  {
    key: "E",
    title: "Quadro",
    fixed: "Cabeçalho; a página não rola no desktop",
    scroll: "Quadro na horizontal, colunas na vertical",
    examples: "crm-pipeline · ats-pipeline",
    diagram: (
      <Frame>
        <Fixed className="h-6">Título · filtros</Fixed>
        <div className="flex min-h-0 flex-1 gap-1 overflow-hidden">
          {[0, 1, 2, 3].map((i) => (
            <Scroll key={i} className="w-12 shrink-0">↕</Scroll>
          ))}
          <span className="self-center text-[10px] text-muted">→</span>
        </div>
      </Frame>
    ),
  },
  {
    key: "F",
    title: "Mestre-detalhe",
    fixed: "Cabeçalho; seleção no endereço (?id=)",
    scroll: "Lista e detalhe, cada um o seu (lado a lado, não aninhados)",
    examples: "erp-purchase-requests · saas-support · fin-reconciliation",
    diagram: (
      <Frame>
        <Fixed className="h-6">Título</Fixed>
        <div className="flex min-h-0 flex-1 gap-1">
          <Scroll className="w-20">lista</Scroll>
          <Scroll className="flex-1">detalhe</Scroll>
        </div>
      </Frame>
    ),
  },
  {
    key: "G",
    title: "App de altura total",
    fixed: "Casca, cabeçalho da área, composer",
    scroll: "Só a thread / lista / canvas",
    examples: "ai-chat · ai-agent-builder · app-file-manager",
    diagram: (
      <Frame>
        <Fixed className="h-5">área</Fixed>
        <div className="flex min-h-0 flex-1 gap-1">
          <Scroll className="flex-1">thread…</Scroll>
          <Scroll className="w-16">painel</Scroll>
        </div>
        <Fixed className="h-6">composer</Fixed>
      </Frame>
    ),
  },
  {
    key: "H",
    title: "Fluxo focado",
    fixed: "Rodapé de passos (assistente)",
    scroll: "O documento; sem navegação do app",
    examples: "auth-* · onboarding-wizard",
    diagram: (
      <Frame shell={false}>
        <div className="flex flex-1 items-center justify-center">
          <Scroll className="h-24 w-28 justify-center">cartão</Scroll>
        </div>
        <Fixed className="h-5 justify-end">Voltar · Continuar</Fixed>
      </Frame>
    ),
  },
  {
    key: "I",
    title: "Público",
    fixed: "Cabeçalho do site",
    scroll: "O documento (sem casca de app)",
    examples: "marketing-landing · marketing-pricing · ats-careers",
    diagram: (
      <Frame shell={false}>
        <Fixed className="h-5">site · entrar</Fixed>
        <Scroll className="flex-1">hero · seções · CTA…</Scroll>
      </Frame>
    ),
  },
];

export default function Page() {
  return (
    <DocPage title={meta.title} kicker="Navegação" description={meta.description}>
      <DocSection
        title="As nove anatomias"
        rule={
          <>
            <span className="mr-3 inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-[2px] border border-accent/50 bg-accent-soft" /> fixo
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-[2px] border border-line-strong" style={{ backgroundImage: "repeating-linear-gradient(135deg, color-mix(in oklab, var(--ds-ink) 20%, transparent) 0 1px, transparent 1px 3px)" }} /> rola
            </span>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {anatomies.map((a) => (
            <article key={a.key} className="rounded-xl border border-line bg-surface p-3">
              {a.diagram}
              <h3 className="m-0 mt-3 text-[14px] font-semibold">
                <span className="mr-1.5 text-muted">{a.key}</span>
                {a.title}
              </h3>
              <dl className="m-0 mt-1.5 space-y-1 text-[12.5px]">
                <div>
                  <dt className="inline font-medium text-accent-deep">Fixo: </dt>
                  <dd className="inline text-ink-soft">{a.fixed}</dd>
                </div>
                <div>
                  <dt className="inline font-medium text-ink">Rola: </dt>
                  <dd className="inline text-ink-soft">{a.scroll}</dd>
                </div>
              </dl>
              <p className="m-0 mt-2 font-mono text-[11px] text-muted">{a.examples}</p>
            </article>
          ))}
        </div>
      </DocSection>

      <DocSection title="Regras que valem para todas">
        <Rules
          items={[
            { do: "Cabeçalho da página fixo em toda página que rola; ele compacta ao grudar.", dont: "sticky={false} numa página que rola: o título some e o resto perde contexto." },
            { do: "O que é da página fica junto: filtros (PageToolbar), subnavegação e propriedades grudam colados ao cabeçalho.", dont: "Um elemento fixo cujo contexto rolou embora (subnavegação sem o título)." },
            { do: "PageHeading direto dentro de <Page>; se precisar de classe no invólucro, use `contents`.", dont: "<div className=\"no-print\"><PageHeading/></div> — o sticky fica preso ao div." },
            { do: "Uma rolagem por eixo. No celular, sempre a página (DataGrid ignora maxHeight < 640px).", dont: "Tabela rolando dentro de página rolando no celular." },
            { do: "Coluna estreita (configuração, automações, formulário): <Page width=\"narrow\">. Cabeçalho e corpo ficam no mesmo eixo.", dont: "<Page><PageHeading/><div className=\"mx-auto max-w-4xl\">…</div></Page> — o título fica à esquerda e o conteúdo centrado." },
            { do: "Uma ação primária por área, à direita do título.", dont: "Duas ações primárias competindo no mesmo cabeçalho." },
            { do: "Barras de ação (BulkBar, alterações não salvas) no rodapé da área, só quando há o que fazer.", dont: "Botões de salvar no topo de formulário longo." },
          ]}
        />
      </DocSection>

      <DocSection title="Peças de layout">
        <CodeBlock
          code={`// A · Lista
<Page>
  <PageHeading title="Clientes" actions={<Button>Novo cliente</Button>} />
  <PageToolbar>            {/* gruda colada ao cabeçalho */}
    <SavedViews … />
    <FilterBar … search={<TableSearch … />} />
  </PageToolbar>
  <DataTable … />
</Page>

// C · Registro: a coluna de propriedades gruda abaixo do cabeçalho no desktop
<SplitLayout main={…} aside={<PropertyList … />} />   // stickyAside={false} para rolar junto

// Largura do conteúdo: cabeçalho, barra e corpo juntos (full · wide 1200 · medium 1024 · narrow 896 · reading 720)
<Page width="narrow">
  <PageHeading title="Automações" />
  <Card>…</Card>
</Page>

// D · Configurações: título fixo + subnavegação colada
<Page><SettingsLayout nav={…} current={…} title="Plano e cobrança">…</SettingsLayout></Page>`}
        />
      </DocSection>

      <DocSection title="Declare a anatomia no bloco" rule="A aba Conceito de cada bloco lê meta.concept. Comece os padrões pela anatomia — quem copia entende a intenção antes do código.">
        <CodeBlock
          code={`export const meta = {
  title: "Lista de clientes",
  category: "SaaS",
  concept: {
    goal: "Achar e agir sobre contas em escala: quem está em risco, quem pode expandir.",
    patterns: ["Anatomia A · Lista: cabeçalho fixo + PageToolbar colada", "Visões salvas por pergunta de negócio", "Seleção em massa com BulkBar"],
    adapt: ["CRM (empresas), ERP (clientes B2B): troque colunas e visões"],
    avoid: ["Filtros fora da PageToolbar (somem ao rolar)"],
  },
} as const;`}
        />
      </DocSection>
    </DocPage>
  );
}
