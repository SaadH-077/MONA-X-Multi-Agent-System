import { Boxes } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-muted sm:flex-row">
        <div className="flex items-center gap-2">
          <Boxes className="h-4 w-4 text-accent" />
          <span className="font-medium text-foreground">MONA-X</span>
          <span>· one suite, ten agents</span>
        </div>
        <p>Built at the MONA GmbH AI Hackathon 2026 · Gemini 2.5</p>
      </div>
    </footer>
  );
}
