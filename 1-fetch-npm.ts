import { parse } from "https://deno.land/std@0.155.0/flags/mod.ts";
import { getScriptName, serial } from "./lib/misc.ts";
import { getPackage, NpmPackage } from "./lib/npm.ts";

function getDependencies(pkg: NpmPackage): string[] {
  return Object.keys({
    ...pkg.dependencies,
    ...pkg.devDependencies,
  });
}

async function fetchPackages(names: string[]): Promise<NpmPackage[]> {
  const result = await serial(names, async (name: string, index: number) => {
    console.log(`Fetching package (${index + 1}/${names.length}) ${name}...`);

    const p = await getPackage(name);
    console.log("done.");
    return p;
  });
  return result.filter((p) => p !== null) as NpmPackage[];
}

async function fetchSubpackages(pkgs: NpmPackage[]) {
  const subnames = Array.from(pkgs.reduce((tmp: Set<string>, p) => {
    if (!p) {
      return tmp;
    }
    return new Set([
      ...tmp,
      ...getDependencies(p),
    ]);
  }, new Set<string>()));
  return await fetchPackages(subnames);
}

const args = parse(Deno.args);
const inputPath = args._[0];
const outputPath = args._[1];
if (typeof inputPath !== "string" || typeof outputPath !== "string") {
  const scriptName = getScriptName(import.meta.url);
  console.log(`deno run ${scriptName} package.json out.json [--deep]`);
  Deno.exit(0);
}

const pkgJson = await Deno.readTextFile(inputPath);
const pkgObj: NpmPackage = JSON.parse(pkgJson);
const names = getDependencies(pkgObj);
const pkgs = await fetchPackages(names);
const subpkgs = args.deep ? await fetchSubpackages(pkgs) : [];

export type Step1Result = { [name: string]: NpmPackage };

const result: Step1Result = [
  ...pkgs,
  ...subpkgs,
].reduce((tmp: Step1Result, p) => {
  if (!p) {
    return tmp;
  }
  return {
    ...tmp,
    [p.name]: p,
  };
}, {});

await Deno.writeTextFile(
  String(args._[1]),
  JSON.stringify(result, undefined, "  "),
);
