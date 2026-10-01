---
"@g4ai/ds": patch
---

Compatível com React 18.2+ (além do 19). Peer deps `react`/`react-dom` agora `^18.2.0 || ^19.0.0`; `g4os-ds doctor` aceita 18.2+.

- `inertProps(flag)`: `inert` que funciona nas duas versões (o React 18 descartava `inert={true}` e drawers/listas recolhidas continuavam no Tab). Usado em `AppShell`, `ThreadView`/layout de IA, `SaveBar` e no bloco `ai-sessions`. Nova regra de auditoria `raw-inert`.
- `Button`, `IconButton`, `DsLink` e `BubbleContent` com `forwardRef`: funcionam como gatilho de Tooltip/Menu (Base UI) no React 18.
- `useLayoutEffect` sem aviso no servidor (Next/Remix com React 18) via efeito isomórfico.
- Tipos compatíveis com `@types/react@18`: componentes de campo devolvem `JSX.Element` (não mais um `ReactNode` expandido com `bigint`/`Promise`) e ícones aceitam `strokeWidth` `number | string` (lucide).
- Blocos `crm-*`, `saas-*` e `saas-support` renderizam no servidor (não leem `location`/`window` no render).
- `npm run test:react` + job de CI (matriz React 18/19): tipos, render no servidor e no cliente de todos os blocos e páginas do showcase.
