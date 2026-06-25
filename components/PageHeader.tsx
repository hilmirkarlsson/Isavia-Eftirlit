import type { ReactNode } from "react";

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
      <div className="flex items-center justify-between gap-3 px-4 py-3 pr-14">
        <div>
          <h1 className="text-lg font-semibold leading-tight">{titill}</h1>
          {undirtitill && (
            <p className="text-xs text-white/80">{undirtitill}</p>
          )}
        </div>
        {hægri && <div className="shrink-0">{hægri}</div>}
      </div>
    </header>
  );
}
