import { Button, PageHeading } from "@g4ai/ds";
export function A() {
  return (
    <PageHeading
      title="Vagas"
      actions={
        <>
          <Button>Exportar</Button>
          <Button variant="primary">Criar vaga</Button>
        </>
      }
    />
  );
}
