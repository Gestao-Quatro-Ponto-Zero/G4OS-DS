# collab

Arquivo: `src/components/collab.tsx` · importe de `@g4ai/ds`.

Colaboração entre pessoas (não com a IA): conversa do time ao lado de um documento.

## ActionRequiredBanner

Faixa de ação obrigatória (ex.: "Envie o documento obrigatório") com botão tracejado que também aceita arrastar e soltar.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `onFiles` * | `(files: File[]) => void` |  |  |
| `title` * | `string` |  |  |
| `accept` | `string \| undefined` |  |  |
| `actionLabel` | `string \| undefined` | `"Enviar"` |  |
| `className` | `string \| undefined` |  |  |
| `description` | `ReactNode` |  |  |
| `done` | `string \| undefined` |  | Texto de confirmação depois de resolvido (ex.: "contrato.pdf enviado"). |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/colaboracao-e-documento`):

```tsx
<DateSeparator>12 mar</DateSeparator>
<TeamMessage author={rafael} time="11:04">Vou revisar a seção de segurança.</TeamMessage>
<TeamMessage author={eu} time="11:05" mine>Combinado.</TeamMessage>
<TypingIndicator name="Rafael" />
<ActionRequiredBanner title="Envie o RIPD assinado" onFiles={(f) => enviar(f)} done={enviado} />
<TeamComposer value={texto} onChange={setTexto} onSend={enviar} onAttach={anexar} />
```

## DateSeparator

Separador de data no meio da conversa.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/colaboracao-e-documento`):

```tsx
<DateSeparator>12 mar</DateSeparator>
<TeamMessage author={rafael} time="11:04">Vou revisar a seção de segurança.</TeamMessage>
<TeamMessage author={eu} time="11:05" mine>Combinado.</TeamMessage>
<TypingIndicator name="Rafael" />
<ActionRequiredBanner title="Envie o RIPD assinado" onFiles={(f) => enviar(f)} done={enviado} />
<TeamComposer value={texto} onChange={setTexto} onSend={enviar} onAttach={anexar} />
```

## ReadingDocument

Documento em tipografia de leitura (serifa editorial --ds-font-reading, medida ~68 caracteres).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `kicker` | `ReactNode` |  |  |
| `title` | `string \| undefined` |  |  |
| `toc` | `boolean \| undefined` | `true` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/colaboracao-e-documento`):

```tsx
<ReadingDocument kicker="Política interna" title="Adequação à LGPD">\n  <h2>O que é a LGPD</h2><p>…</p>\n</ReadingDocument>
```

## TeamComposer

Campo de mensagem do time: texto, imagem, anexo, "Enviar" (Enter envia; Shift+Enter quebra linha).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `onChange` * | `(v: string) => void` |  |  |
| `onSend` * | `(v: string) => void` |  |  |
| `value` * | `string` |  |  |
| `className` | `string \| undefined` |  |  |
| `onAttach` | `((files: File[], kind: "imagem" \| "arquivo") => void) \| undefined` |  |  |
| `placeholder` | `string \| undefined` | `"Escreva uma mensagem"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/colaboracao-e-documento`):

```tsx
<DateSeparator>12 mar</DateSeparator>
<TeamMessage author={rafael} time="11:04">Vou revisar a seção de segurança.</TeamMessage>
<TeamMessage author={eu} time="11:05" mine>Combinado.</TeamMessage>
<TypingIndicator name="Rafael" />
<ActionRequiredBanner title="Envie o RIPD assinado" onFiles={(f) => enviar(f)} done={enviado} />
<TeamComposer value={texto} onChange={setTexto} onSend={enviar} onAttach={anexar} />
```

## TeamMessage

Mensagem de uma pessoa: avatar, nome, hora e texto.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `author` * | `Author` |  |  |
| `children` * | `ReactNode` |  |  |
| `time` * | `string` |  |  |
| `className` | `string \| undefined` |  |  |
| `mine` | `boolean \| undefined` | `false` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/colaboracao-e-documento`):

```tsx
<DateSeparator>12 mar</DateSeparator>
<TeamMessage author={rafael} time="11:04">Vou revisar a seção de segurança.</TeamMessage>
<TeamMessage author={eu} time="11:05" mine>Combinado.</TeamMessage>
<TypingIndicator name="Rafael" />
<ActionRequiredBanner title="Envie o RIPD assinado" onFiles={(f) => enviar(f)} done={enviado} />
<TeamComposer value={texto} onChange={setTexto} onSend={enviar} onAttach={anexar} />
```

## TypingIndicator

"• • •" de alguém digitando.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `className` | `string \| undefined` |  |  |
| `name` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/colaboracao-e-documento`):

```tsx
<DateSeparator>12 mar</DateSeparator>
<TeamMessage author={rafael} time="11:04">Vou revisar a seção de segurança.</TeamMessage>
<TeamMessage author={eu} time="11:05" mine>Combinado.</TeamMessage>
<TypingIndicator name="Rafael" />
<ActionRequiredBanner title="Envie o RIPD assinado" onFiles={(f) => enviar(f)} done={enviado} />
<TeamComposer value={texto} onChange={setTexto} onSend={enviar} onAttach={anexar} />
```
