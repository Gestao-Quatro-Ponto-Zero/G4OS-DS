import { Briefcase, Building2, FilePlus2, KanbanSquare, Keyboard, Moon, Package, Search, Settings, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  Kbd,
  Page,
  PageHeading,
  SearchPalette,
  formatCurrency,
  notify,
  useCommandShortcut,
  useTheme,
  type SearchResult,
  type SearchScope,
} from "@g4ai/ds";
import { deals as crmDeals } from "./data/crm";
import { me } from "./data/workspace";
import { AtlasShell, atlasRoutes } from "./shells/atlas-shell";
import { frameHref, goTo } from "./shells/frame-route";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Busca global (⌘K)",
  description: "Busca em todo o app: escopos (Tab, prefixos > @ #), resultados por tipo com destaque, prévia à direita, recentes, fonte remota com carregamento e “Ver todos” que abre a tabela filtrada.",
  category: "Aplicação",
  order: 2,
  height: 780,
  concept: {
    goal: "Achar qualquer coisa no app (registros, pessoas, ações) e ir direto para a tabela filtrada quando há muitos resultados.",
    patterns: [
      "⌘K com escopos (Tab, prefixos > @ #) e resultados por tipo com destaque",
      "Prévia à direita sem abrir o registro",
      "'Ver todos' abre a lista já filtrada (?q=)",
      "Fonte remota com carregamento e erro",
    ],
    adapt: [
      "Busca de qualquer produto: registre os tipos e a fonte de dados",
    ],
    avoid: [
      "Busca que só navega e não leva ao recorte da lista",
    ],
  },
} as const;

/* ------------------------------------------------------------------ */
/* Dados de exemplo                                                    */
/* ------------------------------------------------------------------ */

const scopes: SearchScope[] = [
  { id: "deals", label: "Negócios", icon: <Briefcase />, prefix: "#", noun: "negócios" },
  { id: "contacts", label: "Contatos", icon: <Users />, prefix: "@", noun: "contatos" },
  { id: "orders", label: "Pedidos", icon: <Package />, noun: "pedidos" },
  { id: "actions", label: "Ações", icon: <Keyboard />, prefix: ">", noun: "ações" },
];

// Resultados e ações levam a telas reais (troque goTo pelo router do seu app).
const open = (href: string) => () => goTo(href);

const deals: SearchResult[] = [
  ["Licenças anuais · 240 usuários", "Grupo Aurora Alimentos", 460800, "Negociação", "info"],
  ["Expansão para 3 CDs", "Vértice Logística", 128000, "Proposta", "neutral"],
  ["Piloto em 2 unidades", "Clínica Bem Viver", 18900, "Qualificação", "neutral"],
  ["Renovação Plano Pro", "Rede Horizonte Educação", 104160, "Fechamento", "accent"],
  ["Módulo financeiro", "Metalúrgica Santa Clara", 86400, "Diagnóstico", "neutral"],
  ["Implantação completa", "Agro Cerrado", 312000, "Proposta", "warn"],
  ["Integração com ERP", "Farmácias Vida Plena", 54600, "Diagnóstico", "neutral"],
  ["Upgrade Enterprise", "Construtora Pilar", 96000, "Fechamento", "accent"],
  ["Aurora Bebidas · piloto", "Grupo Aurora Alimentos", 32000, "Qualificação", "neutral"],
].map(([title, company, value, stage, tone], i) => ({
  id: `d${i}`,
  scope: "deals",
  title: title as string,
  subtitle: company as string,
  icon: <Briefcase />,
  meta: formatCurrency(value as number, { compact: true }),
  href: "#/frame/crm-deal",
  keywords: [stage as string],
  preview: {
    badge: <Badge tone={tone as "neutral"}>{stage as string}</Badge>,
    properties: [
      { label: "Empresa", value: company as string },
      { label: "Valor", value: <span className="font-medium tabular-nums">{formatCurrency(value as number)}</span> },
      { label: "Etapa", value: stage as string },
      { label: "Responsável", value: ["Ana Lopes", "Bruno Takeda", "Carla Nogueira"][i % 3] },
      { label: "Fechamento previsto", value: `${10 + i}/10/2026` },
    ],
    actions: (
      <>
        <Button size="sm" onClick={open(frameHref("crm-deal", { id: crmDeals.find((d) => d.title === title)?.id }))}>
          Abrir negócio
        </Button>
        <Button size="sm" variant="ghost" onClick={open(frameHref("crm-activities", { novo: 1 }))}>
          Registrar atividade
        </Button>
      </>
    ),
  },
  onSelect: open(frameHref("crm-deal", { id: crmDeals.find((d) => d.title === title)?.id })),
}));

