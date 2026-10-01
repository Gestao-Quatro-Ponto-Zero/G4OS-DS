import { Database, Sparkles } from "lucide-react";
import { useState } from "react";
import { AgentComposer, ComposerChip, notify } from "@g4os/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = { title: "Composer do agente", group: "IA e interação", order: 22, description: "Campo de tarefa com / comandos, + anexos (arquivo, dados do app, link), voz com forma de onda, seletor de agente, chips de contexto e Parar." };

export default function Page() {
  const [v, setV] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <DocPage title={meta.title} kicker="IA e interação" description={meta.description}>
      <DocSection title="Exemplo" rule="Digite / para ver os comandos. O microfone grava (simulado) e vira texto editável. Enviar deixa o botão como Parar por 3 s.">
        <Demo
          bare
          code={`<AgentComposer
  value={v} onChange={setV} busy={busy} onStop={parar}
  onSubmit={(texto) => enviar(texto)}
  commands={[{ id: "rel", label: "relatorio", description: "Gera um relatório" }, …]}
  agentChip={<ComposerChip icon={<Sparkles />} onClick={…}>Analista de receita</ComposerChip>}
  contextChips={<ComposerChip icon={<Database />} onRemove={…}>Negócios · setembro</ComposerChip>}
  onTranscribe={async (ms) => transcrever(audio)}
/>`}
        >
          <div className="max-w-[680px]">
            <AgentComposer
              value={v}
              onChange={setV}
              busy={busy}
              onStop={() => setBusy(false)}
              onSubmit={(t) => {
                setV("");
                setBusy(true);
                notify(`Tarefa enviada: “${t}”`, undefined, "info");
                setTimeout(() => setBusy(false), 3000);
              }}
              commands={[
                { id: "1", label: "relatorio", description: "Gera um relatório com achados e gráficos" },
                { id: "2", label: "planilha", description: "Monta uma planilha a partir dos dados" },
                { id: "3", label: "resumo", description: "Resume a conversa em 5 tópicos" },
              ]}
              agentChip={
                <ComposerChip icon={<Sparkles />} onClick={() => notify("Trocaria o agente", undefined, "info")}>
                  Analista de receita
                </ComposerChip>
              }
              contextChips={
                <ComposerChip icon={<Database />} onRemove={() => notify("Contexto removido", undefined, "info")}>
                  Negócios de PMEs · setembro
                </ComposerChip>
              }
              onTranscribe={() => "Compare com o mesmo mês de 2025"}
            />
          </div>
        </Demo>
        <PropsTable
          rows={[
            ["value / onChange / onSubmit", "string", "—", "Enter envia; Shift+Enter quebra linha."],
            ["busy / onStop", "boolean / () => void", "false", "Durante a execução o botão vira Parar."],
            ["commands", "{ id, label, description?, icon? }[]", "[]", "Menu que abre ao digitar “/”. ↑↓ Enter/Tab escolhem."],
            ["attachOptions", "MenuEntry[]", "arquivo · CRM · URL", "Itens do botão +."],
            ["agentChip / contextChips", "ReactNode", "—", "Seletor de agente/modelo e contexto fixado."],
            ["onTranscribe", "(ms) => string | Promise<string>", "—", "Recebe a gravação e devolve o texto (entra editável)."],
          ]}
        />
      </DocSection>
      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Voz vira texto EDITÁVEL antes de enviar.", dont: "Mandar a transcrição direto para o agente." },
            { do: "Mostre o contexto fixado como chip que dá para remover.", dont: "Contexto invisível que muda a resposta sem a pessoa saber." },
            { do: "Placeholder com a tarefa típica e a dica de “/”.", dont: "“Digite aqui…”." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
