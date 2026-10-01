/*
 * Dados do "Agente de código" (tarefas longas em repositórios): projetos =
 * repositórios, sessões por projeto e a conversa da sessão aberta. "Hoje" =
 * 30/09/2026. Troque pela sua API (runs, commits, deploys, testes).
 */
import type { SessionProject, SessionSummary, StepItem } from "@g4ai/ds";

export type CodexResult = { kind: "commit" | "deploy" | "tests" | "pr" | "link"; text: string; code?: string; href?: string; ok?: boolean };
export type CodexEntry =
  | { kind: "user"; id: string; text: string }
  | { kind: "answer"; id: string; durationMs?: number; steps?: StepItem[]; paragraphs: string[]; results?: CodexResult[] };

export type CodexSession = SessionSummary & { thread: CodexEntry[] };

export const codexProjects: SessionProject[] = [
  { id: "ontology", name: "Ontology" },
  { id: "g4-cos-os", name: "g4-cos-os" },
  { id: "management", name: "management" },
  { id: "crm", name: "crm" },
  { id: "talky", name: "Talky" },
];

const step = (id: string, label: string, ms: number, detail?: string): StepItem => ({ id, label, durationMs: ms, status: "done", detail });

/** Histórico longo (vai recolhido em "N mensagens anteriores"). */
const earlier: CodexEntry[] = Array.from({ length: 33 }, (_, i) => [
  { kind: "user" as const, id: `h${i}u`, text: ["Mapeia onde a edição da conta é bloqueada hoje.", "Inclui o papel de gestor no modelo de permissões.", "Roda a suíte de permissões de novo.", "Revisa os textos de erro de acesso."][i % 4] },
  {
    kind: "answer" as const,
    id: `h${i}a`,
    durationMs: 20_000 + (i % 5) * 9_000,
    paragraphs: [["Encontrei 4 pontos de bloqueio no backend e 2 no front.", "Papel de gestor adicionado; migração pronta para revisão.", "Suíte de permissões: 212 testes passando.", "Textos de erro revisados em 7 telas."][i % 4]],
  },
]).flat();

export const codexSessions: CodexSession[] = [
  {
    id: "permissoes",
    title: "Ampliar permissões e edição da conta",
    time: "2m",
    status: "ready",
    projectId: "ontology",
    day: "Hoje",
    thread: [
      ...earlier,
      { kind: "user", id: "u1", text: "Outra coisa: alguém reclamou que reuniões futuras não criam mais título automaticamente, olha isso." },
      {
        kind: "answer",
        id: "a1",
        durationMs: 61_000,
        steps: [
          step("s1", "Leu o fluxo de criação de reunião (MeetingForm.tsx)", 4_200),
          step("s2", "Encontrou o título sendo zerado ao trocar o cliente", 9_800, "o efeito de cliente sobrescrevia o título sugerido"),
          step("s3", "Corrigiu a sugestão e preservou títulos digitados", 21_400),
          step("s4", "Rodou testes e validou no navegador em 1440 e 390 px", 25_600, "859 testes passando"),
        ],
        paragraphs: [
          "Corrigido. Reuniões novas e futuras agora recebem título automático, como “Alinhamento · Hospital Santa Clara”.",
          "A sugestão acompanha mudanças de tipo e cliente, preservando títulos digitados manualmente.",
          "Validado no navegador em 1440/390 px; 859 testes passando. Ainda não publicado em produção.",
        ],
      },
      { kind: "user", id: "u2", text: "Já deu commit e push? Já fez deploy?" },
      { kind: "answer", id: "a2", durationMs: 4_000, paragraphs: ["Ainda não. As alterações estão locais e validadas, mas não fiz commit, push nem deploy."] },
      { kind: "user", id: "u3", text: "Faz tudo" },
      {
        kind: "answer",
        id: "a3",
        durationMs: 214_000,
        steps: [
          step("d1", "Commit d08e63d (título automático de reuniões)", 3_100),
          step("d2", "Push em main", 2_400),
          step("d3", "Deploy de produção (Cloudflare)", 162_000, "build 2 min 42 s"),
          step("d4", "Checagem pós-deploy: site, API e MCP", 46_500),
        ],
        paragraphs: ["Feito:"],
        results: [
          { kind: "commit", text: "Commit", code: "d08e63d", ok: true },
          { kind: "deploy", text: "Deploy de produção concluído", href: "#deploy", ok: true },
          { kind: "tests", text: "859 testes passando; site respondendo e API/MCP protegidos.", ok: true },
          { kind: "link", text: "Já está publicado em delivery.g4oscloud.com", href: "#site" },
        ],
      },
    ],
  },
  { id: "leadid", title: "Localizar o campo leadid", time: "41m", status: "idle", projectId: "ontology", day: "Hoje", thread: [] },
  { id: "codex-config", title: "Configurar o agente para funcionar no repositório", time: "1h", projectId: "ontology", day: "Hoje", thread: [] },
  { id: "usabilidade", title: "Avaliar feedback de usabilidade", time: "2h", projectId: "ontology", day: "Hoje", thread: [] },
  { id: "retry", title: "Revisar tentativa e falha", time: "3h", status: "error", projectId: "ontology", day: "Hoje", parentId: "permissoes", thread: [] },
  { id: "deploy-cloud", title: "Avaliar segurança e deploy na nuvem", time: "5h", projectId: "management", day: "Hoje", thread: [] },
  { id: "mascote", title: "Criar mascote 3D interativo", time: "ontem", projectId: "talky", day: "Ontem", thread: [] },
  { id: "corgi", title: "Entender o projeto", time: "ontem", projectId: "talky", day: "Ontem", thread: [] },
  { id: "ia-falhas", title: "Corrigir falhas recentes de IA", time: "agora", status: "working", projectId: "crm", day: "Hoje", thread: [] },
  { id: "funis", title: "Planejar contas, funis e dashboards", time: "ontem", projectId: "crm", day: "Ontem", thread: [] },
  { id: "rotas", title: "Mapear rotas do app", time: "2d", projectId: "g4-cos-os", day: "Esta semana", thread: [] },
];

export const codexModels = [
  { id: "sol-light", name: "Sol Light", group: "Código", description: "Rápido para tarefas pequenas" },
  { id: "sol", name: "Sol", group: "Código", description: "Padrão para a maioria das tarefas" },
  { id: "sol-max", name: "Sol Max", group: "Código", description: "Refatorações longas e investigação" },
];

/** Execução simulada para um pedido novo. */
export function codexRun(prompt: string): { steps: StepItem[]; paragraphs: string[]; results: CodexResult[] } {
  const p = prompt.toLowerCase();
  if (p.includes("teste")) {
    return {
      steps: [step("n1", "Rodou a suíte completa", 38_000), step("n2", "Reexecutou 2 testes instáveis", 6_400)],
      paragraphs: ["Suíte verde depois de reexecutar 2 testes instáveis de agenda (dependem do fuso)."],
      results: [{ kind: "tests", text: "861 testes passando", ok: true }],
    };
  }
  return {
    steps: [step("n1", "Leu os arquivos relacionados", 5_200), step("n2", "Aplicou a mudança em 3 arquivos", 14_800), step("n3", "Rodou typecheck e testes", 22_000, "861 testes passando")],
    paragraphs: ["Pronto. Mudança aplicada e validada localmente; nada foi enviado ainda.", "Quer que eu faça commit e abra um PR?"],
    results: [{ kind: "pr", text: "Pronto para abrir PR", code: "feat/ajuste", ok: true }],
  };
}
