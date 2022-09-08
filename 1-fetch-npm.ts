import { getPackage, NpmPackage } from "./lib/npm.ts";

const pkgJson = await Deno.readTextFile(Deno.args[0]);
const pkgObj: NpmPackage = JSON.parse(pkgJson);
const deps = {
  ...pkgObj.dependencies,
  ...pkgObj.devDependencies,
};
const names = Object.keys(deps);

const pkgs = await Promise.all(names.map((p) => getPackage(p)));

export type Step1Result = {[name: string]: NpmPackage};

const result = pkgs.reduce((tmp: Step1Result, p) => {
  if (!p) {
    return tmp;
  }
  return {
    ...tmp,
    [p.name]: p,
  };
}, {});

console.log(JSON.stringify(result, undefined, "  "));
