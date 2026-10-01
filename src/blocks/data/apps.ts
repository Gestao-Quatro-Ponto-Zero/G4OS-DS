import {
  AtSign,
  BarChart3,
  Box,
  Calculator,
  CircleDot,
  Cloud,
  CreditCard,
  GitBranch,
  HardDrive,
  Hash,
  Hexagon,
  Infinity as InfinityIcon,
  KanbanSquare,
  Mail,
  Megaphone,
  MessageCircle,
  NotebookText,
  Palette,
  PenTool,
  Receipt,
  ShoppingBag,
  Target,
  Ticket,
  Video,
  Zap,
  type LucideIcon,
} from "lucide-react";

/*
 * Dados do "Estúdio G4" (agente de marketing e operações da Acme): apps do
 * marketplace, contas conectadas, permissões por conta, o agente "Williams"
 * e pessoas para o compositor de e-mail. Troque pela sua API.
 *
 * Os glifos são genéricos (lucide) sobre a cor de cada marca: o DS não
 * distribui logotipos de terceiros. No seu app, use os logos oficiais.
 */

export type AppCategory = "Comunicação" | "Projetos" | "Dados e arquivos" | "CRM e vendas" | "Marketing" | "Financeiro" | "Comércio";
export const appCategories: AppCategory[] = ["Comunicação", "Projetos", "Dados e arquivos", "CRM e vendas", "Marketing", "Financeiro", "Comércio"];

export type Permission = { id: string; title: string; description: string; scope: "read" | "write"; enabled: boolean };
export type Account = { id: string; name: string; url: string; color: string; permissions: Permission[] };

export type App = {
  id: string;
  name: string;
  description: string;
  long: string;
  category: AppCategory;
  icon: LucideIcon;
  color: string;
  connected: boolean;
  featured?: boolean;
  isNew?: boolean;
  prompt: string;
  sync?: { label: string; value: number; hint?: string }[];
  accounts?: Account[];
};

const perms = (app: string, read: [string, string][], write: [string, string][]): Permission[] => [
  ...read.map(([title, description], i) => ({ id: `${app}-r${i}`, title, description, scope: "read" as const, enabled: true })),
  ...write.map(([title, description], i) => ({ id: `${app}-w${i}`, title, description, scope: "write" as const, enabled: i === 0 })),
];

/** Marcas monocromáticas (preto/branco) seguem a tinta do tema: pretas no claro, claras no escuro. */
const MONO = "var(--ds-ink)";

