import { DocPage } from "../kit";
import { Foundations } from "./_legacy";
import type { PageMeta } from "../kit";

export const meta: PageMeta = { title: "Cor, tipo e forma", group: "Fundamentos", order: 10, description: "Tokens de cor, escala tipográfica, raios e sombras. Toda cor, tamanho e raio do DS vem daqui." };

export default function Page() {
  return (
    <DocPage title={meta.title} description={meta.description} kicker={meta.group}>
      <Foundations />
    </DocPage>
  );
}
