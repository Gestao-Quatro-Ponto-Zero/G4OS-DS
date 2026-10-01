# Acessibilidade

Meta: WCAG 2.2 AA. Os componentes já resolvem a maior parte; estas regras cobrem o que depende de quem monta a tela.

## Contraste

- Texto normal ≥ 4,5:1. `muted` (#6b6e76) é o cinza mais claro permitido para texto sobre branco.
- Dourado (`accent`) não passa como texto: use `accent-deep`.
- Texto sobre `-soft` usa a cor forte do mesmo tom (`text-amber` em `bg-amber-soft`).

## Teclado

- Tudo que clica, foca. Ordem de foco = ordem visual.
- Anel de foco: 2 px `muted` com 2 px de folga (global em `base.css`). **Nunca `outline: none` sem substituto.** Campos usam borda + halo.
- Linhas de tabela clicáveis abrem com Enter/Espaço; cards de kanban também.
- Gráficos: foco no gráfico + setas ←/→ percorrem os pontos; Esc limpa.
- Esc fecha popups, modais, drawers e o menu do celular.
- `AppShell` tem "Pular para o conteúdo".

## Nomes acessíveis

- `IconButton` exige `label`. Ícones decorativos `aria-hidden`.
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
- Alvos de toque ≥ 32 px (40 px preferível no celular).
- `lang="pt-BR"` no `<html>`.

## Checklist antes de publicar uma tela

- [ ] Navegar a tela inteira só com Tab/Shift+Tab/Enter/Esc.
- [ ] Ler com VoiceOver (⌘F5) o título, a primeira tabela e um formulário.
- [ ] Zoom 200 % em 1280 px sem rolagem horizontal da página.
- [ ] Nenhuma informação só por cor.
- [ ] Toda imagem com `alt` (ou `alt=""` se decorativa).
