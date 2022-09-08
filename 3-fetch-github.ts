import { Step1Result } from "./1-fetch-npm.ts";
import { Step2Result } from "./2-extract-npm.ts";
import {
  getGithubFunding,
  getRepo,
  GithubFunding,
  GithubPaths,
} from "./lib/github.ts";
import { NpmPackage } from "./lib/npm.ts";

function extractPaths(url: string): GithubPaths | null {
  const patterns = [/github.com\/(.+?)\/(.+?)(\/|\.git|#.+|$)/];

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
    candidates.push(p.repository.url);
  }
  if (p.homepage) {
    candidates.push(p.homepage);
  }

  return candidates.map(extractPaths)[0] ?? null;
}

const depsJson = await Deno.readTextFile(Deno.args[0]);
const deps: Step1Result = JSON.parse(depsJson);

const npmFundingsJson = await Deno.readTextFile(Deno.args[1]);
const npmFundings: Step2Result = JSON.parse(npmFundingsJson);

const noFundingPackages = deps.filter((p) => npmFundings[p.name] === null);

const nameToPathsMap: { [name: string]: GithubPaths | null } = noFundingPackages
  .reduce((tmp, p) => {
    return {
      ...tmp,
      [p.name]: extractRepo(p),
    };
  }, {});

export type Step3Result = { [name: string]: GithubFunding | null };

const result: Step3Result = {};
await Promise.all(
  Object.keys(nameToPathsMap).map(async (name) => {
    const paths = nameToPathsMap[name];
    if (!paths) {
      return null;
    }
    const repo = await getRepo(paths);
    result[name] = await getGithubFunding(paths, repo.default_branch);
  }),
);
console.log(JSON.stringify(result, undefined, "  "));
