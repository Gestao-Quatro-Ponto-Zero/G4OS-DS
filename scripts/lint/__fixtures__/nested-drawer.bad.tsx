import { Drawer } from "@g4ai/ds";
export function A({ open, close }: { open: boolean; close: () => void }) {
  return (
    <Drawer open={open} onClose={close} title="Pedido">
      <Drawer open={open} onClose={close} title="Item">
        detalhe
      </Drawer>
    </Drawer>
  );
}
