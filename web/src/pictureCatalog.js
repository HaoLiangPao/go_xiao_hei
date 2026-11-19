import { solarTerms } from "./solarTerms.js";
export const pictures = Object.fromEntries(solarTerms.map((term) => [term.id, term]));