const contacts: SearchResult[] = [
  ["Renata Farias", "Diretora de Operações", "Grupo Aurora Alimentos", "renata@aurora.com.br"],
  ["Paulo Menezes", "Gerente de TI", "Grupo Aurora Alimentos", "paulo.menezes@aurora.com.br"],
  ["Luíza Prado", "Compras", "Grupo Aurora Alimentos", "luiza@aurora.com.br"],
  ["Marcos Siqueira", "CFO", "Vértice Logística", "marcos@vertice.log.br"],
  ["Juliana Rocha", "Coordenadora administrativa", "Clínica Bem Viver", "juliana@bemviver.med.br"],
  ["Rafael Almeida", "Diretor de expansão", "Agro Cerrado", "rafael@agrocerrado.com.br"],
  ["Beatriz Queiroz", "Reitora", "Rede Horizonte Educação", "beatriz@horizonte.edu.br"],
  ["Thiago Barros", "Gerente industrial", "Metalúrgica Santa Clara", "thiago@santaclara.ind.br"],
  ["Camila Aurora Duarte", "Sócia", "Serralheria Irmãos Duarte", "camila@duarte.com.br"],
].map(([name, role, company, email], i) => ({
  id: `c${i}`,
  scope: "contacts",
  title: name,
  subtitle: `${role} · ${company}`,
  icon: <Users />,
  keywords: [email],
  href: "#/frame/crm-contacts",
  preview: {
    properties: [
      { label: "Empresa", value: company },
      { label: "Cargo", value: role },
      { label: "E-mail", value: email },
      { label: "Telefone", value: `(11) 9${8100 + i * 37}-${4200 + i * 11}` },
      { label: "Último contato", value: `há ${2 + i * 3} dias` },
    ],
  },
  onSelect: open(frameHref("crm-contacts", { q: name })),
}));

// Pedidos vêm do servidor (simulado): mostra carregamento e cancelamento.
const allOrders = Array.from({ length: 40 }, (_, i) => {
  const customers = ["Construtora Pilar", "Metalúrgica Santa Clara", "Agro Cerrado Máquinas", "Grupo Aurora Alimentos", "Estaleiro Atlântico"];
  const number = `PV-${String(24_870 - i).padStart(6, "0")}`;
  const total = 4_000 + ((i * 7919) % 90_000);
  return {
    id: `o${i}`,
    scope: "orders",
    title: number,
    subtitle: customers[i % customers.length],
    icon: <Package />,
    meta: formatCurrency(total, { compact: true }),
    href: "#/frame/erp-orders",
    preview: {
      properties: [
        { label: "Cliente", value: customers[i % customers.length] },
        { label: "Total", value: formatCurrency(total) },
        { label: "Emissão", value: `${String(30 - Math.floor(i / 2)).padStart(2, "0")}/09/2026` },
        { label: "Situação", value: ["Aprovado", "Faturado", "Em transporte", "Entregue"][i % 4] },
      ],
    },
    onSelect: open(frameHref("erp-orders")),
  } satisfies SearchResult;
});
const searchOrders = (q: string, scope: string, signal: AbortSignal) =>
  new Promise<SearchResult[]>((resolve, reject) => {
    if (scope !== "all" && scope !== "orders") return resolve([]);
    const t = setTimeout(() => {
      const n = q.toLowerCase().replace(/\D/g, "");
      resolve(allOrders.filter((o) => (n && o.title.includes(n)) || o.subtitle.toLowerCase().includes(q.toLowerCase())));
    }, 380);
    signal.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new DOMException("cancelada", "AbortError"));
    });
  });

