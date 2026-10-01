# Tokens

Fonte da verdade: `src/styles/tokens.css`. Espelho em TypeScript (e-mail, PDF, canvas, testes): `src/tokens/index.ts` (`color` para o claro, `colorDark` para o escuro). `npm run check:tokens` falha se os dois divergirem. Tabela gerada do código: [`ai/tokens.md`](../../ai/tokens.md).

## Três camadas

```
1. PRIMITIVOS   --g4-gray-900, --g4-gold-500, …   paleta crua. Nunca em componente.
        ↓
2. SEMÂNTICOS   --ds-surface, --ds-primary, …     papéis. Trocam por tema e por marca.
        ↓
3. UTILITÁRIOS  bg-surface, text-on-primary, …    @theme inline do Tailwind v4 aponta para (2).
```

- **Componente** usa utilitário (`bg-surface`) ou, em SVG e `style`, `var(--color-surface)`.
- **Tema escuro** redefine a camada 2 em `[data-theme="dark"]`.
- **Marca de cliente** redefine uma parte da camada 2 em `[data-brand="x"]` (e `[data-brand="x"][data-theme="dark"]`).
- Ninguém fora de `tokens.css`/`themes.css` escreve hex. O `npx g4os-ds audit` acusa.

Por que `@theme inline`: os utilitários saem como `background-color: var(--ds-surface)`, não com o valor congelado. Por isso trocar a variável num seletor (`[data-theme]`, `[data-brand]` ou até um `<div style={{"--ds-primary": "#0b5cff"}}>`) muda tudo abaixo dele, inclusive `bg-primary/15` (o Tailwind gera `color-mix` com a variável).

## Semânticos

| Utilitário | Papel | Claro | Escuro |
| --- | --- | --- | --- |
| `page` | fundo da área de trabalho | `#ffffff` | `#111113` |
| `surface` | card, painel, tabela, campo | `#ffffff` | `#18181b` |
| `popover` | menu, popover, modal, toast | `#ffffff` | `#1f1f23` |
| `soft` | hover, cabeçalho de tabela, faixas | `#f8f8f9` | `#202024` |
| `rail` | sidebar | `#fbfbfc` | `#141416` |
| `ink` | texto principal | `#202124` | `#ececef` |
| `ink-soft` | texto secundário forte | `#484a50` | `#c5c6cc` |
| `muted` | metadado, rótulo, placeholder (**cor de texto**) | `#6b6e76` | `#8f929a` |
| `line` / `line-strong` | bordas / hover de borda | `#e9eaed` / `#d2d4da` | `#2a2a2f` / `#3b3c43` |
| `primary` / `on-primary` | ação principal e seleção / texto sobre ela | `#202124` / `#ffffff` | `#ececef` / `#121214` |
| `on-ink` | texto sobre `bg-ink`, `bg-rose`, `bg-ok`… | `#ffffff` | `#121214` |
| `navy` | superfície de marca (escura nos dois temas) | `#031a26` | `#0a2130` |
| `blue` | link, ação textual, "em andamento" | `#184560` | `#8cb8da` |
| `accent` / `accent-deep` / `accent-soft` | destaque: preenchimento / texto / fundo | `#b9915b` / `#8c6a3a` / `#f5eee3` | `#c9a46f` / `#dcbd8e` / `#2e2619` |
| `clay` / `clay-soft` | ênfase editorial | `#842e20` / `#f6e7e3` | `#e59a8a` / `#3a211c` |
| `ok`, `amber`, `rose`, `info` (+`-soft`) | estados | tons fortes / fundos claros | tons claros / fundos escuros |
| `chart-1…6`, `chart-grid` | séries e grade | ink, azul, dourado, clay, sálvia, cinza | versões claras |

Também são semânticos (sem utilitário de cor): `--ds-focus` (anel de foco), `--ds-backdrop`, `--ds-shadow-*` (sombras ficam mais densas no escuro), `--ds-radius-scale`, `--ds-font-sans`, `--ds-font-mono`.

### Qual usar

| Situação | Token |
| --- | --- |
| Card sobre a página | `bg-surface border border-line` |
| Menu/modal flutuando | `bg-popover shadow-popup` |
| Botão principal, aba/chip/linha selecionados, checkbox marcado | `bg-primary text-on-primary` |
| Selo escuro neutro (contador, tooltip, barra de ações em massa) | `bg-ink text-on-ink` |
| Botão destrutivo | `bg-rose text-on-ink` |
| Texto dourado | `text-accent-deep` (nunca `text-accent`) |
| Fundo de "próximo passo" | `bg-accent-soft border-accent/40` |
| Painel de marca (login, capa) | `bg-navy text-white` (única exceção de `text-white`) |

## Tipografia

Escala nomeada por papel (utilitário `text-<nome>`): `overline` 10 · `meta` 11 · `caption` 12 · `label` 12.5 · `control` 13 · `body` 13.5 · `input` 14 · `value` 15 · `section` 18 · `record` 20 · `metric` 22 · `title` 25. Valores arbitrários equivalentes (`text-[13.5px]`) são aceitos; a lista completa permitida está em [AGENTS.md](../../AGENTS.md#visual) e no `audit`. Detalhes: [tipografia.md](tipografia.md).

## Forma

`rounded-chip` 6 · `rounded-control` 8 · `rounded-tile` 10 · `rounded-card` 12 · `rounded-shell` 16, e os do Tailwind (`rounded-md/lg/xl/2xl` = 6/8/12/16). **Todos multiplicam por `--ds-radius-scale`**: `0.4` deixa a marca quase quadrada (ERP industrial), `1.3` deixa amigável (educação, consumo). Nada de raio em px solto.

## Camadas e tempo

Variáveis puras (sem utilitário): `--z-sticky` 20, `--z-nav` 40, `--z-toast` 80, `--z-modal` 95, `--z-popup` 100; `--duration-press` 100 ms, `--duration-state` 160, `--duration-panel` 220, `--duration-page` 280. Ver [movimento.md](movimento.md).

## Mudar um token

1. Edite o semântico em `tokens.css` (claro e escuro) — nunca o primitivo, a menos que a paleta mude.
2. Espelhe em `src/tokens/index.ts` (`color` e `colorDark`).
3. `npm run check` (tokens, tipos, `ai/`, auditoria).
4. Confira o showcase em claro e escuro e em duas marcas.
