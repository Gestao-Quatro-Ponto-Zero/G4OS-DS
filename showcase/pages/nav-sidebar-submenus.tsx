import { Archive, BarChart3, Bell, Building2, CreditCard, Flag, FolderKanban, Handshake, Home, LogOut, Map as MapIcon, Pencil, Rocket, Settings, Share2, User } from "lucide-react";
import { useState, type MouseEvent, type ReactNode } from "react";
import { IconRail, SectionNav, Sidebar, WorkspaceMenu, notify, type MenuEntry, type NavGroup, type NavSection, type Workspace } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Sidebar com subitens",
  group: "Navegação",
  order: 6,
  shadcn: "sidebar",
  description:
    "Itens com subitens que abrem e fecham, grupos recolhíveis com “+” e “Mais”, ações por item, seletor de workspace, menu da conta e, com a sidebar recolhida, os subitens num menu à direita. Para documentação longa, SectionNav.",
};

/* Rotas de mentira: os links levam a "#demo/<caminho>" e o clique só troca o estado. */
const r = (path: string) => ({ href: `#demo/${path}`, match: `/${path}` });

const actions = (name: string): MenuEntry[] => [
  { label: "Abrir", icon: <FolderKanban />, onSelect: () => notify(`Projeto ${name} aberto`) },
  { label: "Compartilhar", icon: <Share2 />, onSelect: () => notify(`Link de ${name} copiado`) },
  { label: "Renomear", icon: <Pencil />, onSelect: () => notify(`Projeto ${name} renomeado`) },
  { type: "separator" },
  { label: "Arquivar", icon: <Archive />, tone: "danger", onSelect: () => notify(`${name} arquivado`) },
];

const groups: NavGroup[] = [
  {
    label: "Plataforma",
    items: [
      { ...r(""), match: "/", label: "Início", icon: Home },
      { ...r("vendas"), label: "Vendas", icon: Handshake, items: [{ ...r("vendas/negocios"), label: "Negócios", badge: 3 }, { ...r("vendas/propostas"), label: "Propostas" }, { ...r("vendas/metas"), label: "Metas" }] },
      {
        label: "Cadastros",
        icon: Building2,
        items: [
          { ...r("cadastros/empresas"), label: "Empresas" },
          { ...r("cadastros/contatos"), label: "Contatos" },
          { ...r("cadastros/produtos"), label: "Produtos", items: [{ ...r("cadastros/produtos/categorias"), label: "Categorias" }, { ...r("cadastros/produtos/precos"), label: "Tabelas de preço" }] },
        ],
      },
      { ...r("relatorios"), label: "Relatórios", icon: BarChart3, items: [{ ...r("relatorios/receita"), label: "Receita" }, { ...r("relatorios/funil"), label: "Funil" }] },
      { label: "Configurações", icon: Settings, items: [{ ...r("config/geral"), label: "Geral" }, { ...r("config/equipe"), label: "Equipe" }, { ...r("config/faturamento"), label: "Faturamento" }] },
    ],
  },
  {
    label: "Projetos",
    collapsible: true,
    action: { label: "Novo projeto", onSelect: () => notify("Projeto criado") },
    limit: 3,
    items: [
      { ...r("projetos/expansao-sul"), label: "Expansão Sul", icon: MapIcon, actions: actions("Expansão Sul") },
      { ...r("projetos/renovacao"), label: "Renovação Enterprise", icon: Flag, actions: actions("Renovação Enterprise") },
      { ...r("projetos/lancamento"), label: "Lançamento Q4", icon: Rocket, actions: actions("Lançamento Q4") },
      { ...r("projetos/parcerias"), label: "Parcerias", icon: Handshake, actions: actions("Parcerias") },
      { ...r("projetos/migracao"), label: "Migração do CRM", icon: FolderKanban, actions: actions("Migração do CRM") },
    ],
  },
];

const workspaces: Workspace[] = [
  { id: "acme", name: "Acme Comercial", plan: "Enterprise" },
  { id: "logistica", name: "Acme Logística", plan: "Pro" },
  { id: "norte", name: "Estúdio Norte", plan: "Starter" },
];

const userMenu: MenuEntry[] = [
  { label: "Conta", icon: <User />, onSelect: () => notify("Conta aberta") },
  { label: "Faturamento", icon: <CreditCard />, onSelect: () => notify("Faturamento aberto") },
  { label: "Notificações", icon: <Bell />, onSelect: () => notify("Notificações abertas") },
  { type: "separator" },
  { label: "Sair", icon: <LogOut />, onSelect: () => notify("Sessão encerrada") },
];

