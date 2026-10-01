import { Handshake, Home, Settings } from "lucide-react";
import { AppShell, Sidebar, ThemeToggle } from "@g4ai/ds";
import { usePathname } from "./router";
import Inicio from "./pages/Inicio";
import Negocios from "./pages/Negocios";

const routes: Record<string, () => React.JSX.Element> = { "/": Inicio, "/negocios": Negocios };

export function App() {
  const pathname = usePathname();
  const Screen = routes[pathname] ?? Inicio;
  return (
    <AppShell
      product="Meu app"
      sidebar={({ mobileOpen }) => (
        <Sidebar
          product="Meu app"
          currentPath={pathname}
          mobileOpen={mobileOpen}
          groups={[
            {
              label: "Trabalho",
              items: [
                { href: "/", label: "Início", icon: Home },
                { href: "/negocios", label: "Negócios", icon: Handshake },
              ],
            },
            { label: "Conta", items: [{ href: "/configuracoes", label: "Configurações", icon: Settings }] },
          ]}
          user={{ name: "Ana Lopes", initials: "AL", role: "Administradora" }}
          footer={<ThemeToggle compact />}
        />
      )}
    >
      <Screen />
    </AppShell>
  );
}
