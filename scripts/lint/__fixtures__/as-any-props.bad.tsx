// preset strict
// expect 1
import { Select } from "@g4ai/ds";
export const A = ({ v }: { v: unknown }) => <Select label="X" options={v as any} value="" onValueChange={() => {}} />;
