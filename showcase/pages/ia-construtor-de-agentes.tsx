import { ListChecks } from "lucide-react";
import { useState } from "react";
import {
  AddPropertyMenu,
  AgentHeader,
  AgentInstructions,
  AppAccessList,
  BuilderSection,
  ChipPicker,
  KnowledgeFiles,
  PropertyRow,
  PublishBar,
  ToolGlyph,
  ToolToggleList,
  TriggerList,
  notify,
  type AgentStatus,
  type AppAccessItem,
  type KnowledgeUpload,
  type ToolToggleItem,
} from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Construtor de agentes",
  group: "IA e interação",
  order: 40,
  description: "A ficha de um agente em três seções fixas — Gatilhos (quando roda), Propriedades (com o que trabalha) e Instruções (o que faz) — com testar e publicar.",
};

/** Envio simulado: avança em passos; "falha" no nome do arquivo erra na primeira vez. */
const tried = new Set<string>();
const fakeUpload: KnowledgeUpload = (file, report, signal) =>
  new Promise((resolve, reject) => {
    let p = 0;
    let t = 0;
    const tick = () => {
      p += 25;
      if (/falha/i.test(file.name) && !tried.has(file.name) && p > 50) {
        tried.add(file.name);
        return reject(new Error("A conexão caiu durante o envio."));
      }
      report(Math.min(p, 100));
      if (p >= 100) return resolve();
      t = window.setTimeout(tick, 400);
    };
    t = window.setTimeout(tick, 300);
    signal.addEventListener("abort", () => window.clearTimeout(t));
  });

const initialTools: ToolToggleItem[] = [
  { id: "caixa", name: "Caixa de entrada", description: "Lê conversas e cria rascunhos de resposta", color: "var(--ds-tag-red-fg)", on: true },
  { id: "chat", name: "Chat da equipe", description: "Posta em #suporte-escalado", color: "var(--ds-tag-purple-fg)", on: true },
  { id: "tarefas", name: "Tarefas", description: "Cria e atualiza chamados de produto", color: "var(--ds-tag-blue-fg)", on: true },
  { id: "base", name: "Base de conhecimento", description: "Busca artigos da central de ajuda", color: "var(--ds-tag-gray-fg)", on: true },
  { id: "agenda", name: "Agenda", description: "Marca conversas com o time de vendas", color: "var(--ds-tag-green-fg)", on: false },
  { id: "cobranca", name: "Cobrança", description: "Consulta clientes, faturas e estornos", color: "var(--ds-tag-orange-fg)", on: true },
];