// ds-audit-ignore-start hex-color: cores de marca de apps de terceiros (dado, não UI)
export const apps: App[] = [
  {
    id: "slack",
    name: "Slack",
    description: "Resumir canais, responder e avisar o time.",
    long: "Leia canais e conversas, resuma decisões e publique avisos em nome do workspace.",
    category: "Comunicação",
    icon: Hash,
    color: "#7c3aed",
    connected: true,
    featured: true,
    prompt: "Resumir as atualizações das conversas recentes",
    sync: [
      { label: "Canais acompanhados", value: 12 },
      { label: "Mensagens indexadas (30 dias)", value: 4820 },
    ],
    accounts: [
      {
        id: "acme-slack",
        name: "Acme",
        url: "acme.slack.com",
        color: "#7c3aed",
        permissions: perms("slack", [["Ler canais públicos", "Busca e resume mensagens dos canais em que o app foi adicionado."], ["Ler perfis", "Nome, cargo e fuso das pessoas, para citar e mencionar."]], [["Publicar mensagens", "Envia resumos e avisos nos canais escolhidos."], ["Reagir e responder em threads", "Marca como visto e responde perguntas diretas."]]),
      },
    ],
  },
  {
    id: "github",
    name: "GitHub",
    description: "Issues, pull requests e revisões de código.",
    long: "Acompanhe issues e PRs, gere resumos de release e abra issues a partir de conversas.",
    category: "Projetos",
    icon: GitBranch,
    color: MONO,
    connected: false,
    featured: true,
    prompt: "Revisar issues e PRs abertos",
  },
  {
    id: "gmail",
    name: "Gmail",
    description: "Ler, rascunhar e organizar e-mails.",
    long: "Encontre e-mails, prepare rascunhos com o seu tom e organize a caixa por prioridade.",
    category: "Comunicação",
    icon: Mail,
    color: "#d93025",
    connected: true,
    featured: true,
    prompt: "Rascunhar respostas para os e-mails atrasados",
    sync: [
      { label: "Caixas conectadas", value: 2 },
      { label: "Rascunhos criados pelo agente", value: 38, hint: "este mês" },
    ],
    accounts: [
      {
        id: "joana-gmail",
        name: "Joana Ribeiro",
        url: "joana@acme.com.br",
        color: "#d93025",
        permissions: perms("gmail", [["Ler e-mails", "Busca e resume mensagens da caixa de entrada."]], [["Criar rascunhos", "Prepara respostas; você revisa e envia."], ["Enviar e-mails", "Envia em seu nome. Recomendado só para respostas aprovadas."]]),
      },
      {
        id: "comercial-gmail",
        name: "Comercial",
        url: "comercial@acme.com.br",
        color: "#d93025",
        permissions: perms("gmail2", [["Ler e-mails", "Busca e resume mensagens da caixa compartilhada."]], [["Criar rascunhos", "Prepara respostas para o time revisar."]]),
      },
    ],
  },
  { id: "drive", name: "Google Drive", description: "Documentos, planilhas e apresentações.", long: "Leia e crie documentos e planilhas; salve relatórios gerados pelo agente.", category: "Dados e arquivos", icon: HardDrive, color: "#1a73e8", connected: true, featured: true, prompt: "Encontrar a última versão do planejamento" },
  { id: "notion", name: "Notion", description: "Páginas, bancos de dados e wikis.", long: "Consulte e atualize páginas e bancos de dados do Notion.", category: "Projetos", icon: NotebookText, color: MONO, connected: false, featured: true, isNew: true, prompt: "Atualizar a página de rituais do time" },
  { id: "figma", name: "Figma", description: "Arquivos, comentários e protótipos.", long: "Leia arquivos e comentários, gere especificações a partir de frames.", category: "Projetos", icon: PenTool, color: "#a259ff", connected: false, featured: true, prompt: "Listar comentários abertos no protótipo" },
  { id: "asana", name: "Asana", description: "Projetos, tarefas e prazos do time.", long: "Crie e atualize tarefas, acompanhe prazos e responsáveis.", category: "Projetos", icon: CircleDot, color: "#f06a6a", connected: false, featured: true, prompt: "Criar tarefas a partir da ata" },
  { id: "trello", name: "Trello", description: "Quadros, listas e cartões.", long: "Mova cartões, crie listas e resuma quadros.", category: "Projetos", icon: KanbanSquare, color: "#0c66e4", connected: false, prompt: "Resumir o quadro de lançamentos" },
  { id: "zoom", name: "Zoom", description: "Reuniões, gravações e transcrições.", long: "Agende reuniões e use transcrições para gerar atas.", category: "Comunicação", icon: Video, color: "#2d8cff", connected: false, featured: true, prompt: "Gerar a ata da reunião de ontem" },
  { id: "dropbox", name: "Dropbox", description: "Arquivos e pastas compartilhadas.", long: "Encontre arquivos e salve entregas em pastas do time.", category: "Dados e arquivos", icon: Box, color: "#0061fe", connected: false, prompt: "Encontrar o contrato assinado da Atlas" },
  { id: "canva", name: "Canva", description: "Peças visuais e apresentações.", long: "Crie peças a partir de modelos da marca.", category: "Marketing", icon: Palette, color: "#00c4cc", connected: false, prompt: "Montar 3 posts com o modelo da campanha" },
  { id: "hubspot", name: "HubSpot", description: "Contatos, negócios e automações.", long: "Sincronize contatos e negócios; acione sequências.", category: "CRM e vendas", icon: Hexagon, color: "#ff7a59", connected: false, featured: true, prompt: "Listar negócios sem próximo passo" },
  { id: "salesforce", name: "Salesforce", description: "Contas, oportunidades e previsões.", long: "Leia oportunidades e atualize etapas do funil.", category: "CRM e vendas", icon: Cloud, color: "#00a1e0", connected: false, prompt: "Comparar a previsão com o realizado" },
  { id: "pipedrive", name: "Pipedrive", description: "Funil de vendas e atividades.", long: "Acompanhe negócios e crie atividades de follow-up.", category: "CRM e vendas", icon: Target, color: MONO, connected: false, prompt: "Criar follow-ups para negócios parados" },
  { id: "rdstation", name: "RD Station", description: "Leads, e-mails e automações de marketing.", long: "Consulte leads e resultados de campanhas.", category: "Marketing", icon: Megaphone, color: "#19c1ce", connected: true, prompt: "Comparar a conversão das campanhas de setembro", sync: [{ label: "Leads sincronizados", value: 6120 }, { label: "Campanhas", value: 14 }] },
  { id: "meta-ads", name: "Meta Ads", description: "Campanhas, criativos e públicos.", long: "Analise campanhas do Facebook e Instagram, criativos e públicos.", category: "Marketing", icon: InfinityIcon, color: "#0866ff", connected: true, featured: true, prompt: "Analisar os últimos 90 dias de campanhas", sync: [{ label: "Campanhas ativas", value: 9 }, { label: "Criativos analisados", value: 126 }] },
  { id: "google-ads", name: "Google Ads", description: "Campanhas de busca, display e vídeo.", long: "Acompanhe custo por conversão e termos de busca.", category: "Marketing", icon: BarChart3, color: "#fbbc04", connected: true, prompt: "Encontrar termos que só gastam e não convertem", sync: [{ label: "Campanhas ativas", value: 5 }] },
  {
    id: "shopify",
    name: "Shopify",
    description: "Loja, produtos, coleções e pedidos.",
    long: "Campanhas, catálogo e pedidos da loja. O agente analisa vendas, melhora fichas de produto e publica imagens tratadas.",
    category: "Comércio",
    icon: ShoppingBag,
    color: "#5e8e3e",
    connected: true,
    featured: true,
    prompt: "Analisar os últimos 90 dias de vendas da loja",
    sync: [
      { label: "Produtos sincronizados", value: 15 },
      { label: "Coleções sincronizadas", value: 12 },
      { label: "Pedidos (90 dias)", value: 1840 },
    ],
    accounts: [
      {
        id: "acme-loja",
        name: "Acme Store",
        url: "acme-store.myshopify.com",
        color: "#5e8e3e",
        permissions: perms("shop1", [["Ler produtos e pedidos", "Consulta catálogo, estoque e pedidos para análises."]], [["Publicar imagens tratadas", "Adiciona as imagens melhoradas pela IA à galeria do produto."], ["Editar o tema da loja", "Lê e altera o tema da vitrine (textos, banners)."]]),
      },
      {
        id: "acme-outlet",
        name: "Acme Outlet",
        url: "acme-outlet.myshopify.com",
        color: "#8c6a3a",
        permissions: perms("shop2", [["Ler produtos e pedidos", "Consulta catálogo e pedidos do outlet."]], [["Publicar imagens tratadas", "Adiciona imagens à galeria do produto."]]),
      },
    ],
  },
  { id: "stripe", name: "Stripe", description: "Pagamentos, assinaturas e faturas.", long: "Acompanhe MRR, falhas de cobrança e reembolsos.", category: "Financeiro", icon: CreditCard, color: "#635bff", connected: false, featured: true, prompt: "Listar cobranças que falharam esta semana" },
  { id: "omie", name: "Omie", description: "ERP: notas, contas e estoque.", long: "Consulte contas a pagar e receber, notas e estoque.", category: "Financeiro", icon: Calculator, color: "#00a868", connected: false, isNew: true, prompt: "Projetar o caixa das próximas 4 semanas" },
  { id: "contaazul", name: "Conta Azul", description: "Financeiro e notas fiscais.", long: "Leia lançamentos e conciliações.", category: "Financeiro", icon: Receipt, color: "#2687e9", connected: false, prompt: "Resumir as despesas de setembro por categoria" },
  { id: "whatsapp", name: "WhatsApp Business", description: "Atendimento e mensagens a clientes.", long: "Responda clientes com modelos aprovados e registre no CRM.", category: "Comunicação", icon: MessageCircle, color: "#25d366", connected: false, featured: true, isNew: true, prompt: "Responder pedidos de segunda via de boleto" },
  { id: "linear", name: "Linear", description: "Issues, ciclos e roadmap.", long: "Crie issues a partir de feedbacks e acompanhe ciclos.", category: "Projetos", icon: Zap, color: "#5e6ad2", connected: false, prompt: "Abrir issues a partir dos feedbacks da semana" },
  { id: "jira", name: "Jira", description: "Tickets, sprints e quadros.", long: "Atualize tickets e gere relatórios de sprint.", category: "Projetos", icon: Ticket, color: "#0052cc", connected: false, prompt: "Resumir o que entrou na última sprint" },
  { id: "x", name: "X (antigo Twitter)", description: "Publicações, menções e métricas.", long: "Acompanhe menções e publique em nome da marca.", category: "Marketing", icon: AtSign, color: MONO, connected: true, featured: true, prompt: "Resumir as menções à marca hoje" },
];
// ds-audit-ignore-end

