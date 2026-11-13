import { useState } from "react";
import {
  AgentRunCard,
  DiffApproval,
  EvalCaseCompare,
  EvalDotGrid,
  EvalRunHeader,
  OperationButton,
  RunResult,
  RunStepList,
  notify,
  useOperation,
  type AgentRunScript,
  type EvalCaseDetail,
  type EvalCaseStatus,
  type EvalCategory,
  type RunChange,
} from "@g4ai/ds";
import { GitPullRequest, Play } from "lucide-react";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Execução e avaliação de agentes",
  group: "IA e interação",
  order: 24,
  description:
    "AgentRunCard acompanha uma execução ao vivo (passos, portão de aprovação com diff, resultado); EvalDotGrid e EvalCaseCompare mostram uma suíte de avaliação caso a caso, com regressões e melhorias contra a versão-base.",
};

const limiterDiff = `--- /dev/null
+++ b/src/api/limite.ts
@@ -0,0 +1,12 @@
+import type { Middleware } from "./tipos";
+import { contador } from "../lib/contador";
+
+const JANELA = 60; // segundos
+const LIMITE = 60;
+
+export const limitarRequisicoes: Middleware = async (req, res, next) => {
+  const chave = \`limite:\${req.chaveApi ?? req.ip}\`;
+  const total = await contador.incrementar(chave, JANELA);
+  if (total > LIMITE) return res.status(429).json({ erro: "Muitas requisições" });
+  next();
+};
`;

const routesDiff = `--- a/src/api/rotas.ts
+++ b/src/api/rotas.ts
@@ -1,6 +1,7 @@
 import { Router } from "./roteador";
+import { limitarRequisicoes } from "./limite";
 import { pedidos } from "./pedidos";

 export const api = Router();
-api.use(autenticar);
+api.use(autenticar, limitarRequisicoes);
 api.use("/pedidos", pedidos);
`;

const change: RunChange = {
  id: "chg-1",
  title: "Revisar mudanças em 2 arquivos",
  summary: "Limitar a 60 requisições por minuto por chave de API e aplicar o limite antes de todas as rotas públicas.",
  files: [
    { path: "src/api/limite.ts", diff: limiterDiff },
    { path: "src/api/rotas.ts", diff: routesDiff },
  ],
};

const script: AgentRunScript = {
  steps: [
    { id: "p", kind: "plan", label: "Planejou a mudança", durationMs: 1200, detail: "Criar um middleware de limite por chave de API e registrá-lo antes das rotas. Testar com 61 requisições seguidas." },
    { id: "r1", kind: "read", label: "Leu src/api/rotas.ts", durationMs: 900 },
    { id: "s1", kind: "search", label: "Buscou middlewares de limite já existentes", durationMs: 1000, tool: { name: "codigo.buscar", input: { termo: "limite|throttle" }, output: { resultados: 0 } } },
    { id: "r2", kind: "read", label: "Leu src/lib/contador.ts", durationMs: 700 },
    { id: "e1", kind: "edit", label: "Escreveu o middleware e registrou nas rotas", durationMs: 1400 },
    { id: "t1", kind: "test", label: "Rodou os testes da API", durationMs: 2600, tool: { name: "terminal.executar", input: { comando: "npm test -- api" }, output: { passaram: 48, falharam: 0 } } },
    { id: "t2", kind: "test", label: "Conferiu o tipo e o lint", durationMs: 1500 },
  ],
  approvalAt: 5,
  approval: change,
  result: {
    summary: "Limite de 60 requisições por minuto ativo em todas as rotas públicas. Acima disso a API responde 429.",
    checks: [
      { label: "Testes da API", status: "passed", detail: "48 de 48" },
      { label: "Tipos e lint", status: "passed" },
    ],
    openLabel: "Abrir pull request", openIcon: <GitPullRequest />,
  },
};

// Suíte de exemplo: 3 categorias de 16 casos.
const marks: Record<string, Partial<Record<number, EvalCaseStatus>>> = {
  refund: { 3: "regression", 9: "fail", 12: "improved" },
  ship: { 5: "error", 14: "improved" },
  tone: { 1: "fail", 7: "regression", 10: "pending", 11: "pending", 12: "pending", 13: "pending", 14: "pending", 15: "pending" },
};
const labels: Record<string, string> = { refund: "Reembolso", ship: "Entrega", tone: "Tom" };
const baselines: Record<string, number> = { refund: 0.88, ship: 0.94, tone: 0.9 };
const categories: EvalCategory[] = Object.keys(labels).map((id) => ({
  id,
  label: labels[id],
  baseline: baselines[id],
  cases: Array.from({ length: 16 }, (_, i) => ({ id: `${id}-${i + 1}`, title: `${labels[id]} · caso ${i + 1}`, status: marks[id][i] ?? "pass" })),
}));

