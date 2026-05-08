import type { Metadata } from "next";
import "./brand-tokens.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pulsar",
  description: "Pulsar diagnostics and transformation portal",
};

import { UiModeProvider } from "@/presentation/components/UiModeProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (() => {
                try {
                  const storedTheme = localStorage.getItem('impulse-theme');
                  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const theme = storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : (systemDark ? 'dark' : 'light');
                  document.documentElement.setAttribute('data-theme', theme);

                  const storedMode = localStorage.getItem('impulse-ui-mode');
                  if (storedMode === 'bento') {
                    document.documentElement.setAttribute('data-ui-mode', 'bento');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <UiModeProvider>{children}</UiModeProvider>
      </body>
    </html>
  );
}
