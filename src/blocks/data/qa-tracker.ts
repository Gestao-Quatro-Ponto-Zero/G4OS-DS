/*
 * Rastreador de QA (banco de registros estilo Notion). Troque pela sua API.
 */
import type { Priority, RecordFile, TagColor, TaskStatus } from "@g4ai/ds";
import { people } from "./workspace";

export type QaCase = {
  id: string;
  code: string;
  title: string;
  description: string;
  done: boolean;
  category: string;
  status: TaskStatus;
  priority: Priority;
  owner: string;
  due: string;
  files: RecordFile[];
};

export const categoryColor: Record<string, TagColor> = {
  Autenticação: "purple",
  Busca: "orange",
  Integração: "green",
  QA: "gray",
  Tarefas: "red",
  Permissões: "pink",
  Workspace: "brown",
  "Banco de dados": "yellow",
  Documentos: "brown",
  Notificações: "pink",
  Interface: "blue",
};
export const categories = Object.keys(categoryColor);
export const statuses: TaskStatus[] = ["nao-iniciado", "em-andamento", "em-revisao", "concluido"];

const owners = ["eduardo", "carla", "diego", "ana", "bruno"];
const seed: [string, string, TaskStatus, Priority][] = [
  ["Autenticação: proteção CSRF no login", "Autenticação", "em-andamento", "alta"],
  ["Busca: desempenho com 50 mil contatos", "Busca", "nao-iniciado", "alta"],
  ["Integração: registros duplicados no HubSpot", "Integração", "concluido", "baixa"],
  ["QA: nova tentativa após falha de rede", "QA", "nao-iniciado", "alta"],
  ["Tarefas: ordenação por prazo", "Tarefas", "concluido", "baixa"],
  ["Permissões: leitor vê botão de excluir", "Permissões", "em-andamento", "media"],
  ["Workspace: excluir workspace com dados", "Workspace", "nao-iniciado", "alta"],
  ["Banco de dados: relação entre empresa e contato", "Banco de dados", "concluido", "baixa"],
  ["Documentos: arquivos grandes (> 50 MB)", "Documentos", "em-andamento", "alta"],
  ["Notificações: som em segundo plano", "Notificações", "nao-iniciado", "media"],
  ["Interface: avatar sem foto", "Interface", "concluido", "baixa"],
  ["Busca: frase com acentos", "Busca", "em-andamento", "alta"],
  ["Autenticação: sessão expirada no meio do formulário", "Autenticação", "concluido", "baixa"],
  ["Integração: importação de planilha grande", "Integração", "nao-iniciado", "alta"],
  ["QA: rota 404 sem layout", "QA", "em-revisao", "media"],
  ["Tarefas: conclusão em massa", "Tarefas", "nao-iniciado", "alta"],
  ["Permissões: convidado acessa relatório", "Permissões", "concluido", "baixa"],
  ["Interface: foco do teclado no modal", "Interface", "em-revisao", "media"],
];

export const cases: QaCase[] = seed.map(([title, category, status, priority], i) => {
  const n = 98 - i;
  return {
    id: `qa${n}`,
    code: String(n).padStart(3, "0"),
    title,
    description:
      i === 0
        ? "Verificar se o formulário de login rejeita requisições sem token CSRF válido e se o token é renovado a cada sessão."
        : "Reproduzir o cenário descrito, registrar o resultado esperado e anexar evidências (vídeo ou print).",
    done: status === "concluido",
    category,
    status,
    priority,
    owner: owners[i % owners.length],
    due: `${String(((i * 3) % 27) + 1).padStart(2, "0")}/10/2026`,
    files:
      i === 0
        ? [
            { id: "f1", name: "Notas de teste de agosto", kind: "pdf", meta: "1,2 MB" },
            { id: "f2", name: "test-case-098-authentication.js", kind: "github" },
          ]
        : i % 3 === 0
          ? [{ id: `f${i}`, name: `evidencia-${n}.png`, kind: "image", meta: "340 KB" }]
          : [],
  };
});

export const notes = {
  columns: ["#", "Caso de teste", "Resultado esperado"],
  rows: [
    ["1", "Login sem token CSRF", "Requisição recusada com 403 e mensagem clara"],
    ["2", "Token de outra sessão", "Recusado; sessão atual mantida"],
    ["3", "Token após logout", "Recusado; pede novo login"],
    ["4", "Formulário aberto por 2 h", "Token renovado sem perder o que foi digitado"],
  ],
};

export const personOf = (id: string) => {
  const p = people.find((x) => x.id === id) ?? people[0];
  return { name: p.name, initials: p.initials, tint: p.tint };
};
