import { ListChecks } from "lucide-react";
import { useState } from "react";
import { AddPropertyMenu, AgentHeader, AgentInstructions, BuilderSection, ChipPicker, PropertyRow, PublishBar, ToolGlyph, TriggerList, notify, type AgentStatus } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Construtor de agentes",
  group: "IA e interação",
  order: 40,
  description: "A ficha de um agente em três seções fixas — Gatilhos (quando roda), Propriedades (com o que trabalha) e Instruções (o que faz) — com testar e publicar.",
};

export default function Page() {
  const [status, setStatus] = useState<AgentStatus>("rascunho");
  const [tools, setTools] = useState([
    { id: "r", label: "Reddit", icon: <ToolGlyph name="Reddit" color="var(--ds-tag-orange-fg)" /> },
    { id: "f", label: "Firecrawl", icon: <ToolGlyph name="Firecrawl" color="var(--ds-tag-red-fg)" /> },
  ]);
  const [html, setHtml] = useState("<h2>Passos</h2><ol><li>Ingerir o novo post</li><li>Escrever um rascunho por rede</li></ol>");
  return (
    <DocPage title={meta.title} kicker="IA e interação" description={meta.description}>
      <DocSection title="Exemplo completo" rule="Veja o bloco “Construtor de agentes” (IA) para a tela inteira com a conversa ao lado.">
        <Demo
          bare
          code={`<PublishBar status={status} onTest={testar} onPublish={publicar} onShare={compartilhar} />
<AgentHeader icon={<Sparkles />} title={nome} onTitleChange={setNome} description={desc} onDescriptionChange={setDesc} />
<BuilderSection title="Gatilhos" action={<AddPropertyMenu items={opcoes} />}>
  <TriggerList triggers={gatilhos} rowMenu={(t) => [...]} />
</BuilderSection>
<BuilderSection title="Propriedades">
  <PropertyRow label="Ferramentas"><ChipPicker chips={ferramentas} onRemove={remover} addItems={menu} /></PropertyRow>
</BuilderSection>
<BuilderSection title="Instruções"><AgentInstructions value={html} onChange={setHtml} onEnhance={melhorar} /></BuilderSection>`}
        >
          <div className="space-y-6 rounded-2xl border border-line bg-surface p-6">
            <div className="flex justify-end">
              <PublishBar status={status} onShare={() => notify("Link copiado", undefined, "info")} onTest={() => notify("Teste iniciado", undefined, "info")} onPublish={() => setStatus("publicado")} />
            </div>
            <AgentHeader title="Criador automático de posts" description="Gera rascunhos para redes a partir de um artigo publicado." />
            <BuilderSection title="Gatilhos" description="Roda quando qualquer condição acontecer." action={<AddPropertyMenu items={[{ label: "Nova página no Notion", onSelect: () => notify("Gatilho adicionado") }]} />}>
              <TriggerList
                triggers={[{ id: "1", icon: <ToolGlyph name="Slack" color="var(--ds-tag-purple-fg)" />, label: "Qualquer mensagem em #blog-publicado" }]}
                rowMenu={() => [{ label: "Remover", tone: "danger", onSelect: () => notify("Removido") }]}
              />
            </BuilderSection>
            <BuilderSection title="Propriedades" description="Acesso a apps e ferramentas.">
              <PropertyRow label="Ferramentas">
                <ChipPicker chips={tools} onRemove={(id) => setTools((t) => t.filter((x) => x.id !== id))} addItems={[{ label: "LinkedIn", onSelect: () => setTools((t) => [...t, { id: `l${t.length}`, label: "LinkedIn", icon: <ToolGlyph name="LinkedIn" color="var(--ds-tag-blue-fg)" /> }]) }]} />
              </PropertyRow>
              <PropertyRow label="Verificações">
                <ChipPicker chips={[{ id: "t", label: "Tom da marca", icon: <ListChecks className="h-3.5 w-3.5 text-ok" /> }]} />
              </PropertyRow>
            </BuilderSection>
            <BuilderSection title="Instruções">
              <AgentInstructions value={html} onChange={setHtml} onEnhance={() => notify("Exemplo: a IA reescreveria as instruções", undefined, "info")} />
            </BuilderSection>
          </div>
        </Demo>
        <PropsTable
          rows={[
            ["PublishBar.status", '"rascunho" | "publicado" | "alterado"', "—", "Editar algo publicado deve virar “alterado”"],
            ["TriggerList.triggers", "{ id, icon, label }[]", "—", "rowMenu para editar/testar/remover"],
            ["ChipPicker", "chips, onRemove, addItems (MenuEntry[])", "—", "Menu aceita submenus (Saída ›, Skills ›)"],
            ["AgentInstructions", "value (HTML), onChange, onEnhance, enhancing", "—", "RichTextEditor com “Melhorar”"],
            ["ToolGlyph", "name, color, icon, size", "18", "Ícone de app quando não há logo"],
          ]}
        />
      </DocSection>
      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Sempre as três seções, nessa ordem: quando roda → com o que trabalha → o que faz.", dont: "Esconder gatilhos em configurações avançadas." },
            { do: "Testar antes de publicar; o teste aparece na conversa com RunSummary.", dont: "Publicar sem mostrar o que muda (“Publicar alterações”)." },
            { do: "Verificações de qualidade visíveis (ex.: revisão humana antes de enviar).", dont: "Agente que publica para fora sem aprovação." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
