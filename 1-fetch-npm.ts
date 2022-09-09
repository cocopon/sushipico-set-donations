import { parse } from "https://deno.land/std@0.155.0/flags/mod.ts";
import { getPackage, NpmPackage } from "./lib/npm.ts";

function getDependencies(pkg: NpmPackage): string[] {
  return Object.keys({
    ...pkg.dependencies,
    ...pkg.devDependencies,
  });
}

async function fetchPackages(names: string[]): Promise<NpmPackage[]> {
  return await names.reduce(async (tmp: Promise<NpmPackage[]>, name) => {
    const pkg = await getPackage(name);
    if (!pkg) {
      return await tmp;
    }
    return [
      ...await tmp,
      pkg,
    ];
  }, Promise.resolve([]));
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
const pkgJson = await Deno.readTextFile(String(args._[0]));
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

console.log(JSON.stringify(result, undefined, "  "));
