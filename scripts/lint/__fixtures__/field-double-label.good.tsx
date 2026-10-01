import { CurrencyField, FieldBlock, Select } from "@g4ai/ds";
export function A({ v, set, s, setS }: { v: number | null; set: (v: number | null) => void; s: string; setS: (v: string) => void }) {
  return (
    <>
      <CurrencyField label="Previsão da equipe" value={v} onChange={set} />
      {/* Select lê o FieldBlock em volta e não repete o rótulo */}
      <FieldBlock label="Pessoa">
        <Select label="Pessoa" value={s} onValueChange={setS} options={[]} />
      </FieldBlock>
    </>
  );
}
