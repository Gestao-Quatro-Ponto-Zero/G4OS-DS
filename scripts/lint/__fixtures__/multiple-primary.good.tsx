import { Button, PageHeading } from "@g4ai/ds";
export function A({ last }: { last: boolean }) {
  return (
    <>
      <PageHeading
        title="Vagas"
        actions={
          <>
            <Button variant="ghost">Exportar</Button>
            <Button>Criar vaga</Button>
          </>
        }
      />
      <PageHeading
        title="Candidato"
        actions={
          <>
            <Button variant="ghost">Reprovar</Button>
            {last ? <Button>Enviar proposta</Button> : <Button>Avançar etapa</Button>}
          </>
        }
      />
    </>
  );
}
