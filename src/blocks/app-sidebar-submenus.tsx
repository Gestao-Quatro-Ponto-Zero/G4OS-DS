import {
  Archive,
  BarChart3,
  Bell,
  Building2,
  CreditCard,
  Flag,
  FolderKanban,
  Handshake,
  Home,
  LogOut,
  Map as MapIcon,
  Pencil,
  Rocket,
  Search,
  Settings,
  Share2,
  User,
} from "lucide-react";
import { useState } from "react";
import {
  AppShell,
  Button,
  Card,
  IconButton,
  Page,
  PageHeading,
  Sidebar,
  WorkspaceMenu,
  navActiveDeep,
  notify,
  type MenuEntry,
  type NavGroup,
  type NavSubItem,
  type Workspace,
} from "@g4ai/ds";
import { frameHref, useFrameParam } from "./shells/frame-route";

export const meta = {
  title: "Sidebar com subitens",
  description:
    "Menu com subitens que abrem e fecham, grupo de projetos recolhível com “+”, ações por item e “Mais”, seletor de workspace no topo, menu da conta no rodapé e, recolhido, os subitens num menu flutuante à direita.",
  category: "Aplicação",
  order: 10,
  height: 820,
  concept: {
    goal: "Navegar num app com muitas áreas sem passar de 10 itens visíveis: agrupar páginas irmãs sob um item-pai que abre e fecha.",
    patterns: [
      "Casca de app (AppShell + Sidebar) com grupos rotulados; anatomia de cada página: Painel ou Lista",
      "Item-pai com página própria (Vendas, Relatórios): o rótulo navega, a seta abre os subitens",
      "Item-pai sem página (Cadastros, Configurações): a linha inteira abre e fecha",
      "Subitem ativo abre o pai sozinho; o pai mostra que há um filho ativo",
      "Grupo Projetos recolhível, com “+” (novo projeto), ⋯ por item e “Mais” depois de 3",
      "Recolhido (botão ⇤): ícones; item com subitens abre um menu à direita (hover, clique ou →)",
      "Topo: WorkspaceMenu (⌘1…⌘9); rodapé: menu da conta",
    ],
    adapt: [
      "ERP: Cadastros → Clientes, Fornecedores, Produtos; Financeiro → A pagar, A receber",
      "CRM: Vendas → Negócios, Propostas, Metas; Projetos vira Carteiras ou Times",
      "Portal com várias empresas: WorkspaceMenu troca a empresa; o resto não muda",
    ],
    avoid: [
      "Mais de 2 níveis abaixo do item (vire páginas com abas ou SectionNav)",
      "Mais de 7 subitens por item: divida em dois itens-pai",
      "Item-pai com verbo (“Gerenciar…”): o rótulo é um substantivo (área)",
      "Subitem que repete o pai (“Vendas → Vendas”): use “Visão geral” ou dê href ao pai",
    ],
  },
} as const;

const SLUG = "app-sidebar-submenus";
/** Rota de exemplo: `?p=vendas/negocios` vira o caminho "/vendas/negocios". */
const r = (path: string) => ({ href: frameHref(SLUG, path ? { p: path } : undefined), match: `/${path}` });
const sub = (path: string, label: string, extra: Partial<NavSubItem> = {}): NavSubItem => ({ ...r(path), label, ...extra });

const projectActions = (name: string): MenuEntry[] => [
  { label: "Abrir", icon: <FolderKanban />, onSelect: () => notify(`Projeto ${name} aberto`) },
  { label: "Compartilhar", icon: <Share2 />, onSelect: () => notify(`Link de ${name} copiado`) },
  { label: "Renomear", icon: <Pencil />, onSelect: () => notify(`Projeto ${name} renomeado`) },
  { type: "separator" },
  { label: "Arquivar", icon: <Archive />, tone: "danger", onSelect: () => notify(`${name} arquivado`, () => notify(`${name} restaurado`)) },
];

const groups: NavGroup[] = [
  {
    label: "Plataforma",
    items: [
      { ...r(""), match: "/", label: "Início", icon: Home },
      {
        ...r("vendas"),
        label: "Vendas",
        icon: Handshake,
        items: [sub("vendas/negocios", "Negócios", { badge: 3 }), sub("vendas/propostas", "Propostas"), sub("vendas/metas", "Metas")],
      },
      {
        label: "Cadastros",
        icon: Building2,
        items: [
          sub("cadastros/empresas", "Empresas"),
          sub("cadastros/contatos", "Contatos"),
          sub("cadastros/produtos", "Produtos", { items: [sub("cadastros/produtos/categorias", "Categorias"), sub("cadastros/produtos/precos", "Tabelas de preço")] }),
        ],
      },
      {
        ...r("relatorios"),
        label: "Relatórios",
        icon: BarChart3,
        items: [sub("relatorios/receita", "Receita"), sub("relatorios/funil", "Funil"), sub("relatorios/atividades", "Atividades")],
      },
      {
        label: "Configurações",
        icon: Settings,
        items: [sub("config/geral", "Geral"), sub("config/equipe", "Equipe"), sub("config/faturamento", "Faturamento"), sub("config/integracoes", "Integrações")],
      },
    ],
  },
  {
    label: "Projetos",
    collapsible: true,
    action: { label: "Novo projeto", onSelect: () => notify("Projeto criado") },
    limit: 3,
    items: [
      { ...r("projetos/expansao-sul"), label: "Expansão Sul", icon: MapIcon, actions: projectActions("Expansão Sul") },
      { ...r("projetos/renovacao"), label: "Renovação Enterprise", icon: Flag, actions: projectActions("Renovação Enterprise") },
      { ...r("projetos/lancamento-q4"), label: "Lançamento Q4", icon: Rocket, actions: projectActions("Lançamento Q4") },
      { ...r("projetos/parcerias"), label: "Parcerias", icon: Handshake, actions: projectActions("Parcerias") },
      { ...r("projetos/migracao"), label: "Migração do CRM", icon: FolderKanban, actions: projectActions("Migração do CRM") },
    ],
  },
];

