# Superfícies: página, drawer, modal, popover

## Escolha

| Preciso de | Use | Não use |
| --- | --- | --- |
| Entidade com identidade própria (URL, abas, histórico) | **Página** | drawer gigante |
| Editar/criar sem perder a lista de origem; formulário médio/longo | **`Drawer`** (500 px, direita) | modal com rolagem |
| Decisão curta, 1–3 campos, prévia | **`Modal`** (`sm` 420, `md` 560, `lg` 760) | página nova |
| Ação destrutiva ou irreversível | **`ConfirmDialog`** | `window.confirm` |
| Ações secundárias de um item | **`ActionMenu`** (⋯) | fileira de botões |
| Explicação sob demanda ("por que esta cor?") | **`Popover`** | tooltip com parágrafo |
| Nome de um ícone, valor truncado | **Tooltip** / `title` | popover |
| Editar um campo | **inline** | drawer para um campo |
| Seleção de mais informações ao passar sobre pessoa/empresa | **HoverCard** (desktop) | — |

## Regras

1. **Um drawer nunca abre outro drawer.** A partir de um drawer, use modal ou navegue para a página do registro.
2. **Modal não empilha modal**, exceto `ConfirmDialog` sobre um modal/drawer.
3. Drawer com URL: abrir um registro em drawer atualiza a URL (`?contato=123`) para poder compartilhar e voltar.
4. **Fechar não perde dados.** Arrastar do conteúdo para o backdrop não fecha (o `Drawer` já trata); Esc e clique fora com alterações pendentes pedem confirmação.
5. Rodapé do drawer/modal: secundário (ghost) antes, primário por último, alinhados à direita. Fundo `bg-soft/35`.
6. Título do drawer = objeto ("Editar vaga"), `kicker` = contexto ("Engenharia · Vaga #214").
7. Popups (select, menu, combobox) usam portal e sempre ficam por cima (`--z-popup`), inclusive dentro de drawer (`<dialog>` nativo: o DS redireciona o portal para dentro do diálogo aberto).
8. No celular, drawer ocupa a largura toda; modal vira quase tela cheia com rolagem interna.

## Confirmação

- Título = pergunta com o objeto: "Excluir 3 faturas?"
- Descrição = consequência: "Elas saem dos relatórios de outubro. Esta ação não pode ser desfeita."
- Botão = verbo com objeto, `tone="danger"` quando destrói: "Excluir faturas".
- **Se é reversível, não confirme**: faça e ofereça "Desfazer" no toast.

## Cards

- `Card` estático: sem hover, sem cursor.
- `Card` com `href`/`onClick`: hover escurece borda e sobe a sombra.
- `LinkedCard`: um destino principal (título) + botões internos independentes.
- Card clicável não contém outro elemento clicável que leve ao mesmo lugar.
