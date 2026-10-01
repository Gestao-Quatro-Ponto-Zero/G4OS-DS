import { Button, cn } from "@g4ai/ds";
export function A({ dirty, demo }: { dirty: boolean; demo: boolean }) {
  return (
    <>
      <Button disabled={demo} disabledReason="Demonstração: nada é gravado">
        Salvar
      </Button>
      {/* barra que aparece/some: opacidade condicional é estado visual */}
      <div className={cn("transition-opacity", dirty ? "opacity-100" : "pointer-events-none opacity-0")}>
        <Button>Salvar alterações</Button>
      </div>
      {/* prévia não interativa (sem controle desabilitado dentro) */}
      <div className="pointer-events-none opacity-60">
        <span>Prévia</span>
      </div>
    </>
  );
}
