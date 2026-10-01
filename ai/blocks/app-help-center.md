# Central de ajuda (navegação de seções)

- Arquivo: `src/blocks/app-help-center.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Aplicação
- Preview: showcase `#/frame/app-help-center` (`?theme=dark` para o escuro)

Documentação com muitas páginas: SectionNav na sidebar com seções, subitens na linha-guia, terceiro nível em Relatórios e API, filtro fixo no topo, item ativo sempre visível e anterior/próximo no fim do artigo.

## Conceito

**Objetivo:** Achar e ler um artigo entre dezenas sem perder o lugar na árvore de seções.

**Padrões aplicados**

- Anatomia Público/leitura: Page width="reading" com artigo; navegação longa na Sidebar via `nav={<SectionNav/>}`
- SectionNav: só texto, títulos de seção, subitens na linha-guia, até 2 níveis abaixo da seção
- Filtro no topo (sem acento, sem caixa) que mantém o caminho até o item encontrado
- Item ativo rola para dentro da coluna (só a coluna, não a página)
- Anterior/próximo no pé do artigo seguindo a ordem da árvore

**Quando usar e o que adaptar**

- Central de ajuda do produto, base de conhecimento interna, manual de processos
- Configurações com 20+ páginas (Conta, Equipe, Segurança, Faturamento, Integrações…)

**Evite**

- Ícone em cada item: em navegação longa, ícone vira ruído
- Mais de 3 níveis: quebre em seções ou páginas com abas
- Sidebar de app (com ícones) para documentação com 30 itens: use SectionNav

## Componentes usados

`AppShell`, `Callout`, `IconButton`, `NavSection`, `NavSubItem`, `Page`, `PageHeading`, `SectionNav`, `Sidebar`, `notify`
