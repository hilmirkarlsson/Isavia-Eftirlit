// ESLint flat config (ESLint 9 / Next 16). `next lint` was removed in Next 16,
// svo við keyrum eslint beint (sjá "lint" scriptið) með flata stillingu sem
// eslint-config-next flytur nú út beint.
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const config = [
  { ignores: [".next/**", "node_modules/**", "public/**"] },
  ...nextCoreWebVitals,
  {
    // eslint-plugin-react-hooks@7 (fylgir Next 16) bætti við nýjum, ströngum
    // reglum sem gefa villu á starfhæfum mynstrum sem voru hrein áður
    // (t.d. ref.current = props við render, setState í init-effect). Höldum
    // þeim sýnilegum sem AÐVÖRUNUM svo þær loki ekki lint/CI – hreinsa í
    // sérstakri yfirferð, ekki inni í þessari uppfærslu.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/immutability": "warn",
    },
  },
];

export default config;
