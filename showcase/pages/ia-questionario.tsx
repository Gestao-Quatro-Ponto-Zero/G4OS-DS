import { useState } from "react";
import { Button, JsonView, Questionnaire, type QuestionnaireAnswers, type QuestionnaireQuestion } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Questionário",
  group: "IA e interação",
  order: 25,
  description: "Questionnaire faz uma pergunta por vez: o agente pedindo esclarecimentos antes de agir, uma pesquisa curta, uma triagem de lead ou de candidato. Escolha única, múltipla, resposta livre, perguntas puladas e condicionais.",
};

const perguntas: QuestionnaireQuestion[] = [
  {
    name: "publico",
    prompt: "Para quem é a campanha?",
    description: "O agente usa isso para escolher a lista e o tom da mensagem.",
    required: true,
    choices: [
      { value: "clientes", label: "Clientes ativos", description: "1.284 contas com contrato vigente" },
      { value: "leads", label: "Leads qualificados", description: "312 leads com score acima de 70" },
      { value: "inativos", label: "Clientes inativos", description: "Sem compra há mais de 6 meses" },
    ],
    input: { placeholder: "Descreva outro público" },
  },
  {
    name: "canais",
    prompt: "Quais canais posso usar?",
    multiple: true,
    required: true,
    choices: [
      { value: "email", label: "E-mail" },
      { value: "whatsapp", label: "WhatsApp" },
      { value: "linkedin", label: "LinkedIn" },
    ],
  },
  {
    name: "oferta",
    prompt: "Qual desconto posso oferecer aos inativos?",
    when: (a) => a.publico?.choices.includes("inativos") ?? false,
    choices: [
      { value: "10", label: "Até 10 %" },
      { value: "20", label: "Até 20 %" },
      { value: "nenhum", label: "Nenhum desconto" },
    ],
  },
  {
    name: "observacoes",
    prompt: "Algo mais que eu deva saber?",
    description: "Opcional. Ex.: evitar contas em negociação de renovação.",
    input: { multiline: true, placeholder: "Escreva aqui" },
  },
];

export default function Page() {
  const [resultado, setResultado] = useState<QuestionnaireAnswers | null>(null);
  const [key, setKey] = useState(0);
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <DocSection title="Esclarecimentos antes de agir" rule="Pergunte só o que muda o resultado, no máximo 4–5 perguntas. Opções com descrição concreta (números, exemplos). 1–9 marcam opções; Enter avança. A terceira pergunta só aparece se a pessoa escolher clientes inativos.">
        <Demo
          className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]"
          code={`<Questionnaire
  title="Antes de montar a campanha"
  items={[
    { name: "publico", prompt: "Para quem é a campanha?", required: true,
      choices: [{ value: "clientes", label: "Clientes ativos", description: "1.284 contas" }, …],
      input: { placeholder: "Descreva outro público" } },
    { name: "canais", prompt: "Quais canais posso usar?", multiple: true, required: true, choices: [...] },
    { name: "oferta", prompt: "Qual desconto…?", when: (a) => a.publico?.choices.includes("inativos") ?? false, choices: [...] },
    { name: "observacoes", prompt: "Algo mais que eu deva saber?", input: { multiline: true } },
  ]}
  submitLabel="Montar campanha"
  onSubmit={(respostas) => agente.continuar(respostas)}
/>`}
        >
          <Questionnaire key={key} title="Antes de montar a campanha" items={perguntas} submitLabel="Montar campanha" onSubmit={setResultado} onCancel={() => setResultado(null)} />
          <div className="min-w-0 space-y-3">
            <p className="m-0 text-[12.5px] font-medium text-ink">Respostas enviadas</p>
            {resultado ? <JsonView value={resultado} /> : <p className="m-0 text-[12.5px] text-muted">Responda e envie para ver o objeto que o agente recebe.</p>}
            {resultado && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setResultado(null);
                  setKey((k) => k + 1);
                }}
              >
                Recomeçar
              </Button>
            )}
          </div>
        </Demo>
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            { do: "Uma pergunta por tela, com a decisão que ela destrava clara no texto.", dont: "Questionário para cadastro com muitos campos: isso é formulário (FieldBlock + Drawer)." },
            { do: "Sem required, a pessoa pode pular; respostas puladas chegam como null.", dont: "Obrigar respostas que o agente consegue inferir dos dados." },
            { do: "Salve o rascunho com onChange e retome com defaultAnswers/defaultStep.", dont: "Perder respostas quando a pessoa fecha o painel." },
          ]}
        />
      </DocSection>

      <DocSection title="Props">
        <PropsTable
          rows={[
            ["items", "QuestionnaireQuestion[]", "—", "{ name, prompt, description?, choices?, multiple?, input?, required?, when? }."],
            ["onSubmit", "(answers) => void", "—", "Só perguntas visíveis; cada resposta { choices, text } ou null (pulada)."],
            ["onChange", "(answers, step) => void", "—", "Rascunho a cada mudança."],
            ["defaultAnswers / defaultStep", "QuestionnaireAnswers / number", "— / 0", "Retomar de onde parou."],
            ["title / submitLabel", "string", '"Perguntas" / "Enviar respostas"', "Textos do topo e do último botão."],
            ["shortcuts", "boolean", "true", "1–9 marcam opções (mostra a tecla)."],
            ["onCancel", "() => void", "—", "Mostra Cancelar na primeira pergunta."],
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
