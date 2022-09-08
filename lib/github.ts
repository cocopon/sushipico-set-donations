import { parse } from "https://deno.land/std@0.154.0/encoding/yaml.ts";

export interface GithubPaths {
  owner: string;
  repo: string;
}

interface GithubRepo {
  default_branch: string;
}

export async function getRepo(paths: GithubPaths): Promise<GithubRepo> {
  const proc = Deno.run({
    cmd: [
      "gh",
      "api",
      "-H",
      "Accept: application/vnd.github+json",
      `/repos/${paths.owner}/${paths.repo}`,
    ],
    stderr: "piped",
    stdout: "piped",
  });
  const o = await proc.output();
  const json = new TextDecoder().decode(o);
  return JSON.parse(json) as GithubRepo;
}

export type GithubFunding = { [key: string]: string | string[] | null };

export async function getGithubFunding(
  paths: GithubPaths,
  branch: string,
): Promise<GithubFunding | null> {
  const res = await fetch(
    `https://raw.githubusercontent.com/${paths.owner}/${paths.repo}/${branch}/.github/FUNDING.yml`,
  );
  if (res.status !== 200) {
    return null;
  }

  const yaml = await res.text();
  return parse(yaml) as GithubFunding;
}
