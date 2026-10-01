// preset strict
import { Card, Page, PageHeading } from "@g4ai/ds";
export function A() {
  return (
    <Page>
      <PageHeading title="Histórico" />
      <Card>
        <h2 className="text-section font-semibold">Por dia</h2>
      </Card>
    </Page>
  );
}
// tela sem Page (login) pode ter h1
export function Login() {
  return <h1 className="text-title">Entrar</h1>;
}
