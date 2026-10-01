# Responsivo

Breakpoints Tailwind: `sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280 (`tokens.breakpoints`).

## O que muda em cada faixa

| Elemento | < 640 | 640–767 | 768–1023 | ≥ 1024 |
| --- | --- | --- | --- | --- |
| Sidebar | drawer pelo botão ☰ na barra de 48 px | idem | fixa (224 / 64 px) | fixa |
| Margem lateral | 20 px | 28 px | 28 px | 40 px |
| h1 | 23 px | 25 px | 25 px | 25 px |
| `DataTable` | blocos rotulados | blocos | blocos | tabela |
| `SplitLayout` | empilha (lateral abaixo) | empilha | empilha | lado a lado |
| `KpiGrid` | 1 coluna | 2 | 2 | `cols` |
| `FieldGrid` | 1 coluna | 2 | 2 | 2 |
| Kanban | lista por etapa ou rolagem | rolagem horizontal | rolagem horizontal | rolagem horizontal |
| Drawer | largura total | largura total | 500 px | 500 px |
| Abas de entidade | rolagem horizontal ou seletor | idem | abas | abas |

## Regras

1. **Nunca rolagem horizontal da página.** Só dentro de áreas intencionais (kanban, tabela larga, abas, heatmap).
2. **Busca ocupa uma linha no celular**; filtros extras recolhem em "Filtros".
3. Ações do cabeçalho: no celular, o primário fica, os outros vão para o ⋯.
4. Formulário: uma coluna; rodapé com botões quebra linha em vez de encolher.
5. Lista + detalhe (inbox, conversas): até 1024 px, lista e detalhe são telas separadas.
6. Gráficos medem o contêiner (`ResizeObserver`); rótulos do eixo X se espaçam sozinhos. Não fixe largura em px.
7. Imagens e prévias com `aspect-ratio`, não altura fixa.

## Verificação

Confira toda tela em **1440 × 900, 1024 × 768, 390 × 844 e 320 px**. O showcase tem botões de largura (desktop/tablet/celular) em cada bloco. Captura headless:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --hide-scrollbars \
  --window-size=390,844 --screenshot=tela.png "http://localhost:4173/#/frame/crm-pipeline"
```
