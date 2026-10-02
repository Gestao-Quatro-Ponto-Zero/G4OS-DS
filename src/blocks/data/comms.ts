/*
 * Mural · plataforma de comunicação interna da Vértice Logística (~1.200
 * pessoas em 6 cidades + escritório em Lisboa). Comunicados oficiais, conversa
 * do time, pessoas, eventos e pesquisas. Dados de exemplo compartilhados por
 * TODAS as telas do produto: o mesmo comunicado, pessoa e evento aparecem
 * iguais no feed, na busca ⌘K e nos relatórios. Troque pela sua API.
 * "Hoje" = quinta-feira, 01/10/2026, 09:30 (São Paulo).
 */

export const org = { name: "Vértice Logística", product: "Mural", headcount: 1214, domain: "vertice.com.br" };
export const now = new Date(2026, 9, 1, 9, 30);
export const todayIso = "2026-10-01";

/** Data ISO relativa a hoje: iso(-3) = 3 dias atrás. */
export const iso = (days: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
/** Data e hora ISO local relativa a hoje: at(-1, "18:40"). */
export const at = (days: number, hhmm: string) => `${iso(days)}T${hhmm}`;
/** "qui, 01/10" */
export const weekdayShort = (isoDate: string) => {
  const d = new Date(`${isoDate.slice(0, 10)}T12:00:00`);
  const wd = d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
  return `${wd}, ${isoDate.slice(8, 10)}/${isoDate.slice(5, 7)}`;
};

/* ------------------------------------------------------------------ */
/* Áreas, cidades e cargos (público-alvo)                              */
/* ------------------------------------------------------------------ */

export type AreaId = "operacoes" | "comercial" | "tecnologia" | "pessoas" | "financeiro" | "juridico" | "marketing" | "diretoria";
export const areas: { id: AreaId; label: string; headcount: number }[] = [
  { id: "operacoes", label: "Operações", headcount: 742 },
  { id: "comercial", label: "Comercial", headcount: 156 },
  { id: "tecnologia", label: "Tecnologia", headcount: 98 },
  { id: "pessoas", label: "Pessoas e Cultura", headcount: 41 },
  { id: "financeiro", label: "Financeiro", headcount: 64 },
  { id: "juridico", label: "Jurídico", headcount: 18 },
  { id: "marketing", label: "Marketing", headcount: 37 },
  { id: "diretoria", label: "Diretoria", headcount: 58 },
];
export const areaLabel = (id: AreaId) => areas.find((a) => a.id === id)?.label ?? id;

export type CityId = "sp" | "rec" | "mao" | "cgb" | "cwb" | "poa" | "lis";
export const cities: { id: CityId; label: string; place: string; timeZone: string; headcount: number; site: string }[] = [
  { id: "sp", label: "São Paulo", place: "São Paulo, SP", timeZone: "America/Sao_Paulo", headcount: 438, site: "Sede + CD Cajamar" },
  { id: "rec", label: "Recife", place: "Recife, PE", timeZone: "America/Recife", headcount: 196, site: "CD Suape" },
  { id: "mao", label: "Manaus", place: "Manaus, AM", timeZone: "America/Manaus", headcount: 172, site: "CD Distrito Industrial" },
  { id: "cgb", label: "Cuiabá", place: "Cuiabá, MT", timeZone: "America/Cuiaba", headcount: 124, site: "CD Várzea Grande" },
  { id: "cwb", label: "Curitiba", place: "Curitiba, PR", timeZone: "America/Sao_Paulo", headcount: 151, site: "CD São José dos Pinhais" },
  { id: "poa", label: "Porto Alegre", place: "Porto Alegre, RS", timeZone: "America/Sao_Paulo", headcount: 109, site: "CD Canoas" },
  { id: "lis", label: "Lisboa", place: "Lisboa, Portugal", timeZone: "Europe/Lisbon", headcount: 24, site: "Escritório Europa" },
];
export const cityById = (id: CityId) => cities.find((c) => c.id === id) ?? cities[0];

export const jobLevels = [
  { value: "diretoria", label: "Diretoria" },
  { value: "lideranca", label: "Lideranças (coordenação e gerência)" },
  { value: "administrativo", label: "Administrativo" },
  { value: "operacao", label: "Operação de CD (turnos)" },
  { value: "estagio", label: "Estágio e aprendizes" },
];

/* ------------------------------------------------------------------ */
/* Pessoas                                                             */
/* ------------------------------------------------------------------ */

export type Presence = "online" | "away" | "busy" | "offline";
export type Person = {
  id: string;
  name: string;
  initials: string;
  tint?: string;
  role: string;
  area: AreaId;
  city: CityId;
  status: Presence;
  /** Linha de presença: "Em reunião até 11h", "Visto há 2 h". */
  presence?: string;
  email: string;
  phone: string;
  managerId?: string;
  /** Data de admissão (ISO). */
  since: string;
  /** Aniversário "MM-DD". */
  birthday: string;
  pronouns?: string;
  skills: string[];
  bio?: string;
};

// ds-audit-ignore-start hex-color: tintas de avatar (identidade da pessoa)
export const people: Person[] = [
  { id: "carla", name: "Carla Menezes", initials: "CM", tint: "#842e20", role: "Gerente de comunicação interna", area: "pessoas", city: "sp", status: "online", email: "carla.menezes@vertice.com.br", phone: "(11) 3090-4410", managerId: "beatriz", since: "2021-03-08", birthday: "04-12", pronouns: "ela/dela", skills: ["Comunicação interna", "Endomarketing", "Gestão de crise"], bio: "Cuida do Mural, dos comunicados oficiais e das pesquisas de clima." },
  { id: "beatriz", name: "Beatriz Lacerda", initials: "BL", tint: "#184560", role: "Diretora de Pessoas e Cultura", area: "diretoria", city: "sp", status: "busy", presence: "Em reunião até 11h", email: "beatriz.lacerda@vertice.com.br", phone: "(11) 3090-4400", managerId: "otavio", since: "2018-06-11", birthday: "02-27", skills: ["Cultura", "Remuneração", "Liderança"] },
  { id: "otavio", name: "Otávio Rezende", initials: "OR", tint: "#5f7f6f", role: "CEO", area: "diretoria", city: "sp", status: "away", presence: "Visto há 40 min", email: "otavio.rezende@vertice.com.br", phone: "(11) 3090-4000", since: "2014-01-20", birthday: "08-03", skills: ["Estratégia", "Logística"] },
  { id: "rodrigo", name: "Rodrigo Teles", initials: "RT", tint: "#8c6a3a", role: "Diretor de Operações", area: "diretoria", city: "rec", status: "online", email: "rodrigo.teles@vertice.com.br", phone: "(81) 3204-1100", managerId: "otavio", since: "2016-09-05", birthday: "10-01", skills: ["Operações", "Segurança do trabalho", "Lean"] },
  { id: "luana", name: "Luana Pires", initials: "LP", tint: "#184560", role: "Coordenadora de CD", area: "operacoes", city: "mao", status: "online", email: "luana.pires@vertice.com.br", phone: "(92) 3301-2200", managerId: "rodrigo", since: "2019-02-18", birthday: "10-03", skills: ["Armazenagem", "WMS", "Gestão de turnos"] },
  { id: "jefferson", name: "Jefferson Alves", initials: "JA", tint: "#5f7f6f", role: "Supervisor de expedição", area: "operacoes", city: "cgb", status: "online", email: "jefferson.alves@vertice.com.br", phone: "(65) 3022-5100", managerId: "rodrigo", since: "2020-07-13", birthday: "11-19", skills: ["Expedição", "Roteirização"] },
  { id: "marina", name: "Marina Castilho", initials: "MC", tint: "#842e20", role: "Analista de segurança do trabalho", area: "operacoes", city: "cwb", status: "away", presence: "Visto há 15 min", email: "marina.castilho@vertice.com.br", phone: "(41) 3381-2040", managerId: "rodrigo", since: "2022-04-04", birthday: "06-22", skills: ["NR-11", "CIPA", "Treinamentos"] },
  { id: "felipe", name: "Felipe Nakamura", initials: "FN", tint: "#184560", role: "Diretor de Tecnologia", area: "diretoria", city: "sp", status: "online", email: "felipe.nakamura@vertice.com.br", phone: "(11) 3090-4700", managerId: "otavio", since: "2019-10-01", birthday: "01-15", skills: ["Arquitetura", "Dados", "Segurança da informação"] },
  { id: "priscila", name: "Priscila Andrade", initials: "PA", tint: "#8c6a3a", role: "Engenheira de software sênior", area: "tecnologia", city: "lis", status: "online", email: "priscila.andrade@vertice.com.br", phone: "+351 21 340 1120", managerId: "felipe", since: "2023-01-09", birthday: "10-05", pronouns: "ela/dela", skills: ["TypeScript", "WMS", "Integrações"] },
  { id: "diego", name: "Diego Moura", initials: "DM", tint: "#5f7f6f", role: "Analista de suporte de TI", area: "tecnologia", city: "rec", status: "busy", presence: "Em atendimento", email: "diego.moura@vertice.com.br", phone: "(81) 3204-1180", managerId: "felipe", since: "2024-08-12", birthday: "03-09", skills: ["Help desk", "Redes", "Microsoft 365"] },
  { id: "patricia", name: "Patrícia Gomes", initials: "PG", tint: "#842e20", role: "Diretora comercial", area: "diretoria", city: "sp", status: "offline", presence: "De férias até 05/10", email: "patricia.gomes@vertice.com.br", phone: "(11) 3090-4500", managerId: "otavio", since: "2017-05-02", birthday: "09-14", skills: ["Contas-chave", "Negociação"] },
  { id: "vinicius", name: "Vinícius Prado", initials: "VP", tint: "#184560", role: "Executivo de contas", area: "comercial", city: "poa", status: "online", email: "vinicius.prado@vertice.com.br", phone: "(51) 3017-8800", managerId: "patricia", since: "2025-09-29", birthday: "12-08", skills: ["Varejo", "Contratos de armazenagem"] },
  { id: "tatiane", name: "Tatiane Ribeiro", initials: "TR", tint: "#8c6a3a", role: "Analista de remuneração", area: "pessoas", city: "sp", status: "online", email: "tatiane.ribeiro@vertice.com.br", phone: "(11) 3090-4430", managerId: "beatriz", since: "2020-11-16", birthday: "10-02", skills: ["Benefícios", "Folha", "PLR"] },
  { id: "andre", name: "André Siqueira", initials: "AS", tint: "#5f7f6f", role: "Controller", area: "financeiro", city: "sp", status: "away", presence: "Visto há 1 h", email: "andre.siqueira@vertice.com.br", phone: "(11) 3090-4600", managerId: "otavio", since: "2018-02-05", birthday: "07-30", skills: ["Orçamento", "Fechamento contábil"] },
  { id: "helena", name: "Helena Duarte", initials: "HD", tint: "#842e20", role: "Advogada trabalhista", area: "juridico", city: "sp", status: "offline", presence: "Visto ontem", email: "helena.duarte@vertice.com.br", phone: "(11) 3090-4800", managerId: "otavio", since: "2021-07-19", birthday: "05-04", skills: ["Trabalhista", "LGPD"] },
  { id: "gabriel", name: "Gabriel Santana", initials: "GS", tint: "#184560", role: "Designer de comunicação", area: "marketing", city: "rec", status: "online", email: "gabriel.santana@vertice.com.br", phone: "(81) 3204-1210", managerId: "carla", since: "2025-09-22", birthday: "02-11", skills: ["Design", "Vídeo", "Motion"] },
  { id: "rafaela", name: "Rafaela Costa", initials: "RC", tint: "#8c6a3a", role: "Operadora de empilhadeira", area: "operacoes", city: "sp", status: "offline", presence: "Turno da noite", email: "rafaela.costa@vertice.com.br", phone: "(11) 3090-5120", managerId: "rodrigo", since: "2025-09-15", birthday: "10-06", skills: ["Empilhadeira", "Inventário"] },
  { id: "eduardo", name: "Eduardo Barros", initials: "EB", tint: "#5f7f6f", role: "Coordenador de CD", area: "operacoes", city: "poa", status: "online", email: "eduardo.barros@vertice.com.br", phone: "(51) 3017-8820", managerId: "rodrigo", since: "2017-03-27", birthday: "04-29", skills: ["Cross-docking", "Gestão de pessoas"] },
  { id: "sofia", name: "Sofia Lins", initials: "SL", tint: "#842e20", role: "Analista de dados", area: "tecnologia", city: "cwb", status: "online", email: "sofia.lins@vertice.com.br", phone: "(41) 3381-2090", managerId: "felipe", since: "2025-09-29", birthday: "08-17", skills: ["SQL", "Power BI", "Python"] },
  { id: "mateus", name: "Mateus Freitas", initials: "MF", tint: "#184560", role: "Analista financeiro", area: "financeiro", city: "cgb", status: "away", presence: "Visto há 25 min", email: "mateus.freitas@vertice.com.br", phone: "(65) 3022-5140", managerId: "andre", since: "2022-10-03", birthday: "10-01", skills: ["Contas a pagar", "Conciliação"] },
  { id: "isabela", name: "Isabela Rocha", initials: "IR", tint: "#8c6a3a", role: "Coordenadora de marketing", area: "marketing", city: "sp", status: "online", email: "isabela.rocha@vertice.com.br", phone: "(11) 3090-4900", managerId: "patricia", since: "2020-01-13", birthday: "09-28", skills: ["Marca", "Eventos"] },
  { id: "joao", name: "João Batista Lima", initials: "JL", tint: "#5f7f6f", role: "Líder de turno", area: "operacoes", city: "mao", status: "offline", presence: "Turno da tarde, a partir das 14h", email: "joao.lima@vertice.com.br", phone: "(92) 3301-2240", managerId: "luana", since: "2015-08-03", birthday: "03-21", skills: ["Recebimento", "Segurança"] },
];
// ds-audit-ignore-end

export const me = people[0];
export const personById = (id: string) => people.find((p) => p.id === id) ?? people[0];
export const firstName = (p: Person) => p.name.split(" ")[0];

const mmdd = (days: number) => iso(days).slice(5);
/** Aniversariantes dos próximos 7 dias (inclui hoje). */
export const birthdays = people
  .map((p) => ({ p, in: Array.from({ length: 7 }, (_, i) => mmdd(i)).indexOf(p.birthday) }))
  .filter((x) => x.in >= 0)
  .sort((a, b) => a.in - b.in);
/** Admitidos nos últimos 21 dias. */
export const newHires = people.filter((p) => p.since >= iso(-21)).sort((a, b) => b.since.localeCompare(a.since));

/* ------------------------------------------------------------------ */
/* Comunicados                                                         */
/* ------------------------------------------------------------------ */

export type Channel = "app" | "email" | "whatsapp";
export const channelLabel: Record<Channel, string> = { app: "App Mural", email: "E-mail", whatsapp: "WhatsApp" };

export type AnnouncementStatus = "publicado" | "agendado" | "aprovacao" | "rascunho";
export const announcementStatus: Record<AnnouncementStatus, { label: string; tone: "neutral" | "ok" | "info" | "warn" }> = {
  publicado: { label: "Publicado", tone: "ok" },
  agendado: { label: "Agendado", tone: "info" },
  aprovacao: { label: "Em aprovação", tone: "warn" },
  rascunho: { label: "Rascunho", tone: "neutral" },
};

export type Category = "Institucional" | "Benefícios" | "Segurança" | "Tecnologia" | "Resultados" | "Cultura" | "Operação";
export const categories: Category[] = ["Institucional", "Benefícios", "Segurança", "Tecnologia", "Resultados", "Cultura", "Operação"];

export type Reaction = { emoji: string; label: string; count: number; mine?: boolean };
export type Announcement = {
  id: string;
  title: string;
  summary: string;
  category: Category;
  authorId: string;
  publishedAt: string;
  status: AnnouncementStatus;
  pinned?: boolean;
  /** Leitura obrigatória com confirmação; `due` = prazo. */
  mandatory?: { due: string };
  audience: { label: string; areas: AreaId[] | "todas"; cities: CityId[] | "todas" };
  channels: Channel[];
  audienceSize: number;
  reads: number;
  /** Confirmações de leitura (só obrigatórios). */
  acks?: number;
  /** Mediana em horas até a leitura. */
  medianHours: number;
  readByMe: boolean;
  ackByMe?: boolean;
  reactions: Reaction[];
  comments: number;
  readsByArea: { area: AreaId; read: number; total: number }[];
  body: { h?: string; p: string[]; list?: string[] }[];
};

const r = (thumbs: number, heart: number, clap: number, extra?: Partial<Record<"thumbs" | "heart" | "clap", boolean>>): Reaction[] => [
  { emoji: "👍", label: "Curti", count: thumbs, mine: extra?.thumbs },
  { emoji: "❤️", label: "Amei", count: heart, mine: extra?.heart },
  { emoji: "👏", label: "Aplausos", count: clap, mine: extra?.clap },
];

export const announcements: Announcement[] = [
  {
    id: "a1",
    title: "Nova política de home office híbrido a partir de 1º de novembro",
    summary: "Administrativo passa a ter 2 dias fixos de escritório por semana, escolhidos com a liderança. Operação de CD não muda.",
    category: "Institucional",
    authorId: "beatriz",
    publishedAt: at(-1, "10:00"),
    status: "publicado",
    pinned: true,
    mandatory: { due: iso(6) },
    audience: { label: "Todas as áreas administrativas", areas: ["comercial", "tecnologia", "pessoas", "financeiro", "juridico", "marketing", "diretoria"], cities: "todas" },
    channels: ["app", "email"],
    audienceSize: 472,
    reads: 351,
    acks: 288,
    medianHours: 3.2,
    readByMe: false,
    ackByMe: false,
    reactions: r(84, 31, 22),
    comments: 27,
    readsByArea: [
      { area: "comercial", read: 104, total: 156 },
      { area: "tecnologia", read: 89, total: 98 },
      { area: "pessoas", read: 40, total: 41 },
      { area: "financeiro", read: 51, total: 64 },
      { area: "juridico", read: 17, total: 18 },
      { area: "marketing", read: 31, total: 37 },
      { area: "diretoria", read: 19, total: 58 },
    ],
    body: [
      { p: ["Depois de seis meses de piloto com as equipes de Tecnologia e Financeiro, vamos adotar o modelo híbrido em todas as áreas administrativas da Vértice. A decisão considerou a pesquisa de clima de junho, os indicadores de entrega das equipes do piloto e a conversa com as lideranças de cada cidade."] },
      { h: "O que muda", p: ["Cada equipe combina com a liderança dois dias fixos de presença por semana. Os dias ficam registrados no Mural até 25 de outubro, para organizarmos estações de trabalho e refeitório."], list: ["Dois dias fixos de escritório por semana, definidos por equipe", "Reuniões de equipe acontecem nos dias presenciais", "Auxílio home office de R$ 150 por mês, pago na folha", "Notebook e headset continuam sendo fornecidos pela empresa"] },
      { h: "O que não muda", p: ["A operação dos centros de distribuição segue em turnos presenciais. Lideranças de CD continuam com a escala atual. Quem tem acordo individual de trabalho remoto mantém as condições do aditivo."] },
      { h: "Próximos passos", p: ["Até 25/10, cada liderança registra os dias da equipe. No dia 28/10 fazemos uma conversa aberta com a diretoria para tirar dúvidas, com transmissão para todas as cidades. Confirme a leitura deste comunicado até a data indicada."] },
    ],
  },
  {
    id: "a2",
    title: "Semana Interna de Prevenção de Acidentes (SIPAT) 2026",
    summary: "De 13 a 17 de outubro em todos os CDs. Programação por turno, palestras e simulado de evacuação na quarta.",
    category: "Segurança",
    authorId: "marina",
    publishedAt: at(-2, "08:15"),
    status: "publicado",
    pinned: true,
    mandatory: { due: iso(11) },
    audience: { label: "Operações · todos os CDs", areas: ["operacoes"], cities: "todas" },
    channels: ["app", "whatsapp"],
    audienceSize: 742,
    reads: 418,
    acks: 372,
    medianHours: 9.6,
    readByMe: true,
    ackByMe: true,
    reactions: r(126, 18, 64),
    comments: 14,
    readsByArea: [{ area: "operacoes", read: 418, total: 742 }],
    body: [
      { p: ["A SIPAT deste ano tem como tema “Cuidar de quem cuida da carga”. A programação foi montada com as CIPAs de cada centro de distribuição para caber nos três turnos."] },
      { h: "Programação", p: ["As atividades acontecem no início de cada turno, com 30 minutos de duração."], list: ["Segunda: abertura e ergonomia na separação", "Terça: operação segura de empilhadeiras (NR-11)", "Quarta: simulado de evacuação em todos os CDs", "Quinta: saúde mental e sono no trabalho em turnos", "Sexta: premiação das melhores ideias de segurança"] },
      { h: "Simulado de evacuação", p: ["O simulado é obrigatório para todas as pessoas presentes no CD, inclusive terceiros. Os líderes de turno recebem o roteiro até sexta-feira."] },
    ],
  },
  {
    id: "a3",
    title: "Resultado do 3º trimestre: crescemos 14 % e batemos a meta de nível de serviço",
    summary: "Receita líquida de R$ 412 milhões e OTIF de 96,8 %. A PLR do semestre segue no caminho da meta.",
    category: "Resultados",
    authorId: "otavio",
    publishedAt: at(0, "08:00"),
    status: "publicado",
    audience: { label: "Toda a empresa", areas: "todas", cities: "todas" },
    channels: ["app", "email", "whatsapp"],
    audienceSize: 1214,
    reads: 486,
    medianHours: 1.4,
    readByMe: false,
    reactions: r(212, 96, 148, { clap: true }),
    comments: 41,
    readsByArea: [
      { area: "operacoes", read: 241, total: 742 },
      { area: "comercial", read: 78, total: 156 },
      { area: "tecnologia", read: 61, total: 98 },
      { area: "pessoas", read: 33, total: 41 },
      { area: "financeiro", read: 37, total: 64 },
      { area: "juridico", read: 9, total: 18 },
      { area: "marketing", read: 21, total: 37 },
      { area: "diretoria", read: 6, total: 58 },
    ],
    body: [
      { p: ["Fechamos o terceiro trimestre com receita líquida de R$ 412 milhões, 14 % acima do mesmo período de 2025. O resultado vem principalmente da abertura do CD de Cuiabá e dos novos contratos de armazenagem no Sul."] },
      { h: "Nível de serviço", p: ["O OTIF (entregas no prazo e completas) chegou a 96,8 %, acima da meta de 96 %. Manaus teve o melhor desempenho do trimestre, com 98,1 %."] },
      { h: "PLR", p: ["Com esse resultado, o indicador de PLR do semestre está em 92 % da meta. O pagamento acontece em fevereiro, com base no fechamento de dezembro."] },
    ],
  },
  {
    id: "a4",
    title: "Troca do sistema de ponto: app novo a partir de 15/10",
    summary: "O registro de ponto passa para o app Ponto Vértice. Instale e faça o primeiro acesso até 10/10.",
    category: "Tecnologia",
    authorId: "diego",
    publishedAt: at(-3, "14:30"),
    status: "publicado",
    mandatory: { due: iso(9) },
    audience: { label: "Toda a empresa", areas: "todas", cities: "todas" },
    channels: ["app", "email", "whatsapp"],
    audienceSize: 1214,
    reads: 702,
    acks: 611,
    medianHours: 18.5,
    readByMe: false,
    ackByMe: false,
    reactions: r(48, 3, 9),
    comments: 63,
    readsByArea: [
      { area: "operacoes", read: 351, total: 742 },
      { area: "comercial", read: 112, total: 156 },
      { area: "tecnologia", read: 94, total: 98 },
      { area: "pessoas", read: 41, total: 41 },
      { area: "financeiro", read: 55, total: 64 },
      { area: "juridico", read: 15, total: 18 },
      { area: "marketing", read: 30, total: 37 },
      { area: "diretoria", read: 4, total: 58 },
    ],
    body: [
      { p: ["A partir de 15 de outubro, o ponto passa a ser registrado pelo app Ponto Vértice, no celular ou nos totens dos CDs. O relógio de parede será desligado no dia 14."] },
      { h: "O que fazer", p: ["Instale o app pela loja do seu celular e faça o primeiro acesso com o CPF e o código enviado por SMS."], list: ["Instale o app Ponto Vértice", "Faça o primeiro acesso até 10/10", "Teste uma marcação de ponto (não conta na folha até 14/10)", "Dúvidas: canal #suporte-ti ou ramal 4180"] },
    ],
  },
  {
    id: "a5",
    title: "Campanha de vacinação contra a gripe nos CDs",
    summary: "Vacinação gratuita para colaboradores e dependentes, de 6 a 9 de outubro, no ambulatório de cada CD.",
    category: "Benefícios",
    authorId: "tatiane",
    publishedAt: at(-4, "09:00"),
    status: "publicado",
    audience: { label: "Toda a empresa", areas: "todas", cities: ["sp", "rec", "mao", "cgb", "cwb", "poa"] },
    channels: ["app", "whatsapp"],
    audienceSize: 1190,
    reads: 801,
    medianHours: 6.1,
    readByMe: true,
    reactions: r(97, 44, 12, { heart: true }),
    comments: 9,
    readsByArea: [
      { area: "operacoes", read: 498, total: 742 },
      { area: "comercial", read: 101, total: 152 },
      { area: "tecnologia", read: 55, total: 86 },
      { area: "pessoas", read: 39, total: 41 },
      { area: "financeiro", read: 48, total: 64 },
      { area: "juridico", read: 12, total: 18 },
      { area: "marketing", read: 24, total: 33 },
      { area: "diretoria", read: 24, total: 54 },
    ],
    body: [{ p: ["A campanha deste ano vale também para dependentes cadastrados no plano de saúde. Leve um documento com foto e a carteirinha do plano."] }],
  },
  {
    id: "a6",
    title: "Boas-vindas às 38 pessoas que chegaram em setembro",
    summary: "Conheça quem entrou no time este mês e onde cada pessoa vai trabalhar.",
    category: "Cultura",
    authorId: "carla",
    publishedAt: at(-1, "16:00"),
    status: "publicado",
    audience: { label: "Toda a empresa", areas: "todas", cities: "todas" },
    channels: ["app"],
    audienceSize: 1214,
    reads: 389,
    medianHours: 11.2,
    readByMe: true,
    reactions: r(143, 88, 51, { heart: true }),
    comments: 22,
    readsByArea: [
      { area: "operacoes", read: 162, total: 742 },
      { area: "comercial", read: 64, total: 156 },
      { area: "tecnologia", read: 52, total: 98 },
      { area: "pessoas", read: 40, total: 41 },
      { area: "financeiro", read: 26, total: 64 },
      { area: "juridico", read: 8, total: 18 },
      { area: "marketing", read: 29, total: 37 },
      { area: "diretoria", read: 8, total: 58 },
    ],
    body: [{ p: ["Setembro foi o mês com mais admissões do ano, puxado pela abertura do segundo turno em Cuiabá."] }],
  },
  {
    id: "a7",
    title: "Atualização do código de conduta: canal de ética independente",
    summary: "O canal de ética passa a ser operado por uma empresa externa, com relato anônimo por telefone, site e WhatsApp.",
    category: "Institucional",
    authorId: "helena",
    publishedAt: at(-9, "11:00"),
    status: "publicado",
    mandatory: { due: iso(-2) },
    audience: { label: "Toda a empresa", areas: "todas", cities: "todas" },
    channels: ["app", "email"],
    audienceSize: 1214,
    reads: 698,
    acks: 541,
    medianHours: 31.0,
    readByMe: true,
    ackByMe: true,
    reactions: r(36, 4, 7),
    comments: 5,
    readsByArea: [
      { area: "operacoes", read: 322, total: 742 },
      { area: "comercial", read: 118, total: 156 },
      { area: "tecnologia", read: 88, total: 98 },
      { area: "pessoas", read: 41, total: 41 },
      { area: "financeiro", read: 58, total: 64 },
      { area: "juridico", read: 18, total: 18 },
      { area: "marketing", read: 33, total: 37 },
      { area: "diretoria", read: 20, total: 58 },
    ],
    body: [{ p: ["O novo canal garante sigilo de quem relata e um prazo de resposta de até 30 dias."] }],
  },
  {
    id: "a8",
    title: "Inventário geral de outubro: escala e horários",
    summary: "Inventário nos CDs de Curitiba e Porto Alegre no fim de semana de 17 e 18/10. Escala extra com adicional.",
    category: "Operação",
    authorId: "eduardo",
    publishedAt: at(2, "08:00"),
    status: "agendado",
    audience: { label: "Operações · Curitiba e Porto Alegre", areas: ["operacoes"], cities: ["cwb", "poa"] },
    channels: ["app", "whatsapp"],
    audienceSize: 214,
    reads: 0,
    medianHours: 0,
    readByMe: false,
    reactions: r(0, 0, 0),
    comments: 0,
    readsByArea: [{ area: "operacoes", read: 0, total: 214 }],
    body: [{ p: ["A escala extra será publicada pelos líderes de turno até 10/10."] }],
  },
  {
    id: "a9",
    title: "Reajuste do vale-alimentação em 2027",
    summary: "O vale-alimentação passa de R$ 980 para R$ 1.060 a partir de janeiro, para todas as pessoas.",
    category: "Benefícios",
    authorId: "tatiane",
    publishedAt: at(1, "10:00"),
    status: "aprovacao",
    audience: { label: "Toda a empresa", areas: "todas", cities: "todas" },
    channels: ["app", "email", "whatsapp"],
    audienceSize: 1214,
    reads: 0,
    medianHours: 0,
    readByMe: false,
    reactions: r(0, 0, 0),
    comments: 0,
    readsByArea: [],
    body: [{ p: ["Rascunho em aprovação com a Diretoria de Pessoas."] }],
  },
];
export const announcementById = (id: string | null) => announcements.find((a) => a.id === id) ?? announcements[0];
export const published = announcements.filter((a) => a.status === "publicado").sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
export const pendingForMe = published.filter((a) => a.mandatory && !a.ackByMe && a.mandatory.due >= todayIso);
export const readRate = (a: Announcement) => (a.audienceSize ? a.reads / a.audienceSize : 0);

export type Comment = { id: string; authorId: string; at: string; text: string; likes: number; replies?: Comment[] };
export const commentsByAnnouncement: Record<string, Comment[]> = {
  a1: [
    { id: "c1", authorId: "vinicius", at: at(-1, "10:42"), text: "Quem atende cliente presencialmente no Sul pode trocar os dias fixos conforme a agenda de visitas?", likes: 12, replies: [{ id: "c1r", authorId: "beatriz", at: at(-1, "11:20"), text: "Pode, Vinícius. Para equipes comerciais de campo, os dias fixos são combinados mês a mês com a liderança.", likes: 18 }] },
    { id: "c2", authorId: "priscila", at: at(-1, "13:05"), text: "Lisboa segue o mesmo modelo? Hoje temos três dias presenciais no escritório.", likes: 4 },
    { id: "c3", authorId: "sofia", at: at(0, "08:51"), text: "O auxílio de R$ 150 vale também para quem entrou agora em setembro?", likes: 7 },
  ],
  a3: [{ id: "c4", authorId: "luana", at: at(0, "08:40"), text: "Orgulho do time de Manaus. Obrigada a todos os turnos.", likes: 54 }],
};

/* ------------------------------------------------------------------ */
/* Canais e conversas                                                  */
/* ------------------------------------------------------------------ */

export type ChatMsg = {
  id: string;
  authorId: string;
  time: string;
  day?: string;
  text: string;
  /** Pessoas mencionadas (destaca a mensagem quando inclui `me`). */
  mentions?: string[];
  file?: { name: string; size: string };
  reactions?: { emoji: string; label: string; count: number; mine?: boolean }[];
  thread?: { count: number; peopleIds: string[]; last: string };
  /** Mensagem de comunicado oficial compartilhada no canal. */
  announcementId?: string;
};
export type ChatChannel = {
  id: string;
  kind: "canal" | "dm";
  name: string;
  topic?: string;
  privado?: boolean;
  members: number;
  memberIds: string[];
  unread: number;
  mentions: number;
  /** Para DMs: a outra pessoa. */
  withId?: string;
  messages: ChatMsg[];
};

export const chatChannels: ChatChannel[] = [
  {
    id: "geral",
    kind: "canal",
    name: "geral",
    topic: "Avisos rápidos para toda a Vértice. Comunicados oficiais ficam no Mural.",
    members: 1214,
    memberIds: ["carla", "otavio", "beatriz", "rodrigo", "luana", "priscila"],
    unread: 4,
    mentions: 0,
    messages: [
      { id: "g1", day: "Ontem", authorId: "isabela", time: "17:12", text: "As fotos da festa de 12 anos já estão na pasta compartilhada. Obrigada a todo mundo que foi.", reactions: [{ emoji: "❤️", label: "Amei", count: 38 }], file: { name: "festa-12-anos.zip", size: "214 MB" } },
      { id: "g2", day: "Hoje", authorId: "otavio", time: "08:02", text: "Bom dia, pessoal. Publiquei o resultado do 3º trimestre no Mural. Leiam com calma: o mérito é de cada turno e de cada cidade.", announcementId: "a3", reactions: [{ emoji: "👏", label: "Aplausos", count: 86, mine: true }, { emoji: "🚀", label: "Foguete", count: 22 }], thread: { count: 3, peopleIds: ["luana", "rodrigo", "jefferson"], last: "há 12 min" } },
      { id: "g3", authorId: "diego", time: "09:10", text: "Lembrete: o app Ponto Vértice já está disponível. Quem tiver problema no primeiro acesso, chama no #suporte-ti." },
    ],
  },
  {
    id: "comunicacao",
    kind: "canal",
    name: "comunicacao-interna",
    topic: "Pauta, revisão e aprovação de comunicados.",
    privado: true,
    members: 6,
    memberIds: ["carla", "gabriel", "beatriz", "tatiane", "isabela", "marina"],
    unread: 3,
    mentions: 2,
    messages: [
      { id: "m1", day: "Ontem", authorId: "gabriel", time: "16:48", text: "Subi a arte da SIPAT nos três formatos: app, WhatsApp e cartaz A3 para os CDs.", file: { name: "sipat-2026-pecas.pdf", size: "8,4 MB" }, reactions: [{ emoji: "👍", label: "Curti", count: 3 }] },
      { id: "m2", authorId: "marina", time: "17:20", text: "Ficou ótimo. Só trocar “evacuação” por “abandono de área” no cartaz, que é o termo da NR-23 que os brigadistas usam.", thread: { count: 2, peopleIds: ["gabriel", "carla"], last: "ontem às 17:41" } },
      { id: "m3", day: "Hoje", authorId: "tatiane", time: "08:55", text: "@Carla mandei o comunicado do reajuste do VA para aprovação. A Beatriz pediu para sair junto com o e-mail da folha.", mentions: ["carla"] },
      { id: "m4", authorId: "beatriz", time: "09:14", text: "@Carla vamos segurar o do VA até sexta? Quero alinhar com o sindicato antes. O de home office está com 74 % de leitura, pode reforçar no WhatsApp para a Diretoria?", mentions: ["carla"], reactions: [{ emoji: "👀", label: "Vendo", count: 1 }] },
    ],
  },
  {
    id: "operacoes",
    kind: "canal",
    name: "operacoes-cds",
    topic: "Líderes de CD: passagem de turno, ocorrências e escala.",
    members: 84,
    memberIds: ["rodrigo", "luana", "jefferson", "eduardo", "joao", "marina"],
    unread: 12,
    mentions: 0,
    messages: [
      { id: "o1", day: "Hoje", authorId: "jefferson", time: "06:10", text: "Cuiabá: segundo turno fechou com 100 % das cargas expedidas. Uma doca em manutenção até as 10h." },
      { id: "o2", authorId: "luana", time: "07:32", text: "Manaus: recebimento atrasado por chuva na BR-174. Remanejei duas pessoas para a separação.", thread: { count: 1, peopleIds: ["rodrigo"], last: "há 40 min" } },
    ],
  },
  {
    id: "suporte",
    kind: "canal",
    name: "suporte-ti",
    topic: "Dúvidas de sistemas, acesso e equipamentos. Urgências: ramal 4180.",
    members: 1214,
    memberIds: ["diego", "felipe", "priscila"],
    unread: 0,
    mentions: 0,
    messages: [{ id: "s1", day: "Hoje", authorId: "diego", time: "08:30", text: "Instabilidade no e-mail resolvida às 08:24. Se ainda tiver problema, reinicie o Outlook." }],
  },
  {
    id: "lisboa",
    kind: "canal",
    name: "escritorio-lisboa",
    topic: "Time da Europa. Fuso de Lisboa: 4 h à frente de São Paulo.",
    members: 24,
    memberIds: ["priscila", "felipe"],
    unread: 0,
    mentions: 0,
    messages: [{ id: "l1", day: "Hoje", authorId: "priscila", time: "09:05", text: "Pessoal de SP: a daily de amanhã pode ser às 9h de vocês? Aqui é 13h." }],
  },
  {
    id: "dm-beatriz",
    kind: "dm",
    name: "Beatriz Lacerda",
    withId: "beatriz",
    members: 2,
    memberIds: ["carla", "beatriz"],
    unread: 1,
    mentions: 1,
    messages: [{ id: "d1", day: "Hoje", authorId: "beatriz", time: "09:20", text: "Carla, consegue me mandar até o almoço o alcance do comunicado de home office por área? Vou levar na reunião de diretoria.", mentions: ["carla"] }],
  },
  {
    id: "dm-gabriel",
    kind: "dm",
    name: "Gabriel Santana",
    withId: "gabriel",
    members: 2,
    memberIds: ["carla", "gabriel"],
    unread: 0,
    mentions: 0,
    messages: [{ id: "d2", day: "Ontem", authorId: "gabriel", time: "18:02", text: "Deixei o vídeo do CEO legendado. Quer revisar antes de subir?", file: { name: "video-resultado-3t.mp4", size: "96 MB" } }],
  },
  {
    id: "dm-luana",
    kind: "dm",
    name: "Luana Pires",
    withId: "luana",
    members: 2,
    memberIds: ["carla", "luana"],
    unread: 0,
    mentions: 0,
    messages: [{ id: "d3", day: "Terça", authorId: "luana", time: "15:40", text: "Os cartazes da SIPAT chegaram em Manaus. Obrigada." }],
  },
];
export const threadReplies: Record<string, { authorId: string; time: string; text: string }[]> = {
  g2: [
    { authorId: "luana", time: "08:14", text: "Que orgulho do time de Manaus. Vou ler no início do turno com todo mundo." },
    { authorId: "rodrigo", time: "08:20", text: "Parabéns a todos os CDs. Cuiabá fez um primeiro ano impressionante." },
    { authorId: "jefferson", time: "09:18", text: "Valeu, Rodrigo. O time do segundo turno merece." },
  ],
  m2: [
    { authorId: "gabriel", time: "17:30", text: "Trocado. Versão 2 na pasta." },
    { authorId: "carla", time: "17:41", text: "Perfeito, pode mandar para a gráfica." },
  ],
  o2: [{ authorId: "rodrigo", time: "07:50", text: "Ok. Me avisa se precisar de reforço do turno da tarde." }],
};
export const chatReplies = [
  "Combinado, vou ver isso agora.",
  "Boa. Já compartilho com o time.",
  "Perfeito, obrigada pelo aviso.",
];

/* ------------------------------------------------------------------ */
/* Eventos                                                             */
/* ------------------------------------------------------------------ */

export type EventMode = "presencial" | "online" | "hibrido";
export const eventMode: Record<EventMode, string> = { presencial: "Presencial", online: "On-line", hibrido: "Híbrido" };
export type CommsEvent = {
  id: string;
  title: string;
  category: "Cultura" | "Treinamento" | "Saúde" | "Institucional" | "Segurança";
  date: string;
  start: string;
  end: string;
  mode: EventMode;
  city?: CityId;
  venue?: string;
  hostId: string;
  capacity?: number;
  enrolled: number;
  going: boolean;
  description: string;
  attendeeIds: string[];
};
export const events: CommsEvent[] = [
  { id: "e1", title: "Café com o CEO · Recife", category: "Institucional", date: iso(0), start: "15:00", end: "16:00", mode: "presencial", city: "rec", venue: "CD Suape · refeitório", hostId: "otavio", capacity: 60, enrolled: 54, going: false, description: "Conversa aberta com o Otávio sobre o resultado do trimestre e os planos para 2027. Perguntas podem ser enviadas antes pelo Mural.", attendeeIds: ["rodrigo", "diego", "gabriel"] },
  { id: "e2", title: "Treinamento: novo app de ponto", category: "Treinamento", date: iso(1), start: "10:00", end: "10:45", mode: "online", hostId: "diego", enrolled: 312, going: true, description: "Demonstração do app Ponto Vértice: primeiro acesso, marcação, ajustes e banco de horas. Gravação disponível depois.", attendeeIds: ["carla", "tatiane", "sofia", "vinicius"] },
  { id: "e3", title: "Yoga no intervalo", category: "Saúde", date: iso(1), start: "12:30", end: "13:00", mode: "presencial", city: "sp", venue: "Sede · terraço", hostId: "tatiane", capacity: 20, enrolled: 20, going: false, description: "Aula de 30 minutos para aliviar a tensão. Leve roupa confortável. Tapetes disponíveis.", attendeeIds: ["isabela", "andre"] },
  { id: "e4", title: "Conversa aberta: home office híbrido", category: "Institucional", date: iso(27), start: "11:00", end: "12:00", mode: "hibrido", city: "sp", venue: "Sede · auditório e transmissão", hostId: "beatriz", capacity: 120, enrolled: 186, going: true, description: "Diretoria responde às dúvidas sobre o novo modelo híbrido. Transmissão para todas as cidades.", attendeeIds: ["carla", "vinicius", "priscila", "sofia"] },
  { id: "e5", title: "Abertura da SIPAT · Manaus", category: "Segurança", date: iso(12), start: "06:00", end: "06:30", mode: "presencial", city: "mao", venue: "CD Distrito Industrial · pátio", hostId: "luana", capacity: 180, enrolled: 132, going: false, description: "Abertura da semana de prevenção com a CIPA. Repetida no início de cada turno.", attendeeIds: ["joao", "marina"] },
  { id: "e6", title: "Happy hour de boas-vindas · Lisboa", category: "Cultura", date: iso(2), start: "18:30", end: "20:30", mode: "presencial", city: "lis", venue: "Escritório Europa · Príncipe Real", hostId: "priscila", capacity: 30, enrolled: 17, going: false, description: "Para receber as duas pessoas que entraram no time de Lisboa em setembro.", attendeeIds: ["felipe"] },
  { id: "e7", title: "Webinar: planejamento financeiro pessoal", category: "Saúde", date: iso(6), start: "19:00", end: "20:00", mode: "online", hostId: "andre", enrolled: 148, going: false, description: "Como organizar o orçamento da casa e usar a PLR com consciência. Com o time de Financeiro.", attendeeIds: ["mateus", "tatiane"] },
  { id: "e8", title: "Integração de novos colaboradores", category: "Cultura", date: iso(4), start: "09:00", end: "12:00", mode: "hibrido", city: "sp", venue: "Sede · sala Tietê", hostId: "carla", capacity: 40, enrolled: 38, going: true, description: "Manhã de integração com cultura, segurança, benefícios e um tour pelo CD Cajamar.", attendeeIds: ["rafaela", "sofia", "vinicius", "gabriel"] },
];
export const eventById = (id: string | null) => events.find((e) => e.id === id) ?? events[0];

/* ------------------------------------------------------------------ */
/* Pesquisas e enquetes                                                */
/* ------------------------------------------------------------------ */

export type SurveyKind = "enps" | "clima" | "enquete" | "pulso";
export const surveyKind: Record<SurveyKind, string> = { enps: "eNPS", clima: "Clima", enquete: "Enquete", pulso: "Pulso" };
export type SurveyStatus = "aberta" | "encerrada" | "rascunho";
export type Survey = {
  id: string;
  title: string;
  kind: SurveyKind;
  status: SurveyStatus;
  start: string;
  end: string;
  audienceLabel: string;
  audienceSize: number;
  responses: number;
  anonymous: boolean;
  ownerId: string;
};
export const surveys: Survey[] = [
  { id: "s1", title: "eNPS do 3º trimestre", kind: "enps", status: "aberta", start: iso(-8), end: iso(6), audienceLabel: "Toda a empresa", audienceSize: 1214, responses: 803, anonymous: true, ownerId: "carla" },
  { id: "s2", title: "Onde fazer a festa de fim de ano?", kind: "enquete", status: "aberta", start: iso(-2), end: iso(5), audienceLabel: "Toda a empresa", audienceSize: 1214, responses: 641, anonymous: false, ownerId: "isabela" },
  { id: "s3", title: "Pulso: carga de trabalho na separação", kind: "pulso", status: "aberta", start: iso(-1), end: iso(3), audienceLabel: "Operações · São Paulo e Recife", audienceSize: 634, responses: 197, anonymous: true, ownerId: "marina" },
  { id: "s4", title: "Pesquisa de clima 2026", kind: "clima", status: "encerrada", start: "2026-06-02", end: "2026-06-20", audienceLabel: "Toda a empresa", audienceSize: 1188, responses: 1004, anonymous: true, ownerId: "beatriz" },
  { id: "s5", title: "eNPS do 2º trimestre", kind: "enps", status: "encerrada", start: "2026-07-01", end: "2026-07-15", audienceLabel: "Toda a empresa", audienceSize: 1196, responses: 862, anonymous: true, ownerId: "carla" },
  { id: "s6", title: "Benefícios que mais importam para você", kind: "pulso", status: "rascunho", start: iso(8), end: iso(22), audienceLabel: "Toda a empresa", audienceSize: 1214, responses: 0, anonymous: true, ownerId: "tatiane" },
];
/** Respostas por nota 0–10 do eNPS aberto (803 respostas). */
export const enpsScores = [5, 3, 7, 9, 12, 25, 42, 110, 190, 200, 200];
export const enpsPrevious = 31;
export const enpsTrend = [
  { tri: "4T", enps: 18 },
  { tri: "1T", enps: 24 },
  { tri: "2T", enps: 31 },
  { tri: "3T", enps: 37 },
];
export const participationByArea = areas.map((a, i) => ({ area: a.id, label: a.label, responded: Math.round(a.headcount * [0.58, 0.79, 0.91, 1, 0.84, 0.89, 0.86, 0.71][i]), total: a.headcount }));
export const enpsByArea: { label: string; value: number }[] = [
  { label: "Operações", value: 29 },
  { label: "Comercial", value: 41 },
  { label: "Tecnologia", value: 52 },
  { label: "Pessoas", value: 61 },
  { label: "Financeiro", value: 38 },
  { label: "Jurídico", value: 44 },
  { label: "Marketing", value: 47 },
  { label: "Diretoria", value: 66 },
];
export const surveyComments = [
  { theme: "Escala e turnos", count: 94, sample: "A troca de escala avisada com só um dia de antecedência pesa muito para quem tem filho." },
  { theme: "Reconhecimento", count: 71, sample: "Gostei de ver o resultado de Manaus no comunicado do trimestre." },
  { theme: "Ferramentas e sistemas", count: 52, sample: "O coletor do recebimento trava toda manhã." },
  { theme: "Liderança", count: 46, sample: "Minha coordenadora sempre explica o porquê das mudanças." },
];

export const homePoll = {
  surveyId: "s2",
  question: "Onde fazer a festa de fim de ano?",
  options: [
    { id: "o1", label: "Em cada cidade, no mesmo dia", votes: 318 },
    { id: "o2", label: "Um encontro nacional em São Paulo", votes: 129 },
    { id: "o3", label: "Almoço no CD, no horário do turno", votes: 194 },
  ],
};

/* ------------------------------------------------------------------ */
/* Alcance (relatório)                                                 */
/* ------------------------------------------------------------------ */

export const weeklyReach = [
  { semana: "06/07", leitura: 0.61, meta: 0.75 },
  { semana: "13/07", leitura: 0.63, meta: 0.75 },
  { semana: "20/07", leitura: 0.59, meta: 0.75 },
  { semana: "27/07", leitura: 0.64, meta: 0.75 },
  { semana: "03/08", leitura: 0.66, meta: 0.75 },
  { semana: "10/08", leitura: 0.68, meta: 0.75 },
  { semana: "17/08", leitura: 0.67, meta: 0.75 },
  { semana: "24/08", leitura: 0.7, meta: 0.75 },
  { semana: "31/08", leitura: 0.71, meta: 0.75 },
  { semana: "07/09", leitura: 0.69, meta: 0.75 },
  { semana: "14/09", leitura: 0.73, meta: 0.75 },
  { semana: "21/09", leitura: 0.74, meta: 0.75 },
  { semana: "28/09", leitura: 0.76, meta: 0.75 },
];
export const channelReach = [
  { canal: "App Mural", entregues: 9840, abertos: 6790 },
  { canal: "E-mail", entregues: 4210, abertos: 1980 },
  { canal: "WhatsApp", entregues: 7120, abertos: 6050 },
];
export const timeToRead = [
  { label: "Até 1 h", value: 2810 },
  { label: "1 a 4 h", value: 2240 },
  { label: "4 a 24 h", value: 1960 },
  { label: "1 a 3 dias", value: 870 },
  { label: "Mais de 3 dias", value: 410 },
];
export const readByAreaCity: { rows: string[]; columns: string[]; values: (number | null)[][] } = {
  rows: ["Operações", "Comercial", "Tecnologia", "Pessoas e Cultura", "Financeiro", "Diretoria"],
  columns: ["São Paulo", "Recife", "Manaus", "Cuiabá", "Curitiba", "Porto Alegre", "Lisboa"],
  values: [
    [62, 55, 71, 48, 58, 60, null],
    [78, 71, 66, 69, 74, 81, null],
    [92, 88, null, null, 90, null, 94],
    [98, 96, 100, 95, 97, 100, null],
    [84, 79, 75, 72, 80, 77, null],
    [41, 38, 50, null, 44, 36, 60],
  ],
};
export const engagementByHour = [
  { hora: "06h", leituras: 610 },
  { hora: "08h", leituras: 1420 },
  { hora: "10h", leituras: 980 },
  { hora: "12h", leituras: 1310 },
  { hora: "14h", leituras: 720 },
  { hora: "16h", leituras: 540 },
  { hora: "18h", leituras: 890 },
  { hora: "20h", leituras: 470 },
  { hora: "22h", leituras: 360 },
];
