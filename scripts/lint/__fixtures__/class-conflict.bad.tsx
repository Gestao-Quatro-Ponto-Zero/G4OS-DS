// expect 8
import { cn } from "@g4ai/ds";

export function A({ ativo, oculto, grande, perigo, sel }: { ativo: boolean; oculto: boolean; grande: boolean; perigo: boolean; sel: boolean }) {
  return (
    <div className={cn("flex items-center gap-2", oculto && "hidden")}>
      <span className={cn("text-[13px] text-muted", ativo && "text-ink")}>Etapa</span>
      <button type="button" className={cn("h-8 rounded-lg px-3", grande ? "h-9 px-4" : "")}>
        Salvar
      </button>
      <div className={cn("rounded-lg border border-line bg-surface", sel && "border-primary bg-soft")} />
      <button type="button" className={cn("text-muted hover:text-ink", perigo && "hover:text-rose")}>
        Excluir
      </button>
      <span className={cn("ring-1 ring-line", sel && "ring-primary")} />
    </div>
  );
}
