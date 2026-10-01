import { CurrencyField, FieldBlock } from "@g4ai/ds";
export function A({ v, set }: { v: number | null; set: (v: number | null) => void }) {
  return (
    <FieldBlock label="Previsão da equipe">
      <CurrencyField label="Previsão da equipe" value={v} onChange={set} />
    </FieldBlock>
  );
}
