# Integrações

- Arquivo: `src/blocks/saas-integrations.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: SaaS
- Preview: showcase `#/frame/saas-integrations` (`?theme=dark` para o escuro)

Catálogo por categoria com busca, estado de sincronização, erro com reconexão, conexão por autorização e configuração em gaveta.

## Conceito

**Objetivo:** Manter as integrações funcionando e conectar novas sem sair do produto.

**Padrões aplicados**

- Catálogo por categoria com busca
- Estado de sincronização e erro com reconexão em destaque
- Autorização em modal; configuração em gaveta

**Quando usar e o que adaptar**

- Conexões bancárias, canais de venda, provedores de e-mail

**Evite**

- Integração com erro sem botão de reconectar

## Componentes usados

`Badge`, `Banner`, `Button`, `ConfirmDialog`, `Drawer`, `FieldBlock`, `Modal`, `Page`, `PageHeading`, `SegmentedControl`, `Select`, `Switch`, `TableSearch`, `TextField`, `matchesQuery`, `notify`
