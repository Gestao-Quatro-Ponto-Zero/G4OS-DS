import { BarChart3, Bell, Briefcase, Building2, Clock, FilePlus2, FileText, FolderOpen, Home, Inbox, LogOut, Moon, Palette, Search, Settings, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import {
  Card,
  CommandPalette,
  Kbd,
  ListPanel,
  ListRow,
  Page,
  PageHeading,
  useCommandShortcut,
  useTheme,
  type Command } from "@g4ai/ds";
import { me } from "./data/workspace";
import { AtlasShell, atlasRoutes } from "./shells/atlas-shell";
import { frameHref, goTo } from "./shells/frame-route";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Paleta de comandos (⌘K)",
  description: "App com a paleta aberta: navegar, criar e achar registros pelo teclado. Busca sem acento, recentes, grupos e atalhos.",
  category: "Aplicação",
  order: 3,
  height: 760,
  concept: {
    goal: "Navegar, criar e achar registros pelo teclado sem tirar a mão dele, para quem usa o app o dia inteiro.",
    patterns: [
      "⌘K abre uma paleta sobre qualquer tela",
      "Grupos (navegar, criar, registros), busca sem acento, recentes e atalhos visíveis",
      "Enter executa, Esc fecha; a tela de fundo não muda",
    ],
    adapt: [
      "Qualquer produto do DS: registre os comandos do produto e os atalhos de criação",
    ],
    avoid: [
      "Paleta com ações sem atalho nem grupo (vira lista sem ordem)",
    ],
  },
} as const;

/* ------------------------------------------------------------------ */
/* Dados de exemplo                                                    */
/* ------------------------------------------------------------------ */

// Cada comando leva a uma tela real (troque goTo pelo router do seu app).
const to = (href: string) => () => goTo(href);
const baseCommands: Command[] = [
  { id: "inicio", group: "Navegar", label: "Início", icon: <Home />, shortcut: ["G", "I"], onSelect: to(atlasRoutes.home) },
  { id: "notificacoes", group: "Navegar", label: "Notificações", icon: <Bell />, shortcut: ["G", "A"], keywords: ["avisos", "alertas"], onSelect: to(atlasRoutes.notifications) },
  { id: "chamados", group: "Navegar", label: "Chamados", icon: <Inbox />, keywords: ["suporte", "tickets", "atendimento"], onSelect: to(atlasRoutes.tickets) },
  { id: "arquivos", group: "Navegar", label: "Arquivos", icon: <FolderOpen />, keywords: ["documentos", "drive"], onSelect: to(atlasRoutes.files) },
  { id: "negocios", group: "Navegar", label: "Negócios", icon: <Briefcase />, shortcut: ["G", "N"], keywords: ["pipeline", "deals", "oportunidades", "crm"], onSelect: to(frameHref("crm-pipeline")) },
  { id: "contatos", group: "Navegar", label: "Empresas e contatos", icon: <Users />, shortcut: ["G", "C"], keywords: ["pessoas", "leads"], onSelect: to(frameHref("crm-contacts")) },
  { id: "relatorios", group: "Navegar", label: "Painel de vendas", icon: <BarChart3 />, keywords: ["dashboard", "métricas", "relatórios"], onSelect: to(frameHref("crm-sales-dashboard")) },
  { id: "novo-chamado", group: "Criar", label: "Novo chamado", icon: <FilePlus2 />, shortcut: ["⌘", "N"], onSelect: to(frameHref("app-filtered-list", { novo: 1 })) },
  { id: "convidar", group: "Criar", label: "Convidar pessoa para o time", icon: <UserPlus />, onSelect: to(frameHref("settings-team")) },
  { id: "acme", group: "Empresas", label: "Acme Logística", hint: "São Paulo · 3 negócios", icon: <Building2 />, onSelect: to(frameHref("app-global-search")) },
  { id: "vertice", group: "Empresas", label: "Vértice Saúde", hint: "Belo Horizonte · 1 negócio", icon: <Building2 />, onSelect: to(frameHref("app-global-search")) },
  { id: "proposta", group: "Documentos", label: "Proposta comercial — Acme", hint: "PDF · ontem", icon: <FileText />, onSelect: to(frameHref("app-file-manager", { id: "1" })) },
  { id: "config", group: "Preferências", label: "Configurações", icon: <Settings />, shortcut: ["⌘", ","], onSelect: to(atlasRoutes.settings) },
  { id: "aparencia", group: "Preferências", label: "Aparência e marca", icon: <Palette />, keywords: ["tema", "cores", "white-label"], onSelect: to(frameHref("settings-appearance")) },
  { id: "sair", group: "Preferências", label: "Sair", icon: <LogOut />, onSelect: to(frameHref("auth-login")) },
];

/* ------------------------------------------------------------------ */

export default function CommandPaletteBlock() {
  const [paletteOpen, setPaletteOpen] = useState(true);
  const theme = useTheme("light");
  useCommandShortcut(() => setPaletteOpen(true));
  const commands: Command[] = [
    ...baseCommands.slice(0, -1),
    { id: "tema", group: "Preferências", label: theme.resolved === "dark" ? "Usar tema claro" : "Usar tema escuro", icon: <Moon />, keywords: ["dark", "escuro", "claro"], onSelect: () => theme.setMode(theme.resolved === "dark" ? "light" : "dark") },
    baseCommands[baseCommands.length - 1],
  ];
  return (
    <AtlasShell current={atlasRoutes.home} onSearch={() => setPaletteOpen(true)}>
      <Page>
        <PageHeading
          title={`Bom dia, ${me.name.split(" ")[0]}`}
          description="Tudo aqui também está a um ⌘K de distância."
          actions={
            <button type="button" onClick={() => setPaletteOpen(true)} className="flex h-9 w-[260px] max-w-full items-center gap-2 rounded-lg border border-line bg-surface px-3 text-[13px] text-muted hover:border-line-strong">
              <Search className="h-3.5 w-3.5" />
              <span className="flex-1 text-left">Buscar ou executar…</span>
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </button>
          }
        />
        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
          <ListPanel title="Continuar de onde parou" icon={<Clock />} count={3}>
            <div className="divide-y divide-line">
              <ListRow href={frameHref("crm-deal")} kicker="Negócio · Proposta" title="Acme Logística — Frota 2027" meta="há 12 min" />
              <ListRow href={frameHref("crm-contacts")} kicker="Contato" title="Mariana Couto · Acme" meta="há 1 h" />
              <ListRow href={frameHref("crm-sales-dashboard")} kicker="Relatório" title="Forecast de outubro" meta="ontem" />
            </div>
          </ListPanel>
          <div className="grid gap-3">
            {(
              [
                ["Novo chamado", "⌘ N", "novo-chamado"],
                ["Ir para contatos", "G C", "contatos"],
                ["Configurações", "⌘ ,", "config"],
              ] as const
            ).map(([l, k, id]) => (
              <Card key={l} onClick={() => commands.find((c) => c.id === id)?.onSelect()}>
                <div className="flex items-center justify-between text-[13.5px]">
                  <span className="font-medium">{l}</span>
                  <span className="inline-flex gap-1">{k.split(" ").map((x) => <Kbd key={x}>{x}</Kbd>)}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Page>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} commands={commands} recent={["negocios", "acme", "novo-chamado"]} placeholder="Buscar negócios, contatos, empresas ou comandos…" />
    </AtlasShell>
  );
}
