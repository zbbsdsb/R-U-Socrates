"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/tasks",     label: "Tasks" },
  { href: "/templates", label: "Templates" },
  { href: "/settings",  label: "Settings" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1">
      {NAV_LINKS.map(({ href, label }) => {
        const isActive = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {isActive && (
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            )}
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
