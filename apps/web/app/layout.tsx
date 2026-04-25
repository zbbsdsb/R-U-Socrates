import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
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
  authors: [{ name: "ceaserzhao" }],
  icons: {
    icon: "/favicon.ico",
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
    href: "https://github.com/ceaserzhao/R-U-Socrates/blob/main/LICENSE",
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
  { href: "https://github.com/ceaserzhao/R-U-Socrates", label: "GitHub" },
  { href: "https://github.com/ceaserzhao/R-U-Socrates/issues", label: "Issues" },
  { href: "https://github.com/ceaserzhao/R-U-Socrates/discussions", label: "Discussions" },
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
                href="https://github.com/ceaserzhao/R-U-Socrates"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors border border-border rounded-md px-2.5 py-1 hover:bg-muted/50"
              >
                <svg height="14" width="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                </svg>
                Star
              </a>
              <a
                href="https://github.com/ceaserzhao/R-U-Socrates/fork"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors border border-border rounded-md px-2.5 py-1 hover:bg-muted/50"
              >
                <svg height="12" width="12" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0zM8 7a.75.75 0 0 0-.75.75v5.5a.75.75 0 0 0 1.5 0v-5.5A.75.75 0 0 0 8 7z"/>
                  <path d="M5.786 8a.75.75 0 0 1 .75-.75h3.5a.75.75 0 0 1 0 1.5h-3.5A.75.75 0 0 1 5.786 8z"/>
                </svg>
                Fork
              </a>
            </div>
          </div>
          {/* Badge bar */}
          <div className="border-t border-border/50 bg-muted/20">
            <div className="container flex items-center gap-3 py-1.5 overflow-x-auto">
              {BADGES.map(({ label, text, bg, href }) => (
                <span
                  key={text}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
                    bg
                  )}
                >
                  {href ? (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {label}: {text}
                    </a>
                  ) : (
                    <>
                      <span className="opacity-70">{label}:</span> {text}
                    </>
                  )}
                </span>
              ))}
              <span className="ml-auto text-xs text-muted-foreground whitespace-nowrap">
                © {new Date().getFullYear()} Oasis Company
              </span>
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
                  href="https://github.com/ceaserzhao"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-foreground/70 hover:text-foreground transition-colors"
                >
                  ceaserzhao
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
                href="https://github.com/ceaserzhao/R-U-Socrates/blob/main/LICENSE"
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
