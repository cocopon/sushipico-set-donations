import { parse } from "https://deno.land/std@0.155.0/flags/mod.ts";
import { Step1Result } from "./1-fetch-npm.ts";
import { Step2Result } from "./2-extract-npm.ts";
import {
  getGithubFunding,
  getRepo,
  GithubFunding,
  GithubPaths,
} from "./lib/github.ts";
import { getScriptName, serial } from "./lib/misc.ts";
import { NpmPackage } from "./lib/npm.ts";

function extractPaths(url: string): GithubPaths | null {
  const patterns = [
    /github.com\/(.+?)\/(.+?)(\/|\.git|#.+|$)/,
    /^([^/]+?)\/([^/]+?)$/,
  ];

  return patterns.reduce((result: GithubPaths | null, pat) => {
    if (result) {
      return result;
    }
    const m = url.match(pat);
    return m
      ? {
        owner: m[1],
        repo: m[2],
      }
      : null;
  }, null);
}

function extractRepo(p: NpmPackage): GithubPaths | null {
  const candidates = [];

  if (p.repository) {
    if (typeof p.repository === "string") {
      candidates.push(p.repository);
    } else {
      candidates.push(p.repository.url);
    }
  }
  if (p.homepage) {
    candidates.push(p.homepage);
  }

  return candidates.map(extractPaths)[0] ?? null;
}

const args = parse(Deno.args);
const input1Path = args._[0];
const input2Path = args._[1];
const outputPath = args._[2];
if (
  typeof input1Path !== "string" || typeof input2Path !== "string" ||
  typeof outputPath !== "string"
) {
  const scriptName = getScriptName(import.meta.url);
  console.log(`deno run ${scriptName} result1.json result2.json out.json`);
  Deno.exit(0);
}

const json1 = await Deno.readTextFile(input1Path);
const result1: Step1Result = JSON.parse(json1);
const pkgs = Object.values(result1);

const json2 = await Deno.readTextFile(input2Path);
const npmFundings: Step2Result = JSON.parse(json2);

const noFundingPackages = pkgs.filter((p) => npmFundings[p.name] === null);
console.log("No funding ackages:");
console.log(noFundingPackages.map((p) => p.name).join(", "));

const nameToPathsMap: { [name: string]: GithubPaths | null } = noFundingPackages
  .reduce((tmp, p) => {
    return {
      ...tmp,
      [p.name]: extractRepo(p),
    };
  }, {});

export type Step3Result = { [name: string]: GithubFunding | null };

const names = Object.keys(nameToPathsMap);
const fundings = await serial(names, async (name: string, index: number) => {
  console.log(`Repository (${index}/${names.length}) ${name}:`);
  const paths = nameToPathsMap[name];
  if (!paths) {
    console.log("  Paths not found, skipped.");
    return null;
  }

  console.log(`  Paths found: ${[paths.owner, paths.repo].join("/")}`);
  console.log("  Fetching repository...");

  const repo = await getRepo(paths);
  console.log("    done.");
  if (!repo) {
    return null;
  }

  console.log("  Fetching repository funding...");
  const f = await getGithubFunding(paths, repo.default_branch);
  console.log("    done.");
  return f;
});

const result: Step3Result = fundings.reduce((tmp: Step3Result, f, i) => {
  return f === null ? tmp : {
    ...tmp,
    [names[i]]: f,
  };
}, {});

await Deno.writeTextFile(outputPath, JSON.stringify(result, undefined, "  "));
