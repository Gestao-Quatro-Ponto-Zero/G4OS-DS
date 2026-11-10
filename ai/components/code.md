# code

Arquivo: `src/components/code.tsx` · importe de `@g4ai/ds`.

------------------------------------------------------------------

## CodeBlock

Bloco de código ou de texto para copiar: diz o que é (linguagem ou nome do arquivo), copia o bloco inteiro e tem altura limitada com rolagem própria, para um bloco longo não empurrar o resto da página.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `code` * | `string` |  | O texto. É também o que o botão Copiar copia. |
| `actions` | `ReactNode` |  | Ações extras no cabeçalho, antes de Copiar ("Abrir no editor", "Executar"). |
| `children` | `ReactNode` |  | Conteúdo já realçado por outro realçador (shiki, prism). |
| `className` | `string \| undefined` |  |  |
| `copy` | `boolean \| undefined` | `true` |  |
| `highlightLines` | `number[] \| undefined` |  | Linhas em destaque (base 1): a mudança que a explicação ao lado comenta. |
| `language` | `string \| undefined` | `""` | Linguagem do bloco ("ts", "sql", "bash"…): vira o rótulo e liga o realce. |
| `lineNumbers` | `boolean \| undefined` | `false` | Numera as linhas. Para código que a pessoa vai citar ou comparar; não em comando de uma linha. |
| `maxHeight` | `number \| false \| undefined` | `360` | Altura máxima recolhido, em px. |
| `title` | `ReactNode` |  | Rótulo no lugar da linguagem: nome do arquivo (`src/lib/format.ts`) ou do passo ("Instalar"). |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/midia-codigo-e-diff`):

```tsx
<CodeBlock code={rascunho} />
```

## DiffView

Diff como quem revisa lê: o arquivo, quantas linhas entraram e saíram, cada linha com o número antigo e o novo, adicionadas em verde, removidas em vermelho (sempre com + e −, nunca só a cor) e as palavras que mudaram mar

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `diff` * | `string` |  |  |
| `className` | `string \| undefined` |  |  |
| `maxHeight` | `number \| false \| undefined` | `420` |  |
| `title` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/midia-codigo-e-diff`):

```tsx
<DiffView diff={patch} />
```
