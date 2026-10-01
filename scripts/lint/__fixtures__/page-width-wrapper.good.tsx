import { Page, PageHeading } from "@g4ai/ds";
export function A() {
  return (
    <Page width="narrow">
      <PageHeading title="Automações" />
      <div className="space-y-6 pb-10">corpo</div>
    </Page>
  );
}
// cabeçalho DENTRO do wrapper: mesmo eixo
export function B() {
  return (
    <Page>
      <div className="mx-auto max-w-[760px]">
        <PageHeading title="Notificações" />
        corpo
      </div>
    </Page>
  );
}
// objeto centralizado (papel de documento), não a largura da página
export function C() {
  return (
    <Page>
      <PageHeading title="Fatura" />
      <article className="mx-auto max-w-[920px] rounded-xl border border-line bg-surface">documento</article>
    </Page>
  );
}
// fora de Page (login, fluxo focado)
export function D() {
  return <main className="mx-auto max-w-md">login</main>;
}
