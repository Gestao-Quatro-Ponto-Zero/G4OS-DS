// expect 2
declare function format(d: Date, f: string): string;
export const a = (d: Date) => format(d, "MM/dd/yyyy");
export const b = (d: Date) => format(d, "yyyy-MM-dd HH:mm");
