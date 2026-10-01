/*
 * Planos do Atlas: a mesma fonte para o site (landing e preços), o cadastro
 * (?plan=) e a tela de cobrança. Preço por usuário/mês, em reais.
 */

export type PlanId = "essencial" | "pro" | "enterprise";
export type Plan = {
  id: PlanId;
  name: string;
  /** R$ por usuário/mês. null = sob consulta. */
  price: number | null;
  desc: string;
  highlights: string[];
  featured?: boolean;
};

export const plans: Plan[] = [
  { id: "essencial", name: "Essencial", price: 89, desc: "Para times começando a organizar o funil.", highlights: ["Pipeline e contatos", "Até 5 usuários", "Relatórios básicos"] },
  { id: "pro", name: "Pro", price: 169, desc: "Para times que vendem com processo.", highlights: ["Tudo do Essencial", "Agentes de follow-up", "Previsão com IA", "Integração com ERP"], featured: true },
  { id: "enterprise", name: "Enterprise", price: null, desc: "Para operações com várias unidades.", highlights: ["Tudo do Pro", "SSO e auditoria", "Ambiente dedicado", "Gerente de sucesso"] },
];

export const planById = (id: string | null | undefined) => plans.find((p) => p.id === id);

/** Comparação completa (página de preços). true/false ou texto por plano. */
export const featureGroups: { group: string; rows: { label: string; values: [boolean | string, boolean | string, boolean | string] }[] }[] = [
  {
    group: "Vendas",
    rows: [
      { label: "Pipelines", values: ["1", "Ilimitados", "Ilimitados"] },
      { label: "Contatos e empresas", values: ["10 mil", "Ilimitados", "Ilimitados"] },
      { label: "Previsão ponderada", values: [false, true, true] },
      { label: "Metas por vendedor", values: [false, true, true] },
    ],
  },
  {
    group: "IA",
    rows: [
      { label: "Assistente G4 no registro", values: ["50 perguntas/mês", "Ilimitado", "Ilimitado"] },
      { label: "Agentes de follow-up", values: [false, true, true] },
      { label: "Modelos e dados privados", values: [false, false, true] },
    ],
  },
  {
    group: "Operação",
    rows: [
      { label: "Chamados e SLA", values: [false, true, true] },
      { label: "Arquivos", values: ["10 GB", "50 GB", "1 TB"] },
      { label: "Integração com ERP e NF-e", values: [false, true, true] },
      { label: "API e webhooks", values: [false, true, true] },
    ],
  },
  {
    group: "Segurança e suporte",
    rows: [
      { label: "Verificação em duas etapas", values: [true, true, true] },
      { label: "SSO (Google, Microsoft, SAML)", values: [false, "Google e Microsoft", true] },
      { label: "Log de auditoria", values: ["30 dias", "1 ano", "2 anos"] },
      { label: "Suporte", values: ["E-mail", "Chat em horário comercial", "Gerente de sucesso dedicado"] },
    ],
  },
];
