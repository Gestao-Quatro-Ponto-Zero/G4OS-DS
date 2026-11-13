import { cn } from "@g4ai/ds";

export function A({ ativo, oculto, grande, sel, modo, className }: { ativo: boolean; oculto: boolean; grande: boolean; sel: boolean; modo: string; className?: string }) {
  return (
    <div className={cn("items-center gap-2", oculto ? "hidden" : "flex")}>
      {/* classes exclusivas: cada propriedade vem de um lado só */}
      <span className={cn("text-[13px]", ativo ? "text-ink" : "text-muted")}>Etapa</span>
      <button type="button" className={cn("rounded-lg", grande ? "h-9 px-4" : "h-8 px-3")}>
        Salvar
      </button>
      {/* largura × cor da borda e do anel; tamanho × cor do texto; size × h/w */}
      <div className={cn("border bg-surface ring-1", sel ? "border-primary ring-primary" : "border-line ring-line")} />
      <span className={cn("text-ink", sel && "text-[14px] border-2 size-6")} />
      {/* variantes diferentes não conflitam; hover:bg-x só disputa com hover:bg-y */}
      <span className={cn("bg-surface hover:bg-soft", sel && "md:bg-soft focus-visible:bg-soft")} />
      {/* comparação não é classe; classe do chamador fica por conta dele */}
      <span className={cn("grid gap-2", modo === "hidden" && "opacity-60", className)} />
      <span className={cn("h-8 w-8", "shrink-0")} />
    </div>
  );
}