export const appById = (id: string | null | undefined) => apps.find((a) => a.id === id);

/* ------------------------------------------------------------------ */
/* Agente "Williams" (escopo global)                                    */
/* ------------------------------------------------------------------ */

export const agent = {
  id: "williams",
  name: "Williams",
  scope: "Global",
  role: "Agente de marketing de performance",
  description: "Cuida das campanhas pagas da Acme: analisa resultados, propõe criativos e prepara relatórios semanais para o time.",
  connections: ["meta-ads", "google-ads", "site", "shopify"],
  site: { name: "acme.com.br", note: "Site institucional (rastreamento e páginas)" },
  subagents: [
    { id: "brand", name: "Pesquisa de marca", status: "running" as const, note: "Coletando menções e concorrentes · 4 min" },
    { id: "creative", name: "Arquiteto de criativos", status: "running" as const, note: "Gerando 6 variações de anúncio" },
    { id: "ads", name: "Diretor de mídia", status: "idle" as const, note: "Aguarda os criativos para montar o plano" },
  ],
  results: [
    { id: "doc", name: "Relatório semanal de mídia", fileName: "relatorio.docx", meta: "hoje, 08:10" },
    { id: "pdf", name: "Plano de criativos Q4", fileName: "plano-criativos.pdf", meta: "ontem" },
    { id: "sheet", name: "Termos negativos sugeridos", fileName: "termos.xlsx", meta: "29/09" },
  ],
  instructions:
    "Toda segunda às 8h: compare a semana com a anterior por campanha (custo por conversão, ROAS, CTR). Sinalize criativos com queda de CTR > 20 %. Prepare o relatório no Drive e avise #marketing no Slack. Nunca altere orçamento sem aprovação.",
};

