import { MultiSelect, NativeSelect, Select } from "@g4ai/ds";
export const A = () => <Select label="Status" options={[]} value="" onValueChange={() => {}} />;
// NativeSelect é o <select> do sistema com a aparência do DS: permitido.
export const B = () => <NativeSelect label="Pessoa" options={[]} value="" onValueChange={() => {}} />;
export const C = () => <MultiSelect label="Cargos" options={[]} value={[]} onValueChange={() => {}} />;
const code = `<select>exemplo em string de documentação</select>`;
void code;
