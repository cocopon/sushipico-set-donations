import { getPackage, NpmPackage } from "./lib/npm.ts";

const json = await Deno.readTextFile(Deno.args[0]);
const obj: NpmPackage = JSON.parse(json);
const deps = {
  ...obj.dependencies,
  ...obj.devDependencies,
};
const names = Object.keys(deps);

const packages = await Promise.all(names.map((p) => getPackage(p)));

export type Step1Result = NpmPackage[];

console.log(JSON.stringify(packages, undefined, "  "));