export default function Page() {
  const [status, setStatus] = useState<AgentStatus>("rascunho");
  const [tools, setTools] = useState([
    { id: "r", label: "Reddit", icon: <ToolGlyph name="Reddit" color="var(--ds-tag-orange-fg)" /> },
    { id: "f", label: "Firecrawl", icon: <ToolGlyph name="Firecrawl" color="var(--ds-tag-red-fg)" /> },
  ]);
  const [toolList, setToolList] = useState(initialTools);
  const [access, setAccess] = useState<AppAccessItem[]>([
    { id: "caixa", name: "Caixa de entrada", color: "var(--ds-tag-red-fg)", scope: "Ler conversas e criar rascunhos", connected: true, granted: true, required: true },
    { id: "chat", name: "Chat da equipe", color: "var(--ds-tag-purple-fg)", scope: "Postar no canal #suporte-escalado", connected: true, granted: false },
    { id: "cobranca", name: "Cobrança", color: "var(--ds-tag-orange-fg)", scope: "Consultar clientes e faturas (só leitura)", connected: false, granted: false },
  ]);
  const [limited, setLimited] = useState("<p>Você é o assistente de cobrança da equipe de suporte. Responda dúvidas sobre faturas, estornos e troca de plano com tom cordial e direto. Consulte o cliente na Cobrança antes de citar valores. Estornos acima de R$ 1.000 precisam de uma pessoa: escreva o rascunho e sinalize em #suporte-escalado.</p>");
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
      <DocSection title="Ferramentas ligadas" rule="Uma linha por app: marca, nome, o que o agente faz com ele e um `Switch`. O contador diz quantas estão ligadas. Em contêiner estreito vira uma coluna.">
        <Demo
          code={`<ToolToggleList
  tools={[{ id: "caixa", name: "Caixa de entrada", description: "Lê conversas e cria rascunhos", color: "var(--ds-tag-red-fg)", on: true }, …]}
  onToggle={(id, on) => setTools((t) => t.map((x) => (x.id === id ? { ...x, on } : x)))}
/>`}
        >
          <ToolToggleList tools={toolList} onToggle={(id, on) => setToolList((t) => t.map((x) => (x.id === id ? { ...x, on } : x)))} />
        </Demo>
        <PropsTable
          rows={[
            ["tools", "{ id, name, description, color?, icon?, on, disabled? }[]", "—", "description = o que o agente faz com o app, em linguagem simples"],
            ["onToggle", "(id, on) => void", "—", "Marque o agente como “alterado” ao ligar ou desligar"],
            ["showCount", "boolean", "true", "“5 de 6 ligadas” acima da grade"],
          ]}
        />
      </DocSection>
      <DocSection title="Conhecimento" rule="Arquivos que o agente consulta. Cada envio mostra progresso e pode ser cancelado; erro fica na linha com “Tentar de novo”. Experimente um arquivo com “falha” no nome.">
        <Demo
          code={`<KnowledgeFiles
  defaultFiles={[{ id: "1", name: "Política de reembolso 2026.pdf", size: 253_952 }]}
  onUpload={(file, report, signal) => api.upload(file, { onProgress: report, signal })}
  onChange={(prontos) => marcarAlterado()}
/>`}
        >
          <KnowledgeFiles
            defaultFiles={[
              { id: "1", name: "Política de reembolso 2026.pdf", size: 253_952 },
              { id: "2", name: "Planos e preços · outubro 2026.md", size: 18_400 },
            ]}
            onUpload={fakeUpload}
          />
        </Demo>
        <PropsTable
          rows={[
            ["onUpload", "(file, report, signal) => Promise<void>", "—", "report(0–100) durante o envio; rejeite com Error(mensagem) para erro; respeite signal (cancelar)"],
            ["defaultFiles", "{ id, name, size, status?, progress?, error?, meta? }[]", "[]", "Não controlado; onChange recebe só os prontos"],
            ["maxSize", "number (bytes)", "20 MB", "Maior que isso vira erro sem enviar"],
            ["accept / hint", "string / ReactNode", "pdf, docx, md, txt, csv, xlsx", "Tipos aceitos e texto da área de adicionar"],
          ]}
        />
      </DocSection>
      <DocSection title="Acesso app a app" rule="Antes de instalar ou publicar, peça acesso por app com o escopo em linguagem simples. App sem conta ligada mostra “Conectar”; conectado, um `Switch` concede o acesso.">
        <Demo
          code={`<AppAccessList
  apps={[{ id: "caixa", name: "Caixa de entrada", scope: "Ler conversas e criar rascunhos", connected: true, granted: true, required: true }, …]}
  onGrantChange={(id, granted) => …}
  onConnect={(id) => api.connect(id)} // Promise: mostra “Conectando…”
/>`}
        >
          <div className="w-full max-w-[520px]">
            <AppAccessList
              apps={access}
              onGrantChange={(id, granted) => setAccess((a) => a.map((x) => (x.id === id ? { ...x, granted } : x)))}
              onConnect={(id) => new Promise<void>((r) => window.setTimeout(r, 1000)).then(() => setAccess((a) => a.map((x) => (x.id === id ? { ...x, connected: true, granted: true } : x))))}
            />
          </div>
        </Demo>
      </DocSection>
      <DocSection title="Instruções com limite" rule="`maxLength` conta o texto sem marcações e mostra “357 / 2.000”; passou do limite, o contador fica em rosa e o leitor de tela é avisado.">
        <Demo code={`<AgentInstructions value={html} onChange={setHtml} maxLength={2000} />`}>
          <AgentInstructions value={limited} onChange={setLimited} maxLength={2000} />
        </Demo>
      </DocSection>
      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Sempre as três seções, nessa ordem: quando roda → com o que trabalha → o que faz.", dont: "Esconder gatilhos em configurações avançadas." },
            { do: "Testar antes de publicar; o teste aparece na conversa com RunSummary.", dont: "Publicar sem mostrar o que muda (“Publicar alterações”)." },
            { do: "Verificações de qualidade visíveis (ex.: revisão humana antes de enviar).", dont: "Agente que publica para fora sem aprovação." },
            { do: "Ferramenta com o que o agente faz nela (“Lê conversas e cria rascunhos”).", dont: "Lista de logos sem dizer o que cada um permite." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
