// preset strict
import { Select, type SelectOption } from "@g4ai/ds";
export const A = ({ v }: { v: SelectOption[] }) => <Select label="X" options={v} value="" onValueChange={() => {}} />;
