# Mural · pessoas

- Arquivo: `src/blocks/comms-people.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Comunicação
- Preview: showcase `#/frame/comms-people` (`?theme=dark` para o escuro)

Diretório de pessoas: busca, filtros por área, cidade e presença, cards com cidade e hora local, lista, organograma, “Online agora” e perfil em gaveta com contato, gestão, equipe e habilidades.

## Conceito

**Objetivo:** Achar quem pode ajudar, saber onde a pessoa está e se é uma boa hora para chamar.

**Padrões aplicados**

- Anatomia A · Lista: cabeçalho fixo + PageToolbar colada (filtros e busca); cards, lista ou organograma
- LocationTag com hora local: time em 4 fusos (Manaus, Cuiabá, Recife/São Paulo, Lisboa)
- StackedList “Online agora” com o diretório completo no mesmo cartão
- Perfil em Drawer pela URL (?pessoa=): não perde a lista; gestão e equipe navegam dentro da gaveta
- Cinco estados: ?estado=carregando|vazio|erro simula; vazio por filtro com Limpar

**Quando usar e o que adaptar**

- Diretório de franqueados, de fornecedores, de alunos e professores

**Evite**

- Mostrar presença só com cor (sempre com palavra: Online, Em reunião, Visto há…)
- Abrir o perfil em página nova e perder o filtro

## Componentes usados

`Avatar`, `Badge`, `Button`, `Column`, `DataTable`, `Drawer`, `Empty`, `EmptyFilterResult`, `FilterBar`, `FilterField`, `Highlight`, `LocationTag`, `Page`, `PageHeading`, `PageToolbar`, `PropertyList`, `SegmentedControl`, `StackedList`, `TableSearch`, `TreeNode`, `TreeView`, `formatDate`, `formatNumber`, `notify`, `plural`, `useFilters`
