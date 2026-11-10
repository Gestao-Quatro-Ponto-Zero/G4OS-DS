---
"@g4ai/ds": patch
---

Correções que o Durable aplicava por patch ou CSS local.

- Cabeçalho fixo: o `PageHeading` compacto encosta no topo da área rolável. Antes ficava uma faixa do tamanho do respiro do `Page` acima dele, com o conteúdo aparecendo por trás; `PageToolbar` e `.page-aside` grudavam deslocados pelo mesmo valor.
- Marcas (`data-brand`) escurecem também em `data-theme="system"`.
- `AttachmentTrigger` volta a cobrir o card dentro de `.linked-card` ("Abrir" não respondia).
- Menus só reservam o espaço do ícone quando algum item tem ícone.
- `IconRail` não corta mais o anel de foco do primeiro e do último item.
- Campos de texto têm no mínimo 16 px em tela de toque, para o Safari do iOS não dar zoom ao focar.
