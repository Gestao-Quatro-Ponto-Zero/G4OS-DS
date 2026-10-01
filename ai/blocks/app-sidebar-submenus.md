# Sidebar com subitens

- Arquivo: `src/blocks/app-sidebar-submenus.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Aplicação
- Preview: showcase `#/frame/app-sidebar-submenus` (`?theme=dark` para o escuro)

Menu com subitens que abrem e fecham, grupo de projetos recolhível com “+”, ações por item e “Mais”, seletor de workspace no topo, menu da conta no rodapé e, recolhido, os subitens num menu flutuante à direita.

## Conceito

**Objetivo:** Navegar num app com muitas áreas sem passar de 10 itens visíveis: agrupar páginas irmãs sob um item-pai que abre e fecha.

**Padrões aplicados**

- Casca de app (AppShell + Sidebar) com grupos rotulados; anatomia de cada página: Painel ou Lista
- Item-pai com página própria (Vendas, Relatórios): o rótulo navega, a seta abre os subitens
- Item-pai sem página (Cadastros, Configurações): a linha inteira abre e fecha
- Subitem ativo abre o pai sozinho; o pai mostra que há um filho ativo
- Grupo Projetos recolhível, com “+” (novo projeto), ⋯ por item e “Mais” depois de 3
- Recolhido (botão ⇤): ícones; item com subitens abre um menu à direita (hover, clique ou →)
- Topo: WorkspaceMenu (⌘1…⌘9); rodapé: menu da conta

**Quando usar e o que adaptar**

- ERP: Cadastros → Clientes, Fornecedores, Produtos; Financeiro → A pagar, A receber
- CRM: Vendas → Negócios, Propostas, Metas; Projetos vira Carteiras ou Times
- Portal com várias empresas: WorkspaceMenu troca a empresa; o resto não muda

**Evite**

- Mais de 2 níveis abaixo do item (vire páginas com abas ou SectionNav)
- Mais de 7 subitens por item: divida em dois itens-pai
- Item-pai com verbo (“Gerenciar…”): o rótulo é um substantivo (área)
- Subitem que repete o pai (“Vendas → Vendas”): use “Visão geral” ou dê href ao pai

## Componentes usados

`AppShell`, `Button`, `Card`, `IconButton`, `MenuEntry`, `NavGroup`, `NavSubItem`, `Page`, `PageHeading`, `Sidebar`, `Workspace`, `WorkspaceMenu`, `navActiveDeep`, `notify`
