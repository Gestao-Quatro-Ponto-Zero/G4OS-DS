# g4os

Arquivo: `src/components/g4os.tsx` · importe de `@g4ai/ds`.

Identidade G4 OS (KV G4 OS): a esfera, o logotipo, o gradiente de marca, o orb e os três pontos da IA.

## AiDots

Os três pontos da IA (navy, céu, gelo azul).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `className` | `string \| undefined` |  |  |
| `gap` | `number \| undefined` |  |  |
| `live` | `boolean \| undefined` | `true` |  |
| `size` | `number \| undefined` | `6` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## AiGreeting

Saudação da IA no tom do KV: três pontos, o nome no gradiente de marca e a pergunta em navy com a última palavra esmaecendo.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `align` | `"start" \| "center" \| undefined` | `"start"` |  |
| `className` | `string \| undefined` |  |  |
| `description` | `ReactNode` |  |  |
| `greeting` | `ReactNode` | `"Olá"` |  |
| `level` | `1 \| 2 \| undefined` | `1` | Nível do título: 1 na tela inicial, 2 quando a tela já tem um h1. |
| `name` | `ReactNode` |  |  |
| `question` | `string \| undefined` | `"qual decisão você precisa tomar hoje?"` |  |
| `size` | `"md" \| "lg" \| undefined` | `"lg"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## AiOrb

Orb: a esfera da IA desfocada atrás do conteúdo (saudação, capa, login).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `blur` | `number \| undefined` | `8` |  |
| `className` | `string \| undefined` |  |  |
| `live` | `boolean \| undefined` | `false` |  |
| `size` | `number \| undefined` | `420` |  |
| `style` | `CSSProperties \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## BrandHaze

Névoa quente do KV, atrás de momentos de marca claros.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `className` | `string \| undefined` |  |  |
| `size` | `number \| undefined` | `760` |  |
| `style` | `CSSProperties \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## G4OSLogo

Logotipo G4 OS: "G4" na tinta e "OS" fino no gradiente dourado → aço.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `className` | `string \| undefined` |  |  |
| `height` | `number \| undefined` | `24` |  |
| `symbol` | `boolean \| undefined` | `false` |  |
| `title` | `string \| undefined` | `"G4 OS"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## G4OSSymbol

Esfera G4 OS: o símbolo da IA.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `className` | `string \| undefined` |  |  |
| `live` | `boolean \| undefined` | `false` |  |
| `size` | `number \| undefined` | `32` |  |
| `title` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## GradientText

Texto no gradiente de marca do KV.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `as` | `ElementType \| undefined` |  |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.
