import { inertProps } from "@g4ai/ds";
export const A = ({ open }: { open: boolean }) => <div {...inertProps(!open)}>Lista</div>;
