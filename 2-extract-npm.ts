import { Step1Result } from "./1-fetch-npm.ts";
import { NpmPackage } from "./lib/npm.ts";

function extractFunding(p: NpmPackage): string | null {
  const f = p.funding;
  if (!f) {
    return null;
  }
  if (typeof f === "string") {
    return f;
  }
  if (Array.isArray(f)) {
    return f[0].url;
  }
  return f.url;
}

export type Step2Result = { [name: string]: string | null };

const json1 = await Deno.readTextFile(Deno.args[0]);
const result1: Step1Result = JSON.parse(json1);
const pkgs = Object.values(result1);
const result = pkgs.reduce((tmp, p) => {
  return {
    ...tmp,
    [p.name]: extractFunding(p),
  };
}, {});
console.log(JSON.stringify(result, undefined, "  "));
