# Detalhe da conexão

- Arquivo: `src/blocks/app-connection.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Aplicação
- Preview: showcase `#/frame/app-connection` (`?theme=dark` para o escuro)

Um app conectado: estado, exemplo de pedido, dados sincronizados, contas e permissões de leitura/escrita por conta, desconectar com confirmação.

## Conceito

**Objetivo:** Ver e controlar o que um app conectado pode ler e escrever, por conta, antes de deixar o agente usar.

**Padrões aplicados**

- Anatomia C · Registro: trilha Apps › nome, estado e ações no topo
- Exemplo de pedido no app para mostrar o valor
- Permissões separadas em Leitura e Escrita, por conta, com switch e desfazer
- Desconectar só com confirmação

**Quando usar e o que adaptar**

- Integrações de ERP/CRM, contas bancárias, provedores de e-mail

**Evite**

- Uma permissão única 'acesso total' sem detalhar escrita

## Componentes usados

`AccountRow`, `AppIcon`, `Breadcrumb`, `Button`, `ConfirmDialog`, `ConnectionStatus`, `DataSyncTable`, `MarketplaceHero`, `Page`, `ToolPermissionList`, `formatNumber`, `notify`
