interface FundingEntry {
  type: string;
  url: string;
}

interface RepositoryEntry {
  type: string;
  url: string;
}

export interface NpmPackage {
  author: string;
  name: string;
  version: string;

  dependencies?: { [name: string]: string };
  devDependencies?: { [name: string]: string };
  funding?: string | FundingEntry | FundingEntry[];
  homepage?: string;
  repository?: string | RepositoryEntry;
}

export async function getPackage(name: string): Promise<NpmPackage | null> {
  const proc = Deno.run({
    cmd: ["npm", "view", name, "--json"],
    stderr: "piped",
    stdout: "piped",
  });
  const o = await proc.output();
  const json = new TextDecoder().decode(o);
  if (json === "") {
    return null;
  }

  const obj = JSON.parse(json);
  return obj
    ? {
      author: obj.author,
      name: obj.name,
      version: obj.version,

      dependencies: obj.dependencies,
      devDependencies: obj.devDependencies,
      funding: obj.funding,
      homepage: obj.homepage,
      repository: obj.repository,
    }
    : null;
}
