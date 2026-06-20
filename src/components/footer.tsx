import { Boxes } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-muted sm:flex-row">
        <div className="flex items-center gap-2">
          <Boxes className="h-4 w-4 text-accent" />
          <span className="font-medium text-foreground">Nexus</span>
          <span>· hackathon starter</span>
        </div>
        <p>Built to ship fast. Make it yours.</p>
      </div>
    </footer>
  );
}
