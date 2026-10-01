# lib-text

Arquivo: `src/lib/text.ts` · importe de `@g4ai/ds`.

Texto pt-BR: normalize (busca sem acento), plural, initials.

## initials (function)

Iniciais de um nome: "Ana Beatriz Lopes" → "AL".

```ts
initials(name): string
```

## normalize (function)

Normaliza para busca sem acento e sem caixa (pt-BR).

```ts
normalize(text): string
```

## plural (function)

"1 tarefa" / "3 tarefas".

```ts
plural(n, one, many?): string
```
