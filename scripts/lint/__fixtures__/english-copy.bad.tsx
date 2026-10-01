// expect 3
import { Button, TextField } from "@g4ai/ds";
export function A({ v, set }: { v: string; set: (v: string) => void }) {
  return (
    <>
      <TextField label="Name" value={v} onChange={set} />
      <Button>Save</Button>
      <p>Loading...</p>
    </>
  );
}
