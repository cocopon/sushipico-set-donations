import { parse } from "https://deno.land/std@0.155.0/flags/mod.ts";
import { Step1Result } from "./1-fetch-npm.ts";
import { getScriptName } from "./lib/misc.ts";
import { NpmPackage } from "./lib/npm.ts";

function extractFunding(p: NpmPackage): string | null {
  const f = p.funding;
  if (!f) {
    return null;
  }

  const candidates = typeof f === "string"
    ? [f]
    : "url" in f
    ? [f.url]
    : Array.isArray(f)
    ? f.map((item) => item.url)
    : null;
  const urls = candidates?.map((url) => {
    if (url.match(/^https:\/\/github\.com\/.+?\/.+?\?sponsor=1$/)) {
      // This can have multiple targets
      return null;
    }
    return url;
  });
  return urls?.filter((url) => url !== null)[0] ?? null;
}

export type Step2Result = { [name: string]: string | null };

const args = parse(Deno.args);
const inputPath = args._[0];
const outputPath = args._[1];
if (typeof inputPath !== "string" || typeof outputPath !== "string") {
  const scriptName = getScriptName(import.meta.url);
  console.log(`deno run ${scriptName} result1.json out.json`);
  Deno.exit(0);
}

const json1 = await Deno.readTextFile(inputPath);
const result1: Step1Result = JSON.parse(json1);
const pkgs = Object.values(result1);
const result = pkgs.reduce((tmp, p) => {
  return {
    ...tmp,
    [p.name]: extractFunding(p),
  };
}, {});

await Deno.writeTextFile(outputPath, JSON.stringify(result, undefined, "  "));
