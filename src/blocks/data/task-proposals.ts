/*
 * Revisão de reunião + tarefas propostas pela IA. Troque pela sua API:
 * documento de origem, destinos (Linear, Jira, Asana, G4 Tarefas), pessoas.
 */
import type { TaskProposal } from "@g4os/ds";
import { people } from "./workspace";

const p = (id: string) => {
  const x = people.find((q) => q.id === id)!;
  return { name: x.name, initials: x.initials, tint: x.tint };
};

export const team = ["joana", "rafael", "ana", "diego", "carla", "bruno", "eduardo"].map(p);
export const projects = ["Gestão", "Importação de dados", "Onboarding", "Integrações"];

export const meeting = {
  title: "Revisão da importação de dados e correções",
  date: "30/09/2026 · 45 min",
  attendees: ["joana", "rafael", "eduardo", "carla"].map(p),
  summary: [
    "Revisamos a importação de planilhas de clientes. A maioria das importações processa bem, mas uma coluna de texto foi classificada como e-mail e bloqueou 312 linhas.",
    "O progresso da importação não é claro: quem importa não sabe se começou, se travou ou se terminou.",
    "Integrações recorrentes e importações únicas estão no mesmo menu, o que confunde quem chega.",
  ],
  decisions: ["Corrigir a detecção de tipo antes do próximo lote de clientes (07/10).", "Separar Integrações de Importações no menu.", "Mostrar progresso com etapas e tempo estimado."],
};

export const destinations = ["linear", "jira", "asana", "g4"] as const;

export const proposals: TaskProposal[] = [
  {
    id: "t1",
    destination: "linear",
    title: "Corrigir a detecção de tipo de campo na importação",
    description: "Na revisão, uma coluna de texto foi classificada como e-mail em vez de texto simples e 312 linhas ficaram bloqueadas.",
    emphasis: "Ajustar a lógica de detecção para exigir 90 % de valores válidos antes de sugerir “e-mail” e permitir trocar o tipo antes de importar.",
    subtasks: [
      { id: "s1", title: "Refinar o estilo do aviso de tipo detectado", type: "melhoria", done: true, assignee: p("carla") },
      { id: "s2", title: "Trocar linhas genéricas por exemplos reais da coluna", type: "melhoria", assignee: p("carla") },
      { id: "s3", title: "Permitir escolher o tipo antes de importar", type: "funcionalidade", assignee: p("eduardo") },
      { id: "s4", title: "Coluna “Observações” classificada como e-mail", type: "bug", assignee: p("eduardo") },
    ],
    project: "Importação de dados",
    status: "sem-status",
    priority: "alta",
    assignee: p("eduardo"),
  },
  {
    id: "t2",
    destination: "linear",
    title: "Mostrar o progresso da importação em etapas",
    description: "Hoje só aparece “Processando…”. Quem importa não sabe se travou.",
    emphasis: "Exibir etapas (ler arquivo → validar → importar), linhas processadas e tempo estimado; avisar por e-mail quando terminar.",
    subtasks: [
      { id: "s5", title: "Componente de etapas com tempo estimado", type: "funcionalidade" },
      { id: "s6", title: "E-mail de importação concluída", type: "funcionalidade" },
    ],
    project: "Importação de dados",
    status: "sem-status",
    priority: "media",
  },
  {
    id: "t3",
    destination: "g4",
    title: "Separar Integrações de Importações no menu",
    description: "As duas coisas estão juntas e confundem quem chega.",
    emphasis: "Criar o item “Importações” com histórico, mantendo “Integrações” só para conexões recorrentes.",
    project: "Gestão",
    status: "sem-status",
    priority: "baixa",
    assignee: p("joana"),
  },
];
