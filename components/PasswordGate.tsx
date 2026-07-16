"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { TOKEN_LYKILL } from "@/lib/clientAuth";

const LYKILL = "eftirlit-kef-password-ok";

// Einfalt lykilorðshlið fyrir allt forritið – lykilorðið er athugað á þjóninum
// (/api/password) svo það birtist hvergi í vafrakóða. EFTIRLIT_PASSWORD verður að
// vera stillt á þjóninum; ósett þýðir lokað fyrir alla (fail closed, sjá lib/auth.ts).
//
// Eftir rétt lykilorð fær tækið auðkenningartóka (TOKEN_LYKILL) sem
// /api/state og /api/skipulag-mynd krefjast – sjá lib/clientAuth.ts og
// lib/auth.ts. Tæki sem voru ólæst með eldri PIN-lyklum hafa engan gildan tóka og
// eru því látin slá inn lykilorð aftur einu sinni.
export default function PasswordGate({ children }: { children: ReactNode }) {
  const [stada, setStada] = useState<"athuga" | "opid" | "lokad">("athuga");
  const [password, setPassword] = useState("");
  const [villa, setVilla] = useState<string | null>(null);
  const [sendir, setSendir] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(LYKILL) === "1" && localStorage.getItem(TOKEN_LYKILL)) {
      setStada("opid");
      return;
    }
    localStorage.removeItem(LYKILL); // gömul ólæsing án tóka – ógild núna
    localStorage.removeItem("eftirlit-kef-pin-ok");
    fetch("/api/password")
      .then((res) => res.json())
      .then((data: { krafist: boolean }) => setStada(data.krafist ? "lokad" : "opid"))
      .catch(() => setStada("opid")); // án nettengingar – ekki læsa notanda úti
  }, []);

  const senda = async () => {
    setSendir(true);
    setVilla(null);
    try {
      const res = await fetch("/api/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { ok: boolean; token?: string; villa?: string };
      if (data.ok && data.token) {
        localStorage.setItem(LYKILL, "1");
        localStorage.setItem(TOKEN_LYKILL, data.token);
        setStada("opid");
      } else {
        // Þjónninn getur gefið nákvæmari skýringu (t.d. hraðatakmörkun eða
        // óstillt lykilorð) – sýnum hana frekar en almenna villu.
        setVilla(data.villa || "Rangt lykilorð – reyndu aftur");
        setPassword("");
      }
    } catch {
      setVilla("Náði ekki sambandi við þjóninn – reyndu aftur");
    } finally {
      setSendir(false);
    }
  };

  if (stada === "athuga") return null;
  if (stada === "opid") return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand px-6 text-white">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-2xl font-bold">
        KEF
      </div>
      <h1 className="mb-1 text-xl font-bold">Eftirlit KEF</h1>
      <p className="mb-6 text-sm text-white/80">Sláðu inn lykilorð til að halda áfram</p>

      <input
        type="password"
        autoFocus
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && password && senda()}
        className="mb-3 w-full max-w-72 rounded-xl border-0 px-4 py-3 text-center text-lg text-slate-900"
        placeholder="Lykilorð"
      />

      {villa && <p className="mb-3 max-w-64 text-center text-sm text-red-200">{villa}</p>}

      <button
        onClick={senda}
        disabled={!password || sendir}
        className="w-full max-w-72 rounded-xl bg-white py-3 text-sm font-semibold text-brand disabled:opacity-50"
      >
        {sendir ? "Athuga…" : "Áfram"}
      </button>
    </div>
  );
}
