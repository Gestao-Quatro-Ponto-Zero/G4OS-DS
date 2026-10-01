# Tipografia

Uma família: **Figtree** (Google Fonts, pesos 400, 500, 600, 700). Mono: `ui-monospace, "SF Mono", "JetBrains Mono"` só para código, IDs técnicos e chaves.

## Escala nomeada por papel

O nome diz **para que serve**, não o tamanho. Isso evita que cada tela invente um `text-[13px]` diferente. Cada nome vira utilitário Tailwind (`text-body`, `text-caption`…) com a altura de linha certa embutida.

| Token | px | Altura | Papel |
| --- | --- | --- | --- |
| `text-overline` | 10 | 1.4 | rótulo de grupo em CAIXA ALTA, `tracking-[0.1em]` |
| `text-meta` | 11 | 1.4 | contador, legenda de gráfico, data em chip, rótulo de célula no celular |
| `text-caption` | 12 | 1.5 | metadado, cabeçalho de tabela, aba, descrição curta, eixo de gráfico |
| `text-label` | 12.5 | 1.5 | rótulo de campo, item de sidebar, texto de controle |
| `text-control` | 13 | 1.45 | botão `sm`, chip, toast, breadcrumb, corpo compacto |
| `text-body` | 13.5 | 1.55 | **corpo padrão**, célula de tabela, botão `md`, item de menu |
| `text-input` | 14 | 1.5 | valor digitado, título de card, item de combobox |
| `text-value` | 15 | 1.6 | valor em campo de leitura (`Field`) |
| `text-section` | 18 | 1.35 | título de área (h2), título de modal |
| `text-record` | 20 | 1.3 | título de drawer, nome no cabeçalho de registro |
| `text-metric` | 22 | 1.2 | número de indicador |
| `text-title` | 25 | 1.3 | h1 de página (23 px abaixo de 640 px) |

`KpiCard` usa 24 px (`md`) e 30 px (`lg`) para o número de topo de dashboard; é o único lugar acima de 25 px dentro do app. Páginas de marketing e login podem ir além.

## Pesos

- **400** corpo e metadado.
- **500** ênfase: título de card, nome em linha de tabela, rótulo ativo, botão.
- **600** títulos (h1, h2, modal, drawer) e números (KPIs, totais).
- **700** quase nunca; só em marca e em números de hero.

Negrito no meio de parágrafo para destacar palavra: use 500, não 700.

## Tracking

- `tracking-tightest` (−0.035em): h1 de página.
- `tracking-title` (−0.025em) / `tracking-tight`: h2, título de registro, números grandes.
- `tracking-overline` (0.1em): CAIXA ALTA de grupo. Único lugar com tracking positivo.

## Números

- Toda coluna, KPI, eixo e total usa `tabular-nums`: os dígitos alinham e não "dançam" ao atualizar.
- Formate com `src/lib/format.ts` (`formatCurrency`, `formatNumber`, `formatPercent`, `formatDelta`, `formatCompact`, `formatDate`, `formatRelative`). Nada de `toFixed` ou concatenar `"R$ "`.
- Valores monetários alinham à direita na tabela (`align: "right"` na `Column`).
- Sinal de menos em variação é o tipográfico (`−`), já feito por `formatDelta`.

## Leitura

- Linha de leitura máxima: `--reading-max` (620 px). Descrições de página, textos de ajuda e formulários longos (`ReadingColumn`).
- `text-wrap: balance` em títulos e `pretty` em parágrafos já vêm do `base.css` dentro de `main` e `[data-ds-content]`.
- Parágrafo de interface: 13–13.5 px, `leading-relaxed`, `text-muted` quando é explicação e `text-ink` quando é conteúdo.

## Hierarquia de uma tela típica

```
Kicker 11px muted (opcional: data, categoria)
Título da página 25/600 tight            [ações à direita]
Descrição 13.5 muted, máx. 620px (some quando o cabeçalho gruda)

Seção 14/500 ────────────────────────── ação 12.5 muted
  Card: título 14/500, meta 12 muted, corpo 13.5
  Tabela: cabeçalho 12 muted em gelo, linhas 13.5
```

## Nunca

- Tamanho fora da escala (`text-[15.5px]`). Se precisar de um novo papel, proponha um token.
- CAIXA ALTA em frase, botão ou título. Só em `overline`.
- Itálico para ênfase. Itálico só em citação.
- Texto centralizado em conteúdo de trabalho (tabelas, formulários, cards). Centralize só estados vazios e telas de autenticação.