const detail: EvalCaseDetail = {
  id: "refund-4",
  title: "Pedido chegou quebrado, cliente quer o dinheiro de volta",
  category: "Reembolso",
  status: "regression",
  input: "“Meu pedido 88213 chegou com a tampa quebrada. Quero o reembolso, não outro produto.”",
  baseline: { label: "Base · v11", output: "Pediu uma foto, abriu o reembolso integral e informou o prazo de 5 dias úteis.", score: 1 },
  candidate: { label: "Candidata · v12", output: "Ofereceu a troca do produto e só mencionou reembolso se a troca não servir.", score: 0.5 },
  criteria: [
    { label: "Atendeu ao pedido explícito (reembolso)", baseline: true, candidate: false },
    { label: "Pediu evidência antes", baseline: true, candidate: true },
    { label: "Informou o prazo", baseline: true, candidate: false },
  ],
  judge: { name: "G4 Analítico", note: "A v12 prioriza troca mesmo quando a pessoa pediu reembolso." },
};

function RunDemo() {
  return <AgentRunCard title="Adicionar limite de requisições na API pública" agent="Agente de código" model="G4 Pro" script={script} onOpenResult={() => notify("Pull request #412 aberto")} />;
}

function EvalDemo() {
  const op = useOperation({ busyLabel: "Rodando…" });
  const [open, setOpen] = useState<string | undefined>("refund-4");
  return (
    <div className="flex min-w-0 flex-col gap-5 rounded-xl border border-line bg-surface p-4 sm:p-5">
      <EvalRunHeader
        title="Agente de atendimento"
        candidate={{ label: "v12", model: "G4 Pro" }}
        baseline={{ label: "v11", model: "G4 Rápido" }}
        judge="G4 Analítico"
        caseCount={48}
        score={0.854}
        baselineScore={0.833}
        history={[0.71, 0.74, 0.73, 0.78, 0.77, 0.8, 0.83, 0.854].map((score, i) => ({ label: `v${i + 5}`, score }))}
        cost={2.9}
        durationMs={180000}
        progress={{ done: 42, total: 48 }}
        action={
          <OperationButton operation={op} variant="ghost" onClick={() => void op.run(() => new Promise((r) => setTimeout(r, 1200)), "Suíte rodada · 41 de 48 casos passaram")}>
            <Play /> Rodar
          </OperationButton>
        }
      />
      <EvalDotGrid categories={categories} baselineLabel="v11" selectedId={open} onOpenCase={(c) => setOpen(c.id)} />
    </div>
  );
}

