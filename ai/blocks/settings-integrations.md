# Integrações

- Arquivo: `src/blocks/settings-integrations.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Configurações
- Preview: showcase `#/frame/settings-integrations` (`?theme=dark` para o escuro)

Catálogo de integrações com filtros por categoria, conectar/desconectar, e detalhe em drawer (permissões, sincronização, histórico) aberto por ?id=.

## Conceito

**Objetivo:** Conectar e controlar integrações do workspace com permissões claras.

**Padrões aplicados**

- Anatomia D · Configurações: título 'Configurações' fixo e subnavegação colada abaixo (SettingsLayout)
- Catálogo com filtros por categoria
- Detalhe em gaveta (permissões, sincronização, histórico) por ?id=

**Quando usar e o que adaptar**

- Integrações de qualquer produto

**Evite**

- Conectar sem mostrar o que será acessado

## Componentes usados

`Badge`, `Button`, `Drawer`, `Empty`, `PropertyList`, `SearchInput`, `Switch`, `Tabs`, `Timeline`, `normalize`, `notify`
