import { notify } from "@g4ai/ds";
declare function useConfirm(): { confirm: (s: string) => Promise<boolean> };
export function useRemove() {
  const { confirm } = useConfirm();
  return async () => {
    if (await confirm("Excluir?")) notify("Negócio excluído");
  };
}
const dialog = { confirm() {} };
dialog.confirm();
