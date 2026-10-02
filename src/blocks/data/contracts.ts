/*
 * Pacto · gestão de contratos (CLM) · dados de exemplo compartilhados por
 * TODAS as telas do produto. Um contrato aberto na lista mostra o mesmo valor
 * no registro, no painel, na fila de aprovação, nas obrigações e na busca ⌘K.
 * Troque por chamadas à sua API.
 *
 * Empresa: Vereda Alimentos S.A. (indústria de alimentos de médio porte,
 * fábrica em Campinas/SP e CD em Jundiaí/SP). Quem usa: Jurídico e
 * Suprimentos. "Hoje" = 30/09/2026.
 */

export const today = new Date(2026, 8, 30);
/** Data ISO relativa a hoje: iso(-3) = 3 dias atrás. */
export const iso = (days: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
/** Dias entre hoje e a data: daysFromToday(iso(3)) = 3. */
export const daysFromToday = (isoDate: string) => Math.round((new Date(`${isoDate}T00:00:00`).getTime() - today.getTime()) / 86400000);
/** Soma dias a uma data ISO. */
export const addDays = (isoDate: string, days: number) => iso(daysFromToday(isoDate) + days);

export const company = {
  name: "Vereda Alimentos S.A.",
  cnpj: "08.512.334/0001-27",
  city: "Campinas, SP",
  forum: "Comarca de Campinas/SP",
};

/* ------------------------------------------------------------------ */
/* Pessoas                                                             */
/* ------------------------------------------------------------------ */

export type Person = { id: string; name: string; initials: string; tint: string; role: string; area: string; email: string };

export const people: Person[] = [
  { id: "p1", name: "Marina Teixeira", initials: "MT", tint: "#184560", role: "Advogada sênior", area: "Jurídico", email: "marina.teixeira@vereda.com.br" },
  { id: "p2", name: "Rafael Monteiro", initials: "RM", tint: "#3f3f46", role: "Gerente jurídico", area: "Jurídico", email: "rafael.monteiro@vereda.com.br" },
  { id: "p3", name: "Camila Duarte", initials: "CD", tint: "#842e20", role: "Compradora sênior", area: "Suprimentos", email: "camila.duarte@vereda.com.br" },
  { id: "p4", name: "Bruno Azevedo", initials: "BA", tint: "#5f7f6f", role: "Gerente de suprimentos", area: "Suprimentos", email: "bruno.azevedo@vereda.com.br" },
  { id: "p5", name: "Helena Castro", initials: "HC", tint: "#6b4f8a", role: "Diretora financeira", area: "Financeiro", email: "helena.castro@vereda.com.br" },
  { id: "p6", name: "Thiago Nakamura", initials: "TN", tint: "#2f5d8a", role: "Coordenador de TI", area: "TI", email: "thiago.nakamura@vereda.com.br" },
  { id: "p7", name: "Patrícia Rocha", initials: "PR", tint: "#7a5a2f", role: "Analista de contratos", area: "Jurídico", email: "patricia.rocha@vereda.com.br" },
  { id: "p8", name: "Eduardo Lins", initials: "EL", tint: "#355e3b", role: "Diretor de operações", area: "Operações", email: "eduardo.lins@vereda.com.br" },
  { id: "p9", name: "Luana Ferraz", initials: "LF", tint: "#8a3f5c", role: "Encarregada de dados (DPO)", area: "Jurídico", email: "dpo@vereda.com.br" },
  { id: "p10", name: "Gustavo Prado", initials: "GP", tint: "#1f2937", role: "Diretor-presidente", area: "Diretoria", email: "gustavo.prado@vereda.com.br" },
  { id: "p11", name: "Sérgio Almeida", initials: "SA", tint: "#4b5d2a", role: "Diretor comercial", area: "Comercial", email: "sergio.almeida@vereda.com.br" },
  { id: "p12", name: "Renata Gomes", initials: "RG", tint: "#5a4636", role: "Coordenadora de facilities", area: "Facilities", email: "renata.gomes@vereda.com.br" },
];
/** Quem está usando o app (Jurídico). */
export const me = people[0];
export const personById = (id: string) => people.find((p) => p.id === id) ?? people[0];

export const areas = ["Suprimentos", "TI", "Facilities", "Operações", "Comercial", "Financeiro", "Jurídico"] as const;
export type Area = (typeof areas)[number];

/* ------------------------------------------------------------------ */
/* Contrapartes                                                        */
/* ------------------------------------------------------------------ */

export type CheckStatus = "ok" | "vencida" | "pendente" | "alerta";
export type DiligenceCheck = { id: string; label: string; source: string; status: CheckStatus; validUntil?: string; note?: string };
export type Risk = "baixo" | "medio" | "alto";
export type Counterparty = {
  id: string;
  name: string;
  /** Nome curto (lista, busca). */
  short: string;
  /** "CNPJ" no Brasil; "NIPC" etc. para estrangeiras. */
  taxLabel: string;
  taxId: string;
  segment: string;
  place: string;
  timeZone: string;
  tint: string;
  rep: { name: string; role: string; email: string };
  since: string;
  risk: Risk;
  /** Certidões e verificações de compliance (due diligence). */
  checks: DiligenceCheck[];
};

const certs = (o: Partial<Record<"federal" | "fgts" | "cndt" | "estadual" | "municipal", [CheckStatus, number]>> = {}): DiligenceCheck[] => {
  const base = { federal: ["ok", 120], fgts: ["ok", 24], cndt: ["ok", 150], estadual: ["ok", 80], municipal: ["ok", 60], ...o } as Record<string, [CheckStatus, number]>;
  return [
    { id: "federal", label: "CND Federal (Receita/PGFN)", source: "Receita Federal", status: base.federal[0], validUntil: iso(base.federal[1]) },
    { id: "fgts", label: "Regularidade do FGTS (CRF)", source: "Caixa", status: base.fgts[0], validUntil: iso(base.fgts[1]) },
    { id: "cndt", label: "Débitos trabalhistas (CNDT)", source: "TST", status: base.cndt[0], validUntil: iso(base.cndt[1]) },
    { id: "estadual", label: "Certidão estadual (ICMS)", source: "Sefaz", status: base.estadual[0], validUntil: iso(base.estadual[1]) },
    { id: "municipal", label: "Certidão municipal (ISS)", source: "Prefeitura", status: base.municipal[0], validUntil: iso(base.municipal[1]) },
  ];
};
const compliance = (o: Partial<Record<"ceis" | "sancoes" | "lgpd" | "ubo", [CheckStatus, string?]>> = {}): DiligenceCheck[] => {
  const base = { ceis: ["ok"], sancoes: ["ok"], lgpd: ["ok"], ubo: ["ok"], ...o } as Record<string, [CheckStatus, string?]>;
  return [
    { id: "ceis", label: "CEIS e CNEP (empresas punidas)", source: "CGU", status: base.ceis[0], note: base.ceis[1] },
    { id: "sancoes", label: "Listas de sanções e mídia negativa", source: "Consulta de compliance", status: base.sancoes[0], note: base.sancoes[1] },
    { id: "lgpd", label: "Questionário de proteção de dados", source: "DPO", status: base.lgpd[0], note: base.lgpd[1] },
    { id: "ubo", label: "Beneficiário final identificado", source: "Contrato social", status: base.ubo[0], note: base.ubo[1] },
  ];
};

export const counterparties: Counterparty[] = [
  { id: "k1", name: "Frio Sul Transportes Ltda", short: "Frio Sul", taxLabel: "CNPJ", taxId: "14.223.871/0001-05", segment: "Logística refrigerada", place: "Curitiba, PR", timeZone: "America/Sao_Paulo", tint: "#2f5d8a", rep: { name: "Otávio Bernardi", role: "Sócio-administrador", email: "otavio@friosul.com.br" }, since: "2021-03-10", risk: "medio", checks: [...certs({ fgts: ["vencida", -6] }), ...compliance()] },
  { id: "k2", name: "Nuvem Certa Tecnologia S.A.", short: "Nuvem Certa", taxLabel: "CNPJ", taxId: "27.640.115/0001-88", segment: "Software (SaaS)", place: "São Paulo, SP", timeZone: "America/Sao_Paulo", tint: "#3d5a80", rep: { name: "Larissa Kim", role: "Diretora jurídica", email: "juridico@nuvemcerta.com.br" }, since: "2020-08-01", risk: "medio", checks: [...certs(), ...compliance({ lgpd: ["alerta", "Usa subprocessadores fora do Brasil (EUA). Pedir cláusulas-padrão da ANPD."] })] },
  { id: "k3", name: "Embalagens Paraná Indústria e Comércio Ltda", short: "Embalagens Paraná", taxLabel: "CNPJ", taxId: "03.781.522/0001-40", segment: "Embalagens flexíveis", place: "Ponta Grossa, PR", timeZone: "America/Sao_Paulo", tint: "#7a5a2f", rep: { name: "Marcos Wieczorek", role: "Diretor comercial", email: "marcos@embparana.com.br" }, since: "2018-01-15", risk: "baixo", checks: [...certs(), ...compliance()] },
  { id: "k4", name: "Condomínio Logístico Anhanguera SPE Ltda", short: "CL Anhanguera", taxLabel: "CNPJ", taxId: "31.004.876/0001-12", segment: "Imóveis logísticos", place: "Jundiaí, SP", timeZone: "America/Sao_Paulo", tint: "#4b5d2a", rep: { name: "Fernanda Queiroz", role: "Gerente de ativos", email: "fernanda@clanhanguera.com.br" }, since: "2024-11-01", risk: "baixo", checks: [...certs({ municipal: ["pendente", 0] }), ...compliance()] },
  { id: "k5", name: "Limpa Bem Serviços Terceirizados Ltda", short: "Limpa Bem", taxLabel: "CNPJ", taxId: "11.902.337/0001-63", segment: "Limpeza e conservação", place: "Campinas, SP", timeZone: "America/Sao_Paulo", tint: "#5f7f6f", rep: { name: "Rogério Lima", role: "Sócio-administrador", email: "rogerio@limpabem.com.br" }, since: "2023-10-01", risk: "alto", checks: [...certs({ cndt: ["vencida", -21] }), ...compliance({ sancoes: ["alerta", "3 reclamações trabalhistas em 2026 citam a Vereda como responsável subsidiária."] })] },
  { id: "k6", name: "Cooperativa Agroindustrial Grãos do Cerrado", short: "Grãos do Cerrado", taxLabel: "CNPJ", taxId: "02.455.190/0001-77", segment: "Grãos e óleos", place: "Rio Verde, GO", timeZone: "America/Sao_Paulo", tint: "#8a6a1f", rep: { name: "Ivo Rezende", role: "Superintendente comercial", email: "ivo.rezende@graoscerrado.coop.br" }, since: "2019-02-20", risk: "baixo", checks: [...certs(), ...compliance()] },
  { id: "k7", name: "Datavox Telecomunicações Ltda", short: "Datavox", taxLabel: "CNPJ", taxId: "05.318.664/0001-29", segment: "Telecomunicações", place: "Barueri, SP", timeZone: "America/Sao_Paulo", tint: "#355e7a", rep: { name: "Aline Prates", role: "Executiva de contas", email: "aline.prates@datavox.com.br" }, since: "2022-05-02", risk: "baixo", checks: [...certs(), ...compliance()] },
  { id: "k8", name: "Pinheiro & Vasconcellos Advogados", short: "Pinheiro & Vasconcellos", taxLabel: "CNPJ", taxId: "09.870.221/0001-50", segment: "Serviços jurídicos", place: "São Paulo, SP", timeZone: "America/Sao_Paulo", tint: "#3f3f46", rep: { name: "Dra. Beatriz Vasconcellos", role: "Sócia", email: "beatriz@pvadv.com.br" }, since: "2022-01-10", risk: "baixo", checks: [...certs(), ...compliance()] },
  { id: "k9", name: "Lumina Analytics Ltda", short: "Lumina", taxLabel: "CNPJ", taxId: "22.163.908/0001-31", segment: "Software (SaaS)", place: "Florianópolis, SC", timeZone: "America/Sao_Paulo", tint: "#6b4f8a", rep: { name: "Pedro Hoffmann", role: "CEO", email: "pedro@lumina.io" }, since: "2025-01-05", risk: "medio", checks: [...certs({ estadual: ["pendente", 0] }), ...compliance({ lgpd: ["pendente", "Questionário enviado em 12/09, sem resposta."] })] },
  { id: "k10", name: "Mercado Bom Preço S.A.", short: "Bom Preço", taxLabel: "CNPJ", taxId: "10.442.087/0001-93", segment: "Varejo alimentar (cliente)", place: "Recife, PE", timeZone: "America/Recife", tint: "#842e20", rep: { name: "Joana Cavalcanti", role: "Gerente de compras", email: "joana.cavalcanti@bompreco.com.br" }, since: "2026-07-30", risk: "baixo", checks: [...certs(), ...compliance()] },
  { id: "k11", name: "Segura Vigilância Patrimonial Ltda", short: "Segura Vigilância", taxLabel: "CNPJ", taxId: "17.335.402/0001-08", segment: "Segurança patrimonial", place: "Campinas, SP", timeZone: "America/Sao_Paulo", tint: "#1f2937", rep: { name: "Cel. Ademir Souza", role: "Diretor", email: "ademir@seguravig.com.br" }, since: "2026-09-02", risk: "medio", checks: [...certs({ federal: ["pendente", 0] }), ...compliance({ ubo: ["pendente", "Aguardando última alteração do contrato social."] })] },
  { id: "k12", name: "Rede Sabor Distribuidora Ltda", short: "Rede Sabor", taxLabel: "CNPJ", taxId: "34.718.290/0001-46", segment: "Distribuição (prospect)", place: "Manaus, AM", timeZone: "America/Manaus", tint: "#4b6b2a", rep: { name: "Cláudio Aguiar", role: "Diretor de expansão", email: "claudio@redesabor.com.br" }, since: "2026-09-18", risk: "medio", checks: [...certs(), ...compliance({ lgpd: ["pendente"] })] },
  { id: "k13", name: "Tejo Packaging Solutions, Lda", short: "Tejo Packaging", taxLabel: "NIPC", taxId: "PT 515 876 943", segment: "P&D de embalagens", place: "Lisboa, Portugal", timeZone: "Europe/Lisbon", tint: "#5a4636", rep: { name: "Rui Carvalho", role: "Administrador", email: "rui.carvalho@tejopack.pt" }, since: "2026-09-12", risk: "baixo", checks: [...compliance({ ubo: ["pendente", "Empresa estrangeira: pedir certidão permanente do registro comercial."] })] },
  { id: "k14", name: "Movimenta Locação de Equipamentos Ltda", short: "Movimenta", taxLabel: "CNPJ", taxId: "07.611.430/0001-85", segment: "Locação de empilhadeiras", place: "Sorocaba, SP", timeZone: "America/Sao_Paulo", tint: "#7a3f2f", rep: { name: "Henrique Salles", role: "Gerente comercial", email: "henrique@movimenta.com.br" }, since: "2025-03-01", risk: "baixo", checks: [...certs({ federal: ["vencida", -3] }), ...compliance()] },
  { id: "k15", name: "Polar Refrigeração Industrial Ltda", short: "Polar Refrigeração", taxLabel: "CNPJ", taxId: "12.908.553/0001-14", segment: "Manutenção industrial", place: "Campinas, SP", timeZone: "America/Sao_Paulo", tint: "#2f6b7a", rep: { name: "Wagner Toledo", role: "Sócio-administrador", email: "wagner@polarref.com.br" }, since: "2025-04-01", risk: "baixo", checks: [...certs(), ...compliance()] },
  { id: "k16", name: "Assina Fácil Tecnologia Ltda", short: "Assina Fácil", taxLabel: "CNPJ", taxId: "29.540.776/0001-02", segment: "Software (SaaS)", place: "Belo Horizonte, MG", timeZone: "America/Sao_Paulo", tint: "#3d5a80", rep: { name: "Natália Brum", role: "Head de vendas", email: "natalia@assinafacil.com.br" }, since: "2026-04-10", risk: "baixo", checks: [...certs(), ...compliance()] },
  { id: "k17", name: "Energia Livre Comercializadora S.A.", short: "Energia Livre", taxLabel: "CNPJ", taxId: "15.287.640/0001-71", segment: "Energia (mercado livre)", place: "Rio de Janeiro, RJ", timeZone: "America/Sao_Paulo", tint: "#8a7a1f", rep: { name: "Daniela Fontes", role: "Diretora comercial", email: "daniela@energialivre.com.br" }, since: "2022-01-01", risk: "baixo", checks: [...certs(), ...compliance()] },
];
export const counterpartyById = (id: string) => counterparties.find((c) => c.id === id) ?? counterparties[0];

/** Situação da due diligence: pior estado entre as verificações. */
export function diligenceOf(c: Counterparty): { label: string; tone: "ok" | "warn" | "bad" | "neutral"; issues: number } {
  const bad = c.checks.filter((x) => x.status === "vencida").length;
  const warn = c.checks.filter((x) => x.status === "alerta" || x.status === "pendente").length;
  if (bad) return { label: bad === 1 ? "Certidão vencida" : `${bad} certidões vencidas`, tone: "bad", issues: bad + warn };
  if (warn) return { label: warn === 1 ? "1 pendência" : `${warn} pendências`, tone: "warn", issues: warn };
  return { label: "Em dia", tone: "ok", issues: 0 };
}
export const checkStatus: Record<CheckStatus, { label: string; tone: "ok" | "warn" | "bad" | "neutral" }> = {
  ok: { label: "Regular", tone: "ok" },
  vencida: { label: "Vencida", tone: "bad" },
  pendente: { label: "Pendente", tone: "warn" },
  alerta: { label: "Atenção", tone: "warn" },
};
export const riskInfo: Record<Risk, { label: string; tone: "ok" | "warn" | "bad" }> = {
  baixo: { label: "Risco baixo", tone: "ok" },
  medio: { label: "Risco médio", tone: "warn" },
  alto: { label: "Risco alto", tone: "bad" },
};

/* ------------------------------------------------------------------ */
/* Contratos                                                           */
/* ------------------------------------------------------------------ */

export type ContractType = "servico" | "fornecimento" | "nda" | "locacao" | "saas";
export const contractTypes: Record<ContractType, { label: string; short: string }> = {
  servico: { label: "Prestação de serviço", short: "Serviço" },
  fornecimento: { label: "Fornecimento", short: "Fornecimento" },
  nda: { label: "Confidencialidade (NDA)", short: "NDA" },
  locacao: { label: "Locação", short: "Locação" },
  saas: { label: "Licença de software (SaaS)", short: "SaaS" },
};

export type ContractStatus = "rascunho" | "negociacao" | "aprovacao" | "assinatura" | "vigente" | "vencido" | "encerrado";
export const contractStatus: Record<ContractStatus, { label: string; tone: "neutral" | "info" | "warn" | "ok" | "bad" | "accent" }> = {
  rascunho: { label: "Rascunho", tone: "neutral" },
  negociacao: { label: "Em negociação", tone: "info" },
  aprovacao: { label: "Em aprovação", tone: "warn" },
  assinatura: { label: "Aguardando assinatura", tone: "accent" },
  vigente: { label: "Vigente", tone: "ok" },
  vencido: { label: "Vencido", tone: "bad" },
  encerrado: { label: "Encerrado", tone: "neutral" },
};
/** Caminho do contrato até entrar em vigor (StagePath). */
export const contractFlow: { id: ContractStatus; label: string }[] = [
  { id: "rascunho", label: "Rascunho" },
  { id: "negociacao", label: "Negociação" },
  { id: "aprovacao", label: "Aprovação" },
  { id: "assinatura", label: "Assinatura" },
  { id: "vigente", label: "Vigente" },
];

export type Renewal = "automatica" | "manual" | "nenhuma";
export const renewalInfo: Record<Renewal, string> = { automatica: "Automática", manual: "Por aditivo", nenhuma: "Sem renovação" };
export type PriceIndex = "IPCA" | "IGP-M" | "INPC" | "Sem reajuste";

export type ClauseCategory = "objeto" | "pagamento" | "vigencia" | "reajuste" | "multa" | "rescisao" | "responsabilidade" | "lgpd" | "confidencialidade" | "foro" | "sla" | "garantia";
export const clauseCategories: Record<ClauseCategory, string> = {
  objeto: "Objeto",
  pagamento: "Pagamento",
  vigencia: "Vigência e renovação",
  reajuste: "Reajuste",
  multa: "Multas e penalidades",
  rescisao: "Rescisão",
  responsabilidade: "Limitação de responsabilidade",
  lgpd: "Proteção de dados (LGPD)",
  confidencialidade: "Confidencialidade",
  foro: "Foro",
  sla: "Nível de serviço (SLA)",
  garantia: "Garantias e seguros",
};

/** Cláusula que foge do modelo padrão (o que a aprovação precisa ver). */
export type Deviation = {
  category: ClauseCategory;
  title: string;
  standard: string;
  proposed: string;
  risk: Risk;
  /** Quem pediu e por quê. */
  note?: string;
  /** Já existe como alternativa aprovada na biblioteca de cláusulas. */
  approvedAlternative?: boolean;
};

export type Contract = {
  id: string;
  number: string;
  title: string;
  type: ContractType;
  counterpartyId: string;
  /** Valor total do contrato (0 para NDA). */
  value: number;
  /** Valor mensal, quando é recorrente. */
  monthly?: number;
  start: string;
  end: string;
  renewal: Renewal;
  /** Aviso prévio para não renovar (dias antes do fim). */
  noticeDays: number;
  index: PriceIndex;
  /** Responsável no Jurídico. */
  owner: string;
  /** Quem pediu o contrato. */
  requester: string;
  area: Area;
  costCenter: string;
  status: ContractStatus;
  templateId: string;
  /** Multa por descumprimento, como está no contrato. */
  penalty: string;
  paymentTerms: string;
  lgpd: "operador" | "controlador conjunto" | "não trata dados pessoais";
  deviations: Deviation[];
  /** Última movimentação (ISO). */
  updated: string;
  signedAt?: string;
};

/* Cláusulas fora do padrão reaproveitadas abaixo. */
const devLiability = (proposed: string, note: string, risk: Risk = "alto"): Deviation => ({
  category: "responsabilidade",
  title: "Limite de responsabilidade",
  standard: "Responsabilidade limitada a 12 meses de faturamento, exceto dolo, culpa grave, dano a terceiros e violação de dados pessoais.",
  proposed,
  risk,
  note,
});

const hero: Contract[] = [
  {
    id: "c1",
    number: "CT-2026-0142",
    title: "Transporte refrigerado de produtos acabados",
    type: "servico",
    counterpartyId: "k1",
    value: 2_840_000,
    monthly: 118_333.33,
    start: iso(15),
    end: iso(745),
    renewal: "automatica",
    noticeDays: 90,
    index: "IPCA",
    owner: "p1",
    requester: "p4",
    area: "Suprimentos",
    costCenter: "2.04 · Logística de distribuição",
    status: "assinatura",
    templateId: "t1",
    penalty: "5 % do valor anual, proporcional ao período restante",
    paymentTerms: "Mensal, 30 dias após o aceite da medição",
    lgpd: "operador",
    deviations: [
      { category: "multa", title: "Multa por rescisão imotivada", standard: "10 % do valor anual remanescente, para qualquer das partes.", proposed: "5 % do valor anual remanescente, para qualquer das partes.", risk: "medio", note: "Frio Sul só aceitou o SLA de 98 % de entregas no prazo com a multa reduzida. Suprimentos concorda.", approvedAlternative: true },
      devLiability("Responsabilidade limitada a 6 meses de faturamento, exceto dolo e culpa grave.", "Contraparte pediu 3 meses; contraproposta de 6 meses aceita. Avaria de carga fica fora do limite (seguro RCTR-C).", "medio"),
    ],
    updated: iso(-1),
  },
  {
    id: "c2",
    number: "CT-2026-0151",
    title: "Licença SaaS de planejamento de demanda",
    type: "saas",
    counterpartyId: "k2",
    value: 486_000,
    monthly: 13_500,
    start: iso(31),
    end: iso(31 + 1095),
    renewal: "automatica",
    noticeDays: 60,
    index: "IPCA",
    owner: "p7",
    requester: "p6",
    area: "TI",
    costCenter: "6.01 · Sistemas corporativos",
    status: "aprovacao",
    templateId: "t5",
    penalty: "Créditos de serviço até 20 % da mensalidade por indisponibilidade",
    paymentTerms: "Mensal, boleto com vencimento no dia 10",
    lgpd: "operador",
    deviations: [
      { category: "foro", title: "Foro de eleição", standard: "Comarca de Campinas/SP.", proposed: "Comarca de São Paulo/SP.", risk: "baixo", note: "Padrão do fornecedor para todos os clientes. Sem impacto prático relevante.", approvedAlternative: true },
      devLiability("Responsabilidade limitada ao valor pago nos últimos 12 meses, inclusive para incidentes de dados pessoais.", "Fornecedor não aceita excluir incidentes de dados do limite. TI considera o sistema crítico para o S&OP."),
      { category: "lgpd", title: "Subprocessadores", standard: "Novo subprocessador só com aviso de 30 dias e direito de objeção; transferência internacional com cláusulas-padrão da ANPD.", proposed: "Lista de subprocessadores publicada no site, atualizada sem aviso prévio. Dados hospedados nos EUA.", risk: "alto", note: "DPO pediu ao menos aviso por e-mail e as cláusulas-padrão contratuais da ANPD." },
      { category: "vigencia", title: "Renovação automática", standard: "Renovação automática por 12 meses, com aviso prévio de 60 dias.", proposed: "Renovação automática por novos 36 meses, com aviso prévio de 90 dias.", risk: "medio" },
    ],
    updated: iso(-2),
  },
  {
    id: "c3",
    number: "CT-2026-0155",
    title: "Fornecimento de embalagens flexíveis 2027",
    type: "fornecimento",
    counterpartyId: "k3",
    value: 3_960_000,
    monthly: 330_000,
    start: iso(93),
    end: iso(457),
    renewal: "manual",
    noticeDays: 90,
    index: "IGP-M",
    owner: "p1",
    requester: "p3",
    area: "Suprimentos",
    costCenter: "1.03 · Materiais de embalagem",
    status: "aprovacao",
    templateId: "t2",
    penalty: "0,2 % ao dia de atraso, limitado a 5 % do pedido",
    paymentTerms: "28 dias da entrega, via DDA",
    lgpd: "não trata dados pessoais",
    deviations: [
      { category: "reajuste", title: "Periodicidade do reajuste", standard: "Reajuste anual pelo IPCA, na data-base do contrato.", proposed: "Reajuste trimestral pelo IGP-M, com repasse automático da variação da resina (polietileno).", risk: "alto", note: "Fornecedor alega volatilidade da resina. Suprimentos sugere aceitar com teto de 4 % por trimestre." },
      { category: "multa", title: "Multa por atraso na entrega", standard: "0,5 % ao dia de atraso, limitada a 10 % do valor do pedido.", proposed: "0,2 % ao dia de atraso, limitada a 5 % do valor do pedido.", risk: "medio", approvedAlternative: true },
    ],
    updated: iso(-1),
  },
  {
    id: "c4",
    number: "CT-2026-0157",
    title: "NDA · Avaliação de parceria de distribuição na região Norte",
    type: "nda",
    counterpartyId: "k12",
    value: 0,
    start: iso(2),
    end: iso(2 + 730),
    renewal: "nenhuma",
    noticeDays: 0,
    index: "Sem reajuste",
    owner: "p7",
    requester: "p11",
    area: "Comercial",
    costCenter: "4.01 · Comercial",
    status: "aprovacao",
    templateId: "t3",
    penalty: "Perdas e danos apurados",
    paymentTerms: "Não se aplica",
    lgpd: "não trata dados pessoais",
    deviations: [
      { category: "confidencialidade", title: "Prazo de confidencialidade", standard: "Obrigação de sigilo por 5 anos após o fim do NDA.", proposed: "Obrigação de sigilo por 2 anos após o fim do NDA.", risk: "medio", note: "Comercial precisa assinar antes da reunião de 08/10 em Manaus." },
    ],
    updated: iso(0),
  },
  {
    id: "c5",
    number: "CT-2024-0088",
    title: "Locação do CD Jundiaí (galpão de 12.400 m²)",
    type: "locacao",
    counterpartyId: "k4",
    value: 312_000 * 60,
    monthly: 312_000,
    start: iso(-700),
    end: iso(1125),
    renewal: "manual",
    noticeDays: 180,
    index: "IGP-M",
    owner: "p2",
    requester: "p8",
    area: "Operações",
    costCenter: "2.01 · Armazenagem",
    status: "vigente",
    templateId: "t4",
    penalty: "3 aluguéis, proporcional ao tempo restante (Lei 8.245/91)",
    paymentTerms: "Mensal, até o 5º dia útil",
    lgpd: "não trata dados pessoais",
    deviations: [],
    updated: iso(-14),
    signedAt: iso(-712),
  },
  {
    id: "c6",
    number: "CT-2025-0041",
    title: "Limpeza e conservação da fábrica de Campinas",
    type: "servico",
    counterpartyId: "k5",
    value: 86_500 * 12,
    monthly: 86_500,
    start: iso(-317),
    end: iso(48),
    renewal: "automatica",
    noticeDays: 30,
    index: "INPC",
    owner: "p7",
    requester: "p12",
    area: "Facilities",
    costCenter: "5.02 · Facilities fábrica",
    status: "vigente",
    templateId: "t1",
    penalty: "10 % do valor anual remanescente",
    paymentTerms: "Mensal, 15 dias após a medição",
    lgpd: "operador",
    deviations: [],
    updated: iso(-3),
    signedAt: iso(-320),
  },
  {
    id: "c7",
    number: "CT-2025-0102",
    title: "Fornecimento de milho em grão · safra 2025/26",
    type: "fornecimento",
    counterpartyId: "k6",
    value: 5_400_000,
    start: iso(-290),
    end: iso(75),
    renewal: "manual",
    noticeDays: 60,
    index: "Sem reajuste",
    owner: "p1",
    requester: "p3",
    area: "Suprimentos",
    costCenter: "1.01 · Matéria-prima",
    status: "vigente",
    templateId: "t2",
    penalty: "Preço fixo por saca; quebra de entrega com multa de 2 % sobre o volume faltante",
    paymentTerms: "15 dias da entrega de cada lote",
    lgpd: "não trata dados pessoais",
    deviations: [],
    updated: iso(-5),
    signedAt: iso(-295),
  },
  {
    id: "c8",
    number: "CT-2024-0067",
    title: "Links de dados MPLS e telefonia das unidades",
    type: "servico",
    counterpartyId: "k7",
    value: 24_800 * 36,
    monthly: 24_800,
    start: iso(-1027),
    end: iso(68),
    renewal: "automatica",
    noticeDays: 60,
    index: "IPCA",
    owner: "p7",
    requester: "p6",
    area: "TI",
    costCenter: "6.02 · Infraestrutura",
    status: "vigente",
    templateId: "t1",
    penalty: "Desconto de 1/30 da mensalidade por hora de indisponibilidade acima do SLA",
    paymentTerms: "Mensal, vencimento no dia 20",
    lgpd: "operador",
    deviations: [],
    updated: iso(-9),
    signedAt: iso(-1030),
  },
  {
    id: "c9",
    number: "CT-2025-0119",
    title: "Plataforma de BI e painéis de vendas",
    type: "saas",
    counterpartyId: "k9",
    value: 198_000,
    monthly: 16_500,
    start: iso(-343),
    end: iso(22),
    renewal: "automatica",
    noticeDays: 30,
    index: "IPCA",
    owner: "p7",
    requester: "p11",
    area: "Comercial",
    costCenter: "4.03 · Inteligência comercial",
    status: "vigente",
    templateId: "t5",
    penalty: "Créditos de serviço até 10 % da mensalidade",
    paymentTerms: "Anual antecipado",
    lgpd: "operador",
    deviations: [],
    updated: iso(-20),
    signedAt: iso(-350),
  },
  {
    id: "c10",
    number: "CT-2026-0133",
    title: "Fornecimento de produtos à rede Bom Preço (Nordeste)",
    type: "fornecimento",
    counterpartyId: "k10",
    value: 7_200_000,
    monthly: 600_000,
    start: iso(-60),
    end: iso(305),
    renewal: "manual",
    noticeDays: 90,
    index: "IPCA",
    owner: "p2",
    requester: "p11",
    area: "Comercial",
    costCenter: "4.01 · Comercial",
    status: "vigente",
    templateId: "t2",
    penalty: "Ruptura acima de 5 % do pedido: desconto de 3 % na fatura do mês",
    paymentTerms: "45 dias da entrega",
    lgpd: "não trata dados pessoais",
    deviations: [],
    updated: iso(-6),
    signedAt: iso(-62),
  },
  {
    id: "c11",
    number: "CT-2026-0160",
    title: "Vigilância patrimonial do CD Jundiaí",
    type: "servico",
    counterpartyId: "k11",
    value: 54_000 * 24,
    monthly: 54_000,
    start: iso(32),
    end: iso(762),
    renewal: "automatica",
    noticeDays: 60,
    index: "INPC",
    owner: "p1",
    requester: "p8",
    area: "Operações",
    costCenter: "2.01 · Armazenagem",
    status: "negociacao",
    templateId: "t1",
    penalty: "10 % do valor anual remanescente",
    paymentTerms: "Mensal, 30 dias após a medição",
    lgpd: "operador",
    deviations: [{ category: "garantia", title: "Seguro de responsabilidade civil", standard: "Apólice de RC geral de R$ 2 milhões, com a Vereda como beneficiária.", proposed: "Apólice de RC geral de R$ 500 mil.", risk: "alto" }],
    updated: iso(-1),
  },
  {
    id: "c12",
    number: "CT-2026-0162",
    title: "NDA · Desenvolvimento de embalagem 100 % reciclável",
    type: "nda",
    counterpartyId: "k13",
    value: 0,
    start: iso(0),
    end: iso(1095),
    renewal: "nenhuma",
    noticeDays: 0,
    index: "Sem reajuste",
    owner: "p7",
    requester: "p3",
    area: "Suprimentos",
    costCenter: "1.03 · Materiais de embalagem",
    status: "assinatura",
    templateId: "t3",
    penalty: "Perdas e danos apurados",
    paymentTerms: "Não se aplica",
    lgpd: "não trata dados pessoais",
    deviations: [],
    updated: iso(-2),
  },
  {
    id: "c13",
    number: "CT-2026-0164",
    title: "Assessoria jurídica em contencioso tributário",
    type: "servico",
    counterpartyId: "k8",
    value: 360_000,
    monthly: 30_000,
    start: iso(45),
    end: iso(410),
    renewal: "manual",
    noticeDays: 30,
    index: "IPCA",
    owner: "p2",
    requester: "p5",
    area: "Financeiro",
    costCenter: "7.01 · Jurídico",
    status: "rascunho",
    templateId: "t1",
    penalty: "10 % do valor anual remanescente",
    paymentTerms: "Mensal fixo + êxito de 8 % sobre o crédito recuperado",
    lgpd: "controlador conjunto",
    deviations: [],
    updated: iso(0),
  },
  {
    id: "c14",
    number: "CT-2021-0019",
    title: "Licença do sistema de folha de pagamento",
    type: "saas",
    counterpartyId: "k2",
    value: 264_000,
    monthly: 5_500,
    start: iso(-1640),
    end: iso(-180),
    renewal: "nenhuma",
    noticeDays: 60,
    index: "IGP-M",
    owner: "p7",
    requester: "p6",
    area: "TI",
    costCenter: "6.01 · Sistemas corporativos",
    status: "encerrado",
    templateId: "t5",
    penalty: "—",
    paymentTerms: "Mensal",
    lgpd: "operador",
    deviations: [],
    updated: iso(-180),
    signedAt: iso(-1645),
  },
  {
    id: "c15",
    number: "CT-2025-0091",
    title: "Locação de 8 empilhadeiras elétricas",
    type: "locacao",
    counterpartyId: "k14",
    value: 41_600 * 18,
    monthly: 41_600,
    start: iso(-560),
    end: iso(-12),
    renewal: "manual",
    noticeDays: 30,
    index: "IGP-M",
    owner: "p1",
    requester: "p8",
    area: "Operações",
    costCenter: "2.01 · Armazenagem",
    status: "vencido",
    templateId: "t4",
    penalty: "1 aluguel",
    paymentTerms: "Mensal, dia 10",
    lgpd: "não trata dados pessoais",
    deviations: [],
    updated: iso(-12),
    signedAt: iso(-565),
  },
  {
    id: "c16",
    number: "CT-2025-0110",
    title: "Manutenção preventiva das câmaras frias",
    type: "servico",
    counterpartyId: "k15",
    value: 18_900 * 12,
    monthly: 18_900,
    start: iso(-277),
    end: iso(88),
    renewal: "automatica",
    noticeDays: 60,
    index: "IPCA",
    owner: "p7",
    requester: "p8",
    area: "Operações",
    costCenter: "3.02 · Manutenção",
    status: "vigente",
    templateId: "t1",
    penalty: "10 % do valor anual remanescente",
    paymentTerms: "Mensal, 30 dias",
    lgpd: "não trata dados pessoais",
    deviations: [],
    updated: iso(-30),
    signedAt: iso(-280),
  },
  {
    id: "c17",
    number: "CT-2026-0128",
    title: "Fornecimento de óleo de soja refinado",
    type: "fornecimento",
    counterpartyId: "k6",
    value: 2_160_000,
    monthly: 180_000,
    start: iso(-125),
    end: iso(240),
    renewal: "manual",
    noticeDays: 60,
    index: "Sem reajuste",
    owner: "p1",
    requester: "p3",
    area: "Suprimentos",
    costCenter: "1.01 · Matéria-prima",
    status: "vigente",
    templateId: "t2",
    penalty: "2 % sobre o volume não entregue",
    paymentTerms: "28 dias da entrega",
    lgpd: "não trata dados pessoais",
    deviations: [],
    updated: iso(-11),
    signedAt: iso(-127),
  },
  {
    id: "c18",
    number: "CT-2026-0140",
    title: "Plataforma de assinatura eletrônica",
    type: "saas",
    counterpartyId: "k16",
    value: 38_400,
    monthly: 3_200,
    start: iso(-165),
    end: iso(200),
    renewal: "automatica",
    noticeDays: 30,
    index: "IPCA",
    owner: "p7",
    requester: "p2",
    area: "Jurídico",
    costCenter: "7.01 · Jurídico",
    status: "vigente",
    templateId: "t5",
    penalty: "Créditos de serviço",
    paymentTerms: "Mensal, cartão corporativo",
    lgpd: "operador",
    deviations: [],
    updated: iso(-40),
    signedAt: iso(-166),
  },
  {
    id: "c19",
    number: "CT-2026-0166",
    title: "NDA · Homologação de fornecedor alternativo de filme BOPP",
    type: "nda",
    counterpartyId: "k3",
    value: 0,
    start: iso(5),
    end: iso(735),
    renewal: "nenhuma",
    noticeDays: 0,
    index: "Sem reajuste",
    owner: "p7",
    requester: "p3",
    area: "Suprimentos",
    costCenter: "1.03 · Materiais de embalagem",
    status: "rascunho",
    templateId: "t3",
    penalty: "Perdas e danos apurados",
    paymentTerms: "Não se aplica",
    lgpd: "não trata dados pessoais",
    deviations: [],
    updated: iso(0),
  },
  {
    id: "c20",
    number: "CT-2026-0158",
    title: "Consultoria de adequação à LGPD · fase 2",
    type: "servico",
    counterpartyId: "k8",
    value: 148_000,
    start: iso(20),
    end: iso(200),
    renewal: "nenhuma",
    noticeDays: 0,
    index: "Sem reajuste",
    owner: "p2",
    requester: "p9",
    area: "Jurídico",
    costCenter: "7.01 · Jurídico",
    status: "negociacao",
    templateId: "t1",
    penalty: "10 % do valor remanescente",
    paymentTerms: "3 parcelas por entrega aceita",
    lgpd: "controlador conjunto",
    deviations: [],
    updated: iso(-4),
  },
  {
    id: "c21",
    number: "CT-2022-0072",
    title: "Compra de energia elétrica no mercado livre",
    type: "fornecimento",
    counterpartyId: "k17",
    value: 9_840_000,
    monthly: 205_000,
    start: iso(-1405),
    end: iso(55),
    renewal: "manual",
    noticeDays: 180,
    index: "IPCA",
    owner: "p2",
    requester: "p8",
    area: "Operações",
    costCenter: "3.01 · Utilidades",
    status: "vigente",
    templateId: "t2",
    penalty: "Take-or-pay: mínimo de 85 % do volume contratado",
    paymentTerms: "Mensal, dia 15",
    lgpd: "não trata dados pessoais",
    deviations: [],
    updated: iso(-2),
    signedAt: iso(-1410),
  },
];

/*
 * Restante da carteira em forma compacta: [título, tipo, contraparte, valor
 * total, mensal, início (dias), fim (dias), renovação, aviso, índice, dono,
 * pedinte, área, situação]. Mantém os gráficos e a lista realistas.
 */
type Row = [string, ContractType, string, number, number | undefined, number, number, Renewal, number, PriceIndex, string, string, Area, ContractStatus];
const rows: Row[] = [
  ["Transporte de matéria-prima · rota Goiás", "servico", "k1", 1_120_000, 93_333, -200, 165, "automatica", 60, "IPCA", "p1", "p3", "Suprimentos", "vigente"],
  ["Fornecimento de açúcar cristal", "fornecimento", "k6", 1_890_000, 157_500, -240, 125, "manual", 60, "Sem reajuste", "p1", "p3", "Suprimentos", "vigente"],
  ["Fornecimento de caixas de papelão ondulado", "fornecimento", "k3", 1_344_000, 112_000, -150, 215, "manual", 90, "IGP-M", "p1", "p3", "Suprimentos", "vigente"],
  ["Rótulos e etiquetas autoadesivas", "fornecimento", "k3", 412_000, 34_333, -310, 55, "automatica", 60, "IGP-M", "p7", "p3", "Suprimentos", "vigente"],
  ["Monitoramento de frota por telemetria", "saas", "k7", 96_000, 4_000, -400, 330, "automatica", 30, "IPCA", "p7", "p8", "Operações", "vigente"],
  ["Licença de ERP · módulo fiscal", "saas", "k2", 732_000, 20_333, -620, 475, "automatica", 90, "IGP-M", "p7", "p6", "TI", "vigente"],
  ["Locação do escritório comercial em Recife", "locacao", "k4", 14_500 * 30, 14_500, -420, 480, "manual", 90, "IGP-M", "p2", "p11", "Comercial", "vigente"],
  ["Restaurante industrial · fábrica Campinas", "servico", "k5", 2_280_000, 190_000, -260, 105, "automatica", 60, "INPC", "p7", "p12", "Facilities", "vigente"],
  ["Coleta e destinação de resíduos industriais", "servico", "k15", 312_000, 26_000, -330, 35, "automatica", 30, "IPCA", "p7", "p12", "Facilities", "vigente"],
  ["Auditoria independente das demonstrações 2026", "servico", "k8", 286_000, undefined, -180, 150, "nenhuma", 0, "Sem reajuste", "p2", "p5", "Financeiro", "vigente"],
  ["Seguro patrimonial e de lucros cessantes", "servico", "k17", 418_000, undefined, -270, 95, "manual", 30, "Sem reajuste", "p2", "p5", "Financeiro", "vigente"],
  ["Calibração de balanças e instrumentos", "servico", "k15", 64_800, 5_400, -100, 265, "automatica", 30, "IPCA", "p7", "p8", "Operações", "vigente"],
  ["Fornecimento de farinha de trigo tipo 1", "fornecimento", "k6", 3_120_000, 260_000, -45, 320, "manual", 60, "Sem reajuste", "p1", "p3", "Suprimentos", "vigente"],
  ["Distribuição exclusiva · Grande Belém", "fornecimento", "k12", 4_800_000, 400_000, -500, 230, "manual", 120, "IPCA", "p2", "p11", "Comercial", "vigente"],
  ["CRM e força de vendas", "saas", "k9", 158_400, 4_400, -220, 875, "automatica", 60, "IPCA", "p7", "p11", "Comercial", "vigente"],
  ["Licença de segurança de endpoints", "saas", "k7", 72_000, 6_000, -310, 28, "automatica", 30, "IPCA", "p7", "p6", "TI", "vigente"],
  ["Armazenagem refrigerada em Recife (3PL)", "servico", "k1", 1_560_000, 130_000, -50, 315, "automatica", 90, "IPCA", "p1", "p8", "Operações", "vigente"],
  ["Manutenção de empilhadeiras e paleteiras", "servico", "k14", 118_800, 9_900, -330, 62, "automatica", 30, "IGP-M", "p7", "p8", "Operações", "vigente"],
  ["Fornecimento de embalagens de vidro", "fornecimento", "k3", 980_000, 81_667, -60, 4, "manual", 60, "IGP-M", "p1", "p3", "Suprimentos", "vigente"],
  ["Treinamentos de segurança (NR-12 e NR-35)", "servico", "k8", 54_000, undefined, -200, -30, "nenhuma", 0, "Sem reajuste", "p7", "p12", "Facilities", "encerrado"],
  ["Pesquisa de mercado · categoria biscoitos", "servico", "k9", 136_000, undefined, -150, -20, "nenhuma", 0, "Sem reajuste", "p7", "p11", "Comercial", "vencido"],
  ["Uniformes e EPIs", "fornecimento", "k5", 210_000, 17_500, 5, 370, "manual", 30, "IPCA", "p7", "p12", "Facilities", "negociacao"],
  ["Laboratório de análises microbiológicas", "servico", "k15", 172_800, 14_400, 20, 385, "automatica", 60, "IPCA", "p1", "p8", "Operações", "rascunho"],
  ["Gestão de viagens corporativas", "servico", "k16", 240_000, undefined, 15, 380, "automatica", 30, "Sem reajuste", "p7", "p5", "Financeiro", "negociacao"],
];
const templateFor: Record<ContractType, string> = { servico: "t1", fornecimento: "t2", nda: "t3", locacao: "t4", saas: "t5" };
const rest: Contract[] = rows.map(([title, type, k, value, monthly, s, e, renewal, notice, index, owner, requester, area, status], i) => ({
  id: `c${30 + i}`,
  number: `CT-${2026 + Math.min(0, Math.floor(s / 365))}-${String(40 + i * 3).padStart(4, "0")}`,
  title,
  type,
  counterpartyId: k,
  value,
  monthly,
  start: iso(s),
  end: iso(e),
  renewal,
  noticeDays: notice,
  index,
  owner,
  requester,
  area,
  costCenter: { Suprimentos: "1.01 · Matéria-prima", TI: "6.01 · Sistemas corporativos", Facilities: "5.02 · Facilities fábrica", Operações: "2.01 · Armazenagem", Comercial: "4.01 · Comercial", Financeiro: "7.02 · Controladoria", Jurídico: "7.01 · Jurídico" }[area],
  status,
  templateId: templateFor[type],
  penalty: type === "fornecimento" ? "0,5 % ao dia de atraso, limitada a 10 % do pedido" : "10 % do valor anual remanescente",
  paymentTerms: monthly ? "Mensal, 30 dias após a medição" : "Por entrega aceita",
  lgpd: type === "saas" || type === "servico" ? "operador" : "não trata dados pessoais",
  deviations: [],
  updated: iso(Math.min(-1, s + 3)),
  signedAt: status === "vigente" || status === "vencido" || status === "encerrado" ? iso(s - 3) : undefined,
}));

/** Carteira inteira (mutável: o fluxo de nova solicitação acrescenta rascunhos). */
export const contracts: Contract[] = [...hero, ...rest];
export const contractById = (id: string | null | undefined) => contracts.find((c) => c.id === id) ?? contracts[0];
export function addContract(c: Contract) {
  contracts.unshift(c);
  return c;
}
let seq = 167;
/** Próximo número livre (rascunhos criados nesta sessão). */
export const nextNumber = () => `CT-2026-${String(seq++).padStart(4, "0")}`;

/** Prazo do aviso prévio (último dia para avisar que não renova). */
export const noticeDeadline = (c: Contract) => addDays(c.end, -c.noticeDays);
export const daysToEnd = (c: Contract) => daysFromToday(c.end);
export const isActive = (c: Contract) => c.status === "vigente";
/** Vigente com fim na janela (0 a N dias). */
export const endingWithin = (c: Contract, days: number) => isActive(c) && daysToEnd(c) >= 0 && daysToEnd(c) <= days;
/** Renovação automática cujo aviso prévio ainda não passou ou passou há pouco: pede decisão. */
export const renewalToDecide = (c: Contract) => isActive(c) && c.renewal === "automatica" && daysToEnd(c) <= 120 && daysToEnd(c) >= 0;
export const annualValue = (c: Contract) => (c.monthly ? c.monthly * 12 : c.value);

/* ------------------------------------------------------------------ */
/* Cláusulas-chave extraídas (Resumo do contrato)                      */
/* ------------------------------------------------------------------ */

export type KeyClause = { id: string; category: ClauseCategory; ref: string; summary: string; risk: Risk; deviation?: Deviation };

export function keyClauses(c: Contract): KeyClause[] {
  const months = Math.round(daysFromToday(c.end) / 30 - daysFromToday(c.start) / 30);
  const dev = (cat: ClauseCategory) => c.deviations.find((d) => d.category === cat);
  const base: Omit<KeyClause, "risk" | "deviation">[] = [
    { id: "objeto", category: "objeto", ref: "Cláusula 1ª", summary: `${c.title}. ${contractTypes[c.type].label}.` },
    { id: "pagamento", category: "pagamento", ref: "Cláusula 4ª", summary: c.value ? `${c.paymentTerms}. Nota fiscal emitida contra ${company.cnpj}.` : "Sem contraprestação financeira." },
    { id: "vigencia", category: "vigencia", ref: "Cláusula 5ª", summary: `${months} meses. ${c.renewal === "automatica" ? `Renova automaticamente por 12 meses se ninguém avisar com ${c.noticeDays} dias de antecedência.` : c.renewal === "manual" ? `Renovação só por aditivo; negociar com ${c.noticeDays} dias de antecedência.` : "Não renova."}` },
    { id: "reajuste", category: "reajuste", ref: "Cláusula 6ª", summary: c.index === "Sem reajuste" ? "Preço fixo durante a vigência." : `Anual pelo ${c.index} acumulado em 12 meses, na data-base de ${new Date(`${c.start}T00:00:00`).toLocaleDateString("pt-BR", { month: "long" })}.` },
    { id: "multa", category: "multa", ref: "Cláusula 9ª", summary: c.penalty },
    { id: "responsabilidade", category: "responsabilidade", ref: "Cláusula 10ª", summary: "Limitada a 12 meses de faturamento, exceto dolo, culpa grave, dano a terceiros e violação de dados pessoais." },
    { id: "lgpd", category: "lgpd", ref: "Cláusula 12ª", summary: c.lgpd === "não trata dados pessoais" ? "Não há tratamento de dados pessoais." : c.lgpd === "operador" ? "Contraparte atua como operadora; incidente comunicado em até 48 h; DPA anexo." : "Controladores conjuntos; responsabilidades divididas no anexo de dados." },
    { id: "foro", category: "foro", ref: "Cláusula 15ª", summary: `${company.forum}, com renúncia a qualquer outro.` },
  ];
  return base.map((b) => {
    const d = dev(b.category);
    return { ...b, summary: d ? d.proposed : b.summary, risk: d ? d.risk : "baixo", deviation: d };
  });
}

/* ------------------------------------------------------------------ */
/* Assinaturas                                                         */
/* ------------------------------------------------------------------ */

export type SignerStatus = "assinou" | "pendente" | "na-fila" | "recusou";
export type Signer = { id: string; order: number; name: string; role: string; side: "Vereda" | "Contraparte" | "Testemunha"; email: string; method: string; status: SignerStatus; at?: string; sentAt?: string; views?: number };
export const signerStatus: Record<SignerStatus, { label: string; tone: "ok" | "warn" | "neutral" | "bad" }> = {
  assinou: { label: "Assinou", tone: "ok" },
  pendente: { label: "Aguardando assinatura", tone: "warn" },
  "na-fila": { label: "Na fila", tone: "neutral" },
  recusou: { label: "Recusou", tone: "bad" },
};

export function signersFor(c: Contract): Signer[] {
  const k = counterpartyById(c.counterpartyId);
  const foreign = k.taxLabel !== "CNPJ";
  const list: Omit<Signer, "status" | "at" | "sentAt" | "views">[] = [
    { id: "s1", order: 1, name: k.rep.name, role: `${k.rep.role} · ${k.short}`, side: "Contraparte", email: k.rep.email, method: foreign ? "Assinatura eletrônica avançada" : "Certificado ICP-Brasil (e-CNPJ)" },
    { id: "s2", order: 2, name: "Helena Castro", role: "Diretora financeira · Vereda", side: "Vereda", email: "helena.castro@vereda.com.br", method: "Certificado ICP-Brasil (e-CPF)" },
    { id: "s3", order: 3, name: "Gustavo Prado", role: "Diretor-presidente · Vereda", side: "Vereda", email: "gustavo.prado@vereda.com.br", method: "Certificado ICP-Brasil (e-CPF)" },
    { id: "s4", order: 4, name: "Patrícia Rocha", role: "Testemunha", side: "Testemunha", email: "patricia.rocha@vereda.com.br", method: "Assinatura gov.br" },
    { id: "s5", order: 5, name: "Camila Duarte", role: "Testemunha", side: "Testemunha", email: "camila.duarte@vereda.com.br", method: "Assinatura gov.br" },
  ];
  const signed = c.status === "vigente" || c.status === "vencido" || c.status === "encerrado";
  if (signed) return list.map((s, i) => ({ ...s, status: "assinou", at: addDays(c.signedAt ?? c.start, -(4 - i)) }));
  if (c.status !== "assinatura") return list.map((s) => ({ ...s, status: "na-fila" }));
  // Em assinatura: contraparte e diretora já assinaram; presidente com o envelope há 4 dias.
  const done = c.id === "c12" ? 0 : 2;
  return list.map((s, i) => (i < done ? { ...s, status: "assinou", at: iso(-6 + i * 2), sentAt: iso(-8 + i) } : i === done ? { ...s, status: "pendente", sentAt: iso(-4), views: 2 } : { ...s, status: "na-fila" }));
}

/* ------------------------------------------------------------------ */
/* Versões da minuta                                                   */
/* ------------------------------------------------------------------ */

export type ContractVersion = { id: string; version: string; date: string; time: string; author: string; title: string; kind: "major" | "minor"; changes: string[]; tag?: string; file: string };

export function versionsFor(c: Contract): ContractVersion[] {
  const k = counterpartyById(c.counterpartyId);
  const owner = personById(c.owner).name;
  const base = daysFromToday(c.updated);
  if (c.id === "c1")
    return [
      { id: "v1", version: "v0.1", date: iso(-29), time: "10:12", author: owner, title: "Minuta gerada do modelo de prestação de serviços", kind: "minor", changes: ["Modelo “Prestação de serviços · v4.2”", "Dados comerciais da solicitação de Suprimentos"], file: "CT-2026-0142_v0.1.docx" },
      { id: "v2", version: "v0.2", date: iso(-26), time: "15:40", author: "Bruno Azevedo", title: "Anexo de SLA e tabela de frete", kind: "minor", changes: ["Anexo II: SLA de 98 % de entregas no prazo", "Anexo III: tabela de frete por rota (14 rotas)"], file: "CT-2026-0142_v0.2.docx" },
      { id: "v3", version: "v1.0", date: iso(-22), time: "09:05", author: owner, title: "Primeira versão enviada à Frio Sul", kind: "major", changes: ["Revisão jurídica completa", "Cláusula de seguro RCTR-C e RC-DC"], file: "CT-2026-0142_v1.0.pdf" },
      { id: "v4", version: "v1.1", date: iso(-15), time: "18:22", author: `${k.rep.name} (${k.short})`, title: "Redline da contraparte", kind: "minor", changes: ["Multa rescisória de 10 % para 3 %", "Limite de responsabilidade de 12 para 3 meses", "Prazo de pagamento de 30 para 15 dias"], file: "CT-2026-0142_v1.1_redline.docx" },
      { id: "v5", version: "v1.2", date: iso(-10), time: "11:30", author: owner, title: "Contraproposta da Vereda", kind: "minor", changes: ["Multa rescisória em 5 %", "Limite de responsabilidade em 6 meses; avaria fora do limite", "Pagamento mantido em 30 dias"], file: "CT-2026-0142_v1.2.docx" },
      { id: "v6", version: "v2.0", date: iso(-6), time: "16:48", author: "Rafael Monteiro", title: "Versão final aprovada", kind: "major", changes: ["Aprovada por Jurídico, Suprimentos e Diretoria financeira", "Enviada para assinatura eletrônica"], tag: "Em assinatura", file: "CT-2026-0142_v2.0.pdf" },
    ];
  const final = c.status === "vigente" || c.status === "vencido" || c.status === "encerrado" || c.status === "assinatura";
  const out: ContractVersion[] = [{ id: "v1", version: "v0.1", date: iso(base - 12), time: "09:30", author: owner, title: `Minuta gerada do modelo ${templateById(c.templateId).name}`, kind: "minor", changes: ["Dados comerciais da solicitação"], file: `${c.number}_v0.1.docx` }];
  if (c.status !== "rascunho") out.push({ id: "v2", version: "v1.0", date: iso(base - 7), time: "14:10", author: owner, title: `Enviada para ${k.short}`, kind: "major", changes: ["Revisão jurídica"], file: `${c.number}_v1.0.pdf` });
  if (c.deviations.length) out.push({ id: "v3", version: "v1.1", date: iso(base - 3), time: "17:55", author: `${k.rep.name} (${k.short})`, title: "Redline da contraparte", kind: "minor", changes: c.deviations.map((d) => d.title), file: `${c.number}_v1.1_redline.docx` });
  if (final) out.push({ id: "v4", version: "v2.0", date: iso(base), time: "10:00", author: "Rafael Monteiro", title: "Versão final", kind: "major", changes: ["Aprovada e enviada para assinatura"], tag: c.status === "assinatura" ? "Em assinatura" : "Assinada", file: `${c.number}_v2.0.pdf` });
  return out;
}

/* ------------------------------------------------------------------ */
/* Obrigações e prazos                                                 */
/* ------------------------------------------------------------------ */

export type ObligationKind = "pagamento" | "entrega" | "reajuste" | "aviso" | "relatorio" | "garantia" | "lgpd";
export const obligationKinds: Record<ObligationKind, string> = {
  pagamento: "Pagamento",
  entrega: "Entrega",
  reajuste: "Reajuste",
  aviso: "Aviso prévio",
  relatorio: "Relatório de SLA",
  garantia: "Garantia e seguro",
  lgpd: "Proteção de dados",
};
export type Obligation = { id: string; contractId: string; title: string; kind: ObligationKind; due: string; owner: string; party: "Vereda" | "Contraparte"; value?: number; done?: boolean; note?: string };

export const obligations: Obligation[] = [
  { id: "o1", contractId: "c6", title: "Renovar apólice de seguro de responsabilidade civil", kind: "garantia", due: iso(-9), owner: "p12", party: "Contraparte", note: "Apólice venceu em 21/09. Limpa Bem prometeu a nova até 25/09." },
  { id: "o2", contractId: "c6", title: "Apresentar CNDT e guias de FGTS/INSS dos terceirizados", kind: "relatorio", due: iso(-4), owner: "p12", party: "Contraparte", note: "Sem isso, a Vereda responde de forma subsidiária (Súmula 331 do TST)." },
  { id: "o3", contractId: "c8", title: "Relatório mensal de disponibilidade dos links", kind: "relatorio", due: iso(-2), owner: "p6", party: "Contraparte" },
  { id: "o4", contractId: "c5", title: "Aluguel do CD Jundiaí · outubro", kind: "pagamento", due: iso(7), owner: "p5", party: "Vereda", value: 312_000 },
  { id: "o5", contractId: "c7", title: "Entrega do lote 9 · 4.200 sacas", kind: "entrega", due: iso(3), owner: "p3", party: "Contraparte" },
  { id: "o6", contractId: "c9", title: "Avisar a Lumina se não for renovar", kind: "aviso", due: iso(-8), owner: "p7", party: "Vereda", note: "Prazo perdido: renova automaticamente em 22/10 por mais 12 meses." },
  { id: "o7", contractId: "c6", title: "Decidir renovação da limpeza (aviso de 30 dias)", kind: "aviso", due: iso(18), owner: "p7", party: "Vereda" },
  { id: "o8", contractId: "c8", title: "Decidir renovação dos links MPLS (aviso de 60 dias)", kind: "aviso", due: iso(8), owner: "p6", party: "Vereda" },
  { id: "o9", contractId: "c5", title: "Reajuste anual do aluguel pelo IGP-M", kind: "reajuste", due: iso(31), owner: "p2", party: "Vereda", note: "IGP-M acumulado de 12 meses: 3,92 %. Conferir o cálculo do locador." },
  { id: "o10", contractId: "c16", title: "Decidir renovação da manutenção das câmaras frias", kind: "aviso", due: iso(28), owner: "p7", party: "Vereda" },
  { id: "o11", contractId: "c10", title: "Relatório trimestral de ruptura para o Bom Preço", kind: "relatorio", due: iso(12), owner: "p11", party: "Vereda" },
  { id: "o12", contractId: "c10", title: "Fatura de setembro do Bom Preço", kind: "pagamento", due: iso(14), owner: "p5", party: "Contraparte", value: 612_480 },
  { id: "o13", contractId: "c17", title: "Entrega mensal de óleo · 180 t", kind: "entrega", due: iso(10), owner: "p3", party: "Contraparte" },
  { id: "o14", contractId: "c21", title: "Negociar a renovação da energia (vence em novembro)", kind: "aviso", due: iso(5), owner: "p2", party: "Vereda", note: "Aviso de 180 dias já passou; contrato acaba sem renovação automática." },
  { id: "o15", contractId: "c18", title: "Mensalidade da plataforma de assinatura", kind: "pagamento", due: iso(10), owner: "p7", party: "Vereda", value: 3_200 },
  { id: "o16", contractId: "c8", title: "Mensalidade dos links e telefonia", kind: "pagamento", due: iso(20), owner: "p6", party: "Vereda", value: 24_800 },
  { id: "o17", contractId: "c6", title: "Medição mensal da limpeza", kind: "pagamento", due: iso(15), owner: "p12", party: "Vereda", value: 86_500 },
  { id: "o18", contractId: "c9", title: "Relatório anual de incidentes de dados", kind: "lgpd", due: iso(40), owner: "p9", party: "Contraparte" },
  { id: "o19", contractId: "c7", title: "Entrega do lote 10 · 4.200 sacas", kind: "entrega", due: iso(33), owner: "p3", party: "Contraparte" },
  { id: "o20", contractId: "c16", title: "Visita preventiva trimestral", kind: "entrega", due: iso(-1), owner: "p8", party: "Contraparte", done: true },
  { id: "o21", contractId: "c5", title: "Aluguel do CD Jundiaí · setembro", kind: "pagamento", due: iso(-23), owner: "p5", party: "Vereda", value: 312_000, done: true },
  { id: "o22", contractId: "c1", title: "Primeira medição do transporte refrigerado", kind: "pagamento", due: iso(45), owner: "p4", party: "Vereda", value: 118_333.33 },
  { id: "o23", contractId: "c1", title: "Entregar apólice RCTR-C com a Vereda como beneficiária", kind: "garantia", due: iso(15), owner: "p4", party: "Contraparte" },
  { id: "o24", contractId: "c21", title: "Fatura de energia · setembro", kind: "pagamento", due: iso(15), owner: "p5", party: "Vereda", value: 205_000 },
  { id: "o25", contractId: "c2", title: "Assinar o DPA com cláusulas-padrão da ANPD", kind: "lgpd", due: iso(31), owner: "p9", party: "Contraparte" },
];
export const isLate = (o: Obligation) => !o.done && daysFromToday(o.due) < 0;

/** Renovações em negociação (ProjectProgressCard). */
export const renewals = [
  {
    id: "r1",
    contractId: "c7",
    title: "Milho em grão · safra 2026/27",
    owner: "p3",
    due: iso(45),
    milestones: [
      { id: "m1", title: "Volume e preço-alvo definidos", description: "64 mil sacas, até R$ 71/saca CIF", status: "done" as const, date: iso(-20) },
      { id: "m2", title: "Cotação com 3 cooperativas", description: "Grãos do Cerrado, Coamo e Comigo", status: "done" as const, date: iso(-6) },
      { id: "m3", title: "Negociação da minuta", description: "Hedge na B3 e multa por quebra", status: "current" as const, date: iso(12) },
      { id: "m4", title: "Aprovação e assinatura", status: "todo" as const, date: iso(45) },
    ],
  },
  {
    id: "r2",
    contractId: "c21",
    title: "Energia no mercado livre · 2027–2030",
    owner: "p2",
    due: iso(40),
    late: false,
    milestones: [
      { id: "m1", title: "Estudo de consumo e perfil de carga", status: "done" as const, date: iso(-35) },
      { id: "m2", title: "Propostas de 4 comercializadoras", status: "current" as const, date: iso(5) },
      { id: "m3", title: "Aprovação da diretoria", description: "Acima de R$ 3 mi: Diretoria", status: "todo" as const, date: iso(25) },
      { id: "m4", title: "Assinatura e registro na CCEE", status: "todo" as const, date: iso(40) },
    ],
  },
  {
    id: "r3",
    contractId: "c15",
    title: "Empilhadeiras elétricas · renovação",
    owner: "p1",
    due: iso(-2),
    late: true,
    milestones: [
      { id: "m1", title: "Levantamento de uso das 8 máquinas", status: "done" as const, date: iso(-40) },
      { id: "m2", title: "Proposta de renovação da Movimenta", status: "done" as const, date: iso(-18) },
      { id: "m3", title: "Aditivo de prazo e reajuste", description: "Contrato venceu: operar sem cobertura é risco", status: "current" as const, date: iso(-2) },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Aprovações                                                          */
/* ------------------------------------------------------------------ */

export type ApprovalStep = { role: string; who: string; state: "done" | "current" | "upcoming"; at?: string; comment?: string };
export type ApprovalStatus = "pendente" | "aprovada" | "recusada";
export type Approval = { id: string; contractId: string; requestedBy: string; requestedAt: string; due: string; reason: string; status: ApprovalStatus; chain: ApprovalStep[]; sameAsTemplate: number };

export const approvals: Approval[] = [
  {
    id: "a1",
    contractId: "c3",
    requestedBy: "p3",
    requestedAt: iso(-1),
    due: iso(2),
    reason: "Contrato anual de embalagens 2027. Fornecedor só mantém o preço de 2026 com reajuste trimestral.",
    status: "pendente",
    sameAsTemplate: 14,
    chain: [
      { role: "Gestor da área", who: "p4", state: "done", at: iso(-1), comment: "De acordo. Preço 6 % abaixo da segunda melhor proposta." },
      { role: "Jurídico", who: "p1", state: "current" },
      { role: "Diretoria financeira", who: "p5", state: "upcoming" },
      { role: "Diretor-presidente", who: "p10", state: "upcoming" },
    ],
  },
  {
    id: "a2",
    contractId: "c2",
    requestedBy: "p6",
    requestedAt: iso(-2),
    due: iso(1),
    reason: "Substitui as planilhas de previsão de demanda. Implantação começa em novembro.",
    status: "pendente",
    sameAsTemplate: 11,
    chain: [
      { role: "Gestor da área", who: "p6", state: "done", at: iso(-2) },
      { role: "Proteção de dados (DPO)", who: "p9", state: "done", at: iso(-1), comment: "Aprovo com ressalva: exigir aviso de novos subprocessadores e as cláusulas-padrão da ANPD." },
      { role: "Jurídico", who: "p1", state: "current" },
      { role: "Diretoria financeira", who: "p5", state: "upcoming" },
    ],
  },
  {
    id: "a3",
    contractId: "c4",
    requestedBy: "p11",
    requestedAt: iso(0),
    due: iso(3),
    reason: "Reunião com a Rede Sabor em Manaus no dia 08/10. Precisam do NDA assinado antes.",
    status: "pendente",
    sameAsTemplate: 9,
    chain: [
      { role: "Gestor da área", who: "p11", state: "done", at: iso(0) },
      { role: "Jurídico", who: "p1", state: "current" },
    ],
  },
  {
    id: "a4",
    contractId: "c1",
    requestedBy: "p4",
    requestedAt: iso(-9),
    due: iso(-6),
    reason: "Novo operador de transporte refrigerado para as rotas Sul e Sudeste.",
    status: "aprovada",
    sameAsTemplate: 13,
    chain: [
      { role: "Gestor da área", who: "p4", state: "done", at: iso(-9) },
      { role: "Jurídico", who: "p1", state: "done", at: iso(-8), comment: "Multa e limite fora do padrão, mas com alternativas aprovadas e seguro cobrindo avaria." },
      { role: "Diretoria financeira", who: "p5", state: "done", at: iso(-6) },
    ],
  },
  {
    id: "a5",
    contractId: "c11",
    requestedBy: "p8",
    requestedAt: iso(-12),
    due: iso(-9),
    reason: "Vigilância 24 h do CD Jundiaí a partir de novembro.",
    status: "recusada",
    sameAsTemplate: 13,
    chain: [
      { role: "Gestor da área", who: "p8", state: "done", at: iso(-12) },
      { role: "Jurídico", who: "p1", state: "done", at: iso(-10), comment: "Recusado: seguro de RC de R$ 500 mil não cobre o estoque do CD. Voltar a negociar com no mínimo R$ 2 mi." },
    ],
  },
];
export const approvalById = (id: string | null | undefined) => approvals.find((a) => a.id === id);
/** Aguardando o usuário atual. */
export const awaitingMe = (a: Approval) => a.status === "pendente" && a.chain.some((s) => s.who === me.id && s.state === "current");

/* ------------------------------------------------------------------ */
/* Modelos e biblioteca de cláusulas                                   */
/* ------------------------------------------------------------------ */

export type Template = {
  id: string;
  name: string;
  type: ContractType | "aditivo" | "dpa";
  version: string;
  lastReview: string;
  reviewer: string;
  /** Contratos gerados nos últimos 12 meses. */
  uses: number;
  /** Áreas que podem gerar sem passar pelo Jurídico (dentro dos limites). */
  selfService: Area[];
  /** Limite de valor para autoatendimento. */
  selfServiceLimit?: number;
  status: "publicado" | "em-revisao";
  clauses: string[];
  description: string;
};

export const templates: Template[] = [
  { id: "t1", name: "Prestação de serviços", type: "servico", version: "4.2", lastReview: iso(-48), reviewer: "p2", uses: 64, selfService: ["Suprimentos", "Facilities"], selfServiceLimit: 300_000, status: "publicado", clauses: ["cl1", "cl2", "cl3", "cl4", "cl5", "cl6", "cl7", "cl8"], description: "Serviços contínuos ou por projeto, com SLA, medição mensal e anexo de dados quando houver tratamento." },
  { id: "t2", name: "Fornecimento de insumos", type: "fornecimento", version: "3.1", lastReview: iso(-120), reviewer: "p1", uses: 41, selfService: ["Suprimentos"], selfServiceLimit: 1_000_000, status: "publicado", clauses: ["cl1", "cl2", "cl3", "cl9", "cl5", "cl8"], description: "Compra recorrente de matéria-prima e embalagens, com pedidos de entrega, especificação técnica e multa por atraso." },
  { id: "t3", name: "Confidencialidade (NDA) mútuo", type: "nda", version: "2.0", lastReview: iso(-200), reviewer: "p2", uses: 87, selfService: ["Suprimentos", "Comercial", "TI", "Operações"], status: "publicado", clauses: ["cl10", "cl8"], description: "Troca de informações em negociações, homologação de fornecedores e P&D. Prazo de sigilo de 5 anos." },
  { id: "t4", name: "Locação não residencial", type: "locacao", version: "1.4", lastReview: iso(-400), reviewer: "p2", uses: 3, selfService: [], status: "em-revisao", clauses: ["cl2", "cl4", "cl5", "cl8"], description: "Galpões, escritórios e equipamentos. Segue a Lei 8.245/91; garantia por seguro-fiança." },
  { id: "t5", name: "Licença de software (SaaS)", type: "saas", version: "2.3", lastReview: iso(-75), reviewer: "p1", uses: 18, selfService: ["TI"], selfServiceLimit: 100_000, status: "publicado", clauses: ["cl1", "cl2", "cl3", "cl6", "cl7", "cl8"], description: "Assinatura de software em nuvem, com SLA de disponibilidade, créditos de serviço, DPA e saída de dados." },
  { id: "t6", name: "Aditivo de prazo e reajuste", type: "aditivo", version: "1.2", lastReview: iso(-30), reviewer: "p7", uses: 52, selfService: ["Suprimentos", "Facilities", "TI", "Operações"], selfServiceLimit: 500_000, status: "publicado", clauses: ["cl2", "cl3"], description: "Prorroga a vigência e aplica o reajuste do índice do contrato original. Não altera outras cláusulas." },
  { id: "t7", name: "Acordo de tratamento de dados (DPA)", type: "dpa", version: "1.1", lastReview: iso(-15), reviewer: "p9", uses: 23, selfService: [], status: "publicado", clauses: ["cl6", "cl10"], description: "Anexo obrigatório quando a contraparte trata dados pessoais em nome da Vereda (operadora)." },
];
export const templateById = (id: string) => templates.find((t) => t.id === id) ?? templates[0];
export const templateTypeLabel = (t: Template) => (t.type === "aditivo" ? "Aditivo" : t.type === "dpa" ? "Anexo de dados" : contractTypes[t.type].short);

export type ClauseAlternative = { id: string; label: string; text: string; risk: Risk; approval: string; uses: number };
export type LibraryClause = { id: string; title: string; category: ClauseCategory; owner: string; lastReview: string; text: string; alternatives: ClauseAlternative[]; guidance: string };

export const clauseLibrary: LibraryClause[] = [
  {
    id: "cl1",
    title: "Limitação de responsabilidade",
    category: "responsabilidade",
    owner: "p2",
    lastReview: iso(-48),
    text: "A responsabilidade de cada parte fica limitada ao valor faturado nos 12 meses anteriores ao evento, exceto em caso de dolo, culpa grave, danos a terceiros, obrigações trabalhistas e violação de dados pessoais.",
    guidance: "Nunca abrir mão das exceções de dados pessoais e trabalhistas.",
    alternatives: [
      { id: "cl1a", label: "Limite de 6 meses", text: "Limite de 6 meses de faturamento, mantidas todas as exceções.", risk: "medio", approval: "Gerente jurídico", uses: 7 },
      { id: "cl1b", label: "Limite de 6 meses com seguro", text: "Limite de 6 meses, com avaria de carga fora do limite e coberta por RCTR-C.", risk: "medio", approval: "Gerente jurídico", uses: 3 },
    ],
  },
  {
    id: "cl2",
    title: "Reajuste anual",
    category: "reajuste",
    owner: "p1",
    lastReview: iso(-120),
    text: "Os preços serão reajustados a cada 12 meses pela variação acumulada do IPCA/IBGE, contados da data-base do contrato. Na falta do índice, aplica-se o INPC.",
    guidance: "IGP-M só em locação (prática de mercado) e com teto negociado.",
    alternatives: [
      { id: "cl2a", label: "IGP-M com teto", text: "Reajuste anual pelo IGP-M/FGV, limitado a IPCA + 2 p.p.", risk: "medio", approval: "Analista de contratos", uses: 12 },
      { id: "cl2b", label: "Repasse de commodity", text: "Reajuste trimestral pela variação da commodity de referência, com teto de 4 % por trimestre.", risk: "alto", approval: "Gerente jurídico + Diretoria financeira", uses: 2 },
    ],
  },
  {
    id: "cl3",
    title: "Renovação e aviso prévio",
    category: "vigencia",
    owner: "p7",
    lastReview: iso(-30),
    text: "O contrato renova automaticamente por períodos de 12 meses, salvo aviso por escrito de qualquer das partes com 60 dias de antecedência do término.",
    guidance: "Renovação por mais de 12 meses só com aprovação do gerente jurídico.",
    alternatives: [{ id: "cl3a", label: "Sem renovação automática", text: "O contrato termina na data final; renovação somente por aditivo.", risk: "baixo", approval: "Livre", uses: 31 }],
  },
  {
    id: "cl4",
    title: "Multa por rescisão imotivada",
    category: "multa",
    owner: "p2",
    lastReview: iso(-48),
    text: "A parte que rescindir sem justa causa pagará multa de 10 % sobre o valor anual remanescente do contrato.",
    guidance: "Multa abaixo de 5 % precisa de justificativa comercial.",
    alternatives: [{ id: "cl4a", label: "Multa de 5 %", text: "Multa de 5 % sobre o valor anual remanescente.", risk: "medio", approval: "Gerente jurídico", uses: 9 }],
  },
  {
    id: "cl5",
    title: "Foro",
    category: "foro",
    owner: "p7",
    lastReview: iso(-200),
    text: "Fica eleito o foro da Comarca de Campinas/SP, com renúncia a qualquer outro, por mais privilegiado que seja.",
    guidance: "Arbitragem só acima de R$ 5 milhões.",
    alternatives: [
      { id: "cl5a", label: "Foro de São Paulo/SP", text: "Fica eleito o foro da Comarca de São Paulo/SP.", risk: "baixo", approval: "Livre", uses: 14 },
      { id: "cl5b", label: "Arbitragem (CAM-CCBC)", text: "Controvérsias resolvidas por arbitragem no CAM-CCBC, em São Paulo, por 3 árbitros.", risk: "medio", approval: "Gerente jurídico", uses: 1 },
    ],
  },
  {
    id: "cl6",
    title: "Proteção de dados pessoais",
    category: "lgpd",
    owner: "p9",
    lastReview: iso(-15),
    text: "A contratada atua como operadora, trata dados só conforme instruções da Vereda, comunica incidentes em até 48 horas e só usa subprocessadores com aviso prévio de 30 dias.",
    guidance: "Transferência internacional exige cláusulas-padrão contratuais da ANPD (Res. CD/ANPD nº 19/2024).",
    alternatives: [{ id: "cl6a", label: "Incidente em 72 h", text: "Comunicação de incidentes em até 72 horas.", risk: "medio", approval: "DPO", uses: 4 }],
  },
  {
    id: "cl7",
    title: "Nível de serviço e créditos",
    category: "sla",
    owner: "p1",
    lastReview: iso(-75),
    text: "Disponibilidade mínima de 99,5 % ao mês. Abaixo disso, créditos de 5 % a 20 % da mensalidade, conforme a faixa.",
    guidance: "Créditos não substituem a rescisão por descumprimento reiterado (3 meses em 12).",
    alternatives: [],
  },
  {
    id: "cl8",
    title: "Anticorrupção",
    category: "objeto",
    owner: "p2",
    lastReview: iso(-48),
    text: "As partes cumprem a Lei 12.846/2013 e o Código de Conduta de Fornecedores da Vereda; violação permite rescisão imediata.",
    guidance: "Cláusula obrigatória: não aceita alternativas.",
    alternatives: [],
  },
  {
    id: "cl9",
    title: "Multa por atraso na entrega",
    category: "multa",
    owner: "p1",
    lastReview: iso(-120),
    text: "Atraso na entrega gera multa de 0,5 % ao dia sobre o valor do pedido, limitada a 10 %.",
    guidance: "Insumo crítico (sem segundo fornecedor) não aceita redução.",
    alternatives: [{ id: "cl9a", label: "0,2 % ao dia até 5 %", text: "Multa de 0,2 % ao dia, limitada a 5 % do pedido.", risk: "medio", approval: "Analista de contratos", uses: 6 }],
  },
  {
    id: "cl10",
    title: "Prazo de confidencialidade",
    category: "confidencialidade",
    owner: "p2",
    lastReview: iso(-200),
    text: "O dever de sigilo permanece por 5 anos após o término, e por prazo indeterminado para segredos industriais e fórmulas.",
    guidance: "Fórmulas e processos produtivos: sigilo sem prazo, sempre.",
    alternatives: [{ id: "cl10a", label: "Sigilo de 3 anos", text: "Sigilo por 3 anos após o término, mantido sem prazo para segredos industriais.", risk: "medio", approval: "Analista de contratos", uses: 11 }],
  },
];

/* ------------------------------------------------------------------ */
/* Atividade e documentos do contrato                                  */
/* ------------------------------------------------------------------ */

export type ContractEvent = { id: string; who: string; action: string; target?: string; when: string; quote?: string; kind: "create" | "edit" | "approve" | "sign" | "comment" | "send" };
export function activityFor(c: Contract): ContractEvent[] {
  const k = counterpartyById(c.counterpartyId);
  const owner = personById(c.owner);
  const requester = personById(c.requester);
  const ev: ContractEvent[] = [];
  if (c.status === "assinatura") ev.push({ id: "e1", who: "Assina Fácil", action: "registrou a assinatura de", target: signersFor(c).filter((s) => s.status === "assinou").map((s) => s.name).join(" e ") || k.rep.name, when: "Há 2 dias", kind: "sign" });
  if (c.status === "vigente") ev.push({ id: "e2", who: "Pacto", action: "lembrou o prazo de aviso prévio para", target: owner.name, when: "Ontem, 08:00", kind: "send" });
  if (c.deviations.length) ev.push({ id: "e3", who: owner.name, action: "comentou", when: "Há 4 dias", quote: c.deviations[0].note ?? `Ponto de atenção: ${c.deviations[0].title.toLowerCase()}.`, kind: "comment" });
  ev.push({ id: "e4", who: owner.name, action: "enviou a minuta para", target: k.short, when: "Há 22 dias", kind: "send" });
  ev.push({ id: "e5", who: requester.name, action: "abriu a solicitação do contrato", target: c.number, when: "Há 30 dias", kind: "create" });
  return ev;
}

export type ContractDoc = { id: string; name: string; kind: "pdf" | "doc" | "sheet"; meta: string };
export function documentsFor(c: Contract): ContractDoc[] {
  const k = counterpartyById(c.counterpartyId);
  const docs: ContractDoc[] = [
    { id: "d1", name: `${c.number} · minuta ${versionsFor(c).slice(-1)[0].version}.pdf`, kind: "pdf", meta: "Contrato principal · 412 KB" },
    { id: "d2", name: `Proposta comercial ${k.short}.pdf`, kind: "pdf", meta: "Anexo I · 1,8 MB" },
  ];
  if (c.type === "servico" || c.type === "saas") docs.push({ id: "d3", name: "Anexo II · Níveis de serviço (SLA).docx", kind: "doc", meta: "Anexo II · 96 KB" });
  if (c.type === "fornecimento") docs.push({ id: "d4", name: "Especificação técnica e tabela de preços.xlsx", kind: "sheet", meta: "Anexo II · 220 KB" });
  if (c.lgpd === "operador") docs.push({ id: "d5", name: "Acordo de tratamento de dados (DPA).pdf", kind: "pdf", meta: "Anexo III · 188 KB" });
  docs.push({ id: "d6", name: `Certidões ${k.short} · ${new Date(`${iso(-10)}T00:00:00`).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}.pdf`, kind: "pdf", meta: "Due diligence · 2,4 MB" });
  if (c.status === "vigente") docs.push({ id: "d7", name: `${c.number} · assinado (ICP-Brasil).pdf`, kind: "pdf", meta: "Com manifesto de assinaturas · 640 KB" });
  return docs;
}
