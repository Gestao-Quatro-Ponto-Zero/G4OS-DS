// expect 4
import { cn } from "@g4ai/ds";
export const A = ({ on }: { on: boolean }) => <div className={cn("bg-background text-muted-foreground", on && "hover:bg-accent border-input")} />;
