# Log de auditoria

- Arquivo: `src/blocks/settings-audit-log.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Configurações
- Preview: showcase `#/frame/settings-audit-log` (`?theme=dark` para o escuro)

Quem fez o quê e quando: busca, filtros por pessoa, área e risco, período, exportação e detalhe do evento (antes/depois, IP) em drawer por ?id=.

## Conceito

**Objetivo:** Responder quem fez o quê e quando, para segurança e compliance.

**Padrões aplicados**

- Anatomia D · Configurações: título 'Configurações' fixo e subnavegação colada abaixo (SettingsLayout)
- PageToolbar com busca e filtros por pessoa, área e risco
- Detalhe do evento (antes/depois, IP) em gaveta por ?id=
- Exportação do recorte

**Quando usar e o que adaptar**

- Histórico de alterações de pedidos, de contratos

**Evite**

- Log sem o antes/depois

## Componentes usados

`Avatar`, `Badge`, `Button`, `Column`, `DataTable`, `Drawer`, `Empty`, `EmptyFilterResult`, `FilterBar`, `FilterField`, `FilterState`, `Highlight`, `PageToolbar`, `Pagination`, `PropertyList`, `TableSearch`, `downloadCsv`, `notify`, `useFilters`, `usePagination`
