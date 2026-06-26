import type { ReactNode } from "react";
import ThemeToggle from "@/components/ThemeToggle";

export default function PageHeader({
  titill,
  undirtitill,
  hægri,
}: {
  titill: string;
  undirtitill?: string;
  hægri?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-brand text-white shadow-sm">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div>
          <h1 className="text-lg font-semibold leading-tight">{titill}</h1>
          {undirtitill && (
            <p className="text-xs text-white/80">{undirtitill}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {hægri}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
