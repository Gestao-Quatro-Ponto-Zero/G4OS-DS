import { Select, type Column } from "@g4ai/ds";
type Row = { id: string; stage: string };
export const columns: Column<Row>[] = [
  { key: "stage", header: "Etapa", cell: (r) => <Select size="compact" label="Etapa" value={r.stage} onValueChange={() => {}} options={[]} /> },
];
