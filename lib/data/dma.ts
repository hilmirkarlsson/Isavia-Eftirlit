// DMA stæði á flughlaði. Staðan (hreint / óhreint) er geymd í vafranum
// (localStorage) svo hægt sé að uppfæra hana í rauntíma á vaktinni.
//
// ATH: Heiti stæðanna hér eru sýnigögn. Breytið listanum svo hann
// passi við raunveruleg DMA stæði vallarins.

export type DmaStaedi = {
  id: string;
  /** Birtingarheiti stæðis, t.d. "DMA 1". */
  heiti: string;
  /** Svæði/röð til að hópa stæðum saman. */
  svaedi: string;
};

export type DmaStada = "hreint" | "ohreint";

export const DMA_STAEDI: DmaStaedi[] = [
  { id: "dma-1", heiti: "DMA 1", svaedi: "Norður" },
  { id: "dma-2", heiti: "DMA 2", svaedi: "Norður" },
  { id: "dma-3", heiti: "DMA 3", svaedi: "Norður" },
  { id: "dma-4", heiti: "DMA 4", svaedi: "Norður" },
  { id: "dma-5", heiti: "DMA 5", svaedi: "Mið" },
  { id: "dma-6", heiti: "DMA 6", svaedi: "Mið" },
  { id: "dma-7", heiti: "DMA 7", svaedi: "Mið" },
  { id: "dma-8", heiti: "DMA 8", svaedi: "Mið" },
  { id: "dma-9", heiti: "DMA 9", svaedi: "Suður" },
  { id: "dma-10", heiti: "DMA 10", svaedi: "Suður" },
  { id: "dma-11", heiti: "DMA 11", svaedi: "Suður" },
  { id: "dma-12", heiti: "DMA 12", svaedi: "Suður" },
];

export const DMA_SVAEDI = ["Norður", "Mið", "Suður"];
