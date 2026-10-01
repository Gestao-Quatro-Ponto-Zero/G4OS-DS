import { Callout } from "@g4os/ds";
import { CodeBlock, DocPage, DocSection, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Instalação",
  group: "Começar",
  order: 2,
  description: "Do zero a um app com a casca do DS em cinco passos. O pacote é código-fonte: o Tailwind e o bundler do seu app compilam tudo.",
};

export default function Page() {
  return (
    <DocPage title={meta.title} kicker={meta.group} description={meta.description}>
      <DocSection title="1. Dependências" rule="React 19, Tailwind 4.3+ e as peer deps do DS.">
        <CodeBlock
          code={`npm i @base-ui/react lucide-react
npm i -D tailwindcss @tailwindcss/postcss     # Next.js  (ou @tailwindcss/vite)

npm i ../G4OS-DS                              # pasta local
# npm i github:<org>/G4OS-DS                  # ou repositório git`}
        />
      </DocSection>

      <DocSection title="2. CSS global" rule="Importe os estilos do DS depois do Tailwind e aponte o @source para os componentes, senão as classes deles não são geradas.">
        <CodeBlock
          code={`/* app/globals.css */
@import "tailwindcss";
@import "@g4os/ds/styles.css";
@source "../node_modules/@g4os/ds/src";

/* opcional: shadcn/ui e 21st.dev com a cara do DS */
/* @import "@g4os/ds/shadcn.css"; */`}
        />
      </DocSection>

      <DocSection title="3. Raiz do documento e fonte" rule="ds-app trava a rolagem do documento (só as áreas de trabalho rolam). Figtree é a única família.">
        <CodeBlock
          code={`// app/layout.tsx
import { Figtree } from "next/font/google";
const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree" });

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={\`ds-app \${figtree.variable}\`}>
      <body><DsSetup />{children}</body>
    </html>
  );
}

/* globals.css */
:root { --font-sans: var(--font-figtree), ui-sans-serif, system-ui, sans-serif; }`}
        />
      </DocSection>

      <DocSection title="4. Links do framework" rule="Componentes com href usam <a> por padrão. Registre o Link do Next uma vez, no cliente.">
        <CodeBlock
          code={`// lib/ds.tsx
"use client";
import Link from "next/link";
import { setLinkComponent } from "@g4os/ds";
setLinkComponent(Link);
export function DsSetup() { return null; }

// next.config.ts
export default { transpilePackages: ["@g4os/ds"] };`}
        />
      </DocSection>

      <DocSection title="5. A casca" rule="AppShell + Sidebar com o caminho atual. Cada página usa Page + PageHeading.">
        <CodeBlock
          code={`"use client";
import { usePathname } from "next/navigation";
import { AppShell, Sidebar } from "@g4os/ds";
import { Home, Handshake, Users, Settings } from "lucide-react";

export default function AppLayout({ children }) {
  const pathname = usePathname() ?? "/";
  return (
    <AppShell
      product="Meu CRM"
      sidebar={({ mobileOpen }) => (
        <Sidebar
          product="Meu CRM"
          currentPath={pathname}
          mobileOpen={mobileOpen}
          groups={[
            { label: "Vendas", items: [
              { href: "/", label: "Início", icon: Home },
              { href: "/negocios", label: "Negócios", icon: Handshake },
              { href: "/contatos", label: "Contatos", icon: Users },
            ]},
            { label: "Conta", items: [{ href: "/configuracoes", label: "Configurações", icon: Settings }] },
          ]}
        />
      )}
    >
      {children}
    </AppShell>
  );
}

// app/(app)/negocios/page.tsx
<Page>
  <PageHeading title="Negócios" actions={<Button><Plus /> Novo negócio</Button>} />
  …
</Page>`}
        />
        <Callout tone="info" title="Starter pronto">
          A pasta <code className="font-mono text-[12px]">templates/next-app</code> tem tudo isso montado (casca, dashboard, lista). Guia completo em <code className="font-mono text-[12px]">docs/guias/instalacao.md</code>.
        </Callout>
      </DocSection>
    </DocPage>
  );
}
