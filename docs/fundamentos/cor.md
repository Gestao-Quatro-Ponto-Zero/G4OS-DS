# Cor

Fonte: `src/styles/tokens.css` (CSS) e `src/tokens/index.ts` (TS, para canvas, PDF e e-mail). `npm run check:tokens` falha se os dois divergirem. A arquitetura (primitivos → semânticos → utilitários) está em [tokens.md](tokens.md); tema escuro e marcas em [temas-e-dark-mode.md](temas-e-dark-mode.md). Os hex abaixo são do **tema claro G4**: em componente use sempre o utilitário ou `var(--color-…)`, nunca o hex.

## A regra que decide 90 % dos casos

**A interface é superfície e gelo. Cor aparece só quando carrega significado, e sempre com uma palavra ao lado.** Vale igual no tema escuro.

- Fundo de trabalho: `bg-page`. Cards, painéis, tabelas e campos: `bg-surface`. Menus, modais e toasts: `bg-popover`. Nunca `bg-white`.
- Gelo (`bg-soft`, `bg-rail`) só delimita: sidebar, cabeçalho de tabela, hover, rodapé de drawer, moldura de `ListPanel`.
- Ação principal e seleção usam **`bg-primary text-on-primary`**: tinta no tema G4, a cor da marca num cliente com `data-brand`. Um botão dourado não existe (dourado é destaque, não ação).
- Texto sobre preenchimento forte (`bg-ink`, `bg-rose`, `bg-ok`) é `text-on-ink`, nunca `text-white` (no escuro esses fundos ficam claros).
- Separação de superfícies é feita por **borda de 1 px** (`border-line`), não por sombra nem por fundo colorido.

## Neutros

| Token | Hex | Uso |
| --- | --- | --- |
| `page` | `#ffffff` | fundo de trabalho |
| `surface` | `#ffffff` | card, painel, tabela, campo |
| `popover` | `#ffffff` | menu, popover, modal, toast |
| `soft` | `#f8f8f9` | hover, cabeçalho de tabela, faixas de rodapé, trilhas de progresso |
| `rail` | `#fbfbfc` | fundo da sidebar |
| `line` | `#e9eaed` | toda borda e divisória |
| `line-strong` | `#d2d4da` | hover de card, borda de checkbox, separador `›` |
| `muted` | `#63666e` | metadado, rótulo, placeholder (contraste AA sobre branco) |
| `ink-soft` | `#484a50` | texto secundário forte, ícone ativo |
| `ink` | `#202124` | texto principal, série 1 de gráfico |
| `primary` / `on-primary` | `#202124` / `#ffffff` | ação principal e seleção / texto sobre ela (troca com a marca) |
| `on-ink` | `#ffffff` | texto sobre `bg-ink`, `bg-rose`, `bg-ok`, `bg-amber` |

`muted` é **cor de texto**. Não use como fundo (`bg-muted` fica cinza-escuro). Fundo neutro é `bg-soft`.

## Marca e profundidade

| Token | Hex | Uso |
| --- | --- | --- |
| `navy` | `#031a26` | superfícies escuras de marca: painel de login, capa, hero |
| `blue` | `#184560` | link, ação textual, estado "em andamento", tom `info` em texto |
| `clay` / `clay-soft` | `#842e20` / `#f6e7e3` | ênfase editorial, identidade de conta |
| `accent` | `#b9915b` | **só preenchimento**: progresso de marca, moldura de próximo passo, destaque de série |
| `accent-deep` | `#7d5e33` | texto dourado (o `accent` não passa em contraste como texto) |
| `accent-soft` | `#f5eee3` | fundo de "próximo passo", seleção de texto |
| `founders` | `#441b1b` | legado; uso restrito a produtos do programa Founders |

O dourado é o único gesto de marca dentro do produto. Use pouco: se tudo é dourado, nada é.

## Semânticas

Cada tom tem a versão forte (texto, ícone, ponto) e a `-soft` (fundo).

