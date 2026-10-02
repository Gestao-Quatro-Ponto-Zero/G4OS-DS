/*
 * Dados das telas de Configurações do Atlas que não são de pessoas:
 * organização, papéis e permissões, webhooks e exportações de dados.
 * Mesmo workspace da Acme de ./workspace. Troque pela sua API.
 */

/** "Agora" fixo da demonstração, para datas relativas estáveis. */
export const settingsNow = new Date("2026-10-01T10:00:00-03:00");
const ago = (min: number) => new Date(settingsNow.getTime() - min * 60_000);

/* Organização ------------------------------------------------------- */

export const organization = {
  name: "Acme",
  legalName: "Acme Tecnologia e Serviços Ltda.",
  cnpj: "12.345.678/0001-90",
  domain: "acme.com.br",
  workspaceUrl: "acme",
  timezone: "America/Sao_Paulo",
  language: "pt-BR",
  currency: "BRL",
  fiscalYearStart: "1",
};

export type DomainStatus = "verificado" | "pendente" | "falhou";
export type OrgDomain = { id: string; host: string; status: DomainStatus; primary?: boolean; checkedAt: Date };
export const orgDomains: OrgDomain[] = [
  { id: "d1", host: "acme.com.br", status: "verificado", primary: true, checkedAt: ago(60 * 26) },
  { id: "d2", host: "acmeservicos.com.br", status: "pendente", checkedAt: ago(45) },
];
export const domainLabel: Record<DomainStatus, string> = { verificado: "Verificado", pendente: "Aguardando DNS", falhou: "Falhou" };
export const domainTone: Record<DomainStatus, "ok" | "warn" | "bad"> = { verificado: "ok", pendente: "warn", falhou: "bad" };

export const timezoneOptions = [
  { value: "America/Sao_Paulo", label: "Brasília (GMT−3)" },
  { value: "America/Manaus", label: "Manaus (GMT−4)" },
  { value: "America/Cuiaba", label: "Cuiabá (GMT−4)" },
  { value: "America/Rio_Branco", label: "Rio Branco (GMT−5)" },
  { value: "America/Noronha", label: "Fernando de Noronha (GMT−2)" },
  { value: "America/Fortaleza", label: "Fortaleza (GMT−3)" },
  { value: "America/Recife", label: "Recife (GMT−3)" },
  { value: "Europe/Lisbon", label: "Lisboa (GMT+0)" },
  { value: "America/New_York", label: "Nova York (GMT−5)" },
];
export const languageOptions = [
  { value: "pt-BR", label: "Português (Brasil)" },
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
];
export const currencyOptions = [
  { value: "BRL", label: "Real (R$)" },
  { value: "USD", label: "Dólar americano (US$)" },
  { value: "EUR", label: "Euro (€)" },
];
export const monthOptions = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"].map((label, i) => ({ value: String(i + 1), label }));

/* Papéis e permissões ----------------------------------------------- */

export type Permission = { id: string; module: string; label: string; description?: string };
export const permissions: Permission[] = [
  { id: "crm.view", module: "CRM", label: "Ver negócios e contatos" },
  { id: "crm.edit", module: "CRM", label: "Criar e editar negócios" },
  { id: "crm.delete", module: "CRM", label: "Excluir registros", description: "Registros vão para a lixeira por 30 dias." },
  { id: "crm.export", module: "CRM", label: "Exportar listas" },
  { id: "fin.view", module: "Financeiro", label: "Ver lançamentos e relatórios" },
  { id: "fin.edit", module: "Financeiro", label: "Lançar e conciliar" },
  { id: "fin.approve", module: "Financeiro", label: "Aprovar pagamentos" },
  { id: "ws.invite", module: "Workspace", label: "Convidar pessoas" },
  { id: "ws.roles", module: "Workspace", label: "Mudar papéis e permissões" },
  { id: "ws.billing", module: "Workspace", label: "Ver e alterar cobrança" },
  { id: "ws.integrations", module: "Workspace", label: "Gerenciar integrações e webhooks" },
  { id: "ws.data", module: "Workspace", label: "Exportar e excluir dados" },
];

export type RoleDef = { id: string; name: string; description: string; system?: boolean; members: number; grants: string[] };
const all = permissions.map((p) => p.id);
export const initialRoles: RoleDef[] = [
  { id: "admin", name: "Administrador", description: "Acesso total, inclusive cobrança e papéis.", system: true, members: 3, grants: all },
  { id: "membro", name: "Membro", description: "Trabalha nos módulos ativos.", members: 6, grants: ["crm.view", "crm.edit", "crm.export", "fin.view", "ws.invite"] },
  { id: "financeiro", name: "Financeiro", description: "Lança, concilia e aprova pagamentos.", members: 1, grants: ["crm.view", "fin.view", "fin.edit", "fin.approve", "ws.billing"] },
  { id: "leitor", name: "Leitor", description: "Só visualiza. Não conta como licença.", system: true, members: 1, grants: ["crm.view", "fin.view"] },
];

/* Webhooks ---------------------------------------------------------- */

export const webhookEvents = [
  { value: "deal.created", label: "Negócio criado" },
  { value: "deal.won", label: "Negócio ganho" },
  { value: "deal.lost", label: "Negócio perdido" },
  { value: "contact.updated", label: "Contato atualizado" },
  { value: "invoice.paid", label: "Fatura paga" },
  { value: "invoice.overdue", label: "Fatura vencida" },
  { value: "member.joined", label: "Pessoa entrou no workspace" },
];
export const eventLabel = (v: string) => webhookEvents.find((e) => e.value === v)?.label ?? v;

