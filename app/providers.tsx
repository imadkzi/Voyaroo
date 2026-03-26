"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { useEffect } from "react";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const original = console.error;
    console.error = (...args) => {
      const first = args[0];
      if (
        typeof first === "string" &&
        first.includes(
          "Encountered a script tag while rendering React component",
        )
      ) {
        return;
      }
      original(...args);
    };

    return () => {
      console.error = original;
    };
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      /* Avoids inline color-scheme on <html> that differs from SSR HTML */
      enableColorScheme={false}
    >
      {children}
    </ThemeProvider>
  );
}

