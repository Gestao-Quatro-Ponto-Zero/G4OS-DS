# Gerenciador de arquivos

- Arquivo: `src/blocks/app-file-manager.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Aplicação
- Preview: showcase `#/frame/app-file-manager` (`?theme=dark` para o escuro)

Pastas em árvore, arquivos em grade ou lista, busca, envio com progresso e prévia em sheet com detalhes e ações.

## Conceito

**Objetivo:** Organizar, achar e prever arquivos do time em pastas, com envio e detalhes sem trocar de tela.

**Padrões aplicados**

- Anatomia G · App de altura total: árvore de pastas à esquerda, conteúdo rola
- Grade ou lista (SegmentedControl), busca, envio com progresso
- Prévia em Sheet com detalhes e ações

**Quando usar e o que adaptar**

- Documentos de cliente no CRM, currículos no ATS, notas e XMLs no ERP

**Evite**

- Abrir arquivo em nova página para só ver detalhes

## Componentes usados

`ActionMenu`, `Avatar`, `Button`, `Column`, `DataTable`, `Empty`, `FileCard`, `FileIcon`, `Meter`, `PropertyList`, `SearchInput`, `SegmentedControl`, `Sheet`, `Skeleton`, `TreeNode`, `TreeView`, `formatBytes`, `normalize`, `notify`
