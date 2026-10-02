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
import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AppShell,
  Button,
  Card,
  CommandPalette,
  IconButton,
  Modal,
  TextField,
  Page,
  PageHeading,
  Sidebar,
  WorkspaceMenu,
  navActiveDeep,
  notify,
  useCommandShortcut,
  type Command,
  type MenuEntry,
  type NavGroup,
  type NavSubItem,
  type Workspace,
} from "@g4ai/ds";
import { frameHref, goTo, useFrameParam } from "./shells/frame-route";

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

type Project = { slug: string; label: string; icon: LucideIcon };
const initialProjects: Project[] = [
  { slug: "expansao-sul", label: "Expansão Sul", icon: MapIcon },
  { slug: "renovacao", label: "Renovação Enterprise", icon: Flag },
  { slug: "lancamento-q4", label: "Lançamento Q4", icon: Rocket },
  { slug: "parcerias", label: "Parcerias", icon: Handshake },
  { slug: "migracao", label: "Migração do CRM", icon: FolderKanban },
];
const slugify = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const platform: NavGroup = {
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
};

const initialWorkspaces: Workspace[] = [
  { id: "acme", name: "Acme Comercial", plan: "Enterprise" },
  { id: "logistica", name: "Acme Logística", plan: "Pro" },
  { id: "norte", name: "Estúdio Norte", plan: "Starter" },
];

const userMenu: MenuEntry[] = [
  { label: "Conta", icon: <User />, href: r("conta").href },
  { label: "Faturamento", icon: <CreditCard />, href: r("config/faturamento").href },
  { label: "Notificações", icon: <Bell />, href: r("conta/notificacoes").href },
  { type: "separator" },
  { label: "Sair", icon: <LogOut />, onSelect: () => goTo(frameHref("auth-login")) },
];

/** Rótulo e caminho (trilha) da rota atual, procurando na árvore. */
function findTrail(path: string, groups: NavGroup[]): string[] {
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
  const [workspaces, setWorkspaces] = useState(initialWorkspaces);
  const [projects, setProjects] = useState(initialProjects);
  const [searchOpen, setSearchOpen] = useState(false);
  useCommandShortcut(() => setSearchOpen(true));
  // Um formulário curto para três gestos: novo projeto, renomear projeto, novo workspace.
  const [form, setForm] = useState<null | { kind: "projeto" | "renomear" | "workspace"; slug?: string; value: string; tried?: boolean }>(null);

  const projectActions = (pr: Project): MenuEntry[] => [
    { label: "Abrir", icon: <FolderKanban />, onSelect: () => goTo(r(`projetos/${pr.slug}`).href) },
    {
      label: "Copiar link",
      icon: <Share2 />,
      onSelect: () => {
        void navigator.clipboard?.writeText(`${location.origin}${location.pathname}${r(`projetos/${pr.slug}`).href}`).catch(() => undefined);
        notify(`Link de ${pr.label} copiado`);
      },
    },
    { label: "Renomear", icon: <Pencil />, onSelect: () => setForm({ kind: "renomear", slug: pr.slug, value: pr.label }) },
    { type: "separator" },
    {
      label: "Arquivar",
      icon: <Archive />,
      tone: "danger",
      onSelect: () => {
        const before = projects;
        setProjects((xs) => xs.filter((x) => x.slug !== pr.slug));
        if (path === `/projetos/${pr.slug}`) goTo(r("").href);
        notify(`${pr.label} arquivado`, () => setProjects(before));
      },
    },
  ];

  const groups: NavGroup[] = [
    platform,
    {
      label: "Projetos",
      collapsible: true,
      action: { label: "Novo projeto", onSelect: () => setForm({ kind: "projeto", value: "" }) },
      limit: 3,
      items: projects.map((pr) => ({ ...r(`projetos/${pr.slug}`), label: pr.label, icon: pr.icon, actions: projectActions(pr) })),
    },
  ];

  const commands = useMemo<Command[]>(() => {
    const out: Command[] = [];
    const add = (list: { label: string; href?: string; items?: NavSubItem[] }[], group: string, trail: string[]) =>
      list.forEach((it) => {
        if (it.href) out.push({ id: it.href, group, label: [...trail, it.label].join(" › "), onSelect: () => goTo(it.href!) });
        if (it.items) add(it.items, group, [...trail, it.label]);
      });
    add(platform.items, "Páginas", []);
    add(projects.map((pr) => ({ label: pr.label, href: r(`projetos/${pr.slug}`).href })), "Projetos", []);
    return out;
  }, [projects]);

  const submitForm = () => {
    if (!form) return;
    const name = form.value.trim();
    if (!name) return setForm({ ...form, tried: true });
    if (form.kind === "projeto") {
      const slug = slugify(name) || `projeto-${projects.length + 1}`;
      setProjects((xs) => [{ slug, label: name, icon: FolderKanban }, ...xs]);
      goTo(r(`projetos/${slug}`).href);
      notify(`Projeto ${name} criado`);
    } else if (form.kind === "renomear") {
      setProjects((xs) => xs.map((x) => (x.slug === form.slug ? { ...x, label: name } : x)));
      notify(`Projeto renomeado para ${name}`);
    } else {
      const id = slugify(name) || `ws-${workspaces.length + 1}`;
      setWorkspaces((xs) => [...xs, { id, name, plan: "Starter" }]);
      setWs(id);
      notify(`Workspace ${name} criado`);
    }
    setForm(null);
  };

  const trail = findTrail(path, groups);
  const title = trail[trail.length - 1];
  const parent = groups.flatMap((g) => g.items).find((it) => it.items && navActiveDeep(it, path));
  const siblings = parent?.items ?? [];
  return (
    <AppShell
      product="Acme"
      workspace={workspaces.find((w) => w.id === ws)?.name}
      currentPath={path}
      headerActions={
        <IconButton label="Buscar" onClick={() => setSearchOpen(true)}>
          <Search />
        </IconButton>
      }
      sidebar={({ mobileOpen, close }) => (
        <Sidebar
          product="Acme"
          header={<WorkspaceMenu workspaces={workspaces} value={ws} onValueChange={setWs} onAdd={() => setForm({ kind: "workspace", value: "" })} collapsed={collapsed && !mobileOpen} />}
          groups={groups}
          currentPath={path}
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
          mobileOpen={mobileOpen}
          onNavigate={close}
          onSearch={() => setSearchOpen(true)}
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
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} commands={commands} placeholder="Ir para uma página ou projeto…" />
      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.kind === "projeto" ? "Novo projeto" : form?.kind === "renomear" ? "Renomear projeto" : "Novo workspace"}
        description={form?.kind === "workspace" ? "Um espaço separado, com equipe e dados próprios. Dá para trocar com ⌘1…⌘9." : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setForm(null)}>
              Cancelar
            </Button>
            <Button onClick={submitForm}>{form?.kind === "projeto" ? "Criar projeto" : form?.kind === "renomear" ? "Salvar nome" : "Criar workspace"}</Button>
          </>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitForm();
          }}
        >
          <TextField
            label="Nome"
            value={form?.value ?? ""}
            onChange={(v) => form && setForm({ ...form, value: v })}
            placeholder={form?.kind === "workspace" ? "Ex.: Acme Varejo" : "Ex.: Expansão Nordeste"}
            error={form?.tried && !form.value.trim() ? "Dê um nome para continuar." : undefined}
            autoFocus
          />
        </form>
      </Modal>
    </AppShell>
  );
}
