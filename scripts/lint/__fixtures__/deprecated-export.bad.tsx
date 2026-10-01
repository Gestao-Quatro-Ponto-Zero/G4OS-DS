// renames {"exports":{"OldCard":"Card"}}
// expect 1
import { OldCard, Button } from "@g4ai/ds";
export const A = () => <OldCard><Button>Ok</Button></OldCard>;
