# questionnaire

Arquivo: `src/components/questionnaire.tsx` · importe de `@g4ai/ds`.

Questionnaire: perguntas uma por vez (escolha, múltipla, livre, condicionais).

## Questionnaire

Perguntas uma por vez, com progresso, atalhos numéricos (1–9 marcam opções), Voltar/Pular/Próxima e perguntas condicionais.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `items` * | `QuestionnaireQuestion[]` |  |  |
| `onSubmit` * | `(answers: QuestionnaireAnswers) => void` |  |  |
| `className` | `string \| undefined` |  |  |
| `defaultAnswers` | `QuestionnaireAnswers \| undefined` |  |  |
| `defaultStep` | `number \| undefined` | `0` |  |
| `onCancel` | `(() => void) \| undefined` |  | Mostra "Cancelar" na primeira pergunta. |
| `onChange` | `((answers: QuestionnaireAnswers, step: number) => void) \| undefined` |  | Rascunho a cada mudança (para retomar depois). |
| `shortcuts` | `boolean \| undefined` | `true` |  |
| `submitLabel` | `string \| undefined` | `"Enviar respostas"` |  |
| `title` | `string \| undefined` |  | Título acima das perguntas ("Antes de começar"). |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-questionario`):

```tsx
<Questionnaire
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
/>
```

## QuestionnaireAnswer (type)

Resposta de uma pergunta; `null` = pulada.

```ts
type QuestionnaireAnswer = { choices: string[]; text: string } | null
```

## QuestionnaireAnswers (type)

```ts
type QuestionnaireAnswers = Record<string, QuestionnaireAnswer>
```

## QuestionnaireChoice (type)

```ts
type QuestionnaireChoice = { value: string; label: string; description?: string }
```

## QuestionnaireQuestion (type)

```ts
type QuestionnaireQuestion = { name: string; prompt: string; description?: string; choices?: QuestionnaireChoice[]; multiple?: boolean; input?: boolean | { placeholder?: string; multiline?: boolean; label?: string }; required?: boolean; when?: (answers: QuestionnaireAnswers) => boolean; }
```
