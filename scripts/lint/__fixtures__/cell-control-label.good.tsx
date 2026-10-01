import { Checkbox, type Column } from "@g4ai/ds";
type Row = { id: string; name: string };
export function cols(has: (id: string) => boolean, toggle: (id: string) => void): Column<Row>[] {
  return [{ key: "sel", header: "", cell: (r) => <Checkbox label={`Selecionar ${r.name}`} hideLabel checked={has(r.id)} onCheckedChange={() => toggle(r.id)} /> }];
}
export function Termos({ on, set }: { on: boolean; set: (v: boolean) => void }) {
  return <Checkbox label="Aceito os termos" checked={on} onCheckedChange={set} />;
}
