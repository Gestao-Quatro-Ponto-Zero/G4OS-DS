/*
 * Talentos (ATS) · dados de exemplo compartilhados por TODAS as telas do
 * produto: a mesma vaga, candidato, entrevista e proposta aparecem iguais na
 * lista, no quadro, no perfil, na agenda e na busca ⌘K. Troque pela sua API.
 * "Hoje" = 30/09/2026. Empresa contratante: Nexo S.A.
 */

export const company = { name: "Nexo S.A.", careersUrl: "carreiras.nexo.com.br" };
export const today = new Date(2026, 8, 30);

/** Data ISO relativa a hoje: iso(-3) = 3 dias atrás. */
export const iso = (days: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const shortDate = (isoDate: string) => isoDate.slice(8, 10) + "/" + isoDate.slice(5, 7);

/* ------------------------------------------------------------------ */
/* Pessoas do time                                                     */
/* ------------------------------------------------------------------ */

export type Person = { id: string; name: string; initials: string; tint?: string; role: string };
// ds-audit-ignore-start hex-color: tintas de avatar (identidade da pessoa)
export const team: Person[] = [
  { id: "juliana", name: "Juliana Rocha", initials: "JR", tint: "#842e20", role: "Tech recruiter" },
  { id: "thiago", name: "Thiago Almeida", initials: "TA", tint: "#184560", role: "Recrutador comercial" },
  { id: "camila", name: "Camila Siqueira", initials: "CS", tint: "#5f7f6f", role: "Recrutadora de produto" },
  { id: "marcos", name: "Marcos Siqueira", initials: "MS", tint: "#184560", role: "Head de Engenharia" },
  { id: "eduardo", name: "Eduardo Barros", initials: "EB", role: "Tech lead" },
  { id: "rafael", name: "Rafael Queiroz", initials: "RQ", tint: "#8c6a3a", role: "Diretor de Tecnologia" },
  { id: "renata", name: "Renata Farias", initials: "RF", tint: "#842e20", role: "Diretora comercial" },
  { id: "helena", name: "Helena Duarte", initials: "HD", tint: "#5f7f6f", role: "Controller" },
];
// ds-audit-ignore-end
export const me = team[0];
export const person = (id: string) => team.find((p) => p.id === id) ?? team[0];

/* ------------------------------------------------------------------ */
/* Etapas e vagas                                                      */
/* ------------------------------------------------------------------ */

export const stages = [
  { id: "triagem", label: "Triagem" },
  { id: "rh", label: "Entrevista RH" },
  { id: "case", label: "Case técnico" },
  { id: "final", label: "Entrevista final" },
  { id: "proposta", label: "Proposta" },
] as const;
export type StageId = (typeof stages)[number]["id"];
export const stageLabel = (id: string) => stages.find((s) => s.id === id)?.label ?? id;

export type JobStatus = "aberta" | "pausada" | "encerrada";
export type Job = {
  id: string;
  title: string;
  short: string;
  area: string;
  level: string;
  location: string;
  mode: "Presencial" | "Híbrido" | "Remoto";
  status: JobStatus;
  openedAt: string;
  sla: number;
  recruiter: string;
  manager: string;
  salary: [number, number];
  openings: number;
  priority?: boolean;
  /** Candidatos por etapa além dos listados em `candidates` (volume da triagem). */
  backlog: number[];
  newToday: number;
  summary: string;
  requirements: string[];
  criteria: { label: string; weight: number; expected: number }[];
};

const techCriteria = [
  { label: "Arquitetura e design de sistemas", weight: 30, expected: 4.5 },
  { label: "Qualidade de código", weight: 25, expected: 4 },
  { label: "Comunicação", weight: 15, expected: 4 },
  { label: "Colaboração e cultura", weight: 15, expected: 4 },
  { label: "Liderança técnica", weight: 15, expected: 4 },
];
const salesCriteria = [
  { label: "Prospecção e negociação", weight: 35, expected: 4.5 },
  { label: "Conhecimento do mercado", weight: 20, expected: 4 },
  { label: "Comunicação", weight: 20, expected: 4.5 },
  { label: "Organização do pipeline", weight: 15, expected: 4 },
  { label: "Colaboração e cultura", weight: 10, expected: 4 },
];
const genericCriteria = [
  { label: "Domínio técnico da função", weight: 35, expected: 4 },
  { label: "Resolução de problemas", weight: 25, expected: 4 },
  { label: "Comunicação", weight: 20, expected: 4 },
  { label: "Colaboração e cultura", weight: 20, expected: 4 },
];

export const jobs: Job[] = [
  { id: "j1", title: "Pessoa Desenvolvedora Back-end Sênior", short: "Back-end Sênior", area: "Tecnologia", level: "Sênior", location: "São Paulo, SP", mode: "Híbrido", status: "aberta", openedAt: iso(-18), sla: 45, recruiter: "juliana", manager: "marcos", salary: [18_000, 26_000], openings: 2, priority: true, backlog: [78, 12, 4, 1, 0], newToday: 7, summary: "Time de Pagamentos: serviços em Go e Kotlin, eventos com Kafka, alta disponibilidade. Você vai liderar a migração do motor de conciliação.", requirements: ["6+ anos com back-end em produção", "Sistemas distribuídos e mensageria", "Testes automatizados e observabilidade", "Inglês para leitura técnica"], criteria: techCriteria },
  { id: "j2", title: "Analista de Dados Pleno", short: "Dados Pleno", area: "Tecnologia", level: "Pleno", location: "Remoto", mode: "Remoto", status: "aberta", openedAt: iso(-32), sla: 40, recruiter: "juliana", manager: "marcos", salary: [9_000, 12_500], openings: 1, backlog: [138, 20, 8, 2, 0], newToday: 12, summary: "Modelagem no dbt, painéis para Comercial e Financeiro e experimentos de preço.", requirements: ["SQL avançado", "dbt ou ferramenta equivalente", "Python para análise", "Boa comunicação com áreas de negócio"], criteria: genericCriteria },
  { id: "j3", title: "Executivo(a) de Contas Enterprise", short: "Executivo(a) Enterprise", area: "Comercial", level: "Sênior", location: "São Paulo, SP", mode: "Presencial", status: "aberta", openedAt: iso(-51), sla: 45, recruiter: "thiago", manager: "renata", salary: [14_000, 18_000], openings: 1, priority: true, backlog: [60, 9, 3, 1, 0], newToday: 2, summary: "Carteira de 40 contas acima de R$ 500 mil/ano. Ciclos de 3 a 9 meses com múltiplos decisores.", requirements: ["Venda consultiva B2B", "Ciclos longos com comitê", "CRM em dia", "Disponibilidade para viagens"], criteria: salesCriteria },
  { id: "j4", title: "SDR · Pré-vendas", short: "SDR", area: "Comercial", level: "Júnior", location: "Belo Horizonte, MG", mode: "Híbrido", status: "aberta", openedAt: iso(-9), sla: 30, recruiter: "thiago", manager: "renata", salary: [3_800, 5_200], openings: 4, backlog: [205, 29, 0, 4, 0], newToday: 19, summary: "Qualificação de leads inbound e cadências outbound para o time Enterprise.", requirements: ["Boa escrita", "Organização", "Vontade de aprender vendas B2B"], criteria: salesCriteria },
  { id: "j5", title: "Product Designer Pleno", short: "Product Designer", area: "Produto", level: "Pleno", location: "Remoto", mode: "Remoto", status: "aberta", openedAt: iso(-27), sla: 40, recruiter: "camila", manager: "rafael", salary: [11_000, 15_000], openings: 1, backlog: [114, 15, 6, 1, 0], newToday: 5, summary: "Squad de Faturamento: fluxos de emissão de nota, conciliação e cobrança.", requirements: ["Portfólio com produtos B2B", "Design system", "Pesquisa com usuários"], criteria: genericCriteria },
  { id: "j6", title: "Analista Financeiro(a) · Contas a Pagar", short: "Analista Financeiro", area: "Financeiro", level: "Pleno", location: "Curitiba, PR", mode: "Presencial", status: "pausada", openedAt: iso(-40), sla: 35, recruiter: "camila", manager: "helena", salary: [6_500, 8_000], openings: 1, backlog: [72, 9, 0, 1, 0], newToday: 0, summary: "Rotina de contas a pagar, conciliação bancária e fechamento mensal.", requirements: ["ERP (Nexo, Totvs ou SAP)", "Excel avançado", "Conciliação bancária"], criteria: genericCriteria },
  { id: "j7", title: "Coordenador(a) de Logística", short: "Coord. de Logística", area: "Operações", level: "Coordenação", location: "Campinas, SP", mode: "Presencial", status: "aberta", openedAt: iso(-22), sla: 45, recruiter: "thiago", manager: "helena", salary: [12_000, 15_000], openings: 1, backlog: [47, 7, 3, 1, 0], newToday: 1, summary: "Dois centros de distribuição, 38 pessoas, indicadores de OTIF e custo por pedido.", requirements: ["Gestão de CD", "WMS", "Liderança de times operacionais"], criteria: genericCriteria },
  { id: "j8", title: "Business Partner de RH", short: "BP de RH", area: "Pessoas", level: "Sênior", location: "São Paulo, SP", mode: "Híbrido", status: "encerrada", openedAt: iso(-60), sla: 45, recruiter: "juliana", manager: "helena", salary: [13_000, 16_000], openings: 1, backlog: [95, 12, 5, 2, 0], newToday: 0, summary: "Parceria com as diretorias comercial e de tecnologia.", requirements: ["Experiência como BP", "Remuneração e carreira"], criteria: genericCriteria },
];
export const jobById = (id: string) => jobs.find((j) => j.id === id) ?? jobs[0];
export const areas = [...new Set(jobs.map((j) => j.area))];
export const openDays = (j: Job) => Math.round((today.getTime() - new Date(`${j.openedAt}T00:00:00`).getTime()) / 86400000);

/* ------------------------------------------------------------------ */
/* Candidatos                                                          */
/* ------------------------------------------------------------------ */

export type CandidateStatus = "ativo" | "reprovado" | "contratado" | "banco";
export type Candidate = {
  id: string;
  name: string;
  initials: string;
  tint: string;
  headline: string;
  city: string;
  email: string;
  phone: string;
  source: "LinkedIn" | "Indicação" | "Site de carreiras" | "Gupy" | "Hunting" | "Universidades";
  jobId: string;
  stage: StageId;
  status: CandidateStatus;
  rating: number | null;
  daysInStage: number;
  appliedAt: string;
  salaryExpectation: number;
  notice: string;
  skills: string[];
  referral?: string;
  experience: { role: string; company: string; period: string; body: string }[];
};

type Seed = [id: string, name: string, headline: string, city: string, source: Candidate["source"], jobId: string, stage: StageId, status: CandidateStatus, rating: number | null, days: number, applied: number, salary: number, skills: string[], referral?: string];
// ds-audit-ignore-start hex-color: tintas de avatar (identidade da pessoa)
const tints = ["#842e20", "#184560", "#3f3f46", "#8c6a3a", "#5f7f6f", "#202124"];
// ds-audit-ignore-end
const seeds: Seed[] = [
  ["c1", "Larissa Mendes", "Engenheira de Software Sênior · Nubank", "São Paulo, SP", "LinkedIn", "j1", "final", "ativo", 4.3, 2, -18, 24_000, ["Go", "Kafka", "Kotlin", "AWS"]],
  ["c2", "Rodrigo Tavares", "Tech Lead · iFood", "São Paulo, SP", "Indicação", "j1", "case", "ativo", 4.2, 4, -15, 26_000, ["Java", "Kubernetes", "Liderança"], "Eduardo Barros"],
  ["c3", "Patrícia Lima", "Engenheira de Software · Stone", "Rio de Janeiro, RJ", "Site de carreiras", "j1", "case", "ativo", 3.8, 6, -14, 21_000, ["Go", "PostgreSQL"]],
  ["c4", "Felipe Nunes", "Back-end Pleno · Totvs", "Joinville, SC", "LinkedIn", "j1", "rh", "ativo", 3.5, 1, -8, 17_500, ["Java", "Spring"]],
  ["c5", "Aline Costa", "Desenvolvedora Go · PicPay", "São Paulo, SP", "Gupy", "j1", "rh", "ativo", null, 0, -6, 19_000, ["Go", "gRPC"]],
  ["c6", "Gustavo Ribeiro", "Engenheiro de Dados · Itaú", "Osasco, SP", "LinkedIn", "j1", "triagem", "ativo", null, 3, -3, 20_000, ["Python", "Spark"]],
  ["c7", "Mariana Freitas", "Back-end Sênior · Mercado Livre", "Campinas, SP", "Indicação", "j1", "triagem", "ativo", null, 1, -1, 25_000, ["Java", "Kafka", "Arquitetura"], "Marcos Siqueira"],
  ["c8", "Vinícius Pacheco", "Desenvolvedor Java · Bradesco", "São Paulo, SP", "Site de carreiras", "j1", "triagem", "ativo", null, 8, -8, 18_000, ["Java", "Oracle"]],
  ["c9", "Bianca Rezende", "Staff Engineer · QuintoAndar", "São Paulo, SP", "Hunting", "j1", "proposta", "ativo", 4.8, 1, -20, 27_000, ["Go", "Arquitetura", "Mentoria"]],
  ["c10", "Otávio Brandão", "Analista de BI · Magazine Luiza", "Franca, SP", "LinkedIn", "j2", "case", "ativo", 4.0, 3, -20, 11_000, ["SQL", "dbt", "Looker"]],
  ["c11", "Carolina Paiva", "Analista de Dados · Hotmart", "Belo Horizonte, MG", "Site de carreiras", "j2", "final", "ativo", 4.4, 2, -25, 12_000, ["SQL", "Python", "Experimentos"]],
  ["c12", "Diego Nascimento", "Data Analyst · Loggi", "Remoto", "Gupy", "j2", "rh", "ativo", 3.6, 4, -9, 10_000, ["SQL", "Metabase"]],
  ["c13", "Sofia Albuquerque", "Key Account · Salesforce", "São Paulo, SP", "Hunting", "j3", "proposta", "ativo", 4.6, 3, -40, 18_000, ["Enterprise", "SaaS", "Negociação"]],
  ["c14", "Henrique Lobo", "Executivo de Contas · Totvs", "São Paulo, SP", "LinkedIn", "j3", "final", "ativo", 4.1, 5, -30, 16_500, ["ERP", "Indústria"]],
  ["c15", "Letícia Moraes", "SDR · RD Station", "Belo Horizonte, MG", "Site de carreiras", "j4", "final", "ativo", 4.2, 1, -7, 4_800, ["Cadências", "HubSpot"]],
  ["c16", "João Pedro Alves", "Estudante de Administração · UFMG", "Belo Horizonte, MG", "Universidades", "j4", "rh", "ativo", 3.9, 2, -5, 3_900, ["Comunicação"]],
  ["c17", "Natália Queiroz", "Product Designer · Conta Azul", "Remoto", "LinkedIn", "j5", "case", "ativo", 4.3, 2, -16, 14_000, ["Figma", "Design system", "Pesquisa"]],
  ["c18", "André Figueiredo", "UX Designer · Globo", "Rio de Janeiro, RJ", "Indicação", "j5", "rh", "ativo", null, 1, -4, 12_500, ["Figma", "Prototipação"], "Camila Siqueira"],
  ["c19", "Paula Menezes", "Supervisora de Logística · Via", "Jundiaí, SP", "LinkedIn", "j7", "final", "ativo", 4.0, 4, -18, 13_500, ["WMS", "OTIF", "Liderança"]],
  ["c20", "Ricardo Sampaio", "Analista Financeiro · Ambev", "Curitiba, PR", "Site de carreiras", "j6", "final", "ativo", 3.9, 12, -30, 7_200, ["SAP", "Conciliação"]],
  ["c21", "Tatiane Rocha", "HRBP · Ambev", "São Paulo, SP", "Hunting", "j8", "proposta", "contratado", 4.7, 0, -55, 15_500, ["HRBP", "Remuneração"]],
  ["c22", "Lucas Barreto", "Desenvolvedor Back-end · Zup", "Uberlândia, MG", "LinkedIn", "j1", "case", "reprovado", 2.9, 0, -21, 19_500, ["Java"]],
  ["c23", "Fernanda Castro", "Engenheira de Software · VTEX", "Rio de Janeiro, RJ", "Site de carreiras", "j1", "triagem", "banco", 3.7, 0, -120, 22_000, ["Node.js", "TypeScript"]],
  ["c24", "Marcelo Duarte", "Executivo de Vendas · Senior Sistemas", "Blumenau, SC", "LinkedIn", "j3", "rh", "banco", 3.4, 0, -90, 15_000, ["Indústria"]],
];
const phones = ["(11) 98765-4321", "(21) 99812-3344", "(31) 99654-1020", "(41) 98877-6655", "(19) 99123-4567"];

export const candidates: Candidate[] = seeds.map(([id, name, headline, city, source, jobId, stage, status, rating, days, applied, salary, skills, referral], i) => {
  const company = headline.split(" · ")[1] ?? "Autônomo";
  const role = headline.split(" · ")[0];
  return {
    id,
    name,
    initials: name.split(" ").map((w) => w[0]).filter((_, k, a) => k === 0 || k === a.length - 1).join(""),
    tint: tints[i % tints.length],
    headline,
    city,
    email: `${name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, ".")}@email.com`,
    phone: phones[i % phones.length],
    source,
    jobId,
    stage,
    status,
    rating,
    daysInStage: days,
    appliedAt: iso(applied),
    salaryExpectation: salary,
    notice: ["Imediata", "15 dias", "30 dias", "45 dias"][i % 4],
    skills,
    referral,
    experience: [
      { role, company, period: `${2026 - 2 - (i % 3)} – atual`, body: `Responsável por entregas de ponta a ponta no time de ${skills[0]}; referência para pessoas mais novas.` },
      { role: role.replace("Sênior", "Pleno").replace("Staff Engineer", "Engenheira Sênior"), company: ["Movile", "CI&T", "Totvs", "Accenture", "B2W"][i % 5], period: `${2026 - 5 - (i % 3)} – ${2026 - 2 - (i % 3)}`, body: "Projetos para varejo e serviços financeiros; participação em migrações e melhoria de processos." },
    ],
  };
});
export const candidateById = (id: string) => candidates.find((c) => c.id === id) ?? candidates[0];
export const candidatesOf = (jobId: string) => candidates.filter((c) => c.jobId === jobId && c.status === "ativo");

/* ------------------------------------------------------------------ */
/* Avaliações (scorecards)                                             */
/* ------------------------------------------------------------------ */

export type Verdict = "sim-forte" | "sim" | "nao";
export type Scorecard = { id: string; candidateId: string; interviewer: string; stage: string; date: string; scores: number[]; verdict: Verdict; note: string };
export const scorecards: Scorecard[] = [
  { id: "s1", candidateId: "c1", interviewer: "marcos", stage: "Case técnico", date: iso(-6), scores: [5, 4, 4, 5, 4], verdict: "sim-forte", note: "Desenhou a solução de filas com trade-offs claros; testou antes de otimizar." },
  { id: "s2", candidateId: "c1", interviewer: "eduardo", stage: "Case técnico", date: iso(-6), scores: [4, 5, 4, 4, 3], verdict: "sim", note: "Código muito limpo. Liderança ainda pouco demonstrada em times grandes." },
  { id: "s3", candidateId: "c1", interviewer: "juliana", stage: "Entrevista RH", date: iso(-13), scores: [0, 0, 5, 5, 4], verdict: "sim", note: "Motivação alinhada ao momento da empresa; pretensão dentro da faixa." },
  { id: "s4", candidateId: "c2", interviewer: "juliana", stage: "Entrevista RH", date: iso(-9), scores: [0, 0, 4, 4, 5], verdict: "sim", note: "Liderou time de 8 pessoas; quer voltar a codar mais." },
  { id: "s5", candidateId: "c9", interviewer: "marcos", stage: "Entrevista final", date: iso(-2), scores: [5, 5, 5, 4, 5], verdict: "sim-forte", note: "Melhor conversa de arquitetura do processo. Referência técnica imediata." },
  { id: "s6", candidateId: "c9", interviewer: "rafael", stage: "Entrevista final", date: iso(-2), scores: [5, 4, 4, 5, 5], verdict: "sim-forte", note: "Alinhada com a visão de plataforma. Fechar rápido." },
  { id: "s7", candidateId: "c13", interviewer: "renata", stage: "Entrevista final", date: iso(-4), scores: [5, 4, 5, 4, 4], verdict: "sim-forte", note: "Carteira comparável, ótima leitura de comitês de compra." },
  { id: "s8", candidateId: "c22", interviewer: "eduardo", stage: "Case técnico", date: iso(-3), scores: [3, 2, 3, 4, 2], verdict: "nao", note: "Solução sem tratamento de falhas; pouca clareza sobre consistência." },
];
export const scorecardsOf = (candidateId: string) => scorecards.filter((s) => s.candidateId === candidateId);
export const verdictInfo = {
  "sim-forte": { label: "Contratar com certeza", tone: "ok" as const },
  sim: { label: "Contratar", tone: "ok" as const },
  nao: { label: "Não contratar", tone: "bad" as const },
};

/* ------------------------------------------------------------------ */
/* Entrevistas                                                         */
/* ------------------------------------------------------------------ */

export type Interview = {
  id: string;
  candidateId: string;
  jobId: string;
  kind: "Entrevista RH" | "Case técnico" | "Entrevista final" | "Conversa com gestor";
  date: string;
  time: string;
  duration: number;
  interviewers: string[];
  where: string;
  state: "agendada" | "realizada" | "cancelada";
  feedback: "pendente" | "enviado" | "n/a";
};
export const interviews: Interview[] = [
  { id: "i1", candidateId: "c1", jobId: "j1", kind: "Entrevista final", date: iso(2), time: "15:00", duration: 60, interviewers: ["rafael", "marcos"], where: "Google Meet", state: "agendada", feedback: "n/a" },
  { id: "i2", candidateId: "c2", jobId: "j1", kind: "Case técnico", date: iso(0), time: "10:00", duration: 90, interviewers: ["marcos", "eduardo"], where: "Sala Ipê · SP", state: "agendada", feedback: "n/a" },
  { id: "i3", candidateId: "c3", jobId: "j1", kind: "Case técnico", date: iso(-1), time: "14:00", duration: 90, interviewers: ["eduardo"], where: "Google Meet", state: "realizada", feedback: "pendente" },
  { id: "i4", candidateId: "c4", jobId: "j1", kind: "Entrevista RH", date: iso(0), time: "16:30", duration: 45, interviewers: ["juliana"], where: "Google Meet", state: "agendada", feedback: "n/a" },
  { id: "i5", candidateId: "c11", jobId: "j2", kind: "Entrevista final", date: iso(1), time: "11:00", duration: 60, interviewers: ["marcos"], where: "Google Meet", state: "agendada", feedback: "n/a" },
  { id: "i6", candidateId: "c10", jobId: "j2", kind: "Case técnico", date: iso(-2), time: "09:30", duration: 60, interviewers: ["marcos"], where: "Google Meet", state: "realizada", feedback: "pendente" },
  { id: "i7", candidateId: "c14", jobId: "j3", kind: "Entrevista final", date: iso(3), time: "17:00", duration: 60, interviewers: ["renata"], where: "Sede · SP", state: "agendada", feedback: "n/a" },
  { id: "i8", candidateId: "c15", jobId: "j4", kind: "Conversa com gestor", date: iso(0), time: "13:30", duration: 30, interviewers: ["renata"], where: "Google Meet", state: "agendada", feedback: "n/a" },
  { id: "i9", candidateId: "c17", jobId: "j5", kind: "Case técnico", date: iso(-3), time: "15:00", duration: 90, interviewers: ["rafael"], where: "Google Meet", state: "realizada", feedback: "enviado" },
  { id: "i10", candidateId: "c19", jobId: "j7", kind: "Entrevista final", date: iso(1), time: "10:00", duration: 60, interviewers: ["helena"], where: "CD Campinas", state: "agendada", feedback: "n/a" },
  { id: "i11", candidateId: "c18", jobId: "j5", kind: "Entrevista RH", date: iso(4), time: "09:00", duration: 45, interviewers: ["camila"], where: "Google Meet", state: "agendada", feedback: "n/a" },
  { id: "i13", candidateId: "c9", jobId: "j1", kind: "Entrevista final", date: iso(-2), time: "11:00", duration: 60, interviewers: ["marcos", "rafael"], where: "Sala Ipê · SP", state: "realizada", feedback: "enviado" },
  { id: "i14", candidateId: "c9", jobId: "j1", kind: "Case técnico", date: iso(-9), time: "14:00", duration: 90, interviewers: ["eduardo"], where: "Google Meet", state: "realizada", feedback: "enviado" },
  { id: "i12", candidateId: "c12", jobId: "j2", kind: "Entrevista RH", date: iso(-4), time: "16:00", duration: 45, interviewers: ["juliana"], where: "Google Meet", state: "realizada", feedback: "enviado" },
];
export const interviewsOf = (candidateId: string) => interviews.filter((i) => i.candidateId === candidateId);

/* ------------------------------------------------------------------ */
/* Propostas                                                           */
/* ------------------------------------------------------------------ */

export type OfferStatus = "rascunho" | "aprovacao" | "enviada" | "aceita" | "recusada";
export type Offer = {
  id: string;
  candidateId: string;
  jobId: string;
  salary: number;
  bonus: string;
  start: string;
  status: OfferStatus;
  createdAt: string;
  expiresAt?: string;
  approvals: { who: string; state: "done" | "current" | "upcoming" }[];
  note?: string;
};
export const offers: Offer[] = [
  { id: "o1", candidateId: "c9", jobId: "j1", salary: 27_000, bonus: "até 3 salários/ano", start: iso(30), status: "aprovacao", createdAt: iso(-1), approvals: [{ who: "juliana", state: "done" }, { who: "marcos", state: "done" }, { who: "rafael", state: "current" }], note: "Acima do teto da faixa (R$ 26 mil): precisa de aprovação da diretoria." },
  { id: "o2", candidateId: "c13", jobId: "j3", salary: 17_500, bonus: "comissão 8 % + acelerador", start: iso(21), status: "enviada", createdAt: iso(-3), expiresAt: iso(2), approvals: [{ who: "thiago", state: "done" }, { who: "renata", state: "done" }] },
  { id: "o3", candidateId: "c21", jobId: "j8", salary: 15_500, bonus: "PLR", start: iso(-5), status: "aceita", createdAt: iso(-20), approvals: [{ who: "juliana", state: "done" }, { who: "helena", state: "done" }] },
  { id: "o4", candidateId: "c11", jobId: "j2", salary: 12_000, bonus: "PLR", start: iso(35), status: "rascunho", createdAt: iso(0), approvals: [{ who: "juliana", state: "current" }, { who: "marcos", state: "upcoming" }] },
  { id: "o5", candidateId: "c20", jobId: "j6", salary: 7_600, bonus: "PLR", start: iso(10), status: "recusada", createdAt: iso(-12), approvals: [{ who: "camila", state: "done" }, { who: "helena", state: "done" }], note: "Aceitou contraproposta do empregador atual." },
];
export const offerStatus: Record<OfferStatus, { label: string; tone: "neutral" | "info" | "warn" | "ok" | "bad" }> = {
  rascunho: { label: "Rascunho", tone: "neutral" },
  aprovacao: { label: "Em aprovação", tone: "warn" },
  enviada: { label: "Enviada", tone: "info" },
  aceita: { label: "Aceita", tone: "ok" },
  recusada: { label: "Recusada", tone: "bad" },
};

/* ------------------------------------------------------------------ */
/* Indicadores do painel                                               */
/* ------------------------------------------------------------------ */

export const hiresByMonth = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set"].map((mes, i) => ({ mes, contratacoes: [6, 8, 11, 9, 14, 12, 15, 18, 16][i], meta: 12 }));
export const timeByArea = [
  { area: "Tecnologia", dias: 41, sla: 45 },
  { area: "Comercial", dias: 37, sla: 30 },
  { area: "Produto", dias: 33, sla: 40 },
  { area: "Operações", dias: 26, sla: 35 },
  { area: "Financeiro", dias: 29, sla: 35 },
  { area: "Pessoas", dias: 24, sla: 30 },
];
export const hiringFunnel = [
  { label: "Candidaturas", value: 3_420 },
  { label: "Triagem aprovada", value: 612 },
  { label: "Entrevistas", value: 248 },
  { label: "Propostas", value: 71 },
  { label: "Contratações", value: 58 },
];
export const sourceQuality = [
  { source: "Indicação interna", applicants: 214, hires: 17, retention: 0.94, cost: 2_000 },
  { source: "LinkedIn", applicants: 1_380, hires: 19, retention: 0.84, cost: 4_600 },
  { source: "Site de carreiras", applicants: 1_120, hires: 12, retention: 0.81, cost: 1_300 },
  { source: "Hunting", applicants: 96, hires: 7, retention: 0.88, cost: 9_800 },
  { source: "Universidades", applicants: 610, hires: 3, retention: 0.67, cost: 2_900 },
];