const actions: SearchResult[] = [
  { id: "a1", scope: "actions", title: "Criar negócio", icon: <FilePlus2 />, shortcut: ["C", "N"], keywords: ["novo", "oportunidade"], onSelect: open(frameHref("crm-pipeline", { novo: 1 })) },
  { id: "a2", scope: "actions", title: "Criar contato", icon: <UserPlus />, shortcut: ["C", "C"], keywords: ["novo", "pessoa"], onSelect: open(frameHref("crm-contacts")) },
  { id: "a3", scope: "actions", title: "Ir para Pipeline", icon: <KanbanSquare />, shortcut: ["G", "P"], onSelect: open(frameHref("crm-pipeline")) },
  { id: "a4", scope: "actions", title: "Ir para Empresas e contatos", icon: <Building2 />, shortcut: ["G", "E"], onSelect: open(frameHref("crm-contacts")) },
  { id: "a5", scope: "actions", title: "Alternar tema escuro", icon: <Moon />, keywords: ["dark", "noite", "aparência"], onSelect: () => undefined }, // ligado ao useTheme no componente
  { id: "a6", scope: "actions", title: "Configurações da conta", icon: <Settings />, keywords: ["preferências", "perfil"], onSelect: open(atlasRoutes.settings) },
];

/* ------------------------------------------------------------------ */


export default function AppGlobalSearch() {
  const [open, setOpen] = useState(true);
  const theme = useTheme("light");
  useCommandShortcut(() => setOpen(true));
  const themedActions = actions.map((a) => (a.id === "a5" ? { ...a, title: theme.resolved === "dark" ? "Usar tema claro" : "Usar tema escuro", onSelect: () => theme.setMode(theme.resolved === "dark" ? "light" : "dark") } : a));
  return (
    <AtlasShell current={atlasRoutes.search} onSearch={() => setOpen(true)}>
      <Page>
        <PageHeading
          title={`Bom dia, ${me.name.split(" ")[0]}`}
          description="Use a busca para ir a qualquer negócio, contato, pedido ou ação sem tirar a mão do teclado."
          actions={
            <Button variant="ghost" onClick={() => setOpen(true)}>
              <Search /> Buscar <Kbd>⌘K</Kbd>
            </Button>
          }
        />
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {[
            ["Tab", "Troca o escopo: Tudo → Negócios → Contatos → Pedidos → Ações."],
            ["# @ >", "Prefixos entram direto no escopo: # negócios, @ pessoas, > ações."],
            ["⌘ ↵", "Abre o resultado em nova aba. → mostra ou esconde a prévia."],
          ].map(([k, t]) => (
            <Card key={k}>
              <div className="font-mono text-[13px] font-semibold">{k}</div>
              <p className="m-0 mt-1 text-[12.5px] leading-relaxed text-muted">{t}</p>
            </Card>
          ))}
        </div>
      </Page>
      <SearchPalette
        open={open}
        onClose={() => setOpen(false)}
        scopes={scopes}
        items={[...deals, ...contacts, ...themedActions]}
        source={searchOrders}
        initialQuery="aurora"
        recentQueries={["aurora", "PV-024861", "renata"]}
        recentItems={[deals[0], contacts[3], themedActions[0]]}
        onSeeAll={(scope, q) => {
          // leva à lista daquele tipo já filtrada pela busca (o estado vai na URL)
          const target = { deals: "crm-pipeline", contacts: "crm-contacts", orders: "erp-orders" }[scope.id] ?? "crm-contacts";
          location.href = `?q=${encodeURIComponent(q)}#/frame/${target}`;
        }}
        onCreate={(q) => { notify(`Novo negócio “${q}” criado`); goTo(frameHref("crm-pipeline", { novo: 1 })); }}
        createLabel={(q) => `Criar negócio “${q}”`}
      />
    </AtlasShell>
  );
}
