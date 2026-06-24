// Sameiginleg stilling fyrir flugalista sem sýna „næstu flug“ og leyfa að
// skruna upp til að sjá fyrri flug (Flug og DMA). Glugginn nær 12 klst fram
// í tímann; við hvert „skrun-upp“ tog birtast fyrri flug – fyrst 1 klst., svo
// +2 klst. í hvert sinn (0, 60, 180, 300 …), að hámarki 12 klst.

export const NAESTU_KLST = 12;

export function minuturAftur(skref: number): number {
  if (skref <= 0) return 0;
  return Math.min(60 + (skref - 1) * 120, NAESTU_KLST * 60);
}
