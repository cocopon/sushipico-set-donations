import { NpmPackage } from "./lib/npm.ts";

const json = await Deno.readTextFile(Deno.args[0]);
const packages: NpmPackage[] = JSON.parse(json);

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

const result = packages.reduce((tmp, p) => {
  return {
    ...tmp,
    [p.name]: extractFunding(p),
  };
}, {});
console.log(JSON.stringify(result, undefined, "  "));
