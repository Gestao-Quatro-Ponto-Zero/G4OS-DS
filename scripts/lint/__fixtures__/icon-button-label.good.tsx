import { Plus } from "lucide-react";
import { IconButton } from "@g4ai/ds";
export const A = () => (
  <>
    <button type="button" aria-label="Adicionar">
      <Plus />
    </button>
    <button type="button">
      <Plus /> Adicionar
    </button>
    <IconButton label="Adicionar">
      <Plus />
    </IconButton>
  </>
);
