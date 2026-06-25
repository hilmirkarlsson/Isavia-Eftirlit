"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { Skipulag } from "./skipulagsgerd";
import {
  SharedState,
  StateOp,
  SharedKey,
  tomtSharedState,
} from "./sharedState";
import { supabaseBrowser, realtimeConfigured } from "./supabase/browser";

// Re-flutt út hér svo eldri innflutningar (`import { VerkefniStada } from
// "@/lib/store"`) virki áfram.
export type { VerkefniStada, YtriAdilarGogn, SudurFaersla } from "./sharedState";
import type { VerkefniStada, SudurFaersla } from "./sharedState";

// ---------------------------------------------------------------------------
// Geymsla vaktarinnar.
//
// `notandi` (hver er skráður inn) er ALLTAF per tæki – geymt í localStorage.
// Allt annað ("shared") samstillist milli tækja gegnum Supabase ef hann er
// uppsettur. Ef Supabase er EKKI uppsettur fellur forritið aftur í gamla
// staðbundna haminn (allt í localStorage) og virkar nákvæmlega eins og áður.
// ---------------------------------------------------------------------------

type EftirlitState = SharedState & {
  notandi: string | null; // id starfsmanns – per tæki
};

const LYKILL_V5 = "eftirlit-kef-v5"; // staðbundinn hamur: allt ástandið
const LYKILL_NOTANDI = "eftirlit-kef-notandi"; // fjartengdur hamur: bara notandi
const LYKILL_CACHE = "eftirlit-kef-shared-cache"; // síðasta þekkta shared (offline)

const FLUSH_MS = 350; // safna saman skrifum í örstuttan glugga
// Sækingartíðni: ef rauntími (Supabase) er virkur er hann aðalleiðin og
// sæking er bara öryggisnet (30s). Án rauntíma (Vercel KV) er sæking
// aðalleiðin og þarf að vera tíðari. Útgáfunúmer heldur hverri sækingu ódýrri.
const POLL_MS = realtimeConfigured ? 30_000 : 6_000;

function idag(): string {
  return new Date().toISOString().slice(0, 10);
}

function tomt(): EftirlitState {
  return { ...tomtSharedState(idag()), notandi: null };
}

type Mode = "loading" | "local" | "remote";

type Ctx = {
  state: EftirlitState;
  hladid: boolean;
  setNotandi: (id: string | null) => void;
  setThrep: (verkefniId: string, threpId: string, gildi: boolean) => void;
  setVerkefniStada: (verkefniId: string, stada: VerkefniStada) => void;
  setYtriAdilarReitur: (verkefniId: string, reitur: string, gildi: boolean) => void;
  setYtriAdilarAthugasemd: (verkefniId: string, texti: string) => void;
  setDma: (id: string, stada: import("./data/dma").DmaStada) => void;
  setSudur: (id: string, stada: import("./data/sudur").SudurStada, af: string) => void;
  setSkipulag: (skipulag: Skipulag | null) => void;
  setVardstjoriId: (id: string | null) => void;
  setAdstodarvardstjoriId: (id: string | null) => void;
  addFylgd: (nafn: string) => void;
  setFylgdNafn: (fylgdId: string, nafn: string) => void;
  setFylgdTegund: (fylgdId: string, tegund: string) => void;
  addFylgdStarfsmadur: (fylgdId: string, starfsmadurId: string) => void;
  fjarlaegjaFylgdStarfsmadur: (fylgdId: string, starfsmadurId: string) => void;
  setFylgdStarfsmadurVerkefni: (fylgdId: string, starfsmadurId: string, verkefni: string) => void;
  setFylgdTimi: (fylgdId: string, timi: string) => void;
  setFylgdTilbuinn: (fylgdId: string, tilbuinn: string) => void;
  setFylgdLokid: (fylgdId: string, lokid: boolean) => void;
  setFylgdFlug: (fylgdId: string, flugId: string | null, flugnumer: string | null) => void;
  fjarlaegjaFylgd: (fylgdId: string) => void;
  addVakt: (nafn: string) => void;
  setVaktNafn: (vaktId: string, nafn: string) => void;
  fjarlaegjaVakt: (vaktId: string) => void;
  addVaktMedlimur: (vaktId: string, nafn: string) => void;
  fjarlaegjaVaktMedlimur: (vaktId: string, medlimurId: string) => void;
  seedVaktir: (vaktir: import("./data/vaktir").VaktSkraning[]) => void;
};

