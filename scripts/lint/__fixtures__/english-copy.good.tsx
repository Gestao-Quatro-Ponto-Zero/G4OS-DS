import { Button, TextField } from "@g4ai/ds";
export function A({ v, set }: { v: string; set: (v: string) => void }) {
  return (
    <>
      <TextField label="Nome" value={v} onChange={set} />
      <Button>Salvar</Button>
      <p>Carregando…</p>
      <span>Status</span>
      <span>Dashboard comercial</span>
    </>
  );
}
