"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useLang } from "@/components/language-provider";
import { cn } from "@/lib/utils";
import MonaX from "@/components/brand";

const links = [{ href: "/", label: "Agents" }];

export default function Navbar() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const { lang, setLang } = useLang();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/70 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-6">
        <Link href="/" className="flex items-center gap-2">
          <MonaX className="text-lg" />
        </Link>

        <div className="ml-6 flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm transition-colors",
                pathname === l.href
                  ? "bg-surface-2 text-foreground"
                  : "text-muted hover:text-foreground",
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Language switch */}
        <div className="ml-auto flex items-center rounded-lg border border-border p-0.5 text-xs font-medium">
          {(["en", "de"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={cn(
                "rounded-md px-2 py-1 transition-colors",
                lang === l ? "bg-accent text-white" : "text-muted hover:text-foreground",
              )}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className="ml-2 grid h-9 w-9 place-items-center rounded-lg border border-border text-muted transition-colors hover:text-foreground"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>
      </nav>
    </header>
  );
}