const EftirlitContext = createContext<Ctx | null>(null);

export function EftirlitProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EftirlitState>(tomt);
  const [hladid, setHladid] = useState(false);

  // Ref-speglun á ástandinu svo aðgerðir geti lesið nýjasta gildi samstundis
  // (án þess að bíða eftir endurteikningu) og reiknað næsta ástand örugglega.
  const stateRef = useRef(state);
  const modeRef = useRef<Mode>("loading");

  // Skrif-biðröð: lykill → aðgerð. Safnast saman og sendast í einu kalli.
  const pendingRef = useRef<Map<SharedKey, StateOp>>(new Map());
  const writingRef = useRef(false);
  const dirtyRef = useRef(false); // bárust fjarbreytingar á meðan við skrifuðum?
  const versionRef = useRef<number | null>(null); // síðasta þekkta útgáfa (KV)
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---- Hjálparföll ------------------------------------------------------

  function commit(next: EftirlitState) {
    stateRef.current = next;
    setState(next);
  }

  function applyServerState(shared: SharedState) {
    const s = stateRef.current;
    commit({ ...s, ...shared, notandi: s.notandi }); // notandi helst per tæki
    try {
      localStorage.setItem(LYKILL_CACHE, JSON.stringify(shared));
    } catch {
      /* ignore */
    }
  }

  function queue(op: StateOp) {
    if (modeRef.current !== "remote") return;
    const fyrir = pendingRef.current.get(op.key);
    if (fyrir && fyrir.op === "merge" && op.op === "merge") {
      // sameina grunnt – ólíkir lyklar haldast, sami lykill: nýrra vinnur
      fyrir.value = { ...fyrir.value, ...op.value };
    } else {
      pendingRef.current.set(op.key, op);
    }
    scheduleFlush();
  }

  const queueMerge = (key: SharedKey, value: Record<string, unknown>) =>
    queue({ key, op: "merge", value });
  const queueSet = (key: SharedKey, value: unknown) =>
    queue({ key, op: "set", value });

  function scheduleFlush() {
    if (modeRef.current !== "remote") return;
    if (flushTimer.current) return;
    flushTimer.current = setTimeout(flush, FLUSH_MS);
  }

  async function flush() {
    flushTimer.current = null;
    if (writingRef.current) return; // núverandi skrif klára og endurkalla
    const ops = [...pendingRef.current.values()];
    if (ops.length === 0) return;
    pendingRef.current.clear();
    writingRef.current = true;
    try {
      const res = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ops }),
      });
      if (!res.ok) throw new Error("write failed");
      // Uppfæra útgáfu okkar svo næsta sæking sæki ekki okkar eigin breytingu.
      const data = (await res.json().catch(() => null)) as { version?: number } | null;
      if (data && typeof data.version === "number") versionRef.current = data.version;
    } catch {
      // setja aftur í biðröð (ef lykli hefur ekki verið breytt síðan)
      for (const op of ops) {
        if (!pendingRef.current.has(op.key)) pendingRef.current.set(op.key, op);
      }
      scheduleFlush();
    } finally {
      writingRef.current = false;
      if (pendingRef.current.size > 0) scheduleFlush();
      else if (dirtyRef.current) {
        dirtyRef.current = false;
        void refetch();
      }
    }
  }

  async function refetch() {
    if (modeRef.current !== "remote") return;
    // ekki skrifa yfir staðbundnar breytingar sem eru enn á leiðinni
    if (writingRef.current || pendingRef.current.size > 0) {
      dirtyRef.current = true;
      return;
    }
    try {
      const v = versionRef.current;
      const slod = v != null ? `/api/state?v=${v}` : "/api/state";
      const res = await fetch(slod, { cache: "no-store" });
      const data = (await res.json()) as {
        configured: boolean;
        unchanged?: boolean;
        state?: SharedState;
        version?: number | null;
      };
      if (!data.configured) return;
      if (typeof data.version === "number") versionRef.current = data.version;
      if (data.unchanged) return; // ekkert breyttist – ódýr sæking
      if (data.state) applyServerState(data.state);
    } catch {
      /* ignore – höldum fyrri gögnum */
    }
  }

  function scheduleRefetch() {
    if (refetchTimer.current) return;
    refetchTimer.current = setTimeout(() => {
      refetchTimer.current = null;
      void refetch();
    }, 200);
  }

  // ---- Fyrsta hleðsla: greina ham og sækja ------------------------------

  useEffect(() => {
    let virkur = true;
    const localNotandi = (() => {
      try {
        return localStorage.getItem(LYKILL_NOTANDI);
      } catch {
        return null;
      }
    })();
    const cached = (() => {
      try {
        const raw = localStorage.getItem(LYKILL_CACHE);
        return raw ? (JSON.parse(raw) as SharedState) : null;
      } catch {
        return null;
      }
    })();

    // Sýna cache strax (ef til) svo ekkert blikki á meðan við sækjum.
    if (cached) commit({ ...cached, notandi: localNotandi });

    (async () => {
      try {
        const res = await fetch("/api/state", { cache: "no-store" });
        const data = (await res.json()) as {
          configured: boolean;
          state?: SharedState;
          version?: number | null;
        };
        if (!virkur) return;
        if (typeof data.version === "number") versionRef.current = data.version;
        if (data.configured && data.state) {
          modeRef.current = "remote";
          commit({ ...data.state, notandi: localNotandi });
          try {
            localStorage.setItem(LYKILL_CACHE, JSON.stringify(data.state));
          } catch {
            /* ignore */
          }
        } else {
          modeRef.current = "local";
          hladaStadbundid(localNotandi);
        }
      } catch {
        if (!virkur) return;
        // Engin nettenging: ef við eigum cache höldum við fjartengdum ham
        // (offline), annars staðbundinn hamur.
        modeRef.current = cached ? "remote" : "local";
        if (!cached) hladaStadbundid(localNotandi);
      } finally {
        if (virkur) setHladid(true);
      }
    })();

    return () => {
      virkur = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Staðbundinn hamur: les allt úr LYKILL_V5 (eins og áður), núllstillir
  // dagleg gögn á nýjum degi.
  function hladaStadbundid(localNotandi: string | null) {
    let next: EftirlitState = { ...tomt() };
    try {
      const raw = localStorage.getItem(LYKILL_V5);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<EftirlitState>;
        next = { ...next, ...parsed };
        if (parsed.dagur !== idag()) {
          next.threp = {};
          next.verkefniStada = {};
          next.ytriAdilar = {};
          next.dagur = idag();
        }
      }
    } catch {
      /* nota tómt */
    }
    if (localNotandi) next.notandi = localNotandi;
    commit(next);
  }

  // ---- Rauntími (realtime): push frá Supabase ---------------------------

  useEffect(() => {
    if (!hladid || modeRef.current !== "remote" || !realtimeConfigured) return;
    const sb = supabaseBrowser();
    if (!sb) return;
    const ch = sb
      .channel("shared_state_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shared_state" },
        () => scheduleRefetch()
      )
      .subscribe();
    return () => {
      void sb.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hladid]);

  // ---- Öryggis-sækja á 30s fresti (líka til að núllstilla á nýjum degi) --

  useEffect(() => {
    if (!hladid || modeRef.current !== "remote") return;
    const t = setInterval(() => void refetch(), POLL_MS);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hladid]);

  // ---- Staðbundin vistun -----------------------------------------------

  // Staðbundinn hamur: vista allt ástandið. (Fjartengdur hamur vistar ekkert
  // hér – ástandið býr á þjóninum; aðeins notandi er vistaður, sjá að neðan.)
  useEffect(() => {
    if (!hladid || modeRef.current !== "local") return;
    try {
      localStorage.setItem(LYKILL_V5, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, hladid]);

  // Fjartengdur hamur: vista bara notanda (per tæki).
  useEffect(() => {
    if (!hladid || modeRef.current !== "remote") return;
    try {
      if (state.notandi) localStorage.setItem(LYKILL_NOTANDI, state.notandi);
      else localStorage.removeItem(LYKILL_NOTANDI);
    } catch {
      /* ignore */
    }
  }, [state.notandi, hladid]);

  // ---- Aðgerðir ---------------------------------------------------------
  // Hver aðgerð: (1) uppfærir staðbundið ástand strax (bjartsýnt), (2) setur
  // skrif í biðröð fyrir þjóninn (gerir ekkert í staðbundnum ham).

  const ctx: Ctx = {
    state,
    hladid,

    setNotandi: (id) => {
      const s = stateRef.current;
      commit({ ...s, notandi: id });
      // notandi er aldrei sendur á þjóninn – bara per tæki
    },

    setThrep: (verkefniId, threpId, gildi) => {
      const s = stateRef.current;
      const nyttSvid = { ...(s.threp[verkefniId] ?? {}), [threpId]: gildi };
      commit({ ...s, threp: { ...s.threp, [verkefniId]: nyttSvid } });
      queueMerge("threp", { [verkefniId]: nyttSvid });
    },

    setVerkefniStada: (verkefniId, stada) => {
      const s = stateRef.current;
      commit({ ...s, verkefniStada: { ...s.verkefniStada, [verkefniId]: stada } });
      queueMerge("verkefniStada", { [verkefniId]: stada });
    },

    setYtriAdilarReitur: (verkefniId, reitur, gildi) => {
      const s = stateRef.current;
      const fyrir = s.ytriAdilar[verkefniId] ?? { reitir: {}, athugasemd: "" };
      const nytt = { ...fyrir, reitir: { ...fyrir.reitir, [reitur]: gildi } };
      commit({ ...s, ytriAdilar: { ...s.ytriAdilar, [verkefniId]: nytt } });
      queueMerge("ytriAdilar", { [verkefniId]: nytt });
    },

    setYtriAdilarAthugasemd: (verkefniId, texti) => {
      const s = stateRef.current;
      const fyrir = s.ytriAdilar[verkefniId] ?? { reitir: {}, athugasemd: "" };
      const nytt = { ...fyrir, athugasemd: texti };
      commit({ ...s, ytriAdilar: { ...s.ytriAdilar, [verkefniId]: nytt } });
      queueMerge("ytriAdilar", { [verkefniId]: nytt });
    },

    setDma: (id, stada) => {
      const s = stateRef.current;
      commit({ ...s, dma: { ...s.dma, [id]: stada } });
      queueMerge("dma", { [id]: stada });
    },

    setSudur: (id, stada, af) => {
      const s = stateRef.current;
      const faersla: SudurFaersla = { stada, af, kl: new Date().toISOString() };
      commit({ ...s, sudur: { ...s.sudur, [id]: faersla } });
      queueMerge("sudur", { [id]: faersla });
    },

    setSkipulag: (skipulag) => {
      const s = stateRef.current;
      commit({ ...s, skipulag });
      queueSet("skipulag", { skipulag });
    },

    setVardstjoriId: (id) => {
      const s = stateRef.current;
      commit({ ...s, vardstjoriId: id });
      queueMerge("settings", { vardstjoriId: id });
    },

    setAdstodarvardstjoriId: (id) => {
      const s = stateRef.current;
      commit({ ...s, adstodarvardstjoriId: id });
      queueMerge("settings", { adstodarvardstjoriId: id });
    },

    addFylgd: (nafn) => {
      const s = stateRef.current;
      const fylgdir = [
        ...s.fylgdir,
        { id: `fylgd-${Date.now()}`, nafn, tegund: "", starfsmenn: [], timi: "" },
      ];
      commit({ ...s, fylgdir });
      queueSet("fylgdir", fylgdir);
    },

    setFylgdNafn: (fylgdId, nafn) => {
      const s = stateRef.current;
      const fylgdir = s.fylgdir.map((f) => (f.id === fylgdId ? { ...f, nafn } : f));
      commit({ ...s, fylgdir });
      queueSet("fylgdir", fylgdir);
    },

    setFylgdTegund: (fylgdId, tegund) => {
      const s = stateRef.current;
      const fylgdir = s.fylgdir.map((f) => (f.id === fylgdId ? { ...f, tegund } : f));
      commit({ ...s, fylgdir });
      queueSet("fylgdir", fylgdir);
    },

    addFylgdStarfsmadur: (fylgdId, starfsmadurId) => {
      const s = stateRef.current;
      const fylgdir = s.fylgdir.map((f) =>
        f.id === fylgdId && !f.starfsmenn.some((sm) => sm.starfsmadurId === starfsmadurId)
          ? { ...f, starfsmenn: [...f.starfsmenn, { starfsmadurId, verkefni: "" }] }
          : f
      );
      commit({ ...s, fylgdir });
      queueSet("fylgdir", fylgdir);
    },

    fjarlaegjaFylgdStarfsmadur: (fylgdId, starfsmadurId) => {
      const s = stateRef.current;
      const fylgdir = s.fylgdir.map((f) =>
        f.id === fylgdId
          ? { ...f, starfsmenn: f.starfsmenn.filter((sm) => sm.starfsmadurId !== starfsmadurId) }
          : f
      );
      commit({ ...s, fylgdir });
      queueSet("fylgdir", fylgdir);
    },

    setFylgdStarfsmadurVerkefni: (fylgdId, starfsmadurId, verkefni) => {
      const s = stateRef.current;
      const fylgdir = s.fylgdir.map((f) =>
        f.id === fylgdId
          ? {
              ...f,
              starfsmenn: f.starfsmenn.map((sm) =>
                sm.starfsmadurId === starfsmadurId ? { ...sm, verkefni } : sm
              ),
            }
          : f
      );
      commit({ ...s, fylgdir });
      queueSet("fylgdir", fylgdir);
    },

    setFylgdTimi: (fylgdId, timi) => {
      const s = stateRef.current;
      const fylgdir = s.fylgdir.map((f) => (f.id === fylgdId ? { ...f, timi } : f));
      commit({ ...s, fylgdir });
      queueSet("fylgdir", fylgdir);
    },

    setFylgdTilbuinn: (fylgdId, tilbuinn) => {
      const s = stateRef.current;
      const fylgdir = s.fylgdir.map((f) => (f.id === fylgdId ? { ...f, tilbuinn } : f));
      commit({ ...s, fylgdir });
      queueSet("fylgdir", fylgdir);
    },

    setFylgdLokid: (fylgdId, lokid) => {
      const s = stateRef.current;
      const fylgdir = s.fylgdir.map((f) => (f.id === fylgdId ? { ...f, lokid } : f));
      commit({ ...s, fylgdir });
      queueSet("fylgdir", fylgdir);
    },

    setFylgdFlug: (fylgdId, flugId, flugnumer) => {
      const s = stateRef.current;
      const fylgdir = s.fylgdir.map((f) =>
        f.id === fylgdId
          ? { ...f, flugId: flugId ?? undefined, flugnumer: flugnumer ?? undefined }
          : f
      );
      commit({ ...s, fylgdir });
      queueSet("fylgdir", fylgdir);
    },

    fjarlaegjaFylgd: (fylgdId) => {
      const s = stateRef.current;
      const fylgdir = s.fylgdir.filter((f) => f.id !== fylgdId);
      commit({ ...s, fylgdir });
      queueSet("fylgdir", fylgdir);
    },

    addVakt: (nafn) => {
      const s = stateRef.current;
      const vaktir = [
        ...s.vaktir,
        { id: `vakt-${Date.now()}`, nafn, medlimir: [] },
      ];
      commit({ ...s, vaktir });
      queueSet("vaktir", vaktir);
    },

    setVaktNafn: (vaktId, nafn) => {
      const s = stateRef.current;
      const vaktir = s.vaktir.map((v) => (v.id === vaktId ? { ...v, nafn } : v));
      commit({ ...s, vaktir });
      queueSet("vaktir", vaktir);
    },

    fjarlaegjaVakt: (vaktId) => {
      const s = stateRef.current;
      const vaktir = s.vaktir.filter((v) => v.id !== vaktId);
      commit({ ...s, vaktir });
      queueSet("vaktir", vaktir);
    },

    addVaktMedlimur: (vaktId, nafn) => {
      const s = stateRef.current;
      const vaktir = s.vaktir.map((v) =>
        v.id === vaktId
          ? { ...v, medlimir: [...v.medlimir, { id: `m-${Date.now()}`, nafn }] }
          : v
      );
      commit({ ...s, vaktir });
      queueSet("vaktir", vaktir);
    },

    fjarlaegjaVaktMedlimur: (vaktId, medlimurId) => {
      const s = stateRef.current;
      const vaktir = s.vaktir.map((v) =>
        v.id === vaktId
          ? { ...v, medlimir: v.medlimir.filter((m) => m.id !== medlimurId) }
          : v
      );
      commit({ ...s, vaktir });
      queueSet("vaktir", vaktir);
    },

    seedVaktir: (vaktir) => {
      const s = stateRef.current;
      if (s.vaktir.length > 0) return; // ekki yfirskrifa ef til
      commit({ ...s, vaktir });
      queueSet("vaktir", vaktir);
    },
  };

  return <EftirlitContext.Provider value={ctx}>{children}</EftirlitContext.Provider>;
}

export function useEftirlit(): Ctx {
  const ctx = useContext(EftirlitContext);
  if (!ctx) throw new Error("useEftirlit verður að nota innan EftirlitProvider");
  return ctx;
}
