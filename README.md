# sushipico-set-donations
Small scripts that extracts a donation list from package.json.

```
% deno run 1-fetch-npm.ts    package.json 1.json --deep
% deno run 2-extract-npm.ts  1.json       2.json
% deno run 3-fetch-github.ts 1.json       2.json 3.json
% deno run 4-merge.ts        2.json       3.json donations.tsv
```
