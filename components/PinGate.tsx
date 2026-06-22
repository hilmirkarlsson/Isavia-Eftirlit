"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

const LYKILL = "eftirlit-kef-pin-ok";

// Einfalt PIN-hlið fyrir allt forritið – PIN-ið er athugað á þjóninum
// (/api/pin) svo það birtist hvergi í vafrakóða. Ef EFTIRLIT_PIN er ekki
// stillt á þjóninum er hliðið gegnsætt og krefst ekki PIN.
export default function PinGate({ children }: { children: ReactNode }) {
  const [stada, setStada] = useState<"athuga" | "opid" | "lokad">("athuga");
  const [pin, setPin] = useState("");
  const [villa, setVilla] = useState(false);
  const [sendir, setSendir] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(LYKILL) === "1") {
      setStada("opid");
      return;
    }
    fetch("/api/pin")
      .then((res) => res.json())
      .then((data: { krafist: boolean }) => setStada(data.krafist ? "lokad" : "opid"))
      .catch(() => setStada("opid")); // án nettengingar – ekki læsa notanda úti
  }, []);

  const senda = async () => {
    setSendir(true);
    setVilla(false);
    try {
      const res = await fetch("/api/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = (await res.json()) as { ok: boolean };
      if (data.ok) {
        localStorage.setItem(LYKILL, "1");
        setStada("opid");
      } else {
        setVilla(true);
        setPin("");
      }
    } catch {
      setVilla(true);
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
      <p className="mb-6 text-sm text-white/80">Sláðu inn PIN til að halda áfram</p>

      <input
        type="password"
        inputMode="numeric"
        autoFocus
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && pin && senda()}
        className="mb-3 w-40 rounded-xl border-0 px-4 py-3 text-center text-2xl tracking-widest text-slate-900"
        placeholder="••••"
      />

      {villa && <p className="mb-3 text-sm text-red-200">Rangt PIN – reyndu aftur</p>}

      <button
        onClick={senda}
        disabled={!pin || sendir}
        className="w-40 rounded-xl bg-white py-3 text-sm font-semibold text-brand disabled:opacity-50"
      >
        {sendir ? "Athuga…" : "Áfram"}
      </button>
    </div>
  );
}