export type EndpointStatus = "ativo" | "pausado" | "falhando";
export type WebhookEndpoint = { id: string; url: string; description: string; events: string[]; status: EndpointStatus; lastDelivery?: Date; successRate: number; secret: string };
export const endpointLabel: Record<EndpointStatus, string> = { ativo: "Ativo", pausado: "Pausado", falhando: "Falhando" };
export const endpointTone: Record<EndpointStatus, "ok" | "neutral" | "bad"> = { ativo: "ok", pausado: "neutral", falhando: "bad" };

export const initialEndpoints: WebhookEndpoint[] = [
  { id: "wh1", url: "https://erp.acme.com.br/hooks/atlas", description: "ERP: cria pedido quando o negócio é ganho", events: ["deal.won", "invoice.paid"], status: "ativo", lastDelivery: ago(8), successRate: 0.998, secret: "whsec_9f2c41b7" },
  { id: "wh2", url: "https://hooks.slack.com/services/T04/B07/acme-vendas", description: "Slack #vendas", events: ["deal.won", "deal.lost"], status: "ativo", lastDelivery: ago(95), successRate: 1, secret: "whsec_51ad0e22" },
  { id: "wh3", url: "https://bi.acme.com.br/ingest/atlas", description: "Painel de BI", events: ["deal.created", "contact.updated", "invoice.paid", "invoice.overdue"], status: "falhando", lastDelivery: ago(12), successRate: 0.62, secret: "whsec_c07e9a10" },
  { id: "wh4", url: "https://n8n.acme.com.br/webhook/onboarding", description: "Automação de boas-vindas", events: ["member.joined"], status: "pausado", lastDelivery: ago(60 * 24 * 9), successRate: 0.97, secret: "whsec_7b3d88f1" },
];

export type DeliveryStatus = "entregue" | "falhou" | "repetindo";
export type Delivery = { id: string; endpointId: string; event: string; status: DeliveryStatus; code: number; at: Date; ms: number };
export const deliveryLabel: Record<DeliveryStatus, string> = { entregue: "Entregue", falhou: "Falhou", repetindo: "Nova tentativa agendada" };
export const deliveryTone: Record<DeliveryStatus, "ok" | "bad" | "warn"> = { entregue: "ok", falhou: "bad", repetindo: "warn" };

export const initialDeliveries: Delivery[] = [
  { id: "ev_8812", endpointId: "wh1", event: "deal.won", status: "entregue", code: 200, at: ago(8), ms: 182 },
  { id: "ev_8811", endpointId: "wh3", event: "contact.updated", status: "falhou", code: 503, at: ago(12), ms: 10_000 },
  { id: "ev_8809", endpointId: "wh3", event: "invoice.paid", status: "repetindo", code: 500, at: ago(31), ms: 2_410 },
  { id: "ev_8805", endpointId: "wh1", event: "invoice.paid", status: "entregue", code: 200, at: ago(64), ms: 240 },
  { id: "ev_8801", endpointId: "wh2", event: "deal.won", status: "entregue", code: 200, at: ago(95), ms: 96 },
  { id: "ev_8790", endpointId: "wh3", event: "deal.created", status: "entregue", code: 202, at: ago(180), ms: 410 },
];

/* Dados e privacidade ----------------------------------------------- */

export const exportSets = [
  { value: "crm", label: "CRM", description: "Negócios, contatos, empresas e atividades" },
  { value: "fin", label: "Financeiro", description: "Lançamentos, faturas e conciliações" },
  { value: "docs", label: "Documentos e anexos", description: "Arquivos enviados e gerados" },
  { value: "people", label: "Pessoas e acessos", description: "Membros, papéis e registro de atividade" },
];

export type ExportStatus = "pronta" | "gerando" | "expirada" | "falhou";
export type DataExport = { id: string; sets: string[]; format: "csv" | "json"; requestedBy: string; requestedAt: Date; status: ExportStatus; size?: number };
export const exportLabel: Record<ExportStatus, string> = { pronta: "Pronta", gerando: "Gerando", expirada: "Expirada", falhou: "Falhou" };
export const exportTone: Record<ExportStatus, "ok" | "warn" | "neutral" | "bad"> = { pronta: "ok", gerando: "warn", expirada: "neutral", falhou: "bad" };

export const initialExports: DataExport[] = [
  { id: "exp-104", sets: ["crm", "fin"], format: "csv", requestedBy: "Joana Ribeiro", requestedAt: ago(60 * 5), status: "pronta", size: 48_200_000 },
  { id: "exp-103", sets: ["people"], format: "json", requestedBy: "Elisa Monteiro", requestedAt: ago(60 * 24 * 6), status: "pronta", size: 1_300_000 },
  { id: "exp-102", sets: ["crm", "fin", "docs", "people"], format: "csv", requestedBy: "Rafael Queiroz", requestedAt: ago(60 * 24 * 40), status: "expirada", size: 912_000_000 },
];

export const retentionOptions = [
  { value: "12", label: "12 meses" },
  { value: "24", label: "24 meses" },
  { value: "60", label: "5 anos" },
  { value: "0", label: "Sem limite" },
];
