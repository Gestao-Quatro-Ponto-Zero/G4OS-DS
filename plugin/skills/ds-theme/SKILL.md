---
name: ds-theme
description: Cria o tema de um cliente (white-label) e ajusta o modo escuro no G4OS-DS a partir de logo, cores ou manual de marca, com checagem de contraste WCAG. Use quando o usuário pedir "tema do cliente", "white-label", "cores da marca X", "aplicar a identidade do cliente", "modo escuro / dark mode", "trocar a fonte/os cantos". Triggers in English: "client brand theme", "white-label theme", "dark mode" for @g4ai/ds.
---

# Tema de cliente e modo escuro

Aplique antes a skill **g4os-ds** (localizar `DS`). Leia `DS/docs/fundamentos/temas-e-dark-mode.md` e a tabela de semânticos em `DS/ai/tokens.md`.

**Princípio**: marca muda só a camada semântica `--ds-*` (ação, destaque, links, raio, fonte e, em sistemas completos, superfícies). Nunca componente, nunca `--color-*`, nunca primitivos `--g4-*`. Estados (`ok`, `amber`, `rose`) não viram cor da marca.

## 1. Entrada

- **Hex / manual de marca**: pegue a cor de ação (botão principal) e a de destaque. Se o manual tiver só uma, use-a nas duas.
- **Logo (imagem/SVG)**: leia as cores dominantes; escolha a mais escura/saturada como ação e a mais viva como destaque. Confirme com o usuário se houver ambiguidade.
- **Fonte**: se o manual pedir, `--ds-font-sans` (e carregue a fonte no app). **Raio**: `--ds-radius-scale` (0.4 sóbrio/industrial · 1 padrão · 1.3 amigável).
- Nome da marca em minúsculas sem acento (`acme`).

## 2. Gerar com contraste garantido

```bash
node <caminho-desta-skill>/scripts/contrast.mjs derive --name acme --primary "#0b5cff" --accent "#ffb020" [--radius 1.15] [--font '"Inter", system-ui, sans-serif']
```

O script (mesma lógica de `deriveBrand`/`brandCss` de `@g4ai/ds`) escreve os blocos `[data-brand="acme"]` e `[data-brand="acme"][data-theme="dark"]` e imprime a tabela de contraste. Para conferir um CSS já existente:

```bash
node <caminho-desta-skill>/scripts/contrast.mjs check caminho/do/tema.css
```

Critérios (o script reprova se falhar): `on-primary`/`primary` ≥ 4,5 nos dois temas; `accent-deep`/`surface` ≥ 4,5; `primary`/`page` ≥ 3; `ink`/`page` ≥ 7 se a marca mexer em superfícies.

## 3. Aplicar

1. Cole o CSS no CSS global do app, **depois** de `@import "@g4ai/ds/styles.css"` (ou em `themes.css` se estiver trabalhando no próprio DS).
2. `<html data-brand="acme" data-theme="system">`. Para trocar em tempo de execução: `useTheme().setBrand("acme")`.
3. Se a marca precisar de ajuste no escuro do sistema operacional, repita o bloco escuro dentro de `@media (prefers-color-scheme: dark) { [data-brand="acme"][data-theme="system"] { … } }`.

## 4. Modo escuro sem marca

Se o pedido for só "ter dark mode": `data-theme="system"` no `<html>`, `themeScript` no `<head>`, `ThemeToggle` no rodapé da sidebar ou no menu da pessoa. Depois rode `npx g4os-ds audit src`: as regras `white-black`, `hex-color`, `tailwind-palette` e `hardcoded-dark` apontam tudo que não vai trocar no escuro.

## 5. Verificar

- Telas principais em claro e escuro com a marca (se houver dev server; no showcase do DS: `#/frame/<bloco>?theme=dark&brand=acme` depois de adicionar a marca ao `themes.css`).
- Botão principal não pode parecer destrutivo (marca vermelha: prefira ação escura e vermelho no destaque).
- Relate a tabela de contraste ao usuário.