export default function Page() {
  const [decided, setDecided] = useState<string | null>(null);
  return (
    <DocPage title={meta.title} kicker="IA e interação" description={meta.description}>
      <DocSection title="AgentRunCard" rule="Passos chegam um a um; o agente para antes de escrever; ao concluir, os passos recolhem e o resultado aparece.">
        <Demo
          className="block"
          code={`// Modo demonstração: roteiro simulado (anda só com a aba visível)
<AgentRunCard title="Adicionar limite de requisições na API pública" agent="Agente de código" model="G4 Pro"
  script={{ steps, approvalAt: 5, approval: change, result }} onOpenResult={abrirPr} />

// Controlado: o seu backend manda o estado
<AgentRunCard title={tarefa} run={{ status: "waiting", elapsedMs, steps, approval: change }}
  onApprove={(c) => aplicar(c)} onReject={(c, motivo) => devolver(c, motivo)} />`}
        >
          <div className="max-w-[720px]">
            <RunDemo />
          </div>
        </Demo>
        <PropsTable
          rows={[
            ["title", "string", "—", "A tarefa como a pessoa pediu."],
            ["agent / model", "string", "—", "Nome do agente e do modelo (catálogo do app)."],
            ["run", "AgentRunState", "—", "Controlado: status (running | waiting | done | failed), elapsedMs, steps, approval, result, error."],
            ["script", "AgentRunScript", "—", "Modo demonstração: steps, approvalAt, approval e result."],
            ["autoPlay", "boolean", "true", "Anda sozinho. false (ou movimento reduzido) mostra cada parada pronta."],
            ["onApprove", "(change) => void", "—", "Aprovar e aplicar."],
            ["onReject", "(change, reason) => void", "—", "Devolver com comentário (motivo obrigatório)."],
            ["onOpenResult / onRestart", "() => void", "—", "Botões do resultado (Abrir pull request, Executar de novo)."],
          ]}
        />
      </DocSection>

      <DocSection title="Partes avulsas" rule="RunStepList, DiffApproval e RunResult servem fora do cartão: num painel lateral, num chat, numa página de execução.">
        <div className="grid gap-5 lg:grid-cols-2">
          <Demo title="RunStepList" code={`<RunStepList steps={[{ id: "1", kind: "read", label: "Leu src/api/rotas.ts", status: "done", durationMs: 900 }, …]} />`}>
            <RunStepList
              steps={[
                { id: "1", kind: "plan", label: "Planejou a mudança", status: "done", durationMs: 1200 },
                { id: "2", kind: "search", label: "Buscou middlewares de limite", status: "done", durationMs: 1000, tool: { name: "codigo.buscar", input: { termo: "limite" }, output: { resultados: 0 } } },
                { id: "3", kind: "test", label: "Rodando os testes da API", status: "running" },
              ]}
            />
          </Demo>
          <Demo title="RunResult" code={`<RunResult result={{ files, checks, openLabel: "Abrir pull request", openIcon: <GitPullRequest /> }} onOpen={abrir} onRestart={deNovo} />`}>
            <RunResult
              result={{ files: [{ path: "src/api/limite.ts", added: 12, removed: 0 }, { path: "src/api/rotas.ts", added: 2, removed: 1 }], checks: script.result.checks, openLabel: "Abrir pull request", openIcon: <GitPullRequest /> }}
              onOpen={() => notify("Pull request #412 aberto")}
              onRestart={() => notify("Execução enviada de novo")}
            />
          </Demo>
        </div>
        <Demo title="DiffApproval" code={`<DiffApproval change={{ id, title: "Revisar mudanças em 2 arquivos", summary, files: [{ path, diff }] }}\n  onApprove={aplicar} onReject={(c, motivo) => devolver(c, motivo)} />`}>
          {decided ? (
            <p className="m-0 text-[13px] text-ink-soft">
              {decided}{" "}
              <button type="button" className="font-medium text-ink underline underline-offset-2" onClick={() => setDecided(null)}>
                Mostrar de novo
              </button>
            </p>
          ) : (
            <DiffApproval change={change} onApprove={() => setDecided("Mudança aprovada e aplicada.")} onReject={(_, r) => setDecided(`Devolvida ao agente: “${r}”.`)} />
          )}
        </Demo>
      </DocSection>

      <DocSection title="Suíte de avaliação" rule="Um ponto por caso, com forma além da cor; a barra mostra o score contra a marca da versão-base; filtros levam às regressões.">
        <Demo
          className="block"
          code={`<EvalRunHeader title="Agente de atendimento" candidate={{ label: "v12", model: "G4 Pro" }} baseline={{ label: "v11" }}
  judge="G4 Analítico" caseCount={48} score={0.854} baselineScore={0.833} history={ultimas8}
  cost={2.9} durationMs={180000} action={<OperationButton operation={op} onClick={rodar}>Rodar</OperationButton>} />
<EvalDotGrid categories={[{ id: "refund", label: "Reembolso", baseline: 0.88, cases: [{ id, title, status: "regression" }, …] }]}
  baselineLabel="v11" onOpenCase={(c) => abrir(c.id)} />`}
        >
          <EvalDemo />
        </Demo>
        <Demo className="block" title="EvalCaseCompare" code={`<EvalCaseCompare evalCase={{ title, status: "regression", input, baseline: { label: "Base · v11", output, score: 1 },\n  candidate: { label: "Candidata · v12", output, score: 0.5 }, criteria, judge }} onAccept={aceitar} onOpenIssue={abrirChamado} />`}>
          <div className="max-w-[720px]">
            <EvalCaseCompare evalCase={detail} onAccept={() => notify("Saída da v12 aceita como esperada")} onOpenIssue={() => notify("Chamado AG-1184 aberto")} />
          </div>
        </Demo>
        <PropsTable
          rows={[
            ["EvalDotGrid.categories", "EvalCategory[]", "—", "Categorias com label, baseline (fração) e cases ({ id, title, status })."],
            ["status", "pass | fail | error | regression | improved | pending", "—", "Quadrado cheio, ×, !, × com contorno, ▲, vazio."],
            ["filter / onFilterChange", "all | failed | regressions | improved", "all", "Recorte (controlado opcional); o resto esmaece."],
            ["onOpenCase", "(case, category) => void", "—", "Clique ou Enter num ponto. Setas percorrem a grade."],
            ["EvalRunHeader.score", "number | null", "—", "Score da candidata; null = ainda não rodou. progress mostra casos já chegados."],
            ["EvalCaseCompare.evalCase", "EvalCaseDetail", "—", "Entrada, baseline e candidate (label, output, score), criteria (✓/× por versão), judge."],
          ]}
        />
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Pare para aprovação antes de qualquer escrita (arquivo, lançamento, e-mail), com o diff à vista e a opção de devolver com comentário.", dont: "Aplicar a mudança e pedir desculpas depois, ou aprovar sem mostrar o que muda." },
            { do: "Cor nunca sozinha nos resultados: cada estado tem forma (×, !, ▲, contorno) e palavra na legenda e no nome acessível.", dont: "Grade de quadradinhos verdes e vermelhos sem legenda." },
            { do: "Streaming só com a aba visível (useVisibleInterval); movimento reduzido mostra cada parada pronta, sem brilho.", dont: "Timer rodando em aba escondida ou brilho permanente em passo concluído." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
