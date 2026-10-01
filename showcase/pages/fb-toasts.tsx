import { Archive, Download } from "lucide-react";
import { Button, notify, notifyPromise } from "@g4os/ds";
import { CodeBlock, Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Toasts",
  group: "Feedback e estados",
  order: 10,
  description: "Confirmação de uma ação que acabou de terminar. Um por vez, some sozinho em 6,5 s, pausa no hover/foco e oferece Desfazer quando existe operação inversa segura.",
};

const wait = (ms: number, fail = false) => new Promise<{ linhas: number }>((ok, no) => setTimeout(() => (fail ? no(new Error("timeout")) : ok({ linhas: 1284 })), ms));

export default function Page() {
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <DocSection title="Tons" rule="`ok` (padrão) confirma; `info` informa algo que o sistema fez; `bad` avisa que a ação falhou e diz o que fazer. Clique para ver.">
        <Demo code={`notify("Negócio movido para Proposta");
notify("Lembrete criado para amanhã, 9h", undefined, "info");
notify("Não foi possível enviar o e-mail. Tente de novo.", undefined, "bad");`}>
          <Button variant="ghost" size="sm" onClick={() => notify("Negócio movido para Proposta")}>Sucesso</Button>
          <Button variant="ghost" size="sm" onClick={() => notify("Lembrete criado para amanhã, 9h", undefined, "info")}>Informação</Button>
          <Button variant="ghost" size="sm" onClick={() => notify("Não foi possível enviar o e-mail. Tente de novo.", undefined, "bad")}>Falha</Button>
        </Demo>
      </DocSection>

      <DocSection title="Desfazer" rule="Quando a ação tem inversa segura (arquivar, mover, remover de lista), prefira Desfazer a pedir confirmação antes.">
        <Demo code={`arquivar(candidato);
notify("Candidato arquivado", () => restaurar(candidato));`}>
          <Button size="sm" onClick={() => notify("3 candidatos arquivados", () => notify("Arquivamento desfeito", undefined, "info"))}>
            <Archive /> Arquivar 3 candidatos
          </Button>
        </Demo>
      </DocSection>

      <DocSection title="Operações demoradas: notifyPromise" rule="Para ações de segundo plano (exportar, importar, gerar relatório): mostra “…ando” enquanto roda e troca pelo resultado. Para salvar formulário, prefira OperationButton — quem informa é o botão.">
        <Demo
          code={`await notifyPromise(exportar(), {
  loading: "Exportando relatório…",
  success: (r) => \`Relatório exportado (\${r.linhas} linhas)\`,
  error: "Não foi possível exportar. Tente de novo.",
});`}
        >
          <Button
            size="sm"
            variant="ghost"
            onClick={() => notifyPromise(wait(1600), { loading: "Exportando relatório de vendas…", success: (r) => `Relatório exportado (${r.linhas.toLocaleString("pt-BR")} linhas)`, error: "Não foi possível exportar. Tente de novo." }).catch(() => undefined)}
          >
            <Download /> Exportar (sucesso)
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => notifyPromise(wait(1600, true), { loading: "Exportando relatório de vendas…", success: "Relatório exportado", error: "A exportação demorou demais. Tente com um período menor." }).catch(() => undefined)}
          >
            <Download /> Exportar (falha)
          </Button>
        </Demo>
      </DocSection>

      <DocSection title="Montagem" rule="O AppShell já monta o Toaster. Fora dele, monte uma vez perto da raiz. `notify` funciona de qualquer lugar (não precisa de contexto React).">
        <CodeBlock code={`import { Toaster, notify } from "@g4os/ds";

// raiz do app (se não usar AppShell)
<Toaster duration={6500} />

// qualquer lugar, depois que a ação terminou
notify("Proposta enviada para Ana Lima");`} />
        <PropsTable
          rows={[
            ["notify(message, undo?, tone?)", "(string, () => void, \"ok\" | \"info\" | \"bad\")", 'tone="ok"', "Dispara o toast. Substitui o anterior."],
            ["notifyPromise(promise, messages)", "{ loading, success, error, undo? }", "—", "Acompanha a promessa. Retorna o valor; relança o erro."],
            ["Toaster.duration", "number", "6500", "Milissegundos até sumir (pausa no hover/foco)."],
          ]}
        />
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Verbo no passado + objeto: “Fatura 0231 enviada”.", dont: "“Sucesso!”, “Operação realizada”, “OK”." },
            { do: "Disparar depois que a ação TERMINOU no servidor.", dont: "Toast no clique, antes de saber se deu certo." },
            { do: "Erro no toast só para ação de segundo plano. Erro de formulário fica no formulário.", dont: "Usar toast para validação de campo ou aviso que precisa ficar." },
            { do: "Desfazer quando existe operação inversa segura.", dont: "Desfazer em ação que já disparou e-mail ou cobrança." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
