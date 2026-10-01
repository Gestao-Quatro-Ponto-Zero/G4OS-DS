// Moldura das páginas de gráficos: card calmo (ChartCard) com botão "Código"
// no canto, alternando entre o gráfico e o trecho de uso. Não é página.
import { Code2, Eye } from "lucide-react";
import { useState, type ReactNode } from "react";
import { ChartCard, cn } from "@g4os/ds";
import { CodeBlock } from "../kit";

export function ChartDemo({
  title,
  description,
  code,
  children,
  insight,
  insightTrend,
  insightDetail,
  action,
  headerAside,
  flush,
  className,
}: {
  title: string;
  description?: ReactNode;
  code: string;
  children: ReactNode;
  insight?: ReactNode;
  insightTrend?: "up" | "down" | "flat";
  insightDetail?: ReactNode;
  action?: ReactNode;
  headerAside?: ReactNode;
  flush?: boolean;
  className?: string;
}) {
  const [showCode, setShowCode] = useState(false);
  const toggle = (
    <button
      type="button"
      onClick={() => setShowCode((v) => !v)}
      aria-pressed={showCode}
      className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[12px] text-muted ring-1 ring-line hover:bg-soft hover:text-ink aria-pressed:bg-soft aria-pressed:text-ink"
    >
      {showCode ? <Eye className="h-3.5 w-3.5" /> : <Code2 className="h-3.5 w-3.5" />}
      {showCode ? "Gráfico" : "Código"}
    </button>
  );
  return (
    <div className={cn("relative min-w-0", className)}>
      <ChartCard
        title={title}
        description={
          headerAside ? (
            <>
              {description}
              <span className="mt-3 block">{toggle}</span>
            </>
          ) : (
            description
          )
        }
        action={headerAside ? undefined : <div className="flex items-center gap-2">{action}{toggle}</div>}
        headerAside={headerAside}
        insight={showCode ? undefined : insight}
        insightTrend={insightTrend}
        insightDetail={insightDetail}
        flush={flush && !showCode}
        className="h-full"
      >
        {showCode ? <CodeBlock code={code} maxHeight={420} /> : children}
      </ChartCard>
    </div>
  );
}

/** Grade calma: 1 coluna no celular, 2 no tablet, `cols` no desktop. */
export function ChartGrid({ children, cols = 3 }: { children: ReactNode; cols?: 2 | 3 }) {
  return <div className={cn("grid gap-5 md:grid-cols-2", cols === 3 && "2xl:grid-cols-3")}>{children}</div>;
}
