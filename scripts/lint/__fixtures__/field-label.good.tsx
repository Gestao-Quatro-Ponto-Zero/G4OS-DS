import { FieldBlock } from "@g4ai/ds";
export const A = () => (
  <form>
    <FieldBlock label="Nome">
      <input />
    </FieldBlock>
    <label>
      E-mail <input type="email" />
    </label>
    <input aria-label="Busca" />
    <input type="hidden" name="id" />
    <label htmlFor="obs">Observação</label>
    <textarea id="obs" />
  </form>
);