const workspaces: Workspace[] = [
  { id: "acme", name: "Acme Comercial", plan: "Enterprise" },
  { id: "logistica", name: "Acme Logística", plan: "Pro" },
  { id: "norte", name: "Estúdio Norte", plan: "Starter" },
];

const userMenu: MenuEntry[] = [
  { label: "Conta", icon: <User />, href: r("conta").href },
  { label: "Faturamento", icon: <CreditCard />, href: r("config/faturamento").href },
  { label: "Notificações", icon: <Bell />, href: r("conta/notificacoes").href },
  { type: "separator" },
  { label: "Sair", icon: <LogOut />, onSelect: () => notify("Sessão encerrada") },
];

/** Rótulo e caminho (trilha) da rota atual, procurando na árvore. */
function findTrail(path: string): string[] {
  const walk = (list: { label: string; match?: string; items?: NavSubItem[] }[], trail: string[]): string[] | null => {
    for (const it of list) {
      if (it.match === path) return [...trail, it.label];
      const found = it.items && walk(it.items, [...trail, it.label]);
      if (found) return found;
    }
    return null;
  };
  for (const g of groups) {
    const found = walk(g.items, []);
    if (found) return found;
  }
  return path === "/conta" ? ["Conta"] : path === "/conta/notificacoes" ? ["Conta", "Notificações"] : ["Início"];
}

export default function SidebarSubmenusBlock() {
  const p = useFrameParam("p", "");
  const path = `/${p}`;
  const [collapsed, setCollapsed] = useState(false);
  const [ws, setWs] = useState("acme");
  const trail = findTrail(path);
  const title = trail[trail.length - 1];
  const parent = groups.flatMap((g) => g.items).find((it) => it.items && navActiveDeep(it, path));
  const siblings = parent?.items ?? [];
  return (
    <AppShell
      product="Acme"
      workspace={workspaces.find((w) => w.id === ws)?.name}
      currentPath={path}
      headerActions={
        <IconButton label="Buscar" onClick={() => notify("Busca aberta")}>
          <Search />
        </IconButton>
      }
      sidebar={({ mobileOpen, close }) => (
        <Sidebar
          product="Acme"
          header={<WorkspaceMenu workspaces={workspaces} value={ws} onValueChange={setWs} onAdd={() => notify("Workspace criado")} collapsed={collapsed && !mobileOpen} />}
          groups={groups}
          currentPath={path}
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
          mobileOpen={mobileOpen}
          onNavigate={close}
          storageKey="g4os-ds:demo-sidebar-submenus"
          user={{ name: "Ana Lopes", email: "ana.lopes@acme.com.br", menu: userMenu }}
        />
      )}
    >
      <Page width="wide">
        <PageHeading
          title={title}
          description={trail.length > 1 ? trail.slice(0, -1).join(" › ") : "Página inicial do workspace"}
          actions={
            <Button variant="ghost" onClick={() => setCollapsed((c) => !c)} className="max-md:hidden">
              {collapsed ? "Expandir menu" : "Recolher menu"}
            </Button>
          }
        />
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <Card className="p-5">
            <h2 className="m-0 text-[15px] font-semibold">Como esta navegação funciona</h2>
            <ul className="m-0 mt-3 list-disc space-y-1.5 pl-5 text-[13.5px] leading-relaxed text-ink-soft">
              <li>
                <strong className="font-medium text-ink">Vendas</strong> e <strong className="font-medium text-ink">Relatórios</strong> têm página própria: o rótulo navega, a seta abre os subitens.
              </li>
              <li>
                <strong className="font-medium text-ink">Cadastros</strong> e <strong className="font-medium text-ink">Configurações</strong> só agrupam: a linha inteira abre e fecha.
              </li>
              <li>Abrir um subitem abre o pai sozinho; ← volta ao pai e → entra nos subitens.</li>
              <li>Recolhido, o ícone de um item com subitens abre um menu à direita (passe o mouse, clique ou use →).</li>
              <li>Projetos: “+” cria, ⋯ abre as ações do projeto e “Mais” mostra o resto.</li>
            </ul>
          </Card>
          <Card className="p-5">
            <h2 className="m-0 text-[15px] font-semibold">{parent ? `Em ${parent.label}` : "Atalhos"}</h2>
            <ul className="m-0 mt-3 list-none space-y-1 p-0">
              {(siblings.length ? siblings : groups[0].items.filter((it) => it.items).map((it) => ({ href: it.items![0].href, label: it.label }))).map((s) => (
                <li key={s.href}>
                  <a href={s.href} className="flex min-h-9 items-center rounded-lg px-2.5 text-[13.5px] text-ink-soft hover:bg-soft hover:text-ink">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </Page>
    </AppShell>
  );
}
