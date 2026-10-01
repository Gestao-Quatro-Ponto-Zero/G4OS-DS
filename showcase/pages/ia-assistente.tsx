import { BarChart3, Building2, FileText, Mail, Sparkles, TrendingUp } from "lucide-react";
import { useState } from "react";
import {
  AiBadge,
  AskAILauncher,
  AskAIPanel,
  ChatComposer,
  ChatMessage,
  CitationChip,
  ComposerChip,
  PromptSuggestions,
  SourceList,
  ThinkingIndicator,
  ToolCallsSection,
  useStreamingText,
  type PromptSuggestion,
} from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";
import { sources, toolCalls } from "./_ia-data";

export const meta: PageMeta = {
  title: "Assistente (Ask AI)",
  group: "IA e interação",
  order: 10,
  description: "Painel de conversa com a IA: sugestões no estado vazio, mensagens com streaming, ferramentas usadas, fontes citadas e composer com anexos, modelo e contexto.",
};

const suggestions: PromptSuggestion[] = [
  { id: "1", label: "Resumir este negócio", description: "Histórico, riscos e próximo passo", icon: <FileText /> },
  { id: "2", label: "Rascunhar follow-up", description: "E-mail para a decisora", icon: <Mail /> },
  { id: "3", label: "Comparar com negócios ganhos", description: "Mesmo segmento, últimos 12 meses", icon: <BarChart3 /> },
  { id: "4", label: "Prever fechamento", description: "Chance e data provável", icon: <TrendingUp /> },
];

const answer =
  "O Grupo Aurora está em Negociação há 18 dias, com proposta de R$ 460,8 mil para 240 usuários. O jurídico pediu SLA de 99,9 % e a diretoria aprova até R$ 480 mil se a implantação ficar em 60 dias. Sugiro enviar o contrato com o SLA ajustado ainda esta semana.";

function StreamingDemo() {
  const [run, setRun] = useState(0);
  const { text, done } = useStreamingText(answer, { active: true });
  return (
    <div key={run} className="space-y-5">
      <ChatMessage role="user" content="Resuma o negócio com o Grupo Aurora e diga o próximo passo." time="14:02" />
      <ChatMessage
        role="assistant"
        time="14:02"
        streaming={!done}
        content={
          <p>
            {text}
            {done && (
              <>
                {" "}
                <CitationChip index={1} source={sources[0]} />
                <CitationChip index={2} source={sources[1]} />
              </>
            )}
          </p>
        }
        copyText={answer}
        onRetry={() => setRun((r) => r + 1)}
        onFeedback={() => undefined}
      >
        {done && (
          <>
            <ToolCallsSection calls={toolCalls} />
            <SourceList sources={sources} compact />
          </>
        )}
      </ChatMessage>
    </div>
  );
}

