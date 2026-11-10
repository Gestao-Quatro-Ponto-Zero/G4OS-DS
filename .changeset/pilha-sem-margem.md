---
"@g4ai/ds": patch
---

Espaço entre blocos empilhados volta a valer.

- `CodeBlock` e `DiffView` deixam de levar `m-0` na raiz: dentro de um pai com `space-y-*` (Tailwind v4, especificidade zero) o `m-0` vencia e os blocos encostavam um no outro. Vale também para `JsonView`, `FieldSet`, `ItemDescription`, `Kicker`, `Testimonial`, `OfficeChartView`, `DataSyncTable` e outras raízes que repetiam o reset do Tailwind.
- Auditoria: regra nova `stack-margin-reset` (aviso) aponta filho com `m-0`/`my-0`/`mb-0` dentro de `space-y-*` (e `mx-0`/`mr-0` em `space-x-*`).
- Blocos e documentação corrigidos onde títulos, parágrafos e blocos de código estavam colados.
