---
"@g4ai/ds": minor
---

`ApprovalRequest` ganha `tone` (`neutral` | `info` | `warn` | `bad`), `eyebrow`, `icon`, `children` (corpo entre o preview e o rodapé), `actions` (substitui os botões padrão), os estados `expired` e `superseded` (com textos em `labels`) e `compact` (estado decidido em uma linha). Sem `tone`, o tom vem do `risk`: `low` agora aparece como info (azul), diferente de `medium` (âmbar). Tudo aditivo; quem não passa as props novas vê o mesmo cartão, exceto `risk="low"`, que deixa de ser âmbar.
