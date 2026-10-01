---
"@g4ai/ds": minor
---

Paridade com o shadcn/ui.

- Novos componentes: `Separator` (com rótulo), `ScrollArea` (barra fina, esmaecimento nas bordas), `Label`, `FieldSet`/`FieldGroup`/`FieldSeparator`, família `Item` (`Item`, `ItemGroup`, `ItemMedia`, `ItemContent`, `ItemTitle`, `ItemDescription`, `ItemActions`), `Table` estática (`TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`), `Prose` (texto longo), `Toggle`, `ButtonGroup`/`ButtonGroupText`, família `InputGroup` (complementos, botões e faixa de ações dentro do campo), `ColorPicker` (amostras, hex, seletor livre e contraste), `Menubar`, `NavigationMenu`, `SortableList` (arraste e teclado, com anúncios) e `Questionnaire` (uma pergunta por vez, condicionais, atalhos).
- De/para shadcn/ui → DS em `scripts/data/shadcn-map.json`, publicado como `ai/shadcn-map.json` e `docs/guias/shadcn-equivalencias.md`. Página "shadcn/ui ↔ G4OS-DS" no site e selo "Equivalente no shadcn" em cada página de componente.
- MCP: `search` entende nomes do shadcn ("alert-dialog", "sheet", "dropdown menu") e devolve o equivalente do DS.
