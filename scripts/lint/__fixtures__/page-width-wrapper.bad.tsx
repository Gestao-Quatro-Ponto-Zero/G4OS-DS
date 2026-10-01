// expect 2
import { Page, PageHeading } from "@g4ai/ds";
export function A() {
  return (
    <Page>
      <PageHeading title="Automações" />
      <div className="mx-auto max-w-4xl space-y-6 pb-10">corpo</div>
    </Page>
  );
}
export function B() {
  return (
    <Page>
      <PageHeading title="Equipe" />
      <div className="space-y-6 mx-auto max-w-6xl">corpo</div>
    </Page>
  );
}
