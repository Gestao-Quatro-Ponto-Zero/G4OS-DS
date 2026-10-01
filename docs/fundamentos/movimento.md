# Movimento

Movimento explica **de onde algo veio e para onde foi**. Não decora.

## Durações

| Variável | ms | Uso |
| --- | --- | --- |
| `--duration-press` | 100 | botão afundando, popup abrindo/fechando |
| `--duration-state` | 160 | hover, troca de aba, seleção, foco de campo |
| `--duration-toast` | 180 | toast entrando, backdrop |
| `--duration-panel` | 220 | drawer entrando, cabeçalho compactando |
| `--duration-page` | 280 | entrada de página (`enter`) |

Curvas: `ease` para estado; `--ease-panel` (`cubic-bezier(0.2, 0.8, 0.2, 1)`) para painéis que deslizam.

## Animações prontas

- `enter` / `animate-enter`: 4 px de baixo para cima + opacidade. Página, `BulkBar`, blocos que aparecem.
- `fade-in` / `animate-fade`: só opacidade. Backdrop, troca de conteúdo de aba.
- `drawer-enter` / `animate-drawer`: 24 px da direita. Drawer.
- Popups do Base UI usam `data-starting-style`/`data-ending-style` com escala 0,98 + opacidade.

## Regras

1. **Nada se move sozinho.** Sem animação contínua em listas, números ou gráficos (nada de contador "rolando", pulsação, shimmer infinito fora de skeleton).
2. **Gráficos não animam na entrada.** Transição só quando o dado muda (largura de barra, arco de anel: 300–500 ms).
3. **Arrastar mostra destino.** Coluna de kanban escurece a borda quando algo pode cair nela.
4. **Confirmações não se acumulam.** Um toast por vez por ação; o prazo pausa em hover/foco; "Desfazer" sempre que a ação for reversível.
5. **Movimento reduzido é respeitado.** `base.css` zera durações sob `prefers-reduced-motion: reduce`. Não force animação com `!important`.
6. Carregamento: skeleton com a forma do conteúdo (`Skeleton`), nunca spinner no meio da página para conteúdo previsível. Spinner só em botão ocupado e em operações sem forma conhecida.
