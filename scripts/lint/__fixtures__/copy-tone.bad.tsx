// expect 3
import { Button, notify } from "@g4ai/ds";
export function A() {
  return (
    <>
      <Button onClick={() => notify("Vaga criada com sucesso")}>Criar vaga</Button>
      <Button onClick={() => notify("Pronto, tudo salvo!")}>Salvar</Button>
      <p>Bem-vindo de volta!</p>
    </>
  );
}
