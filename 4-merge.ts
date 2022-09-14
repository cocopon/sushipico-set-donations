import { parse } from "https://deno.land/std@0.155.0/flags/mod.ts";
import { Step2Result } from "./2-extract-npm.ts";
import { Step3Result } from "./3-fetch-github.ts";
import { GithubFunding } from "./lib/github.ts";
import { getScriptName } from "./lib/misc.ts";

interface Converter {
  type: string;
  convert: (value: string) => string;
}

const TYPE_TO_CONVERTER_MAP: Converter[] = [
  {
    type: "open_collective",
    convert: (v) => `https://opencollective.com/${v}`,
  },
  {
    type: "github",
    convert: (v) => `https://github.com/sponsors/${v}`,
  },
];

function getUrlsFromFunding(f: GithubFunding): string[] | null {
  return TYPE_TO_CONVERTER_MAP.reduce((result: string[] | null, converter) => {
    if (result) {
      return result;
    }
    const value = f[converter.type];
    if (!value) {
      return null;
    }
    return typeof value === "string"
      ? [converter.convert(value)]
      : value.map(converter.convert);
  }, null);
}

const args = parse(Deno.args);
const input2Path = args._[0];
const input3Path = args._[1];
const outputPath = args._[2];
if (
  typeof input2Path !== "string" || typeof input3Path !== "string" ||
  typeof outputPath !== "string"
) {
  const scriptName = getScriptName(import.meta.url);
  console.log(`deno run ${scriptName} result2.json result3.json out.tsv`);
  Deno.exit(0);
}

const json2 = await Deno.readTextFile(input2Path);
const result2: Step2Result = JSON.parse(json2);

const json3 = await Deno.readTextFile(input3Path);
const result3: Step3Result = JSON.parse(json3);

const names = Object.keys(result2);
const entries: [string, string][] = names.reduce(
  (tmp: [string, string][], name) => {
    const npmFunding = result2[name];
    if (npmFunding) {
      return [
        ...tmp,
        [name, npmFunding],
      ] as [string, string][];
    }
    const ghFunding = result3[name];
    if (ghFunding) {
      const urls = getUrlsFromFunding(ghFunding) ?? [];
      return [
        ...tmp,
        ...urls.map((url) => [name, url]),
      ] as [string, string][];
    }
    return tmp;
  },
  [],
);

const urlToNamesMap = entries.reduce(
  (tmp: { [url: string]: string[] }, entry) => {
    const [name, url] = entry;
    return {
      ...tmp,
      [url]: tmp[url] ? [...tmp[url], name] : [name],
    };
  },
  {},
);

const urls = Object.keys(urlToNamesMap);
const rows = urls.map((url) => [url, ...urlToNamesMap[url]]);
await Deno.writeTextFile(
  outputPath,
  rows.map((row) => row.join("\t")).join("\n"),
);
