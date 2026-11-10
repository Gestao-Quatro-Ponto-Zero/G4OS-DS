import { Play } from "lucide-react";
import { Button, CodeBlock, DiffView, notify } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Código e diff",
  group: "Mídia e conteúdo",
  order: 45,
  description: "CodeBlock para qualquer texto que a pessoa vai copiar (comando, consulta, resposta de um agente) e DiffView para mostrar o que mudou, linha a linha e palavra a palavra.",
  shadcn: false,
};

const sql = `-- Receita por plano nos últimos 30 dias
SELECT p.nome AS plano, COUNT(*) AS contas, SUM(f.valor) AS receita
FROM faturas f
JOIN planos p ON p.id = f.plano_id
WHERE f.paga_em >= CURRENT_DATE - 30
GROUP BY p.nome
ORDER BY receita DESC
LIMIT 10;`;

const ts = `import { formatCurrency, formatDelta } from "@g4ai/ds";

type Conta = { nome: string; mrr: number; anterior: number };

// Variação do MRR contra o mês anterior, pronta para a coluna da tabela.
export function variacao(conta: Conta) {
  const delta = (conta.mrr - conta.anterior) / conta.anterior;
  return {
    valor: formatCurrency(conta.mrr),
    delta: formatDelta(delta),
    queda: delta < -0.05,
  };
}`;

const email = `Olá, Marina.

Revisei a proposta da Acme Logística. O desconto de 12 % cabe na política para contratos de 24 meses, desde que o pagamento seja anual.

Posso enviar a versão final ainda hoje, se você confirmar o prazo de implantação.`;

const diff = `diff --git a/src/cobranca/regras.ts b/src/cobranca/regras.ts
--- a/src/cobranca/regras.ts
+++ b/src/cobranca/regras.ts
@@ -12,9 +12,10 @@ export function proximaCobranca(fatura: Fatura) {
   const hoje = new Date();
   const atraso = diasEntre(fatura.vencimento, hoje);
-  if (atraso > 5) return lembrete(fatura, "segundo aviso");
-  if (atraso > 0) return lembrete(fatura, "primeiro aviso");
+  if (atraso > 15) return suspender(fatura);
+  if (atraso > 7) return lembrete(fatura, "segundo aviso");
+  if (atraso > 2) return lembrete(fatura, "primeiro aviso");
   return null;
 }
diff --git a/src/cobranca/textos.ts b/src/cobranca/textos.ts
--- a/src/cobranca/textos.ts
+++ b/src/cobranca/textos.ts
@@ -3,5 +3,5 @@ export const textos = {
   primeiro: "Sua fatura venceu. Podemos ajudar?",
-  segundo: "Sua fatura está em atraso há 5 dias.",
+  segundo: "Sua fatura está em atraso há 7 dias.",
   suspensao: "O acesso foi suspenso até a regularização.",
 };`;

export default function Page() {
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <DocSection title="CodeBlock" rule="O cabeçalho diz o que é e copia o bloco inteiro. O corpo tem altura limitada e rolagem própria: um bloco de 300 linhas não empurra o resto da resposta. O realce é mínimo e sem dependência (comentário, texto, palavra-chave, número).">
        <div className="grid gap-4 lg:grid-cols-2">
          <Demo title="Consulta" className="block" bare code={`<CodeBlock language="sql" code={sql} />`}>
            <CodeBlock language="sql" code={sql} />
          </Demo>
          <Demo title="Comando de uma linha" className="block" bare code={`<CodeBlock language="bash" code="pnpm add @g4ai/ds" />`}>
            <div className="space-y-4">
              <CodeBlock language="bash" code="pnpm add @g4ai/ds @base-ui/react lucide-react" />
              <CodeBlock language="bash" title="Conferir a instalação" code="npx g4os-ds doctor" />
            </div>
          </Demo>
        </div>
        <Demo
          title="Arquivo, linhas numeradas e destaque"
          description="`title` troca a linguagem pelo nome do arquivo. `highlightLines` marca a mudança que o texto ao lado comenta; `actions` recebe o que se faz com o bloco."
          className="block"
          bare
          code={`<CodeBlock
  language="ts"
  title="src/contas/variacao.ts"
  lineNumbers
  highlightLines={[7, 8]}
  actions={<Button variant="ghost" size="sm">Executar</Button>}
  code={source}
/>`}
        >
          <CodeBlock
            language="ts"
            title="src/contas/variacao.ts"
            lineNumbers
            highlightLines={[7, 8]}
            code={ts}
            actions={
              <Button variant="ghost" size="sm" onClick={() => notify("Função executada: 3 contas em queda")}>
                <Play className="h-3.5 w-3.5" /> Executar
              </Button>
            }
          />
        </Demo>
        <Demo title="Texto para colar em outro lugar" description="Sem linguagem (ou `text`, `markdown`) o bloco usa a fonte da interface e quebra linha: é um rascunho de e-mail, não código." className="block" bare code={`<CodeBlock code={rascunho} />`}>
          <CodeBlock code={email} />
        </Demo>
        <Demo title="Bloco longo" description="Acima de `maxHeight` (360 px) o bloco rola por dentro e ganha “Mostrar tudo”." className="block" bare code={`<CodeBlock language="ts" lineNumbers code={longo} maxHeight={200} />`}>
          <CodeBlock language="ts" lineNumbers maxHeight={200} code={[ts, ts.replace("variacao", "projecao"), ts.replace("variacao", "meta")].join("\n\n")} />
        </Demo>
      </DocSection>

      <DocSection title="DiffView" rule="Recebe um diff unificado (o que sai do `git diff`). Mostra o arquivo, o saldo de linhas, os dois números de linha, e marca as palavras que mudaram dentro de uma linha reescrita. Verde e vermelho sempre vêm com + e −: a cor nunca informa sozinha.">
        <Demo className="block" bare code={`<DiffView diff={patch} />`}>
          <DiffView diff={diff} />
        </Demo>
      </DocSection>

      <DocSection title="Props">
        <PropsTable
          rows={[
            ["code", "string", "—", "CodeBlock: o texto. É também o que Copiar copia."],
            ["language", "string", '""', "Rótulo e realce: ts, sql, bash, json, py… Vazio = texto corrido."],
            ["title", "ReactNode", "—", "Nome do arquivo ou do passo, no lugar da linguagem."],
            ["lineNumbers", "boolean", "false", "Numera as linhas."],
            ["highlightLines", "number[]", "—", "Linhas em destaque (base 1)."],
            ["maxHeight", "number | false", "360", "Altura recolhida. `false` não limita."],
            ["actions", "ReactNode", "—", "Ações extras no cabeçalho, antes de Copiar."],
            ["children", "ReactNode", "—", "Conteúdo já realçado por outro realçador (shiki, prism)."],
            ["diff", "string", "—", "DiffView: diff unificado."],
          ]}
        />
      </DocSection>

      <Rules
        items={[
          { do: "Tudo que a pessoa vai copiar vai num CodeBlock, com o botão Copiar.", dont: "Código em <pre> solto, ou pedir para selecionar o texto à mão." },
          { do: "Mudança em arquivo, texto ou configuração: DiffView.", dont: "Dois blocos lado a lado para a pessoa achar a diferença." },
          { do: "Realce completo por gramática é opcional e do app: passe em `children`.", dont: "Trazer um realçador pesado para mostrar um comando de uma linha." },
        ]}
      />
    </DocPage>
  );
}