const sections: NavSection[] = [
  { label: "Primeiros passos", items: [{ ...r("docs/instalacao"), label: "Instalação" }, { ...r("docs/estrutura"), label: "Estrutura do projeto" }] },
  {
    label: "Construindo o app",
    items: [
      { ...r("docs/rotas"), label: "Rotas" },
      { ...r("docs/dados"), label: "Buscar dados", items: [{ ...r("docs/dados/cache"), label: "Cache" }, { ...r("docs/dados/revalidar"), label: "Revalidar" }] },
      { ...r("docs/estilos"), label: "Estilos" },
      { ...r("docs/testes"), label: "Testes" },
      { ...r("docs/deploy"), label: "Publicar" },
    ],
  },
  { label: "Referência da API", items: [{ ...r("docs/componentes"), label: "Componentes" }, { ...r("docs/funcoes"), label: "Funções" }, { ...r("docs/cli"), label: "CLI" }] },
  { label: "Arquitetura", items: [{ ...r("docs/acessibilidade"), label: "Acessibilidade" }, { ...r("docs/seguranca"), label: "Segurança" }] },
];

/** Moldura de app: os links "#demo/…" só trocam o caminho (não saem da página). */
function Frame({ initial, children, className }: { initial: string; children: (path: string) => ReactNode; className?: string }) {
  const [path, setPath] = useState(initial);
  const onClickCapture = (e: MouseEvent) => {
    const a = (e.target as HTMLElement).closest("a");
    const href = a?.getAttribute("href");
    if (!href?.startsWith("#demo/")) return;
    e.preventDefault();
    setPath(`/${href.slice(6)}`);
  };
  return (
    <div onClickCapture={onClickCapture} className={className ?? "flex h-[540px] overflow-hidden rounded-xl border border-line"}>
      {children(path)}
      <div className="flex min-w-0 flex-1 flex-col gap-2 bg-page p-5">
        <p className="m-0 text-[11px] uppercase tracking-[0.08em] text-muted">Caminho atual</p>
        <code className="w-fit rounded-md bg-soft px-2 py-1 font-mono text-[12.5px] text-ink">{path}</code>
      </div>
    </div>
  );
}

const desktopOnly = <p className="m-0 text-[12.5px] text-muted md:hidden">A Sidebar aparece a partir de 768px; no celular ela abre pelo ☰ (veja “No celular”, abaixo).</p>;

