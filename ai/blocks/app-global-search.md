# Busca global (⌘K)

- Arquivo: `src/blocks/app-global-search.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Aplicação
- Preview: showcase `#/frame/app-global-search` (`?theme=dark` para o escuro)

Busca em todo o app: escopos (Tab, prefixos > @ #), resultados por tipo com destaque, prévia à direita, recentes, fonte remota com carregamento e “Ver todos” que abre a tabela filtrada.

## Conceito

**Objetivo:** Achar qualquer coisa no app (registros, pessoas, ações) e ir direto para a tabela filtrada quando há muitos resultados.

**Padrões aplicados**

- ⌘K com escopos (Tab, prefixos > @ #) e resultados por tipo com destaque
- Prévia à direita sem abrir o registro
- 'Ver todos' abre a lista já filtrada (?q=)
- Fonte remota com carregamento e erro

**Quando usar e o que adaptar**

- Busca de qualquer produto: registre os tipos e a fonte de dados

**Evite**

- Busca que só navega e não leva ao recorte da lista

## Componentes usados

`Badge`, `Button`, `Card`, `Kbd`, `Page`, `PageHeading`, `SearchPalette`, `SearchResult`, `SearchScope`, `formatCurrency`, `notify`, `useCommandShortcut`, `useTheme`
