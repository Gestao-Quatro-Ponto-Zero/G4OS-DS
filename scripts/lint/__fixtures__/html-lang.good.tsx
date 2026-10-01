export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="ds-app" data-theme="system">
      <body>{children}</body>
    </html>
  );
}
