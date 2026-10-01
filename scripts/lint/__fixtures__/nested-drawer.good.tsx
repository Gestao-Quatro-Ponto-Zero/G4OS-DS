import { Drawer, Modal } from "@g4ai/ds";
export function A({ open, close }: { open: boolean; close: () => void }) {
  return (
    <>
      <Drawer open={open} onClose={close} title="Pedido">
        <Modal open={false} onClose={close} title="Descartar alterações?">
          texto
        </Modal>
      </Drawer>
      <Drawer open={open} onClose={close} title="Outro">
        lado a lado, não aninhado
      </Drawer>
    </>
  );
}
