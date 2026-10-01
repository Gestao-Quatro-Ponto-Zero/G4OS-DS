import { Checkbox, type Column } from "@g4ai/ds";
type Row = { id: string; name: string };
export function cols(has: (id: string) => boolean, toggle: (id: string) => void): Column<Row>[] {
  return [{ key: "sel", header: "", cell: (r) => <Checkbox label={`Selecionar ${r.name}`} checked={has(r.id)} onCheckedChange={() => toggle(r.id)} /> }];
}
