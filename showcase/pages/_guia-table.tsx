import type { ReactNode } from "react";

/** Tabela simples com cabeçalhos próprios para as páginas de guia (PropsTable é só para props). */
export function GuideTable({ head, rows, mono = [0] }: { head: string[]; rows: ReactNode[][]; mono?: number[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full text-left text-[12.5px]">
        <thead className="border-b border-line bg-soft/60 text-[11.5px] text-muted">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-3 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} className={mono.includes(j) ? "px-3 py-2 font-mono text-[12px] font-medium" : "px-3 py-2 text-ink-soft"}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
