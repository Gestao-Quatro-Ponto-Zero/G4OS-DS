// expect 2
import { Checkbox, Switch } from "@g4ai/ds";
export function A({ cargo, on, set }: { cargo: string; on: boolean; set: (v: boolean) => void }) {
  return (
    <>
      <Checkbox label={cargo} checked={on} onCheckedChange={set} />
      <Switch label="Ativo" checked={on} onCheckedChange={set} />
    </>
  );
}
