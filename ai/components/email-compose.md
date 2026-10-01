# email-compose

Arquivo: `src/components/email-compose.tsx` · importe de `@g4ai/ds`.

Escrever e-mail (com ou sem IA): remetente, destinatários com busca, assunto, corpo, modelo e envio com agendamento.

## ComposeEmail

Corpo do compositor (use dentro de Modal/Drawer ou numa página).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `body` * | `string` |  |  |
| `directory` * | `Person[]` |  |  |
| `from` * | `Person` |  |  |
| `onBodyChange` * | `(v: string) => void` |  |  |
| `onSend` * | `() => void` |  |  |
| `onSubjectChange` * | `(v: string) => void` |  |  |
| `onToChange` * | `(people: Person[]) => void` |  |  |
| `subject` * | `string` |  |  |
| `to` * | `Person[]` |  |  |
| `addOptions` | `MenuEntry[] \| undefined` |  | Menu do "+" (anexar arquivo, inserir modelo, pedir à IA…). |
| `className` | `string \| undefined` |  |  |
| `model` | `{ name: string; options?: MenuEntry[]; } \| undefined` |  | Modelo que escreveu o rascunho (chip no rodapé). |
| `notice` | `ReactNode` |  | Faixa opcional acima do corpo (ex.: aviso "Rascunho gerado pela IA a partir de…"). |
| `onClose` | `(() => void) \| undefined` |  |  |
| `sendOptions` | `MenuEntry[] \| undefined` | `[]` | Itens do menu ⌄ ao lado de Enviar (agendar, enviar amanhã às 8h…). |
| `status` | `ComposeStatus \| undefined` | `"draft"` |  |
| `suggestions` | `Person[] \| undefined` |  |  |
| `title` | `string \| undefined` | `"Escrever e-mail"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-email`):

```tsx
<ComposeEmail
  from={eu} to={para} onToChange={setPara} directory={pessoas} suggestions={frequentes}
  subject={assunto} onSubjectChange={setAssunto} body={corpo} onBodyChange={setCorpo}
  model={{ name: "Opus 4.5" }} status="draft"
  onSend={enviar} sendOptions={[{ label: "Agendar para amanhã, 08:00", onSelect: agendar }]}
/>
// Em modal: <ComposeEmailDialog open={aberto} onClose={fechar} … />
```

## ComposeEmailDialog

Compositor em modal (sobre a tela atual).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `body` * | `string` |  |  |
| `directory` * | `Person[]` |  |  |
| `from` * | `Person` |  |  |
| `onBodyChange` * | `(v: string) => void` |  |  |
| `onClose` * | `(() => void) & (() => void)` |  |  |
| `onSend` * | `() => void` |  |  |
| `onSubjectChange` * | `(v: string) => void` |  |  |
| `onToChange` * | `(people: Person[]) => void` |  |  |
| `open` * | `boolean` |  |  |
| `subject` * | `string` |  |  |
| `to` * | `Person[]` |  |  |
| `addOptions` | `MenuEntry[] \| undefined` |  | Menu do "+" (anexar arquivo, inserir modelo, pedir à IA…). |
| `className` | `string \| undefined` |  |  |
| `model` | `{ name: string; options?: MenuEntry[]; } \| undefined` |  | Modelo que escreveu o rascunho (chip no rodapé). |
| `notice` | `ReactNode` |  | Faixa opcional acima do corpo (ex.: aviso "Rascunho gerado pela IA a partir de…"). |
| `sendOptions` | `MenuEntry[] \| undefined` |  | Itens do menu ⌄ ao lado de Enviar (agendar, enviar amanhã às 8h…). |
| `status` | `ComposeStatus \| undefined` |  |  |
| `suggestions` | `Person[] \| undefined` |  |  |
| `title` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-email`):

```tsx
<ComposeEmail
  from={eu} to={para} onToChange={setPara} directory={pessoas} suggestions={frequentes}
  subject={assunto} onSubjectChange={setAssunto} body={corpo} onBodyChange={setCorpo}
  model={{ name: "Opus 4.5" }} status="draft"
  onSend={enviar} sendOptions={[{ label: "Agendar para amanhã, 08:00", onSelect: agendar }]}
/>
// Em modal: <ComposeEmailDialog open={aberto} onClose={fechar} … />
```

## ComposeStatus (type)

```ts
type ComposeStatus = "draft" | "sending" | "scheduled" | "sent"
```

## Person (type)

```ts
type Person = { id: string; name: string; email?: string; initials?: string; tint?: string; verified?: boolean; badge?: ReactNode }
```

## PersonChip

Pessoa como chip: avatar, nome, selo de verificado, remover opcional.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `person` * | `Person` |  |  |
| `className` | `string \| undefined` |  |  |
| `onRemove` | `(() => void) \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-email`):

```tsx
<PersonChip person={pessoa} onRemove={remover} />\n<SplitButton onClick={enviar} items={[{ label: "Agendar", onSelect }]}>Enviar</SplitButton>
```

## RecipientInput

Campo de destinatários: chips + digitação com sugestões em duas seções ("Selecionar pessoa" = e-mails que batem com o texto; "Sugestões" = pessoas frequentes).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `directory` * | `Person[]` |  |  |
| `onChange` * | `(people: Person[]) => void` |  |  |
| `value` * | `Person[]` |  |  |
| `className` | `string \| undefined` |  |  |
| `label` | `string \| undefined` | `"Para"` |  |
| `placeholder` | `string \| undefined` | `"Adicionar pessoa"` |  |
| `suggestions` | `Person[] \| undefined` | `[]` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-email`):

```tsx
<RecipientInput value={para} onChange={setPara} directory={pessoas} suggestions={frequentes} />
```

## SplitButton

Botão com ação principal + menu de alternativas (Enviar | ⌄ Agendar…).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `items` * | `MenuEntry[]` |  |  |
| `onClick` * | `() => void` |  |  |
| `className` | `string \| undefined` |  |  |
| `disabled` | `boolean \| undefined` |  |  |
| `menuLabel` | `string \| undefined` | `"Mais opções"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-email`):

```tsx
<PersonChip person={pessoa} onRemove={remover} />\n<SplitButton onClick={enviar} items={[{ label: "Agendar", onSelect }]}>Enviar</SplitButton>
```
