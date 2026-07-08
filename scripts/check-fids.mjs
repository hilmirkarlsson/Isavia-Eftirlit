// Athugar hvort hýsillinn hafi netaðgang að FIDS API Keflavíkurflugvallar.
// Notkun: npm run check:fids
import https from "https";

const host = "www.kefairport.is";
const now = new Date();
const z = (d) => d.toISOString().slice(0, 19) + "Z";
const from = z(new Date(now.getTime() - 3 * 3600e3));
const to = z(new Date(now.getTime() + 24 * 3600e3));
const url = `https://${host}/api/sourceData?from=${from}&to=${to}`;

console.log(`Prófa tengingu við ${host} …`);
const req = https.get(url, { rejectUnauthorized: false, headers: { Accept: "application/json" } }, (res) => {
  let data = "";
  res.on("data", (c) => (data += c));
  res.on("end", () => {
    const code = res.statusCode;
    if (code >= 200 && code < 300) {
      let n = "?";
      try { const j = JSON.parse(data); n = Array.isArray(j) ? j.length : (j.value?.length ?? "?"); } catch {}
      console.log(`✅ Tókst (HTTP ${code}). Flug í svari: ${n}. Rauntímagögn ættu að virka.`);
      process.exit(0);
    }
    if (code === 403 && /allowlist/i.test(data)) {
      console.log(`⛔ Lokað (HTTP 403): ${host} er ekki á allowlist umhverfisins.`);
      console.log(`   Bættu því við „allowed domains“ í netstillingum (sjá README › Netaðgangur).`);
      process.exit(1);
    }
    console.log(`⚠️  HTTP ${code}. Svar: ${data.slice(0, 200)}`);
    process.exit(1);
  });
});
req.setTimeout(10000, () => req.destroy(new Error("Tímamörk")));
req.on("error", (e) => { console.log(`⛔ Villa: ${e.message}`); process.exit(1); });
