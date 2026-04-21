import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "R U Socrates",
  description:
    "Transform research questions into executable experiments — powered by AI.",
};

const NAV_LINKS = [
  { href: "/tasks", label: "Tasks" },
  { href: "/templates", label: "Templates" },
  { href: "/settings", label: "Settings" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.variable)}>
        {/* Top navigation */}
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-lg font-semibold">
                R U Socrates
              </Link>
              <nav className="hidden md:flex gap-4">
                {NAV_LINKS.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:inline">
                Phase 1 — skeleton
              </span>
              <div className="h-2 w-2 rounded-full bg-green-500" title="Development" />
            </div>
          </div>
        </header>

        <main className="container py-6">{children}</main>
      </body>
    </html>
  );
}
