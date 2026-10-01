---
"@g4ai/ds": patch
---

Correções da varredura de acessibilidade e layout (`npm run qa:sweep`):

- `CommandMenu`: a lista só é `listbox` quando tem itens, o separador é decorativo (`role="none"`) e o campo de busca mostra foco no contêiner.
- `Menu`: o anel de foco do gatilho vence `!ring-0`/`!ring-1` passados em `triggerClassName`.
- `KanbanBoard`: região rolável focável (`label`, padrão "Quadro"); abas de escopo do `SearchPalette` entram no Tab e trocam com as setas.
- `AttachmentActions` na vertical volta a ficar sobre a mídia (estava sendo empurrado para fora do card).
- `ResizableSplit`: nova opção `mobileLayout="stack"` (empilha os painéis abaixo de 768 px em vez de abrir o direito em tela cheia).
- Alvos de toque de 24 px ou mais: gerenciar ferramentas, voltar no construtor de filtros, cabeçalho ordenável da `DataTable`, grupo da `DataGrid`, etapas do rastro de execução.
- Links de ação em `ListPanel`, `Banner` e no canto dos campos (`corner`) ganham altura mínima de 24 px; título do card de conexão também.
- Bloco `ai-task-proposals`: sem opacidade nas propostas seguintes (o texto ficava abaixo de AA).