/* ------------------------------------------------------------------ */
/* Pessoas para o compositor de e-mail                                  */
/* ------------------------------------------------------------------ */

export type ContactPerson = { id: string; name: string; email: string; initials: string; tint: string; verified?: boolean; company?: string };

// ds-audit-ignore-start hex-color: tintas de avatar (identidade da pessoa)
export const contacts: ContactPerson[] = [
  { id: "renata", name: "Renata Farias", email: "renata@grupoaurora.com.br", initials: "RF", tint: "#842e20", verified: true, company: "Grupo Aurora" },
  { id: "paulo", name: "Paulo Menezes", email: "paulo@grupoaurora.com.br", initials: "PM", tint: "#184560", verified: true, company: "Grupo Aurora" },
  { id: "luiza", name: "Luíza Prado", email: "compras@grupoaurora.com.br", initials: "LP", tint: "#5f7f6f", company: "Grupo Aurora" },
  { id: "sahkyo", name: "Saulo Kyoto", email: "saulo@verticelog.com.br", initials: "SK", tint: "#3f3f46", company: "Vértice Logística" },
  { id: "sahkyo2", name: "Saulo Kyoto", email: "saulo.kyoto@gmail.com", initials: "SK", tint: "#3f3f46" },
  { id: "tuki", name: "Tânia Kuroda", email: "tania@hospitalsaolucas.org", initials: "TK", tint: "#8c6a3a", verified: true, company: "Hospital São Lucas" },
  { id: "marcos", name: "Marcos Leal", email: "marcos@redehorizonte.edu.br", initials: "ML", tint: "#184560", company: "Rede Horizonte" },
];
// ds-audit-ignore-end
