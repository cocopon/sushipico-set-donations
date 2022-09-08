import { Step2Result } from "./2-extract-npm.ts";
import { Step3Result } from "./3-fetch-github.ts";
import { GithubFunding } from "./lib/github.ts";

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

const json2 = await Deno.readTextFile(Deno.args[0]);
const result2: Step2Result = JSON.parse(json2);

const json3 = await Deno.readTextFile(Deno.args[1]);
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
console.log(rows.map((row) => row.join("\t")).join("\n"));
