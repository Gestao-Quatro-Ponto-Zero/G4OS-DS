---
"@g4ai/ds": patch
---

- `PageHeading` agora separa o cabeçalho do conteúdo sozinho (24 px; 20 px no celular): o primeiro filho de `Page` depois do cabeçalho não fica mais colado nele quando o app não coloca `mt-*`. Um `mt-*` explícito continua valendo. Corrige também `ai-projects`, `crm-company` e `saas-support`.
- `g4os-ds init`: com vários lockfiles, escolhe o gerenciador pelo campo `packageManager`, pelo que o CI existente já roda ou pelo lockfile mais recente (e diz o porquê); as pastas auditadas vêm de onde o `@g4ai/ds` é importado (ex.: `frontend/src`), não só de nomes fixos.
