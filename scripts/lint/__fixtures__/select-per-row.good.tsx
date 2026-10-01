import { Badge, Select, type Column } from "@g4ai/ds";
type Row = { id: string; stage: string };
export const columns: Column<Row>[] = [
  { key: "stage", header: "Etapa", cell: (r) => <Badge>{r.stage}</Badge> },
  { key: "created", header: "Criado", cell: (r) => <span className="tabular-nums">{r.id.split("-").reverse().join("/")}</span> },
];
export function Filtro({ v, set }: { v: string; set: (v: string) => void }) {
  return <Select label="Etapa" value={v} onValueChange={set} options={[]} />;
}
