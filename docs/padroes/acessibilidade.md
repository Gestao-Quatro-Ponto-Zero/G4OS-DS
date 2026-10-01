# Acessibilidade

Meta: WCAG 2.2 AA. Os componentes já resolvem a maior parte; estas regras cobrem o que depende de quem monta a tela.

## Contraste

- Texto normal ≥ 4,5:1. `muted` (#63666e) é o cinza mais claro permitido para texto, e passa também sobre `soft`, seleção e `accent-soft`.
- **Sem opacidade em cor de texto.** `text-muted/80`, `text-rose/80`, `opacity-60` num rótulo derrubam o contraste abaixo de AA. A hierarquia vem de `ink` → `ink-soft` → `muted`, não de transparência.
- Dourado (`accent`) não passa como texto: use `accent-deep`. Laranja de alerta é `amber` (#b54500, AA no branco e no `amber-soft`).
- Texto sobre `-soft` usa a cor forte do mesmo tom (`text-amber` em `bg-amber-soft`).
- **Texto sobre preenchimento calculado** (heatmap, treemap, barra empilhada com rótulo): marque a célula com `data-fill` e chame `useReadableFills(ref)`; o DS mede o fundo resolvido no tema atual e escolhe `ink` ou `on-ink`. Rampas de intensidade pulam a faixa do meio (40–70 %), onde nenhum texto chega a 4,5:1.
- **Iniciais sobre `tint`** (avatar, agente, app): `tintFill(tint)` (em `lib/color`) escurece tints claros até 4,6:1 com o branco. `Avatar` já usa.

## Teclado

- Tudo que clica, foca. Ordem de foco = ordem visual.
- Anel de foco: 2 px `muted` com 2 px de folga (global em `base.css`). **Nunca `outline: none` sem substituto.** Campos usam borda + halo.
- Linhas de tabela clicáveis abrem com Enter/Espaço; cards de kanban também.
- Gráficos: foco no gráfico + setas ←/→ percorrem os pontos; Esc limpa.
- Esc fecha popups, modais, drawers e o menu do celular.
- `AppShell` tem "Pular para o conteúdo".

## Nomes acessíveis

- `IconButton` exige `label`. Ícones decorativos `aria-hidden`. `Button` só com ícone também precisa de `aria-label`.
- **Rótulo que some no celular vira `max-sm:sr-only`, nunca `hidden sm:inline`**: o botão continua com nome para o leitor de tela.
- `aria-label` só em elemento com papel (`button`, `a`, `role="img"`, `role="group"`, `role="region"`…). Em `<span>`/`<div>` sem `role` ele é ignorado: use `role="img"` (ícone, estrela, ponto) ou texto `sr-only`.
- Região que rola na horizontal sem nada focável dentro (código, tabela larga, heatmap) recebe `tabIndex={0}` + `role="region"` + `aria-label`, para rolar pelo teclado.
- `Dot` sem texto exige `label`. Cor nunca é a única pista.
- Gráficos recebem `label` (resumo em uma frase) e geram tabela `sr-only` com os valores.
- `Meter`, `GoalMeter`, `ProgressRing` são `role="progressbar"` com `aria-label` e valor.
- Contagens que mudam com filtro são `aria-live="polite"` (`TableToolbar`).
- Abas: `aria-current="page"` (links) ou `aria-pressed` (botões). Controle segmentado: `aria-pressed`.

## Formulários

- Rótulo visível e associado; erro com `aria-describedby` e `aria-invalid`.
- Não use placeholder como rótulo. Não desabilite envio para esconder erro.
- Grupos em `fieldset` + `legend`.

## Movimento e leitura

- `prefers-reduced-motion` zera animações (global).
- Zoom de 200 % sem perda: nada de altura fixa em texto; tabela vira blocos.
- Alvos de toque ≥ 24 px (WCAG 2.5.8); 32–40 px no celular para ações principais. Controle visualmente pequeno (checkbox de 20 px, remover etiqueta, ícone de 16 px) usa a classe `ds-hit`, que amplia a área clicável para 28 px sem mudar o desenho.
- `lang="pt-BR"` no `<html>`.

## Varredura automática (no repositório do DS)

`npm run showcase:build && npm run qa:sweep` visita todas as páginas e blocos do showcase em 1440 e 390 px, claro e escuro, e procura: rolagem horizontal, elemento cortado por ancestral (`overflow: hidden`), axe-core WCAG 2.1 AA (contraste, nomes, rótulos), erros de console, popup fora da tela, alvo de toque < 24 px e foco sem indicador. Relatório em `qa-report/sweep.md`, agrupado por causa (assinatura), não por ocorrência. Filtros: `--filter crm`, `--only blocks`, `--viewport 390`, `--theme dark`, `--checks axe,clipped`. Exemplos "Evite" propositalmente errados ficam num contêiner com `data-qa-ignore`.

## Checklist antes de publicar uma tela

- [ ] Navegar a tela inteira só com Tab/Shift+Tab/Enter/Esc.
- [ ] Ler com VoiceOver (⌘F5) o título, a primeira tabela e um formulário.
- [ ] Zoom 200 % em 1280 px sem rolagem horizontal da página.
- [ ] Nenhuma informação só por cor.
- [ ] Toda imagem com `alt` (ou `alt=""` se decorativa).
