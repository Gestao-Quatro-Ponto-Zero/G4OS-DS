import { Checkbox } from "@g4ai/ds";
export function A({ on, set }: { on: boolean; set: (v: boolean) => void }) {
  return (
    <>
      <Checkbox label="Aceito os termos" checked={on} onCheckedChange={set}>
        Aceito os <a href="/termos">termos de uso</a>
      </Checkbox>
      <Checkbox label="Manter conectado" checked={on} onCheckedChange={set} />
    </>
  );
}
