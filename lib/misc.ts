export function getScriptName(url: string): string {
  const u = new URL("", url);
  const m = u.pathname.match(/\/([^/]+)$/);
  return m ? m[1] : "";
}

export async function serial<A, B>(
  items: A[],
  map: (item: A, index: number) => Promise<B>,
): Promise<B[]> {
  return await items.reduce(async (tmp: Promise<B[]>, item, index) => {
    return [
      ...await tmp,
      await map(item, index),
    ];
  }, Promise.resolve([]));
}