| Tom | Forte | Suave | Significa |
| --- | --- | --- | --- |
| `ok` | `#1b5e20` | `#e8f5e9` | concluído, aprovado, dentro da meta, pago |
| `amber` (warn) | `#b54500` | `#fff3e0` | atenção, prazo próximo, abaixo do ritmo, parado |
| `rose` (bad) | `#b71c1c` | `#ffebee` | erro, bloqueado, atrasado, vencido, perdido |
| `info` | `#0d47a1` | `#e3f2fd` | informação neutra do sistema (novidade, dica) |

Nos componentes, esses tons chegam pelo tipo `Tone = "neutral" | "ok" | "warn" | "bad" | "info" | "accent"`. Prefira passar `tone` a pintar à mão.

Regras:

1. **Número bom não grita.** Em `Metric` e `KpiCard`, só `warn` e `bad` pintam o valor. Verde fica no delta, não no número.
2. **Badge neutro é o padrão.** Tom só quando o estado pede leitura ("Vencida", "Bloqueado"). Uma tabela com 20 badges verdes "Ativo" não comunica nada: mostre o ativo como texto e destaque a exceção.
3. **Cor nunca sozinha.** Ponto de status sempre com rótulo; `Dot` sem texto exige `label` (vira `aria-label`).
4. **Vermelho é para o que precisa de ação.** Não use `rose` para "negativo" neutro (ex.: variação de uma métrica que não é boa nem ruim → `goodWhen="neutral"`).

## Status de trabalho

Paleta fixa e ordenada para qualquer fluxo com etapas genéricas (tarefas, tickets, pedidos): `statusColor` (valores `var(--color-…)`, acompanham o tema), `statusOrder`, `statusLabel` em `src/components/status.tsx`.

| Chave | Cor | Rótulo padrão |
| --- | --- | --- |
| `queued` | `chart-6` (cinza) | Na fila |
| `active` | `blue` | Em curso |
| `review` | `accent` | Em revisão |
| `done` | `ok` | Concluído |
| `blocked` | `rose` | Bloqueado |

Os **rótulos são do produto** (troque "Concluído" por "Pago", "Contratado", "Resolvido"); cores e ordem são do sistema. Pipelines com etapas próprias (CRM, ATS) usam pontos neutros por etapa e tom só no desfecho (ganho = `ok`, perdido = `bad`). Ver [pipelines](../padroes/pipelines.md).

## Gráficos

Paleta própria `chart-1…6` e regras em [dados.md](dados.md).

## Superfícies escuras

`ai` e `graph` são fundos de canvas (grafo, painel de IA) e continuam escuros nos dois temas. O **tema escuro** do produto é outra coisa: `<html data-theme="dark">` troca todos os semânticos ([temas-e-dark-mode.md](temas-e-dark-mode.md)). Componentes não precisam de `dark:` se usarem tokens.

## Contraste garantido

- Texto nunca leva opacidade (`text-muted/80`, `opacity-70`): hierarquia é `ink` → `ink-soft` → `muted`.
- Texto sobre preenchimento que varia (heatmap, treemap, barra com rótulo): `data-fill` + `useReadableFills(ref)` escolhe `ink` ou `on-ink` pelo fundo real, no tema atual.
- Iniciais sobre `tint`: `tintFill(tint)` escurece o tint até AA com branco.
- Varredura: `npm run qa:sweep` (axe-core em claro e escuro) acusa qualquer par abaixo de 4,5:1.

## Nunca

- Opacidade em cor de texto (`text-muted/70`, `text-on-brand/60`): reprova contraste. Use o próximo degrau da escala.
- Hex solto em componente (`text-[#842e20]`, `style={{ color: "#..." }}`), `bg-white`, `text-white` fora de `bg-navy`, paleta do Tailwind (`gray-500`, `blue-600`). Use o token. Exceções documentadas: `tint` de `Avatar`/`EntityMark` (identidade do registro) e logos de terceiros.
- Gradiente decorativo, sombra colorida, fundo de página colorido.
- Azul "de link" genérico do navegador. Link é `text-blue` com sublinhado no hover, ou `text-ink` com seta.
