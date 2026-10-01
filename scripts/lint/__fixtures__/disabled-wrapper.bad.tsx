// expect 3
import { Button } from "@g4ai/ds";
import type { ReactNode } from "react";
export function DemoDisabled({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex opacity-50" title="Demonstração" aria-disabled="true">
      <span className="pointer-events-none">{children}</span>
    </span>
  );
}
export function A() {
  return (
    <>
      <span className="opacity-50">
        <Button disabled>Salvar</Button>
      </span>
      <div className="pointer-events-none">
        <Button variant="ghost" disabled>
          Rodar agora
        </Button>
      </div>
    </>
  );
}
