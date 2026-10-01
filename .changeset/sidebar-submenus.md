---
"@g4ai/ds": patch
---

Sidebar com subitens (submenus), no estilo dos blocos sidebar-03/sidebar-07 do shadcn:

- `NavItem.items` (até 2 níveis), `defaultOpen` e `actions` (⋯ por item). Item-pai sem página própria: `NavParentItem` (sem `href`, a linha inteira abre e fecha). Subitem ativo abre o pai sozinho; fechado, o pai soma os contadores. Teclado: Enter/Espaço, → e ←.
- Recolhida (`collapsed`): o ícone de um item com subitens abre um menu à direita (hover, clique, →), num portal. `IconRail` também aceita `items`.
- `NavGroup.collapsible`, `action` (+) e `limit` (“Mais N”).
- `Sidebar.header` (novo `WorkspaceMenu` com ⌘1…⌘9), `user.menu` (menu da conta; também `email` e `avatar`), `nav` (navegação livre), `storageKey` (lembra o que está aberto) e `onNavigate` (fecha a gaveta do celular).
- `SectionNav`: navegação longa só de texto (documentação, ajuda, configurações) com filtro e item ativo sempre visível.
- `BottomNav`/`AppShell.tabs` aceitam itens com subitens. Helpers `navMatches`, `navActiveDeep`, `navHref`.
- Novos blocos `app-sidebar-submenus` e `app-help-center`; o Nexo ERP (`erp-*`, `fin-*`) passa a usar subitens (Vendas, Cadastros com Produtos, Contas, Controladoria) numa sidebar só.