export default function Page() {
  const [collapsed, setCollapsed] = useState(true);
  const [ws, setWs] = useState("acme");
  return (
    <DocPage title={meta.title} kicker="Navegação" description={meta.description}>
      <DocSection
        title="Subitens"
        rule="Item com `items` abre e fecha. Com `href`, o rótulo navega e a seta abre; sem `href` (Cadastros), a linha inteira abre. Um subitem ativo abre o pai sozinho; → entra nos subitens, ← volta."
      >
        <Demo
          bare
          code={`const groups: NavGroup[] = [{
  label: "Plataforma",
  items: [
    { href: "/", label: "Início", icon: Home },
    // pai com página própria: rótulo navega, seta abre
    { href: "/vendas", label: "Vendas", icon: Handshake, items: [
      { href: "/vendas/negocios", label: "Negócios", badge: 3 },
      { href: "/vendas/propostas", label: "Propostas" },
    ] },
    // pai sem página: a linha inteira abre e fecha
    { label: "Cadastros", icon: Building2, items: [
      { href: "/empresas", label: "Empresas" },
      { href: "/produtos", label: "Produtos", items: [ // 2º nível (máximo)
        { href: "/produtos/categorias", label: "Categorias" },
      ] },
    ] },
  ],
}];

<Sidebar product="Acme" groups={groups} currentPath={pathname} storageKey="acme:sidebar" />`}
        >
          <div className="hidden md:block">
            <Frame initial="/vendas/negocios">{(path) => <Sidebar product="Acme" workspace="Comercial" groups={groups} currentPath={path} storageKey="g4os-ds:doc-sidebar-sub" />}</Frame>
          </div>
          {desktopOnly}
        </Demo>
      </DocSection>

      <DocSection title="Recolhida: menu à direita" rule="Com `collapsed`, a sidebar fica só com ícones. Item com subitens abre um menu à direita ao passar o mouse, clicar ou usar → (o menu sai num portal: nunca é cortado). Itens sem subitens mantêm o nome no tooltip.">
        <Demo bare code={`<Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} groups={groups} currentPath={pathname} />`}>
          <div className="hidden md:block">
            <Frame initial="/relatorios/funil">
              {(path) => (
                <Sidebar
                  product="Acme"
                  header={<WorkspaceMenu workspaces={workspaces} value={ws} onValueChange={setWs} collapsed={collapsed} shortcuts={false} />}
                  groups={groups}
                  currentPath={path}
                  collapsed={collapsed}
                  onToggle={() => setCollapsed((c) => !c)}
                  user={{ name: "Ana Lopes", email: "ana.lopes@acme.com.br", menu: userMenu }}
                />
              )}
            </Frame>
          </div>
          {desktopOnly}
        </Demo>
      </DocSection>

      <DocSection title="Grupos: recolher, criar e “Mais”" rule="`collapsible` transforma o rótulo do grupo num botão; `action` põe um + ao lado (Novo projeto); `limit` mostra os N primeiros e o resto em “Mais”; `actions` no item abre ⋯ no hover/foco (sempre visível em tela de toque).">
        <Demo
          bare
          code={`{
  label: "Projetos",
  collapsible: true,
  action: { label: "Novo projeto", onSelect: criarProjeto },
  limit: 3,
  items: projetos.map((p) => ({
    href: \`/projetos/\${p.id}\`, label: p.nome, icon: Folder,
    actions: [
      { label: "Compartilhar", icon: <Share2 />, onSelect: () => compartilhar(p) },
      { type: "separator" },
      { label: "Arquivar", icon: <Archive />, tone: "danger", onSelect: () => arquivar(p) },
    ],
  })),
}`}
        >
          <div className="hidden md:block">
            <Frame initial="/projetos/renovacao" className="flex h-[400px] overflow-hidden rounded-xl border border-line">
              {(path) => <Sidebar product="Acme" groups={[groups[1]]} currentPath={path} />}
            </Frame>
          </div>
          {desktopOnly}
        </Demo>
      </DocSection>

      <DocSection title="Workspace e conta" rule="`header` troca a marca por um WorkspaceMenu (logo, nome, plano; ⌘1…⌘9 trocam de workspace). `user.menu` faz o rodapé abrir o menu da conta (à direita no desktop, para cima no celular).">
        <Demo
          bare
          code={`<Sidebar
  header={<WorkspaceMenu workspaces={workspaces} value={ws} onValueChange={setWs} onAdd={criarWorkspace} collapsed={collapsed} />}
  user={{ name: "Ana Lopes", email: "ana@acme.com.br", menu: [
    { label: "Conta", icon: <User />, href: "/conta" },
    { label: "Faturamento", icon: <CreditCard />, href: "/conta/faturamento" },
    { type: "separator" },
    { label: "Sair", icon: <LogOut />, onSelect: sair },
  ] }}
  …
/>`}
        >
          <div className="hidden md:block">
            <Frame initial="/" className="flex h-[440px] overflow-hidden rounded-xl border border-line">
              {(path) => (
                <Sidebar
                  product="Acme"
                  header={<WorkspaceMenu workspaces={workspaces} value={ws} onValueChange={setWs} onAdd={() => notify("Workspace criado")} shortcuts={false} />}
                  groups={[groups[0]]}
                  currentPath={path}
                  user={{ name: "Ana Lopes", email: "ana.lopes@acme.com.br", menu: userMenu }}
                />
              )}
            </Frame>
          </div>
          {desktopOnly}
        </Demo>
      </DocSection>

      <DocSection title="Navegação longa: SectionNav" rule="Documentação, central de ajuda, configurações com 20+ páginas: só texto, títulos de seção, subitens na linha-guia, filtro opcional fixo e o item ativo sempre visível. Na Sidebar, passe em `nav`; numa página, ponha numa coluna com altura definida.">
        <Demo
          bare
          code={`const sections: NavSection[] = [
  { label: "Primeiros passos", items: [{ href: "/docs/instalacao", label: "Instalação" }] },
  { label: "Construindo o app", items: [
    { href: "/docs/dados", label: "Buscar dados", items: [{ href: "/docs/dados/cache", label: "Cache" }] },
  ] },
];

<Sidebar product="Docs" currentPath={pathname} nav={<SectionNav sections={sections} currentPath={pathname} search onNavigate={close} />} />
// ou numa coluna da página:
<SectionNav sections={sections} currentPath={pathname} className="h-[calc(100dvh-64px)] sticky top-0" />`}
        >
          <Frame initial="/docs/dados/cache" className="flex h-[460px] overflow-hidden rounded-xl border border-line">
            {(path) => (
              <div className="flex w-[240px] shrink-0 flex-col border-r border-line bg-rail p-2.5 max-sm:w-[190px]">
                <SectionNav sections={sections} currentPath={path} search />
              </div>
            )}
          </Frame>
        </Demo>
      </DocSection>

      <DocSection title="No celular" rule="A Sidebar vira gaveta (☰) e mostra tudo aberto como no desktop. Passe `onNavigate={close}` (o AppShell entrega `close`) para a gaveta fechar ao tocar num item.">
        <Demo bare code={`<AppShell sidebar={({ mobileOpen, close }) => <Sidebar … mobileOpen={mobileOpen} onNavigate={close} />}>`}>
          <div className="mx-auto h-[560px] w-[290px] overflow-hidden rounded-[32px] border-[6px] border-ink/85 bg-page [transform:translateZ(0)]">
            <div className="flex h-12 items-center border-b border-line bg-surface px-4 text-[13px] font-semibold">Acme</div>
            <Frame initial="/cadastros/produtos/precos" className="h-full">
              {(path) => <Sidebar product="Acme" groups={groups} currentPath={path} mobileOpen user={{ name: "Ana Lopes", email: "ana.lopes@acme.com.br", menu: userMenu }} />}
            </Frame>
          </div>
        </Demo>
      </DocSection>

      <DocSection title="IconRail com subitens" rule="O trilho de ícones (apps de foco: agente, editor) aceita `items` no RailItem: o ícone abre o mesmo menu à direita.">
        <Demo bare code={`<IconRail groups={[[{ href: "/", label: "Início", icon: Home }, { href: "/relatorios", label: "Relatórios", icon: BarChart3, items: [{ href: "/relatorios/receita", label: "Receita" }] }]]} currentPath={pathname} />`}>
          <div className="hidden md:block">
            <Frame initial="/relatorios/receita" className="flex h-[260px] overflow-hidden rounded-xl border border-line">
              {(path) => (
                <IconRail
                  currentPath={path}
                  groups={[
                    [
                      { ...r(""), match: "/", label: "Início", icon: Home },
                      { ...r("relatorios"), label: "Relatórios", icon: BarChart3, items: [{ ...r("relatorios/receita"), label: "Receita" }, { ...r("relatorios/funil"), label: "Funil" }] },
                      { label: "Configurações", icon: Settings, href: "#demo/config/geral", match: "/config", items: [{ ...r("config/geral"), label: "Geral" }, { ...r("config/equipe"), label: "Equipe" }] },
                    ],
                  ]}
                />
              )}
            </Frame>
          </div>
          {desktopOnly}
        </Demo>
      </DocSection>

      <DocSection title="API">
        <PropsTable
          rows={[
            ["NavItem.items", "NavSubItem[]", "—", "Subitens (2–7). Cada um aceita mais um nível de `items` (o último)."],
            ["NavItem.defaultOpen", "boolean", "false", "Começa aberto. Com um subitem ativo, abre sozinho."],
            ["NavItem.actions", "MenuEntry[]", "—", "Menu ⋯ do item (hover/foco; sempre visível no toque)."],
            ["NavParentItem", "{ label, icon, items }", "—", "Item-pai sem página: sem `href`, a linha inteira abre e fecha."],
            ["NavGroup.collapsible", "boolean", "false", "Rótulo do grupo vira botão que recolhe."],
            ["NavGroup.action", "{ label, icon?, onSelect?, href? }", "—", "Botão + ao lado do rótulo."],
            ["NavGroup.limit", "number", "—", "Mostra N itens; o resto em “Mais”."],
            ["Sidebar.header", "ReactNode", "marca", "Ex.: WorkspaceMenu."],
            ["Sidebar.nav", "ReactNode", "grupos", "Navegação livre (SectionNav) no lugar dos grupos."],
            ["Sidebar.user.menu", "MenuEntry[]", "—", "Rodapé abre o menu da conta. Também: `email`, `avatar`."],
            ["Sidebar.storageKey", "string", "—", "Guarda o que está aberto no localStorage."],
            ["Sidebar.onNavigate", "() => void", "—", "Chamado ao clicar num destino (feche a gaveta)."],
            ["WorkspaceMenu", "workspaces, value, onValueChange, onAdd?, collapsed?, shortcuts?", "—", "Seletor de workspace com ⌘1…⌘9."],
            ["SectionNav", "sections, currentPath, search?, onNavigate?", "—", "Navegação longa de seções, só texto."],
          ]}
        />
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Item-pai com nome de área (substantivo): Cadastros, Vendas, Contas.", dont: "Verbo no pai (“Gerenciar cadastros”) ou subitem que repete o pai (Vendas → Vendas)." },
            { do: "2 a 7 subitens; no máximo 2 níveis abaixo do item.", dont: "Árvore funda: a partir do 3º nível, vire abas na página ou SectionNav." },
            { do: "Subitens = páginas irmãs que a pessoa alterna. Abas = seções de UM registro.", dont: "Subitem para filtro ou estado (“Abertos”, “Fechados”): isso é visão salva na lista." },
            { do: "Pai com `href` quando existe uma visão geral da área.", dont: "Pai com `href` que leva a uma página vazia só para não ficar sem destino." },
            { do: "SectionNav para documentação e ajuda (muitos itens, sem ícone).", dont: "Sidebar com 30 itens com ícone." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