export default function Page() {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [panelMsgs, setPanelMsgs] = useState<string[]>([]);
  const [panelValue, setPanelValue] = useState("");
  return (
    <DocPage title={meta.title} kicker={meta.group} description={meta.description}>
      <DocSection title="Painel completo" rule="AskAIPanel é uma coluna (não modal): a tela ao lado continua usável. Mostra o contexto que a IA está olhando.">
        <Demo
          bare
          code={`<AskAIPanel
  title="Assistente de vendas"
  context="Negócio: Grupo Aurora · Licenças anuais"
  onClose={fechar}
  empty={<PromptSuggestions items={sugestoes} onSelect={(s) => enviar(s.label)} />}
  composer={<ChatComposer value={v} onChange={setV} onSubmit={enviar} busy={respondendo} onStop={parar} />}
>
  {mensagens.map((m) => <ChatMessage key={m.id} {...m} />)}
</AskAIPanel>`}
        >
          <div className="grid h-[560px] overflow-hidden rounded-xl border border-line md:grid-cols-[1fr_380px]">
            <div className="hidden bg-soft/50 p-6 md:block">
              <p className="m-0 text-[12px] text-muted">Tela do produto (continua usável)</p>
              <div className="mt-3 space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 rounded-lg border border-line bg-surface" />
                ))}
              </div>
            </div>
            <AskAIPanel
              className="border-l border-line"
              title="Assistente de vendas"
              context={
                <span className="inline-flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> Grupo Aurora · Licenças anuais
                </span>
              }
              onClose={() => setPanelMsgs([])}
              empty={
                <div>
                  <p className="m-0 text-[15px] font-semibold">Como posso ajudar?</p>
                  <p className="m-0 mb-4 mt-1 text-[12.5px] text-muted">Eu vejo este negócio, os contatos e os arquivos anexados.</p>
                  <PromptSuggestions items={suggestions} columns={1} onSelect={(s) => setPanelMsgs([s.label])} />
                </div>
              }
              composer={
                <ChatComposer
                  value={panelValue}
                  onChange={setPanelValue}
                  onSubmit={(v) => {
                    setPanelMsgs((m) => [...m, v]);
                    setPanelValue("");
                  }}
                  chips={<ComposerChip icon={<Sparkles />}>Rápido</ComposerChip>}
                  hint={null}
                />
              }
            >
              {panelMsgs.flatMap((m, i) => [
                <ChatMessage key={`u${i}`} role="user" content={m} />,
                <ChatMessage key={`a${i}`} role="assistant" content={<ThinkingIndicator label="Lendo o negócio" />} streaming />,
              ])}
            </AskAIPanel>
          </div>
        </Demo>
      </DocSection>

      <DocSection title="Mensagens com streaming" rule="Resposta chega aos poucos com cursor; ações (copiar, gerar de novo, avaliar) aparecem só ao terminar. Ferramentas e fontes ficam logo abaixo.">
        <Demo bare code={`<ChatMessage role="assistant" streaming={!pronto} content={texto} onRetry={refazer} onFeedback={avaliar}>\n  <ToolCallsSection calls={chamadas} />\n  <SourceList sources={fontes} compact />\n</ChatMessage>`}>
          <div className="rounded-xl border border-line bg-surface p-5">
            <StreamingDemo />
          </div>
        </Demo>
      </DocSection>

      <DocSection title="Composer" rule="Enter envia, Shift+Enter quebra linha. Durante a resposta, o botão vira Parar. Chips mostram modelo, fontes e contexto.">
        <Demo
          className="block"
          code={`<ChatComposer
  value={v} onChange={setV} onSubmit={enviar}
  busy={respondendo} onStop={parar}
  onAttach={anexar} attachments={anexos} onRemoveAttachment={remover}
  chips={<><ComposerChip icon={<Sparkles />} onClick={trocarModelo}>G4 Pro</ComposerChip><ComposerChip icon={<Database />}>CRM + Arquivos</ComposerChip></>}
/>`}
        >
          <ChatComposer
            value={value}
            onChange={setValue}
            onSubmit={() => {
              setBusy(true);
              window.setTimeout(() => setBusy(false), 2500);
              setValue("");
            }}
            busy={busy}
            onStop={() => setBusy(false)}
            onAttach={() => undefined}
            attachments={[{ id: "1", name: "Proposta v3.pdf", size: "412 KB" }]}
            onRemoveAttachment={() => undefined}
            chips={
              <>
                <ComposerChip icon={<Sparkles />} onClick={() => undefined}>
                  G4 Pro
                </ComposerChip>
                <ComposerChip icon={<FileText />}>CRM + Arquivos</ComposerChip>
              </>
            }
          />
        </Demo>
        <PropsTable
          rows={[
            ["value · onChange · onSubmit", "string · fn · fn", "—", "Controlado. onSubmit recebe o texto aparado."],
            ["busy · onStop", "boolean · fn", "false", "Enquanto responde, mostra Parar."],
            ["attachments · onAttach · onRemoveAttachment", "ComposerAttachment[] · fn · fn", "—", "Anexos em chips acima do campo."],
            ["chips", "ReactNode", "—", "ComposerChip de modelo, fontes, contexto."],
            ["hint", "ReactNode", "atalhos", "Linha de ajuda abaixo; null esconde."],
          ]}
        />
      </DocSection>

      <DocSection title="Peças menores">
        <Demo code={`<AiBadge /> <ThinkingIndicator startedAt={Date.now()} /> <AskAILauncher onClick={abrir} />`}>
          <AiBadge />
          <AiBadge label="Gerado por IA" />
          <ThinkingIndicator />
          <ThinkingIndicator label="Consultando o ERP" startedAt={Date.now() - 5000} />
          <AskAILauncher onClick={() => undefined} />
        </Demo>
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Estado vazio com 2–6 sugestões ligadas ao contexto da tela.", dont: "Caixa de texto vazia com “Pergunte qualquer coisa” e nada mais." },
            { do: "Contexto visível no cabeçalho (qual registro a IA está lendo).", dont: "IA que responde sobre dados que o usuário não sabe que ela viu." },
            { do: "Acompanhar o fim da conversa só se o usuário já está no fim (ChatThread faz isso).", dont: "Puxar a rolagem enquanto a pessoa lê uma resposta antiga." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
