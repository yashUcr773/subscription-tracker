"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/theme-provider";

export function Providers({ 
  children,
  session 
}: {
  children: React.ReactNode;
  session: any;
}) {
  return (
    <SessionProvider session={session}>
      <ThemeProvider
        defaultTheme="system"
        storageKey="subscription-tracker-theme"
      >
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
