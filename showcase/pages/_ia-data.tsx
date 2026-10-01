// Dados de exemplo das páginas de IA e interação (só showcase).
import { Database, FileSpreadsheet, Mail, Search } from "lucide-react";
import type { AiSource, ToolCall, TraceStep } from "@g4os/ds";
import { art } from "./_media-data";

export const sphereImages = Array.from({ length: 36 }, (_, i) => ({ src: art(i), alt: `Imagem ${i + 1} da galeria` }));

export const sources: AiSource[] = [
  { id: "s1", kind: "record", title: "Grupo Aurora Alimentos · Negócio", domain: "CRM", snippet: "Licenças anuais para 240 usuários, fase Negociação, probabilidade 75 %." },
  { id: "s2", kind: "doc", title: "Proposta v3.pdf", domain: "Arquivos", snippet: "R$ 160 por usuário/mês, 12 meses, implantação em 60 dias." },
  { id: "s3", kind: "data", title: "Pipeline · setembro 2026", domain: "Relatórios", snippet: "Win rate de 27 % no segmento Enterprise." },
];

export const toolCalls: ToolCall[] = [
  { id: "t1", name: "crm.buscar_negocio", label: "Buscou o negócio no CRM", icon: <Database />, status: "success", durationMs: 412, input: { empresa: "Grupo Aurora Alimentos" }, output: { id: "NEG-2291", etapa: "Negociação", valor: 460800, probabilidade: 0.75 } },
  { id: "t2", name: "arquivos.ler", label: "Leu a proposta v3", icon: <FileSpreadsheet />, status: "success", durationMs: 1260, input: { arquivo: "Proposta v3.pdf", paginas: [1, 2, 3] }, output: { preco_usuario_mes: 160, prazo_meses: 12, implantacao_dias: 60 } },
  { id: "t3", name: "email.rascunhar", label: "Rascunhou o e-mail de follow-up", icon: <Mail />, status: "success", durationMs: 2140, input: { para: "renata.farias@aurora.com.br", tom: "consultivo" }, output: { assunto: "Próximos passos · licenças Aurora", palavras: 142 } },
];

export const toolCallsFailing: ToolCall[] = [
  { id: "f1", name: "web.buscar", label: "Pesquisou notícias da empresa", icon: <Search />, status: "success", durationMs: 980, input: { q: "Grupo Aurora Alimentos expansão 2026" }, output: { resultados: 6 } },
  { id: "f2", name: "erp.consultar_faturas", label: "Consultou faturas no ERP", icon: <Database />, status: "error", durationMs: 30000, input: { cliente: "AURORA-01" }, error: "Tempo esgotado após 30 s. O ERP não respondeu; tente de novo ou verifique a integração." },
  { id: "f3", name: "crm.atualizar_negocio", label: "Atualizando o negócio", icon: <Database />, status: "running", input: { id: "NEG-2291", proxima_acao: "Enviar contrato" } },
];

export const trace: TraceStep[] = [
  {
    id: "a",
    kind: "agent",
    title: "Agente de vendas · preparar follow-up",
    startMs: 0,
    durationMs: 9400,
    tokens: 8420,
    children: [
      { id: "a1", kind: "thinking", title: "Planejar os passos", startMs: 0, durationMs: 1100, tokens: 640 },
      { id: "a2", kind: "tool", title: "crm.buscar_negocio", startMs: 1100, durationMs: 420, tokens: 180 },
      { id: "a3", kind: "tool", title: "arquivos.ler · Proposta v3.pdf", startMs: 1550, durationMs: 1300, tokens: 2600 },
      {
        id: "a4",
        kind: "agent",
        title: "Subagente de pesquisa",
        startMs: 1550,
        durationMs: 3900,
        tokens: 2100,
        children: [
          { id: "a41", kind: "search", title: "web.buscar · notícias da empresa", startMs: 1600, durationMs: 1200, tokens: 400 },
          { id: "a42", kind: "tool", title: "erp.consultar_faturas", startMs: 2850, durationMs: 1400, tokens: 120, status: "error" },
          { id: "a43", kind: "tool", title: "erp.consultar_faturas (nova tentativa)", startMs: 4300, durationMs: 1100, tokens: 260 },
        ],
      },
      { id: "a5", kind: "thinking", title: "Cruzar proposta com histórico", startMs: 5500, durationMs: 1300, tokens: 1100 },
      { id: "a6", kind: "output", title: "Redigir e-mail de follow-up", startMs: 6800, durationMs: 2600, tokens: 1300 },
    ],
  },
];
