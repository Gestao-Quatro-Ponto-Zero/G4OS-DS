// renames {"exports":{"OldCard":"Card"}}
import { Card } from "@g4ai/ds";
import { OldCard } from "./local";
export const A = () => <Card><OldCard /></Card>;
