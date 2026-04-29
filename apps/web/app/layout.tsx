import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { Star, GitFork } from "lucide-react";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "@/components/ui/toast";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    default: "R U Socrates",
    template: "%s | R U Socrates",
  },
  description:
    "Transform research questions into executable experiments — powered by AI.",
  authors: [{ name: "zbbsdsb" }],
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
  },
};

const NAV_LINKS = [
  { href: "/tasks", label: "Tasks" },
  { href: "/templates", label: "Templates" },
  { href: "/settings", label: "Settings" },
];

const BADGES = [
  {
    label: "Phase 1",
    text: "MVP",
    bg: "bg-blue-100 text-blue-700",
  },
  {
    label: "License",
    text: "Apache-2.0",
    bg: "bg-green-100 text-green-700",
    href: "https://github.com/zbbsdsb/R-U-Socrates/blob/main/LICENSE",
  },
  {
    label: "Stack",
    text: "Next.js · FastAPI",
    bg: "bg-purple-100 text-purple-700",
  },
  {
    label: "AI Engine",
    text: "LiteLLM",
    bg: "bg-orange-100 text-orange-700",
  },
];

const FOOTER_LINKS = [
  { href: "https://github.com/zbbsdsb/R-U-Socrates", label: "GitHub" },
  { href: "https://github.com/zbbsdsb/R-U-Socrates/issues", label: "Issues" },
  { href: "https://github.com/zbbsdsb/R-U-Socrates/discussions", label: "Discussions" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={cn("min-h-screen bg-background font-sans antialiased flex flex-col", inter.variable)}>
        {/* Top navigation */}
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0">
          <div className="container flex h-14 items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="R U Socrates" className="h-8 w-8 rounded-md object-contain" />
                <span className="text-lg font-semibold tracking-tight">R U Socrates</span>
              </Link>
              <nav className="hidden md:flex">
                <Navbar />
              </nav>
            </div>
            <div className="flex items-center gap-3">
              {/* GitHub star button */}
              <a
                href="https://github.com/zbbsdsb/R-U-Socrates"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors border border-border rounded-md px-2.5 py-1 hover:bg-muted/50"
              >
                <Star className="h-3.5 w-3.5" />
                Star
              </a>
              <a
                href="https://github.com/zbbsdsb/R-U-Socrates/fork"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors border border-border rounded-md px-2.5 py-1 hover:bg-muted/50"
              >
                <GitFork className="h-3 w-3" />
                Fork
              </a>
            </div>
          </div>
          {/* Badge bar — compact meta strip */}
          <div className="border-t border-border/40">
            <div className="container flex items-center gap-2 py-1 overflow-x-auto">
              {BADGES.map(({ label, text, bg, href }) => (
                <span
                  key={text}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap opacity-80 hover:opacity-100 transition-opacity",
                    bg
                  )}
                >
                  {href ? (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {label}: {text}
                    </a>
                  ) : (
                    <><span className="opacity-60">{label}:</span> {text}</>
                  )}
                </span>
              ))}
            </div>
          </div>
        </header>

        <main className="container py-6 flex-1">{children}</main>

        {/* Footer */}
        <footer className="border-t bg-muted/30 shrink-0">
          <div className="container flex flex-col sm:flex-row items-center justify-between gap-3 py-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="R U Socrates" className="h-5 w-5 rounded object-contain opacity-60" />
              <span>
                © {new Date().getFullYear()} Oasis Company — Built by{" "}
                <a
                  href="https://github.com/zbbsdsb"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-foreground/70 hover:text-foreground transition-colors"
                >
                  zbbsdsb
                </a>
              </span>
            </div>
            <nav className="flex items-center gap-4">
              {FOOTER_LINKS.map(({ href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  {label}
                </a>
              ))}
              <a
                href="https://github.com/zbbsdsb/R-U-Socrates/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                License
              </a>
            </nav>
          </div>
        </footer>

        {/* Global Toast notifications */}
        <Toaster />
      </body>
    </html>
  );
}
