---
"@g4ai/ds": minor
---

Peças promovidas do Durable e APIs que ele precisava contornar.

Novos: `AgentOrb` e `AgentOrbStack` (rosto gerado do agente, com 18 expressões, forma, cor e selo da ferramenta em uso), `CodeBlock` e `DiffView` (com `parseDiff`/`wordDiff`), `RowList`, `ChipRow`, `PageSkeleton`, `ListSkeleton`, `useDelayed`, `useIsMobile`, `useMediaQuery`, `useScrollEdges` e `breakpoints`.

Props novas: `Tabs overflow="scroll"`; `Breadcrumb back`; `description` e `id` em `Section`, `RecordSection` e `SettingsSection` (título aceita nó); `ListRow description`/`actions`; `Card padding`; `StatGrid cols` até 6 e `dense`, `StatCell short`/`of`; `FilterChip shape="pill"`/`count`; `Slider onValueCommit`; `ThemeToggle variant="menu"`; `formatDate({ time, timeZone })`; `formatRelative(data, { short: true })`.

`ListRow` com `href` agora usa o link do app (`setLinkComponent`) e desenha o alvo no título, estendido sobre a linha: quem estilizava `a.list-row` deve mirar `.list-row`.
