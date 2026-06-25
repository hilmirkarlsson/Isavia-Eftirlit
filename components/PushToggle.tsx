"use client";

import { useEffect, useState } from "react";
import { useEftirlit } from "@/lib/store";
import { haptik } from "@/lib/haptics";
import { PushStada, pushStada, kveiktiAPush, slokktiAPush } from "@/lib/pushClient";
import { IconBell, IconBellOff } from "@/components/Icons";

// Hnappur í valmynd til að kveikja/slökkva á ýtitilkynningum fyrir þetta tæki.
// Felur sig ef vafrinn styður ekki push eða VAPID-lyklar eru ekki uppsettir.
export default function PushToggle({ onLokun }: { onLokun: () => void }) {
  const { state } = useEftirlit();
  const [stada, setStada] = useState<PushStada>("ekki-stutt");
  const [vinn, setVinn] = useState(false);

  useEffect(() => {
    pushStada().then(setStada).catch(() => setStada("ekki-stutt"));
  }, []);

  if (stada === "ekki-stutt" || stada === "ekki-uppsett") return null;

  const a = stada === "a";

  const smella = async () => {
    if (vinn) return;
    setVinn(true);
    haptik();
    try {
      const ny = a ? await slokktiAPush() : await kveiktiAPush(state.notandi);
      setStada(ny);
      if (!a && ny === "a") onLokun();
    } finally {
      setVinn(false);
    }
  };

  return (
    <button
      onClick={smella}
      disabled={vinn}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-slate-700 transition active:bg-slate-50 disabled:opacity-50"
    >
      <span className={a ? "text-brand" : "text-slate-400"}>{a ? <IconBell /> : <IconBellOff />}</span>
      {vinn ? "Augnablik…" : a ? "Slökkva á tilkynningum" : "Kveikja á tilkynningum"}
    </button>
  );
}
