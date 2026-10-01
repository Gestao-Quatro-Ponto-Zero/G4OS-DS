import { Button, notify } from "@g4ai/ds";
export function A({ n }: { n: number }) {
  return (
    <>
      <Button onClick={() => notify("Vaga criada")}>Criar vaga</Button>
      {n !== 0 && <span>{n}</span>}
      <p>
        Relatório da IA: as importações estão processando com sucesso e os tipos de campo são detectados corretamente na maior parte das colunas.
      </p>
    </>
  );
}
