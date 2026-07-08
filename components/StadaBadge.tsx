// Eitt samræmt stöðukerfi fyrir allt appið – hver staða hefur lit + form +
// orð, aldrei lit einan (sólarbirta/litblinda). Notað í Verkefni og á Heim
// ("Verkefni sem þarfnast athygli").

export type Stada = "lokid" | "i-gangi" | "ekki-byrjad" | "yfir-tima";

const STILLING: Record<Stada, { ord: string; tákn: string; flokkur: string; pulsandi?: boolean }> = {
  "lokid": {
    ord: "Lokið",
    tákn: "✓",
    flokkur: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  "i-gangi": {
    ord: "Í gangi",
    tákn: "●",
    flokkur: "border border-amber-200 bg-amber-50 text-amber-800",
    pulsandi: true,
  },
  "ekki-byrjad": {
    ord: "Ekki byrjað",
    tákn: "○",
    flokkur: "border border-slate-300 bg-transparent text-slate-500",
  },
  "yfir-tima": {
    ord: "Yfir tíma",
    tákn: "⚠",
    flokkur: "border border-red-200 bg-red-50 text-red-700",
  },
};

export default function StadaBadge({ stada, className = "" }: { stada: Stada; className?: string }) {
  const s = STILLING[stada];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${s.flokkur} ${className}`}
    >
      <span className={s.pulsandi ? "animate-pulse" : ""}>{s.tákn}</span>
      {s.ord}
    </span>
  );
}
