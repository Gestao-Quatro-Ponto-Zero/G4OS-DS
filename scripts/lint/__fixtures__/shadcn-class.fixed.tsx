// expect 4
import { cn } from "@g4ai/ds";
export const A = ({ on }: { on: boolean }) => <div className={cn("bg-page text-muted", on && "hover:bg-soft border-line")} />;
